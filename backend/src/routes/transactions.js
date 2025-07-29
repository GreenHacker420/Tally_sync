const express = require('express');
const { protect, checkCompanyAccess } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  getVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher
} = require('../controllers/voucherController');

const router = express.Router();

// All routes are protected and require company access
router.use(protect);

// Validation rules for transaction creation/update
const transactionValidation = [
  body('voucherType')
    .isIn(['sales', 'purchase', 'receipt', 'payment', 'contra', 'journal', 'debit_note', 'credit_note'])
    .withMessage('Invalid transaction type'),
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

// @desc    Get all transactions (vouchers)
// @route   GET /api/transactions
// @access  Private
router.get('/', checkCompanyAccess, getVouchers);

// @desc    Get single transaction (voucher)
// @route   GET /api/transactions/:id
// @access  Private
router.get('/:id', checkCompanyAccess, getVoucher);

// @desc    Create new transaction (voucher)
// @route   POST /api/transactions
// @access  Private
router.post('/', checkCompanyAccess, transactionValidation, createVoucher);

// @desc    Update transaction (voucher)
// @route   PUT /api/transactions/:id
// @access  Private
router.put('/:id', checkCompanyAccess, transactionValidation, updateVoucher);

// @desc    Delete transaction (voucher)
// @route   DELETE /api/transactions/:id
// @access  Private
router.delete('/:id', checkCompanyAccess, deleteVoucher);

module.exports = router;
