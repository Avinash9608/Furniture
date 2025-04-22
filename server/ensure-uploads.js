const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
} else {
  console.log('Uploads directory already exists:', uploadsDir);
}

// Create a test file to verify write permissions
const testFilePath = path.join(uploadsDir, 'test-file.txt');
try {
  fs.writeFileSync(testFilePath, 'This is a test file to verify write permissions.');
  console.log('Successfully wrote test file:', testFilePath);
  
  // Clean up test file
  fs.unlinkSync(testFilePath);
  console.log('Successfully removed test file');
} catch (error) {
  console.error('Error writing to uploads directory:', error);
}
