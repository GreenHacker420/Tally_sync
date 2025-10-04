import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot be more than 100 characters']
  },
  gstin: {
    type: String,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please add a valid GSTIN']
  },
  pan: {
    type: String,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please add a valid PAN']
  },
  address: {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { 
      type: String, 
      required: true,
      match: [/^[1-9][0-9]{5}$/, 'Please add a valid pincode']
    },
    country: { type: String, default: 'India' }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      match: [/^\+?[1-9]\d{1,14}$/, 'Please add a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    website: String,
    fax: String
  },
  businessType: {
    type: String,
    enum: ['proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'trust', 'society', 'other'],
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  financialYear: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  currency: {
    primary: { type: String, default: 'INR' },
    symbol: { type: String, default: '₹' },
    decimalPlaces: { type: Number, default: 2 }
  },
  taxation: {
    gstRegistered: { type: Boolean, default: false },
    gstType: {
      type: String,
      enum: ['regular', 'composition', 'casual', 'non_resident', 'exempt'],
      default: 'regular'
    },
    tdsApplicable: { type: Boolean, default: false },
    tcsApplicable: { type: Boolean, default: false }
  },
  banking: {
    accounts: [{
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      accountType: {
        type: String,
        enum: ['savings', 'current', 'cc', 'od'],
        default: 'current'
      },
      branch: String,
      isDefault: { type: Boolean, default: false }
    }]
  },
  tallyIntegration: {
    enabled: { type: Boolean, default: false },
    companyPath: String,
    lastSyncDate: Date,
    syncSettings: {
      autoSync: { type: Boolean, default: false },
      syncInterval: { type: Number, default: 300000 }, // 5 minutes in ms
      syncVouchers: { type: Boolean, default: true },
      syncInventory: { type: Boolean, default: true },
      syncMasters: { type: Boolean, default: true }
    }
  },
  integrations: {
    razorpay: {
      enabled: { type: Boolean, default: false },
      keyId: String,
      keySecret: String, // This should be encrypted
      webhookSecret: String
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      businessNumber: String,
      apiKey: String
    },
    email: {
      enabled: { type: Boolean, default: true },
      smtpSettings: {
        host: String,
        port: Number,
        secure: Boolean,
        username: String,
        password: String // This should be encrypted
      }
    }
  },
  settings: {
    invoiceSettings: {
      prefix: { type: String, default: 'INV' },
      startingNumber: { type: Number, default: 1 },
      numberFormat: { type: String, default: 'INV-{YYYY}-{MM}-{####}' },
      terms: String,
      notes: String
    },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      schedules: [{
        days: Number, // Days after due date
        method: { type: String, enum: ['email', 'whatsapp', 'both'] },
        template: String
      }]
    },
    reportSettings: {
      defaultDateRange: { type: String, default: 'current_month' },
      emailReports: { type: Boolean, default: false },
      reportFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'] }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    features: {
      maxUsers: { type: Number, default: 1 },
      maxVouchers: { type: Number, default: 100 },
      maxInventoryItems: { type: Number, default: 50 },
      advancedReports: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      whatsappIntegration: { type: Boolean, default: false }
    }
  },
  logo: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  users: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'accountant', 'sales', 'viewer'],
      default: 'viewer'
    },
    permissions: {
      vouchers: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      inventory: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      reports: {
        financial: { type: Boolean, default: true },
        inventory: { type: Boolean, default: true },
        gst: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false }
      }
    },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CompanySchema.index({ gstin: 1 }, { unique: true, sparse: true });
CompanySchema.index({ createdBy: 1 });
CompanySchema.index({ isActive: 1 });
CompanySchema.index({ 'users.user': 1 });

// Virtual for full address
CompanySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
});

// Pre-save middleware
CompanySchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.name;
  }
  
  // Ensure financial year end date is after start date
  if (this.financialYear.startDate >= this.financialYear.endDate) {
    const error = new Error('Financial year end date must be after start date');
    return next(error);
  }
  
  next();
});

// Method to check if user has access to company
CompanySchema.methods.hasUserAccess = function(userId) {
  return this.users.some(userObj => userObj.user.toString() === userId.toString());
};

// Method to get user role in company
CompanySchema.methods.getUserRole = function(userId) {
  const userObj = this.users.find(userObj => userObj.user.toString() === userId.toString());
  return userObj ? userObj.role : null;
};

// Method to add user to company
CompanySchema.methods.addUser = function(userId, role = 'viewer', permissions = {}) {
  const existingUser = this.users.find(userObj => userObj.user.toString() === userId.toString());
  
  if (existingUser) {
    existingUser.role = role;
    existingUser.permissions = { ...existingUser.permissions, ...permissions };
  } else {
    this.users.push({
      user: userId,
      role,
      permissions
    });
  }
  
  return this.save();
};

// Method to remove user from company
CompanySchema.methods.removeUser = function(userId) {
  this.users = this.users.filter(userObj => userObj.user.toString() !== userId.toString());
  return this.save();
};

export default mongoose.model('Company', CompanySchema);
