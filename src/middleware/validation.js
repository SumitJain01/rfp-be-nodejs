const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * 
 * This file contains validation rules for different endpoints
 * using express-validator library.
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errorMessages
    });
  }
  
  next();
};

/**
 * User Registration Validation
 */
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('role')
    .isIn(['buyer', 'supplier'])
    .withMessage('Role must be either buyer or supplier'),
  
  body('company_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

/**
 * User Login Validation
 */
const validateUserLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * RFP Creation/Update Validation
 */
const validateRFP = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  
  body('budget_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  
  body('budget_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number')
    .custom((value, { req }) => {
      if (req.body.budget_min && value < req.body.budget_min) {
        throw new Error('Maximum budget cannot be less than minimum budget');
      }
      return true;
    }),
  
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Each requirement cannot exceed 500 characters'),
  
  body('evaluation_criteria')
    .optional()
    .isArray()
    .withMessage('Evaluation criteria must be an array'),
  
  body('evaluation_criteria.*')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Each evaluation criterion cannot exceed 500 characters'),
  
  body('terms_and_conditions')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Terms and conditions cannot exceed 10000 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'closed', 'cancelled'])
    .withMessage('Status must be one of: draft, published, closed, cancelled'),
  
  handleValidationErrors
];

/**
 * Response Creation/Update Validation
 */
const validateResponse = [
  body('proposal')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Proposal must be between 10 and 10000 characters'),
  
  body('proposed_budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed budget must be a positive number'),
  
  body('timeline')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Timeline cannot exceed 1000 characters'),
  
  body('methodology')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Methodology cannot exceed 5000 characters'),
  
  body('team_details')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Team details cannot exceed 3000 characters'),
  
  body('additional_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Additional notes cannot exceed 2000 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'under_review', 'approved', 'rejected'])
    .withMessage('Status must be one of: draft, submitted, under_review, approved, rejected'),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId Validation
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid ID`),
  
  handleValidationErrors
];

/**
 * Pagination Validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateRFP,
  validateResponse,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};
