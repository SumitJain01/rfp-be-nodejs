const mongoose = require('mongoose');

/**
 * RFP (Request for Proposal) Model
 * 
 * This model represents RFPs created by buyers.
 * Suppliers can view and respond to published RFPs.
 */
const rfpSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  budget_min: {
    type: Number,
    min: [0, 'Minimum budget cannot be negative'],
    validate: {
      validator: function(value) {
        // If budget_max is set, budget_min should be less than or equal to it
        return !this.budget_max || value <= this.budget_max;
      },
      message: 'Minimum budget cannot be greater than maximum budget'
    }
  },
  budget_max: {
    type: Number,
    min: [0, 'Maximum budget cannot be negative'],
    validate: {
      validator: function(value) {
        // If budget_min is set, budget_max should be greater than or equal to it
        return !this.budget_min || value >= this.budget_min;
      },
      message: 'Maximum budget cannot be less than minimum budget'
    }
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  requirements: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each requirement cannot exceed 500 characters']
  }],
  evaluation_criteria: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each evaluation criterion cannot exceed 500 characters']
  }],
  terms_and_conditions: {
    type: String,
    trim: true,
    maxlength: [10000, 'Terms and conditions cannot exceed 10000 characters']
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['draft', 'published', 'closed', 'cancelled'],
      message: 'Status must be one of: draft, published, closed, cancelled'
    },
    default: 'draft'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  published_at: {
    type: Date,
    validate: {
      validator: function(value) {
        // published_at should only be set when status is 'published'
        return this.status !== 'published' || value != null;
      },
      message: 'Published date is required when status is published'
    }
  },
  response_count: {
    type: Number,
    default: 0,
    min: [0, 'Response count cannot be negative']
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

// Indexes for better query performance
rfpSchema.index({ created_by: 1 });
rfpSchema.index({ status: 1 });
rfpSchema.index({ category: 1 });
rfpSchema.index({ deadline: 1 });
rfpSchema.index({ created_at: -1 });

// Middleware to set published_at when status changes to published
rfpSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.published_at) {
    this.published_at = new Date();
  }
  next();
});

// Virtual for checking if RFP is expired
rfpSchema.virtual('is_expired').get(function() {
  return this.deadline < new Date();
});

// Static method to find active RFPs
rfpSchema.statics.findActive = function() {
  return this.find({
    status: 'published',
    deadline: { $gt: new Date() }
  });
};

// Static method to find RFPs by creator
rfpSchema.statics.findByCreator = function(userId) {
  return this.find({ created_by: userId });
};

module.exports = mongoose.model('RFP', rfpSchema);
