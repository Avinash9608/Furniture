/**
 * Minimal Mongoose Connection Test Script
 * 
 * This script tests MongoDB connection with a minimal Mongoose setup
 * to isolate any configuration issues.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Configuration
const MONGO_URI = process.env.MONGO_URI;

// Test results
const results = {
  minimalConnection: false,
  minimalQuery: false,
  errors: []
};

// Test minimal Mongoose connection
async function testMinimalConnection() {
  console.log('\n🔍 Testing minimal Mongoose connection');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    // Explicitly set the buffering timeout
    mongoose.set('bufferTimeoutMS', 60000); // 60 seconds
    
    // Minimal connection options
    const options = {
      serverSelectionTimeoutMS: 60000, // 60 seconds timeout for initial connection
      socketTimeoutMS: 90000, // 90 seconds timeout for queries
      connectTimeoutMS: 60000, // 60 seconds timeout for initial connection
    };
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, options);
    
    // Verify the buffer timeout setting
    console.log("Mongoose buffer timeout:", mongoose.get("bufferTimeoutMS"));
    
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) {
      console.log('✅ Minimal Mongoose connection successful');
      results.minimalConnection = true;
      
      // Define a minimal Contact schema
      const ContactSchema = new mongoose.Schema({
        name: String,
        email: String,
        subject: String,
        message: String,
        status: String,
        createdAt: Date
      }, { collection: 'contacts' });
      
      // Create Contact model
      const Contact = mongoose.model('Contact', ContactSchema);
      
      // Test a minimal query
      try {
        console.log('\nTesting minimal query...');
        console.time('Minimal query');
        
        // Set the buffer timeout again before querying
        mongoose.set('bufferTimeoutMS', 60000);
        
        // Query contacts
        const contacts = await Contact.find().limit(5).maxTimeMS(60000);
        
        console.timeEnd('Minimal query');
        console.log(`Successfully fetched ${contacts.length} contacts with minimal query`);
        results.minimalQuery = true;
        
        if (contacts.length > 0) {
          console.log('\nSample contact:');
          console.log('ID:', contacts[0]._id);
          console.log('Name:', contacts[0].name);
          console.log('Email:', contacts[0].email);
          console.log('Subject:', contacts[0].subject);
        } else {
          console.log('No contacts found in the database');
        }
      } catch (queryError) {
        console.error('❌ Error with minimal query:', queryError.message);
        results.errors.push(`Error with minimal query: ${queryError.message}`);
      }
      
      // Disconnect
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } else {
      console.error(`❌ Minimal Mongoose connection state is ${connectionState} (not connected)`);
      results.errors.push(`Minimal Mongoose connection state is ${connectionState}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Minimal Mongoose connection failed:', error.message);
    results.errors.push(`Minimal Mongoose connection failed: ${error.message}`);
    return false;
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `mongodb-minimal-test-report-${reportDate.split('T')[0]}.md`;
  
  const reportContent = `# Minimal Mongoose Connection Test Report

Generated: ${new Date().toLocaleString()}

## Test Results

- **Minimal Connection**: ${results.minimalConnection ? '✅ Passed' : '❌ Failed'}
- **Minimal Query**: ${results.minimalQuery ? '✅ Passed' : '❌ Failed'}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **MongoDB URI**: ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined'}
- **Test Date**: ${reportDate}

## Conclusion

${results.minimalConnection && results.minimalQuery
  ? '✅ Minimal Mongoose connection and query are working correctly. This suggests that any issues are specific to your application configuration rather than Mongoose itself.'
  : results.minimalConnection
    ? '⚠️ Minimal Mongoose connection works, but minimal query failed. This suggests there might be issues with the Mongoose query configuration.'
    : '❌ Minimal Mongoose connection failed. This suggests there might be fundamental issues with your Mongoose configuration.'}

## Recommendations

${results.minimalConnection && results.minimalQuery
  ? '1. Review your application\'s Mongoose configuration and ensure it matches this minimal working configuration.\n2. Check for any middleware or plugins that might be interfering with Mongoose operations.'
  : '1. Simplify your Mongoose configuration to match this minimal setup.\n2. Ensure you are setting bufferTimeoutMS before connecting and before querying.\n3. Use maxTimeMS for all queries to prevent timeouts.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting Minimal Mongoose Connection Tests');
  
  // Test minimal connection
  await testMinimalConnection();
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Minimal Connection: ${results.minimalConnection ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Minimal Query: ${results.minimalQuery ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Errors: ${results.errors.length}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return results.minimalConnection && results.minimalQuery ? 0 : 1;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ Minimal Mongoose tests passed!' : '❌ Minimal Mongoose tests failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
