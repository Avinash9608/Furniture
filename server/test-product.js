const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Create a test product
async function createTestProduct() {
  try {
    console.log('Creating test product...');
    
    // Create form data
    const formData = new FormData();
    formData.append('name', 'Test Product from Script');
    formData.append('description', 'This is a test product created from a script');
    formData.append('price', '199.99');
    formData.append('stock', '10');
    formData.append('category', '6450a73d1234567890abcdef'); // Replace with a valid category ID
    formData.append('defaultImage', 'true');
    
    // Log form data
    console.log('Form data:');
    for (const [key, value] of Object.entries(formData)) {
      console.log(`${key}: ${value}`);
    }
    
    // Send request
    const response = await axios.post('http://localhost:5000/api/products', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('Product created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error creating product:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
createTestProduct();
