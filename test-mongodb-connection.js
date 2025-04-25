/**
 * Test script to verify MongoDB connection and data operations
 * Run this script with Node.js to test MongoDB connection and CRUD operations
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const MONGO_URI = process.env.MONGO_URI;
const API_BASE_URL = process.env.API_URL || 'https://furniture-q3nb.onrender.com';
const TEST_ENDPOINTS = [
  { name: 'Health Check', path: '/api/health' },
  { name: 'Categories', path: '/api/categories' },
  { name: 'Products', path: '/api/products' },
  { name: 'Contact Messages', path: '/api/contact' },
  { name: 'Orders', path: '/api/orders' },
  { name: 'Payment Requests', path: '/api/payment-requests/all' },
  { name: 'Payment Settings', path: '/api/payment-settings/all' }
];

// Create a direct axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Test MongoDB connection directly
async function testMongoDBConnection() {
  console.log(`\n🔍 Testing MongoDB connection to ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined URI'}\n`);
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
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
    
    // Test basic CRUD operations
    await testCRUDOperations();
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('MongoDB Server Selection Error - Check network connectivity and MongoDB Atlas status');
    } else if (error.name === 'MongoNetworkError') {
      console.error('MongoDB Network Error - Check firewall settings and network connectivity');
    }
    return false;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
  }
}

// Test basic CRUD operations
async function testCRUDOperations() {
  console.log('\n🔍 Testing basic CRUD operations\n');
  
  try {
    // Create a test schema
    const TestSchema = new mongoose.Schema({
      name: String,
      value: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    // Create a test model
    const TestModel = mongoose.model('TestModel', TestSchema);
    
    // Create a test document
    console.log('Creating test document...');
    const testDoc = await TestModel.create({
      name: 'test_' + Date.now(),
      value: 'This is a test document created at ' + new Date().toISOString()
    });
    console.log('✅ Created test document:', testDoc._id);
    
    // Read the test document
    console.log('Reading test document...');
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Found test document:', foundDoc._id);
    
    // Update the test document
    console.log('Updating test document...');
    const updatedDoc = await TestModel.findByIdAndUpdate(
      testDoc._id,
      { value: 'Updated at ' + new Date().toISOString() },
      { new: true }
    );
    console.log('✅ Updated test document:', updatedDoc.value);
    
    // Delete the test document
    console.log('Deleting test document...');
    const deleteResult = await TestModel.findByIdAndDelete(testDoc._id);
    console.log('✅ Deleted test document:', deleteResult._id);
    
    // Clean up - drop the test collection
    await mongoose.connection.db.dropCollection('testmodels');
    console.log('✅ Dropped test collection');
    
    return true;
  } catch (error) {
    console.error('❌ CRUD operations error:', error.message);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log(`\n🔍 Testing API endpoints on ${API_BASE_URL}\n`);
  
  const results = {
    success: [],
    failure: []
  };
  
  // First test the health endpoint
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await api.get('/api/health');
    console.log('✅ Health check response:', healthResponse.data);
    
    if (healthResponse.data.services && healthResponse.data.services.mongodb) {
      console.log('MongoDB status from API:', healthResponse.data.services.mongodb);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
  
  // Test all other endpoints
  for (const endpoint of TEST_ENDPOINTS) {
    if (endpoint.name === 'Health Check') continue; // Already tested
    
    try {
      console.log(`Testing ${endpoint.name} endpoint: ${API_BASE_URL}${endpoint.path}`);
      const response = await api.get(endpoint.path);
      
      // Check if response has data
      if (response.data) {
        // Handle different response structures
        let data = [];
        
        if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.data) {
          // If data.data is not an array but exists, convert to array
          data = [response.data.data];
        } else if (response.data) {
          // If data exists but not in expected format, try to use it
          data = [response.data];
        }
        
        const count = Array.isArray(data) ? data.length : 'unknown';
        
        console.log(`✅ ${endpoint.name}: Success - ${count} items found`);
        
        // Log first item as sample if available
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   Sample item ID: ${JSON.stringify(data[0]._id)}`);
        }
        
        results.success.push({
          name: endpoint.name,
          path: endpoint.path,
          count: count,
          data: Array.isArray(data) && data.length > 0 ? data.slice(0, 1) : []
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
  
  return results;
}

// Test creating a contact message
async function testCreateContactMessage() {
  console.log('\n🔍 Testing contact message creation\n');
  
  try {
    const testMessage = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Message',
      message: 'This is a test message created at ' + new Date().toISOString(),
      phone: '1234567890'
    };
    
    console.log('Creating test contact message...');
    const response = await api.post('/api/contact', testMessage);
    
    console.log('✅ Contact message created successfully');
    console.log('Response:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error creating contact message:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    
    return {
      success: false,
      error: error.message,
      response: error.response?.data
    };
  }
}

// Test creating a category
async function testCreateCategory() {
  console.log('\n🔍 Testing category creation\n');
  
  try {
    const testCategory = {
      name: 'Test Category ' + Date.now(),
      description: 'This is a test category created at ' + new Date().toISOString(),
      slug: 'test-category-' + Date.now()
    };
    
    console.log('Creating test category...');
    const response = await api.post('/api/categories', testCategory);
    
    console.log('✅ Category created successfully');
    console.log('Response:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error creating category:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    
    return {
      success: false,
      error: error.message,
      response: error.response?.data
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting MongoDB and API tests');
  
  // Test MongoDB connection
  const mongoConnected = await testMongoDBConnection();
  
  // Test API endpoints
  const apiResults = await testAPIEndpoints();
  
  // Test creating a contact message
  const contactResult = await testCreateContactMessage();
  
  // Test creating a category
  const categoryResult = await testCreateCategory();
  
  // Generate summary
  console.log('\n📊 Test Summary\n');
  console.log(`MongoDB Connection: ${mongoConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`API Endpoints: ${apiResults.success.length} succeeded, ${apiResults.failure.length} failed`);
  console.log(`Contact Message Creation: ${contactResult.success ? '✅ Succeeded' : '❌ Failed'}`);
  console.log(`Category Creation: ${categoryResult.success ? '✅ Succeeded' : '❌ Failed'}`);
  
  console.log('\n🔍 Detailed Results\n');
  console.log('API Endpoints:');
  console.log('  Succeeded:', apiResults.success.map(s => s.name).join(', '));
  console.log('  Failed:', apiResults.failure.map(f => f.name).join(', '));
  
  console.log('\n✅ Tests completed');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
});
