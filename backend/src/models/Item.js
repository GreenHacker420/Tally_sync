const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ItemSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add an item name'],
    trim: true,
    maxlength: [100, 'Item name cannot be more than 100 characters']
  },
  displayName: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'ItemCategory'
  },
  type: {
    type: String,
    enum: ['product', 'service'],
    required: true,
    default: 'product'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  specifications: {
    brand: String,
    model: String,
    size: String,
    color: String,
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' }
    }
  },
  units: {
    primary: {
      name: { type: String, required: true, default: 'Nos' },
      symbol: { type: String, default: 'Nos' },
      decimalPlaces: { type: Number, default: 0 }
    },
    secondary: {
      name: String,
      symbol: String,
      conversionFactor: Number, // How many primary units = 1 secondary unit
      decimalPlaces: { type: Number, default: 0 }
    }
  },
  pricing: {
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    retailPrice: { type: Number, default: 0 },
    priceLists: [{
      priceList: {
        type: mongoose.Schema.ObjectId,
        ref: 'PriceList'
      },
      rate: Number,
      effectiveFrom: Date,
      effectiveTo: Date
    }]
  },
  taxation: {
    hsnCode: {
      type: String,
      match: [/^[0-9]{4,8}$/, 'Please add a valid HSN code']
    },
    sacCode: {
      type: String,
      match: [/^[0-9]{6}$/, 'Please add a valid SAC code']
    },
    taxable: { type: Boolean, default: true },
    gstRate: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      cess: { type: Number, default: 0 }
    },
    exemptionReason: String
  },
  inventory: {
    trackInventory: { type: Boolean, default: true },
    stockLevels: {
      minimum: { type: Number, default: 0 },
      maximum: { type: Number, default: 0 },
      reorderLevel: { type: Number, default: 0 },
      reorderQuantity: { type: Number, default: 0 }
    },
    currentStock: [{
      godown: {
        type: mongoose.Schema.ObjectId,
        ref: 'Godown'
      },
      quantity: { type: Number, default: 0 },
      reservedQuantity: { type: Number, default: 0 },
      availableQuantity: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }],
    batchTracking: {
      enabled: { type: Boolean, default: false },
      batches: [{
        batchNumber: String,
        manufacturingDate: Date,
        expiryDate: Date,
        quantity: Number,
        godown: {
          type: mongoose.Schema.ObjectId,
          ref: 'Godown'
        }
      }]
    },
    serialTracking: {
      enabled: { type: Boolean, default: false },
      serialNumbers: [{
        serialNumber: String,
        status: {
          type: String,
          enum: ['in_stock', 'sold', 'damaged', 'returned'],
          default: 'in_stock'
        },
        godown: {
          type: mongoose.Schema.ObjectId,
          ref: 'Godown'
        }
      }]
    }
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    type: {
      type: String,
      enum: ['specification', 'certificate', 'warranty', 'manual', 'other']
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  suppliers: [{
    party: {
      type: mongoose.Schema.ObjectId,
      ref: 'Party'
    },
    supplierCode: String,
    leadTime: Number, // in days
    minimumOrderQuantity: Number,
    lastPurchasePrice: Number,
    lastPurchaseDate: Date,
    isPrimary: { type: Boolean, default: false }
  }],
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
ItemSchema.index({ company: 1, name: 1 });
ItemSchema.index({ company: 1, code: 1 });
ItemSchema.index({ company: 1, barcode: 1 });
ItemSchema.index({ company: 1, category: 1 });
ItemSchema.index({ company: 1, type: 1 });
ItemSchema.index({ company: 1, isActive: 1 });
ItemSchema.index({ 'taxation.hsnCode': 1 });

// Virtual for full name
ItemSchema.virtual('fullName').get(function() {
  return this.displayName || this.name;
});

// Virtual for total stock across all godowns
ItemSchema.virtual('totalStock').get(function() {
  if (!this.inventory.trackInventory) return null;
  return this.inventory.currentStock.reduce((total, stock) => total + stock.quantity, 0);
});

// Virtual for available stock across all godowns
ItemSchema.virtual('availableStock').get(function() {
  if (!this.inventory.trackInventory) return null;
  return this.inventory.currentStock.reduce((total, stock) => total + stock.availableQuantity, 0);
});

// Virtual for low stock status
ItemSchema.virtual('isLowStock').get(function() {
  if (!this.inventory.trackInventory) return false;
  return this.totalStock <= this.inventory.stockLevels.reorderLevel;
});

// Virtual for out of stock status
ItemSchema.virtual('isOutOfStock').get(function() {
  if (!this.inventory.trackInventory) return false;
  return this.totalStock <= 0;
});

// Virtual for primary image
ItemSchema.virtual('primaryImage').get(function() {
  return this.images.find(img => img.isPrimary) || this.images[0];
});

// Pre-save middleware
ItemSchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = this.name;
  }
  
  // Generate code if not provided
  if (!this.code) {
    this.code = this.name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4);
  }
  
  // Ensure only one primary image
  let primaryImageSet = false;
  this.images.forEach(img => {
    if (img.isPrimary) {
      if (primaryImageSet) {
        img.isPrimary = false;
      } else {
        primaryImageSet = true;
      }
    }
  });
  
  // If no primary image set and images exist, set first as primary
  if (!primaryImageSet && this.images.length > 0) {
    this.images[0].isPrimary = true;
  }
  
  // Update available quantity for each godown
  this.inventory.currentStock.forEach(stock => {
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;
  });
  
  next();
});

