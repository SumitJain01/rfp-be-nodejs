const mongoose = require('mongoose');

/**
 * Response Model
 * 
 * This model represents responses/proposals submitted by suppliers to RFPs.
 * Each response contains the supplier's proposal, budget, timeline, etc.
 */
const responseSchema = new mongoose.Schema({
  rfp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    required: [true, 'RFP ID is required']
  },
  submitted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter is required']
  },
  proposal: {
    type: String,
    required: [true, 'Proposal is required'],
    trim: true,
    maxlength: [10000, 'Proposal cannot exceed 10000 characters']
  },
  proposed_budget: {
    type: Number,
    min: [0, 'Proposed budget cannot be negative']
  },
  timeline: {
    type: String,
    trim: true,
    maxlength: [1000, 'Timeline cannot exceed 1000 characters']
  },
  methodology: {
    type: String,
    trim: true,
    maxlength: [5000, 'Methodology cannot exceed 5000 characters']
  },
  team_details: {
    type: String,
    trim: true,
    maxlength: [3000, 'Team details cannot exceed 3000 characters']
  },
  additional_notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Additional notes cannot exceed 2000 characters']
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      message: 'Status must be one of: draft, submitted, under_review, approved, rejected'
    },
    default: 'draft'
  },
  submitted_at: {
    type: Date,
    validate: {
      validator: function(value) {
        // submitted_at should only be set when status is not 'draft'
        return this.status === 'draft' || value != null;
      },
      message: 'Submitted date is required when status is not draft'
    }
  },
  reviewed_at: {
    type: Date,
    validate: {
      validator: function(value) {
        // reviewed_at should only be set when status is 'approved' or 'rejected'
        return !['approved', 'rejected'].includes(this.status) || value != null;
      },
      message: 'Reviewed date is required when response is approved or rejected'
    }
  },
  reviewer_notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Reviewer notes cannot exceed 2000 characters']
  },
  document_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }]
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index to ensure one response per user per RFP
responseSchema.index({ rfp_id: 1, submitted_by: 1 }, { unique: true });

// Other indexes for better query performance
responseSchema.index({ submitted_by: 1 });
responseSchema.index({ status: 1 });
responseSchema.index({ submitted_at: -1 });

// Middleware to set submitted_at when status changes from draft
responseSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'draft' && !this.submitted_at) {
    this.submitted_at = new Date();
  }
  
  if (this.isModified('status') && ['approved', 'rejected'].includes(this.status) && !this.reviewed_at) {
    this.reviewed_at = new Date();
  }
  
  next();
});

// Static method to find responses by RFP
responseSchema.statics.findByRFP = function(rfpId) {
  return this.find({ rfp_id: rfpId });
};

// Static method to find responses by user
responseSchema.statics.findByUser = function(userId) {
  return this.find({ submitted_by: userId });
};

// Static method to find submitted responses
responseSchema.statics.findSubmitted = function() {
  return this.find({ status: { $ne: 'draft' } });
};

module.exports = mongoose.model('Response', responseSchema);
