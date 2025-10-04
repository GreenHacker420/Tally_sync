import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  getVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  generateVoucherPDF
} from '../controllers/voucherController.js';

const router = express.Router();

// All routes are protected and require company access
router.use(protect);

// Validation rules for voucher creation/update
const voucherValidation = [
  body('voucherType')
    .isIn(['sales', 'purchase', 'receipt', 'payment', 'contra', 'journal', 'debit_note', 'credit_note'])
    .withMessage('Invalid voucher type'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('party')
    .optional()
    .isMongoId()
    .withMessage('Invalid party ID'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('items.*.item')
    .optional()
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('items.*.quantity')
    .optional()
    .isNumeric()
    .withMessage('Quantity must be a number'),
  body('items.*.rate')
    .optional()
    .isNumeric()
    .withMessage('Rate must be a number'),
  body('narration')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Narration cannot exceed 500 characters')
];

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private
router.get('/', checkCompanyAccess, getVouchers);

// @desc    Create voucher
// @route   POST /api/vouchers
// @access  Private
router.post('/', checkCompanyAccess, voucherValidation, createVoucher);

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Private
router.get('/:id', checkCompanyAccess, getVoucher);

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Private
router.put('/:id', checkCompanyAccess, voucherValidation, updateVoucher);

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Private
router.delete('/:id', checkCompanyAccess, deleteVoucher);

// @desc    Generate PDF for voucher
// @route   GET /api/vouchers/:id/pdf
// @access  Private
router.get('/:id/pdf', checkCompanyAccess, generateVoucherPDF);

export default router;
