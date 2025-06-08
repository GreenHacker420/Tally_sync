const nock = require('nock');
const MLServiceHelper = require('./mlServiceHelper');

/**
 * Mock ML Service for Testing
 * Provides mock responses when the actual ML service is not available
 */
class MockMLService {
  constructor() {
    this.helper = new MLServiceHelper();
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    this.mockResponses = this.helper.getMockResponses();
    this.isActive = false;
  }

  /**
   * Start mocking ML service endpoints
   */
  start() {
    if (this.isActive) return;

    // Mock health endpoints
    nock(this.baseURL)
      .persist()
      .get('/api/v1/health')
      .reply(200, this.mockResponses.health);

    nock(this.baseURL)
      .persist()
      .get('/api/v1/health/detailed')
      .reply(200, {
        ...this.mockResponses.health,
        database: { status: 'healthy', connection: 'active' },
        models: {
          payment_delay_predictor: 'loaded',
          payment_amount_predictor: 'loaded',
          risk_assessment: 'loaded',
          inventory_forecast: 'loaded'
        }
      });

    // Mock prediction endpoints
    nock(this.baseURL)
      .persist()
      .post('/api/v1/payment-delay')
      .reply(200, this.mockResponses.paymentPrediction);

    nock(this.baseURL)
      .persist()
      .post('/api/v1/payment-delay/bulk')
      .reply(200, {
        predictions: [this.mockResponses.paymentPrediction],
        summary: {
          total_predictions: 1,
          high_risk_count: 0,
          medium_risk_count: 1,
          low_risk_count: 0
        }
      });

    nock(this.baseURL)
      .persist()
      .post('/api/v1/inventory-forecast')
      .reply(200, [this.mockResponses.inventoryForecast]);

    nock(this.baseURL)
      .persist()
      .post('/api/v1/risk-assessment')
      .reply(200, this.mockResponses.riskAssessment);

    // Mock analytics endpoints
    nock(this.baseURL)
      .persist()
      .get('/api/v1/business-metrics')
      .query(true)
      .reply(200, this.mockResponses.businessMetrics);

    nock(this.baseURL)
      .persist()
      .get(/\/api\/v1\/customer-insights\/.*/)
      .reply(200, {
        customer_id: '507f1f77bcf86cd799439011',
        customer_name: 'Test Customer Ltd',
        risk_profile: this.mockResponses.riskAssessment,
        payment_behavior: {
          average_delay_days: 3.5,
          on_time_percentage: 85,
          total_transactions: 45
        },
        revenue_contribution: {
          total_revenue: 125000,
          percentage_of_total: 8.5,
          growth_rate: 0.12
        },
        recommendations: [
          'Maintain current credit terms',
          'Consider loyalty program enrollment'
        ]
      });

    nock(this.baseURL)
      .persist()
      .get('/api/v1/inventory-analytics')
      .reply(200, {
        total_items: 500,
        low_stock_items: [
          { item_id: '1', name: 'Product A', current_stock: 5, minimum_stock: 10 }
        ],
        overstock_items: [
          { item_id: '2', name: 'Product B', current_stock: 200, optimal_stock: 50 }
        ],
        demand_trends: [
          { period: '2024-01', demand: 150 },
          { period: '2024-02', demand: 175 }
        ],
        reorder_recommendations: [
          { item_id: '1', recommended_quantity: 50, urgency: 'high' }
        ]
      });

    nock(this.baseURL)
      .persist()
      .get('/api/v1/payment-trends')
      .reply(200, {
        trends: [
          { period: '2024-01', on_time_rate: 82.5, average_delay: 4.2 },
          { period: '2024-02', on_time_rate: 85.1, average_delay: 3.8 }
        ],
        seasonal_patterns: {
          monthly_variations: [0.95, 1.02, 1.08, 0.98],
          peak_months: ['March', 'December'],
          low_months: ['January', 'July']
        }
      });

    nock(this.baseURL)
      .persist()
      .get('/api/v1/risk-dashboard')
      .reply(200, {
        high_risk_customers: [
          { customer_id: '1', name: 'High Risk Corp', risk_score: 0.85 }
        ],
        overdue_payments: [
          { payment_id: '1', amount: 15000, days_overdue: 15 }
        ],
        credit_alerts: [
          { customer_id: '2', alert_type: 'credit_limit_exceeded', severity: 'high' }
        ],
        summary: {
          total_high_risk: 1,
          total_overdue: 1,
          total_credit_alerts: 1
        }
      });

    // Mock model management endpoints
    nock(this.baseURL)
      .persist()
      .get('/api/v1/models/status')
      .reply(200, {
        models: {
          payment_delay_predictor: {
            status: 'loaded',
            accuracy: 0.85,
            last_trained: new Date().toISOString()
          },
          risk_assessment: {
            status: 'loaded',
            accuracy: 0.78,
            last_trained: new Date().toISOString()
          },
          inventory_forecast: {
            status: 'loaded',
            accuracy: 0.82,
            last_trained: new Date().toISOString()
          }
        }
      });

    nock(this.baseURL)
      .persist()
      .post('/api/v1/models/retrain')
      .reply(202, {
        message: 'Model retraining initiated',
        job_id: 'retrain_job_123',
        estimated_completion: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      });

    this.isActive = true;
    console.log('Mock ML Service started');
  }

  /**
   * Stop mocking ML service endpoints
   */
  stop() {
    if (!this.isActive) return;
    
    nock.cleanAll();
    this.isActive = false;
    console.log('Mock ML Service stopped');
  }

  /**
   * Reset all mocks
   */
  reset() {
    this.stop();
    this.start();
  }

  /**
   * Add custom mock response
   */
  addCustomMock(method, endpoint, response, statusCode = 200) {
    const mockScope = nock(this.baseURL)
      .persist();

    if (method.toLowerCase() === 'get') {
      mockScope.get(endpoint).reply(statusCode, response);
    } else if (method.toLowerCase() === 'post') {
      mockScope.post(endpoint).reply(statusCode, response);
    }
  }

  /**
   * Simulate ML service errors
   */
  simulateError(endpoint, statusCode = 500, errorMessage = 'Internal Server Error') {
    nock(this.baseURL)
      .persist()
      .get(endpoint)
      .reply(statusCode, { error: errorMessage });

    nock(this.baseURL)
      .persist()
      .post(endpoint)
      .reply(statusCode, { error: errorMessage });
  }
}

module.exports = MockMLService;
