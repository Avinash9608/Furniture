/**
 * Direct MongoDB Driver Implementation
 * 
 * This module provides direct access to MongoDB collections using the MongoDB driver,
 * bypassing Mongoose for critical operations.
 */

const { directDB } = require('./db');

/**
 * Get contacts collection using direct MongoDB driver
 * @returns {Promise<Array>} Array of contacts or empty array if error
 */
const getContacts = async () => {
  try {
    // Ensure we have a connection
    let db = directDB.getDB();
    
    if (!db) {
      db = await directDB.connect();
    }
    
    if (!db) {
      console.error('Failed to connect to MongoDB using direct driver');
      return [];
    }
    
    // Query the contacts collection
    const contactsCollection = db.collection('contacts');
    const contacts = await contactsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`Successfully fetched ${contacts.length} contacts using direct MongoDB driver`);
    return contacts;
  } catch (error) {
    console.error('Error fetching contacts using direct MongoDB driver:', error);
    return [];
  }
};

/**
 * Get products collection using direct MongoDB driver
 * @returns {Promise<Array>} Array of products or empty array if error
 */
const getProducts = async () => {
  try {
    // Ensure we have a connection
    let db = directDB.getDB();
    
    if (!db) {
      db = await directDB.connect();
    }
    
    if (!db) {
      console.error('Failed to connect to MongoDB using direct driver');
      return [];
    }
    
    // Query the products collection
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`Successfully fetched ${products.length} products using direct MongoDB driver`);
    return products;
  } catch (error) {
    console.error('Error fetching products using direct MongoDB driver:', error);
    return [];
  }
};

/**
 * Get categories collection using direct MongoDB driver
 * @returns {Promise<Array>} Array of categories or empty array if error
 */
const getCategories = async () => {
  try {
    // Ensure we have a connection
    let db = directDB.getDB();
    
    if (!db) {
      db = await directDB.connect();
    }
    
    if (!db) {
      console.error('Failed to connect to MongoDB using direct driver');
      return [];
    }
    
    // Query the categories collection
    const categoriesCollection = db.collection('categories');
    const categories = await categoriesCollection.find({}).sort({ name: 1 }).toArray();
    
    console.log(`Successfully fetched ${categories.length} categories using direct MongoDB driver`);
    return categories;
  } catch (error) {
    console.error('Error fetching categories using direct MongoDB driver:', error);
    return [];
  }
};

/**
 * Get orders collection using direct MongoDB driver
 * @returns {Promise<Array>} Array of orders or empty array if error
 */
const getOrders = async () => {
  try {
    // Ensure we have a connection
    let db = directDB.getDB();
    
    if (!db) {
      db = await directDB.connect();
    }
    
    if (!db) {
      console.error('Failed to connect to MongoDB using direct driver');
      return [];
    }
    
    // Query the orders collection
    const ordersCollection = db.collection('orders');
    const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`Successfully fetched ${orders.length} orders using direct MongoDB driver`);
    return orders;
  } catch (error) {
    console.error('Error fetching orders using direct MongoDB driver:', error);
    return [];
  }
};

/**
 * Get payment settings using direct MongoDB driver
 * @returns {Promise<Object>} Payment settings or null if error
 */
const getPaymentSettings = async () => {
  try {
    // Ensure we have a connection
    let db = directDB.getDB();
    
    if (!db) {
      db = await directDB.connect();
    }
    
    if (!db) {
      console.error('Failed to connect to MongoDB using direct driver');
      return null;
    }
    
    // Query the payment settings collection
    const paymentSettingsCollection = db.collection('paymentsettings');
    const paymentSettings = await paymentSettingsCollection.findOne({});
    
    console.log('Successfully fetched payment settings using direct MongoDB driver');
    return paymentSettings;
  } catch (error) {
    console.error('Error fetching payment settings using direct MongoDB driver:', error);
    return null;
  }
};

/**
 * Get payment requests using direct MongoDB driver
 * @returns {Promise<Array>} Array of payment requests or empty array if error
 */
const getPaymentRequests = async () => {
  try {
    // Ensure we have a connection
    let db = directDB.getDB();
    
    if (!db) {
      db = await directDB.connect();
    }
    
    if (!db) {
      console.error('Failed to connect to MongoDB using direct driver');
      return [];
    }
    
    // Query the payment requests collection
    const paymentRequestsCollection = db.collection('paymentrequests');
    const paymentRequests = await paymentRequestsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`Successfully fetched ${paymentRequests.length} payment requests using direct MongoDB driver`);
    return paymentRequests;
  } catch (error) {
    console.error('Error fetching payment requests using direct MongoDB driver:', error);
    return [];
  }
};

module.exports = {
  getContacts,
  getProducts,
  getCategories,
  getOrders,
  getPaymentSettings,
  getPaymentRequests
};
