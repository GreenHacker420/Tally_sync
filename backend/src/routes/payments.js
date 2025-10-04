import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  createOrder,
  verifyPayment,
  createPaymentLink,
  generateUPIQR,
  processRefund,
  handleWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

// Webhook route (no auth required)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

// Validation rules
const orderValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  body('voucherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid voucher ID')
];

const paymentLinkValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  body('customer.name')
    .optional()
    .notEmpty()
    .withMessage('Customer name cannot be empty'),
  body('customer.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('customer.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('voucherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid voucher ID')
];

const upiQRValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  body('voucherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid voucher ID')
];

const refundValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  body('speed')
    .optional()
    .isIn(['normal', 'optimum'])
    .withMessage('Speed must be normal or optimum')
];

// @desc    Create payment order
// @route   POST /api/payments/orders
// @access  Private
router.post('/orders', checkCompanyAccess, orderValidation, createOrder);

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', checkCompanyAccess, verifyPayment);

// @desc    Create payment link
// @route   POST /api/payments/links
// @access  Private
router.post('/links', checkCompanyAccess, paymentLinkValidation, createPaymentLink);

// @desc    Generate UPI QR Code
// @route   POST /api/payments/upi-qr
// @access  Private
router.post('/upi-qr', checkCompanyAccess, upiQRValidation, generateUPIQR);

// @desc    Process refund
// @route   POST /api/payments/:paymentId/refund
// @access  Private
router.post('/:paymentId/refund', checkCompanyAccess, refundValidation, processRefund);

// Legacy route for backward compatibility
router.get('/', checkCompanyAccess, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment API is ready. Use specific endpoints for payment operations.'
  });
});

export default router;
