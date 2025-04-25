/**
 * Comprehensive test script to verify that all data is being fetched and displayed correctly
 * Run this script with Node.js to test all API endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
  
  const results = {
    success: [],
    failure: []
  };
  
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint.name} endpoint: ${BASE_URL}${endpoint.path}`);
      const response = await api.get(endpoint.path);
      
      // Check if response has data
      if (response.data) {
        const data = response.data.data || response.data;
        const count = Array.isArray(data) ? data.length : 'unknown';
        
        console.log(`✅ ${endpoint.name}: Success - ${count} items found`);
        
        // Log first item as sample if available
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   Sample item ID: ${JSON.stringify(data[0]._id)}`);
          
          // Check for required fields based on endpoint type
          let missingFields = [];
          
          if (endpoint.name === 'Products') {
            const requiredFields = ['name', 'price', 'description', 'category'];
            missingFields = checkRequiredFields(data[0], requiredFields);
          } else if (endpoint.name === 'Categories') {
            const requiredFields = ['name', 'slug'];
            missingFields = checkRequiredFields(data[0], requiredFields);
          } else if (endpoint.name === 'Orders') {
            const requiredFields = ['user', 'orderItems', 'shippingAddress', 'totalPrice'];
            missingFields = checkRequiredFields(data[0], requiredFields);
          }
          
          if (missingFields.length > 0) {
            console.log(`   ⚠️ Warning: Missing required fields: ${missingFields.join(', ')}`);
          }
        }
        
        results.success.push({
          name: endpoint.name,
          path: endpoint.path,
          count: count
        });
      } else {
        console.log(`❌ ${endpoint.name}: No data in response`);
        results.failure.push({
          name: endpoint.name,
          path: endpoint.path,
          error: 'No data in response'
        });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      
      results.failure.push({
        name: endpoint.name,
        path: endpoint.path,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    console.log('-----------------------------------');
  }
  
  // Generate report
  generateReport(results);
  
  return results;
}

// Check if an object has all required fields
function checkRequiredFields(obj, requiredFields) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}

// Generate a report of the test results
function generateReport(results) {
  const reportDate = new Date().toISOString();
  const reportContent = `# Data Display Test Report

Generated: ${new Date().toLocaleString()}

## Summary

- Total endpoints tested: ${ENDPOINTS.length}
- Successful endpoints: ${results.success.length}
- Failed endpoints: ${results.failure.length}

## Successful Endpoints

${results.success.map(endpoint => `- ${endpoint.name}: ${endpoint.count} items found`).join('\n')}

## Failed Endpoints

${results.failure.length === 0 ? 'None' : results.failure.map(endpoint => `- ${endpoint.name}: ${endpoint.error}`).join('\n')}

## Next Steps

${results.failure.length === 0 
  ? '✅ All endpoints are working correctly. The application should display all data properly.'
  : '⚠️ Some endpoints are not working correctly. Please check the server logs and fix the issues.'}

`;

  // Save the report to a file
  const reportFileName = `data-display-report-${reportDate.split('T')[0]}.md`;
  fs.writeFileSync(reportFileName, reportContent);
  
  console.log(`\nReport saved to ${reportFileName}`);
}

// Run the tests
testAllEndpoints()
  .then(() => {
    console.log('\n✅ All tests completed');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
  });
