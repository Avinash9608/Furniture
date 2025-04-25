/**
 * Test script to verify data is being fetched and displayed correctly
 * Run this script with Node.js to test all API endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'https://furniture-q3nb.onrender.com';
const ENDPOINTS = [
  { name: 'Categories', path: '/api/categories' },
  { name: 'Products', path: '/api/products' },
  { name: 'Orders', path: '/api/orders' },
  { name: 'Contacts', path: '/api/contact' },
  { name: 'Payment Requests', path: '/api/payment-requests/all' },
  { name: 'Payment Settings', path: '/api/payment-settings/all' }
];

// Create a direct axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Test all endpoints
async function testAllEndpoints() {
  console.log(`\n🔍 Testing API endpoints on ${BASE_URL}\n`);
  
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint.name} endpoint: ${BASE_URL}${endpoint.path}`);
      const response = await api.get(endpoint.path);
      
      // Check if response has data
      if (response.data) {
        const data = response.data.data || response.data;
        const count = Array.isArray(data) ? data.length : 'unknown';
        
        console.log(`✅ ${endpoint.name}: Success - ${count} items found`);
        
        // Log first item as sample
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   Sample item: ${JSON.stringify(data[0]._id)}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: No data in response`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('-----------------------------------');
  }
}

// Run the tests
testAllEndpoints()
  .then(() => {
    console.log('\n✅ All tests completed');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
  });
