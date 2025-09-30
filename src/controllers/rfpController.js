const RFP = require('../models/RFP');
const Response = require('../models/Response');
const Document = require('../models/Document');

/**
 * RFP Controller
 * 
 * This controller handles all RFP (Request for Proposal) operations including
 * creating, reading, updating, deleting, and managing RFPs.
 */

/**
 * Get all RFPs with pagination and filtering
 * GET /api/rfps
 */
const getAllRFPs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Filter by category
    if (req.query.category) {
      filter.category = new RegExp(req.query.category, 'i');
    }
    
    // Filter by search term (title or description)
    if (req.query.search) {
      filter.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') }
      ];
    }

    // For suppliers, only show published RFPs that are not expired
    if (req.user && req.user.role === 'supplier') {
      filter.status = 'published';
      filter.deadline = { $gt: new Date() };
    }

    // For buyers, show their own RFPs
    if (req.user && req.user.role === 'buyer' && req.query.my_rfps === 'true') {
      filter.created_by = req.user._id;
    }

    const rfps = await RFP.find(filter)
      // .populate('created_by', 'username full_name company_name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await RFP.countDocuments(filter);

    res.json({
      message: 'RFPs retrieved successfully',
      data: rfps,
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
 * Get single RFP by ID
 * GET /api/rfps/:id
 */
const getRFPById = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id)
      .populate('created_by', 'username full_name company_name')
      .populate('document_ids');

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    // Check access permissions
    if (rfp.status === 'draft' && (!req.user || rfp.created_by._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own draft RFPs'
      });
    }

    res.json({
      message: 'RFP retrieved successfully',
      data: rfp
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create new RFP
 * POST /api/rfps
 */
const createRFP = async (req, res, next) => {
  try {
    const rfpData = {
      ...req.body,
      created_by: req.user._id
    };

    const rfp = new RFP(rfpData);
    await rfp.save();

    // Populate creator information
    await rfp.populate('created_by', 'username full_name company_name');

    res.status(201).json({
      message: 'RFP created successfully',
      data: rfp
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update RFP
 * PUT /api/rfps/:id
 */
const updateRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    // Check if user owns the RFP
    if (rfp.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own RFPs'
      });
    }

    // Check if RFP can be updated
    if (rfp.status === 'closed' || rfp.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cannot update RFP',
        message: 'Cannot update closed or cancelled RFPs'
      });
    }

    // Update RFP
    Object.assign(rfp, req.body);
    await rfp.save();

    // Populate creator information
    await rfp.populate('created_by', 'username full_name company_name');

    res.json({
      message: 'RFP updated successfully',
      data: rfp
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete RFP
 * DELETE /api/rfps/:id
 */
const deleteRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    // Check if user owns the RFP
    if (rfp.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own RFPs'
      });
    }

    // Check if RFP can be deleted (only drafts can be deleted)
    if (rfp.status !== 'draft') {
      return res.status(400).json({
        error: 'Cannot delete RFP',
        message: 'Only draft RFPs can be deleted'
      });
    }

    await RFP.findByIdAndDelete(req.params.id);

    res.json({
      message: 'RFP deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Publish RFP
 * POST /api/rfps/:id/publish
 */
const publishRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    // Check if user owns the RFP
    if (rfp.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only publish your own RFPs'
      });
    }

    // Check if RFP can be published
    if (rfp.status !== 'draft') {
      return res.status(400).json({
        error: 'Cannot publish RFP',
        message: 'Only draft RFPs can be published'
      });
    }

    // Update status to published
    rfp.status = 'published';
    rfp.published_at = new Date();
    await rfp.save();

    // Populate creator information
    await rfp.populate('created_by', 'username full_name company_name');

    res.json({
      message: 'RFP published successfully',
      data: rfp
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Close RFP
 * POST /api/rfps/:id/close
 */
const closeRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    // Check if user owns the RFP
    if (rfp.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only close your own RFPs'
      });
    }

    // Check if RFP can be closed
    if (rfp.status !== 'published') {
      return res.status(400).json({
        error: 'Cannot close RFP',
        message: 'Only published RFPs can be closed'
      });
    }

    // Update status to closed
    rfp.status = 'closed';
    await rfp.save();

    // Populate creator information
    await rfp.populate('created_by', 'username full_name company_name');

    res.json({
      message: 'RFP closed successfully',
      data: rfp
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get RFP responses
 * GET /api/rfps/:id/responses
 */
const getRFPResponses = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    // Check if user owns the RFP
    if (rfp.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view responses to your own RFPs'
      });
    }

    const responses = await Response.find({ rfp_id: req.params.id })
      .populate('submitted_by', 'username full_name company_name')
      .sort({ submitted_at: -1 });

    res.json({
      message: 'RFP responses retrieved successfully',
      data: responses
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRFPs,
  getRFPById,
  createRFP,
  updateRFP,
  deleteRFP,
  publishRFP,
  closeRFP,
  getRFPResponses
};
