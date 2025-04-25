/**
 * Test script to verify contact message functionality (Version 2)
 * This script tests all available endpoints for fetching contact messages
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://furniture-q3nb.onrender.com';
const LOCAL_API_URL = 'http://localhost:5173';

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
  endpoints: {},
  errors: []
};

// Test all endpoints
async function testAllEndpoints() {
  console.log('\n🔍 Testing all contact message endpoints');
  
  // Define all endpoints to test
  const endpoints = [
    // Regular contact endpoints
    `${LOCAL_API_URL}/api/contact`,
    `${API_BASE_URL}/api/contact`,
    // Admin-specific endpoints
    `${LOCAL_API_URL}/api/admin/messages`,
    `${API_BASE_URL}/api/admin/messages`,
    `${LOCAL_API_URL}/admin/messages`,
    `${API_BASE_URL}/admin/messages`,
    `${LOCAL_API_URL}/api/admin-messages`,
    `${API_BASE_URL}/api/admin-messages`,
    // Direct database query endpoint
    `${LOCAL_API_URL}/api/direct/contacts`,
    `${API_BASE_URL}/api/direct/contacts`,
    // Health check endpoint
    `${LOCAL_API_URL}/api/health`,
    `${API_BASE_URL}/api/health`
  ];
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const response = await axios.get(endpoint, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Check if response is HTML
      if (typeof response.data === 'string' && 
          (response.data.includes('<!DOCTYPE') || 
           response.data.includes('<html'))) {
        console.error('❌ Endpoint returned HTML instead of JSON');
        results.endpoints[endpoint] = {
          status: 'failed',
          error: 'Returned HTML instead of JSON',
          contentType: response.headers['content-type']
        };
        continue;
      }
      
      console.log('Response status:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      
      // Process response based on endpoint type
      if (endpoint.includes('/api/health')) {
        // Health check endpoint
        if (response.data && response.data.status === 'ok') {
          console.log('✅ Health check endpoint working');
          results.endpoints[endpoint] = {
            status: 'success',
            data: {
              mongoStatus: response.data.services?.mongodb?.status || 'unknown'
            }
          };
        } else {
          console.error('❌ Health check endpoint returned invalid data');
          results.endpoints[endpoint] = {
            status: 'failed',
            error: 'Invalid health check data',
            data: response.data
          };
        }
      } else {
        // Contact message endpoints
        let messagesData = [];
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          messagesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          messagesData = response.data;
        }
        
        if (messagesData.length > 0) {
          console.log(`✅ Endpoint returned ${messagesData.length} messages`);
          results.endpoints[endpoint] = {
            status: 'success',
            count: messagesData.length,
            sample: messagesData.slice(0, 2).map(msg => ({
              id: msg._id,
              name: msg.name,
              email: msg.email,
              subject: msg.subject
            }))
          };
        } else {
          console.warn('⚠️ Endpoint returned no messages');
          results.endpoints[endpoint] = {
            status: 'warning',
            warning: 'No messages returned',
            data: response.data
          };
        }
      }
    } catch (error) {
      console.error('❌ Error testing endpoint:', error.message);
      
      results.endpoints[endpoint] = {
        status: 'error',
        error: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      };
      
      results.errors.push(`Error testing ${endpoint}: ${error.message}`);
    }
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `contact-messages-fix-report-v2-${reportDate.split('T')[0]}.md`;
  
  // Count successes, warnings, and errors
  const counts = {
    success: 0,
    warning: 0,
    error: 0,
    failed: 0
  };
  
  Object.values(results.endpoints).forEach(result => {
    counts[result.status]++;
  });
  
  const reportContent = `# Contact Messages Fix Test Report (Version 2)

Generated: ${new Date().toLocaleString()}

## Summary

- **Total Endpoints Tested**: ${Object.keys(results.endpoints).length}
- **Successful**: ${counts.success}
- **Warnings**: ${counts.warning}
- **Errors**: ${counts.error + counts.failed}

## Endpoint Results

${Object.entries(results.endpoints).map(([endpoint, result]) => `
### ${endpoint}

- **Status**: ${result.status === 'success' ? '✅ Success' : result.status === 'warning' ? '⚠️ Warning' : '❌ Failed'}
${result.count ? `- **Messages Count**: ${result.count}` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}
${result.warning ? `- **Warning**: ${result.warning}` : ''}
${result.data ? `- **Data**: ${JSON.stringify(result.data, null, 2)}` : ''}
${result.sample ? `- **Sample Messages**: ${JSON.stringify(result.sample, null, 2)}` : ''}
`).join('\n')}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **API URL**: ${API_BASE_URL}
- **Local URL**: ${LOCAL_API_URL}
- **Test Date**: ${reportDate}

## Conclusion

${counts.success > 0 
  ? `✅ ${counts.success} endpoints are working correctly.` 
  : '❌ No endpoints are working correctly.'}
${counts.warning > 0 ? `⚠️ ${counts.warning} endpoints returned warnings.` : ''}
${counts.error + counts.failed > 0 ? `❌ ${counts.error + counts.failed} endpoints failed.` : ''}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting Contact Messages Fix Tests (Version 2)');
  
  // Test all endpoints
  await testAllEndpoints();
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  
  // Count successes, warnings, and errors
  const counts = {
    success: 0,
    warning: 0,
    error: 0,
    failed: 0
  };
  
  Object.values(results.endpoints).forEach(result => {
    counts[result.status]++;
  });
  
  console.log(`Total Endpoints Tested: ${Object.keys(results.endpoints).length}`);
  console.log(`Successful: ${counts.success}`);
  console.log(`Warnings: ${counts.warning}`);
  console.log(`Errors: ${counts.error + counts.failed}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return counts.success > 0 ? 0 : 1;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ At least one endpoint is working!' : '❌ All endpoints failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
