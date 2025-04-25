/**
 * Test script to verify contact message functionality
 * This script tests the admin endpoint for fetching contact messages
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://furniture-q3nb.onrender.com';

// Create API client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Test results
const results = {
  healthCheck: false,
  adminMessages: false,
  regularMessages: false,
  errors: []
};

// Test health check endpoint
async function testHealthCheck() {
  console.log('\n🔍 Testing health check endpoint');
  
  try {
    console.log(`Trying to fetch from: ${API_BASE_URL}/api/health`);
    const response = await api.get('/api/health');
    
    console.log('Health check response:', response.data);
    
    if (response.data && response.data.status === 'ok') {
      console.log('✅ Health check passed');
      results.healthCheck = true;
      
      // Check MongoDB status
      if (response.data.services && response.data.services.mongodb) {
        console.log('MongoDB status:', response.data.services.mongodb.status);
      }
      
      return true;
    } else {
      console.error('❌ Health check failed: Invalid response format');
      results.errors.push('Health check failed: Invalid response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    results.errors.push(`Health check failed: ${error.message}`);
    return false;
  }
}

// Test admin messages endpoint
async function testAdminMessages() {
  console.log('\n🔍 Testing admin messages endpoint');
  
  try {
    console.log(`Trying to fetch from: ${API_BASE_URL}/api/admin/messages`);
    const response = await api.get('/api/admin/messages');
    
    // Check if response is HTML
    if (typeof response.data === 'string' && 
        (response.data.includes('<!DOCTYPE') || 
         response.data.includes('<html'))) {
      console.error('❌ Admin messages endpoint returned HTML instead of JSON');
      results.errors.push('Admin messages endpoint returned HTML instead of JSON');
      return false;
    }
    
    console.log('Admin messages response:', response.data);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log(`✅ Admin messages endpoint returned ${response.data.data.length} messages`);
      results.adminMessages = true;
      
      // Log sample messages
      if (response.data.data.length > 0) {
        console.log('\nSample messages:');
        response.data.data.slice(0, 3).forEach((message, index) => {
          console.log(`\nMessage ${index + 1}:`);
          console.log('ID:', message._id);
          console.log('Name:', message.name);
          console.log('Email:', message.email);
          console.log('Subject:', message.subject);
          console.log('Created At:', message.createdAt);
        });
      }
      
      return true;
    } else {
      console.error('❌ Admin messages endpoint failed: Invalid response format');
      results.errors.push('Admin messages endpoint failed: Invalid response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Admin messages endpoint failed:', error.message);
    results.errors.push(`Admin messages endpoint failed: ${error.message}`);
    return false;
  }
}

// Test regular messages endpoint
async function testRegularMessages() {
  console.log('\n🔍 Testing regular messages endpoint');
  
  try {
    console.log(`Trying to fetch from: ${API_BASE_URL}/api/contact`);
    const response = await api.get('/api/contact');
    
    // Check if response is HTML
    if (typeof response.data === 'string' && 
        (response.data.includes('<!DOCTYPE') || 
         response.data.includes('<html'))) {
      console.error('❌ Regular messages endpoint returned HTML instead of JSON');
      results.errors.push('Regular messages endpoint returned HTML instead of JSON');
      return false;
    }
    
    console.log('Regular messages response:', response.data);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log(`✅ Regular messages endpoint returned ${response.data.data.length} messages`);
      results.regularMessages = true;
      return true;
    } else {
      console.error('❌ Regular messages endpoint failed: Invalid response format');
      results.errors.push('Regular messages endpoint failed: Invalid response format');
      return false;
    }
  } catch (error) {
    console.error('❌ Regular messages endpoint failed:', error.message);
    results.errors.push(`Regular messages endpoint failed: ${error.message}`);
    return false;
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `contact-messages-fix-report-${reportDate.split('T')[0]}.md`;
  
  const reportContent = `# Contact Messages Fix Test Report

Generated: ${new Date().toLocaleString()}

## Test Results

- **Health Check Endpoint**: ${results.healthCheck ? '✅ Passed' : '❌ Failed'}
- **Admin Messages Endpoint**: ${results.adminMessages ? '✅ Passed' : '❌ Failed'}
- **Regular Messages Endpoint**: ${results.regularMessages ? '✅ Passed' : '❌ Failed'}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **API URL**: ${API_BASE_URL}
- **Test Date**: ${reportDate}

## Conclusion

${results.errors.length === 0 
  ? '✅ All tests passed! The contact message functionality is working correctly.'
  : '❌ Some tests failed. Please review the errors and fix the issues.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting Contact Messages Fix Tests');
  
  // Test health check endpoint
  await testHealthCheck();
  
  // Test admin messages endpoint
  await testAdminMessages();
  
  // Test regular messages endpoint
  await testRegularMessages();
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Health Check Endpoint: ${results.healthCheck ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Admin Messages Endpoint: ${results.adminMessages ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Regular Messages Endpoint: ${results.regularMessages ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Errors: ${results.errors.length}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return results.errors.length > 0 ? 1 : 0;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
