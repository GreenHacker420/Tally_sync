const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const EmailService = require('../services/emailService');
const Voucher = require('../models/Voucher');
const Party = require('../models/Party');
const User = require('../models/User');
const PDFService = require('../services/pdfService');
const moment = require('moment');

// @desc    Send email with template
// @route   POST /api/emails/send
// @access  Private
exports.sendEmail = async (req, res) => {
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
      to,
      subject,
      template,
      data = {},
      attachments = [],
      priority = 'normal'
    } = req.body;

    // Add company and user context to template data
    const templateData = {
      ...data,
      company: req.company,
      user: req.user,
      currentDate: moment().format('DD/MM/YYYY HH:mm')
    };

    const result = await EmailService.sendEmail({
      to,
      subject,
      template,
      data: templateData,
      attachments,
      priority
    });

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
    logger.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send invoice notification
// @route   POST /api/emails/invoice-notification
// @access  Private
exports.sendInvoiceNotification = async (req, res) => {
  try {
    const { voucherId, includePDF = true, customMessage } = req.body;

    // Get voucher with party details
    const voucher = await Voucher.findOne({
      _id: voucherId,
      company: req.company._id
    })
    .populate('party', 'name displayName contact')
    .populate('company', 'name contact');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    if (!voucher.party || !voucher.party.contact?.email) {
      return res.status(400).json({
        success: false,
        message: 'Party email not found'
      });
    }

    // Generate PDF if requested
    let attachments = [];
    if (includePDF) {
      try {
        const pdfBuffer = await PDFService.generateVoucherPDF(voucher);
        attachments.push({
          filename: `${voucher.formattedNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      } catch (pdfError) {
        logger.warn('PDF generation failed for invoice notification:', pdfError);
      }
    }

    const templateData = {
      party: voucher.party,
      voucher: {
        formattedNumber: voucher.formattedNumber,
        date: moment(voucher.date).format('DD/MM/YYYY'),
        amount: voucher.totals?.grandTotal?.toFixed(2) || '0.00',
        dueDate: voucher.dueDate ? moment(voucher.dueDate).format('DD/MM/YYYY') : null
      },
      company: req.company,
      customMessage,
      currentDate: moment().format('DD/MM/YYYY HH:mm')
    };

    const result = await EmailService.sendEmail({
      to: voucher.party.contact.email,
      subject: `Invoice ${voucher.formattedNumber} - ${req.company.name}`,
      template: 'invoice-notification',
      data: templateData,
      attachments,
      priority: 'high'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice notification sent successfully',
      data: result.data
    });
  } catch (error) {
    logger.error('Send invoice notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send payment reminder
// @route   POST /api/emails/payment-reminder
// @access  Private
exports.sendPaymentReminder = async (req, res) => {
  try {
    const { voucherId, customMessage } = req.body;

    // Get voucher with party details
    const voucher = await Voucher.findOne({
      _id: voucherId,
      company: req.company._id
    })
    .populate('party', 'name displayName contact')
    .populate('company', 'name contact');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    if (!voucher.party || !voucher.party.contact?.email) {
      return res.status(400).json({
        success: false,
        message: 'Party email not found'
      });
    }

    if (!voucher.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Voucher has no due date'
      });
    }

    const overdueDays = moment().diff(moment(voucher.dueDate), 'days');
    const isOverdue = overdueDays > 0;

    const templateData = {
      party: voucher.party,
      voucher: {
        formattedNumber: voucher.formattedNumber,
        dueDate: moment(voucher.dueDate).format('DD/MM/YYYY'),
        amount: voucher.totals?.grandTotal?.toFixed(2) || '0.00'
      },
      company: req.company,
      isOverdue,
      overdueDays: Math.abs(overdueDays),
      customMessage,
      currentDate: moment().format('DD/MM/YYYY HH:mm')
    };

    const subject = isOverdue 
      ? `URGENT: Payment Overdue - ${voucher.formattedNumber}`
      : `Payment Reminder - ${voucher.formattedNumber}`;

    const result = await EmailService.sendEmail({
      to: voucher.party.contact.email,
      subject,
      template: 'payment-reminder',
      data: templateData,
      priority: isOverdue ? 'high' : 'normal'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: result.data
    });
  } catch (error) {
    logger.error('Send payment reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send bulk payment reminders
// @route   POST /api/emails/bulk-payment-reminders
// @access  Private
exports.sendBulkPaymentReminders = async (req, res) => {
  try {
    const { voucherIds, customMessage } = req.body;

    if (!Array.isArray(voucherIds) || voucherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Voucher IDs array is required'
      });
    }

    // Get vouchers with party details
    const vouchers = await Voucher.find({
      _id: { $in: voucherIds },
      company: req.company._id,
      dueDate: { $exists: true }
    })
    .populate('party', 'name displayName contact')
    .populate('company', 'name contact');

    const emailsData = [];
    const results = [];

    for (const voucher of vouchers) {
      if (!voucher.party || !voucher.party.contact?.email) {
        results.push({
          voucherId: voucher._id,
          success: false,
          message: 'Party email not found'
        });
        continue;
      }

      const overdueDays = moment().diff(moment(voucher.dueDate), 'days');
      const isOverdue = overdueDays > 0;

      const templateData = {
        party: voucher.party,
        voucher: {
          formattedNumber: voucher.formattedNumber,
          dueDate: moment(voucher.dueDate).format('DD/MM/YYYY'),
          amount: voucher.totals?.grandTotal?.toFixed(2) || '0.00'
        },
        company: req.company,
        isOverdue,
        overdueDays: Math.abs(overdueDays),
        customMessage,
        currentDate: moment().format('DD/MM/YYYY HH:mm')
      };

      const subject = isOverdue 
        ? `URGENT: Payment Overdue - ${voucher.formattedNumber}`
        : `Payment Reminder - ${voucher.formattedNumber}`;

      emailsData.push({
        mailOptions: {
          to: voucher.party.contact.email,
          subject,
          template: 'payment-reminder',
          data: templateData,
          priority: isOverdue ? 'high' : 'normal'
        },
        trackDelivery: true,
        voucherId: voucher._id
      });
    }

    const bulkResult = await EmailService.sendBulkEmails(emailsData);

    res.status(200).json({
      success: true,
      message: 'Bulk payment reminders queued successfully',
      data: {
        totalVouchers: voucherIds.length,
        emailsQueued: emailsData.length,
        results: bulkResult.data.results
      }
    });
  } catch (error) {
    logger.error('Send bulk payment reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Preview email template
// @route   GET /api/emails/preview/:template
// @access  Private
exports.previewTemplate = async (req, res) => {
  try {
    const { template } = req.params;
    const { data = {} } = req.query;

    // Parse data if it's a JSON string
    let templateData = {};
    if (typeof data === 'string') {
      try {
        templateData = JSON.parse(data);
      } catch {
        templateData = {};
      }
    } else {
      templateData = data;
    }

    // Add default sample data for preview
    const sampleData = {
      company: {
        name: req.company?.name || 'Sample Company Ltd.',
        contact: {
          phone: '+91 9876543210',
          email: 'info@samplecompany.com'
        }
      },
      party: {
        name: 'Sample Customer',
        contact: {
          email: 'customer@example.com'
        }
      },
      voucher: {
        formattedNumber: 'INV2024-0001',
        date: moment().format('DD/MM/YYYY'),
        dueDate: moment().add(30, 'days').format('DD/MM/YYYY'),
        amount: '15,750.00'
      },
      user: {
        name: req.user?.name || 'Sample User',
        email: req.user?.email || 'user@example.com'
      },
      payment: {
        id: 'pay_sample123',
        amount: '15,750.00',
        date: moment().format('DD/MM/YYYY'),
        method: 'UPI',
        status: 'Success'
      },
      isOverdue: false,
      overdueDays: 0,
      verificationLink: 'https://app.finsync360.com/verify?token=sample',
      verificationCode: '123456',
      resetLink: 'https://app.finsync360.com/reset?token=sample',
      dashboardLink: 'https://app.finsync360.com/dashboard',
      helpLink: 'https://app.finsync360.com/help',
      currentDate: moment().format('DD/MM/YYYY HH:mm'),
      ...templateData
    };

    const html = EmailService.previewTemplate(template, sampleData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Preview template error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get email queue status
// @route   GET /api/emails/queue-status
// @access  Private
exports.getQueueStatus = async (req, res) => {
  try {
    const status = EmailService.getQueueStatus();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get email delivery status
// @route   GET /api/emails/delivery-status/:messageId
// @access  Private
exports.getDeliveryStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const status = EmailService.getDeliveryStatus(messageId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
