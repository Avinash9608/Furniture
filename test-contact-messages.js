/**
 * Contact Messages Test Script for Shyam Furnitures
 * 
 * This script specifically tests the contact message functionality:
 * 1. MongoDB connection
 * 2. Direct contact message creation in MongoDB
 * 3. Contact message creation via API
 * 4. Contact message retrieval from MongoDB
 * 5. Contact message retrieval via API
 * 6. Verification that no mock data is being returned
 * 
 * Run with: node test-contact-messages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

// Configuration
const MONGO_URI = process.env.MONGO_URI;
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

// Test results
const results = {
  mongoConnection: false,
  directCreation: false,
  apiCreation: false,
  directRetrieval: false,
  apiRetrieval: false,
  noMockData: false,
  createdContactId: null,
  retrievedContacts: [],
  errors: []
};

// Connect to MongoDB
async function connectToMongoDB() {
  console.log('\n🔍 Testing MongoDB Connection');
  
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}`);
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      connectTimeoutMS: 30000,
      keepAlive: true,
      keepAliveInitialDelay: 300000
    });
    
    const connectionState = mongoose.connection.readyState;
    
    if (connectionState === 1) {
      console.log('✅ MongoDB connected successfully');
      results.mongoConnection = true;
      return true;
    } else {
      console.error(`❌ MongoDB connection state is ${connectionState} (not connected)`);
      results.errors.push(`MongoDB connection state is ${connectionState}`);
      return false;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    results.errors.push(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}

// Create contact directly in MongoDB
async function createContactDirectly() {
  console.log('\n🔍 Creating contact directly in MongoDB');
  
  try {
    // Define Contact model
    const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
    
    // Create contact data with timestamp to ensure uniqueness
    const timestamp = new Date().toISOString();
    const contactData = {
      name: `Test User Direct ${Date.now()}`,
      email: `test-direct-${Date.now()}@example.com`,
      subject: `Test Message Direct ${timestamp}`,
      message: `This is a test message created directly in MongoDB at ${timestamp}`,
      phone: '1234567890',
      status: 'unread'
    };
    
    // Create contact
    const contact = await Contact.create(contactData);
    console.log('✅ Contact created successfully directly in MongoDB');
    console.log('New Contact ID:', contact._id);
    
    results.directCreation = true;
    results.createdContactId = contact._id;
    return contact;
  } catch (error) {
    console.error('❌ Error creating contact directly:', error.message);
    results.errors.push(`Error creating contact directly: ${error.message}`);
    return null;
  }
}

// Create contact via API
async function createContactViaAPI() {
  console.log('\n🔍 Creating contact via API');
  
  try {
    // Create contact data with timestamp to ensure uniqueness
    const timestamp = new Date().toISOString();
    const contactData = {
      name: `Test User API ${Date.now()}`,
      email: `test-api-${Date.now()}@example.com`,
      subject: `Test Message API ${timestamp}`,
      message: `This is a test message created via API at ${timestamp}`,
      phone: '0987654321'
    };
    
    // Create contact
    const response = await api.post('/api/contact', contactData);
    console.log('API Response:', response.data);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Contact created successfully via API');
      console.log('New Contact ID:', response.data.data._id);
      results.apiCreation = true;
      return response.data.data;
    } else {
      console.error('❌ Failed to create contact via API:', response.data);
      results.errors.push(`Failed to create contact via API: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating contact via API:', error.message);
    results.errors.push(`Error creating contact via API: ${error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

// Retrieve contacts directly from MongoDB
async function retrieveContactsDirectly() {
  console.log('\n🔍 Retrieving contacts directly from MongoDB');
  
  try {
    // Define Contact model
    const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
    
    // Fetch contacts
    const contacts = await Contact.find().sort({ createdAt: -1 }).limit(10);
    console.log(`✅ Successfully retrieved ${contacts.length} contacts directly from MongoDB`);
    
    // Log sample contacts
    if (contacts.length > 0) {
      console.log('\nSample contacts:');
      contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`\nContact ${index + 1}:`);
        console.log('ID:', contact._id);
        console.log('Name:', contact.name);
        console.log('Email:', contact.email);
        console.log('Subject:', contact.subject);
        console.log('Created At:', contact.createdAt);
      });
    }
    
    results.directRetrieval = true;
    results.retrievedContacts = contacts;
    return contacts;
  } catch (error) {
    console.error('❌ Error retrieving contacts directly:', error.message);
    results.errors.push(`Error retrieving contacts directly: ${error.message}`);
    return [];
  }
}

// Retrieve contacts via API
async function retrieveContactsViaAPI() {
  console.log('\n🔍 Retrieving contacts via API');
  
  try {
    // Fetch contacts
    const response = await api.get('/api/contact');
    console.log('API Response:', response.data);
    
    // Extract contacts from response
    let contacts = [];
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      contacts = response.data.data;
    } else if (Array.isArray(response.data)) {
      contacts = response.data;
    }
    
    console.log(`✅ Successfully retrieved ${contacts.length} contacts via API`);
    
    // Log sample contacts
    if (contacts.length > 0) {
      console.log('\nSample contacts from API:');
      contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`\nContact ${index + 1}:`);
        console.log('ID:', contact._id);
        console.log('Name:', contact.name);
        console.log('Email:', contact.email);
        console.log('Subject:', contact.subject);
        console.log('Created At:', contact.createdAt);
      });
    }
    
    results.apiRetrieval = true;
    return contacts;
  } catch (error) {
    console.error('❌ Error retrieving contacts via API:', error.message);
    results.errors.push(`Error retrieving contacts via API: ${error.message}`);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return [];
  }
}

// Check for mock data
function checkForMockData(contacts) {
  console.log('\n🔍 Checking for mock data');
  
  // Define patterns that would indicate mock data
  const mockPatterns = [
    /John Doe/i,
    /Jane Smith/i,
    /test@example\.com/i,
    /john@example\.com/i,
    /jane@example\.com/i,
    /Product Inquiry/i,
    /Order Status/i,
    /mock_/i,
    /I'm interested in your wooden chairs/i,
    /Do you ship internationally/i,
    /I placed an order last week/i
  ];
  
  // Check each contact against mock patterns
  const mockContacts = contacts.filter(contact => {
    return mockPatterns.some(pattern => 
      pattern.test(contact.name) || 
      pattern.test(contact.email) || 
      pattern.test(contact.subject) || 
      pattern.test(contact.message) ||
      (contact._id && pattern.test(contact._id.toString()))
    );
  });
  
  if (mockContacts.length > 0) {
    console.error(`❌ Found ${mockContacts.length} contacts that appear to be mock data`);
    console.log('Sample mock contacts:');
    mockContacts.slice(0, 3).forEach((contact, index) => {
      console.log(`\nMock Contact ${index + 1}:`);
      console.log('ID:', contact._id);
      console.log('Name:', contact.name);
      console.log('Email:', contact.email);
      console.log('Subject:', contact.subject);
    });
    results.noMockData = false;
    results.errors.push(`Found ${mockContacts.length} contacts that appear to be mock data`);
  } else {
    console.log('✅ No mock data detected in contacts');
    results.noMockData = true;
  }
  
  return mockContacts.length === 0;
}

// Verify created contact is retrievable
function verifyCreatedContact(createdId, retrievedContacts) {
  console.log('\n🔍 Verifying created contact is retrievable');
  
  if (!createdId) {
    console.log('⚠️ No created contact ID to verify');
    return false;
  }
  
  if (!retrievedContacts || retrievedContacts.length === 0) {
    console.log('⚠️ No retrieved contacts to check against');
    return false;
  }
  
  const found = retrievedContacts.some(contact => 
    contact._id.toString() === createdId.toString()
  );
  
  if (found) {
    console.log('✅ Created contact was found in retrieved contacts');
    return true;
  } else {
    console.error('❌ Created contact was NOT found in retrieved contacts');
    results.errors.push('Created contact was NOT found in retrieved contacts');
    return false;
  }
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `contact-messages-test-report-${reportDate.split('T')[0]}.md`;
  
  const reportContent = `# Contact Messages Test Report for Shyam Furnitures

Generated: ${new Date().toLocaleString()}

## Test Results

- **MongoDB Connection**: ${results.mongoConnection ? '✅ Passed' : '❌ Failed'}
- **Direct Contact Creation**: ${results.directCreation ? '✅ Passed' : '❌ Failed'}
- **API Contact Creation**: ${results.apiCreation ? '✅ Passed' : '❌ Failed'}
- **Direct Contact Retrieval**: ${results.directRetrieval ? '✅ Passed' : '❌ Failed'}
- **API Contact Retrieval**: ${results.apiRetrieval ? '✅ Passed' : '❌ Failed'}
- **No Mock Data**: ${results.noMockData ? '✅ Passed' : '❌ Failed'}

## Retrieved Contacts

Total contacts retrieved: ${results.retrievedContacts.length}

${results.retrievedContacts.length > 0 ? `
Sample contacts:
${results.retrievedContacts.slice(0, 3).map((contact, index) => `
### Contact ${index + 1}
- **ID**: ${contact._id}
- **Name**: ${contact.name}
- **Email**: ${contact.email}
- **Subject**: ${contact.subject}
- **Created At**: ${contact.createdAt}
`).join('')}
` : 'No contacts retrieved.'}

## Errors

${results.errors.length > 0 ? results.errors.map(error => `- ${error}`).join('\n') : 'No errors occurred during testing.'}

## Environment Information

- **API URL**: ${API_BASE_URL}
- **MongoDB URI**: ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined'}
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
  console.log('🧪 Starting Contact Messages Tests for Shyam Furnitures');
  
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  
  if (connected) {
    // Create contact directly in MongoDB
    const directContact = await createContactDirectly();
    
    // Retrieve contacts directly from MongoDB
    const directContacts = await retrieveContactsDirectly();
    
    // Check for mock data in direct contacts
    checkForMockData(directContacts);
    
    // Verify created contact is retrievable
    if (directContact && directContacts.length > 0) {
      verifyCreatedContact(directContact._id, directContacts);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
  
  // Create contact via API
  const apiContact = await createContactViaAPI();
  
  // Retrieve contacts via API
  const apiContacts = await retrieveContactsViaAPI();
  
  // Check for mock data in API contacts
  if (apiContacts && apiContacts.length > 0) {
    checkForMockData(apiContacts);
  }
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`MongoDB Connection: ${results.mongoConnection ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Direct Contact Creation: ${results.directCreation ? '✅ Passed' : '❌ Failed'}`);
  console.log(`API Contact Creation: ${results.apiCreation ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Direct Contact Retrieval: ${results.directRetrieval ? '✅ Passed' : '❌ Failed'}`);
  console.log(`API Contact Retrieval: ${results.apiRetrieval ? '✅ Passed' : '❌ Failed'}`);
  console.log(`No Mock Data: ${results.noMockData ? '✅ Passed' : '❌ Failed'}`);
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
