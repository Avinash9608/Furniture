/**
 * Updated MongoDB Connection Test Script
 * 
 * This script tests MongoDB connection with updated settings to resolve timeout issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Configuration
const MONGO_URI = process.env.MONGO_URI;

// Test results
const results = {
  standardConnection: false,
  updatedConnection: false,
  errors: []
};

// Test standard MongoDB connection
async function testStandardConnection() {
  console.log('\n🔍 Testing standard MongoDB connection');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    // Standard connection options
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
    });
    
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) {
      console.log('✅ Standard MongoDB connection successful');
      results.standardConnection = true;
      
      // Test a simple query
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections in the database`);
        console.log('Collections:', collections.map(c => c.name).join(', '));
      } catch (queryError) {
        console.error('❌ Error querying collections:', queryError.message);
        results.errors.push(`Error querying collections with standard connection: ${queryError.message}`);
      }
      
      // Disconnect
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } else {
      console.error(`❌ Standard MongoDB connection state is ${connectionState} (not connected)`);
      results.errors.push(`Standard MongoDB connection state is ${connectionState}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Standard MongoDB connection failed:', error.message);
    results.errors.push(`Standard MongoDB connection failed: ${error.message}`);
    return false;
  }
}

// Test updated MongoDB connection
async function testUpdatedConnection() {
  console.log('\n🔍 Testing updated MongoDB connection');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    // Updated connection options based on MongoDB best practices
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for initial connection
      socketTimeoutMS: 45000, // 45 seconds timeout for queries
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
    });
    
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) {
      console.log('✅ Updated MongoDB connection successful');
      results.updatedConnection = true;
      
      // Define Contact schema
      const ContactSchema = new mongoose.Schema({
        name: {
          type: String,
          required: [true, 'Please add your name'],
          trim: true,
          maxlength: [50, 'Name cannot be more than 50 characters']
        },
        email: {
          type: String,
          required: [true, 'Please add your email'],
          match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
          ]
        },
        phone: {
          type: String,
          maxlength: [20, 'Phone number cannot be longer than 20 characters']
        },
        subject: {
          type: String,
          required: [true, 'Please add a subject'],
          maxlength: [100, 'Subject cannot be more than 100 characters']
        },
        message: {
          type: String,
          required: [true, 'Please add your message'],
          maxlength: [1000, 'Message cannot be more than 1000 characters']
        },
        status: {
          type: String,
          enum: ['unread', 'read'],
          default: 'unread'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      });
      
      // Create Contact model
      const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
      
      // Test a query with the updated connection
      try {
        console.log('Testing query with updated connection...');
        const contacts = await Contact.find().sort({ createdAt: -1 }).maxTimeMS(30000).limit(5);
        console.log(`Successfully fetched ${contacts.length} contacts with updated connection`);
        
        if (contacts.length > 0) {
          console.log('\nSample contacts:');
          contacts.forEach((contact, index) => {
            console.log(`\nContact ${index + 1}:`);
            console.log('ID:', contact._id);
            console.log('Name:', contact.name);
            console.log('Email:', contact.email);
            console.log('Subject:', contact.subject);
            console.log('Created At:', contact.createdAt);
          });
        } else {
          console.log('No contacts found in the database');
        }
      } catch (queryError) {
        console.error('❌ Error querying contacts with updated connection:', queryError.message);
        results.errors.push(`Error querying contacts with updated connection: ${queryError.message}`);
      }
      
      // Disconnect
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } else {
      console.error(`❌ Updated MongoDB connection state is ${connectionState} (not connected)`);
      results.errors.push(`Updated MongoDB connection state is ${connectionState}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Updated MongoDB connection failed:', error.message);
    results.errors.push(`Updated MongoDB connection failed: ${error.message}`);
    return false;
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `mongodb-connection-test-report-${reportDate.split('T')[0]}.md`;
  
  const reportContent = `# MongoDB Connection Test Report

Generated: ${new Date().toLocaleString()}

## Test Results

- **Standard Connection**: ${results.standardConnection ? '✅ Passed' : '❌ Failed'}
- **Updated Connection**: ${results.updatedConnection ? '✅ Passed' : '❌ Failed'}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **MongoDB URI**: ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined'}
- **Test Date**: ${reportDate}

## Conclusion

${results.updatedConnection 
  ? '✅ Updated MongoDB connection is working correctly. The timeout issues should be resolved.'
  : results.standardConnection
    ? '⚠️ Only standard MongoDB connection is working. Updated connection failed.'
    : '❌ All MongoDB connections failed. Please check your MongoDB Atlas configuration and network connectivity.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting MongoDB Connection Tests');
  
  // Test standard connection
  await testStandardConnection();
  
  // Test updated connection
  await testUpdatedConnection();
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Standard Connection: ${results.standardConnection ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Updated Connection: ${results.updatedConnection ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Errors: ${results.errors.length}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return results.updatedConnection ? 0 : 1;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ Updated connection test passed!' : '❌ Updated connection test failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
