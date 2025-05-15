/**
 * Direct Admin Authentication Controller
 * 
 * This controller provides direct MongoDB access for admin authentication,
 * bypassing Mongoose to avoid buffering timeout issues.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

// Get MongoDB URI from environment variables
const getMongoURI = () => process.env.MONGO_URI;

// @desc    Login admin user with direct MongoDB access
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  console.log('Admin login attempt');
  
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  let client;
  try {
    // Connect to MongoDB
    client = await MongoClient.connect(getMongoURI(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000
    });

    console.log('Connected to MongoDB for admin login');

    // Get database name from connection string
    const dbName = getMongoURI().split('/').pop().split('?')[0];
    const db = client.db(dbName);

    // Find user by email
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase(),
      role: 'admin'
    });

    if (!user) {
      console.log('Admin user not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Admin login successful:', email);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    // Send response with cookie
    res
      .status(200)
      .cookie('adminToken', token, cookieOptions)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
};
