/**
 * Category Controller
 * 
 * Handles all category-related operations with robust error handling
 * and guaranteed persistence.
 */

const { MongoClient, ObjectId } = require('mongodb');

// Get the MongoDB URI from environment variables
const getMongoURI = () => process.env.MONGO_URI;

/**
 * Create a new category with guaranteed persistence
 */
const createCategory = async (req, res) => {
  console.log('Creating category with data:', req.body);
  
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(200).json({
        success: false,
        message: 'Please provide a category name',
      });
    }
    
    // Create the category data
    const categoryData = {
      name: req.body.name,
      description: req.body.description || '',
      slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Category data to be saved:', categoryData);
    
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let savedCategory = null;
    
    try {
      console.log('Attempting to save category using direct MongoDB driver');
      
      // Get the MongoDB URI
      const uri = getMongoURI();
      
      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5
      };
      
      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();
      
      // Get database name from connection string
      const dbName = uri.split('/').pop().split('?')[0];
      const db = client.db(dbName);
      
      console.log(`MongoDB connection established to database: ${dbName}`);
      
      // Check if category with same name already exists
      const categoriesCollection = db.collection('categories');
      const existingCategory = await categoriesCollection.findOne({ 
        name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') } 
      });
      
      if (existingCategory) {
        return res.status(200).json({
          success: false,
          message: 'Category with this name already exists',
          data: existingCategory
        });
      }
      
      // Insert the category into the categories collection
      console.log('Inserting category into database');
      const result = await categoriesCollection.insertOne(categoryData);
      
      if (result.acknowledged) {
        console.log('Category created successfully:', result);
        
        // Verify the category was saved by fetching it back
        savedCategory = await categoriesCollection.findOne({ _id: result.insertedId });
        
        if (!savedCategory) {
          throw new Error('Category verification failed');
        }
        
        console.log('Category verified in database:', savedCategory._id);
      } else {
        throw new Error('Insert operation not acknowledged');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log('MongoDB connection closed');
      }
    }
    
    // Verify that the category was saved
    if (!savedCategory) {
      throw new Error('Category was not saved');
    }
    
    // Return success response
    return res.status(201).json({
      success: true,
      data: savedCategory,
      method: 'direct-mongodb',
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || 'Error creating category',
      error: error.stack
    });
  }
};

/**
 * Get all categories with guaranteed retrieval
 */
const getAllCategories = async (req, res) => {
  console.log('Fetching all categories');
  
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let categories = [];
    
    try {
      console.log('Attempting to fetch categories using direct MongoDB driver');
      
      // Get the MongoDB URI
      const uri = getMongoURI();
      
      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5
      };
      
      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();
      
      // Get database name from connection string
      const dbName = uri.split('/').pop().split('?')[0];
      const db = client.db(dbName);
      
      console.log(`MongoDB connection established to database: ${dbName}`);
      
      // Fetch categories from the categories collection
      console.log('Fetching categories from database');
      const categoriesCollection = db.collection('categories');
      categories = await categoriesCollection.find({}).sort({ name: 1 }).toArray();
      
      console.log(`Fetched ${categories.length} categories from database`);
      
      // Count products in each category
      try {
        const productsCollection = db.collection('products');
        
        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          const productCount = await productsCollection.countDocuments({ 
            category: category._id.toString() 
          });
          
          categories[i] = {
            ...category,
            productCount
          };
        }
      } catch (countError) {
        console.error('Error counting products in categories:', countError);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log('MongoDB connection closed');
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      method: 'direct-mongodb'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || 'Error fetching categories',
      error: error.stack,
      data: []
    });
  }
};

/**
 * Get category by ID with guaranteed retrieval
 */
