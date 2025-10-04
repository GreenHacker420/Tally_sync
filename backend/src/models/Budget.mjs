import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['revenue', 'expense', 'capital', 'operational', 'project', 'department', 'other'],
    default: 'operational'
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  period: {
    type: String,
    required: [true, 'Budget period is required'],
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  actualSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  utilizationPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    warningThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    criticalThreshold: {
      type: Number,
      default: 90,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
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
budgetSchema.index({ company: 1, startDate: 1, endDate: 1 });
budgetSchema.index({ company: 1, category: 1 });
budgetSchema.index({ company: 1, status: 1 });

// Pre-save middleware
budgetSchema.pre('save', function(next) {
  this.remainingAmount = Math.max(0, this.amount - this.actualSpent);
  if (this.amount > 0) {
    this.utilizationPercentage = Math.min(100, (this.actualSpent / this.amount) * 100);
  }
  next();
});

// Instance method to add spending
budgetSchema.methods.addSpending = async function(amount) {
  this.actualSpent += amount;
  return this.save();
};

// Static method to get active budgets
budgetSchema.statics.getActiveBudgets = function(companyId) {
  const now = new Date();
  return this.find({
    company: companyId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('createdBy', 'name email');
};

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
