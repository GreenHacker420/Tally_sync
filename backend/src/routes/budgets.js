const express = require('express');
const { protect, checkCompanyAccess } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// All routes are protected and require company access
router.use(protect);

// Validation rules for budget creation/update
const budgetValidation = [
  body('name')
    .notEmpty()
    .withMessage('Budget name is required')
    .isLength({ max: 100 })
    .withMessage('Budget name cannot exceed 100 characters'),
  body('category')
    .optional()
    .isIn(['income', 'expense', 'investment', 'savings'])
    .withMessage('Invalid budget category'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value >= 0)
    .withMessage('Amount must be non-negative'),
  body('period')
    .optional()
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid budget period'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
router.get('/', checkCompanyAccess, async (req, res) => {
  try {
    // For now, return a sample budget structure
    // In a real implementation, this would fetch from database
    const budgets = [
      {
        id: '1',
        name: 'Monthly Operating Expenses',
        category: 'expense',
        amount: 50000,
        spent: 32000,
        remaining: 18000,
        period: 'monthly',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Quarterly Revenue Target',
        category: 'income',
        amount: 200000,
        achieved: 150000,
        remaining: 50000,
        period: 'quarterly',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budgets',
      error: error.message
    });
  }
});

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
router.get('/:id', checkCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return a sample budget
    // In a real implementation, this would fetch from database
    const budget = {
      id: id,
      name: 'Sample Budget',
      category: 'expense',
      amount: 50000,
      spent: 32000,
      remaining: 18000,
      period: 'monthly',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budget',
      error: error.message
    });
  }
});

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
router.post('/', checkCompanyAccess, budgetValidation, async (req, res) => {
  try {
    const { name, category, amount, period, startDate, endDate } = req.body;
    
    // For now, return a sample created budget
    // In a real implementation, this would save to database
    const budget = {
      id: Date.now().toString(),
      name,
      category: category || 'expense',
      amount,
      spent: 0,
      remaining: amount,
      period: period || 'monthly',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating budget',
      error: error.message
    });
  }
});

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
router.put('/:id', checkCompanyAccess, budgetValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, amount, period, startDate, endDate } = req.body;
    
    // For now, return a sample updated budget
    // In a real implementation, this would update in database
    const budget = {
      id,
      name,
      category: category || 'expense',
      amount,
      spent: Math.floor(amount * 0.6), // Sample spent amount
      remaining: Math.floor(amount * 0.4), // Sample remaining amount
      period: period || 'monthly',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating budget',
      error: error.message
    });
  }
});

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
router.delete('/:id', checkCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, just return success
    // In a real implementation, this would delete from database
    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting budget',
      error: error.message
    });
  }
});

module.exports = router;
