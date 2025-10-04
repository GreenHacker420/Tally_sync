import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const VoucherSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  voucherType: {
    type: String,
    enum: ['sales', 'purchase', 'receipt', 'payment', 'contra', 'journal', 'debit_note', 'credit_note'],
    required: true
  },
  voucherNumber: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  reference: {
    number: String,
    date: Date
  },
  party: {
    type: mongoose.Schema.ObjectId,
    ref: 'Party'
  },
  narration: {
    type: String,
    maxlength: [500, 'Narration cannot be more than 500 characters']
  },
  // For sales/purchase vouchers
  items: [{
    item: {
      type: mongoose.Schema.ObjectId,
      ref: 'Item'
    },
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    unit: String,
    rate: {
      type: Number,
      required: true
    },
    discount: {
      percentage: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    taxable: {
      type: Boolean,
      default: true
    },
    hsnCode: String,
    gst: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      cess: { type: Number, default: 0 }
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  // For accounting entries (all voucher types)
  ledgerEntries: [{
    ledger: {
      type: mongoose.Schema.ObjectId,
      ref: 'Ledger',
      required: true
    },
    debit: {
      type: Number,
      default: 0
    },
    credit: {
      type: Number,
      default: 0
    },
    narration: String
  }],
  totals: {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cess: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: {
      type: Number,
      required: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'bank', 'upi', 'card', 'cheque', 'dd', 'neft', 'rtgs', 'other']
    },
    bank: {
      type: mongoose.Schema.ObjectId,
      ref: 'Ledger'
    },
    chequeNumber: String,
    chequeDate: Date,
    transactionId: String,
    upiId: String
  },
  shipping: {
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    method: String,
    charges: { type: Number, default: 0 },
    trackingNumber: String
  },
  terms: {
    paymentTerms: String,
    deliveryTerms: String,
    otherTerms: String
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'cancelled', 'paid', 'partially_paid'],
    default: 'pending'
  },
  dueDate: Date,
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  tallySync: {
    synced: { type: Boolean, default: false },
    tallyId: String,
    lastSyncDate: Date,
    syncError: String
  },
  workflow: {
    approvalRequired: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String
  },
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    interval: { type: Number, default: 1 },
    endDate: Date,
    nextDate: Date,
    parentVoucher: {
      type: mongoose.Schema.ObjectId,
      ref: 'Voucher'
    }
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
VoucherSchema.index({ company: 1, voucherType: 1, voucherNumber: 1 }, { unique: true });
VoucherSchema.index({ company: 1, date: -1 });
VoucherSchema.index({ company: 1, party: 1 });
VoucherSchema.index({ company: 1, status: 1 });
VoucherSchema.index({ company: 1, dueDate: 1 });
VoucherSchema.index({ 'tallySync.synced': 1 });

// Virtual for formatted voucher number
VoucherSchema.virtual('formattedNumber').get(function() {
  return `${this.voucherType.toUpperCase()}-${this.voucherNumber}`;
});

// Virtual for overdue status
VoucherSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'paid' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for days overdue
VoucherSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  const diffTime = Math.abs(new Date() - this.dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
VoucherSchema.pre('save', function(next) {
  // Calculate totals if items are present
  if (this.items && this.items.length > 0) {
    this.calculateTotals();
  }
  
  // Validate ledger entries balance
  if (this.ledgerEntries && this.ledgerEntries.length > 0) {
    const totalDebit = this.ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = this.ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return next(new Error('Debit and Credit amounts must be equal'));
    }
  }
  
  next();
});

// Method to calculate totals
VoucherSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  
  this.items.forEach(item => {
    const itemTotal = item.quantity * item.rate;
    subtotal += itemTotal;
    
    // Calculate discount
    if (item.discount.percentage > 0) {
      item.discount.amount = (itemTotal * item.discount.percentage) / 100;
    }
    totalDiscount += item.discount.amount;
    
    // Calculate tax
    const taxableAmount = itemTotal - item.discount.amount;
    if (item.taxable) {
      const cgstAmount = (taxableAmount * item.gst.cgst) / 100;
      const sgstAmount = (taxableAmount * item.gst.sgst) / 100;
      const igstAmount = (taxableAmount * item.gst.igst) / 100;
      const cessAmount = (taxableAmount * item.gst.cess) / 100;
      
      totalCgst += cgstAmount;
      totalSgst += sgstAmount;
      totalIgst += igstAmount;
      totalCess += cessAmount;
    }
    
    // Update item amount
    item.amount = taxableAmount + (taxableAmount * (item.gst.cgst + item.gst.sgst + item.gst.igst + item.gst.cess)) / 100;
  });
  
  this.totals.subtotal = subtotal;
  this.totals.discount = totalDiscount;
  this.totals.taxableAmount = subtotal - totalDiscount;
  this.totals.cgst = totalCgst;
  this.totals.sgst = totalSgst;
  this.totals.igst = totalIgst;
  this.totals.cess = totalCess;
  this.totals.totalTax = totalCgst + totalSgst + totalIgst + totalCess;
  
  const beforeRoundOff = this.totals.taxableAmount + this.totals.totalTax;
  this.totals.grandTotal = Math.round(beforeRoundOff);
  this.totals.roundOff = this.totals.grandTotal - beforeRoundOff;
};

// Method to generate ledger entries for sales/purchase vouchers
VoucherSchema.methods.generateLedgerEntries = function() {
  this.ledgerEntries = [];
  
  if (this.voucherType === 'sales') {
    // Debit: Party/Cash
    this.ledgerEntries.push({
      ledger: this.party,
      debit: this.totals.grandTotal,
      credit: 0,
      narration: `Sales to ${this.party.name}`
    });
    
    // Credit: Sales
    this.ledgerEntries.push({
      ledger: 'sales_ledger_id', // This should be the sales ledger ID
      debit: 0,
      credit: this.totals.taxableAmount,
      narration: 'Sales'
    });
    
    // Credit: Tax ledgers
    if (this.totals.cgst > 0) {
      this.ledgerEntries.push({
        ledger: 'cgst_ledger_id',
        debit: 0,
        credit: this.totals.cgst,
        narration: 'CGST'
      });
    }
    
    if (this.totals.sgst > 0) {
      this.ledgerEntries.push({
        ledger: 'sgst_ledger_id',
        debit: 0,
        credit: this.totals.sgst,
        narration: 'SGST'
      });
    }
    
    if (this.totals.igst > 0) {
      this.ledgerEntries.push({
        ledger: 'igst_ledger_id',
        debit: 0,
        credit: this.totals.igst,
        narration: 'IGST'
      });
    }
  }
  
  // Similar logic for purchase vouchers (reverse the debit/credit)
  if (this.voucherType === 'purchase') {
    // Credit: Party/Cash
    this.ledgerEntries.push({
      ledger: this.party,
      debit: 0,
      credit: this.totals.grandTotal,
      narration: `Purchase from ${this.party.name}`
    });
    
    // Debit: Purchase
    this.ledgerEntries.push({
      ledger: 'purchase_ledger_id',
      debit: this.totals.taxableAmount,
      credit: 0,
      narration: 'Purchase'
    });
    
    // Debit: Tax ledgers
    if (this.totals.cgst > 0) {
      this.ledgerEntries.push({
        ledger: 'cgst_input_ledger_id',
        debit: this.totals.cgst,
        credit: 0,
        narration: 'CGST Input'
      });
    }
  }
};

// Add pagination plugin
VoucherSchema.plugin(mongoosePaginate);

export default mongoose.model('Voucher', VoucherSchema);
