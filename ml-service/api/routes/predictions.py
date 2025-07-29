"""
Prediction endpoints for ML Service
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta
import pandas as pd

from services.prediction_service import PredictionService
from config.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for request/response
class PaymentPredictionRequest(BaseModel):
    customer_id: Optional[str] = None
    customer_ids: Optional[List[str]] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    days_ahead: Optional[int] = Field(default=30, ge=1, le=365)

class PaymentPredictionResponse(BaseModel):
    customer_id: str
    delay_probability: float
    predicted_delay_days: int
    risk_level: str
    confidence_score: float
    factors: Dict[str, Any]

class BulkPaymentPredictionResponse(BaseModel):
    predictions: List[PaymentPredictionResponse]
    summary: Dict[str, Any]

class InventoryForecastRequest(BaseModel):
    item_id: Optional[str] = None
    item_ids: Optional[List[str]] = None
    days_ahead: Optional[int] = Field(default=90, ge=1, le=365)
    include_seasonality: bool = True

class InventoryForecastResponse(BaseModel):
    item_id: str
    item_name: str
    current_stock: int
    predicted_demand: List[Dict[str, Any]]
    reorder_recommendation: Dict[str, Any]
    confidence_score: float

class RiskAssessmentRequest(BaseModel):
    customer_id: str
    assessment_type: str = Field(default="credit", pattern="^(credit|payment|overall)$")

class RiskAssessmentResponse(BaseModel):
    customer_id: str
    risk_score: float
    risk_level: str
    risk_factors: List[Dict[str, Any]]
    recommendations: List[str]
    assessment_date: datetime

# Dependency to get prediction service
async def get_prediction_service() -> PredictionService:
    return PredictionService()

@router.post("/payment-delay", response_model=PaymentPredictionResponse)
async def predict_payment_delay(
    request: PaymentPredictionRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Predict payment delay for a single customer/payment"""
    try:
        if not request.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="customer_id is required"
            )
        
        result = await prediction_service.predict_payment_delay(
            customer_id=request.customer_id,
            amount=request.amount,
            due_date=request.due_date,
            days_ahead=request.days_ahead
        )
        
        return PaymentPredictionResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Payment delay prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction service error"
        )

@router.post("/payment-delay/bulk", response_model=BulkPaymentPredictionResponse)
async def predict_payment_delay_bulk(
    request: PaymentPredictionRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Predict payment delays for multiple customers"""
    try:
        if not request.customer_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="customer_ids list is required"
            )
        
        results = await prediction_service.predict_payment_delay_bulk(
            customer_ids=request.customer_ids,
            days_ahead=request.days_ahead
        )
        
        predictions = [PaymentPredictionResponse(**result) for result in results["predictions"]]
        
        return BulkPaymentPredictionResponse(
            predictions=predictions,
            summary=results["summary"]
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Bulk payment delay prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction service error"
        )

@router.post("/inventory-forecast", response_model=List[InventoryForecastResponse])
async def forecast_inventory_demand(
    request: InventoryForecastRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Forecast inventory demand for items"""
    try:
        item_ids = request.item_ids or ([request.item_id] if request.item_id else [])
        
        if not item_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="item_id or item_ids is required"
            )
        
        results = await prediction_service.forecast_inventory_demand(
            item_ids=item_ids,
            days_ahead=request.days_ahead,
            include_seasonality=request.include_seasonality
        )
        
        return [InventoryForecastResponse(**result) for result in results]
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Inventory forecast failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction service error"
        )

@router.post("/risk-assessment", response_model=RiskAssessmentResponse)
async def assess_customer_risk(
    request: RiskAssessmentRequest,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Assess customer risk (credit, payment, overall)"""
    try:
        result = await prediction_service.assess_customer_risk(
            customer_id=request.customer_id,
            assessment_type=request.assessment_type
        )
        
        return RiskAssessmentResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction service error"
        )

@router.get("/models/status")
async def get_models_status(
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Get status of all ML models"""
    try:
        status = await prediction_service.get_models_status()
        return status
        
    except Exception as e:
        logger.error(f"Failed to get models status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve models status"
        )

@router.post("/models/retrain")
async def retrain_models(
    model_types: Optional[List[str]] = None,
    prediction_service: PredictionService = Depends(get_prediction_service)
):
    """Trigger model retraining"""
    try:
        result = await prediction_service.retrain_models(model_types)
        return {
            "message": "Model retraining initiated",
            "models": result
        }
        
    except Exception as e:
        logger.error(f"Model retraining failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model retraining failed"
        )
