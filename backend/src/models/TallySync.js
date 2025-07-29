const mongoose = require('mongoose');

const TallySyncSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  entityType: {
    type: String,
    enum: ['voucher', 'item', 'party', 'ledger', 'company'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  tallyId: {
    type: String,
    required: true
  },
  tallyGuid: {
    type: String
  },
  syncDirection: {
    type: String,
    enum: ['to_tally', 'from_tally', 'bidirectional'],
    default: 'bidirectional'
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'conflict'],
    default: 'pending'
  },
  lastSyncDate: {
    type: Date,
    default: Date.now
  },
  lastSyncAttempt: Date,
  syncAttempts: {
    type: Number,
    default: 0
  },
  maxSyncAttempts: {
    type: Number,
    default: 3
  },
  syncError: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  },
  conflictData: {
    finSyncData: mongoose.Schema.Types.Mixed,
    tallyData: mongoose.Schema.Types.Mixed,
    conflictFields: [String],
    resolutionStrategy: {
      type: String,
      enum: ['manual', 'finsync_wins', 'tally_wins', 'merge'],
      default: 'manual'
    },
    resolvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  metadata: {
    tallyVersion: String,
    tallyCompanyPath: String,
    dataHash: String,
    lastModified: Date,
    syncSource: {
      type: String,
      enum: ['manual', 'scheduled', 'realtime', 'bulk'],
      default: 'manual'
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TallySyncSchema.index({ company: 1, entityType: 1, entityId: 1 });
TallySyncSchema.index({ company: 1, syncStatus: 1 });
TallySyncSchema.index({ company: 1, lastSyncDate: 1 });
TallySyncSchema.index({ tallyId: 1, company: 1 });
TallySyncSchema.index({ tallyGuid: 1 }, { sparse: true });
TallySyncSchema.index({ priority: 1, syncStatus: 1 });

// Compound index for efficient querying
TallySyncSchema.index({ 
  company: 1, 
  entityType: 1, 
  syncStatus: 1, 
  priority: -1 
});

// Virtual for sync age
TallySyncSchema.virtual('syncAge').get(function() {
  if (!this.lastSyncDate) return null;
  return Date.now() - this.lastSyncDate.getTime();
});

// Virtual for next retry time
TallySyncSchema.virtual('nextRetryTime').get(function() {
  if (this.syncStatus !== 'failed' || this.syncAttempts >= this.maxSyncAttempts) {
    return null;
  }
  
  // Exponential backoff: 1min, 5min, 15min
  const backoffMinutes = Math.pow(5, this.syncAttempts - 1);
  return new Date(this.lastSyncAttempt.getTime() + (backoffMinutes * 60 * 1000));
});

// Method to check if sync is due for retry
TallySyncSchema.methods.isDueForRetry = function() {
  if (this.syncStatus !== 'failed' || this.syncAttempts >= this.maxSyncAttempts) {
    return false;
  }
  
  const nextRetry = this.nextRetryTime;
  return nextRetry && Date.now() >= nextRetry.getTime();
};

// Method to mark sync as failed
TallySyncSchema.methods.markAsFailed = function(error) {
  this.syncStatus = 'failed';
  this.syncAttempts += 1;
  this.lastSyncAttempt = new Date();
  this.syncError = {
    message: error.message || 'Unknown error',
    code: error.code || 'SYNC_ERROR',
    details: error.details || {},
    timestamp: new Date()
  };
  return this.save();
};

// Method to mark sync as completed
TallySyncSchema.methods.markAsCompleted = function(tallyData = {}) {
  this.syncStatus = 'completed';
  this.lastSyncDate = new Date();
  this.syncAttempts = 0;
  this.syncError = undefined;
  
  if (tallyData.guid) {
    this.tallyGuid = tallyData.guid;
  }
  
  if (tallyData.hash) {
    this.metadata.dataHash = tallyData.hash;
  }
  
  return this.save();
};

// Method to create conflict
TallySyncSchema.methods.createConflict = function(finSyncData, tallyData, conflictFields) {
  this.syncStatus = 'conflict';
  this.conflictData = {
    finSyncData,
    tallyData,
    conflictFields,
    resolutionStrategy: 'manual'
  };
  return this.save();
};

// Static method to get pending syncs
TallySyncSchema.statics.getPendingSyncs = function(companyId, options = {}) {
  const query = {
    company: companyId,
    syncStatus: { $in: ['pending', 'failed'] },
    isActive: true
  };
  
  if (options.entityType) {
    query.entityType = options.entityType;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: 1 })
    .limit(options.limit || 100);
};

// Static method to get sync statistics
TallySyncSchema.statics.getSyncStats = function(companyId, timeframe = '24h') {
  const timeframeDuration = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const since = new Date(Date.now() - timeframeDuration[timeframe]);
  
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        lastSyncDate: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$syncStatus',
        count: { $sum: 1 },
        entityTypes: { $addToSet: '$entityType' }
      }
    }
  ]);
};

module.exports = mongoose.model('TallySync', TallySyncSchema);
