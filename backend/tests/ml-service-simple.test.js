const axios = require('axios');
const MLServiceHelper = require('./helpers/mlServiceHelper');
const MockMLService = require('./helpers/mockMLService');

describe('ML Service Simple Tests', () => {
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

  describe('Prediction Endpoints', () => {
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
  });

  describe('Analytics Endpoints', () => {
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

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [];
      const numRequests = 3;

      for (let i = 0; i < numRequests; i++) {
        const predictionData = {
          customer_id: '507f1f77bcf86cd799439011',
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

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await axios.get(mlHelper.getEndpointURL('/health'));
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      try {
        // Test with very short timeout
        await axios.get(mlHelper.getEndpointURL('/health'), { timeout: 1 });
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          expect(error.message).toContain('timeout');
        } else {
          // If it doesn't timeout, that's also acceptable
          expect(error.response?.status).toBeGreaterThanOrEqual(200);
        }
      }
    });
  });
});
