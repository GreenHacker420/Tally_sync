import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import {
  getProfitLossReport,
  getBalanceSheet,
  getCashFlowReport,
  getSalesReport,
  getPurchaseReport,
  getBudgetVsActualReport,
  getDashboardSummary
} from '../controllers/reportController.mjs';

const router = express.Router();

router.use(protect);

// @desc    Get Dashboard Summary
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', checkCompanyAccess, getDashboardSummary);

// @desc    Get Profit & Loss Report
// @route   GET /api/reports/profit-loss
// @access  Private
router.get('/profit-loss', checkCompanyAccess, getProfitLossReport);

// @desc    Get Balance Sheet
// @route   GET /api/reports/balance-sheet
// @access  Private
router.get('/balance-sheet', checkCompanyAccess, getBalanceSheet);

// @desc    Get Cash Flow Statement
// @route   GET /api/reports/cash-flow
// @access  Private
router.get('/cash-flow', checkCompanyAccess, getCashFlowReport);

// @desc    Get Sales Report
// @route   GET /api/reports/sales
// @access  Private
router.get('/sales', checkCompanyAccess, getSalesReport);

// @desc    Get Purchase Report
// @route   GET /api/reports/purchase
// @access  Private
router.get('/purchase', checkCompanyAccess, getPurchaseReport);

// @desc    Get Budget vs Actual Report
// @route   GET /api/reports/budget-vs-actual
// @access  Private
router.get('/budget-vs-actual', checkCompanyAccess, getBudgetVsActualReport);

// Legacy endpoint
router.get('/', checkCompanyAccess, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reports API is ready. Available reports: /dashboard, /profit-loss, /balance-sheet, /cash-flow, /sales, /purchase, /budget-vs-actual'
  });
});

export default router;
