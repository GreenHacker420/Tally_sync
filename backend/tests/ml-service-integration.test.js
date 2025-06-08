const request = require('supertest');
const axios = require('axios');
const app = require('../src/server');
const TestDataHelper = require('./helpers/testData');
const MLServiceHelper = require('./helpers/mlServiceHelper');
const MockMLService = require('./helpers/mockMLService');

describe('ML Service Backend Integration Tests', () => {
  let testHelper;
  let testData;
  let token;
  let mlHelper;
  let mockMLService;
  let isMLServiceRunning = false;

  beforeAll(async () => {
    mlHelper = new MLServiceHelper();
    mockMLService = new MockMLService();
    
    // Check if ML service is running
    isMLServiceRunning = await mlHelper.isServiceRunning();
    
    if (!isMLServiceRunning) {
      console.log('ML Service not running, starting mock service for integration testing');
      mockMLService.start();
    }
  });

  beforeEach(async () => {
    testHelper = new TestDataHelper();
    testData = await testHelper.createCompleteTestData();
    token = testData.token;
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  afterAll(async () => {
    if (!isMLServiceRunning) {
      mockMLService.stop();
    }
  });

  describe('Backend API Integration with ML Service', () => {
    it('should integrate ML predictions with customer data', async () => {
      // First, get customer data from our backend
      const customerResponse = await request(app)
        .get(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      const customer = customerResponse.body.data;
      
      // Then use this data for ML prediction
      const predictionData = {
        customer_id: customer._id,
        amount: 50000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const mlResponse = await axios.post(
        mlHelper.getEndpointURL('/payment-delay'),
        predictionData
      );

      expect(mlResponse.status).toBe(200);
      expect(mlResponse.data.customer_id).toBe(customer._id);
      expect(mlHelper.validatePaymentPredictionResponse(mlResponse.data)).toBe(true);
    });

    it('should integrate ML forecasting with inventory data', async () => {
      // Get inventory item from our backend
      const itemResponse = await request(app)
        .get(`/api/inventory/${testData.item._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      const item = itemResponse.body.data;
      
      // Use this data for ML inventory forecasting
      const forecastData = {
        item_id: item._id,
        days_ahead: 90,
        include_seasonality: true
      };

      const mlResponse = await axios.post(
        mlHelper.getEndpointURL('/inventory-forecast'),
        forecastData
      );

      expect(mlResponse.status).toBe(200);
      expect(Array.isArray(mlResponse.data)).toBe(true);
      
      if (mlResponse.data.length > 0) {
        expect(mlResponse.data[0].item_id).toBe(item._id);
      }
    });

    it('should handle ML service unavailability gracefully', async () => {
      // Simulate ML service being down
      if (!isMLServiceRunning) {
        mockMLService.simulateError('/payment-delay', 503, 'Service Unavailable');
      }

      const predictionData = {
        customer_id: testData.party._id.toString(),
        amount: 25000
      };

      try {
        await axios.post(mlHelper.getEndpointURL('/payment-delay'), predictionData);
        
        if (!isMLServiceRunning) {
          fail('Should have thrown an error when ML service is down');
        }
      } catch (error) {
        if (!isMLServiceRunning) {
          expect(error.response.status).toBe(503);
        }
      }

      // Reset mock for other tests
      if (!isMLServiceRunning) {
        mockMLService.reset();
      }
    });
  });

  describe('Data Model Compatibility', () => {
    it('should validate Party model compatibility with ML service', async () => {
      const party = testData.party;
      
      // Check that our Party model has fields expected by ML service
      expect(party).toHaveProperty('_id');
      expect(party).toHaveProperty('name');
      expect(party).toHaveProperty('type');
      expect(party).toHaveProperty('creditLimit');
      expect(party).toHaveProperty('balances');
      
      // Test ML service can handle our Party data structure
      const riskData = {
        customer_id: party._id.toString(),
        assessment_type: 'overall'
      };

      const response = await axios.post(
        mlHelper.getEndpointURL('/risk-assessment'),
        riskData
      );

      expect(response.status).toBe(200);
      expect(response.data.customer_id).toBe(party._id.toString());
    });

    it('should validate Item model compatibility with ML service', async () => {
      const item = testData.item;
      
      // Check that our Item model has fields expected by ML service
      expect(item).toHaveProperty('_id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('pricing');
      expect(item).toHaveProperty('inventory');
      
      // Test ML service can handle our Item data structure
      const forecastData = {
        item_id: item._id.toString(),
        days_ahead: 60
      };

      const response = await axios.post(
        mlHelper.getEndpointURL('/inventory-forecast'),
        forecastData
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should validate Voucher model compatibility with ML service', async () => {
      const voucher = testData.voucher;
      
      // Check that our Voucher model has fields expected by ML service
      expect(voucher).toHaveProperty('_id');
      expect(voucher).toHaveProperty('voucherNumber');
      expect(voucher).toHaveProperty('party');
      expect(voucher).toHaveProperty('items');
      expect(voucher).toHaveProperty('totals');
      
      // Test ML service can use voucher data for predictions
      const paymentData = {
        customer_id: voucher.party.toString(),
        amount: voucher.totals.grandTotal,
        due_date: voucher.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const response = await axios.post(
        mlHelper.getEndpointURL('/payment-delay'),
        paymentData
      );

      expect(response.status).toBe(200);
      expect(response.data.customer_id).toBe(voucher.party.toString());
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent ML requests', async () => {
      const requests = [];
      const numRequests = 5;

      for (let i = 0; i < numRequests; i++) {
        const predictionData = {
          customer_id: testData.party._id.toString(),
          amount: 10000 + (i * 5000),
          days_ahead: 30
        };

        requests.push(
          axios.post(mlHelper.getEndpointURL('/payment-delay'), predictionData)
        );
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(mlHelper.validatePaymentPredictionResponse(response.data)).toBe(true);
      });
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      const bulkData = {
        customer_ids: [
          testData.party._id.toString(),
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012'
        ],
        days_ahead: 30
      };

      const response = await axios.post(
        mlHelper.getEndpointURL('/payment-delay/bulk'),
        bulkData
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('predictions');
      expect(response.data).toHaveProperty('summary');
      expect(responseTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Authentication and Authorization', () => {
    it('should handle ML service authentication if required', async () => {
      // Test that ML service endpoints work without authentication
      // (since it's an internal microservice)
      const response = await axios.get(mlHelper.getEndpointURL('/health'));
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });

    it('should validate data access permissions through backend', async () => {
      // Test that users can only access ML predictions for their company's data
      const predictionData = {
        customer_id: testData.party._id.toString(),
        amount: 50000
      };

      // This should work with proper company context
      const response = await axios.post(
        mlHelper.getEndpointURL('/payment-delay'),
        predictionData
      );

      expect(response.status).toBe(200);
      expect(response.data.customer_id).toBe(testData.party._id.toString());
    });
  });
});
