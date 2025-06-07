const Voucher = require('../models/Voucher');
const Party = require('../models/Party');
const Item = require('../models/Item');
const Company = require('../models/Company');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const PDFService = require('../services/pdfService');
const moment = require('moment');

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private
exports.getVouchers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      voucherType,
      status,
      party,
      fromDate,
      toDate,
      search
    } = req.query;

    const query = { company: req.company._id };

    // Add filters
    if (voucherType) query.voucherType = voucherType;
    if (status) query.status = status;
    if (party) query.party = party;
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    if (search) {
      query.$or = [
        { voucherNumber: { $regex: search, $options: 'i' } },
        { narration: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1, createdAt: -1 },
      populate: [
        { path: 'party', select: 'name displayName type gstin' },
        { path: 'createdBy', select: 'name email' },
        { path: 'updatedBy', select: 'name email' }
      ]
    };

    const vouchers = await Voucher.paginate(query, options);

    res.status(200).json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    logger.error('Get vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Private
exports.getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findOne({
      _id: req.params.id,
      company: req.company._id
    })
    .populate('party', 'name displayName type gstin contact addresses')
    .populate('items.item', 'name displayName code units pricing taxation')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    logger.error('Get voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create voucher
// @route   POST /api/vouchers
// @access  Private
exports.createVoucher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Generate voucher number
    const voucherNumber = await generateVoucherNumber(
      req.company._id,
      req.body.voucherType
    );

    const voucherData = {
      ...req.body,
      company: req.company._id,
      voucherNumber,
      createdBy: req.user.id
    };

    // Calculate totals for sales/purchase vouchers
    if (['sales', 'purchase'].includes(req.body.voucherType)) {
      const calculations = calculateVoucherTotals(req.body.items || []);
      voucherData.totals = calculations;
    }

    const voucher = await Voucher.create(voucherData);

    // Update party balance if applicable
    if (voucher.party && ['sales', 'purchase', 'receipt', 'payment'].includes(voucher.voucherType)) {
      await updatePartyBalance(voucher);
    }

    // Update inventory if applicable
    if (['sales', 'purchase'].includes(voucher.voucherType) && voucher.items) {
      await updateInventory(voucher);
    }

    const populatedVoucher = await Voucher.findById(voucher._id)
      .populate('party', 'name displayName type gstin')
      .populate('items.item', 'name displayName code units')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedVoucher
    });
  } catch (error) {
    logger.error('Create voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Private
exports.updateVoucher = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    let voucher = await Voucher.findOne({
      _id: req.params.id,
      company: req.company._id
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check if voucher can be updated
    if (voucher.status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update approved voucher'
      });
    }

    // Store original data for reversal
    const originalVoucher = voucher.toObject();

    // Update voucher data
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    // Recalculate totals for sales/purchase vouchers
    if (['sales', 'purchase'].includes(voucher.voucherType)) {
      const calculations = calculateVoucherTotals(req.body.items || []);
      updateData.totals = calculations;
    }

    voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('party', 'name displayName type gstin')
    .populate('items.item', 'name displayName code units')
    .populate('updatedBy', 'name email');

    // Reverse original effects and apply new ones
    if (originalVoucher.party && ['sales', 'purchase', 'receipt', 'payment'].includes(originalVoucher.voucherType)) {
      await reversePartyBalance(originalVoucher);
      await updatePartyBalance(voucher);
    }

    if (['sales', 'purchase'].includes(originalVoucher.voucherType) && originalVoucher.items) {
      await reverseInventory(originalVoucher);
      await updateInventory(voucher);
    }

    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    logger.error('Update voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Private
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findOne({
      _id: req.params.id,
      company: req.company._id
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check if voucher can be deleted
    if (voucher.status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete approved voucher'
      });
    }

    // Reverse effects before deletion
    if (voucher.party && ['sales', 'purchase', 'receipt', 'payment'].includes(voucher.voucherType)) {
      await reversePartyBalance(voucher);
    }

    if (['sales', 'purchase'].includes(voucher.voucherType) && voucher.items) {
      await reverseInventory(voucher);
    }

    await voucher.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    logger.error('Delete voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Generate PDF for voucher
// @route   GET /api/vouchers/:id/pdf
// @access  Private
exports.generateVoucherPDF = async (req, res) => {
  try {
    const voucher = await Voucher.findOne({
      _id: req.params.id,
      company: req.company._id
    })
    .populate('party', 'name displayName type gstin contact addresses')
    .populate('items.item', 'name displayName code units pricing taxation')
    .populate('company', 'name displayName gstin addresses contact');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    const pdfBuffer = await PDFService.generateVoucherPDF(voucher);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${voucher.formattedNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Generate voucher PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper Functions

// Generate voucher number
const generateVoucherNumber = async (companyId, voucherType) => {
  const currentYear = new Date().getFullYear();
  const prefix = voucherType.toUpperCase().substring(0, 3);

  const lastVoucher = await Voucher.findOne({
    company: companyId,
    voucherType,
    voucherNumber: { $regex: `^${prefix}${currentYear}` }
  }).sort({ voucherNumber: -1 });

  let nextNumber = 1;
  if (lastVoucher) {
    const lastNumber = parseInt(lastVoucher.voucherNumber.split('-').pop());
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
};

// Calculate voucher totals
const calculateVoucherTotals = (items) => {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const itemTotal = item.quantity * item.rate;
    const itemDiscount = (itemTotal * (item.discountPercentage || 0)) / 100;
    const itemTaxableAmount = itemTotal - itemDiscount;

    const cgst = (itemTaxableAmount * (item.cgst || 0)) / 100;
    const sgst = (itemTaxableAmount * (item.sgst || 0)) / 100;
    const igst = (itemTaxableAmount * (item.igst || 0)) / 100;
    const cess = (itemTaxableAmount * (item.cess || 0)) / 100;

    const itemTax = cgst + sgst + igst + cess;

    subtotal += itemTotal;
    totalDiscount += itemDiscount;
    totalTax += itemTax;
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  return {
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
    taxBreakup: {
      cgst: items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.quantity * item.rate * (item.discountPercentage || 0)) / 100) * (item.cgst || 0)) / 100, 0),
      sgst: items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.quantity * item.rate * (item.discountPercentage || 0)) / 100) * (item.sgst || 0)) / 100, 0),
      igst: items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.quantity * item.rate * (item.discountPercentage || 0)) / 100) * (item.igst || 0)) / 100, 0),
      cess: items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.quantity * item.rate * (item.discountPercentage || 0)) / 100) * (item.cess || 0)) / 100, 0)
    }
  };
};

