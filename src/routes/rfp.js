const express = require('express');
const {
  getAllRFPs,
  getRFPById,
  createRFP,
  updateRFP,
  deleteRFP,
  publishRFP,
  closeRFP,
  getRFPResponses
} = require('../controllers/rfpController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const {
  validateRFP,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

/**
 * RFP Routes
 * 
 * This file defines all RFP-related routes including
 * CRUD operations and RFP management actions.
 */

const router = express.Router();

/**
 * @route   GET /api/rfps
 * @desc    Get all RFPs with pagination and filtering
 * @access  Public (with optional authentication for personalized results)
 */
router.get('/', [optionalAuth, validatePagination], getAllRFPs);

/**
 * @route   GET /api/rfps/:id
 * @desc    Get single RFP by ID
 * @access  Public (with optional authentication for draft access)
 */
router.get('/:id', [optionalAuth, validateObjectId('id')], getRFPById);

/**
 * @route   POST /api/rfps
 * @desc    Create new RFP
 * @access  Private (Buyers only)
 */
router.post('/', [
  authenticate,
  authorize('buyer'),
  validateRFP
], createRFP);

/**
 * @route   PUT /api/rfps/:id
 * @desc    Update RFP
 * @access  Private (Owner only)
 */
router.put('/:id', [
  authenticate,
  authorize('buyer'),
  validateObjectId('id'),
  validateRFP
], updateRFP);

/**
 * @route   DELETE /api/rfps/:id
 * @desc    Delete RFP
 * @access  Private (Owner only)
 */
router.delete('/:id', [
  authenticate,
  authorize('buyer'),
  validateObjectId('id')
], deleteRFP);

/**
 * @route   POST /api/rfps/:id/publish
 * @desc    Publish RFP
 * @access  Private (Owner only)
 */
router.post('/:id/publish', [
  authenticate,
  authorize('buyer'),
  validateObjectId('id')
], publishRFP);

/**
 * @route   POST /api/rfps/:id/close
 * @desc    Close RFP
 * @access  Private (Owner only)
 */
router.post('/:id/close', [
  authenticate,
  authorize('buyer'),
  validateObjectId('id')
], closeRFP);

/**
 * @route   GET /api/rfps/:id/responses
 * @desc    Get RFP responses
 * @access  Private (Owner only)
 */
router.get('/:id/responses', [
  authenticate,
  authorize('buyer'),
  validateObjectId('id')
], getRFPResponses);

module.exports = router;
