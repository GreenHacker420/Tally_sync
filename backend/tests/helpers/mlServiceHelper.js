const axios = require('axios');

/**
 * ML Service Helper for Testing
 * Provides utilities for testing ML service integration
 */
class MLServiceHelper {
  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    this.apiVersion = '/api/v1';
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Get full endpoint URL
   */
  getEndpointURL(endpoint) {
    return `${this.baseURL}${this.apiVersion}${endpoint}`;
  }

  /**
   * Check if ML service is running
   */
  async isServiceRunning() {
    try {
      const response = await axios.get(this.getEndpointURL('/health'), {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start mock ML service if real service is not running
   */
  async ensureServiceAvailable() {
    const isRunning = await this.isServiceRunning();
    if (!isRunning) {
      console.log('ML Service not running, using mock responses');
      return false;
    }
    return true;
  }

  /**
   * Create test customer data for ML predictions
   */
  createTestCustomerData() {
    return {
      customer_id: '507f1f77bcf86cd799439011',
      customerName: 'Test Customer Ltd',
      creditLimit: { amount: 100000, days: 30 },
      balances: {
        current: { amount: 15000, type: 'debit' }
      },
      preferences: {
        paymentTerms: 'credit',
        defaultPaymentMethod: 'bank'
      }
    };
  }

  /**
   * Create test item data for inventory forecasting
   */
  createTestItemData() {
    return {
      item_id: '507f1f77bcf86cd799439012',
      name: 'Test Product',
      code: 'TEST001',
      pricing: { sellingPrice: 1000 },
      inventory: {
        stockLevels: { minimum: 10, reorderLevel: 20 },
        currentStock: 50
      }
    };
  }

  /**
   * Create test payment data
   */
  createTestPaymentData() {
    return {
      customer_id: '507f1f77bcf86cd799439011',
      amount: 50000,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      days_ahead: 30
    };
  }

  /**
   * Create test inventory forecast request
   */
  createTestInventoryForecastData() {
    return {
      item_id: '507f1f77bcf86cd799439012',
      days_ahead: 90,
      include_seasonality: true
    };
  }

  /**
   * Create test risk assessment request
   */
  createTestRiskAssessmentData() {
    return {
      customer_id: '507f1f77bcf86cd799439011',
      assessment_type: 'overall'
    };
  }

  /**
   * Validate payment prediction response structure
   */
  validatePaymentPredictionResponse(response) {
    const required = ['customer_id', 'delay_probability', 'predicted_delay_days', 'risk_level', 'confidence_score'];
    return required.every(field => response.hasOwnProperty(field));
  }

  /**
   * Validate inventory forecast response structure
   */
  validateInventoryForecastResponse(response) {
    const required = ['item_id', 'item_name', 'current_stock', 'predicted_demand', 'confidence_score'];
    return required.every(field => response.hasOwnProperty(field));
  }

  /**
   * Validate risk assessment response structure
   */
  validateRiskAssessmentResponse(response) {
    const required = ['customer_id', 'risk_score', 'risk_level', 'risk_factors', 'recommendations'];
    return required.every(field => response.hasOwnProperty(field));
  }

  /**
   * Validate business metrics response structure
   */
  validateBusinessMetricsResponse(response) {
    const required = ['revenue_forecast', 'payment_insights', 'customer_analytics', 'inventory_insights'];
    return required.every(field => response.hasOwnProperty(field));
  }

  /**
   * Validate health response structure
   */
  validateHealthResponse(response) {
    const required = ['status', 'service', 'version', 'timestamp'];
    return required.every(field => response.hasOwnProperty(field));
  }

  /**
   * Generate mock ML service responses for testing
   */
  getMockResponses() {
    return {
      health: {
        status: 'healthy',
        service: 'FinSync360 ML Service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      },
      paymentPrediction: {
        customer_id: '507f1f77bcf86cd799439011',
        delay_probability: 0.25,
        predicted_delay_days: 5,
        risk_level: 'medium',
        confidence_score: 0.85,
        factors: {
          payment_history: 0.3,
          credit_utilization: 0.2,
          seasonal_trends: 0.15
        }
      },
      inventoryForecast: {
        item_id: '507f1f77bcf86cd799439012',
        item_name: 'Test Product',
        current_stock: 50,
        predicted_demand: [
          { date: '2024-01-01', demand: 10 },
          { date: '2024-01-02', demand: 12 }
        ],
        reorder_recommendation: {
          should_reorder: true,
          recommended_quantity: 100,
          optimal_timing: '2024-01-15'
        },
        confidence_score: 0.78
      },
      riskAssessment: {
        customer_id: '507f1f77bcf86cd799439011',
        risk_score: 0.35,
        risk_level: 'medium',
        risk_factors: {
          payment_delays: 0.2,
          credit_utilization: 0.15,
          business_stability: 0.1
        },
        recommendations: [
          'Monitor payment patterns closely',
          'Consider credit limit review'
        ],
        assessment_date: new Date()
      },
      businessMetrics: {
        revenue_forecast: {
          current_month: 150000,
          next_month_prediction: 165000,
          growth_rate: 0.10
        },
        payment_insights: {
          on_time_rate: 85.5,
          average_delay_days: 3.2,
          total_overdue: 25000
        },
        customer_analytics: {
          total_customers: 150,
          high_risk_customers: 12,
          new_customers_this_month: 8
        },
        inventory_insights: {
          total_items: 500,
          low_stock_items: 15,
          overstock_items: 8
        }
      }
    };
  }
}

module.exports = MLServiceHelper;
