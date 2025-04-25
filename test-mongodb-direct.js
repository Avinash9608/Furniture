/**
 * Direct MongoDB Connection Test Script
 * 
 * This script tests MongoDB connection directly using the MongoDB driver
 * without Mongoose to isolate any Mongoose-specific issues.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Configuration
const MONGO_URI = process.env.MONGO_URI;

// Test results
const results = {
  directConnection: false,
  directQuery: false,
  errors: []
};

// Test direct MongoDB connection
async function testDirectConnection() {
  console.log('\n🔍 Testing direct MongoDB connection using MongoDB driver');
  
  let client = null;
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    // Direct connection options
    const options = {
      serverSelectionTimeoutMS: 60000, // 60 seconds timeout for initial connection
      socketTimeoutMS: 90000, // 90 seconds timeout for queries
      connectTimeoutMS: 60000, // 60 seconds timeout for initial connection
      maxPoolSize: 10,
    };
    
    // Create a new MongoClient
    client = new MongoClient(MONGO_URI, options);
    
    // Connect to the MongoDB server
    await client.connect();
    console.log('✅ Direct MongoDB connection successful');
    results.directConnection = true;
    
    // Get database name from connection string
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    console.log(`Using database: ${dbName}`);
    
    // Get database
    const db = client.db(dbName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in the database`);
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    // Test a direct query
    try {
      console.log('\nTesting direct query...');
      console.time('Direct query');
      
      // Query the contacts collection
      const contactsCollection = db.collection('contacts');
      const contacts = await contactsCollection.find({}).limit(5).toArray();
      
      console.timeEnd('Direct query');
      console.log(`Successfully fetched ${contacts.length} contacts with direct query`);
      results.directQuery = true;
      
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
      console.error('❌ Error with direct query:', queryError.message);
      results.errors.push(`Error with direct query: ${queryError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Direct MongoDB connection failed:', error.message);
    results.errors.push(`Direct MongoDB connection failed: ${error.message}`);
    return false;
  } finally {
    // Close the connection
    if (client) {
      await client.close();
      console.log('Closed MongoDB connection');
    }
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `mongodb-direct-test-report-${reportDate.split('T')[0]}.md`;
  
  const reportContent = `# Direct MongoDB Connection Test Report

Generated: ${new Date().toLocaleString()}

## Test Results

- **Direct Connection**: ${results.directConnection ? '✅ Passed' : '❌ Failed'}
- **Direct Query**: ${results.directQuery ? '✅ Passed' : '❌ Failed'}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **MongoDB URI**: ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined'}
- **Test Date**: ${reportDate}

## Conclusion

${results.directConnection && results.directQuery
  ? '✅ Direct MongoDB connection and query are working correctly. This suggests that any issues are specific to Mongoose rather than the MongoDB connection itself.'
  : results.directConnection
    ? '⚠️ Direct MongoDB connection works, but direct query failed. This suggests there might be issues with the database or collection.'
    : '❌ Direct MongoDB connection failed. This suggests there might be fundamental connectivity issues with MongoDB.'}

## Recommendations

${results.directConnection && results.directQuery
  ? '1. If you are experiencing issues with Mongoose, consider using the MongoDB driver directly or updating your Mongoose configuration.\n2. Make sure your Mongoose models match the actual schema in the database.'
  : '1. Check your MongoDB Atlas configuration and network connectivity.\n2. Verify that your MongoDB Atlas cluster is accessible from your deployment environment.\n3. Check if your IP address is whitelisted in MongoDB Atlas.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting Direct MongoDB Connection Tests');
  
  // Test direct connection
  await testDirectConnection();
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Direct Connection: ${results.directConnection ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Direct Query: ${results.directQuery ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Errors: ${results.errors.length}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return results.directConnection && results.directQuery ? 0 : 1;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ Direct MongoDB tests passed!' : '❌ Direct MongoDB tests failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
