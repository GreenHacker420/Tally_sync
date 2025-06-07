const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a party name'],
    trim: true,
    maxlength: [100, 'Party name cannot be more than 100 characters']
  },
  displayName: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['customer', 'supplier', 'both'],
    required: true
  },
  category: {
    type: String,
    enum: ['individual', 'business', 'government'],
    default: 'business'
  },
  gstin: {
    type: String,
    sparse: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please add a valid GSTIN']
  },
  pan: {
    type: String,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please add a valid PAN']
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      match: [/^\+?[1-9]\d{1,14}$/, 'Please add a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    website: String,
    whatsapp: String
  },
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'both'],
      default: 'both'
    },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { 
      type: String, 
      required: true,
      match: [/^[1-9][0-9]{5}$/, 'Please add a valid pincode']
    },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false }
  }],
  banking: {
    accounts: [{
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      isDefault: { type: Boolean, default: false }
    }]
  },
  creditLimit: {
    amount: { type: Number, default: 0 },
    days: { type: Number, default: 30 }
  },
  pricing: {
    priceList: {
      type: mongoose.Schema.ObjectId,
      ref: 'PriceList'
    },
    discountPercentage: { type: Number, default: 0 },
    specialRates: [{
      item: {
        type: mongoose.Schema.ObjectId,
        ref: 'Item'
      },
      rate: Number,
      effectiveFrom: Date,
      effectiveTo: Date
    }]
  },
  preferences: {
    paymentTerms: {
      type: String,
      enum: ['cash', 'credit', 'advance'],
      default: 'credit'
    },
    defaultPaymentMethod: {
      type: String,
      enum: ['cash', 'bank', 'upi', 'card', 'cheque'],
      default: 'bank'
    },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      methods: [{ type: String, enum: ['email', 'whatsapp', 'sms'] }],
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      }
    }
  },
  balances: {
    opening: {
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['debit', 'credit'], default: 'debit' },
      asOn: Date
    },
    current: {
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['debit', 'credit'], default: 'debit' },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  tallySync: {
    synced: { type: Boolean, default: false },
    tallyId: String,
    lastSyncDate: Date,
    syncError: String
  },
  tags: [String],
  notes: String,
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
PartySchema.index({ company: 1, name: 1 });
PartySchema.index({ company: 1, type: 1 });
PartySchema.index({ company: 1, gstin: 1 });
PartySchema.index({ company: 1, isActive: 1 });
PartySchema.index({ 'contact.phone': 1 });
PartySchema.index({ 'contact.email': 1 });

// Virtual for full name
PartySchema.virtual('fullName').get(function() {
  return this.displayName || this.name;
});

// Virtual for default billing address
PartySchema.virtual('defaultBillingAddress').get(function() {
  return this.addresses.find(addr => 
    (addr.type === 'billing' || addr.type === 'both') && addr.isDefault
  ) || this.addresses.find(addr => addr.type === 'billing' || addr.type === 'both');
});

// Virtual for default shipping address
PartySchema.virtual('defaultShippingAddress').get(function() {
  return this.addresses.find(addr => 
    (addr.type === 'shipping' || addr.type === 'both') && addr.isDefault
  ) || this.addresses.find(addr => addr.type === 'shipping' || addr.type === 'both');
});

// Virtual for outstanding amount
PartySchema.virtual('outstandingAmount').get(function() {
  return this.balances.current.amount;
});

// Virtual for overdue status
PartySchema.virtual('isOverdue').get(function() {
  // This would need to be calculated based on vouchers
  // For now, returning false
  return false;
});

// Pre-save middleware
PartySchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.name;
  }
  
  // Ensure at least one default address
  if (this.addresses.length > 0) {
    const hasDefault = this.addresses.some(addr => addr.isDefault);
    if (!hasDefault) {
      this.addresses[0].isDefault = true;
    }
  }
  
  // Ensure only one default address per type
  const billingAddresses = this.addresses.filter(addr => 
    addr.type === 'billing' || addr.type === 'both'
  );
  const shippingAddresses = this.addresses.filter(addr => 
    addr.type === 'shipping' || addr.type === 'both'
  );
  
  let billingDefaultSet = false;
  let shippingDefaultSet = false;
  
  this.addresses.forEach(addr => {
    if ((addr.type === 'billing' || addr.type === 'both') && addr.isDefault) {
      if (billingDefaultSet) {
        addr.isDefault = false;
      } else {
        billingDefaultSet = true;
      }
    }
    
    if ((addr.type === 'shipping' || addr.type === 'both') && addr.isDefault) {
      if (shippingDefaultSet) {
        addr.isDefault = false;
      } else {
        shippingDefaultSet = true;
      }
    }
  });
  
  next();
});

// Method to update balance
PartySchema.methods.updateBalance = function(amount, type = 'debit') {
  if (type === 'debit') {
    if (this.balances.current.type === 'debit') {
      this.balances.current.amount += amount;
    } else {
      if (amount > this.balances.current.amount) {
        this.balances.current.amount = amount - this.balances.current.amount;
        this.balances.current.type = 'debit';
      } else {
        this.balances.current.amount -= amount;
      }
    }
  } else { // credit
    if (this.balances.current.type === 'credit') {
      this.balances.current.amount += amount;
    } else {
      if (amount > this.balances.current.amount) {
        this.balances.current.amount = amount - this.balances.current.amount;
        this.balances.current.type = 'credit';
      } else {
        this.balances.current.amount -= amount;
      }
    }
  }
  
  this.balances.current.lastUpdated = new Date();
  return this.save();
};

// Method to get formatted address
PartySchema.methods.getFormattedAddress = function(type = 'billing') {
  const address = type === 'billing' ? this.defaultBillingAddress : this.defaultShippingAddress;
  if (!address) return '';
  
  return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`;
};

// Static method to find parties with outstanding amounts
PartySchema.statics.findWithOutstanding = function(companyId) {
  return this.find({
    company: companyId,
    'balances.current.amount': { $gt: 0 },
    isActive: true
  });
};

module.exports = mongoose.model('Party', PartySchema);
