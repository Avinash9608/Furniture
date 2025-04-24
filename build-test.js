const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute commands and log output
function runCommand(command, cwd = process.cwd()) {
  console.log(`\n> Running command: ${command}`);
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    console.error(error.stdout?.toString() || '');
    console.error(error.stderr?.toString() || '');
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('=== Starting build test ===');
    console.log(`Current directory: ${process.cwd()}`);
    
    // Create client .env.production file
    console.log('\n=== Creating client .env.production file ===');
    const clientEnvContent = `VITE_API_URL=/api\nVITE_NODE_ENV=production\n`;
    fs.writeFileSync(path.join('client', '.env.production'), clientEnvContent);
    console.log('Created client/.env.production');
    
    // Build client
    console.log('\n=== Building client ===');
    runCommand('npm run build', path.join(process.cwd(), 'client'));
    
    // Check if build was successful
    const distPath = path.join(process.cwd(), 'client', 'dist');
    if (fs.existsSync(distPath)) {
      console.log(`\n✅ Build successful! Output directory: ${distPath}`);
      
      // List files in dist directory
      console.log('\n=== Files in dist directory ===');
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
      
      console.log('\n=== Build test completed successfully! ===');
    } else {
      console.error(`\n❌ Build failed! Output directory not found: ${distPath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Build test failed!');
    process.exit(1);
  }
}

// Run the main function
main();
