const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Starting fix for ES modules ===');

// Step 1: Create a proper vite.config.js file
console.log('Creating ES modules compatible vite.config.js...');
const viteConfigContent = `import { defineConfig } from 'vite';
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
}));`;

fs.writeFileSync(path.join('client', 'vite.config.js'), viteConfigContent);

// Step 2: Install necessary dependencies
console.log('Installing necessary dependencies...');
try {
  execSync('npm install --save-dev terser', { 
    cwd: path.join(process.cwd(), 'client'),
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Failed to install dependencies, but continuing...');
}

// Step 3: Build the client
console.log('Building client...');
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

// Step 4: Update the render-deploy.sh script
console.log('Updating render-deploy.sh script...');
try {
  const renderDeployPath = path.join(process.cwd(), 'render-deploy.sh');
  if (fs.existsSync(renderDeployPath)) {
    let renderDeployContent = fs.readFileSync(renderDeployPath, 'utf8');
    
    // Replace the vite.config.js section
    renderDeployContent = renderDeployContent.replace(
      /# Update vite\.config\.js.*?EOL/s,
      `# Update vite.config.js to use ES modules
echo "Updating vite.config.js to use ES modules..."
cat > vite.config.js << EOL
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
EOL`
    );
    
    fs.writeFileSync(renderDeployPath, renderDeployContent);
    console.log('Updated render-deploy.sh script');
  } else {
    console.log('render-deploy.sh not found, skipping update');
  }
} catch (error) {
  console.error('Failed to update render-deploy.sh, but continuing...');
}

console.log('=== Fix completed! ===');
