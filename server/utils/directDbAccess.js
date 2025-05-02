/**
 * Direct database access utility for emergency use when Mongoose models fail
 * This provides a fallback mechanism to access MongoDB collections directly
 */

const mongoose = require('mongoose');

// Get a reference to the database
const getDb = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected');
  }
  return mongoose.connection.db;
};

// Get a collection by name
const getCollection = async (collectionName) => {
  const db = getDb();
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    throw new Error(`Collection ${collectionName} not found`);
  }
  return db.collection(collectionName);
};

// Find documents in a collection
const findDocuments = async (collectionName, query = {}, options = {}) => {
  const collection = await getCollection(collectionName);
  return collection.find(query, options).toArray();
};

// Find a single document in a collection
const findOneDocument = async (collectionName, query = {}, options = {}) => {
  const collection = await getCollection(collectionName);
  return collection.findOne(query, options);
};

// Count documents in a collection
const countDocuments = async (collectionName, query = {}) => {
  const collection = await getCollection(collectionName);
  return collection.countDocuments(query);
};

// Insert a document into a collection
const insertDocument = async (collectionName, document) => {
  const collection = await getCollection(collectionName);
  return collection.insertOne(document);
};

// Update a document in a collection
const updateDocument = async (collectionName, query, update) => {
  const collection = await getCollection(collectionName);
  return collection.updateOne(query, update);
};

// Delete a document from a collection
const deleteDocument = async (collectionName, query) => {
  const collection = await getCollection(collectionName);
  return collection.deleteOne(query);
};

// Get all collection names
const getCollectionNames = async () => {
  const db = getDb();
  const collections = await db.listCollections().toArray();
  return collections.map(c => c.name);
};

module.exports = {
  getDb,
  getCollection,
  findDocuments,
  findOneDocument,
  countDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  getCollectionNames
};
