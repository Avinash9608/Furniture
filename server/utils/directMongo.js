/**
 * Direct MongoDB Driver Implementation
 * 
 * This module provides direct access to MongoDB collections using the MongoDB driver,
 * bypassing Mongoose for critical operations.
 */

const { getCollection, findDocuments, findOneDocument } = require('./directDbAccess');

/**
 * Get contacts collection using direct MongoDB driver
 * @returns {Promise<Array>} Array of contacts or empty array if error
 */
const getContacts = async () => {
  try {
    const contacts = await findDocuments('contacts', {}, { sort: { createdAt: -1 } });
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
    const products = await findDocuments('products', {}, { sort: { createdAt: -1 } });
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
    const categories = await findDocuments('categories', {}, { sort: { name: 1 } });
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
    const orders = await findDocuments('orders', {}, { sort: { createdAt: -1 } });
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
    const paymentSettings = await findOneDocument('paymentsettings', {});
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
    const paymentRequests = await findDocuments('paymentrequests', {}, { sort: { createdAt: -1 } });
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
