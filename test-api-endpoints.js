/**
 * Test script to verify API endpoints in both local and production environments
 * 
 * This script tests all API endpoints for the contact messages functionality
 * in both local and production environments.
 * 
 * Run with: node test-api-endpoints.js
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const LOCAL_URL = 'http://localhost:5173';
const PRODUCTION_URL = 'https://furniture-q3nb.onrender.com';

// Test results
const results = {
  local: {
    endpoints: {},
    errors: []
  },
  production: {
    endpoints: {},
    errors: []
  }
};

// Test a single endpoint
async function testEndpoint(baseUrl, endpoint) {
  const fullUrl = `${baseUrl}${endpoint}`;
  console.log(`Testing endpoint: ${fullUrl}`);
  
  try {
    const response = await axios.get(fullUrl, {
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
      return {
        status: 'failed',
        error: 'Returned HTML instead of JSON',
        contentType: response.headers['content-type']
      };
    }
    
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    
    // Process response
    let messagesData = [];
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      messagesData = response.data.data;
    } else if (Array.isArray(response.data)) {
      messagesData = response.data;
    }
    
    if (messagesData.length > 0) {
      console.log(`✅ Endpoint returned ${messagesData.length} messages`);
      return {
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
      return {
        status: 'warning',
        warning: 'No messages returned',
        data: response.data
      };
    }
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    
    return {
      status: 'error',
      error: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    };
  }
}

// Test all endpoints in an environment
async function testEnvironment(baseUrl, environment) {
  console.log(`\n🔍 Testing ${environment} environment: ${baseUrl}`);
  
  // Define endpoints to test
  const endpoints = [
    '/api/admin/messages',
    '/admin/messages',
    '/api/direct/contacts',
    '/api/contact',
    '/contact',
    '/api/health'
  ];
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint);
    results[environment].endpoints[endpoint] = result;
    
    if (result.status === 'error') {
      results[environment].errors.push(`Error testing ${endpoint}: ${result.error}`);
    }
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `api-endpoints-test-report-${reportDate.split('T')[0]}.md`;
  
  // Count successes, warnings, and errors for each environment
  const counts = {
    local: {
      success: 0,
      warning: 0,
      error: 0,
      failed: 0
    },
    production: {
      success: 0,
      warning: 0,
      error: 0,
      failed: 0
    }
  };
  
  Object.entries(results.local.endpoints).forEach(([_, result]) => {
    counts.local[result.status]++;
  });
  
  Object.entries(results.production.endpoints).forEach(([_, result]) => {
    counts.production[result.status]++;
  });
  
  const reportContent = `# API Endpoints Test Report

Generated: ${new Date().toLocaleString()}

## Summary

### Local Environment (${LOCAL_URL})
- **Total Endpoints Tested**: ${Object.keys(results.local.endpoints).length}
- **Successful**: ${counts.local.success}
- **Warnings**: ${counts.local.warning}
- **Errors**: ${counts.local.error + counts.local.failed}

### Production Environment (${PRODUCTION_URL})
- **Total Endpoints Tested**: ${Object.keys(results.production.endpoints).length}
- **Successful**: ${counts.production.success}
- **Warnings**: ${counts.production.warning}
- **Errors**: ${counts.production.error + counts.production.failed}

## Local Environment Results

${Object.entries(results.local.endpoints).map(([endpoint, result]) => `
### ${endpoint}

- **Status**: ${result.status === 'success' ? '✅ Success' : result.status === 'warning' ? '⚠️ Warning' : '❌ Failed'}
${result.count ? `- **Messages Count**: ${result.count}` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}
${result.warning ? `- **Warning**: ${result.warning}` : ''}
${result.sample ? `- **Sample Messages**: ${JSON.stringify(result.sample, null, 2)}` : ''}
`).join('\n')}

## Production Environment Results

${Object.entries(results.production.endpoints).map(([endpoint, result]) => `
### ${endpoint}

- **Status**: ${result.status === 'success' ? '✅ Success' : result.status === 'warning' ? '⚠️ Warning' : '❌ Failed'}
${result.count ? `- **Messages Count**: ${result.count}` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}
${result.warning ? `- **Warning**: ${result.warning}` : ''}
${result.sample ? `- **Sample Messages**: ${JSON.stringify(result.sample, null, 2)}` : ''}
`).join('\n')}

## Errors

### Local Environment
${results.local.errors.length > 0 ? results.local.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

### Production Environment
${results.production.errors.length > 0 ? results.production.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Conclusion

${counts.local.success > 0 && counts.production.success > 0
  ? '✅ Both environments have working endpoints.'
  : counts.local.success > 0
    ? '⚠️ Local environment works, but production environment has issues.'
    : counts.production.success > 0
      ? '⚠️ Production environment works, but local environment has issues.'
      : '❌ Both environments have issues.'}

### Recommendations

${counts.production.success === 0
  ? '1. Check the server configuration in the production environment.\n2. Verify that the API routes are properly defined.\n3. Check for CORS issues in the production environment.\n4. Verify that the MongoDB connection is working in production.'
  : 'The API endpoints are working correctly in the production environment.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting API Endpoints Tests');
  
  // Test local environment
  await testEnvironment(LOCAL_URL, 'local');
  
  // Test production environment
  await testEnvironment(PRODUCTION_URL, 'production');
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  
  // Count successes, warnings, and errors for each environment
  const counts = {
    local: {
      success: 0,
      warning: 0,
      error: 0,
      failed: 0
    },
    production: {
      success: 0,
      warning: 0,
      error: 0,
      failed: 0
    }
  };
  
  Object.entries(results.local.endpoints).forEach(([_, result]) => {
    counts.local[result.status]++;
  });
  
  Object.entries(results.production.endpoints).forEach(([_, result]) => {
    counts.production[result.status]++;
  });
  
  console.log('Local Environment:');
  console.log(`Total Endpoints Tested: ${Object.keys(results.local.endpoints).length}`);
  console.log(`Successful: ${counts.local.success}`);
  console.log(`Warnings: ${counts.local.warning}`);
  console.log(`Errors: ${counts.local.error + counts.local.failed}`);
  
  console.log('\nProduction Environment:');
  console.log(`Total Endpoints Tested: ${Object.keys(results.production.endpoints).length}`);
  console.log(`Successful: ${counts.production.success}`);
  console.log(`Warnings: ${counts.production.warning}`);
  console.log(`Errors: ${counts.production.error + counts.production.failed}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return counts.production.success > 0 ? 0 : 1;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ At least one endpoint is working in production!' : '❌ All production endpoints failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
