"""
Analytics endpoints for ML Service
Business Intelligence and Analytics API
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta
import pandas as pd

from services.prediction_service import PredictionService
from config.database import get_collection, aggregate_pipeline
from config.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for analytics
class BusinessMetricsResponse(BaseModel):
    revenue_forecast: Dict[str, Any]
    payment_insights: Dict[str, Any]
    customer_analytics: Dict[str, Any]
    inventory_insights: Dict[str, Any]
    risk_summary: Dict[str, Any]

class CustomerInsightsResponse(BaseModel):
    customer_id: str
    customer_name: str
    risk_profile: Dict[str, Any]
    payment_behavior: Dict[str, Any]
    revenue_contribution: Dict[str, Any]
    recommendations: List[str]

class InventoryAnalyticsResponse(BaseModel):
    total_items: int
    low_stock_items: List[Dict[str, Any]]
    overstock_items: List[Dict[str, Any]]
    demand_trends: List[Dict[str, Any]]
    reorder_recommendations: List[Dict[str, Any]]

# Dependency
async def get_prediction_service() -> PredictionService:
    return PredictionService()

@router.get("/business-metrics", response_model=BusinessMetricsResponse)
async def get_business_metrics(
    days_back: int = Query(default=30, ge=1, le=365),
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get comprehensive business metrics and forecasts"""
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Revenue forecast
        revenue_forecast = await _get_revenue_forecast(start_date, end_date)
        
        # Payment insights
        payment_insights = await _get_payment_insights(start_date, end_date)
        
        # Customer analytics
        customer_analytics = await _get_customer_analytics(start_date, end_date)
        
        # Inventory insights
        inventory_insights = await _get_inventory_insights()
        
        # Risk summary
        risk_summary = await _get_risk_summary()
        
        return BusinessMetricsResponse(
            revenue_forecast=revenue_forecast,
            payment_insights=payment_insights,
            customer_analytics=customer_analytics,
            inventory_insights=inventory_insights,
            risk_summary=risk_summary
        )
        
    except Exception as e:
        logger.error(f"Failed to get business metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve business metrics"
        )

