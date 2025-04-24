const express = require('express');
const path = require('path');
const app = express();
const PORT = 4173;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.post('/contact', (req, res) => {
  console.log('Contact form submission received');
  res.json({ success: true, message: 'Contact form submitted successfully' });
});

// Catch-all route for the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
});
