const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      bufferCommands: false
    });
    
    console.log('Connected to MongoDB!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if contacts collection exists
    const contactsCollection = collections.find(c => c.name === 'contacts');
    if (contactsCollection) {
      console.log('Contacts collection found!');
      
      // Count documents in contacts collection
      const count = await mongoose.connection.db.collection('contacts').countDocuments();
      console.log('Number of contacts:', count);
      
      // Get a sample document
      if (count > 0) {
        const sample = await mongoose.connection.db.collection('contacts').findOne();
        console.log('Sample contact:', sample);
      }
    } else {
      console.log('Contacts collection not found!');
    }
    
    // Check if products collection exists
    const productsCollection = collections.find(c => c.name === 'products');
    if (productsCollection) {
      console.log('Products collection found!');
      
      // Count documents in products collection
      const count = await mongoose.connection.db.collection('products').countDocuments();
      console.log('Number of products:', count);
      
      // Get a sample document
      if (count > 0) {
        const sample = await mongoose.connection.db.collection('products').findOne();
        console.log('Sample product:', sample);
      }
    } else {
      console.log('Products collection not found!');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Run the check
checkDatabase();
