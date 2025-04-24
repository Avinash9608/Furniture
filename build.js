/**
 * Build script for Shyam Furnitures
 * This script helps with the build process for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to execute commands
function execute(command, cwd = process.cwd()) {
  log(`Executing: ${command}`, colors.cyan);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

// Main build function
async function build() {
  log('Starting build process for Shyam Furnitures...', colors.bright + colors.blue);
  
  // Step 1: Check if client directory exists
  log('\nStep 1: Checking client directory...', colors.yellow);
  if (!fs.existsSync(path.join(process.cwd(), 'client'))) {
    log('Client directory not found!', colors.red);
    return false;
  }
  log('Client directory found.', colors.green);
  
  // Step 2: Install server dependencies
  log('\nStep 2: Installing server dependencies...', colors.yellow);
  if (!execute('npm install')) {
    log('Failed to install server dependencies.', colors.red);
    return false;
  }
  log('Server dependencies installed.', colors.green);
  
  // Step 3: Install client dependencies
  log('\nStep 3: Installing client dependencies...', colors.yellow);
  if (!execute('npm install', path.join(process.cwd(), 'client'))) {
    log('Failed to install client dependencies.', colors.red);
    return false;
  }
  log('Client dependencies installed.', colors.green);
  
  // Step 4: Build client
  log('\nStep 4: Building client...', colors.yellow);
  if (!execute('npm run build', path.join(process.cwd(), 'client'))) {
    log('Failed to build client.', colors.red);
    return false;
  }
  log('Client built successfully.', colors.green);
  
  // Step 5: Verify build
  log('\nStep 5: Verifying build...', colors.yellow);
  const distPath = path.join(process.cwd(), 'client', 'dist');
  if (!fs.existsSync(distPath)) {
    log('Build directory not found!', colors.red);
    return false;
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('index.html not found in build directory!', colors.red);
    return false;
  }
  
  // List files in dist directory
  const files = fs.readdirSync(distPath);
  log(`Found ${files.length} files in build directory:`, colors.green);
  files.forEach(file => {
    log(`  - ${file}`, colors.dim);
  });
  
  // Step 6: Success
  log('\nBuild completed successfully! 🎉', colors.bright + colors.green);
  log('\nTo start the server, run:', colors.yellow);
  log('  npm start', colors.bright);
  
  return true;
}

// Run the build
build().catch(error => {
  log(`Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
