"""
Simple test version of FinSync360 ML Service
"""

from fastapi import FastAPI
from datetime import datetime

app = FastAPI(
    title="FinSync360 ML Service",
    description="AI/ML Predictive Analytics Microservice for ERP System",
    version="1.0.0"
)

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "FinSync360 ML Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "FinSync360 ML Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/payment-delay")
async def predict_payment_delay(customer_id: str):
    """Mock payment delay prediction"""
    return {
        "customer_id": customer_id,
        "delay_probability": 0.75,
        "predicted_delay_days": 5,
        "risk_level": "High",
        "confidence_score": 0.85,
        "factors": {
            "credit_utilization": 0.3,
            "payment_history": 0.4,
            "outstanding_amount": 0.3
        }
    }

@app.get("/api/v1/business-metrics")
async def get_business_metrics():
    """Mock business metrics"""
    return {
        "revenue_forecast": {
            "current_month": 150000,
            "next_month_prediction": 165000,
            "growth_rate": 0.10
        },
        "payment_insights": {
            "on_time_rate": 85.5,
            "average_delay_days": 3.2,
            "total_overdue": 25000
        },
        "customer_analytics": {
            "total_customers": 150,
            "high_risk_customers": 12,
            "new_customers_this_month": 8
        },
        "inventory_insights": {
            "total_items": 500,
            "low_stock_items": 15,
            "overstock_items": 8
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
