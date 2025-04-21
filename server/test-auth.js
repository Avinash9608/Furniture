const axios = require('axios');

// Test the authentication with the admin token
async function testAuth() {
  try {
    console.log('Testing authentication with admin token...');
    
    // Test GET request
    const getResponse = await axios.get('http://localhost:5000/api/products', {
      headers: {
        'Authorization': 'Bearer admin-token-fixed-value-123456'
      }
    });
    
    console.log('GET request successful:', getResponse.status);
    console.log('Products:', getResponse.data);
    
    // Test POST request with minimal product data
    const postData = {
      name: 'Test Product',
      price: 999,
      category: '645f340293b3a1a3e2a92cb1', // Replace with a valid category ID
      description: 'This is a test product',
      defaultImage: 'true'
    };
    
    const postResponse = await axios.post('http://localhost:5000/api/products', postData, {
      headers: {
        'Authorization': 'Bearer admin-token-fixed-value-123456',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('POST request successful:', postResponse.status);
    console.log('Created product:', postResponse.data);
    
  } catch (error) {
    console.error('Error testing authentication:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Headers:', error.config?.headers);
  }
}

testAuth();
