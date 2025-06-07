const mongoose = require('mongoose');

const TallyConnectionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  agentId: {
    type: String,
    required: true,
    unique: true
  },
  agentVersion: {
    type: String,
    required: true
  },
  connectionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'maintenance'],
    default: 'disconnected'
  },
  tallyInfo: {
    version: String,
    release: String,
    build: String,
    companyPath: String,
    companyName: String,
    companyGuid: String,
    licenseInfo: {
      type: String,
      educational: Boolean,
      multiUser: Boolean,
      expiryDate: Date
    }
  },
  systemInfo: {
    os: String,
    osVersion: String,
    architecture: String,
    hostname: String,
    ipAddress: String,
    macAddress: String,
    totalMemory: Number,
    freeMemory: Number,
    cpuInfo: String
  },
  connectionDetails: {
    protocol: {
      type: String,
      enum: ['websocket', 'tcp', 'http'],
      default: 'websocket'
    },
    port: Number,
    secure: { type: Boolean, default: false },
    lastHeartbeat: Date,
    heartbeatInterval: { type: Number, default: 30000 }, // 30 seconds
    reconnectAttempts: { type: Number, default: 0 },
    maxReconnectAttempts: { type: Number, default: 5 }
  },
  capabilities: {
    xmlImport: { type: Boolean, default: true },
    xmlExport: { type: Boolean, default: true },
    realTimeSync: { type: Boolean, default: false },
    bulkOperations: { type: Boolean, default: true },
    fileTransfer: { type: Boolean, default: false },
    remoteExecution: { type: Boolean, default: false }
  },
  syncSettings: {
    autoSync: { type: Boolean, default: false },
    syncInterval: { type: Number, default: 300000 }, // 5 minutes
    syncOnStartup: { type: Boolean, default: true },
    syncOnShutdown: { type: Boolean, default: true },
    conflictResolution: {
      type: String,
      enum: ['manual', 'finsync_wins', 'tally_wins', 'timestamp'],
      default: 'manual'
    },
    enabledEntities: {
      vouchers: { type: Boolean, default: true },
      items: { type: Boolean, default: true },
      parties: { type: Boolean, default: true },
      ledgers: { type: Boolean, default: true },
      companies: { type: Boolean, default: false }
    }
  },
  performance: {
    avgResponseTime: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    lastPerformanceUpdate: Date
  },
  security: {
    authToken: String,
    encryptionEnabled: { type: Boolean, default: true },
    certificateFingerprint: String,
    lastSecurityCheck: Date,
    trustedCertificates: [String]
  },
  logs: [{
    timestamp: { type: Date, default: Date.now },
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      default: 'info'
    },
    message: String,
    details: mongoose.Schema.Types.Mixed
  }],
  lastConnected: Date,
  lastDisconnected: Date,
  totalUptime: { type: Number, default: 0 }, // in milliseconds
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

// Indexes
TallyConnectionSchema.index({ company: 1, status: 1 });
TallyConnectionSchema.index({ agentId: 1 }, { unique: true });
TallyConnectionSchema.index({ connectionId: 1 });
TallyConnectionSchema.index({ 'tallyInfo.companyGuid': 1 });
TallyConnectionSchema.index({ lastConnected: 1 });

// Virtual for connection uptime
TallyConnectionSchema.virtual('currentUptime').get(function() {
  if (this.status !== 'connected' || !this.lastConnected) return 0;
  return Date.now() - this.lastConnected.getTime();
});

// Virtual for connection health
TallyConnectionSchema.virtual('connectionHealth').get(function() {
  if (this.status !== 'connected') return 'disconnected';
  
  const lastHeartbeat = this.connectionDetails.lastHeartbeat;
  if (!lastHeartbeat) return 'unknown';
  
  const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
  const heartbeatInterval = this.connectionDetails.heartbeatInterval;
  
  if (timeSinceHeartbeat > heartbeatInterval * 3) return 'unhealthy';
  if (timeSinceHeartbeat > heartbeatInterval * 2) return 'warning';
  return 'healthy';
});

// Virtual for success rate
TallyConnectionSchema.virtual('successRate').get(function() {
  const total = this.performance.totalRequests;
  if (total === 0) return 0;
  return (this.performance.successfulRequests / total) * 100;
});

// Method to update heartbeat
TallyConnectionSchema.methods.updateHeartbeat = function() {
  this.connectionDetails.lastHeartbeat = new Date();
  this.connectionDetails.reconnectAttempts = 0;
  return this.save();
};

// Method to connect
TallyConnectionSchema.methods.connect = function() {
  this.status = 'connected';
  this.lastConnected = new Date();
  this.connectionDetails.reconnectAttempts = 0;
  return this.save();
};

// Method to disconnect
TallyConnectionSchema.methods.disconnect = function(reason = 'Manual disconnect') {
  const now = new Date();
  
  if (this.status === 'connected' && this.lastConnected) {
    this.totalUptime += (now.getTime() - this.lastConnected.getTime());
  }
  
  this.status = 'disconnected';
  this.lastDisconnected = now;
  
  this.addLog('info', `Disconnected: ${reason}`);
  return this.save();
};

// Method to add log entry
TallyConnectionSchema.methods.addLog = function(level, message, details = {}) {
  this.logs.push({
    timestamp: new Date(),
    level,
    message,
    details
  });
  
  // Keep only last 100 log entries
  if (this.logs.length > 100) {
    this.logs = this.logs.slice(-100);
  }
  
  return this;
};

// Method to update performance metrics
TallyConnectionSchema.methods.updatePerformance = function(responseTime, success = true) {
  const perf = this.performance;
  
  perf.totalRequests += 1;
  if (success) {
    perf.successfulRequests += 1;
  } else {
    perf.failedRequests += 1;
  }
  
  // Calculate rolling average response time
  perf.avgResponseTime = ((perf.avgResponseTime * (perf.totalRequests - 1)) + responseTime) / perf.totalRequests;
  perf.lastPerformanceUpdate = new Date();
  
  return this.save();
};

// Static method to find active connections
TallyConnectionSchema.statics.findActiveConnections = function(companyId) {
  return this.find({
    company: companyId,
    status: 'connected',
    isActive: true
  });
};

// Static method to cleanup stale connections
TallyConnectionSchema.statics.cleanupStaleConnections = function() {
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
  
  return this.updateMany(
    {
      status: 'connected',
      'connectionDetails.lastHeartbeat': { $lt: staleThreshold }
    },
    {
      $set: { status: 'disconnected' },
      $push: {
        logs: {
          timestamp: new Date(),
          level: 'warn',
          message: 'Connection marked as stale due to missing heartbeat'
        }
      }
    }
  );
};

module.exports = mongoose.model('TallyConnection', TallyConnectionSchema);
