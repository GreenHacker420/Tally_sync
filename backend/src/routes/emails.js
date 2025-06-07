const express = require('express');
const { protect, checkCompanyAccess } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  sendEmail,
  sendInvoiceNotification,
  sendPaymentReminder,
  sendBulkPaymentReminders,
  previewTemplate,
  getQueueStatus,
  getDeliveryStatus
} = require('../controllers/emailController');

const router = express.Router();

router.use(protect);

// Validation rules
const sendEmailValidation = [
  body('to')
    .isEmail()
    .withMessage('Valid email address is required'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('template')
    .optional()
    .isIn(['invoice-notification', 'payment-reminder', 'payment-confirmation', 'account-verification', 'password-reset', 'welcome'])
    .withMessage('Invalid template name'),
  body('priority')
    .optional()
    .isIn(['normal', 'high'])
    .withMessage('Priority must be normal or high')
];

const invoiceNotificationValidation = [
  body('voucherId')
    .isMongoId()
    .withMessage('Valid voucher ID is required'),
  body('includePDF')
    .optional()
    .isBoolean()
    .withMessage('includePDF must be a boolean'),
  body('customMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Custom message cannot exceed 500 characters')
];

const paymentReminderValidation = [
  body('voucherId')
    .isMongoId()
    .withMessage('Valid voucher ID is required'),
  body('customMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Custom message cannot exceed 500 characters')
];

const bulkPaymentReminderValidation = [
  body('voucherIds')
    .isArray({ min: 1 })
    .withMessage('Voucher IDs array is required'),
  body('voucherIds.*')
    .isMongoId()
    .withMessage('Each voucher ID must be valid'),
  body('customMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Custom message cannot exceed 500 characters')
];

// @desc    Send email with template
// @route   POST /api/emails/send
// @access  Private
router.post('/send', checkCompanyAccess, sendEmailValidation, sendEmail);

// @desc    Send invoice notification
// @route   POST /api/emails/invoice-notification
// @access  Private
router.post('/invoice-notification', checkCompanyAccess, invoiceNotificationValidation, sendInvoiceNotification);

// @desc    Send payment reminder
// @route   POST /api/emails/payment-reminder
// @access  Private
router.post('/payment-reminder', checkCompanyAccess, paymentReminderValidation, sendPaymentReminder);

// @desc    Send bulk payment reminders
// @route   POST /api/emails/bulk-payment-reminders
// @access  Private
router.post('/bulk-payment-reminders', checkCompanyAccess, bulkPaymentReminderValidation, sendBulkPaymentReminders);

// @desc    Preview email template
// @route   GET /api/emails/preview/:template
// @access  Private
router.get('/preview/:template', checkCompanyAccess, previewTemplate);

// @desc    Get email queue status
// @route   GET /api/emails/queue-status
// @access  Private
router.get('/queue-status', checkCompanyAccess, getQueueStatus);

// @desc    Get email delivery status
// @route   GET /api/emails/delivery-status/:messageId
// @access  Private
router.get('/delivery-status/:messageId', checkCompanyAccess, getDeliveryStatus);

module.exports = router;
