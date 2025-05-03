import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
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
        manualChunks: undefined,
      },
      // Explicitly mark react-toastify as external to prevent build errors
      external: ["react-toastify"],
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
