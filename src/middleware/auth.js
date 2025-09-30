const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens and adds user information to the request object.
 * It protects routes that require authentication.
 */

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid token format'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const JWT_SECRET = '7979384fb634f6affd5455d439b3e7bf57edb18c248ccc09d56b739dab2fcf0aeb00d5eb237aca0c0d809f2cbe2b4945ca6c004f8c986c9133e6b6c6ecd6533f';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Check if user has specific role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Access restricted to ${roles.join(', ')} only`
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = '7979384fb634f6affd5455d439b3e7bf57edb18c248ccc09d56b739dab2fcf0aeb00d5eb237aca0c0d809f2cbe2b4945ca6c004f8c986c9133e6b6c6ecd6533f';
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.is_active) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
