const mongoose = require('mongoose');

/**
 * Document Model
 * 
 * This model represents file attachments that can be associated with RFPs or responses.
 * Documents can be requirements documents, proposals, supporting materials, etc.
 */
const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  original_filename: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  file_size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  content_type: {
    type: String,
    required: [true, 'Content type is required'],
    trim: true
  },
  document_type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: {
      values: ['rfp_document', 'response_document', 'attachment'],
      message: 'Document type must be one of: rfp_document, response_document, attachment'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  rfp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    validate: {
      validator: function(value) {
        // rfp_id should be set for rfp_document type
        return this.document_type !== 'rfp_document' || value != null;
      },
      message: 'RFP ID is required for RFP documents'
    }
  },
  response_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Response',
    validate: {
      validator: function(value) {
        // response_id should be set for response_document type
        return this.document_type !== 'response_document' || value != null;
      },
      message: 'Response ID is required for response documents'
    }
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  file_path: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  content: {
    type: String,
    // This field can store extracted text content for search purposes
    trim: true
  }
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
documentSchema.index({ rfp_id: 1 });
documentSchema.index({ response_id: 1 });
documentSchema.index({ uploaded_by: 1 });
documentSchema.index({ document_type: 1 });
documentSchema.index({ created_at: -1 });

// Virtual for file URL
documentSchema.virtual('file_url').get(function() {
  return `/uploads/${this.filename}`;
});

// Static method to find documents by RFP
documentSchema.statics.findByRFP = function(rfpId) {
  return this.find({ rfp_id: rfpId });
};

// Static method to find documents by response
documentSchema.statics.findByResponse = function(responseId) {
  return this.find({ response_id: responseId });
};

// Static method to find documents by user
documentSchema.statics.findByUser = function(userId) {
  return this.find({ uploaded_by: userId });
};

// Method to get file size in human readable format
documentSchema.methods.getReadableFileSize = function() {
  const bytes = this.file_size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

module.exports = mongoose.model('Document', documentSchema);
