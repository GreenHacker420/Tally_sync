const request = require('supertest');
const axios = require('axios');
const app = require('../src/server');
const TestDataHelper = require('./helpers/testData');
const MLServiceHelper = require('./helpers/mlServiceHelper');
const MockMLService = require('./helpers/mockMLService');

describe('ML Service Integration Tests', () => {
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
      console.log('ML Service not running, starting mock service for testing');
      mockMLService.start();
    } else {
      console.log('ML Service is running, testing against real service');
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

  describe('Health Check Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await axios.get(mlHelper.getEndpointURL('/health'));
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('service', 'FinSync360 ML Service');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should return detailed health status', async () => {
      const response = await axios.get(mlHelper.getEndpointURL('/health/detailed'));
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('database');
      expect(response.data).toHaveProperty('models');
      expect(response.data.models).toHaveProperty('payment_delay_predictor');
      expect(response.data.models).toHaveProperty('risk_assessment');
    });
  });

  describe('Payment Delay Prediction', () => {
    it('should predict payment delay for single customer', async () => {
      const paymentData = mlHelper.createTestPaymentData();
      
      const response = await axios.post(
        mlHelper.getEndpointURL('/payment-delay'),
        paymentData
      );
      
      expect(response.status).toBe(200);
      expect(mlHelper.validatePaymentPredictionResponse(response.data)).toBe(true);
      expect(response.data.customer_id).toBe(paymentData.customer_id);
      expect(response.data.delay_probability).toBeGreaterThanOrEqual(0);
      expect(response.data.delay_probability).toBeLessThanOrEqual(1);
      expect(response.data.confidence_score).toBeGreaterThanOrEqual(0);
      expect(response.data.confidence_score).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high']).toContain(response.data.risk_level);
    });

    it('should handle bulk payment delay predictions', async () => {
      const bulkData = {
        customer_ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        days_ahead: 30
      };
      
      const response = await axios.post(
        mlHelper.getEndpointURL('/payment-delay/bulk'),
        bulkData
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('predictions');
      expect(response.data).toHaveProperty('summary');
      expect(Array.isArray(response.data.predictions)).toBe(true);
      expect(response.data.summary).toHaveProperty('total_predictions');
    });

    it('should validate required fields for payment prediction', async () => {
      const invalidData = {
        amount: 50000
        // Missing customer_id
      };
      
      try {
        await axios.post(mlHelper.getEndpointURL('/payment-delay'), invalidData);
        fail('Should have thrown an error for missing customer_id');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Inventory Forecasting', () => {
    it('should forecast inventory demand', async () => {
      const forecastData = mlHelper.createTestInventoryForecastData();
      
      const response = await axios.post(
        mlHelper.getEndpointURL('/inventory-forecast'),
        forecastData
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const forecast = response.data[0];
        expect(mlHelper.validateInventoryForecastResponse(forecast)).toBe(true);
        expect(forecast.item_id).toBe(forecastData.item_id);
        expect(Array.isArray(forecast.predicted_demand)).toBe(true);
        expect(forecast).toHaveProperty('reorder_recommendation');
      }
    });

    it('should handle multiple item forecasting', async () => {
      const forecastData = {
        item_ids: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        days_ahead: 60,
        include_seasonality: true
      };
      
      const response = await axios.post(
        mlHelper.getEndpointURL('/inventory-forecast'),
        forecastData
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Risk Assessment', () => {
    it('should assess customer risk', async () => {
      const riskData = mlHelper.createTestRiskAssessmentData();
      
      const response = await axios.post(
        mlHelper.getEndpointURL('/risk-assessment'),
        riskData
      );
      
      expect(response.status).toBe(200);
      expect(mlHelper.validateRiskAssessmentResponse(response.data)).toBe(true);
      expect(response.data.customer_id).toBe(riskData.customer_id);
      expect(response.data.risk_score).toBeGreaterThanOrEqual(0);
      expect(response.data.risk_score).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high']).toContain(response.data.risk_level);
      expect(Array.isArray(response.data.recommendations)).toBe(true);
    });

    it('should handle different assessment types', async () => {
      const assessmentTypes = ['credit', 'payment', 'overall'];
      
      for (const type of assessmentTypes) {
        const riskData = {
          customer_id: '507f1f77bcf86cd799439011',
          assessment_type: type
        };
        
        const response = await axios.post(
          mlHelper.getEndpointURL('/risk-assessment'),
          riskData
        );
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('risk_score');
        expect(response.data).toHaveProperty('risk_level');
      }
    });
  });

  describe('Business Analytics', () => {
    it('should return comprehensive business metrics', async () => {
      const response = await axios.get(
        mlHelper.getEndpointURL('/business-metrics'),
        { params: { days_back: 30 } }
      );

      expect(response.status).toBe(200);
      expect(mlHelper.validateBusinessMetricsResponse(response.data)).toBe(true);
      expect(response.data.revenue_forecast).toHaveProperty('current_month');
      expect(response.data.payment_insights).toHaveProperty('on_time_rate');
      expect(response.data.customer_analytics).toHaveProperty('total_customers');
      expect(response.data.inventory_insights).toHaveProperty('total_items');
    });

    it('should return customer insights for specific customer', async () => {
      const customerId = '507f1f77bcf86cd799439011';
      const response = await axios.get(
        mlHelper.getEndpointURL(`/customer-insights/${customerId}`)
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('customer_id', customerId);
      expect(response.data).toHaveProperty('customer_name');
      expect(response.data).toHaveProperty('risk_profile');
      expect(response.data).toHaveProperty('payment_behavior');
      expect(response.data).toHaveProperty('revenue_contribution');
      expect(Array.isArray(response.data.recommendations)).toBe(true);
    });

    it('should return inventory analytics', async () => {
      const response = await axios.get(
        mlHelper.getEndpointURL('/inventory-analytics')
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('total_items');
      expect(Array.isArray(response.data.low_stock_items)).toBe(true);
      expect(Array.isArray(response.data.overstock_items)).toBe(true);
      expect(Array.isArray(response.data.demand_trends)).toBe(true);
      expect(Array.isArray(response.data.reorder_recommendations)).toBe(true);
    });

    it('should return payment trends analysis', async () => {
      const response = await axios.get(
        mlHelper.getEndpointURL('/payment-trends')
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('trends');
      expect(Array.isArray(response.data.trends)).toBe(true);
      expect(response.data).toHaveProperty('seasonal_patterns');
    });

    it('should return risk dashboard data', async () => {
      const response = await axios.get(
        mlHelper.getEndpointURL('/risk-dashboard')
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.high_risk_customers)).toBe(true);
      expect(Array.isArray(response.data.overdue_payments)).toBe(true);
      expect(Array.isArray(response.data.credit_alerts)).toBe(true);
      expect(response.data).toHaveProperty('summary');
    });
  });

  describe('Model Management', () => {
    it('should return model status information', async () => {
      const response = await axios.get(
        mlHelper.getEndpointURL('/models/status')
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('models');
      expect(response.data.models).toHaveProperty('payment_delay_predictor');
      expect(response.data.models).toHaveProperty('risk_assessment');
      expect(response.data.models).toHaveProperty('inventory_forecast');
    });

    it('should trigger model retraining', async () => {
      const response = await axios.post(
        mlHelper.getEndpointURL('/models/retrain')
      );

      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('job_id');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid customer ID in payment prediction', async () => {
      const invalidData = {
        customer_id: 'invalid_id',
        amount: 50000
      };

      try {
        await axios.post(mlHelper.getEndpointURL('/payment-delay'), invalidData);
        fail('Should have thrown an error for invalid customer ID');
      } catch (error) {
        expect([400, 404, 422]).toContain(error.response.status);
      }
    });

    it('should handle invalid item ID in inventory forecast', async () => {
      const invalidData = {
        item_id: 'invalid_id',
        days_ahead: 30
      };

      try {
        await axios.post(mlHelper.getEndpointURL('/inventory-forecast'), invalidData);
        fail('Should have thrown an error for invalid item ID');
      } catch (error) {
        expect([400, 404, 422]).toContain(error.response.status);
      }
    });

    it('should handle non-existent customer in risk assessment', async () => {
      const invalidData = {
        customer_id: '507f1f77bcf86cd799439999',
        assessment_type: 'overall'
      };

      try {
        await axios.post(mlHelper.getEndpointURL('/risk-assessment'), invalidData);
        fail('Should have thrown an error for non-existent customer');
      } catch (error) {
        expect([400, 404]).toContain(error.response.status);
      }
    });
  });

  describe('Data Integration Compatibility', () => {
    it('should work with existing ERP customer data structure', async () => {
      // Test that ML service can handle our MongoDB Party schema
      const customerData = {
        customer_id: testData.party._id.toString(),
        amount: 25000,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      };

      const response = await axios.post(
        mlHelper.getEndpointURL('/payment-delay'),
        customerData
      );

      expect(response.status).toBe(200);
      expect(response.data.customer_id).toBe(customerData.customer_id);
    });

    it('should work with existing ERP item data structure', async () => {
      // Test that ML service can handle our MongoDB Item schema
      const itemData = {
        item_id: testData.item._id.toString(),
        days_ahead: 60
      };

      const response = await axios.post(
        mlHelper.getEndpointURL('/inventory-forecast'),
        itemData
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
