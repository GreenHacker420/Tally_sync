import GSTReturn from '../models/GSTReturn.mjs';
import Voucher from '../models/Voucher.js';
import logger from '../utils/logger.js';

// @desc    Get all GST returns
// @route   GET /api/gst/returns
// @access  Private
export const getGSTReturns = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { returnType, filingStatus, year, page = 1, limit = 10 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const query = { company: companyId };
    if (returnType) query.returnType = returnType;
    if (filingStatus) query.filingStatus = filingStatus;
    if (year) query['returnPeriod.year'] = parseInt(year);

    const returns = await GSTReturn.find(query)
      .populate('createdBy', 'name email')
      .sort({ 'returnPeriod.year': -1, 'returnPeriod.month': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await GSTReturn.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        returns,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get GST returns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching GST returns'
    });
  }
};

// @desc    Get single GST return
// @route   GET /api/gst/returns/:id
// @access  Private
export const getGSTReturn = async (req, res) => {
  try {
    const gstReturn = await GSTReturn.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('reconciliation.reconciledBy', 'name email');

    if (!gstReturn) {
      return res.status(404).json({
        success: false,
        message: 'GST return not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { gstReturn }
    });
  } catch (error) {
    logger.error('Get GST return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching GST return'
    });
  }
};

// @desc    Generate GSTR-1
// @route   POST /api/gst/generate/gstr1
// @access  Private
export const generateGSTR1 = async (req, res) => {
  try {
    const { companyId, month, year, gstin } = req.body;

    if (!companyId || !month || !year || !gstin) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, month, year, and GSTIN are required'
      });
    }

    // Fetch all sales vouchers for the period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const salesVouchers = await Voucher.find({
      company: companyId,
      voucherType: { $in: ['sales', 'debit_note', 'credit_note'] },
      date: { $gte: startDate, $lte: endDate }
    }).populate('party', 'name gstin state');

    // Process vouchers into GSTR-1 format
    const b2bInvoices = [];
    const b2clInvoices = [];
    const b2csInvoices = [];
    const hsnSummary = {};

    salesVouchers.forEach(voucher => {
      const taxableValue = voucher.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const igst = voucher.taxDetails?.igst || 0;
      const cgst = voucher.taxDetails?.cgst || 0;
      const sgst = voucher.taxDetails?.sgst || 0;
      const cess = voucher.taxDetails?.cess || 0;

      // B2B - Business to Business (with GSTIN)
      if (voucher.party && voucher.party.gstin) {
        const existingB2B = b2bInvoices.find(b => b.gstin === voucher.party.gstin);
        const invoice = {
          invoiceNumber: voucher.voucherNumber,
          invoiceDate: voucher.date,
          invoiceValue: voucher.totalAmount,
          placeOfSupply: voucher.party.state || '00',
          reverseCharge: voucher.reverseCharge || false,
          invoiceType: voucher.voucherType === 'sales' ? 'Regular' : 'Credit/Debit Note',
          taxableValue,
          igstAmount: igst,
          cgstAmount: cgst,
          sgstAmount: sgst,
          cessAmount: cess
        };

        if (existingB2B) {
          existingB2B.invoices.push(invoice);
        } else {
          b2bInvoices.push({
            gstin: voucher.party.gstin,
            invoices: [invoice]
          });
        }
      }
      // B2CL - Business to Consumer Large (>2.5 lakhs, interstate)
      else if (voucher.totalAmount > 250000 && igst > 0) {
        b2clInvoices.push({
          invoiceNumber: voucher.voucherNumber,
          invoiceDate: voucher.date,
          invoiceValue: voucher.totalAmount,
          placeOfSupply: voucher.placeOfSupply || '00',
          taxableValue,
          igstAmount: igst
        });
      }
      // B2CS - Business to Consumer Small
      else {
        const type = igst > 0 ? 'Interstate' : 'Intrastate';
        b2csInvoices.push({
          type,
          placeOfSupply: voucher.placeOfSupply || '00',
          taxableValue,
          igstAmount: igst,
          cgstAmount: cgst,
          sgstAmount: sgst,
          cessAmount: cess
        });
      }

      // HSN Summary
      voucher.items?.forEach(item => {
        const hsnCode = item.hsnCode || 'NA';
        if (!hsnSummary[hsnCode]) {
          hsnSummary[hsnCode] = {
            hsnCode,
            description: item.description || item.name,
            uqc: item.unit || 'NOS',
            totalQuantity: 0,
            totalValue: 0,
            taxableValue: 0,
            igstAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            cessAmount: 0
          };
        }
        hsnSummary[hsnCode].totalQuantity += item.quantity || 0;
        hsnSummary[hsnCode].totalValue += item.amount || 0;
        hsnSummary[hsnCode].taxableValue += item.amount || 0;
        hsnSummary[hsnCode].igstAmount += (item.igst || 0);
        hsnSummary[hsnCode].cgstAmount += (item.cgst || 0);
        hsnSummary[hsnCode].sgstAmount += (item.sgst || 0);
      });
    });

    // Calculate due date (11th of next month)
    const dueDate = new Date(year, month, 11);

    // Create GSTR-1 return
    const gstr1 = await GSTReturn.create({
      company: companyId,
      gstin,
      returnType: 'GSTR1',
      returnPeriod: { month, year },
      dueDate,
      gstr1Data: {
        b2b: b2bInvoices,
        b2cl: b2clInvoices,
        b2cs: b2csInvoices,
        hsn: Object.values(hsnSummary)
      },
      summary: {
        totalInvoices: salesVouchers.length,
        totalTaxableValue: salesVouchers.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
      },
      createdBy: req.user.id
    });

    logger.info(`GSTR-1 generated for ${month}/${year} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'GSTR-1 generated successfully',
      data: { gstr1 }
    });
  } catch (error) {
    logger.error('Generate GSTR-1 error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating GSTR-1',
      error: error.message
    });
  }
};

// @desc    Generate GSTR-3B
// @route   POST /api/gst/generate/gstr3b
// @access  Private
export const generateGSTR3B = async (req, res) => {
  try {
    const { companyId, month, year, gstin } = req.body;

    if (!companyId || !month || !year || !gstin) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, month, year, and GSTIN are required'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch outward supplies (sales)
    const salesVouchers = await Voucher.find({
      company: companyId,
      voucherType: { $in: ['sales', 'debit_note'] },
      date: { $gte: startDate, $lte: endDate }
    });

    // Fetch inward supplies (purchases)
    const purchaseVouchers = await Voucher.find({
      company: companyId,
      voucherType: { $in: ['purchase', 'credit_note'] },
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate outward supplies
    const outwardSupplies = salesVouchers.reduce((acc, v) => ({
      taxableValue: acc.taxableValue + (v.totalAmount || 0),
      igstAmount: acc.igstAmount + (v.taxDetails?.igst || 0),
      cgstAmount: acc.cgstAmount + (v.taxDetails?.cgst || 0),
      sgstAmount: acc.sgstAmount + (v.taxDetails?.sgst || 0),
      cessAmount: acc.cessAmount + (v.taxDetails?.cess || 0)
    }), { taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0 });

    // Calculate inward supplies and ITC
    const inwardSupplies = purchaseVouchers.reduce((acc, v) => ({
      taxableValue: acc.taxableValue + (v.totalAmount || 0),
      igstAmount: acc.igstAmount + (v.taxDetails?.igst || 0),
      cgstAmount: acc.cgstAmount + (v.taxDetails?.cgst || 0),
      sgstAmount: acc.sgstAmount + (v.taxDetails?.sgst || 0),
      cessAmount: acc.cessAmount + (v.taxDetails?.cess || 0)
    }), { taxableValue: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0 });

    // ITC Availed (same as inward supplies for now)
    const itcAvailed = { ...inwardSupplies };
    delete itcAvailed.taxableValue;

    // Calculate tax payable
    const taxPayable = {
      igstAmount: Math.max(0, outwardSupplies.igstAmount - itcAvailed.igstAmount),
      cgstAmount: Math.max(0, outwardSupplies.cgstAmount - itcAvailed.cgstAmount),
      sgstAmount: Math.max(0, outwardSupplies.sgstAmount - itcAvailed.sgstAmount),
      cessAmount: Math.max(0, outwardSupplies.cessAmount - itcAvailed.cessAmount)
    };

    const dueDate = new Date(year, month, 20); // 20th of next month

    const gstr3b = await GSTReturn.create({
      company: companyId,
      gstin,
      returnType: 'GSTR3B',
      returnPeriod: { month, year },
      dueDate,
      gstr3bData: {
        outwardSupplies,
        inwardSupplies,
        itcAvailed,
        itcReversed: { igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0 },
        taxPayable,
        taxPaid: { igstAmount: 0, cgstAmount: 0, sgstAmount: 0, cessAmount: 0, interest: 0, lateFee: 0 }
      },
      createdBy: req.user.id
    });

    logger.info(`GSTR-3B generated for ${month}/${year} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'GSTR-3B generated successfully',
      data: { gstr3b }
    });
  } catch (error) {
    logger.error('Generate GSTR-3B error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating GSTR-3B',
      error: error.message
    });
  }
};

