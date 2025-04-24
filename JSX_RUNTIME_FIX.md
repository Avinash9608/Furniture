# JSX Runtime Fix for Render Deployment

This guide provides specific instructions for fixing JSX runtime issues when deploying to Render.

## Common JSX Runtime Errors

When deploying a React application built with Vite to Render, you might encounter these errors in the browser console:

- `Uncaught TypeError: s.jsxDEV is not a function`
- `Uncaught TypeError: i.jsxDEV is not a function`
- `require is not defined`

These errors occur due to incompatibilities between development and production JSX transformations.

## Step-by-Step Fix

### 1. Update vite.config.js

Replace your vite.config.js with this ES modules version that uses the classic JSX runtime:

```js
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
```

### 2. Create babel.config.js

Create a babel.config.js file in your client directory:

```js
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
```

### 3. Update main.jsx

Make sure React is available globally by adding this to your main.jsx file:

```jsx
import React from "react";
// Make React available globally for JSX transformation
window.React = React;

// Rest of your imports and code...
```

### 4. Install Required Dependencies

Install the necessary Babel dependencies:

```bash
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react terser
```

### 5. Update render-deploy.sh

If you're using a render-deploy.sh script, make sure it includes the correct configuration:

```bash
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
  // Rest of your configuration...
}));
EOL

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
```

### 6. Test Locally Before Deploying

Always test your production build locally before deploying:

```bash
# Build the client
npm run build

# Serve the dist directory
npx serve dist
```

## Why This Works

This solution works because:

1. It forces the use of the classic JSX runtime (`React.createElement`) instead of the automatic runtime (`_jsx` functions)
2. It ensures React is available globally for JSX transformation
3. It configures Babel to use the classic JSX transformation
4. It sets the output format to ES modules to avoid CommonJS issues in the browser

## Deployment to Render

After making these changes:

1. Commit and push your changes to your repository
2. Deploy to Render using the render-build script
3. Monitor the logs for any issues

If you still encounter issues, check the browser console for specific error messages and adjust your configuration accordingly.
