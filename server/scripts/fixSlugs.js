/**
 * Script to fix products with null slugs in the database
 * Run with: node server/scripts/fixSlugs.js
 */

// Import required modules
const { MongoClient } = require('mongodb');
const slugify = require('slugify');
require('dotenv').config();

// Get MongoDB URI from environment variables
const getMongoURI = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  return uri;
};

// Fix products with null slugs
const fixNullSlugs = async () => {
  console.log('Starting to fix products with null slugs...');
  
  // Create a new MongoDB client
  const uri = getMongoURI();
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 30000,
    maxPoolSize: 5,
  };
  
  const client = new MongoClient(uri, options);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database name from connection string
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);
    
    // Get the products collection
    const productsCollection = db.collection('products');
    
    // Find products with null or undefined slugs
    const productsWithNullSlugs = await productsCollection.find({
      $or: [
        { slug: null },
        { slug: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${productsWithNullSlugs.length} products with null slugs`);
    
    // Fix each product
    for (const product of productsWithNullSlugs) {
      try {
        // Generate a slug from the product name
        let slug = '';
        
        if (product.name) {
          // Generate base slug from name using slugify
          slug = slugify(product.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
          });
          
          // If slug is empty after processing, use a fallback
          if (!slug || slug.trim() === '') {
            slug = `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
        } else {
          // If no name, generate a random slug
          slug = `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Check if the slug already exists
        let finalSlug = slug;
        let counter = 1;
        let slugExists = true;
        
        while (slugExists) {
          const existingProduct = await productsCollection.findOne({
            slug: finalSlug,
            _id: { $ne: product._id }
          });
          
          if (!existingProduct) {
            // Slug is unique
            slugExists = false;
          } else {
            // Slug exists, try with counter
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
        }
        
        // Update the product with the new slug
        const result = await productsCollection.updateOne(
          { _id: product._id },
          { $set: { slug: finalSlug } }
        );
        
        if (result.modifiedCount === 1) {
          console.log(`Fixed product ${product._id}: "${product.name}" -> slug: "${finalSlug}"`);
        } else {
          console.warn(`Failed to update product ${product._id}`);
        }
      } catch (error) {
        console.error(`Error fixing product ${product._id}:`, error);
      }
    }
    
    console.log('Finished fixing products with null slugs');
    
    // Check if there are still products with null slugs
    const remainingNullSlugs = await productsCollection.countDocuments({
      $or: [
        { slug: null },
        { slug: { $exists: false } }
      ]
    });
    
    if (remainingNullSlugs > 0) {
      console.warn(`There are still ${remainingNullSlugs} products with null slugs`);
    } else {
      console.log('All products now have valid slugs');
    }
    
  } catch (error) {
    console.error('Error fixing null slugs:', error);
  } finally {
    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  }
};

// Run the script
fixNullSlugs()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
