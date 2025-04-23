const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

// https://vitejs.dev/config/
module.exports = defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      // Explicitly set the JSX runtime
      jsxRuntime: "automatic",
      // Force development mode in development, production mode in production
      jsxImportSource: "react",
      babel: {
        // Add any babel options here if needed
        plugins: [],
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
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
