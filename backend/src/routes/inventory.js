import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  uploadFiles
} from '../controllers/inventoryController.js';

const router = express.Router();

router.use(protect);

// Validation rules for item creation/update
const itemValidation = [
  body('name')
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: 100 })
    .withMessage('Item name cannot exceed 100 characters'),
  body('type')
    .isIn(['product', 'service'])
    .withMessage('Type must be either product or service'),
  body('code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Item code cannot exceed 20 characters'),
  body('barcode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Barcode cannot exceed 50 characters'),
  body('pricing.costPrice')
    .optional()
    .isNumeric()
    .withMessage('Cost price must be a number'),
  body('pricing.sellingPrice')
    .optional()
    .isNumeric()
    .withMessage('Selling price must be a number'),
  body('taxation.hsnCode')
    .optional()
    .matches(/^[0-9]{4,8}$/)
    .withMessage('HSN code must be 4-8 digits'),
  body('taxation.sacCode')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('SAC code must be 6 digits')
];

// @desc    Get all items
// @route   GET /api/inventory/items
// @access  Private
router.get('/items', checkCompanyAccess, getItems);

// @desc    Create item
// @route   POST /api/inventory/items
// @access  Private
router.post('/items', checkCompanyAccess, itemValidation, createItem);

// @desc    Get single item
// @route   GET /api/inventory/items/:id
// @access  Private
router.get('/items/:id', checkCompanyAccess, getItem);

// @desc    Update item
// @route   PUT /api/inventory/items/:id
// @access  Private
router.put('/items/:id', checkCompanyAccess, itemValidation, updateItem);

// @desc    Delete item
// @route   DELETE /api/inventory/items/:id
// @access  Private
router.delete('/items/:id', checkCompanyAccess, deleteItem);

// @desc    Upload item files
// @route   POST /api/inventory/items/:id/upload
// @access  Private
router.post('/items/:id/upload', checkCompanyAccess, uploadFiles);

// Legacy route for backward compatibility
router.get('/', checkCompanyAccess, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Inventory API is ready. Use /items endpoints for item management.'
  });
});

export default router;
