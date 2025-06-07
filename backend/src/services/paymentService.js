const Razorpay = require('razorpay');
const crypto = require('crypto');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Create payment order
  async createOrder(orderData) {
    try {
      const options = {
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt || `receipt_${Date.now()}`,
        notes: orderData.notes || {}
      };

      const order = await this.razorpay.orders.create(options);
      
      logger.info('Razorpay order created:', { orderId: order.id, amount: order.amount });
      
      return {
        success: true,
        data: order
      };
    } catch (error) {
      logger.error('Create order error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;
      
      logger.info('Payment signature verification:', { 
        paymentId: razorpay_payment_id, 
        isValid: isSignatureValid 
      });
      
      return isSignatureValid;
    } catch (error) {
      logger.error('Verify payment signature error:', error);
      return false;
    }
  }

  // Get payment details
  async getPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      return {
        success: true,
        data: payment
      };
    } catch (error) {
      logger.error('Get payment error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Create payment link
  async createPaymentLink(linkData) {
    try {
      const options = {
        amount: Math.round(linkData.amount * 100), // Convert to paise
        currency: linkData.currency || 'INR',
        accept_partial: linkData.acceptPartial || false,
        first_min_partial_amount: linkData.firstMinPartialAmount ? Math.round(linkData.firstMinPartialAmount * 100) : undefined,
        expire_by: linkData.expireBy || Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
        reference_id: linkData.referenceId || `ref_${Date.now()}`,
        description: linkData.description || 'Payment for services',
        customer: {
          name: linkData.customer.name,
          contact: linkData.customer.phone,
          email: linkData.customer.email
        },
        notify: {
          sms: linkData.notify?.sms || true,
          email: linkData.notify?.email || true
        },
        reminder_enable: linkData.reminderEnable || true,
        notes: linkData.notes || {},
        callback_url: linkData.callbackUrl,
        callback_method: linkData.callbackMethod || 'get'
      };

      const paymentLink = await this.razorpay.paymentLink.create(options);
      
      logger.info('Payment link created:', { linkId: paymentLink.id, amount: paymentLink.amount });
      
      return {
        success: true,
        data: paymentLink
      };
    } catch (error) {
      logger.error('Create payment link error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Generate UPI QR Code
  async generateUPIQRCode(qrData) {
    try {
      const { 
        payeeVPA, 
        payeeName, 
        amount, 
        transactionNote, 
        transactionRef 
      } = qrData;

      // UPI URL format
      const upiUrl = `upi://pay?pa=${payeeVPA}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote || 'Payment')}&tr=${transactionRef || Date.now()}`;
      
      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(upiUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      logger.info('UPI QR code generated:', { payeeVPA, amount });

      return {
        success: true,
        data: {
          qrCodeDataURL,
          upiUrl,
          payeeVPA,
          amount,
          transactionRef: transactionRef || Date.now()
        }
      };
    } catch (error) {
      logger.error('Generate UPI QR code error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Process refund
  async processRefund(refundData) {
    try {
      const options = {
        amount: Math.round(refundData.amount * 100), // Convert to paise
        speed: refundData.speed || 'normal', // normal or optimum
        notes: refundData.notes || {},
        receipt: refundData.receipt || `refund_${Date.now()}`
      };

      const refund = await this.razorpay.payments.refund(refundData.paymentId, options);
      
      logger.info('Refund processed:', { refundId: refund.id, amount: refund.amount });
      
      return {
        success: true,
        data: refund
      };
    } catch (error) {
      logger.error('Process refund error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get refund details
  async getRefund(paymentId, refundId) {
    try {
      const refund = await this.razorpay.payments.fetchRefund(paymentId, refundId);
      
      return {
        success: true,
        data: refund
      };
    } catch (error) {
      logger.error('Get refund error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Validate webhook signature
  validateWebhookSignature(body, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Validate webhook signature error:', error);
      return false;
    }
  }

  // Handle webhook events
  async handleWebhookEvent(event) {
    try {
      const { entity, event: eventType } = event;
      
      logger.info('Processing webhook event:', { eventType, entityId: entity.id });

      switch (eventType) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(entity);
        
        case 'payment.failed':
          return await this.handlePaymentFailed(entity);
        
        case 'order.paid':
          return await this.handleOrderPaid(entity);
        
        case 'refund.created':
          return await this.handleRefundCreated(entity);
        
        case 'refund.processed':
          return await this.handleRefundProcessed(entity);
        
        default:
          logger.info('Unhandled webhook event:', eventType);
          return { success: true, message: 'Event acknowledged' };
      }
    } catch (error) {
      logger.error('Handle webhook event error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Handle payment captured event
  async handlePaymentCaptured(payment) {
    // Update voucher status, party balance, etc.
    logger.info('Payment captured:', { paymentId: payment.id, amount: payment.amount });
    
    // TODO: Implement business logic
    // - Find related voucher/order
    // - Update payment status
    // - Update party balance
    // - Send confirmation notifications
    
    return { success: true, message: 'Payment captured processed' };
  }

  // Handle payment failed event
  async handlePaymentFailed(payment) {
    logger.info('Payment failed:', { paymentId: payment.id, errorCode: payment.error_code });
    
    // TODO: Implement business logic
    // - Update payment status
    // - Send failure notifications
    // - Log failure reasons
    
    return { success: true, message: 'Payment failure processed' };
  }

  // Handle order paid event
  async handleOrderPaid(order) {
    logger.info('Order paid:', { orderId: order.id, amount: order.amount });
    
    // TODO: Implement business logic
    // - Update order status
    // - Generate invoice
    // - Send confirmation
    
    return { success: true, message: 'Order paid processed' };
  }

  // Handle refund created event
  async handleRefundCreated(refund) {
    logger.info('Refund created:', { refundId: refund.id, amount: refund.amount });
    
    // TODO: Implement business logic
    // - Update refund status
    // - Adjust party balance
    // - Send notifications
    
    return { success: true, message: 'Refund created processed' };
  }

  // Handle refund processed event
  async handleRefundProcessed(refund) {
    logger.info('Refund processed:', { refundId: refund.id, amount: refund.amount });
    
    // TODO: Implement business logic
    // - Update refund status
    // - Send confirmation
    
    return { success: true, message: 'Refund processed' };
  }
}

module.exports = new PaymentService();
