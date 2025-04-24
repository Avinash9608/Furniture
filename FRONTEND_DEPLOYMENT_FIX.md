# Frontend Deployment Fix for Shyam Furnitures

This guide provides step-by-step instructions for fixing the frontend deployment issue with the Shyam Furnitures application on Render.

## Current Status

- The backend API is running correctly (confirmed by `/api/health` endpoint)
- The frontend is not being served correctly (502 Bad Gateway or API status page)

## Root Cause

The issue is likely one of the following:

1. The frontend build process is not completing successfully
2. The build files are not being placed in the correct location
3. The server is not correctly configured to serve the static files

## Solution Steps

### 1. Update the Build Process

1. **Update package.json scripts**:

```json
"scripts": {
  "start": "node server.js",
  "build": "node build.js",
  "build:client": "cd client && npm install --include=dev && npm run build",
  "render-build": "npm install && cd client && npm install --include=dev && npm run build"
}
```

2. **Create a build.js script** to handle the build process:

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
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
  
  // Step 1: Install server dependencies
  log('\nStep 1: Installing server dependencies...', colors.yellow);
  if (!execute('npm install')) {
    log('Failed to install server dependencies.', colors.red);
    return false;
  }
  
  // Step 2: Install client dependencies
  log('\nStep 2: Installing client dependencies...', colors.yellow);
  if (!execute('npm install', path.join(process.cwd(), 'client'))) {
    log('Failed to install client dependencies.', colors.red);
    return false;
  }
  
  // Step 3: Build client
  log('\nStep 3: Building client...', colors.yellow);
  if (!execute('npm run build', path.join(process.cwd(), 'client'))) {
    log('Failed to build client.', colors.red);
    return false;
  }
  
  // Step 4: Verify build
  log('\nStep 4: Verifying build...', colors.yellow);
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
    log(`  - ${file}`);
  });
  
  log('\nBuild completed successfully! 🎉', colors.bright + colors.green);
  return true;
}

// Run the build
build().catch(error => {
  log(`Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
```

### 2. Update the Server.js File

1. **Improve static file serving**:

```javascript
// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/dist")));

// Log static file directory for debugging
console.log("Serving static files from:", path.join(__dirname, "client/dist"));
// Check if the directory exists
const fs = require('fs');
if (fs.existsSync(path.join(__dirname, "client/dist"))) {
  console.log("Static file directory exists");
  // List files in the directory
  try {
    const files = fs.readdirSync(path.join(__dirname, "client/dist"));
    console.log("Files in static directory:", files);
  } catch (error) {
    console.error("Error reading static directory:", error);
  }
} else {
  console.warn("Static file directory does not exist!");
}
```

2. **Update the root route handler**:

```javascript
// Simple root health check for Render
app.get("/", (req, res) => {
  // Check if we have a frontend build
  const indexPath = path.join(__dirname, "client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    // If index.html exists, serve it
    console.log("Serving index.html for root path");
    res.sendFile(indexPath);
  } else {
    // If no frontend build, show API status
    console.warn("No frontend build found, showing API status");
    res.send(`
      <html>
        <head>
          <title>Shyam Furnitures API</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .status { padding: 15px; background-color: #f0f0f0; border-radius: 5px; margin-bottom: 20px; }
            .status.ok { background-color: #d4edda; color: #155724; }
            .status.warning { background-color: #fff3cd; color: #856404; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Shyam Furnitures API</h1>
          <div class="status ok">
            <strong>API Status:</strong> Running
          </div>
          <div class="status warning">
            <strong>Frontend Status:</strong> Not Found
            <p>The frontend build files were not found. This means the React application is not available.</p>
          </div>
          <h2>Available Endpoints:</h2>
          <ul>
            <li><a href="/api/health">/api/health</a> - Detailed API health status</li>
            <li><a href="/api/products">/api/products</a> - List all products</li>
            <li><a href="/api/categories">/api/categories</a> - List all categories</li>
          </ul>
        </body>
      </html>
    `);
  }
});
```

3. **Improve the catchall handler**:

```javascript
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  
  // Check if the file exists before sending
  const indexPath = path.join(__dirname, "client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.warn("index.html not found!");
    // Try to provide more helpful information
    try {
      const rootDir = fs.readdirSync(__dirname);
      const clientDir = fs.existsSync(path.join(__dirname, "client")) 
        ? fs.readdirSync(path.join(__dirname, "client")) 
        : "client directory not found";
      const distDir = fs.existsSync(path.join(__dirname, "client/dist")) 
        ? fs.readdirSync(path.join(__dirname, "client/dist")) 
        : "dist directory not found";
      
      res.status(404).send(`
        <h1>Frontend build not found</h1>
        <p>The index.html file could not be found. This usually means the frontend build is missing.</p>
        <h2>Debugging Information:</h2>
        <pre>
Root directory: ${JSON.stringify(rootDir, null, 2)}
Client directory: ${JSON.stringify(clientDir, null, 2)}
Dist directory: ${JSON.stringify(distDir, null, 2)}
        </pre>
        <p>API is running. <a href="/api/health">Check API health</a></p>
      `);
    } catch (error) {
      res.status(404).send(`index.html not found. Build may be missing. Error: ${error.message}`);
    }
  }
});
```

### 3. Update Render Configuration

1. **Update the Build Command**:
   - Go to your Render dashboard
   - Select your "furniture-q3nb" service
   - Click on "Settings"
   - Update the Build Command to:
   ```
   npm install && cd client && npm install --include=dev && npm run build && cd ..
   ```

2. **Verify Environment Variables**:
   - Make sure all required environment variables are set
   - Add `NODE_ENV=production` if not already set

3. **Increase Build Timeout**:
   - Set the build timeout to at least 15 minutes

### 4. Deploy and Verify

1. **Deploy the Changes**:
   - Commit and push your changes to GitHub
   - Trigger a new deployment on Render

2. **Monitor the Build Logs**:
   - Watch the build logs for any errors
   - Make sure the client build completes successfully
   - Verify that the static files are being served correctly

3. **Test the Frontend**:
   - Visit your application URL
   - Verify that the frontend is being served correctly
   - Test key functionality

## Troubleshooting

If you're still experiencing issues:

1. **Check the Build Logs**:
   - Look for any errors during the build process
   - Make sure the client build completes successfully

2. **Verify the Static Files**:
   - Check if the static files are being created in the correct location
   - Make sure the server is correctly configured to serve the static files

3. **Test Locally**:
   - Run the build process locally
   - Make sure the frontend works correctly in the local environment

4. **Check for Path Issues**:
   - Verify that the paths in server.js are correct
   - Make sure the static file paths match the actual file structure

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Express Static File Serving](https://expressjs.com/en/starter/static-files.html)