// @desc    File GST return
// @route   PUT /api/gst/returns/:id/file
// @access  Private
export const fileGSTReturn = async (req, res) => {
  try {
    const gstReturn = await GSTReturn.findById(req.params.id);

    if (!gstReturn) {
      return res.status(404).json({
        success: false,
        message: 'GST return not found'
      });
    }

    gstReturn.filingStatus = 'filed';
    gstReturn.filedDate = new Date();
    gstReturn.updatedBy = req.user.id;
    await gstReturn.save();

    logger.info(`GST return filed: ${gstReturn.returnType} for ${gstReturn.returnPeriod.month}/${gstReturn.returnPeriod.year}`);

    res.status(200).json({
      success: true,
      message: 'GST return filed successfully',
      data: { gstReturn }
    });
  } catch (error) {
    logger.error('File GST return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while filing GST return'
    });
  }
};

// @desc    Get pending returns
// @route   GET /api/gst/returns/pending
// @access  Private
export const getPendingReturns = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const pendingReturns = await GSTReturn.getPendingReturns(companyId);
    const overdueReturns = await GSTReturn.getOverdueReturns(companyId);

    res.status(200).json({
      success: true,
      data: {
        pending: pendingReturns,
        overdue: overdueReturns
      }
    });
  } catch (error) {
    logger.error('Get pending returns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending returns'
    });
  }
};

// @desc    Reconcile GST return
// @route   POST /api/gst/returns/:id/reconcile
// @access  Private
export const reconcileGSTReturn = async (req, res) => {
  try {
    const { mismatches } = req.body;
    
    const gstReturn = await GSTReturn.findById(req.params.id);

    if (!gstReturn) {
      return res.status(404).json({
        success: false,
        message: 'GST return not found'
      });
    }

    gstReturn.reconciliation.status = mismatches && mismatches.length > 0 ? 'mismatch' : 'completed';
    gstReturn.reconciliation.mismatches = mismatches || [];
    gstReturn.reconciliation.reconciledBy = req.user.id;
    gstReturn.reconciliation.reconciledAt = new Date();
    await gstReturn.save();

    res.status(200).json({
      success: true,
      message: 'GST return reconciled successfully',
      data: { gstReturn }
    });
  } catch (error) {
    logger.error('Reconcile GST return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reconciling GST return'
    });
  }
};
