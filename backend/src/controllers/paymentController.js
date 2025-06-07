const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const paymentService = require('../services/paymentService');
const Voucher = require('../models/Voucher');
const Party = require('../models/Party');

// @desc    Create payment order
// @route   POST /api/payments/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { amount, currency, receipt, notes, voucherId } = req.body;

    // Validate voucher if provided
    let voucher = null;
    if (voucherId) {
      voucher = await Voucher.findOne({
        _id: voucherId,
        company: req.company._id
      });

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found'
        });
      }
    }

    const orderData = {
      amount,
      currency,
      receipt: receipt || `receipt_${req.company._id}_${Date.now()}`,
      notes: {
        ...notes,
        companyId: req.company._id.toString(),
        userId: req.user.id.toString(),
        voucherId: voucherId || null
      }
    };

    const result = await paymentService.createOrder(orderData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

    const isValid = paymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details
    const paymentResult = await paymentService.getPayment(razorpay_payment_id);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }

    const payment = paymentResult.data;

    // TODO: Update voucher status, party balance, etc.
    // This would involve:
    // 1. Finding the related voucher from payment notes
    // 2. Updating voucher status to 'paid'
    // 3. Updating party balance
    // 4. Creating payment voucher entry

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100, // Convert from paise
        status: payment.status,
        method: payment.method,
        createdAt: new Date(payment.created_at * 1000)
      }
    });
  } catch (error) {
    logger.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create payment link
// @route   POST /api/payments/links
// @access  Private
exports.createPaymentLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      amount,
      description,
      customer,
      voucherId,
      expireBy,
      acceptPartial,
      callbackUrl
    } = req.body;

    // Validate voucher if provided
    let voucher = null;
    if (voucherId) {
      voucher = await Voucher.findOne({
        _id: voucherId,
        company: req.company._id
      }).populate('party', 'name contact');

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found'
        });
      }
    }

    const linkData = {
      amount,
      description: description || `Payment for ${voucher ? voucher.formattedNumber : 'services'}`,
      customer: customer || (voucher?.party ? {
        name: voucher.party.name,
        phone: voucher.party.contact?.phone,
        email: voucher.party.contact?.email
      } : {}),
      referenceId: voucherId || `ref_${req.company._id}_${Date.now()}`,
      expireBy,
      acceptPartial,
      callbackUrl: callbackUrl || `${process.env.FRONTEND_URL}/payments/callback`,
      notes: {
        companyId: req.company._id.toString(),
        userId: req.user.id.toString(),
        voucherId: voucherId || null
      }
    };

    const result = await paymentService.createPaymentLink(linkData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Create payment link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Generate UPI QR Code
// @route   POST /api/payments/upi-qr
// @access  Private
exports.generateUPIQR = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { amount, transactionNote, voucherId } = req.body;

    // Get company UPI details
    const company = req.company;
    if (!company.banking?.upiId) {
      return res.status(400).json({
        success: false,
        message: 'Company UPI ID not configured'
      });
    }

    // Validate voucher if provided
    let voucher = null;
    if (voucherId) {
      voucher = await Voucher.findOne({
        _id: voucherId,
        company: req.company._id
      });

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher not found'
        });
      }
    }

    const qrData = {
      payeeVPA: company.banking.upiId,
      payeeName: company.name,
      amount,
      transactionNote: transactionNote || `Payment for ${voucher ? voucher.formattedNumber : 'services'}`,
      transactionRef: voucherId || `txn_${Date.now()}`
    };

    const result = await paymentService.generateUPIQRCode(qrData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Generate UPI QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/:paymentId/refund
// @access  Private
exports.processRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const { amount, reason, speed } = req.body;

    const refundData = {
      paymentId,
      amount,
      speed: speed || 'normal',
      notes: {
        reason: reason || 'Refund requested',
        companyId: req.company._id.toString(),
        userId: req.user.id.toString()
      },
      receipt: `refund_${req.company._id}_${Date.now()}`
    };

    const result = await paymentService.processRefund(refundData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Handle payment webhooks
// @route   POST /api/payments/webhook
// @access  Public (but verified)
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    const isValid = paymentService.validateWebhookSignature(req.body, signature);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const result = await paymentService.handleWebhookEvent(req.body);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Handle webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
