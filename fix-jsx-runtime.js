const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Starting fix for JSX runtime issues ===');

// Step 1: Update vite.config.js to use the correct JSX runtime
console.log('\n=== Updating vite.config.js ===');
const viteConfigContent = `import { defineConfig } from 'vite';
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
}));`;

fs.writeFileSync(path.join('client', 'vite.config.js'), viteConfigContent);
console.log('Updated vite.config.js');

// Step 2: Update main.jsx to ensure React is properly imported and made global
console.log('\n=== Updating main.jsx ===');
const mainJsxPath = path.join('client', 'src', 'main.jsx');
let mainJsxContent = fs.readFileSync(mainJsxPath, 'utf8');

// Add global React assignment if not already present
if (!mainJsxContent.includes('window.React = React')) {
  mainJsxContent = mainJsxContent.replace(
    'import React from "react";',
    `import React from "react";
// Make React available globally for JSX transformation
window.React = React;`
  );
  fs.writeFileSync(mainJsxPath, mainJsxContent);
  console.log('Updated main.jsx with global React assignment');
}

// Step 3: Create a custom babel.config.js file
console.log('\n=== Creating babel.config.js ===');
const babelConfigContent = `module.exports = {
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
};`;

fs.writeFileSync(path.join('client', 'babel.config.js'), babelConfigContent);
console.log('Created babel.config.js');

// Step 4: Install necessary dependencies
console.log('\n=== Installing necessary dependencies ===');
try {
  execSync('npm install --save-dev @babel/core @babel/preset-env @babel/preset-react terser', { 
    cwd: path.join(process.cwd(), 'client'),
    stdio: 'inherit'
  });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Failed to install dependencies, but continuing...');
}

// Step 5: Update render-deploy.sh script
console.log('\n=== Updating render-deploy.sh script ===');
try {
  const renderDeployPath = path.join(process.cwd(), 'render-deploy.sh');
  if (fs.existsSync(renderDeployPath)) {
    let renderDeployContent = fs.readFileSync(renderDeployPath, 'utf8');
    
    // Update the vite.config.js section
    renderDeployContent = renderDeployContent.replace(
      /# Update vite\.config\.js.*?EOL/s,
      `# Update vite.config.js for production
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
EOL`
    );
    
    // Add babel.config.js creation
    if (!renderDeployContent.includes('# Create babel.config.js')) {
      const babelConfigSection = `
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
`;
      
      // Insert after the .babelrc section
      renderDeployContent = renderDeployContent.replace(
        /# Create \.babelrc file[\s\S]*?EOL\n/,
        match => match + babelConfigSection
      );
    }
    
    // Update the dependencies installation
    if (!renderDeployContent.includes('@babel/preset-react')) {
      renderDeployContent = renderDeployContent.replace(
        /npm install --include=dev/,
        'npm install --save-dev @babel/core @babel/preset-env @babel/preset-react terser && npm install --include=dev'
      );
    }
    
    fs.writeFileSync(renderDeployPath, renderDeployContent);
    console.log('Updated render-deploy.sh script');
  } else {
    console.log('render-deploy.sh not found, skipping update');
  }
} catch (error) {
  console.error('Failed to update render-deploy.sh, but continuing...');
}

// Step 6: Build the client
console.log('\n=== Building client ===');
try {
  execSync('npm run build', { 
    cwd: path.join(process.cwd(), 'client'),
    stdio: 'inherit'
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed!');
  process.exit(1);
}

console.log('\n=== Fix completed! ===');
console.log('Please commit and push these changes, then redeploy on Render.');
