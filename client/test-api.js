const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // Test GET /api/products
    const productsResponse = await fetch('http://localhost:5000/api/products');
    const productsData = await productsResponse.json();
    console.log('Products API Response:', productsData);
    
    // Test GET /api/categories
    const categoriesResponse = await fetch('http://localhost:5000/api/categories');
    const categoriesData = await categoriesResponse.json();
    console.log('Categories API Response:', categoriesData);
    
    console.log('API tests completed successfully');
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();
