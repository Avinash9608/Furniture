const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Testing production build...');

// Check if the build directory exists
const distPath = path.join(process.cwd(), 'client', 'dist');
if (!fs.existsSync(distPath)) {
  console.error(`Build directory not found: ${distPath}`);
  process.exit(1);
}

// List files in the build directory
console.log('\nFiles in the build directory:');
const files = fs.readdirSync(distPath);
files.forEach(file => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    console.log(`📁 ${file}/`);
    const subFiles = fs.readdirSync(filePath);
    subFiles.forEach(subFile => {
      console.log(`  - ${subFile}`);
    });
  } else {
    console.log(`📄 ${file}`);
  }
});

// Start the preview server
console.log('\nStarting preview server...');
try {
  const previewProcess = require('child_process').spawn('npm', ['run', 'preview'], {
    cwd: path.join(process.cwd(), 'client'),
    stdio: 'pipe',
    shell: true
  });

  // Handle preview server output
  previewProcess.stdout.on('data', (data) => {
    console.log(`Preview server: ${data.toString().trim()}`);
  });

  previewProcess.stderr.on('data', (data) => {
    console.error(`Preview server error: ${data.toString().trim()}`);
  });

  // Wait for the preview server to start
  console.log('\nWaiting for preview server to start...');
  setTimeout(() => {
    console.log('\nPreview server should be running now.');
    console.log('Please open http://localhost:4173 in your browser to test the production build.');
    console.log('Press Ctrl+C to stop the preview server when done.');
  }, 3000);

  // Keep the process running
  previewProcess.on('close', (code) => {
    console.log(`Preview server exited with code ${code}`);
  });
} catch (error) {
  console.error('Failed to start preview server:', error);
  process.exit(1);
}
