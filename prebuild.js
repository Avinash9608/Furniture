const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running prebuild cleanup script...');

// Function to check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
};

// Function to remove react-toastify from package.json
const removeReactToastify = (packageJsonPath) => {
  try {
    if (fs.existsSync(packageJsonPath)) {
      console.log(`Checking ${packageJsonPath} for react-toastify...`);
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      let modified = false;
      
      // Check dependencies
      if (packageJson.dependencies && packageJson.dependencies['react-toastify']) {
        console.log('Removing react-toastify from dependencies...');
        delete packageJson.dependencies['react-toastify'];
        modified = true;
      }
      
      // Check devDependencies
      if (packageJson.devDependencies && packageJson.devDependencies['react-toastify']) {
        console.log('Removing react-toastify from devDependencies...');
        delete packageJson.devDependencies['react-toastify'];
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`Updated ${packageJsonPath}`);
      } else {
        console.log(`No react-toastify found in ${packageJsonPath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${packageJsonPath}:`, error);
  }
};

// Clean up client node_modules
const clientNodeModulesPath = path.join(__dirname, 'client', 'node_modules');
if (directoryExists(clientNodeModulesPath)) {
  console.log('Cleaning up client node_modules...');
  
  // Remove react-toastify directory if it exists
  const reactToastifyPath = path.join(clientNodeModulesPath, 'react-toastify');
  if (directoryExists(reactToastifyPath)) {
    console.log('Removing react-toastify directory...');
    try {
      fs.rmSync(reactToastifyPath, { recursive: true, force: true });
      console.log('react-toastify directory removed successfully');
    } catch (error) {
      console.error('Error removing react-toastify directory:', error);
    }
  }
  
  // Remove .vite directory if it exists
  const viteCachePath = path.join(clientNodeModulesPath, '.vite');
  if (directoryExists(viteCachePath)) {
    console.log('Removing .vite cache directory...');
    try {
      fs.rmSync(viteCachePath, { recursive: true, force: true });
      console.log('.vite cache directory removed successfully');
    } catch (error) {
      console.error('Error removing .vite cache directory:', error);
    }
  }
}

// Update package.json files
removeReactToastify(path.join(__dirname, 'package.json'));
removeReactToastify(path.join(__dirname, 'client', 'package.json'));

console.log('Prebuild cleanup completed');
