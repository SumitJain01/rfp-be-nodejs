const express = require('express');
const {
  getAllResponses,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  submitResponse,
  reviewResponse
} = require('../controllers/responseController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateResponse,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

/**
 * Response Routes
 * 
 * This file defines all response-related routes including
 * CRUD operations and response management actions.
 */

const router = express.Router();

/**
 * @route   GET /api/responses
 * @desc    Get all responses with pagination and filtering
 * @access  Private
 */
router.get('/', [authenticate, validatePagination], getAllResponses);

/**
 * @route   GET /api/responses/:id
 * @desc    Get single response by ID
 * @access  Private
 */
router.get('/:id', [authenticate, validateObjectId('id')], getResponseById);

/**
 * @route   POST /api/responses
 * @desc    Create new response
 * @access  Private (Suppliers only)
 */
router.post('/', [
  authenticate,
  authorize('supplier'),
  body('rfp_id')
    .isMongoId()
    .withMessage('RFP ID must be a valid ID'),
  validateResponse
], createResponse);

/**
 * @route   PUT /api/responses/:id
 * @desc    Update response
 * @access  Private (Owner only)
 */
router.put('/:id', [
  authenticate,
  authorize('supplier'),
  validateObjectId('id'),
  validateResponse
], updateResponse);

/**
 * @route   DELETE /api/responses/:id
 * @desc    Delete response
 * @access  Private (Owner only)
 */
router.delete('/:id', [
  authenticate,
  authorize('supplier'),
  validateObjectId('id')
], deleteResponse);

/**
 * @route   POST /api/responses/:id/submit
 * @desc    Submit response
 * @access  Private (Owner only)
 */
router.post('/:id/submit', [
  authenticate,
  authorize('supplier'),
  validateObjectId('id')
], submitResponse);

/**
 * @route   POST /api/responses/:id/review
 * @desc    Review response (approve/reject)
 * @access  Private (RFP Owner only)
 */
router.post('/:id/review', [
  authenticate,
  authorize('buyer'),
  validateObjectId('id'),
  body('status')
    .isIn(['approved', 'rejected', 'under_review'])
    .withMessage('Status must be one of: approved, rejected, under_review'),
  
  body('reviewer_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Reviewer notes cannot exceed 2000 characters'),
  
  handleValidationErrors
], reviewResponse);

module.exports = router;
