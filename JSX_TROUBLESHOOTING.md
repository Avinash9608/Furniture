# JSX Runtime Troubleshooting Guide

This guide provides solutions for common JSX runtime issues in React applications built with Vite.

## Common Issues

### 1. "s.jsxDEV is not a function" Error

This error typically occurs when there's a mismatch between development and production JSX transformations. Here are the steps to fix it:

#### Solution 1: Update Vite React Plugin Configuration

In your `vite.config.js` file, explicitly configure the JSX runtime:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [],
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  // other configuration...
});
```

#### Solution 2: Add a .babelrc File

Create a `.babelrc` file in your project root:

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

#### Solution 3: Update package.json Build Script

Ensure your build script explicitly sets the production mode:

```json
"scripts": {
  "build": "vite build --mode production"
}
```

#### Solution 4: Check React Imports

Make sure your main entry file (e.g., `main.jsx`) has the correct React imports:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
// other imports...

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 2. "React is not defined" Error

This error occurs when React is not properly imported in your components.

#### Solution:

Make sure every component file that uses JSX has the React import:

```jsx
import React from 'react';
```

Or configure your build tools to automatically import React when JSX is used.

### 3. "Cannot read properties of undefined (reading 'createElement')" Error

This error typically occurs when there's an issue with the React runtime.

#### Solution:

1. Check your React version and ensure it's compatible with your build tools
2. Make sure React is properly imported in your entry file
3. Update your Vite configuration to use the correct JSX runtime

## Deployment Checklist

When deploying a React application built with Vite, follow these steps to avoid JSX runtime issues:

1. **Update Vite Configuration**: Ensure your `vite.config.js` file is properly configured for production
2. **Check Environment Variables**: Make sure all required environment variables are set for production
3. **Build in Production Mode**: Use `--mode production` when building your application
4. **Test the Production Build Locally**: Run `npm run preview` to test the production build before deploying
5. **Check Bundle Size**: Use tools like `vite-bundle-visualizer` to check your bundle size and optimize if needed

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/build.html)
- [React Documentation on JSX](https://reactjs.org/docs/jsx-in-depth.html)
- [Babel Documentation on React Preset](https://babeljs.io/docs/en/babel-preset-react)
