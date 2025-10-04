import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'payment_reminder',
      'budget_alert',
      'gst_filing_due',
      'low_stock',
      'voucher_approval',
      'system',
      'info',
      'warning',
      'error'
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true
  },
  readAt: Date,
  // Related entity
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['voucher', 'budget', 'gst_return', 'inventory', 'party', 'payment', 'other']
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityData: mongoose.Schema.Types.Mixed
  },
  // Action buttons
  actions: [{
    label: String,
    action: String,
    url: String
  }],
  // Delivery channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    whatsapp: {
      type: Boolean,
      default: false
    }
  },
  // Delivery status
  deliveryStatus: {
    email: {
      sent: Boolean,
      sentAt: Date,
      error: String
    },
    sms: {
      sent: Boolean,
      sentAt: Date,
      error: String
    },
    whatsapp: {
      sent: Boolean,
      sentAt: Date,
      error: String
    }
  },
  expiresAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
notificationSchema.index({ company: 1, type: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Instance method to archive
notificationSchema.methods.archive = async function() {
  this.status = 'archived';
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, status: 'unread' });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = function(userId, limit = 10) {
  return this.find({ user: userId, status: { $ne: 'archived' } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, status: 'unread' },
    { $set: { status: 'read', readAt: new Date() } }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
