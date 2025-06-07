const request = require('supertest');
const app = require('../src/server');
const TestDataHelper = require('./helpers/testData');

// Mock Razorpay
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 100000,
        currency: 'INR',
        receipt: 'receipt_test',
        status: 'created'
      })
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: 'pay_test123',
        order_id: 'order_test123',
        amount: 100000,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        created_at: Math.floor(Date.now() / 1000)
      }),
      refund: jest.fn().mockResolvedValue({
        id: 'rfnd_test123',
        payment_id: 'pay_test123',
        amount: 50000,
        currency: 'INR',
        status: 'processed'
      }),
      fetchRefund: jest.fn().mockResolvedValue({
        id: 'rfnd_test123',
        payment_id: 'pay_test123',
        amount: 50000,
        status: 'processed'
      })
    },
    paymentLink: {
      create: jest.fn().mockResolvedValue({
        id: 'plink_test123',
        short_url: 'https://rzp.io/i/test123',
        amount: 100000,
        currency: 'INR',
        status: 'created'
      })
    }
  }));
});

describe('Payment Endpoints', () => {
  let testHelper;
  let testData;
  let token;

  beforeEach(async () => {
    testHelper = new TestDataHelper();
    testData = await testHelper.createCompleteTestData();
    token = testData.token;
    
    // Set environment variables for testing
    process.env.RAZORPAY_KEY_ID = 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  });

  afterEach(async () => {
    await testHelper.cleanup();
    jest.clearAllMocks();
  });

  describe('POST /api/payments/orders', () => {
    it('should create payment order successfully', async () => {
      const orderData = {
        amount: 1000,
        currency: 'INR',
        receipt: 'test_receipt_001',
        voucherId: testData.voucher._id
      };

      const response = await request(app)
        .post('/api/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order_test123');
      expect(response.body.data.amount).toBe(100000); // Amount in paise
      expect(response.body.data.currency).toBe('INR');
    });

    it('should create payment order without voucher', async () => {
      const orderData = {
        amount: 500,
        currency: 'INR'
      };

      const response = await request(app)
        .post('/api/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order_test123');
    });

    it('should not create order with invalid amount', async () => {
      const orderData = {
        amount: -100,
        currency: 'INR'
      };

      const response = await request(app)
        .post('/api/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not create order with non-existent voucher', async () => {
      const orderData = {
        amount: 1000,
        voucherId: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });

    it('should not create order without authentication', async () => {
      const orderData = {
        amount: 1000
      };

      const response = await request(app)
        .post('/api/payments/orders')
        .send(orderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify payment successfully', async () => {
      const verificationData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature'
      };

      // Mock crypto for signature verification
      const crypto = require('crypto');
      const originalCreateHmac = crypto.createHmac;
      crypto.createHmac = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature')
      });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentId).toBe('pay_test123');
      expect(response.body.data.status).toBe('captured');

      // Restore original function
      crypto.createHmac = originalCreateHmac;
    });

    it('should not verify payment with invalid signature', async () => {
      const verificationData = {
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature'
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid payment signature');
    });

    it('should not verify payment with missing data', async () => {
      const verificationData = {
        razorpay_order_id: 'order_test123'
        // Missing payment_id and signature
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required payment verification data');
    });
  });

  describe('POST /api/payments/links', () => {
    it('should create payment link successfully', async () => {
      const linkData = {
        amount: 1500,
        description: 'Payment for services',
        customer: {
          name: 'Test Customer',
          phone: '+919876543210',
          email: 'customer@example.com'
        },
        voucherId: testData.voucher._id
      };

      const response = await request(app)
        .post('/api/payments/links')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(linkData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('plink_test123');
      expect(response.body.data.short_url).toBe('https://rzp.io/i/test123');
      expect(response.body.data.amount).toBe(150000); // Amount in paise
    });

    it('should create payment link with voucher data', async () => {
      const linkData = {
        amount: 885, // Same as voucher total
        voucherId: testData.voucher._id
      };

      const response = await request(app)
        .post('/api/payments/links')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(linkData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('plink_test123');
    });

    it('should not create payment link with invalid customer email', async () => {
      const linkData = {
        amount: 1000,
        customer: {
          name: 'Test Customer',
          email: 'invalid-email'
        }
      };

      const response = await request(app)
        .post('/api/payments/links')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(linkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/payments/upi-qr', () => {
    beforeEach(() => {
      // Set company UPI ID for testing
      testData.company.banking = {
        upiId: 'testcompany@upi'
      };
    });

    it('should generate UPI QR code successfully', async () => {
      const qrData = {
        amount: 1000,
        transactionNote: 'Payment for invoice',
        voucherId: testData.voucher._id
      };

      const response = await request(app)
        .post('/api/payments/upi-qr')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(qrData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.qrCodeDataURL).toBeDefined();
      expect(response.body.data.upiUrl).toContain('upi://pay');
      expect(response.body.data.payeeVPA).toBe('testcompany@upi');
      expect(response.body.data.amount).toBe(1000);
    });

    it('should not generate QR without company UPI ID', async () => {
      // Remove UPI ID
      testData.company.banking = {};

      const qrData = {
        amount: 1000
      };

      const response = await request(app)
        .post('/api/payments/upi-qr')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(qrData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Company UPI ID not configured');
    });

    it('should not generate QR with invalid amount', async () => {
      const qrData = {
        amount: -500
      };

      const response = await request(app)
        .post('/api/payments/upi-qr')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(qrData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/payments/:paymentId/refund', () => {
    it('should process refund successfully', async () => {
      const refundData = {
        amount: 500,
        reason: 'Customer request',
        speed: 'normal'
      };

      const response = await request(app)
        .post('/api/payments/pay_test123/refund')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('rfnd_test123');
      expect(response.body.data.payment_id).toBe('pay_test123');
      expect(response.body.data.amount).toBe(50000); // Amount in paise
    });

    it('should not process refund with invalid amount', async () => {
      const refundData = {
        amount: -100,
        reason: 'Invalid refund'
      };

      const response = await request(app)
        .post('/api/payments/pay_test123/refund')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should handle payment captured webhook', async () => {
      const webhookData = {
        entity: 'event',
        account_id: 'acc_test123',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              amount: 100000,
              currency: 'INR',
              status: 'captured',
              order_id: 'order_test123',
              method: 'upi'
            }
          }
        },
        created_at: Math.floor(Date.now() / 1000)
      };

      // Mock crypto for webhook signature validation
      const crypto = require('crypto');
      const originalCreateHmac = crypto.createHmac;
      crypto.createHmac = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_webhook_signature')
      });

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('X-Razorpay-Signature', 'valid_webhook_signature')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Restore original function
      crypto.createHmac = originalCreateHmac;
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookData = {
        entity: 'event',
        event: 'payment.captured'
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('X-Razorpay-Signature', 'invalid_signature')
        .send(webhookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid webhook signature');
    });

    it('should reject webhook without signature', async () => {
      const webhookData = {
        entity: 'event',
        event: 'payment.captured'
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing webhook signature');
    });
  });
});