@router.get("/customer-insights/{customer_id}", response_model=CustomerInsightsResponse)
async def get_customer_insights(
    customer_id: str,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get detailed insights for a specific customer"""
    try:
        # Get customer data
        customers_collection = await get_collection("customers")
        customer = await customers_collection.find_one({"_id": customer_id})
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Risk assessment
        risk_assessment = await prediction_service.assess_customer_risk(customer_id)
        
        # Payment behavior analysis
        payment_behavior = await _analyze_customer_payment_behavior(customer_id)
        
        # Revenue contribution analysis
        revenue_contribution = await _analyze_customer_revenue_contribution(customer_id)
        
        # Generate recommendations
        recommendations = await _generate_customer_recommendations(
            customer, risk_assessment, payment_behavior, revenue_contribution
        )
        
        return CustomerInsightsResponse(
            customer_id=customer_id,
            customer_name=customer.get('customerName', 'Unknown'),
            risk_profile=risk_assessment,
            payment_behavior=payment_behavior,
            revenue_contribution=revenue_contribution,
            recommendations=recommendations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get customer insights for {customer_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve customer insights"
        )

@router.get("/inventory-analytics", response_model=InventoryAnalyticsResponse)
async def get_inventory_analytics(
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get inventory analytics and recommendations"""
    try:
        # Get inventory data
        inventory_collection = await get_collection("inventory")
        
        # Total items count
        total_items = await inventory_collection.count_documents({})
        
        # Low stock items
        low_stock_items = await _get_low_stock_items()
        
        # Overstock items
        overstock_items = await _get_overstock_items()
        
        # Demand trends
        demand_trends = await _get_demand_trends()
        
        # Reorder recommendations
        reorder_recommendations = await _get_reorder_recommendations()
        
        return InventoryAnalyticsResponse(
            total_items=total_items,
            low_stock_items=low_stock_items,
            overstock_items=overstock_items,
            demand_trends=demand_trends,
            reorder_recommendations=reorder_recommendations
        )
        
    except Exception as e:
        logger.error(f"Failed to get inventory analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve inventory analytics"
        )

@router.get("/payment-trends")
async def get_payment_trends(
    days_back: int = Query(default=90, ge=1, le=365)
):
    """Get payment trends and patterns"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Payment trends pipeline
        pipeline = [
            {
                "$match": {
                    "paymentDate": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$paymentDate"},
                        "month": {"$month": "$paymentDate"},
                        "day": {"$dayOfMonth": "$paymentDate"}
                    },
                    "total_amount": {"$sum": "$amount"},
                    "payment_count": {"$sum": 1},
                    "avg_amount": {"$avg": "$amount"}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        trends = await aggregate_pipeline("payments", pipeline)
        
        # Calculate additional metrics
        total_payments = sum(t["payment_count"] for t in trends)
        total_amount = sum(t["total_amount"] for t in trends)
        avg_daily_amount = total_amount / len(trends) if trends else 0
        
        return {
            "trends": trends,
            "summary": {
                "total_payments": total_payments,
                "total_amount": total_amount,
                "average_daily_amount": avg_daily_amount,
                "period_days": days_back
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get payment trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment trends"
        )

@router.get("/risk-dashboard")
async def get_risk_dashboard():
    """Get risk dashboard data"""
    try:
        # High-risk customers
        high_risk_customers = await _get_high_risk_customers()
        
        # Overdue payments
        overdue_payments = await _get_overdue_payments()
        
        # Credit utilization alerts
        credit_alerts = await _get_credit_utilization_alerts()
        
        return {
            "high_risk_customers": high_risk_customers,
            "overdue_payments": overdue_payments,
            "credit_alerts": credit_alerts,
            "summary": {
                "total_high_risk": len(high_risk_customers),
                "total_overdue": len(overdue_payments),
                "total_credit_alerts": len(credit_alerts)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get risk dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve risk dashboard"
        )

# Helper functions
async def _get_revenue_forecast(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Get revenue forecast data"""
    try:
        # Historical revenue
        pipeline = [
            {
                "$match": {
                    "date": {"$gte": start_date, "$lte": end_date},
                    "voucherType": "Sales"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$amount"},
                    "transaction_count": {"$sum": 1},
                    "avg_transaction": {"$avg": "$amount"}
                }
            }
        ]
        
        revenue_data = await aggregate_pipeline("vouchers", pipeline)
        current_revenue = revenue_data[0] if revenue_data else {
            "total_revenue": 0, "transaction_count": 0, "avg_transaction": 0
        }
        
        # Simple forecast (placeholder for more sophisticated forecasting)
        days_in_period = (end_date - start_date).days
        daily_avg = current_revenue["total_revenue"] / max(days_in_period, 1)
        
        return {
            "current_period": current_revenue,
            "forecast_next_30_days": daily_avg * 30,
            "growth_rate": 0.05,  # Placeholder
            "confidence": 0.75
        }
        
    except Exception as e:
        logger.error(f"Error getting revenue forecast: {e}")
        return {"error": str(e)}

async def _get_payment_insights(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Get payment insights"""
    try:
        # Payment status distribution
        pipeline = [
            {
                "$match": {
                    "dueDate": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$amount"}
                }
            }
        ]
        
        payment_status = await aggregate_pipeline("payments", pipeline)
        
        # Calculate metrics
        total_payments = sum(p["count"] for p in payment_status)
        on_time_payments = next((p["count"] for p in payment_status if p["_id"] == "paid"), 0)
        overdue_payments = next((p["count"] for p in payment_status if p["_id"] == "overdue"), 0)
        
        on_time_rate = (on_time_payments / total_payments * 100) if total_payments > 0 else 0
        
        return {
            "total_payments": total_payments,
            "on_time_rate": on_time_rate,
            "overdue_count": overdue_payments,
            "status_distribution": payment_status
        }
        
    except Exception as e:
        logger.error(f"Error getting payment insights: {e}")
        return {"error": str(e)}

async def _get_customer_analytics(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Get customer analytics"""
    try:
        customers_collection = await get_collection("customers")
        total_customers = await customers_collection.count_documents({})
        
        # Active customers (with recent transactions)
        pipeline = [
            {
                "$match": {
                    "date": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$partyName",
                    "transaction_count": {"$sum": 1},
                    "total_amount": {"$sum": "$amount"}
                }
            }
        ]
        
        active_customers = await aggregate_pipeline("vouchers", pipeline)
        
        return {
            "total_customers": total_customers,
            "active_customers": len(active_customers),
            "top_customers": sorted(active_customers, key=lambda x: x["total_amount"], reverse=True)[:10]
        }
        
    except Exception as e:
        logger.error(f"Error getting customer analytics: {e}")
        return {"error": str(e)}

async def _get_inventory_insights() -> Dict[str, Any]:
    """Get inventory insights"""
    try:
        inventory_collection = await get_collection("inventory")
        
        # Low stock items
        low_stock_count = await inventory_collection.count_documents({
            "stockLevel": {"$lt": 10}  # Assuming 10 is low stock threshold
        })
        
        # Total inventory value
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_items": {"$sum": 1},
                    "total_stock": {"$sum": "$stockLevel"},
                    "avg_stock": {"$avg": "$stockLevel"}
                }
            }
        ]
        
        inventory_stats = await aggregate_pipeline("inventory", pipeline)
        stats = inventory_stats[0] if inventory_stats else {}
        
        return {
            "total_items": stats.get("total_items", 0),
            "total_stock_units": stats.get("total_stock", 0),
            "low_stock_items": low_stock_count,
            "average_stock_level": stats.get("avg_stock", 0)
        }
        
    except Exception as e:
        logger.error(f"Error getting inventory insights: {e}")
        return {"error": str(e)}

