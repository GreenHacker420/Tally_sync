import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  getGSTReturns,
  getGSTReturn,
  generateGSTR1,
  generateGSTR3B,
  fileGSTReturn,
  getPendingReturns,
  reconcileGSTReturn
} from '../controllers/gstController.mjs';

const router = express.Router();

router.use(protect);
const gstGenerationValidation = [
  body('companyId').notEmpty().withMessage('Company ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
  body('year').isInt({ min: 2017 }).withMessage('Valid year is required'),
  body('gstin').matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format')
];

// @desc    Get all GST returns
// @route   GET /api/gst/returns
// @access  Private
router.get('/returns', checkCompanyAccess, getGSTReturns);

// @desc    Get pending/overdue returns
// @route   GET /api/gst/returns/pending
// @access  Private
router.get('/returns/pending', checkCompanyAccess, getPendingReturns);

// @desc    Get single GST return
// @route   GET /api/gst/returns/:id
// @access  Private
router.get('/returns/:id', checkCompanyAccess, getGSTReturn);

// @desc    Generate GSTR-1
// @route   POST /api/gst/generate/gstr1
// @access  Private
router.post('/generate/gstr1', checkCompanyAccess, gstGenerationValidation, generateGSTR1);

// @desc    Generate GSTR-3B
// @route   POST /api/gst/generate/gstr3b
// @access  Private
router.post('/generate/gstr3b', checkCompanyAccess, gstGenerationValidation, generateGSTR3B);

// @desc    File GST return
// @route   PUT /api/gst/returns/:id/file
// @access  Private
router.put('/returns/:id/file', checkCompanyAccess, fileGSTReturn);

// @desc    Reconcile GST return
// @route   POST /api/gst/returns/:id/reconcile
// @access  Private
router.post('/returns/:id/reconcile', checkCompanyAccess, reconcileGSTReturn);

// Legacy endpoint
router.get('/', checkCompanyAccess, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GST API is ready. Use /returns endpoints for GST return management.'
  });
});

export default router;

