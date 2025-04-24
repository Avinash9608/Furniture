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

# Fix API endpoints in client code
echo "Fixing API endpoints in client code..."
node -e "
const fs = require('fs');
const path = require('path');

// Path to the API file
const apiFilePath = path.join(__dirname, 'client', 'src', 'utils', 'api.js');

// Read the file
console.log(\`Reading file: \${apiFilePath}\`);
let content = fs.readFileSync(apiFilePath, 'utf8');

// Check if the baseURL already includes /api
const baseUrlIncludesApi = content.includes('return \"/api\"') || 
                          content.includes('return \"http://localhost:5000/api\"');

console.log(\`Base URL includes /api: \${baseUrlIncludesApi}\`);

if (baseUrlIncludesApi) {
  // Replace all occurrences of /api/ in API endpoints
  console.log('Removing /api prefix from all endpoints...');
  
  // Define patterns to replace
  const patterns = [
    { from: 'api.post(\"/api/', to: 'api.post(\"/' },
    { from: 'api.get(\"/api/', to: 'api.get(\"/' },
    { from: 'api.put(\"/api/', to: 'api.put(\"/' },
    { from: 'api.delete(\"/api/', to: 'api.delete(\"/' },
    { from: 'api.patch(\"/api/', to: 'api.patch(\"/' },
    { from: 'await api.post(\"/api/', to: 'await api.post(\"/' },
    { from: 'await api.get(\"/api/', to: 'await api.get(\"/' },
    { from: 'await api.put(\"/api/', to: 'await api.put(\"/' },
    { from: 'await api.delete(\"/api/', to: 'await api.delete(\"/' },
    { from: 'await api.patch(\"/api/', to: 'await api.patch(\"/' },
    { from: 'return api.post(\"/api/', to: 'return api.post(\"/' },
    { from: 'return api.get(\"/api/', to: 'return api.get(\"/' },
    { from: 'return api.put(\"/api/', to: 'return api.put(\"/' },
    { from: 'return api.delete(\"/api/', to: 'return api.delete(\"/' },
    { from: 'return api.patch(\"/api/', to: 'return api.patch(\"/' },
    { from: 'return await api.post(\"/api/', to: 'return await api.post(\"/' },
    { from: 'return await api.get(\"/api/', to: 'return await api.get(\"/' },
    { from: 'return await api.put(\"/api/', to: 'return await api.put(\"/' },
    { from: 'return await api.delete(\"/api/', to: 'return await api.delete(\"/' },
    { from: 'return await api.patch(\"/api/', to: 'return await api.patch(\"/' },
  ];
  
  // Apply all replacements
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.from.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g');
    const count = (content.match(regex) || []).length;
    content = content.replace(regex, pattern.to);
    console.log(\`Replaced \${count} occurrences of \"\${pattern.from}\" with \"\${pattern.to}\"\`);
  });
  
  // Handle template literals with backticks
  const templatePatterns = [
    { from: 'api.get(\`/api/', to: 'api.get(\`/' },
    { from: 'api.post(\`/api/', to: 'api.post(\`/' },
    { from: 'api.put(\`/api/', to: 'api.put(\`/' },
    { from: 'api.delete(\`/api/', to: 'api.delete(\`/' },
    { from: 'api.patch(\`/api/', to: 'api.patch(\`/' },
    { from: 'await api.get(\`/api/', to: 'await api.get(\`/' },
    { from: 'await api.post(\`/api/', to: 'await api.post(\`/' },
    { from: 'await api.put(\`/api/', to: 'await api.put(\`/' },
    { from: 'await api.delete(\`/api/', to: 'await api.delete(\`/' },
    { from: 'await api.patch(\`/api/', to: 'await api.patch(\`/' },
    { from: 'return api.get(\`/api/', to: 'return api.get(\`/' },
    { from: 'return api.post(\`/api/', to: 'return api.post(\`/' },
    { from: 'return api.put(\`/api/', to: 'return api.put(\`/' },
    { from: 'return api.delete(\`/api/', to: 'return api.delete(\`/' },
    { from: 'return api.patch(\`/api/', to: 'return api.patch(\`/' },
    { from: 'return await api.get(\`/api/', to: 'return await api.get(\`/' },
    { from: 'return await api.post(\`/api/', to: 'return await api.post(\`/' },
    { from: 'return await api.put(\`/api/', to: 'return await api.put(\`/' },
    { from: 'return await api.delete(\`/api/', to: 'return await api.delete(\`/' },
    { from: 'return await api.patch(\`/api/', to: 'return await api.patch(\`/' },
  ];
  
  // Apply all template literal replacements
  templatePatterns.forEach(pattern => {
    const regex = new RegExp(pattern.from.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g');
    const count = (content.match(regex) || []).length;
    content = content.replace(regex, pattern.to);
    console.log(\`Replaced \${count} occurrences of \"\${pattern.from}\" with \"\${pattern.to}\"\`);
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(apiFilePath, content);
  console.log(\`Updated file: \${apiFilePath}\`);
  
  console.log('All API endpoints have been updated successfully!');
} else {
  console.log('Base URL does not include /api, no changes needed.');
}
"

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
