/**
 * Direct Admin Authentication Controller
 * 
 * This controller provides direct MongoDB access for admin authentication,
 * bypassing Mongoose to avoid buffering timeout issues.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findOneDocument } = require('../utils/directDbConnection');

// @desc    Login admin user with direct MongoDB access
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    console.log('Direct admin login attempt');
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'avinashmadhukar4@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
    const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

    console.log('Checking admin credentials...');
    console.log('Expected admin email:', ADMIN_EMAIL);
    console.log('Provided email:', email);

    // Compare with environment variable credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Admin credentials validated successfully');

      // Create a JWT token
      const token = jwt.sign(
        { id: 'admin-user-id', role: 'admin' },
        process.env.JWT_SECRET || 'fallback_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );

      // Return success response
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: 'admin-user-id',
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: 'admin'
        }
      });
    }

    // If not matching environment variables, try to find in database
    try {
      console.log('Checking database for admin user');
      const user = await findOneDocument('users', { email });

      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        console.log('User is not an admin');
        return res.status(401).json({
          success: false,
          message: 'Not authorized as admin'
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('Password does not match');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      console.log('Admin user found in database and password matches');

      // Create a JWT token
      const token = jwt.sign(
        { id: user._id.toString(), role: user.role },
        process.env.JWT_SECRET || 'fallback_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );

      // Return success response
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (dbError) {
      console.error('Error checking database for admin user:', dbError);
      
      // If database check fails, fall back to environment variables
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log('Falling back to environment variables after database error');
        
        // Create a JWT token
        const token = jwt.sign(
          { id: 'admin-user-id', role: 'admin' },
          process.env.JWT_SECRET || 'fallback_jwt_secret',
          { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );
        
        // Return success response
        return res.status(200).json({
          success: true,
          token,
          user: {
            _id: 'admin-user-id',
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: 'admin'
          }
        });
      }
      
      // If not matching environment variables, return error
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    console.error('Admin login error details:', {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};
