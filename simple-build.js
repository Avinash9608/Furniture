const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create client .env.production file
console.log('Creating client .env.production file...');
const clientEnvContent = `VITE_API_URL=/api\nVITE_NODE_ENV=production\n`;
fs.writeFileSync(path.join('client', '.env.production'), clientEnvContent);

// Update vite.config.js
console.log('Updating vite.config.js...');
const viteConfigPath = path.join('client', 'vite.config.js');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Replace the plugins section
viteConfig = viteConfig.replace(
  /plugins: \[\s*react\(.*?\)\s*\],/s,
  `plugins: [
    react({
      // Use classic JSX runtime for better compatibility
      jsxRuntime: 'classic',
      babel: {
        plugins: [],
        babelrc: true,
        configFile: false,
      },
    }),
  ],`
);

fs.writeFileSync(viteConfigPath, viteConfig);

// Create .babelrc file
console.log('Creating .babelrc file...');
const babelrcContent = `{
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
}`;
fs.writeFileSync(path.join('client', '.babelrc'), babelrcContent);

// Update main.jsx
console.log('Updating main.jsx...');
const mainJsxPath = path.join('client', 'src', 'main.jsx');
let mainJsx = fs.readFileSync(mainJsxPath, 'utf8');

// Add global React
if (!mainJsx.includes('window.React = React')) {
  mainJsx = mainJsx.replace(
    'import "./index.css";',
    'import "./index.css";\n\n// Make React available globally for JSX transformation\nwindow.React = React;'
  );
  fs.writeFileSync(mainJsxPath, mainJsx);
}

// Build client
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
