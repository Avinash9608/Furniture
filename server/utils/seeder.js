const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user'
  }
];

const categories = [
  {
    name: 'Sofas',
    description: 'Comfortable sofas and couches for your living room',
    image: 'no-image.jpg'
  },
  {
    name: 'Beds',
    description: 'Luxurious beds for a good night sleep',
    image: 'no-image.jpg'
  },
  {
    name: 'Tables',
    description: 'Dining tables, coffee tables, and more',
    image: 'no-image.jpg'
  },
  {
    name: 'Chairs',
    description: 'Chairs for dining, office, and relaxation',
    image: 'no-image.jpg'
  },
  {
    name: 'Wardrobes',
    description: 'Spacious wardrobes for your bedroom',
    image: 'no-image.jpg'
  }
];

// Import data into DB
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();

    // Create users
    const createdUsers = await User.create(users);
    const adminUser = createdUsers[0]._id;

    // Create categories
    const createdCategories = await Category.create(categories);

    // Create sample products
    const products = [
      {
        name: 'Modern Sofa Set',
        description: 'A comfortable and stylish sofa set for your living room. Made with high-quality materials for durability and comfort.',
        price: 24999,
        category: createdCategories[0]._id,
        stock: 15,
        images: ['no-image.jpg'],
        featured: true,
        dimensions: {
          length: 220,
          width: 90,
          height: 85
        },
        material: 'Fabric',
        color: 'Grey'
      },
      {
        name: 'King Size Bed',
        description: 'A luxurious king size bed with a comfortable mattress. Perfect for a good night sleep.',
        price: 32999,
        category: createdCategories[1]._id,
        stock: 10,
        images: ['no-image.jpg'],
        featured: true,
        dimensions: {
          length: 200,
          width: 180,
          height: 100
        },
        material: 'Wood',
        color: 'Brown'
      },
      {
        name: 'Wooden Dining Table',
        description: 'A beautiful wooden dining table for your family meals. Can accommodate up to 6 people.',
        price: 18999,
        category: createdCategories[2]._id,
        stock: 8,
        images: ['no-image.jpg'],
        featured: true,
        dimensions: {
          length: 180,
          width: 90,
          height: 75
        },
        material: 'Solid Wood',
        color: 'Natural Wood'
      },
      {
        name: 'Ergonomic Office Chair',
        description: 'An ergonomic office chair for comfortable working hours. Adjustable height and lumbar support.',
        price: 9999,
        category: createdCategories[3]._id,
        stock: 20,
        images: ['no-image.jpg'],
        featured: true,
        dimensions: {
          length: 60,
          width: 60,
          height: 120
        },
        material: 'Mesh and Metal',
        color: 'Black'
      },
      {
        name: 'Spacious Wardrobe',
        description: 'A spacious wardrobe with multiple compartments for all your clothes and accessories.',
        price: 27999,
        category: createdCategories[4]._id,
        stock: 5,
        images: ['no-image.jpg'],
        featured: true,
        dimensions: {
          length: 150,
          width: 60,
          height: 200
        },
        material: 'Engineered Wood',
        color: 'White'
      }
    ];

    await Product.create(products);

    console.log('Data Imported...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check command line argument
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
