const Item = require('../models/Item');
const Company = require('../models/Company');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/items/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      // Allow only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for images'));
      }
    } else if (file.fieldname === 'documents') {
      // Allow documents
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and Word documents are allowed'));
      }
    } else {
      cb(new Error('Invalid field name'));
    }
  }
});

// @desc    Get all items
// @route   GET /api/inventory/items
// @access  Private
exports.getItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      search,
      lowStock,
      outOfStock
    } = req.query;

    const query = { company: req.company._id, isActive: true };

    // Add filters
    if (category) query.category = category;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 },
      populate: [
        { path: 'category', select: 'name' },
        { path: 'suppliers.party', select: 'name displayName' }
      ]
    };

    let items = await Item.paginate(query, options);

    // Filter by stock levels if requested
    if (lowStock === 'true' || outOfStock === 'true') {
      items.docs = items.docs.filter(item => {
        if (!item.inventory.trackInventory) return false;
        
        const totalStock = item.totalStock;
        
        if (outOfStock === 'true' && totalStock <= 0) return true;
        if (lowStock === 'true' && totalStock <= item.inventory.stockLevels.reorderLevel && totalStock > 0) return true;
        
        return false;
      });
    }

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single item
// @route   GET /api/inventory/items/:id
// @access  Private
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      company: req.company._id
    })
    .populate('category', 'name description')
    .populate('suppliers.party', 'name displayName contact')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create item
// @route   POST /api/inventory/items
// @access  Private
exports.createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const itemData = {
      ...req.body,
      company: req.company._id,
      createdBy: req.user.id
    };

    // Check for duplicate code/barcode
    if (itemData.code) {
      const existingItem = await Item.findOne({
        company: req.company._id,
        code: itemData.code,
        isActive: true
      });
      
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item code already exists'
        });
      }
    }

    if (itemData.barcode) {
      const existingItem = await Item.findOne({
        company: req.company._id,
        barcode: itemData.barcode,
        isActive: true
      });
      
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Barcode already exists'
        });
      }
    }

    const item = await Item.create(itemData);

    const populatedItem = await Item.findById(item._id)
      .populate('category', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedItem
    });
  } catch (error) {
    logger.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update item
// @route   PUT /api/inventory/items/:id
// @access  Private
exports.updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    let item = await Item.findOne({
      _id: req.params.id,
      company: req.company._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check for duplicate code/barcode (excluding current item)
    if (req.body.code && req.body.code !== item.code) {
      const existingItem = await Item.findOne({
        company: req.company._id,
        code: req.body.code,
        _id: { $ne: req.params.id },
        isActive: true
      });
      
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item code already exists'
        });
      }
    }

    if (req.body.barcode && req.body.barcode !== item.barcode) {
      const existingItem = await Item.findOne({
        company: req.company._id,
        barcode: req.body.barcode,
        _id: { $ne: req.params.id },
        isActive: true
      });
      
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Barcode already exists'
        });
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    item = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('category', 'name')
    .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete item
// @route   DELETE /api/inventory/items/:id
// @access  Private
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      company: req.company._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Soft delete
    item.isActive = false;
    item.updatedBy = req.user.id;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload item images/documents
// @route   POST /api/inventory/items/:id/upload
// @access  Private
exports.uploadFiles = [
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 3 }
  ]),
  async (req, res) => {
    try {
      const item = await Item.findOne({
        _id: req.params.id,
        company: req.company._id
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Process uploaded images
      if (req.files.images) {
        req.files.images.forEach(file => {
          item.images.push({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            isPrimary: item.images.length === 0 // First image is primary
          });
        });
      }

      // Process uploaded documents
      if (req.files.documents) {
        req.files.documents.forEach(file => {
          item.documents.push({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            type: 'other' // Default type, can be updated later
          });
        });
      }

      await item.save();

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          images: item.images,
          documents: item.documents
        }
      });
    } catch (error) {
      logger.error('Upload files error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
];
