import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  addSpending,
  getBudgetSummary
} from '../controllers/budgetController.mjs';

const router = express.Router();

// All routes are protected and require company access
router.use(protect);

// Validation rules for budget creation/update
const budgetValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Budget name must be between 2 and 100 characters'),
  body('category')
    .isIn(['revenue', 'expense', 'capital', 'operational', 'project', 'department', 'other'])
    .withMessage('Invalid budget category'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => value >= 0)
    .withMessage('Amount cannot be negative'),
  body('period')
    .isIn(['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'])
    .withMessage('Invalid budget period'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => new Date(value) > new Date(req.body.startDate))
    .withMessage('End date must be after start date')
];

// @desc    Get budget summary
// @route   GET /api/budgets/summary
// @access  Private
router.get('/summary', checkCompanyAccess, getBudgetSummary);

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
router.get('/', checkCompanyAccess, getBudgets);

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
router.post('/', checkCompanyAccess, budgetValidation, createBudget);

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
router.get('/:id', checkCompanyAccess, getBudget);

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
router.put('/:id', checkCompanyAccess, budgetValidation, updateBudget);

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
router.delete('/:id', checkCompanyAccess, deleteBudget);

// @desc    Add spending to budget
// @route   POST /api/budgets/:id/spending
// @access  Private
router.post('/:id/spending', checkCompanyAccess, [
  body('amount').isNumeric().withMessage('Amount must be a number')
], addSpending);

export default router;

