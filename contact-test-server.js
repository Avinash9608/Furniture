const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client')));

// API route for contact form
app.post('/api/contact', (req, res) => {
  console.log('Received contact form submission:', req.body);
  
  // Validate required fields
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide all required fields' 
    });
  }
  
  // In a real app, you would save this to the database
  // For testing, we'll just return a success response
  res.status(200).json({
    success: true,
    message: 'Contact form submitted successfully',
    data: req.body
  });
});

// Serve the test HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'test-contact-form.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/contact`);
});
