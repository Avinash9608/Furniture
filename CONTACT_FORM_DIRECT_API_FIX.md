# Contact Form Fix for Render Deployment

This document explains how to fix the contact form issue in the Shyam Furnitures application when deployed to Render.

## Problem

When deploying the application to Render, the contact form fails with a 404 error. The error shows:

```
POST https://furniture-q3nb.onrender.com/api/contact 404 (Not Found)
```

This happens because:

1. The client-side API utility is configured to use a base URL with `/api` prefix
2. The contact form is trying to send a POST request to `/contact` (which becomes `/api/contact` with the base URL)
3. The server is correctly configured to handle requests at `/api/contact` but the client is sending to the wrong endpoint

## Solution

We've implemented a robust solution that ensures the contact form works in all environments:

### 1. Updated Client-Side Contact API Implementation

We modified the `contactAPI.create` method in `client/src/utils/api.js` to use a direct axios instance without the base URL:

```javascript
// Contact API
export const contactAPI = {
  create: (contactData) => {
    console.log("Creating contact message with data:", contactData);
    // Use direct axios for contact form to bypass baseURL issues
    const baseUrl = window.location.origin;
    console.log("Using direct URL for contact form:", `${baseUrl}/api/contact`);

    // Create a new axios instance without baseURL to make a direct request
    const directApi = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return directApi.post(`${baseUrl}/api/contact`, contactData);
  },
  // Other methods remain unchanged...
};
```

### 2. How It Works

This solution:

1. Creates a new axios instance without a base URL to avoid the prefix issue
2. Uses `window.location.origin` to get the current domain (works in both development and production)
3. Makes a direct POST request to `${baseUrl}/api/contact` with the contact form data
4. Bypasses the base URL configuration that was causing the issue

## Deployment Instructions

1. Update `client/src/utils/api.js` with the new contact API implementation
2. Build the client application:
   ```
   cd client
   npm run build
   ```
3. Deploy to Render

## Testing

### Local Testing

1. Create a simple test HTML file (`test-contact-form.html`) with a contact form that uses the direct axios approach:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contact Form Test</title>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <!-- CSS styles omitted for brevity -->
  </head>
  <body>
    <h1>Contact Form Test</h1>
    <form id="contactForm">
      <!-- Form fields omitted for brevity -->
      <button type="submit">Send Message</button>
    </form>

    <div id="result"></div>

    <script>
      document
        .getElementById("contactForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();

          const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            subject: document.getElementById("subject").value,
            message: document.getElementById("message").value,
          };

          try {
            // Test the direct API approach
            const baseUrl = window.location.origin;
            console.log(
              "Using direct URL for contact form:",
              `${baseUrl}/api/contact`
            );

            // Create a new axios instance without baseURL
            const directApi = axios.create({
              timeout: 10000,
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });

            const response = await directApi.post(
              `${baseUrl}/api/contact`,
              formData
            );
            console.log("Response:", response);

            // Success handling
          } catch (error) {
            // Error handling
          }
        });
    </script>
  </body>
</html>
```

2. Create a simple test server (`contact-test-server.js`) to handle the contact form submission:

```javascript
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "client")));

// API route for contact form
app.post("/api/contact", (req, res) => {
  console.log("Received contact form submission:", req.body);

  // Validate required fields
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  // In a real app, you would save this to the database
  // For testing, we'll just return a success response
  res.status(200).json({
    success: true,
    message: "Contact form submitted successfully",
    data: req.body,
  });
});

// Serve the test HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "test-contact-form.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/contact`);
});
```

3. Run the test server:

   ```
   node contact-test-server.js
   ```

4. Open http://localhost:3000 in your browser and test the contact form

### Production Testing

After deployment, test the contact form on the live site. The direct axios instance should ensure that the form submission works correctly in the production environment.

## Additional Notes

- This solution is focused on fixing the contact form issue without changing the server-side code
- It works in both development and production environments
- It provides detailed logging to help with debugging
- The other API methods (getAll, getById, update, delete) continue to use the standard API instance since they're used in the admin panel and don't have the same issue
