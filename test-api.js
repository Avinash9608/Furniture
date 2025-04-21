const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // Test the test endpoint
    const testResponse = await fetch('http://localhost:5000/api/test');
    const testData = await testResponse.json();
    console.log('Test API Response:', testData);
    
    // Test the products endpoint
    const productsResponse = await fetch('http://localhost:5000/api/products');
    const productsData = await productsResponse.json();
    console.log('Products API Response:', productsData);
    
    console.log('API tests completed');
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();
