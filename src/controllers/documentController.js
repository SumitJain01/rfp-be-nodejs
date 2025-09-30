const Document = require('../models/Document');
const RFP = require('../models/RFP');
const Response = require('../models/Response');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

/**
 * Document Controller
 * 
 * This controller handles all document operations including
 * uploading, downloading, and managing files associated with RFPs and responses.
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, text, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

/**
 * Upload document
 * POST /api/documents/upload
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const {
      document_type,
      description,
      rfp_id,
      response_id
    } = req.body;

    // Validate document type and associated IDs
    if (document_type === 'rfp_document' && !rfp_id) {
      return res.status(400).json({
        error: 'RFP ID required',
        message: 'RFP ID is required for RFP documents'
      });
    }

    if (document_type === 'response_document' && !response_id) {
      return res.status(400).json({
        error: 'Response ID required',
        message: 'Response ID is required for response documents'
      });
    }

    // Verify RFP exists and user has access
    if (rfp_id) {
      const rfp = await RFP.findById(rfp_id);
      if (!rfp) {
        return res.status(404).json({
          error: 'RFP not found',
          message: 'The specified RFP does not exist'
        });
      }

      // Check if user owns the RFP
      if (rfp.created_by.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only upload documents to your own RFPs'
        });
      }
    }

    // Verify Response exists and user has access
    if (response_id) {
      const response = await Response.findById(response_id);
      if (!response) {
        return res.status(404).json({
          error: 'Response not found',
          message: 'The specified response does not exist'
        });
      }

      // Check if user owns the response
      if (response.submitted_by.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only upload documents to your own responses'
        });
      }
    }

    // Create document record
    const document = new Document({
      filename: req.file.filename,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      content_type: req.file.mimetype,
      document_type,
      description,
      rfp_id: rfp_id || undefined,
      response_id: response_id || undefined,
      uploaded_by: req.user._id,
      file_path: req.file.path
    });

    await document.save();

    // Update RFP or Response with document ID
    if (rfp_id) {
      await RFP.findByIdAndUpdate(rfp_id, {
        $push: { document_ids: document._id }
      });
    }

    if (response_id) {
      await Response.findByIdAndUpdate(response_id, {
        $push: { document_ids: document._id }
      });
    }

    // Populate uploader information
    await document.populate('uploaded_by', 'username full_name company_name');

    res.status(201).json({
      message: 'Document uploaded successfully',
      data: document
    });

  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * Get all documents with pagination and filtering
 * GET /api/documents
 */
const getAllDocuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Filter by document type
    if (req.query.document_type) {
      filter.document_type = req.query.document_type;
    }

    // Filter by RFP ID
    if (req.query.rfp_id) {
      filter.rfp_id = req.query.rfp_id;
    }

    // Filter by Response ID
    if (req.query.response_id) {
      filter.response_id = req.query.response_id;
    }

    // Filter by uploader (show only user's documents unless they're viewing specific RFP/Response)
    if (!req.query.rfp_id && !req.query.response_id) {
      filter.uploaded_by = req.user._id;
    }

    const documents = await Document.find(filter)
      .populate('uploaded_by', 'username full_name company_name')
      .populate('rfp_id', 'title')
      .populate('response_id', 'proposal')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(filter);

    res.json({
      message: 'Documents retrieved successfully',
      data: documents,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single document by ID
 * GET /api/documents/:id
 */
const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploaded_by', 'username full_name company_name')
      .populate('rfp_id', 'title created_by')
      .populate('response_id', 'proposal submitted_by');

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // Check access permissions
    const isOwner = document.uploaded_by._id.toString() === req.user._id.toString();
    let hasAccess = isOwner;

    // Check if user has access through RFP ownership
    if (document.rfp_id && document.rfp_id.created_by.toString() === req.user._id.toString()) {
      hasAccess = true;
    }

    // Check if user has access through Response ownership
    if (document.response_id && document.response_id.submitted_by.toString() === req.user._id.toString()) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this document'
      });
    }

    res.json({
      message: 'Document retrieved successfully',
      data: document
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Download document
 * GET /api/documents/:id/download
 */
const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('rfp_id', 'created_by')
      .populate('response_id', 'submitted_by');

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // Check access permissions (same logic as getDocumentById)
    const isOwner = document.uploaded_by.toString() === req.user._id.toString();
    let hasAccess = isOwner;

    if (document.rfp_id && document.rfp_id.created_by.toString() === req.user._id.toString()) {
      hasAccess = true;
    }

    if (document.response_id && document.response_id.submitted_by.toString() === req.user._id.toString()) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to download this document'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.file_path);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The document file no longer exists on the server'
      });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
    res.setHeader('Content-Type', document.content_type);
    res.setHeader('Content-Length', document.file_size);

    // Stream the file
    res.sendFile(path.resolve(document.file_path));

  } catch (error) {
    next(error);
  }
};

/**
 * Delete document
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }

    // Check if user owns the document
    if (document.uploaded_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own documents'
      });
    }

    // Remove document ID from RFP or Response
    if (document.rfp_id) {
      await RFP.findByIdAndUpdate(document.rfp_id, {
        $pull: { document_ids: document._id }
      });
    }

    if (document.response_id) {
      await Response.findByIdAndUpdate(document.response_id, {
        $pull: { document_ids: document._id }
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument
};
