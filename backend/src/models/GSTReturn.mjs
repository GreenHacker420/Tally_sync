import mongoose from 'mongoose';

const gstReturnSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    index: true
  },
  gstin: {
    type: String,
    required: [true, 'GSTIN is required'],
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format']
  },
  returnType: {
    type: String,
    required: [true, 'Return type is required'],
    enum: ['GSTR1', 'GSTR2', 'GSTR3B', 'GSTR4', 'GSTR9', 'GSTR9C'],
    index: true
  },
  returnPeriod: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2017
    }
  },
  filingStatus: {
    type: String,
    enum: ['draft', 'filed', 'pending', 'late_filed', 'not_filed'],
    default: 'draft',
    index: true
  },
  filedDate: Date,
  dueDate: {
    type: Date,
    required: true
  },
  
  // GSTR-1 Data (Outward Supplies)
  gstr1Data: {
    b2b: [{
      gstin: String,
      invoices: [{
        invoiceNumber: String,
        invoiceDate: Date,
        invoiceValue: Number,
        placeOfSupply: String,
        reverseCharge: Boolean,
        invoiceType: String,
        taxableValue: Number,
        igstAmount: Number,
        cgstAmount: Number,
        sgstAmount: Number,
        cessAmount: Number
      }]
    }],
    b2cl: [{
      invoiceNumber: String,
      invoiceDate: Date,
      invoiceValue: Number,
      placeOfSupply: String,
      taxableValue: Number,
      igstAmount: Number
    }],
    b2cs: [{
      type: String,
      placeOfSupply: String,
      taxableValue: Number,
      igstAmount: Number,
      cgstAmount: Number,
      sgstAmount: Number,
      cessAmount: Number
    }],
    exports: [{
      exportType: String,
      invoiceNumber: String,
      invoiceDate: Date,
      invoiceValue: Number,
      portCode: String,
      shippingBillNumber: String,
      shippingBillDate: Date,
      taxableValue: Number,
      igstAmount: Number
    }],
    cdnr: [{ // Credit/Debit Notes
      gstin: String,
      noteNumber: String,
      noteDate: Date,
      noteType: String,
      placeOfSupply: String,
      noteValue: Number,
      taxableValue: Number,
      igstAmount: Number,
      cgstAmount: Number,
      sgstAmount: Number
    }],
    hsn: [{
      hsnCode: String,
      description: String,
      uqc: String,
      totalQuantity: Number,
      totalValue: Number,
      taxableValue: Number,
      igstAmount: Number,
      cgstAmount: Number,
      sgstAmount: Number,
      cessAmount: Number
    }]
  },

  // GSTR-3B Data (Summary Return)
  gstr3bData: {
    outwardSupplies: {
      taxableValue: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      cessAmount: { type: Number, default: 0 }
    },
    inwardSupplies: {
      taxableValue: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      cessAmount: { type: Number, default: 0 }
    },
    itcAvailed: {
      igstAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      cessAmount: { type: Number, default: 0 }
    },
    itcReversed: {
      igstAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      cessAmount: { type: Number, default: 0 }
    },
    taxPayable: {
      igstAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      cessAmount: { type: Number, default: 0 }
    },
    taxPaid: {
      igstAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      cessAmount: { type: Number, default: 0 },
      interest: { type: Number, default: 0 },
      lateFee: { type: Number, default: 0 }
    }
  },

  // Summary
  summary: {
    totalTaxableValue: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalCess: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalInvoices: { type: Number, default: 0 }
  },

  // Reconciliation
  reconciliation: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'mismatch'],
      default: 'pending'
    },
    mismatches: [{
      type: String,
      description: String,
      amount: Number,
      resolvedStatus: {
        type: String,
        enum: ['pending', 'resolved', 'ignored'],
        default: 'pending'
      }
    }],
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reconciledAt: Date
  },

  // Attachments
  attachments: [{
    filename: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
gstReturnSchema.index({ company: 1, returnType: 1, 'returnPeriod.month': 1, 'returnPeriod.year': 1 });
gstReturnSchema.index({ gstin: 1, returnType: 1 });
gstReturnSchema.index({ filingStatus: 1, dueDate: 1 });

// Pre-save middleware to calculate summary
gstReturnSchema.pre('save', function(next) {
  if (this.returnType === 'GSTR3B' && this.gstr3bData) {
    const { outwardSupplies, taxPayable } = this.gstr3bData;
    
    this.summary.totalTaxableValue = outwardSupplies.taxableValue || 0;
    this.summary.totalIGST = taxPayable.igstAmount || 0;
    this.summary.totalCGST = taxPayable.cgstAmount || 0;
    this.summary.totalSGST = taxPayable.sgstAmount || 0;
    this.summary.totalCess = taxPayable.cessAmount || 0;
    this.summary.totalTax = 
      (taxPayable.igstAmount || 0) + 
      (taxPayable.cgstAmount || 0) + 
      (taxPayable.sgstAmount || 0) + 
      (taxPayable.cessAmount || 0);
  }
  
  next();
});

// Static method to get pending returns
gstReturnSchema.statics.getPendingReturns = function(companyId) {
  const now = new Date();
  return this.find({
    company: companyId,
    filingStatus: { $in: ['draft', 'pending'] },
    dueDate: { $gte: now }
  }).sort({ dueDate: 1 });
};

// Static method to get overdue returns
gstReturnSchema.statics.getOverdueReturns = function(companyId) {
  const now = new Date();
  return this.find({
    company: companyId,
    filingStatus: { $in: ['draft', 'pending', 'not_filed'] },
    dueDate: { $lt: now }
  }).sort({ dueDate: 1 });
};

const GSTReturn = mongoose.model('GSTReturn', gstReturnSchema);

export default GSTReturn;
