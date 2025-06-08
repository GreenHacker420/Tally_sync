"""
Test cases for ML Service API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import json

from main import app

client = TestClient(app)

class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "FinSync360 ML Service"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
    
    def test_basic_health_check(self):
        """Test basic health check"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "FinSync360 ML Service"
    
    @patch('config.database.check_database_health')
    async def test_detailed_health_check(self, mock_db_health):
        """Test detailed health check"""
        mock_db_health.return_value = {"status": "healthy"}
        
        response = client.get("/api/v1/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert "database" in data
        assert "models" in data
    
    def test_readiness_check(self):
        """Test readiness check"""
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert "ready" in data
    
    def test_liveness_check(self):
        """Test liveness check"""
        response = client.get("/api/v1/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["alive"] == True

class TestPredictionEndpoints:
    """Test prediction endpoints"""
    
    @patch('services.prediction_service.PredictionService.predict_payment_delay')
    def test_payment_delay_prediction(self, mock_predict):
        """Test payment delay prediction endpoint"""
        # Mock the prediction service response
        mock_predict.return_value = {
            'customer_id': 'test_customer',
            'delay_probability': 0.75,
            'predicted_delay_days': 5,
            'risk_level': 'High',
            'confidence_score': 0.85,
            'factors': {'credit_utilization': 0.3}
        }
        
        request_data = {
            "customer_id": "test_customer",
            "amount": 1000.0,
            "days_ahead": 30
        }
        
        response = client.post("/api/v1/payment-delay", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == "test_customer"
        assert data["delay_probability"] == 0.75
        assert data["risk_level"] == "High"
    
    def test_payment_delay_prediction_missing_customer_id(self):
        """Test payment delay prediction with missing customer_id"""
        request_data = {
            "amount": 1000.0,
            "days_ahead": 30
        }
        
        response = client.post("/api/v1/payment-delay", json=request_data)
        assert response.status_code == 400
        assert "customer_id is required" in response.json()["detail"]
    
    @patch('services.prediction_service.PredictionService.predict_payment_delay_bulk')
    def test_bulk_payment_delay_prediction(self, mock_predict_bulk):
        """Test bulk payment delay prediction endpoint"""
        mock_predict_bulk.return_value = {
            'predictions': [
                {
                    'customer_id': 'customer1',
                    'delay_probability': 0.6,
                    'predicted_delay_days': 3,
                    'risk_level': 'Medium',
                    'confidence_score': 0.8,
                    'factors': {}
                }
            ],
            'summary': {
                'total_customers': 1,
                'successful_predictions': 1,
                'high_risk_customers': 0,
                'medium_risk_customers': 1,
                'low_risk_customers': 0
            }
        }
        
        request_data = {
            "customer_ids": ["customer1", "customer2"],
            "days_ahead": 30
        }
        
        response = client.post("/api/v1/payment-delay/bulk", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert len(data["predictions"]) == 1
        assert data["summary"]["total_customers"] == 1
    
    @patch('services.prediction_service.PredictionService.assess_customer_risk')
    def test_risk_assessment(self, mock_assess_risk):
        """Test customer risk assessment endpoint"""
        mock_assess_risk.return_value = {
            'customer_id': 'test_customer',
            'risk_score': 0.7,
            'risk_level': 'High',
            'risk_factors': [
                {
                    'factor': 'High Credit Utilization',
                    'value': '85%',
                    'impact': 'High'
                }
            ],
            'recommendations': ['Consider reducing credit limit'],
            'assessment_date': '2024-01-01T00:00:00'
        }
        
        request_data = {
            "customer_id": "test_customer",
            "assessment_type": "credit"
        }
        
        response = client.post("/api/v1/risk-assessment", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == "test_customer"
        assert data["risk_score"] == 0.7
        assert data["risk_level"] == "High"
    
    @patch('services.prediction_service.PredictionService.get_models_status')
    def test_models_status(self, mock_status):
        """Test models status endpoint"""
        mock_status.return_value = {
            'payment_delay_predictor': {
                'loaded': True,
                'last_trained': '2024-01-01T00:00:00',
                'performance': {'accuracy': 0.85}
            },
            'payment_amount_predictor': {
                'loaded': False,
                'last_trained': None,
                'performance': {}
            }
        }
        
        response = client.get("/api/v1/models/status")
        assert response.status_code == 200
        data = response.json()
        assert 'payment_delay_predictor' in data
        assert data['payment_delay_predictor']['loaded'] == True

class TestAnalyticsEndpoints:
    """Test analytics endpoints"""
    
    @patch('api.routes.analytics._get_revenue_forecast')
    @patch('api.routes.analytics._get_payment_insights')
    @patch('api.routes.analytics._get_customer_analytics')
    @patch('api.routes.analytics._get_inventory_insights')
    @patch('api.routes.analytics._get_risk_summary')
    def test_business_metrics(self, mock_risk, mock_inventory, mock_customer, mock_payment, mock_revenue):
        """Test business metrics endpoint"""
        # Mock all the helper functions
        mock_revenue.return_value = {"forecast_next_30_days": 100000}
        mock_payment.return_value = {"on_time_rate": 85.5}
        mock_customer.return_value = {"total_customers": 150}
        mock_inventory.return_value = {"total_items": 500}
        mock_risk.return_value = {"risk_level": "Low"}
        
        response = client.get("/api/v1/business-metrics?days_back=30")
        assert response.status_code == 200
        data = response.json()
        assert "revenue_forecast" in data
        assert "payment_insights" in data
        assert "customer_analytics" in data
        assert "inventory_insights" in data
        assert "risk_summary" in data
    
    @patch('config.database.get_collection')
    def test_customer_insights_not_found(self, mock_get_collection):
        """Test customer insights for non-existent customer"""
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = None
        mock_get_collection.return_value = mock_collection
        
        response = client.get("/api/v1/customer-insights/nonexistent_customer")
        assert response.status_code == 404
        assert "Customer not found" in response.json()["detail"]

class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_endpoint(self):
        """Test invalid endpoint returns 404"""
        response = client.get("/api/v1/invalid-endpoint")
        assert response.status_code == 404
    
    def test_invalid_json_payload(self):
        """Test invalid JSON payload"""
        response = client.post(
            "/api/v1/payment-delay",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422  # Unprocessable Entity
    
    def test_missing_required_fields(self):
        """Test missing required fields in request"""
        response = client.post("/api/v1/payment-delay", json={})
        assert response.status_code == 400

if __name__ == "__main__":
    pytest.main([__file__])
