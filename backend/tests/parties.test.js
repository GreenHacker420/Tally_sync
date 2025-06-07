const request = require('supertest');
const app = require('../src/server');
const Party = require('../src/models/Party');
const TestDataHelper = require('./helpers/testData');

describe('Party Endpoints', () => {
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

  describe('GET /api/parties', () => {
    beforeEach(async () => {
      await testHelper.createMultipleParties(5, testData.company._id, testData.user._id);
    });

    it('should get all parties for company', async () => {
      const response = await request(app)
        .get('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(6); // 5 + 1 from test data
      expect(response.body.data.totalDocs).toBe(6);
    });

    it('should filter parties by type', async () => {
      // Create supplier party
      await testHelper.createTestParty({
        name: 'Test Supplier',
        type: 'supplier'
      }, testData.company._id, testData.user._id);

      const response = await request(app)
        .get('/api/parties?type=supplier')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.docs[0].type).toBe('supplier');
    });

    it('should filter parties by category', async () => {
      // Create individual party
      await testHelper.createTestParty({
        name: 'Individual Customer',
        category: 'individual'
      }, testData.company._id, testData.user._id);

      const response = await request(app)
        .get('/api/parties?category=individual')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.docs[0].category).toBe('individual');
    });

    it('should search parties by name, email, and phone', async () => {
      const response = await request(app)
        .get('/api/parties?search=Test Customer')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
      expect(response.body.data.docs[0].name).toContain('Test Customer');
    });

    it('should filter parties with balance', async () => {
      // Update party balance
      await Party.findByIdAndUpdate(testData.party._id, {
        'balances.current.amount': 1000,
        'balances.current.type': 'debit'
      });

      const response = await request(app)
        .get('/api/parties?hasBalance=true')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
    });

    it('should paginate parties', async () => {
      const response = await request(app)
        .get('/api/parties?page=1&limit=3')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(3);
    });
  });

  describe('GET /api/parties/:id', () => {
    it('should get single party by ID', async () => {
      const response = await request(app)
        .get(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testData.party._id.toString());
      expect(response.body.data.name).toBe('Test Customer');
      expect(response.body.data.type).toBe('customer');
      expect(response.body.data.contact).toBeDefined();
      expect(response.body.data.addresses).toBeDefined();
    });

    it('should not get party from different company', async () => {
      const otherCompany = await testHelper.createTestCompany({
        name: 'Other Company',
        gstin: '29ABCDE5678F1Z5'
      }, testData.user._id);

      const otherParty = await testHelper.createTestParty({
        name: 'Other Party'
      }, otherCompany._id, testData.user._id);

      const response = await request(app)
        .get(`/api/parties/${otherParty._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });
  });

  describe('POST /api/parties', () => {
    it('should create customer party successfully', async () => {
      const partyData = {
        name: 'New Customer Ltd.',
        type: 'customer',
        category: 'business',
        gstin: '29NEWCUS1234F1Z5',
        pan: 'NEWCU1234F',
        contact: {
          phone: '+919876543299',
          email: 'newcustomer@example.com'
        },
        addresses: [{
          type: 'both',
          line1: '789 New Street',
          city: 'New City',
          state: 'New State',
          pincode: '789012',
          country: 'India',
          isDefault: true
        }],
        creditLimit: {
          amount: 50000,
          days: 45
        }
      };

      const response = await request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(partyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Customer Ltd.');
      expect(response.body.data.type).toBe('customer');
      expect(response.body.data.gstin).toBe('29NEWCUS1234F1Z5');
      expect(response.body.data.creditLimit.amount).toBe(50000);

      // Verify party was created in database
      const party = await Party.findById(response.body.data._id);
      expect(party).toBeTruthy();
      expect(party.company.toString()).toBe(testData.company._id.toString());
    });

    it('should create supplier party successfully', async () => {
      const partyData = {
        name: 'New Supplier Pvt. Ltd.',
        type: 'supplier',
        category: 'business',
        gstin: '29NEWSUP5678F1Z5',
        contact: {
          phone: '+919876543288',
          email: 'newsupplier@example.com'
        },
        addresses: [{
          type: 'both',
          line1: '456 Supplier Street',
          city: 'Supplier City',
          state: 'Supplier State',
          pincode: '456789',
          country: 'India',
          isDefault: true
        }]
      };

      const response = await request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(partyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('supplier');
      expect(response.body.data.gstin).toBe('29NEWSUP5678F1Z5');
    });

    it('should create individual party successfully', async () => {
      const partyData = {
        name: 'John Doe',
        type: 'customer',
        category: 'individual',
        contact: {
          phone: '+919876543277',
          email: 'john.doe@example.com'
        },
        addresses: [{
          type: 'both',
          line1: '123 Individual Street',
          city: 'Individual City',
          state: 'Individual State',
          pincode: '123789',
          country: 'India',
          isDefault: true
        }]
      };

      const response = await request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(partyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('individual');
      expect(response.body.data.gstin).toBeUndefined();
    });

    it('should not create party with duplicate GSTIN', async () => {
      const partyData = {
        name: 'Duplicate GSTIN Party',
        type: 'customer',
        gstin: '29ZYXWV9876E1Z5' // Same as existing party
      };

      const response = await request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(partyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party with this GSTIN already exists');
    });

    it('should not create party with duplicate phone', async () => {
      const partyData = {
        name: 'Duplicate Phone Party',
        type: 'customer',
        contact: {
          phone: '+919876543211' // Same as existing party
        }
      };

      const response = await request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(partyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party with this phone number already exists');
    });

    it('should not create party with invalid data', async () => {
      const partyData = {
        name: '', // Empty name
        type: 'invalid-type',
        gstin: 'invalid-gstin'
      };

      const response = await request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(partyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('PUT /api/parties/:id', () => {
    it('should update party successfully', async () => {
      const updateData = {
        name: 'Updated Customer Name',
        contact: {
          phone: '+919876543266',
          email: 'updated@example.com'
        },
        creditLimit: {
          amount: 75000,
          days: 60
        }
      };

      const response = await request(app)
        .put(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Customer Name');
      expect(response.body.data.contact.email).toBe('updated@example.com');
      expect(response.body.data.creditLimit.amount).toBe(75000);
    });

    it('should not update party with duplicate GSTIN', async () => {
      // Create another party
      const anotherParty = await testHelper.createTestParty({
        name: 'Another Party',
        gstin: '29ANOTHER123F1Z5'
      }, testData.company._id, testData.user._id);

      const updateData = {
        gstin: '29ANOTHER123F1Z5' // Try to use existing GSTIN
      };

      const response = await request(app)
        .put(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party with this GSTIN already exists');
    });

    it('should not update non-existent party', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/parties/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });
  });

  describe('DELETE /api/parties/:id', () => {
    it('should delete party successfully (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Party deleted successfully');

      // Verify party was soft deleted
      const party = await Party.findById(testData.party._id);
      expect(party).toBeTruthy();
      expect(party.isActive).toBe(false);
    });

    it('should not delete party with outstanding balance', async () => {
      // Set outstanding balance
      await Party.findByIdAndUpdate(testData.party._id, {
        'balances.current.amount': 1000,
        'balances.current.type': 'debit'
      });

      const response = await request(app)
        .delete(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete party with outstanding balance');
    });

    it('should not delete non-existent party', async () => {
      const response = await request(app)
        .delete('/api/parties/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });
  });

  describe('GET /api/parties/:id/balance', () => {
    it('should get party balance', async () => {
      // Set party balance
      await Party.findByIdAndUpdate(testData.party._id, {
        'balances.current.amount': 5000,
        'balances.current.type': 'debit'
      });

      const response = await request(app)
        .get(`/api/parties/${testData.party._id}/balance`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.party.id).toBe(testData.party._id.toString());
      expect(response.body.data.balances.current.amount).toBe(5000);
      expect(response.body.data.balances.current.type).toBe('debit');
    });

    it('should not get balance for non-existent party', async () => {
      const response = await request(app)
        .get('/api/parties/507f1f77bcf86cd799439011/balance')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Party not found');
    });
  });

  describe('GET /api/parties/outstanding', () => {
    beforeEach(async () => {
      // Create parties with outstanding balances
      const party1 = await testHelper.createTestParty({
        name: 'Outstanding Customer 1',
        type: 'customer'
      }, testData.company._id, testData.user._id);

      const party2 = await testHelper.createTestParty({
        name: 'Outstanding Supplier 1',
        type: 'supplier'
      }, testData.company._id, testData.user._id);

      await Party.findByIdAndUpdate(party1._id, {
        'balances.current.amount': 10000,
        'balances.current.type': 'debit'
      });

      await Party.findByIdAndUpdate(party2._id, {
        'balances.current.amount': 5000,
        'balances.current.type': 'credit'
      });
    });

    it('should get all parties with outstanding balances', async () => {
      const response = await request(app)
        .get('/api/parties/outstanding')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parties.length).toBeGreaterThan(0);
      expect(response.body.data.summary.totalParties).toBeGreaterThan(0);
      expect(response.body.data.summary.totalOutstanding).toBeGreaterThan(0);
    });

    it('should filter outstanding parties by type', async () => {
      const response = await request(app)
        .get('/api/parties/outstanding?type=customer')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parties.length).toBeGreaterThan(0);
      expect(response.body.data.parties.every(party => party.type === 'customer')).toBe(true);
    });
  });
});