const getCategoryById = async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching category with ID: ${id}`);
  
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let category = null;
    
    try {
      console.log('Attempting to fetch category using direct MongoDB driver');
      
      // Get the MongoDB URI
      const uri = getMongoURI();
      
      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5
      };
      
      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();
      
      // Get database name from connection string
      const dbName = uri.split('/').pop().split('?')[0];
      const db = client.db(dbName);
      
      console.log(`MongoDB connection established to database: ${dbName}`);
      
      // Fetch category from the categories collection
      console.log('Fetching category from database');
      const categoriesCollection = db.collection('categories');
      
      try {
        category = await categoriesCollection.findOne({ _id: new ObjectId(id) });
      } catch (idError) {
        console.error('Error with ObjectId:', idError);
        category = await categoriesCollection.findOne({ _id: id });
      }
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      console.log('Fetched category from database:', category._id);
      
      // Count products in this category
      try {
        const productsCollection = db.collection('products');
        const productCount = await productsCollection.countDocuments({ 
          category: category._id.toString() 
        });
        
        category.productCount = productCount;
      } catch (countError) {
        console.error('Error counting products in category:', countError);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log('MongoDB connection closed');
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      data: category,
      method: 'direct-mongodb'
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || 'Error fetching category',
      error: error.stack
    });
  }
};

/**
 * Update category by ID with guaranteed persistence
 */
const updateCategory = async (req, res) => {
  const { id } = req.params;
  console.log(`Updating category with ID: ${id}`);
  console.log('Update data:', req.body);
  
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(200).json({
        success: false,
        message: 'Please provide a category name',
      });
    }
    
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    let updatedCategory = null;
    
    try {
      console.log('Attempting to update category using direct MongoDB driver');
      
      // Get the MongoDB URI
      const uri = getMongoURI();
      
      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5
      };
      
      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();
      
      // Get database name from connection string
      const dbName = uri.split('/').pop().split('?')[0];
      const db = client.db(dbName);
      
      console.log(`MongoDB connection established to database: ${dbName}`);
      
      // Fetch the existing category
      const categoriesCollection = db.collection('categories');
      
      let existingCategory;
      try {
        existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
      } catch (idError) {
        existingCategory = await categoriesCollection.findOne({ _id: id });
      }
      
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      // Check if another category with the same name already exists
      if (req.body.name !== existingCategory.name) {
        const duplicateCategory = await categoriesCollection.findOne({ 
          name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
          _id: { $ne: existingCategory._id }
        });
        
        if (duplicateCategory) {
          return res.status(200).json({
            success: false,
            message: 'Another category with this name already exists',
            data: duplicateCategory
          });
        }
      }
      
      // Create the update data
      const updateData = {
        $set: {
          name: req.body.name,
          description: req.body.description || existingCategory.description || '',
          slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          updatedAt: new Date()
        }
      };
      
      console.log('Update data:', updateData);
      
      // Update the category
      const result = await categoriesCollection.updateOne(
        { _id: existingCategory._id },
        updateData
      );
      
      if (result.modifiedCount === 1) {
        console.log('Category updated successfully');
        
        // Fetch the updated category
        updatedCategory = await categoriesCollection.findOne({ _id: existingCategory._id });
        
        // Count products in this category
        try {
          const productsCollection = db.collection('products');
          const productCount = await productsCollection.countDocuments({ 
            category: updatedCategory._id.toString() 
          });
          
          updatedCategory.productCount = productCount;
        } catch (countError) {
          console.error('Error counting products in category:', countError);
        }
      } else {
        throw new Error('Category update failed');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log('MongoDB connection closed');
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      data: updatedCategory,
      method: 'direct-mongodb',
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || 'Error updating category',
      error: error.stack
    });
  }
};

/**
 * Delete category by ID with guaranteed deletion
 */
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting category with ID: ${id}`);
  
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Create a new direct MongoDB connection specifically for this operation
    let client = null;
    
    try {
      console.log('Attempting to delete category using direct MongoDB driver');
      
      // Get the MongoDB URI
      const uri = getMongoURI();
      
      // Direct connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 5
      };
      
      // Create a new MongoClient
      client = new MongoClient(uri, options);
      await client.connect();
      
      // Get database name from connection string
      const dbName = uri.split('/').pop().split('?')[0];
      const db = client.db(dbName);
      
      console.log(`MongoDB connection established to database: ${dbName}`);
      
      // Fetch the existing category
      const categoriesCollection = db.collection('categories');
      
      let existingCategory;
      try {
        existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
      } catch (idError) {
        existingCategory = await categoriesCollection.findOne({ _id: id });
      }
      
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      // Check if there are products using this category
      const productsCollection = db.collection('products');
      const productCount = await productsCollection.countDocuments({ 
        category: existingCategory._id.toString() 
      });
      
      if (productCount > 0) {
        return res.status(200).json({
          success: false,
          message: `Cannot delete category because it is used by ${productCount} products`,
          data: { productCount }
        });
      }
      
      // Delete the category
      const result = await categoriesCollection.deleteOne({ _id: existingCategory._id });
      
      if (result.deletedCount !== 1) {
        throw new Error('Category deletion failed');
      }
      
      console.log('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    } finally {
      // Close the MongoDB client
      if (client) {
        await client.close();
        console.log('MongoDB connection closed');
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      method: 'direct-mongodb',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    // Return error response
    return res.status(200).json({
      success: false,
      message: error.message || 'Error deleting category',
      error: error.stack
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
