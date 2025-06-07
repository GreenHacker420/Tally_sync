const request = require('supertest');
const app = require('../src/server');
const Voucher = require('../src/models/Voucher');
const TestDataHelper = require('./helpers/testData');

describe('Voucher Endpoints', () => {
  let testHelper;
  let testData;
  let token;

  beforeEach(async () => {
    testHelper = new TestDataHelper();
    testData = await testHelper.createCompleteTestData();
    token = testData.token;
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('GET /api/vouchers', () => {
    beforeEach(async () => {
      await testHelper.createMultipleVouchers(5, testData.company._id, testData.user._id, testData.party._id);
    });

    it('should get all vouchers for company', async () => {
      const response = await request(app)
        .get('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(6); // 5 + 1 from test data
      expect(response.body.data.totalDocs).toBe(6);
    });

    it('should filter vouchers by type', async () => {
      // Create purchase voucher
      await testHelper.createTestVoucher({
        voucherType: 'purchase',
        voucherNumber: 'PUR2024-0001'
      }, testData.company._id, testData.user._id, testData.party._id);

      const response = await request(app)
        .get('/api/vouchers?voucherType=purchase')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.docs[0].voucherType).toBe('purchase');
    });

    it('should filter vouchers by date range', async () => {
      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/vouchers?fromDate=${fromDate}&toDate=${toDate}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
    });

    it('should search vouchers by voucher number', async () => {
      const response = await request(app)
        .get('/api/vouchers?search=SAL2024-0001')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
      expect(response.body.data.docs[0].voucherNumber).toContain('SAL2024-0001');
    });

    it('should paginate vouchers', async () => {
      const response = await request(app)
        .get('/api/vouchers?page=1&limit=3')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(3);
    });

    it('should not get vouchers without company access', async () => {
      const response = await request(app)
        .get('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Company ID is required');
    });
  });

  describe('GET /api/vouchers/:id', () => {
    it('should get single voucher by ID', async () => {
      const response = await request(app)
        .get(`/api/vouchers/${testData.voucher._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testData.voucher._id.toString());
      expect(response.body.data.voucherType).toBe('sales');
      expect(response.body.data.party).toBeDefined();
      expect(response.body.data.items).toBeDefined();
    });

    it('should not get voucher from different company', async () => {
      // Create another company and voucher
      const otherCompany = await testHelper.createTestCompany({
        name: 'Other Company',
        gstin: '29ABCDE5678F1Z5'
      }, testData.user._id);

      const otherVoucher = await testHelper.createTestVoucher({
        voucherNumber: 'OTHER-0001'
      }, otherCompany._id, testData.user._id, testData.party._id);

      const response = await request(app)
        .get(`/api/vouchers/${otherVoucher._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });

    it('should not get voucher with invalid ID', async () => {
      const response = await request(app)
        .get('/api/vouchers/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/vouchers', () => {
    it('should create sales voucher successfully', async () => {
      const voucherData = {
        voucherType: 'sales',
        date: new Date().toISOString(),
        party: testData.party._id,
        items: [{
          item: testData.item._id,
          quantity: 10,
          rate: 150,
          taxable: true,
          cgst: 9,
          sgst: 9,
          igst: 0,
          cess: 0
        }],
        narration: 'Test sales voucher'
      };

      const response = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(voucherData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.voucherType).toBe('sales');
      expect(response.body.data.voucherNumber).toMatch(/^SAL\d{4}-\d{4}$/);
      expect(response.body.data.totals).toBeDefined();
      expect(response.body.data.totals.grandTotal).toBeGreaterThan(0);

      // Verify voucher was created in database
      const voucher = await Voucher.findById(response.body.data._id);
      expect(voucher).toBeTruthy();
      expect(voucher.company.toString()).toBe(testData.company._id.toString());
    });

    it('should create purchase voucher successfully', async () => {
      const voucherData = {
        voucherType: 'purchase',
        date: new Date().toISOString(),
        party: testData.party._id,
        items: [{
          item: testData.item._id,
          quantity: 5,
          rate: 100,
          taxable: true,
          cgst: 9,
          sgst: 9,
          igst: 0,
          cess: 0
        }],
        narration: 'Test purchase voucher'
      };

      const response = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(voucherData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.voucherType).toBe('purchase');
      expect(response.body.data.voucherNumber).toMatch(/^PUR\d{4}-\d{4}$/);
    });

    it('should create payment voucher successfully', async () => {
      const voucherData = {
        voucherType: 'payment',
        date: new Date().toISOString(),
        party: testData.party._id,
        totals: {
          grandTotal: 1000
        },
        payment: {
          method: 'bank',
          transactionId: 'TXN123456'
        },
        narration: 'Payment to supplier'
      };

      const response = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(voucherData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.voucherType).toBe('payment');
      expect(response.body.data.voucherNumber).toMatch(/^PAY\d{4}-\d{4}$/);
    });

    it('should not create voucher with invalid data', async () => {
      const voucherData = {
        voucherType: 'invalid-type',
        date: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(voucherData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not create voucher without authentication', async () => {
      const voucherData = {
        voucherType: 'sales',
        date: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/vouchers')
        .send(voucherData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/vouchers/:id', () => {
    it('should update voucher successfully', async () => {
      const updateData = {
        narration: 'Updated narration',
        items: [{
          item: testData.item._id,
          quantity: 8,
          rate: 160,
          taxable: true,
          cgst: 9,
          sgst: 9,
          igst: 0,
          cess: 0
        }]
      };

      const response = await request(app)
        .put(`/api/vouchers/${testData.voucher._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.narration).toBe('Updated narration');
      expect(response.body.data.items[0].quantity).toBe(8);
      expect(response.body.data.items[0].rate).toBe(160);
    });

    it('should not update non-existent voucher', async () => {
      const updateData = {
        narration: 'Updated narration'
      };

      const response = await request(app)
        .put('/api/vouchers/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });

    it('should not update voucher from different company', async () => {
      const otherCompany = await testHelper.createTestCompany({
        name: 'Other Company',
        gstin: '29ABCDE5678F1Z5'
      }, testData.user._id);

      const otherVoucher = await testHelper.createTestVoucher({
        voucherNumber: 'OTHER-0001'
      }, otherCompany._id, testData.user._id, testData.party._id);

      const updateData = {
        narration: 'Updated narration'
      };

      const response = await request(app)
        .put(`/api/vouchers/${otherVoucher._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });
  });

  describe('DELETE /api/vouchers/:id', () => {
    it('should delete voucher successfully', async () => {
      const response = await request(app)
        .delete(`/api/vouchers/${testData.voucher._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Voucher deleted successfully');

      // Verify voucher was deleted
      const voucher = await Voucher.findById(testData.voucher._id);
      expect(voucher).toBeNull();
    });

    it('should not delete non-existent voucher', async () => {
      const response = await request(app)
        .delete('/api/vouchers/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });
  });

  describe('GET /api/vouchers/:id/pdf', () => {
    it('should generate PDF for voucher', async () => {
      const response = await request(app)
        .get(`/api/vouchers/${testData.voucher._id}/pdf`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('.pdf');
      expect(response.body).toBeDefined();
    });

    it('should not generate PDF for non-existent voucher', async () => {
      const response = await request(app)
        .get('/api/vouchers/507f1f77bcf86cd799439011/pdf')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Voucher not found');
    });
  });
});
