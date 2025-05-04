import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    // Custom plugin to check for react-toastify
    {
      name: "check-dependencies",
      buildStart() {
        try {
          const packageJsonPath = path.resolve(__dirname, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(
              fs.readFileSync(packageJsonPath, "utf8")
            );

            // Check if react-toastify is in dependencies
            if (
              packageJson.dependencies &&
              packageJson.dependencies["react-toastify"]
            ) {
              console.warn(
                "Warning: react-toastify found in dependencies. This may cause build issues."
              );

              // Remove it from dependencies
              delete packageJson.dependencies["react-toastify"];
              fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJson, null, 2)
              );
              console.log("Removed react-toastify from package.json");
            }
          }
        } catch (error) {
          console.error("Error checking package.json:", error);
        }
      },
    },
    react({
      // Force classic JSX runtime for production
      jsxRuntime: "classic",
      jsxImportSource: undefined,
      // Use React.createElement instead of _jsx
      babel: {
        plugins: [],
        presets: [
          [
            "@babel/preset-react",
            {
              runtime: "classic",
              pragma: "React.createElement",
              pragmaFrag: "React.Fragment",
            },
          ],
        ],
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  server: {
    hmr: {
      overlay: false,
    },
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        format: "es",
        manualChunks: {
          // Group vendor dependencies
          vendor: ["react", "react-dom", "react-router-dom"],
          // Group UI libraries
          ui: ["framer-motion", "date-fns"],
        },
      },
      // Explicitly mark problematic modules as external
      external: [],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
