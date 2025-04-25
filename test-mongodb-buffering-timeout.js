/**
 * MongoDB Buffering Timeout Test Script
 * 
 * This script tests MongoDB connection with specific focus on the buffering timeout issue
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Configuration
const MONGO_URI = process.env.MONGO_URI;

// Test results
const results = {
  defaultBufferTimeout: false,
  increasedBufferTimeout: false,
  errors: []
};

// Define Contact schema
const createContactSchema = () => {
  return new mongoose.Schema({
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
};

// Test with default buffer timeout
async function testDefaultBufferTimeout() {
  console.log('\n🔍 Testing MongoDB connection with default buffer timeout (10000ms)');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    // Reset buffer timeout to default
    mongoose.set('bufferTimeoutMS', 10000); // Default is 10000ms
    
    // Connection options
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
    });
    
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) {
      console.log('✅ MongoDB connection successful with default buffer timeout');
      results.defaultBufferTimeout = true;
      
      // Create Contact model
      const ContactSchema = createContactSchema();
      const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
      
      // Test a query with default buffer timeout
      try {
        console.log('Testing query with default buffer timeout...');
        console.time('Default buffer timeout query');
        const contacts = await Contact.find().sort({ createdAt: -1 }).limit(5);
        console.timeEnd('Default buffer timeout query');
        console.log(`Successfully fetched ${contacts.length} contacts with default buffer timeout`);
        
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
        console.error('❌ Error querying contacts with default buffer timeout:', queryError.message);
        results.errors.push(`Error querying contacts with default buffer timeout: ${queryError.message}`);
      }
      
      // Disconnect
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } else {
      console.error(`❌ MongoDB connection state is ${connectionState} (not connected)`);
      results.errors.push(`MongoDB connection state is ${connectionState} with default buffer timeout`);
      return false;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed with default buffer timeout:', error.message);
    results.errors.push(`MongoDB connection failed with default buffer timeout: ${error.message}`);
    return false;
  }
}

// Test with increased buffer timeout
async function testIncreasedBufferTimeout() {
  console.log('\n🔍 Testing MongoDB connection with increased buffer timeout (60000ms)');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    // Set increased buffer timeout BEFORE connecting
    mongoose.set('bufferTimeoutMS', 60000); // Increase to 60000ms (60 seconds)
    
    // Connection options
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 90000,
      connectTimeoutMS: 60000,
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
    });
    
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) {
      console.log('✅ MongoDB connection successful with increased buffer timeout');
      results.increasedBufferTimeout = true;
      
      // Create Contact model
      const ContactSchema = createContactSchema();
      const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
      
      // Test a query with increased buffer timeout
      try {
        console.log('Testing query with increased buffer timeout...');
        console.time('Increased buffer timeout query');
        const contacts = await Contact.find().sort({ createdAt: -1 }).maxTimeMS(60000).limit(5);
        console.timeEnd('Increased buffer timeout query');
        console.log(`Successfully fetched ${contacts.length} contacts with increased buffer timeout`);
        
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
        console.error('❌ Error querying contacts with increased buffer timeout:', queryError.message);
        results.errors.push(`Error querying contacts with increased buffer timeout: ${queryError.message}`);
      }
      
      // Disconnect
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } else {
      console.error(`❌ MongoDB connection state is ${connectionState} (not connected)`);
      results.errors.push(`MongoDB connection state is ${connectionState} with increased buffer timeout`);
      return false;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed with increased buffer timeout:', error.message);
    results.errors.push(`MongoDB connection failed with increased buffer timeout: ${error.message}`);
    return false;
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `mongodb-buffering-timeout-test-report-${reportDate.split('T')[0]}.md`;
  
  const reportContent = `# MongoDB Buffering Timeout Test Report

Generated: ${new Date().toLocaleString()}

## Test Results

- **Default Buffer Timeout (10000ms)**: ${results.defaultBufferTimeout ? '✅ Passed' : '❌ Failed'}
- **Increased Buffer Timeout (60000ms)**: ${results.increasedBufferTimeout ? '✅ Passed' : '❌ Failed'}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **MongoDB URI**: ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined'}
- **Test Date**: ${reportDate}

## Conclusion

${results.increasedBufferTimeout 
  ? results.defaultBufferTimeout
    ? '✅ Both default and increased buffer timeout settings work correctly. The increased buffer timeout provides more time for operations to complete, which can help prevent timeouts in production environments with slower network connections.'
    : '⚠️ Only the increased buffer timeout setting works correctly. This suggests that the default buffer timeout is too short for your MongoDB operations, especially in production environments.'
  : results.defaultBufferTimeout
    ? '⚠️ Only the default buffer timeout setting works correctly. This is unexpected and suggests that there might be other issues with the increased buffer timeout configuration.'
    : '❌ Both buffer timeout settings failed. This suggests that there might be more fundamental issues with the MongoDB connection or configuration.'}

## Recommendations

${results.increasedBufferTimeout 
  ? '1. Use the increased buffer timeout setting (60000ms) in production environments.\n2. Set the buffer timeout BEFORE connecting to MongoDB.\n3. Match the maxTimeMS value in queries to the buffer timeout value.'
  : '1. Check your MongoDB Atlas configuration and network connectivity.\n2. Verify that your MongoDB Atlas cluster is accessible from your deployment environment.\n3. Consider using a different MongoDB connection approach or library.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main function
async function runTests() {
  console.log('🧪 Starting MongoDB Buffering Timeout Tests');
  
  // Test with default buffer timeout
  await testDefaultBufferTimeout();
  
  // Test with increased buffer timeout
  await testIncreasedBufferTimeout();
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Default Buffer Timeout (10000ms): ${results.defaultBufferTimeout ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Increased Buffer Timeout (60000ms): ${results.increasedBufferTimeout ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Errors: ${results.errors.length}`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return results.increasedBufferTimeout ? 0 : 1;
}

// Run the tests
runTests()
  .then(exitCode => {
    console.log(`\n${exitCode === 0 ? '✅ Increased buffer timeout test passed!' : '❌ Increased buffer timeout test failed!'}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
