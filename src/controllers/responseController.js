const Response = require('../models/Response');
const RFP = require('../models/RFP');

/**
 * Response Controller
 * 
 * This controller handles all Response operations including
 * creating, reading, updating, and managing responses to RFPs.
 */

/**
 * Get all responses with pagination and filtering
 * GET /api/responses
 */
const getAllResponses = async (req, res, next) => {
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

    // For suppliers, only show their own responses
    if (req.user.role === 'supplier') {
      filter.submitted_by = req.user._id;
    }

    // For buyers, show responses to their RFPs
    if (req.user.role === 'buyer') {
      // First get all RFPs created by this buyer
      const buyerRFPs = await RFP.find({ created_by: req.user._id }).select('_id');
      const rfpIds = buyerRFPs.map(rfp => rfp._id);
      filter.rfp_id = { $in: rfpIds };
    }

    const responses = await Response.find(filter)
      .populate('submitted_by', 'username full_name company_name')
      .populate('rfp_id', 'title status deadline')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Response.countDocuments(filter);

    res.json({
      message: 'Responses retrieved successfully',
      data: responses,
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
 * Get single response by ID
 * GET /api/responses/:id
 */
const getResponseById = async (req, res, next) => {
  try {
    const response = await Response.findById(req.params.id)
      .populate('submitted_by', 'username full_name company_name')
      .populate('rfp_id', 'title status deadline created_by')
      .populate('document_ids');

    if (!response) {
      return res.status(404).json({
        error: 'Response not found',
        message: 'The requested response does not exist'
      });
    }

    // Check access permissions
    const isOwner = response.submitted_by._id.toString() === req.user._id.toString();
    const isRFPOwner = response.rfp_id.created_by.toString() === req.user._id.toString();

    if (!isOwner && !isRFPOwner) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own responses or responses to your RFPs'
      });
    }

    res.json({
      message: 'Response retrieved successfully',
      data: response
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create new response
 * POST /api/responses
 */
const createResponse = async (req, res, next) => {
  try {
    const { rfp_id } = req.body;

    // Check if RFP exists and is published
    const rfp = await RFP.findById(rfp_id);

    if (!rfp) {
      return res.status(404).json({
        error: 'RFP not found',
        message: 'The requested RFP does not exist'
      });
    }

    if (rfp.status !== 'published') {
      return res.status(400).json({
        error: 'Cannot respond to RFP',
        message: 'You can only respond to published RFPs'
      });
    }

    // Check if RFP deadline has passed
    if (rfp.deadline < new Date()) {
      return res.status(400).json({
        error: 'RFP expired',
        message: 'The deadline for this RFP has passed'
      });
    }

    // Check if user already has a response to this RFP
    const existingResponse = await Response.findOne({
      rfp_id,
      submitted_by: req.user._id
    });

    if (existingResponse) {
      return res.status(400).json({
        error: 'Response already exists',
        message: 'You have already submitted a response to this RFP'
      });
    }

    const responseData = {
      ...req.body,
      submitted_by: req.user._id
    };

    const response = new Response(responseData);
    await response.save();

    // Update RFP response count if response is submitted
    if (response.status === 'submitted') {
      await RFP.findByIdAndUpdate(rfp_id, {
        $inc: { response_count: 1 }
      });
    }

    // Populate related data
    await response.populate('submitted_by', 'username full_name company_name');
    await response.populate('rfp_id', 'title status deadline');

    res.status(201).json({
      message: 'Response created successfully',
      data: response
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update response
 * PUT /api/responses/:id
 */
const updateResponse = async (req, res, next) => {
  try {
    const response = await Response.findById(req.params.id).populate('rfp_id');

    if (!response) {
      return res.status(404).json({
        error: 'Response not found',
        message: 'The requested response does not exist'
      });
    }

    // Check if user owns the response
    if (response.submitted_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own responses'
      });
    }

    // Check if response can be updated
    if (['approved', 'rejected'].includes(response.status)) {
      return res.status(400).json({
        error: 'Cannot update response',
        message: 'Cannot update approved or rejected responses'
      });
    }

    // Check if RFP deadline has passed
    if (response.rfp_id.deadline < new Date()) {
      return res.status(400).json({
        error: 'RFP expired',
        message: 'Cannot update response after RFP deadline'
      });
    }

    const oldStatus = response.status;
    
    // Update response
    Object.assign(response, req.body);
    await response.save();

    // Update RFP response count if status changed from draft to submitted
    if (oldStatus === 'draft' && response.status === 'submitted') {
      await RFP.findByIdAndUpdate(response.rfp_id._id, {
        $inc: { response_count: 1 }
      });
    }

    // Populate related data
    await response.populate('submitted_by', 'username full_name company_name');
    await response.populate('rfp_id', 'title status deadline');

    res.json({
      message: 'Response updated successfully',
      data: response
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete response
 * DELETE /api/responses/:id
 */
const deleteResponse = async (req, res, next) => {
  try {
    const response = await Response.findById(req.params.id);

    if (!response) {
      return res.status(404).json({
        error: 'Response not found',
        message: 'The requested response does not exist'
      });
    }

    // Check if user owns the response
    if (response.submitted_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own responses'
      });
    }

    // Check if response can be deleted (only drafts can be deleted)
    if (response.status !== 'draft') {
      return res.status(400).json({
        error: 'Cannot delete response',
        message: 'Only draft responses can be deleted'
      });
    }

    await Response.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Response deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Submit response
 * POST /api/responses/:id/submit
 */
const submitResponse = async (req, res, next) => {
  try {
    const response = await Response.findById(req.params.id).populate('rfp_id');

    if (!response) {
      return res.status(404).json({
        error: 'Response not found',
        message: 'The requested response does not exist'
      });
    }

    // Check if user owns the response
    if (response.submitted_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only submit your own responses'
      });
    }

    // Check if response can be submitted
    if (response.status !== 'draft') {
      return res.status(400).json({
        error: 'Cannot submit response',
        message: 'Only draft responses can be submitted'
      });
    }

    // Check if RFP deadline has passed
    if (response.rfp_id.deadline < new Date()) {
      return res.status(400).json({
        error: 'RFP expired',
        message: 'Cannot submit response after RFP deadline'
      });
    }

    // Update status to submitted
    response.status = 'submitted';
    response.submitted_at = new Date();
    await response.save();

    // Update RFP response count
    await RFP.findByIdAndUpdate(response.rfp_id._id, {
      $inc: { response_count: 1 }
    });

    // Populate related data
    await response.populate('submitted_by', 'username full_name company_name');
    await response.populate('rfp_id', 'title status deadline');

    res.json({
      message: 'Response submitted successfully',
      data: response
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Review response (approve/reject)
 * POST /api/responses/:id/review
 */
const reviewResponse = async (req, res, next) => {
  try {
    const { status, reviewer_notes } = req.body;
    
    const response = await Response.findById(req.params.id).populate('rfp_id');

    if (!response) {
      return res.status(404).json({
        error: 'Response not found',
        message: 'The requested response does not exist'
      });
    }

    // Check if user owns the RFP
    if (response.rfp_id.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only review responses to your own RFPs'
      });
    }

    // Check if response can be reviewed
    if (!['submitted', 'under_review'].includes(response.status)) {
      return res.status(400).json({
        error: 'Cannot review response',
        message: 'Only submitted or under review responses can be reviewed'
      });
    }

    // Update response status and review details
    response.status = status;
    response.reviewer_notes = reviewer_notes;
    response.reviewed_at = new Date();
    await response.save();

    // Populate related data
    await response.populate('submitted_by', 'username full_name company_name');
    await response.populate('rfp_id', 'title status deadline');

    res.json({
      message: `Response ${status} successfully`,
      data: response
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllResponses,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  submitResponse,
  reviewResponse
};
