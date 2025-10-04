import Budget from '../models/Budget.mjs';
import logger from '../utils/logger.js';

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { category, status, page = 1, limit = 10 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const query = { company: companyId };
    if (category) query.category = category;
    if (status) query.status = status;

    const budgets = await Budget.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Budget.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        budgets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budgets'
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { budget }
    });
  } catch (error) {
    logger.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budget'
    });
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const budgetData = {
      ...req.body,
      company: companyId,
      createdBy: req.user.id
    };

    const budget = await Budget.create(budgetData);

    logger.info(`Budget created: ${budget.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget }
    });
  } catch (error) {
    logger.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating budget',
      error: error.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    logger.info(`Budget updated: ${updatedBudget.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget: updatedBudget }
    });
  } catch (error) {
    logger.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating budget'
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Soft delete - set status to cancelled
    budget.status = 'cancelled';
    await budget.save();

    logger.info(`Budget deleted: ${budget.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    logger.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting budget'
    });
  }
};

// @desc    Add spending to budget
// @route   POST /api/budgets/:id/spending
// @access  Private
export const addSpending = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.addSpending(amount);

    // Check if alert should be triggered
    const alertStatus = budget.alerts.enabled && budget.utilizationPercentage >= budget.alerts.warningThreshold;

    res.status(200).json({
      success: true,
      message: 'Spending added successfully',
      data: { 
        budget,
        alert: alertStatus ? {
          level: budget.utilizationPercentage >= budget.alerts.criticalThreshold ? 'critical' : 'warning',
          message: `Budget utilization is at ${budget.utilizationPercentage.toFixed(2)}%`
        } : null
      }
    });
  } catch (error) {
    logger.error('Add spending error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding spending'
    });
  }
};

// @desc    Get budget summary
// @route   GET /api/budgets/summary
// @access  Private
export const getBudgetSummary = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const summary = await Budget.aggregate([
      { $match: { company: mongoose.Types.ObjectId(companyId), status: 'active' } },
      {
        $group: {
          _id: '$category',
          totalBudget: { $sum: '$amount' },
          totalSpent: { $sum: '$actualSpent' },
          totalRemaining: { $sum: '$remainingAmount' },
          count: { $sum: 1 },
          avgUtilization: { $avg: '$utilizationPercentage' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalBudget: 1,
          totalSpent: 1,
          totalRemaining: 1,
          count: 1,
          avgUtilization: { $round: ['$avgUtilization', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error('Get budget summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budget summary'
    });
  }
};
