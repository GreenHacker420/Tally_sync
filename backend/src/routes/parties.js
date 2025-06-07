const express = require('express');
const { protect, checkCompanyAccess } = require('../middleware/auth');
const { body } = require('express-validator');
const {
  getParties,
  getParty,
  createParty,
  updateParty,
  deleteParty,
  getPartyBalance,
  getOutstandingParties
} = require('../controllers/partyController');

const router = express.Router();

router.use(protect);

// Validation rules for party creation/update
const partyValidation = [
  body('name')
    .notEmpty()
    .withMessage('Party name is required')
    .isLength({ max: 100 })
    .withMessage('Party name cannot exceed 100 characters'),
  body('type')
    .isIn(['customer', 'supplier', 'both'])
    .withMessage('Type must be customer, supplier, or both'),
  body('category')
    .optional()
    .isIn(['individual', 'business', 'government'])
    .withMessage('Category must be individual, business, or government'),
  body('gstin')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GSTIN format'),
  body('pan')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN format'),
  body('contact.phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('addresses')
    .optional()
    .isArray()
    .withMessage('Addresses must be an array'),
  body('addresses.*.line1')
    .optional()
    .notEmpty()
    .withMessage('Address line 1 is required'),
  body('addresses.*.city')
    .optional()
    .notEmpty()
    .withMessage('City is required'),
  body('addresses.*.state')
    .optional()
    .notEmpty()
    .withMessage('State is required'),
  body('addresses.*.pincode')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be 6 digits'),
  body('creditLimit.amount')
    .optional()
    .isNumeric()
    .withMessage('Credit limit amount must be a number'),
  body('creditLimit.days')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Credit limit days must be a positive integer')
];

// @desc    Get parties with outstanding balances
// @route   GET /api/parties/outstanding
// @access  Private
router.get('/outstanding', checkCompanyAccess, getOutstandingParties);

// @desc    Get all parties
// @route   GET /api/parties
// @access  Private
router.get('/', checkCompanyAccess, getParties);

// @desc    Create party
// @route   POST /api/parties
// @access  Private
router.post('/', checkCompanyAccess, partyValidation, createParty);

// @desc    Get single party
// @route   GET /api/parties/:id
// @access  Private
router.get('/:id', checkCompanyAccess, getParty);

// @desc    Update party
// @route   PUT /api/parties/:id
// @access  Private
router.put('/:id', checkCompanyAccess, partyValidation, updateParty);

// @desc    Delete party
// @route   DELETE /api/parties/:id
// @access  Private
router.delete('/:id', checkCompanyAccess, deleteParty);

// @desc    Get party balance
// @route   GET /api/parties/:id/balance
// @access  Private
router.get('/:id/balance', checkCompanyAccess, getPartyBalance);

module.exports = router;
