const express = require('express');
const {
  upload,
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const {
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

/**
 * Document Routes
 * 
 * This file defines all document-related routes including
 * file upload, download, and document management operations.
 */

const router = express.Router();

/**
 * @route   POST /api/documents/upload
 * @desc    Upload document
 * @access  Private
 */
router.post('/upload', [
  authenticate,
  upload.single('file'),
  body('document_type')
    .isIn(['rfp_document', 'response_document', 'attachment'])
    .withMessage('Document type must be one of: rfp_document, response_document, attachment'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('rfp_id')
    .optional()
    .isMongoId()
    .withMessage('RFP ID must be a valid ID'),
  
  body('response_id')
    .optional()
    .isMongoId()
    .withMessage('Response ID must be a valid ID'),
  
  handleValidationErrors
], uploadDocument);

/**
 * @route   GET /api/documents
 * @desc    Get all documents with pagination and filtering
 * @access  Private
 */
router.get('/', [authenticate, validatePagination], getAllDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Get single document by ID
 * @access  Private
 */
router.get('/:id', [authenticate, validateObjectId('id')], getDocumentById);

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download document
 * @access  Private
 */
router.get('/:id/download', [authenticate, validateObjectId('id')], downloadDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete('/:id', [authenticate, validateObjectId('id')], deleteDocument);

module.exports = router;
