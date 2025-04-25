/**
 * Test script to verify MongoDB connection and data fetching
 * Run this script with Node.js to test MongoDB connection and data fetching
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const MONGO_URI = process.env.MONGO_URI;
const API_BASE_URL = process.env.API_URL || 'https://furniture-q3nb.onrender.com';

// Connect to MongoDB directly
async function connectToMongoDB() {
  console.log(`\n🔍 Testing direct MongoDB connection to ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}\n`);
  
  try {
    console.log('Connecting to MongoDB...');
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
    
    console.log('✅ MongoDB connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Connection details:', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// Define Contact schema
function defineContactSchema() {
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
  
  // Check if model already exists to prevent overwriting
  return mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
}

// Fetch contacts directly from MongoDB
async function fetchContactsDirectly() {
  console.log('\n🔍 Fetching contacts directly from MongoDB\n');
  
  try {
    // Define Contact model
    const Contact = defineContactSchema();
    
    // Fetch contacts
    const contacts = await Contact.find().sort({ createdAt: -1 });
    console.log(`✅ Successfully fetched ${contacts.length} contacts directly from MongoDB`);
    
    // Log contacts
    if (contacts.length > 0) {
      console.log('\nSample contacts:');
      contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`\nContact ${index + 1}:`);
        console.log('ID:', contact._id);
        console.log('Name:', contact.name);
        console.log('Email:', contact.email);
        console.log('Subject:', contact.subject);
        console.log('Status:', contact.status);
        console.log('Created At:', contact.createdAt);
      });
    } else {
      console.log('No contacts found in the database');
    }
    
    return contacts;
  } catch (error) {
    console.error('❌ Error fetching contacts directly:', error.message);
    return [];
  }
}

// Fetch contacts via API
async function fetchContactsViaAPI() {
  console.log(`\n🔍 Fetching contacts via API from ${API_BASE_URL}/api/contact\n`);
  
  try {
    // Create axios instance
    const api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
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
    
    console.log(`✅ Successfully fetched ${contacts.length} contacts via API`);
    
    // Log contacts
    if (contacts.length > 0) {
      console.log('\nSample contacts from API:');
      contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`\nContact ${index + 1}:`);
        console.log('ID:', contact._id);
        console.log('Name:', contact.name);
        console.log('Email:', contact.email);
        console.log('Subject:', contact.subject);
        console.log('Status:', contact.status);
        console.log('Created At:', contact.createdAt);
      });
    } else {
      console.log('No contacts found via API');
    }
    
    return contacts;
  } catch (error) {
    console.error('❌ Error fetching contacts via API:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return [];
  }
}

// Create a new contact directly in MongoDB
async function createContactDirectly() {
  console.log('\n🔍 Creating a new contact directly in MongoDB\n');
  
  try {
    // Define Contact model
    const Contact = defineContactSchema();
    
    // Create contact data
    const contactData = {
      name: 'Test User (Direct)',
      email: 'test-direct@example.com',
      subject: 'Test Message (Direct)',
      message: 'This is a test message created directly in MongoDB at ' + new Date().toISOString(),
      phone: '1234567890',
      status: 'unread'
    };
    
    // Create contact
    const contact = await Contact.create(contactData);
    console.log('✅ Contact created successfully directly in MongoDB');
    console.log('New Contact ID:', contact._id);
    
    return contact;
  } catch (error) {
    console.error('❌ Error creating contact directly:', error.message);
    return null;
  }
}

// Create a new contact via API
async function createContactViaAPI() {
  console.log(`\n🔍 Creating a new contact via API at ${API_BASE_URL}/api/contact\n`);
  
  try {
    // Create axios instance
    const api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Create contact data
    const contactData = {
      name: 'Test User (API)',
      email: 'test-api@example.com',
      subject: 'Test Message (API)',
      message: 'This is a test message created via API at ' + new Date().toISOString(),
      phone: '0987654321',
      status: 'unread'
    };
    
    // Create contact
    const response = await api.post('/api/contact', contactData);
    console.log('API Response:', response.data);
    
    if (response.data && response.data.success) {
      console.log('✅ Contact created successfully via API');
      console.log('New Contact ID:', response.data.data._id);
      return response.data.data;
    } else {
      console.log('❌ Failed to create contact via API');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating contact via API:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting MongoDB connection and data fetching tests');
  
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  
  if (connected) {
    // Fetch contacts directly from MongoDB
    const directContacts = await fetchContactsDirectly();
    
    // Create a new contact directly in MongoDB
    const newDirectContact = await createContactDirectly();
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
  
  // Fetch contacts via API
  const apiContacts = await fetchContactsViaAPI();
  
  // Create a new contact via API
  const newApiContact = await createContactViaAPI();
  
  // Generate summary
  console.log('\n📊 Test Summary\n');
  console.log(`MongoDB Connection: ${connected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Direct Contact Fetch: ${directContacts && directContacts.length > 0 ? '✅ Success' : '❌ Failed'}`);
  console.log(`API Contact Fetch: ${apiContacts && apiContacts.length > 0 ? '✅ Success' : '❌ Failed'}`);
  console.log(`Direct Contact Creation: ${newDirectContact ? '✅ Success' : '❌ Failed'}`);
  console.log(`API Contact Creation: ${newApiContact ? '✅ Success' : '❌ Failed'}`);
  
  console.log('\n✅ Tests completed');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
});