// Method to update stock
ItemSchema.methods.updateStock = function(godownId, quantity, operation = 'add') {
  if (!this.inventory.trackInventory) {
    throw new Error('Inventory tracking is not enabled for this item');
  }
  
  let stockEntry = this.inventory.currentStock.find(
    stock => stock.godown.toString() === godownId.toString()
  );
  
  if (!stockEntry) {
    stockEntry = {
      godown: godownId,
      quantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      lastUpdated: new Date()
    };
    this.inventory.currentStock.push(stockEntry);
  }
  
  if (operation === 'add') {
    stockEntry.quantity += quantity;
  } else if (operation === 'subtract') {
    stockEntry.quantity -= quantity;
  } else if (operation === 'set') {
    stockEntry.quantity = quantity;
  }
  
  stockEntry.availableQuantity = stockEntry.quantity - stockEntry.reservedQuantity;
  stockEntry.lastUpdated = new Date();
  
  return this.save();
};

// Method to reserve stock
ItemSchema.methods.reserveStock = function(godownId, quantity) {
  const stockEntry = this.inventory.currentStock.find(
    stock => stock.godown.toString() === godownId.toString()
  );
  
  if (!stockEntry) {
    throw new Error('Stock not found for this godown');
  }
  
  if (stockEntry.availableQuantity < quantity) {
    throw new Error('Insufficient available stock');
  }
  
  stockEntry.reservedQuantity += quantity;
  stockEntry.availableQuantity -= quantity;
  stockEntry.lastUpdated = new Date();
  
  return this.save();
};

// Method to release reserved stock
ItemSchema.methods.releaseReservedStock = function(godownId, quantity) {
  const stockEntry = this.inventory.currentStock.find(
    stock => stock.godown.toString() === godownId.toString()
  );
  
  if (!stockEntry) {
    throw new Error('Stock not found for this godown');
  }
  
  stockEntry.reservedQuantity -= quantity;
  stockEntry.availableQuantity += quantity;
  stockEntry.lastUpdated = new Date();
  
  return this.save();
};

// Static method to find low stock items
ItemSchema.statics.findLowStockItems = function(companyId) {
  return this.aggregate([
    { $match: { company: mongoose.Types.ObjectId(companyId), 'inventory.trackInventory': true } },
    {
      $addFields: {
        totalStock: { $sum: '$inventory.currentStock.quantity' }
      }
    },
    {
      $match: {
        $expr: { $lte: ['$totalStock', '$inventory.stockLevels.reorderLevel'] }
      }
    }
  ]);
};

// Add pagination plugin
ItemSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Item', ItemSchema);
