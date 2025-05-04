const fs = require("fs");
const path = require("path");

console.log("Running postbuild script...");

// Check and fix package.json if needed
try {
  const clientPackageJsonPath = path.join(__dirname, "client", "package.json");
  if (fs.existsSync(clientPackageJsonPath)) {
    console.log("Checking client package.json for problematic dependencies...");
    const packageJson = JSON.parse(
      fs.readFileSync(clientPackageJsonPath, "utf8")
    );

    let modified = false;

    // Remove react-toastify if it exists
    if (
      packageJson.dependencies &&
      packageJson.dependencies["react-toastify"]
    ) {
      console.log("Removing react-toastify from dependencies...");
      delete packageJson.dependencies["react-toastify"];
      modified = true;
    }

    // Save changes if needed
    if (modified) {
      fs.writeFileSync(
        clientPackageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
      console.log("Updated client package.json");
    } else {
      console.log("No problematic dependencies found in client package.json");
    }
  }
} catch (error) {
  console.error("Error checking/updating package.json:", error);
  // Continue anyway
}

// Define source and destination directories
const sourceDir = path.join(__dirname, "client", "dist");
const destDir = path.join(__dirname, "dist");

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`);
  process.exit(1);
}

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  console.log(`Creating destination directory: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy directory recursively
function copyDir(src, dest) {
  // Get all files and directories in the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // If it's a directory, create it and copy its contents
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    }
    // If it's a file, copy it
    else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Copy the client build to the root dist directory
try {
  copyDir(sourceDir, destDir);
  console.log(
    `Successfully copied client build from ${sourceDir} to ${destDir}`
  );
} catch (error) {
  console.error("Error copying client build:", error);
  process.exit(1);
}

console.log("Postbuild script completed successfully");
