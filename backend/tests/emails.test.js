const request = require('supertest');
const app = require('../src/server');
const TestDataHelper = require('./helpers/testData');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    verify: jest.fn().mockImplementation((callback) => callback(null, true)),
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id-123',
      accepted: ['test@example.com'],
      rejected: []
    })
  })
}));

describe('Email Endpoints', () => {
  let testHelper;
  let testData;
  let token;

  beforeEach(async () => {
    testHelper = new TestDataHelper();
    testData = await testHelper.createCompleteTestData();
    token = testData.token;
    
    // Set environment variables for testing
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'test-password';
    process.env.SMTP_FROM_NAME = 'FinSync360 Test';
    process.env.SMTP_FROM_EMAIL = 'noreply@finsync360.com';
  });

  afterEach(async () => {
    await testHelper.cleanup();
    jest.clearAllMocks();
  });

  describe('POST /api/emails/send', () => {
    it('should send email with template successfully', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        template: 'welcome',
        data: {
          user: {
            name: 'Test User',
            email: 'test@example.com'
          }
        },
        priority: 'normal'
      };

      const response = await request(app)
        .post('/api/emails/send')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(emailData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBe('test-message-id-123');
    });

    it('should send email without template', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test HTML Content</h1>',
        text: 'Test plain text content'
      };

      const response = await request(app)
        .post('/api/emails/send')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(emailData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBe('test-message-id-123');
    });

    it('should not send email with invalid email address', async () => {
      const emailData = {
        to: 'invalid-email',
        subject: 'Test Email',
        template: 'welcome'
      };

      const response = await request(app)
        .post('/api/emails/send')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(emailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not send email with invalid template', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        template: 'non-existent-template'
      };

      const response = await request(app)
        .post('/api/emails/send')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(emailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not send email without authentication', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        template: 'welcome'
      };

      const response = await request(app)
        .post('/api/emails/send')
        .send(emailData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/emails/invoice-notification', () => {
    it('should send invoice notification successfully', async () => {
      const notificationData = {
        voucherId: testData.voucher._id,
        includePDF: true,
        customMessage: 'Please find your invoice attached.'
      };

      const response = await request(app)
        .post('/api/emails/invoice-notification')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Invoice notification sent successfully');
      expect(response.body.data.messageId).toBe('test-message-id-123');
    });

    it('should send invoice notification without PDF', async () => {
      const notificationData = {
        voucherId: testData.voucher._id,
        includePDF: false
      };

      const response = await request(app)
        .post('/api/emails/invoice-notification')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Invoice notification sent successfully');
    });

    it('should not send notification for non-existent voucher', async () => {
      const notificationData = {
        voucherId: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/emails/invoice-notification')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(notificationData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });

    it('should not send notification for voucher without party email', async () => {
      // Create voucher without party email
      const partyWithoutEmail = await testHelper.createTestParty({
        name: 'Party Without Email',
        contact: {
          phone: '+919876543299'
          // No email
        }
      }, testData.company._id, testData.user._id);

      const voucherWithoutEmail = await testHelper.createTestVoucher({
        voucherNumber: 'NO-EMAIL-001'
      }, testData.company._id, testData.user._id, partyWithoutEmail._id);

      const notificationData = {
        voucherId: voucherWithoutEmail._id
      };

      const response = await request(app)
        .post('/api/emails/invoice-notification')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party email not found');
    });
  });

  describe('POST /api/emails/payment-reminder', () => {
    it('should send payment reminder successfully', async () => {
      const reminderData = {
        voucherId: testData.voucher._id,
        customMessage: 'Please make payment at your earliest convenience.'
      };

      const response = await request(app)
        .post('/api/emails/payment-reminder')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(reminderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment reminder sent successfully');
      expect(response.body.data.messageId).toBe('test-message-id-123');
    });

    it('should not send reminder for voucher without due date', async () => {
      // Create voucher without due date
      const voucherWithoutDueDate = await testHelper.createTestVoucher({
        voucherNumber: 'NO-DUE-001',
        dueDate: undefined
      }, testData.company._id, testData.user._id, testData.party._id);

      const reminderData = {
        voucherId: voucherWithoutDueDate._id
      };

      const response = await request(app)
        .post('/api/emails/payment-reminder')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(reminderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher has no due date');
    });

    it('should not send reminder for non-existent voucher', async () => {
      const reminderData = {
        voucherId: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/emails/payment-reminder')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(reminderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });
  });

  describe('POST /api/emails/bulk-payment-reminders', () => {
    let additionalVouchers;

    beforeEach(async () => {
      // Create additional vouchers for bulk testing
      additionalVouchers = await testHelper.createMultipleVouchers(3, testData.company._id, testData.user._id, testData.party._id);
    });

    it('should send bulk payment reminders successfully', async () => {
      const voucherIds = [
        testData.voucher._id,
        ...additionalVouchers.map(v => v._id)
      ];

      const bulkData = {
        voucherIds,
        customMessage: 'Bulk payment reminder message'
      };

      const response = await request(app)
        .post('/api/emails/bulk-payment-reminders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Bulk payment reminders queued successfully');
      expect(response.body.data.totalVouchers).toBe(4);
      expect(response.body.data.emailsQueued).toBeGreaterThan(0);
    });

    it('should not send bulk reminders with empty voucher array', async () => {
      const bulkData = {
        voucherIds: []
      };

      const response = await request(app)
        .post('/api/emails/bulk-payment-reminders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not send bulk reminders with invalid voucher IDs', async () => {
      const bulkData = {
        voucherIds: ['invalid-id-1', 'invalid-id-2']
      };

      const response = await request(app)
        .post('/api/emails/bulk-payment-reminders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /api/emails/preview/:template', () => {
    it('should preview invoice notification template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/invoice-notification')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Invoice Notification');
      expect(response.text).toContain('Sample Company');
    });

    it('should preview payment reminder template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/payment-reminder')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Payment Reminder');
      expect(response.text).toContain('Sample Customer');
    });

    it('should preview payment confirmation template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/payment-confirmation')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Payment Confirmation');
      expect(response.text).toContain('✓');
    });

    it('should preview account verification template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/account-verification')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Account Verification');
      expect(response.text).toContain('Verify Account');
    });

    it('should preview password reset template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/password-reset')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Password Reset');
      expect(response.text).toContain('Reset Password');
    });

    it('should preview welcome template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/welcome')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Welcome to FinSync360');
      expect(response.text).toContain('Go to Dashboard');
    });

    it('should not preview non-existent template', async () => {
      const response = await request(app)
        .get('/api/emails/preview/non-existent-template')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should preview template with custom data', async () => {
      const customData = JSON.stringify({
        company: {
          name: 'Custom Company Name'
        },
        user: {
          name: 'Custom User Name'
        }
      });

      const response = await request(app)
        .get(`/api/emails/preview/welcome?data=${encodeURIComponent(customData)}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.text).toContain('Custom Company Name');
      expect(response.text).toContain('Custom User Name');
    });
  });

  describe('GET /api/emails/queue-status', () => {
    it('should get email queue status', async () => {
      const response = await request(app)
        .get('/api/emails/queue-status')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.queueLength).toBeDefined();
      expect(response.body.data.isProcessing).toBeDefined();
      expect(response.body.data.totalDelivered).toBeDefined();
      expect(response.body.data.totalFailed).toBeDefined();
    });

    it('should not get queue status without authentication', async () => {
      const response = await request(app)
        .get('/api/emails/queue-status')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/emails/delivery-status/:messageId', () => {
    it('should get email delivery status', async () => {
      const messageId = 'test-message-id-123';

      const response = await request(app)
        .get(`/api/emails/delivery-status/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
    });

    it('should get unknown status for non-existent message', async () => {
      const messageId = 'non-existent-message-id';

      const response = await request(app)
        .get(`/api/emails/delivery-status/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('unknown');
    });
  });
});