// Update party balance
const updatePartyBalance = async (voucher) => {
  if (!voucher.party) return;

  const party = await Party.findById(voucher.party);
  if (!party) return;

  let balanceChange = 0;
  let balanceType = 'debit';

  switch (voucher.voucherType) {
    case 'sales':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'debit'; // Customer owes us
      break;
    case 'purchase':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'credit'; // We owe supplier
      break;
    case 'receipt':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'credit'; // Reduce customer balance
      break;
    case 'payment':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'debit'; // Reduce supplier balance
      break;
  }

  // Update party balance
  if (party.balances.current.type === balanceType) {
    party.balances.current.amount += balanceChange;
  } else {
    if (party.balances.current.amount >= balanceChange) {
      party.balances.current.amount -= balanceChange;
    } else {
      party.balances.current.amount = balanceChange - party.balances.current.amount;
      party.balances.current.type = balanceType;
    }
  }

  party.balances.current.lastUpdated = new Date();
  await party.save();
};

// Reverse party balance
const reversePartyBalance = async (voucher) => {
  if (!voucher.party) return;

  const party = await Party.findById(voucher.party);
  if (!party) return;

  let balanceChange = 0;
  let balanceType = 'debit';

  switch (voucher.voucherType) {
    case 'sales':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'credit'; // Reverse debit
      break;
    case 'purchase':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'debit'; // Reverse credit
      break;
    case 'receipt':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'debit'; // Reverse credit
      break;
    case 'payment':
      balanceChange = voucher.totals.grandTotal;
      balanceType = 'credit'; // Reverse debit
      break;
  }

  // Reverse party balance
  if (party.balances.current.type === balanceType) {
    party.balances.current.amount += balanceChange;
  } else {
    if (party.balances.current.amount >= balanceChange) {
      party.balances.current.amount -= balanceChange;
    } else {
      party.balances.current.amount = balanceChange - party.balances.current.amount;
      party.balances.current.type = balanceType;
    }
  }

  party.balances.current.lastUpdated = new Date();
  await party.save();
};

// Update inventory
const updateInventory = async (voucher) => {
  if (!voucher.items || voucher.items.length === 0) return;

  for (const voucherItem of voucher.items) {
    const item = await Item.findById(voucherItem.item);
    if (!item || !item.inventory.trackInventory) continue;

    const quantityChange = voucher.voucherType === 'sales' ? -voucherItem.quantity : voucherItem.quantity;

    // Update stock in default godown (first godown or create default)
    let stockEntry = item.inventory.currentStock.find(stock =>
      stock.godown?.toString() === voucherItem.godown?.toString()
    );

    if (!stockEntry) {
      stockEntry = {
        godown: voucherItem.godown,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        lastUpdated: new Date()
      };
      item.inventory.currentStock.push(stockEntry);
    }

    stockEntry.quantity += quantityChange;
    stockEntry.availableQuantity = stockEntry.quantity - stockEntry.reservedQuantity;
    stockEntry.lastUpdated = new Date();

    await item.save();
  }
};

// Reverse inventory
const reverseInventory = async (voucher) => {
  if (!voucher.items || voucher.items.length === 0) return;

  for (const voucherItem of voucher.items) {
    const item = await Item.findById(voucherItem.item);
    if (!item || !item.inventory.trackInventory) continue;

    const quantityChange = voucher.voucherType === 'sales' ? voucherItem.quantity : -voucherItem.quantity;

    const stockEntry = item.inventory.currentStock.find(stock =>
      stock.godown?.toString() === voucherItem.godown?.toString()
    );

    if (stockEntry) {
      stockEntry.quantity += quantityChange;
      stockEntry.availableQuantity = stockEntry.quantity - stockEntry.reservedQuantity;
      stockEntry.lastUpdated = new Date();

      await item.save();
    }
  }
};
