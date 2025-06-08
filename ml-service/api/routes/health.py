"""
Health check endpoints for ML Service
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
import logging
from datetime import datetime

from config.database import check_database_health
from config.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "FinSync360 ML Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check including database and services"""
    try:
        # Check database health
        db_health = await check_database_health()
        
        # Check model availability (placeholder)
        models_status = {
            "payment_delay_predictor": "loaded",
            "payment_amount_predictor": "loaded",
            "risk_assessment": "not_loaded",
            "inventory_forecast": "not_loaded"
        }
        
        # Overall health status
        overall_status = "healthy" if db_health["status"] == "healthy" else "degraded"
        
        return {
            "status": overall_status,
            "service": "FinSync360 ML Service",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "database": db_health,
            "models": models_status,
            "uptime": "N/A"  # Would implement actual uptime tracking
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "FinSync360 ML Service",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@router.get("/health/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check for Kubernetes/container orchestration"""
    try:
        # Check if service is ready to handle requests
        db_health = await check_database_health()
        
        if db_health["status"] != "healthy":
            return {
                "ready": False,
                "reason": "Database not available"
            }
        
        return {
            "ready": True,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "ready": False,
            "reason": str(e)
        }

@router.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """Liveness check for Kubernetes/container orchestration"""
    return {
        "alive": True,
        "timestamp": datetime.now().isoformat()
    }
