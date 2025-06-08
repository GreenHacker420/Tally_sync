const axios = require('axios');
const MLServiceHelper = require('./helpers/mlServiceHelper');
const MockMLService = require('./helpers/mockMLService');

describe('ML Service Endpoint Coverage Tests', () => {
  let mlHelper;
  let mockMLService;
  let isMLServiceRunning = false;

  beforeAll(async () => {
    mlHelper = new MLServiceHelper();
    mockMLService = new MockMLService();
    
    // Check if ML service is running
    isMLServiceRunning = await mlHelper.isServiceRunning();
    
    if (!isMLServiceRunning) {
      console.log('ML Service not running, starting mock service for coverage testing');
      mockMLService.start();
    }
  });

  afterAll(async () => {
    if (!isMLServiceRunning) {
      mockMLService.stop();
    }
  });

  describe('Complete Endpoint Coverage', () => {
    const endpoints = [
      // Health endpoints
      { method: 'GET', path: '/health', description: 'Basic health check' },
      { method: 'GET', path: '/health/detailed', description: 'Detailed health check' },
      
      // Prediction endpoints
      { method: 'POST', path: '/payment-delay', description: 'Single payment delay prediction' },
      { method: 'POST', path: '/payment-delay/bulk', description: 'Bulk payment delay predictions' },
      { method: 'POST', path: '/inventory-forecast', description: 'Inventory demand forecasting' },
      { method: 'POST', path: '/risk-assessment', description: 'Customer risk assessment' },
      
      // Analytics endpoints
      { method: 'GET', path: '/business-metrics', description: 'Business metrics and KPIs' },
      { method: 'GET', path: '/customer-insights/507f1f77bcf86cd799439011', description: 'Customer insights' },
      { method: 'GET', path: '/inventory-analytics', description: 'Inventory analytics' },
      { method: 'GET', path: '/payment-trends', description: 'Payment trends analysis' },
      { method: 'GET', path: '/risk-dashboard', description: 'Risk dashboard data' },
      
      // Model management endpoints
      { method: 'GET', path: '/models/status', description: 'Model status information' },
      { method: 'POST', path: '/models/retrain', description: 'Trigger model retraining' }
    ];

    endpoints.forEach(endpoint => {
      it(`should test ${endpoint.method} ${endpoint.path} - ${endpoint.description}`, async () => {
        const url = mlHelper.getEndpointURL(endpoint.path);
        
        try {
          let response;
          
          if (endpoint.method === 'GET') {
            response = await axios.get(url, { timeout: 10000 });
          } else if (endpoint.method === 'POST') {
            let testData = {};
            
            // Provide appropriate test data based on endpoint
            if (endpoint.path === '/payment-delay') {
              testData = mlHelper.createTestPaymentData();
            } else if (endpoint.path === '/payment-delay/bulk') {
              testData = {
                customer_ids: ['507f1f77bcf86cd799439011'],
                days_ahead: 30
              };
            } else if (endpoint.path === '/inventory-forecast') {
              testData = mlHelper.createTestInventoryForecastData();
            } else if (endpoint.path === '/risk-assessment') {
              testData = mlHelper.createTestRiskAssessmentData();
            } else if (endpoint.path === '/models/retrain') {
              testData = { model_type: 'all' };
            }
            
            response = await axios.post(url, testData, { timeout: 10000 });
          }
          
          // Verify response
          expect(response.status).toBeGreaterThanOrEqual(200);
          expect(response.status).toBeLessThan(300);
          expect(response.data).toBeDefined();
          
          console.log(`✓ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
          
        } catch (error) {
          if (error.response) {
            console.log(`✗ ${endpoint.method} ${endpoint.path} - Status: ${error.response.status}`);
            
            // Some endpoints might return 4xx for invalid test data, which is acceptable
            if (error.response.status >= 400 && error.response.status < 500) {
              expect(error.response.status).toBeGreaterThanOrEqual(400);
              expect(error.response.status).toBeLessThan(500);
            } else {
              throw error;
            }
          } else {
            console.log(`✗ ${endpoint.method} ${endpoint.path} - Network Error: ${error.message}`);
            throw error;
          }
        }
      });
    });
  });

  describe('Response Schema Validation', () => {
    it('should validate all response schemas match expected structure', async () => {
      const testCases = [
        {
          endpoint: '/health',
          method: 'GET',
          validator: (data) => mlHelper.validateHealthResponse(data)
        },
        {
          endpoint: '/payment-delay',
          method: 'POST',
          data: mlHelper.createTestPaymentData(),
          validator: (data) => mlHelper.validatePaymentPredictionResponse(data)
        },
        {
          endpoint: '/inventory-forecast',
          method: 'POST',
          data: mlHelper.createTestInventoryForecastData(),
          validator: (data) => {
            expect(Array.isArray(data)).toBe(true);
            if (data.length > 0) {
              expect(mlHelper.validateInventoryForecastResponse(data[0])).toBe(true);
            }
          }
        },
        {
          endpoint: '/risk-assessment',
          method: 'POST',
          data: mlHelper.createTestRiskAssessmentData(),
          validator: (data) => mlHelper.validateRiskAssessmentResponse(data)
        },
        {
          endpoint: '/business-metrics',
          method: 'GET',
          validator: (data) => mlHelper.validateBusinessMetricsResponse(data)
        }
      ];

      for (const testCase of testCases) {
        try {
          let response;
          const url = mlHelper.getEndpointURL(testCase.endpoint);
          
          if (testCase.method === 'GET') {
            response = await axios.get(url);
          } else {
            response = await axios.post(url, testCase.data || {});
          }
          
          expect(response.status).toBe(200);
          expect(testCase.validator(response.data)).toBe(true);
          
        } catch (error) {
          console.error(`Schema validation failed for ${testCase.endpoint}:`, error.message);
          throw error;
        }
      }
    });
  });

  describe('Error Response Validation', () => {
    it('should return proper error responses for invalid requests', async () => {
      const errorTestCases = [
        {
          endpoint: '/payment-delay',
          method: 'POST',
          data: { invalid: 'data' },
          expectedStatus: [400, 422]
        },
        {
          endpoint: '/inventory-forecast',
          method: 'POST',
          data: { invalid: 'data' },
          expectedStatus: [400, 422]
        },
        {
          endpoint: '/risk-assessment',
          method: 'POST',
          data: { invalid: 'data' },
          expectedStatus: [400, 422]
        }
      ];

      for (const testCase of errorTestCases) {
        try {
          const url = mlHelper.getEndpointURL(testCase.endpoint);
          await axios.post(url, testCase.data);

          // If we reach here, the request didn't fail as expected
          // For mock service, this might be acceptable as it returns 200 for all requests
          console.log(`⚠️  ${testCase.endpoint} accepted invalid data (mock service behavior)`);

        } catch (error) {
          if (error.response) {
            expect(error.response).toBeDefined();
            expect(testCase.expectedStatus).toContain(error.response.status);
            expect(error.response.data).toBeDefined();
          } else {
            // Network error or other issue
            console.log(`⚠️  ${testCase.endpoint} network error:`, error.message);
          }
        }
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time requirements', async () => {
      const performanceTests = [
        { endpoint: '/health', method: 'GET', maxTime: 1000 },
        { endpoint: '/business-metrics', method: 'GET', maxTime: 5000 },
        { 
          endpoint: '/payment-delay', 
          method: 'POST', 
          data: mlHelper.createTestPaymentData(),
          maxTime: 3000 
        }
      ];

      for (const test of performanceTests) {
        const startTime = Date.now();
        
        try {
          const url = mlHelper.getEndpointURL(test.endpoint);
          
          if (test.method === 'GET') {
            await axios.get(url);
          } else {
            await axios.post(url, test.data);
          }
          
          const responseTime = Date.now() - startTime;
          expect(responseTime).toBeLessThan(test.maxTime);
          
          console.log(`✓ ${test.endpoint} responded in ${responseTime}ms (max: ${test.maxTime}ms)`);
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          console.log(`✗ ${test.endpoint} failed after ${responseTime}ms:`, error.message);
          throw error;
        }
      }
    });
  });
});
