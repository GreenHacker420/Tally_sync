import { apiClient } from './apiClient';

// ML Service Types
export interface PaymentPredictionRequest {
  customer_id?: string;
  customer_ids?: string[];
  amount?: number;
  due_date?: string;
  days_ahead?: number;
}

export interface PaymentPredictionResponse {
  customer_id: string;
  delay_probability: number;
  predicted_delay_days: number;
  risk_level: string;
  confidence_score: number;
  factors: Record<string, number>;
}

export interface InventoryForecastRequest {
  item_ids?: string[];
  days_ahead?: number;
  include_recommendations?: boolean;
}

export interface InventoryForecastResponse {
  item_id: string;
  item_name: string;
  current_stock: number;
  predicted_demand: Array<{
    date: string;
    predicted_demand: number;
  }>;
  reorder_recommendation: {
    should_reorder: boolean;
    recommended_quantity: number;
    reorder_date: string;
    reason: string;
  };
  confidence_score: number;
}

export interface RiskAssessmentRequest {
  customer_id: string;
  assessment_type?: 'credit' | 'payment' | 'overall';
}

export interface RiskAssessmentResponse {
  customer_id: string;
  risk_score: number;
  risk_level: string;
  risk_factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
  assessment_date: string;
}

export interface BusinessMetrics {
  revenue_forecast: {
    current_month: number;
    next_month: number;
    growth_rate: number;
  };
  payment_insights: {
    on_time_percentage: number;
    average_delay_days: number;
    total_overdue: number;
  };
  customer_analytics: {
    total_customers: number;
    high_risk_customers: number;
    new_customers: number;
  };
  inventory_insights: {
    total_items: number;
    low_stock_items: number;
    overstock_items: number;
  };
}

export interface CustomerInsights {
  customer_id: string;
  payment_behavior: {
    average_delay_days: number;
    on_time_percentage: number;
    total_transactions: number;
  };
  risk_profile: {
    risk_score: number;
    risk_level: string;
    credit_limit: number;
    credit_utilization: number;
  };
  predictions: {
    next_payment_delay_probability: number;
    recommended_credit_limit: number;
  };
  trends: Array<{
    month: string;
    payment_performance: number;
  }>;
}

export interface InventoryAnalytics {
  total_items: number;
  low_stock_items: Array<{
    item_id: string;
    item_name: string;
    current_stock: number;
    reorder_level: number;
  }>;
  overstock_items: Array<{
    item_id: string;
    item_name: string;
    current_stock: number;
    optimal_stock: number;
  }>;
  demand_trends: Array<{
    item_id: string;
    item_name: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    change_percentage: number;
  }>;
  reorder_recommendations: Array<{
    item_id: string;
    item_name: string;
    recommended_quantity: number;
    urgency: 'high' | 'medium' | 'low';
  }>;
}

export interface PaymentTrends {
  monthly_trends: Array<{
    month: string;
    total_payments: number;
    on_time_payments: number;
    delayed_payments: number;
    average_delay_days: number;
  }>;
  customer_trends: Array<{
    customer_id: string;
    customer_name: string;
    trend: 'improving' | 'declining' | 'stable';
    change_percentage: number;
  }>;
  seasonal_patterns: Array<{
    month: number;
    payment_performance_index: number;
  }>;
}

export interface RiskDashboard {
  high_risk_customers: Array<{
    customer_id: string;
    customer_name: string;
    risk_score: number;
    risk_level: string;
    outstanding_amount: number;
  }>;
  overdue_payments: Array<{
    payment_id: string;
    customer_id: string;
    amount: number;
    days_overdue: number;
    risk_level: string;
  }>;
  credit_alerts: Array<{
    customer_id: string;
    customer_name: string;
    credit_limit: number;
    credit_utilization: number;
    alert_type: string;
  }>;
  summary: {
    total_high_risk: number;
    total_overdue: number;
    total_credit_alerts: number;
  };
}

export interface ModelStatus {
  models: {
    payment_delay_predictor: {
      status: string;
      last_trained: string;
      accuracy: number;
      version: string;
    };
    risk_assessment: {
      status: string;
      last_trained: string;
      accuracy: number;
      version: string;
    };
    inventory_forecast: {
      status: string;
      last_trained: string;
      accuracy: number;
      version: string;
    };
  };
  overall_health: string;
}

class MLService {
  private readonly baseURL = '/ml/api/v1';

  /**
   * Health Check
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get(`${this.baseURL}/health`);
    return response.data;
  }

  async getDetailedHealth(): Promise<{
    status: string;
    database: string;
    models: Record<string, any>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/health/detailed`);
    return response.data;
  }

  /**
   * Payment Predictions
   */
  async predictPaymentDelay(request: PaymentPredictionRequest): Promise<PaymentPredictionResponse> {
    const response = await apiClient.post(`${this.baseURL}/payment-delay`, request);
    return response.data;
  }

  async predictPaymentDelayBulk(request: PaymentPredictionRequest): Promise<PaymentPredictionResponse[]> {
    const response = await apiClient.post(`${this.baseURL}/payment-delay/bulk`, request);
    return response.data;
  }

  /**
   * Inventory Forecasting
   */
  async forecastInventoryDemand(request: InventoryForecastRequest): Promise<InventoryForecastResponse[]> {
    const response = await apiClient.post(`${this.baseURL}/inventory-forecast`, request);
    return response.data;
  }

  /**
   * Risk Assessment
   */
  async assessCustomerRisk(request: RiskAssessmentRequest): Promise<RiskAssessmentResponse> {
    const response = await apiClient.post(`${this.baseURL}/risk-assessment`, request);
    return response.data;
  }

  /**
   * Analytics
   */
  async getBusinessMetrics(daysBack: number = 30): Promise<BusinessMetrics> {
    const response = await apiClient.get(`${this.baseURL}/business-metrics`, {
      params: { days_back: daysBack },
    });
    return response.data;
  }

  async getCustomerInsights(customerId: string): Promise<CustomerInsights> {
    const response = await apiClient.get(`${this.baseURL}/customer-insights/${customerId}`);
    return response.data;
  }

  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const response = await apiClient.get(`${this.baseURL}/inventory-analytics`);
    return response.data;
  }

  async getPaymentTrends(): Promise<PaymentTrends> {
    const response = await apiClient.get(`${this.baseURL}/payment-trends`);
    return response.data;
  }

  async getRiskDashboard(): Promise<RiskDashboard> {
    const response = await apiClient.get(`${this.baseURL}/risk-dashboard`);
    return response.data;
  }

  /**
   * Model Management
   */
  async getModelStatus(): Promise<ModelStatus> {
    const response = await apiClient.get(`${this.baseURL}/models/status`);
    return response.data;
  }

  async retrainModels(): Promise<{ message: string; job_id: string }> {
    const response = await apiClient.post(`${this.baseURL}/models/retrain`);
    return response.data;
  }

  /**
   * Utility Methods
   */
  formatRiskLevel(riskScore: number): string {
    if (riskScore >= 0.8) return 'High';
    if (riskScore >= 0.6) return 'Medium';
    if (riskScore >= 0.4) return 'Low';
    return 'Very Low';
  }

  formatConfidenceScore(score: number): string {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }
}

export const mlService = new MLService();
