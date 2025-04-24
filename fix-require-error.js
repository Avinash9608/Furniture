const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Function to execute commands and log output
function runCommand(command, cwd = process.cwd()) {
  console.log(`\n> Running command: ${command}`);
  try {
    const output = execSync(command, {
      cwd,
      stdio: "inherit",
    });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log("=== Starting fix for require error ===");

    // Step 1: Update vite.config.js to use ES modules
    console.log("\n=== Updating vite.config.js to use ES modules ===");
    const viteConfigContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      // Use automatic JSX runtime for better compatibility
      jsxRuntime: 'automatic',
      babel: {
        plugins: [],
        babelrc: true,
        configFile: false,
      },
    }),
  ],
  server: {
    hmr: {
      overlay: false, // Disables the error overlay
    },
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\\/api/, "/api"),
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: command === "serve", // Only generate sourcemaps in development
    minify: "terser", // Use terser for better compatibility
    terserOptions: {
      compress: {
        // Disable console.* in production
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        // Ensure proper code splitting
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
        },
        // Ensure proper format
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Define environment variables for client
  define: {
    // Make sure environment variables are properly stringified
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));`;

    fs.writeFileSync(path.join("client", "vite.config.js"), viteConfigContent);
    console.log("Updated vite.config.js");

    // Step 2: Create .babelrc file
    console.log("\n=== Creating .babelrc file ===");
    const babelrcContent = `{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": [">0.25%", "not ie 11", "not op_mini all"]
      },
      "modules": false
    }],
    ["@babel/preset-react", {
      "runtime": "automatic"
    }]
  ],
  "plugins": []
}`;
    fs.writeFileSync(path.join("client", ".babelrc"), babelrcContent);
    console.log("Created .babelrc");

    // Step 3: Install necessary dependencies
    console.log("\n=== Installing necessary dependencies ===");
    runCommand(
      "npm install --save-dev @babel/core @babel/preset-env @babel/preset-react terser",
      path.join(process.cwd(), "client")
    );

    // Step 4: Build the client
    console.log("\n=== Building client ===");
    runCommand("npm run build", path.join(process.cwd(), "client"));

    console.log("\n=== Fix completed successfully! ===");
  } catch (error) {
    console.error("\n❌ Fix failed!");
    process.exit(1);
  }
}

// Run the main function
main();
