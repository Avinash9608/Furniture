#!/bin/bash

# Print current environment
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies with dev dependencies
echo "Installing client dependencies..."
cd client
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/plugin-transform-runtime terser
npm install --include=dev

# Create a production .env file for the client
echo "Creating production environment file for client..."
cat > .env.production << EOL
VITE_API_URL=/api
VITE_NODE_ENV=production
EOL

# Create .babelrc file
echo "Creating .babelrc file..."
cat > .babelrc << EOL

# Create babel.config.js
echo "Creating babel.config.js..."
cat > babel.config.js << EOL
module.exports = {
  presets: [
    ["@babel/preset-env", {
      "targets": {
        "browsers": [">0.25%", "not ie 11", "not op_mini all"]
      },
      "modules": false
    }],
    ["@babel/preset-react", {
      "runtime": "classic",
      "pragma": "React.createElement",
      "pragmaFrag": "React.Fragment"
    }]
  ],
  plugins: []
};
EOL
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": [">0.25%", "not ie 11", "not op_mini all"]
      }
    }],
    ["@babel/preset-react", {
      "runtime": "classic",
      "pragma": "React.createElement",
      "pragmaFrag": "React.Fragment"
    }]
  ]
}
EOL

# Update main.jsx to make React global
echo "Updating main.jsx..."
MAIN_JSX_PATH="src/main.jsx"
if ! grep -q "window.React = React" "$MAIN_JSX_PATH"; then
  sed -i 's/import "\.\/index\.css";/import "\.\/index\.css";\n\n\/\/ Make React available globally for JSX transformation\nwindow.React = React;/' "$MAIN_JSX_PATH"
fi

# Update vite.config.js for production
echo "Creating production-ready vite.config.js..."
cat > vite.config.js << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      // Force classic JSX runtime for production
      jsxRuntime: 'classic',
      jsxImportSource: undefined,
      // Use React.createElement instead of _jsx
      babel: {
        plugins: [],
        presets: [
          ['@babel/preset-react', {
            runtime: 'classic',
            pragma: 'React.createElement',
            pragmaFrag: 'React.Fragment'
          }]
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
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
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
        format: 'es',
        manualChunks: undefined,
      },
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
EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic',
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
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: command === "serve",
    minify: "terser",
    rollupOptions: {
      output: {
        format: 'es',
      },
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
EOL
import { defineConfig } from 'vite';
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
        rewrite: (path) => path.replace(/^\/api/, "/api"),
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
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
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
}));
EOL

# Build client with production mode
echo "Building client in production mode..."
npm run build
cd ..

# Create a production .env file for the server
echo "Creating production environment file for server..."
cat > .env << EOL
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://avinashmadhukar4:wwtcgIAvcC8WNAPY@cluster0.dpeo7nm.mongodb.net/shyam_furnitures?retryWrites=true&w=majority
JWT_SECRET=dG8sY2FuSSUo*22dk@fj9s8
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
BYPASS_AUTH=false
CLOUDINARY_CLOUD_NAME=dfdtdqumn
CLOUDINARY_API_KEY=759566998672355
CLOUDINARY_API_SECRET=o8IRXq5nkO3L9XnvDMNhM1bxyiY
EOL

# Print success message
echo "Build completed successfully!"