async def _get_risk_summary() -> Dict[str, Any]:
    """Get risk summary"""
    try:
        # High credit utilization customers
        customers_collection = await get_collection("customers")
        
        pipeline = [
            {
                "$match": {
                    "creditLimit": {"$gt": 0}
                }
            },
            {
                "$addFields": {
                    "utilization_ratio": {
                        "$divide": ["$outstandingAmount", "$creditLimit"]
                    }
                }
            },
            {
                "$match": {
                    "utilization_ratio": {"$gt": 0.8}
                }
            },
            {
                "$count": "high_utilization_count"
            }
        ]
        
        high_utilization = await aggregate_pipeline("customers", pipeline)
        high_utilization_count = high_utilization[0]["high_utilization_count"] if high_utilization else 0
        
        return {
            "high_credit_utilization": high_utilization_count,
            "risk_level": "Medium" if high_utilization_count > 5 else "Low"
        }
        
    except Exception as e:
        logger.error(f"Error getting risk summary: {e}")
        return {"error": str(e)}

# Additional helper functions would be implemented here...
async def _analyze_customer_payment_behavior(customer_id: str) -> Dict[str, Any]:
    """Analyze customer payment behavior"""
    # Placeholder implementation
    return {
        "average_delay_days": 5,
        "payment_frequency": "Monthly",
        "preferred_method": "Bank Transfer",
        "reliability_score": 0.85
    }

async def _analyze_customer_revenue_contribution(customer_id: str) -> Dict[str, Any]:
    """Analyze customer revenue contribution"""
    # Placeholder implementation
    return {
        "total_revenue": 50000,
        "average_order_value": 2500,
        "order_frequency": "Bi-weekly",
        "growth_trend": "Increasing"
    }

async def _generate_customer_recommendations(customer, risk_assessment, payment_behavior, revenue_contribution) -> List[str]:
    """Generate customer-specific recommendations"""
    recommendations = []
    
    if risk_assessment.get("risk_level") == "High":
        recommendations.append("Consider requiring advance payment or reducing credit limit")
    
    if payment_behavior.get("average_delay_days", 0) > 7:
        recommendations.append("Implement automated payment reminders")
    
    if revenue_contribution.get("growth_trend") == "Decreasing":
        recommendations.append("Engage with customer to understand needs and improve relationship")
    
    return recommendations

async def _get_low_stock_items() -> List[Dict[str, Any]]:
    """Get low stock items"""
    # Placeholder implementation
    return []

async def _get_overstock_items() -> List[Dict[str, Any]]:
    """Get overstock items"""
    # Placeholder implementation
    return []

async def _get_demand_trends() -> List[Dict[str, Any]]:
    """Get demand trends"""
    # Placeholder implementation
    return []

async def _get_reorder_recommendations() -> List[Dict[str, Any]]:
    """Get reorder recommendations"""
    # Placeholder implementation
    return []

async def _get_high_risk_customers() -> List[Dict[str, Any]]:
    """Get high risk customers"""
    # Placeholder implementation
    return []

async def _get_overdue_payments() -> List[Dict[str, Any]]:
    """Get overdue payments"""
    # Placeholder implementation
    return []

async def _get_credit_utilization_alerts() -> List[Dict[str, Any]]:
    """Get credit utilization alerts"""
    # Placeholder implementation
    return []
