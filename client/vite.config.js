import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      jsxRuntime: "classic",
      jsxImportSource: undefined,
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
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "date-fns"],
        },
      },
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
