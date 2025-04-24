const { execSync } = require("child_process");
const path = require("path");

console.log("Installing Babel dependencies...");
try {
  execSync(
    "npm install --save-dev @babel/core @babel/preset-env @babel/preset-react @babel/plugin-transform-runtime terser",
    {
      cwd: path.join(process.cwd(), "client"),
      stdio: "inherit",
    }
  );
  console.log("Dependencies installed successfully!");
} catch (error) {
  console.error("Failed to install dependencies!");
  process.exit(1);
}
