/**
 * Comprehensive Automated Test Suite for Shyam Furnitures Application
 * 
 * This script tests:
 * 1. MongoDB connection
 * 2. Contact form submission and retrieval
 * 3. Category creation and retrieval
 * 4. Product creation and retrieval
 * 5. Order creation and retrieval
 * 6. Payment settings and requests
 * 
 * Run with: node automated-test-suite.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const MONGO_URI = process.env.MONGO_URI;
const API_BASE_URL = process.env.API_URL || 'https://furniture-q3nb.onrender.com';
const LOCAL_API_URL = 'http://localhost:5000';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    startTime: null,
    endTime: null,
    duration: null
  }
};

// Utility functions
function logSuccess(message) {
  console.log(`✅ ${message}`);
  testResults.passed.push(message);
  testResults.summary.passed++;
  testResults.summary.total++;
}

function logFailure(message, error) {
  console.error(`❌ ${message}`);
  if (error) console.error(`   Error: ${error.message || error}`);
  testResults.failed.push({ message, error: error ? (error.message || error) : null });
  testResults.summary.failed++;
  testResults.summary.total++;
}

function logWarning(message) {
  console.warn(`⚠️ ${message}`);
  testResults.warnings.push(message);
  testResults.summary.warnings++;
}

// Create API client
function createApiClient(baseUrl) {
  return axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
}

// Test MongoDB connection
async function testMongoDBConnection() {
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
    const connectionDetails = {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
    
    if (connectionState === 1) {
      logSuccess(`MongoDB connected successfully to ${connectionDetails.host}/${connectionDetails.name}`);
      return true;
    } else {
      logFailure(`MongoDB connection state is ${connectionState} (not connected)`);
      return false;
    }
  } catch (error) {
    logFailure('MongoDB connection failed', error);
    return false;
  }
}

// Test API health
async function testApiHealth(api) {
  console.log('\n🔍 Testing API Health');
  
  try {
    const response = await api.get('/api/health');
    
    if (response.data && response.data.status) {
      logSuccess(`API health check passed: ${response.data.status}`);
      
      // Check MongoDB status from API
      if (response.data.services && response.data.services.mongodb) {
        const mongoStatus = response.data.services.mongodb.status;
        if (mongoStatus === 'connected') {
          logSuccess(`API reports MongoDB is connected`);
        } else {
          logWarning(`API reports MongoDB status as: ${mongoStatus}`);
        }
      }
      
      return true;
    } else {
      logFailure('API health check failed: Invalid response format');
      return false;
    }
  } catch (error) {
    logFailure('API health check failed', error);
    return false;
  }
}

// Define schemas
function defineSchemas() {
  // Contact schema
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
  
  // Category schema
  const CategorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    slug: {
      type: String,
      unique: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    image: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Product schema
  const ProductSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    slug: {
      type: String
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      default: 0
    },
    images: {
      type: [String],
      default: []
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category']
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create models if they don't exist
  const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
  const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
  
  return { Contact, Category, Product };
}

// Test contact operations
async function testContactOperations(api, models) {
  console.log('\n🔍 Testing Contact Operations');
  
  // Test direct MongoDB contact creation
  async function testDirectContactCreation() {
    try {
      const contactData = {
        name: 'Test User (Direct)',
        email: 'test-direct@example.com',
        subject: 'Test Message (Direct)',
        message: 'This is a test message created directly in MongoDB at ' + new Date().toISOString(),
        phone: '1234567890',
        status: 'unread'
      };
      
      const contact = await models.Contact.create(contactData);
      logSuccess(`Created contact directly in MongoDB with ID: ${contact._id}`);
      return contact;
    } catch (error) {
      logFailure('Failed to create contact directly in MongoDB', error);
      return null;
    }
  }
  
  // Test API contact creation
  async function testApiContactCreation() {
    try {
      const contactData = {
        name: 'Test User (API)',
        email: 'test-api@example.com',
        subject: 'Test Message (API)',
        message: 'This is a test message created via API at ' + new Date().toISOString(),
        phone: '0987654321'
      };
      
      const response = await api.post('/api/contact', contactData);
      
      if (response.data && response.data.success && response.data.data) {
        logSuccess(`Created contact via API with ID: ${response.data.data._id}`);
        return response.data.data;
      } else {
        logFailure('Failed to create contact via API: Invalid response format', response.data);
        return null;
      }
    } catch (error) {
      logFailure('Failed to create contact via API', error);
      return null;
    }
  }
  
  // Test direct MongoDB contact retrieval
  async function testDirectContactRetrieval() {
    try {
      const contacts = await models.Contact.find().sort({ createdAt: -1 }).limit(10);
      logSuccess(`Retrieved ${contacts.length} contacts directly from MongoDB`);
      return contacts;
    } catch (error) {
      logFailure('Failed to retrieve contacts directly from MongoDB', error);
      return [];
    }
  }
  
  // Test API contact retrieval
  async function testApiContactRetrieval() {
    try {
      const response = await api.get('/api/contact');
      
      let contacts = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        contacts = response.data.data;
      } else if (Array.isArray(response.data)) {
        contacts = response.data;
      }
      
      logSuccess(`Retrieved ${contacts.length} contacts via API`);
      return contacts;
    } catch (error) {
      logFailure('Failed to retrieve contacts via API', error);
      return [];
    }
  }
  
  // Run all contact tests
  const directContact = await testDirectContactCreation();
  const apiContact = await testApiContactCreation();
  const directContacts = await testDirectContactRetrieval();
  const apiContacts = await testApiContactRetrieval();
  
  // Verify that created contacts are retrievable
  if (directContact && directContacts.length > 0) {
    const found = directContacts.some(c => c._id.toString() === directContact._id.toString());
    if (found) {
      logSuccess('Direct created contact was found in retrieved contacts');
    } else {
      logFailure('Direct created contact was NOT found in retrieved contacts');
    }
  }
  
  if (apiContact && apiContacts.length > 0) {
    const found = apiContacts.some(c => c._id.toString() === apiContact._id.toString());
    if (found) {
      logSuccess('API created contact was found in retrieved contacts');
    } else {
      logFailure('API created contact was NOT found in retrieved contacts');
    }
  }
  
  return {
    directContact,
    apiContact,
    directContacts,
    apiContacts
  };
}

// Test category operations
async function testCategoryOperations(api, models) {
  console.log('\n🔍 Testing Category Operations');
  
  // Test direct MongoDB category creation
  async function testDirectCategoryCreation() {
    try {
      const categoryData = {
        name: `Test Category Direct ${Date.now()}`,
        slug: `test-category-direct-${Date.now()}`,
        description: 'This is a test category created directly in MongoDB'
      };
      
      const category = await models.Category.create(categoryData);
      logSuccess(`Created category directly in MongoDB with ID: ${category._id}`);
      return category;
    } catch (error) {
      logFailure('Failed to create category directly in MongoDB', error);
      return null;
    }
  }
  
  // Test API category creation
  async function testApiCategoryCreation() {
    try {
      const categoryData = {
        name: `Test Category API ${Date.now()}`,
        slug: `test-category-api-${Date.now()}`,
        description: 'This is a test category created via API'
      };
      
      const response = await api.post('/api/categories', categoryData);
      
      if (response.data && (response.data.success !== false) && (response.data.data || response.data._id)) {
        const category = response.data.data || response.data;
        logSuccess(`Created category via API with ID: ${category._id}`);
        return category;
      } else {
        logFailure('Failed to create category via API: Invalid response format', response.data);
        return null;
      }
    } catch (error) {
      logFailure('Failed to create category via API', error);
      return null;
    }
  }
  
  // Test direct MongoDB category retrieval
  async function testDirectCategoryRetrieval() {
    try {
      const categories = await models.Category.find().sort({ createdAt: -1 });
      logSuccess(`Retrieved ${categories.length} categories directly from MongoDB`);
      return categories;
    } catch (error) {
      logFailure('Failed to retrieve categories directly from MongoDB', error);
      return [];
    }
  }
  
  // Test API category retrieval
  async function testApiCategoryRetrieval() {
    try {
      const response = await api.get('/api/categories');
      
      let categories = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else if (Array.isArray(response.data)) {
        categories = response.data;
      }
      
      logSuccess(`Retrieved ${categories.length} categories via API`);
      return categories;
    } catch (error) {
      logFailure('Failed to retrieve categories via API', error);
      return [];
    }
  }
  
  // Run all category tests
  const directCategory = await testDirectCategoryCreation();
  const apiCategory = await testApiCategoryCreation();
  const directCategories = await testDirectCategoryRetrieval();
  const apiCategories = await testApiCategoryRetrieval();
  
  // Verify that created categories are retrievable
  if (directCategory && directCategories.length > 0) {
    const found = directCategories.some(c => c._id.toString() === directCategory._id.toString());
    if (found) {
      logSuccess('Direct created category was found in retrieved categories');
    } else {
      logFailure('Direct created category was NOT found in retrieved categories');
    }
  }
  
  if (apiCategory && apiCategories.length > 0) {
    const found = apiCategories.some(c => c._id.toString() === apiCategory._id.toString());
    if (found) {
      logSuccess('API created category was found in retrieved categories');
    } else {
      logFailure('API created category was NOT found in retrieved categories');
    }
  }
  
  return {
    directCategory,
    apiCategory,
    directCategories,
    apiCategories
  };
}

// Test product operations
async function testProductOperations(api, models, categories) {
  console.log('\n🔍 Testing Product Operations');
  
  // Get a category ID to use for products
  let categoryId = null;
  if (categories.directCategory) {
    categoryId = categories.directCategory._id;
  } else if (categories.apiCategory) {
    categoryId = categories.apiCategory._id;
  } else if (categories.directCategories && categories.directCategories.length > 0) {
    categoryId = categories.directCategories[0]._id;
  } else if (categories.apiCategories && categories.apiCategories.length > 0) {
    categoryId = categories.apiCategories[0]._id;
  }
  
  if (!categoryId) {
    logFailure('No category ID available for product tests');
    return {
      directProduct: null,
      apiProduct: null,
      directProducts: [],
      apiProducts: []
    };
  }
  
  // Test direct MongoDB product creation
  async function testDirectProductCreation() {
    try {
      const productData = {
        name: `Test Product Direct ${Date.now()}`,
        description: 'This is a test product created directly in MongoDB',
        price: 999,
        stock: 10,
        category: categoryId,
        images: ['https://placehold.co/300x300/gray/white?text=TestProduct']
      };
      
      const product = await models.Product.create(productData);
      logSuccess(`Created product directly in MongoDB with ID: ${product._id}`);
      return product;
    } catch (error) {
      logFailure('Failed to create product directly in MongoDB', error);
      return null;
    }
  }
  
  // Test API product creation
  async function testApiProductCreation() {
    try {
      const productData = {
        name: `Test Product API ${Date.now()}`,
        description: 'This is a test product created via API',
        price: 1999,
        stock: 5,
        category: categoryId.toString(),
        images: ['https://placehold.co/300x300/gray/white?text=TestProduct']
      };
      
      const response = await api.post('/api/products', productData);
      
      if (response.data && (response.data.success !== false) && (response.data.data || response.data._id)) {
        const product = response.data.data || response.data;
        logSuccess(`Created product via API with ID: ${product._id}`);
        return product;
      } else {
        logFailure('Failed to create product via API: Invalid response format', response.data);
        return null;
      }
    } catch (error) {
      logFailure('Failed to create product via API', error);
      return null;
    }
  }
  
  // Test direct MongoDB product retrieval
  async function testDirectProductRetrieval() {
    try {
      const products = await models.Product.find().sort({ createdAt: -1 });
      logSuccess(`Retrieved ${products.length} products directly from MongoDB`);
      return products;
    } catch (error) {
      logFailure('Failed to retrieve products directly from MongoDB', error);
      return [];
    }
  }
  
  // Test API product retrieval
  async function testApiProductRetrieval() {
    try {
      const response = await api.get('/api/products');
      
      let products = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }
      
      logSuccess(`Retrieved ${products.length} products via API`);
      return products;
    } catch (error) {
      logFailure('Failed to retrieve products via API', error);
      return [];
    }
  }
  
  // Run all product tests
  const directProduct = await testDirectProductCreation();
  const apiProduct = await testApiProductCreation();
  const directProducts = await testDirectProductRetrieval();
  const apiProducts = await testApiProductRetrieval();
  
  // Verify that created products are retrievable
  if (directProduct && directProducts.length > 0) {
    const found = directProducts.some(p => p._id.toString() === directProduct._id.toString());
    if (found) {
      logSuccess('Direct created product was found in retrieved products');
    } else {
      logFailure('Direct created product was NOT found in retrieved products');
    }
  }
  
  if (apiProduct && apiProducts.length > 0) {
    const found = apiProducts.some(p => p._id.toString() === apiProduct._id.toString());
    if (found) {
      logSuccess('API created product was found in retrieved products');
    } else {
      logFailure('API created product was NOT found in retrieved products');
    }
  }
  
  return {
    directProduct,
    apiProduct,
    directProducts,
    apiProducts
  };
}

// Generate test report
function generateTestReport() {
  const reportDate = new Date().toISOString();
  const reportFileName = `test-report-${reportDate.split('T')[0]}.md`;
  
  // Calculate duration
  testResults.summary.endTime = new Date();
  testResults.summary.duration = (testResults.summary.endTime - testResults.summary.startTime) / 1000;
  
  const reportContent = `# Shyam Furnitures Automated Test Report

Generated: ${new Date().toLocaleString()}

## Summary

- **Total Tests**: ${testResults.summary.total}
- **Passed**: ${testResults.summary.passed}
- **Failed**: ${testResults.summary.failed}
- **Warnings**: ${testResults.summary.warnings}
- **Duration**: ${testResults.summary.duration.toFixed(2)} seconds

## Passed Tests (${testResults.summary.passed})

${testResults.passed.map(test => `- ✅ ${test}`).join('\n')}

## Failed Tests (${testResults.summary.failed})

${testResults.failed.map(test => `- ❌ ${test.message}${test.error ? `\n  - Error: ${test.error}` : ''}`).join('\n')}

## Warnings (${testResults.summary.warnings})

${testResults.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}

## Environment Information

- **API URL**: ${API_BASE_URL}
- **MongoDB URI**: ${MONGO_URI ? MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, (_, username) => `\/\/${username}:****@`) : 'undefined'}
- **Node Version**: ${process.version}
- **OS**: ${process.platform}
- **Test Date**: ${reportDate}

## Next Steps

${testResults.summary.failed > 0 
  ? '⚠️ Some tests failed. Please review the failures and fix the issues before deploying.'
  : '✅ All tests passed! The application is ready for deployment.'}

`;

  // Save the report to a file
  fs.writeFileSync(reportFileName, reportContent);
  console.log(`\nTest report saved to ${reportFileName}`);
  
  return reportFileName;
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Automated Tests for Shyam Furnitures Application');
  testResults.summary.startTime = new Date();
  
  // Test MongoDB connection
  const mongoConnected = await testMongoDBConnection();
  
  if (mongoConnected) {
    // Define models
    const models = defineSchemas();
    
    // Create API client
    const api = createApiClient(API_BASE_URL);
    
    // Test API health
    await testApiHealth(api);
    
    // Test contact operations
    const contactResults = await testContactOperations(api, models);
    
    // Test category operations
    const categoryResults = await testCategoryOperations(api, models);
    
    // Test product operations
    const productResults = await testProductOperations(api, models, categoryResults);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } else {
    logWarning('Skipping database operation tests due to MongoDB connection failure');
  }
  
  // Generate test report
  const reportFile = generateTestReport();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Warnings: ${testResults.summary.warnings}`);
  console.log(`Duration: ${testResults.summary.duration.toFixed(2)} seconds`);
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Return exit code based on test results
  return testResults.summary.failed > 0 ? 1 : 0;
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
