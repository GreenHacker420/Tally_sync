"""
FinSync360 ML Service - FastAPI Application
AI/ML Predictive Analytics Microservice for ERP System
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from contextlib import asynccontextmanager

# Import configuration and database
from config.settings import get_settings
from config.database import get_database, close_database_connection

# Import API routes
from api.routes import predictions, analytics, health

# Import services for initialization
from services.training_service import TrainingService
from services.prediction_service import PredictionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instances
training_service = None
prediction_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events"""
    global training_service, prediction_service
    
    # Startup
    logger.info("Starting FinSync360 ML Service...")
    
    try:
        # Initialize database connection
        await get_database()
        logger.info("Database connection established")
        
        # Initialize services
        training_service = TrainingService()
        prediction_service = PredictionService()
        
        # Load pre-trained models if available
        await prediction_service.load_models()
        logger.info("ML models loaded successfully")
        
        # Start background training scheduler
        await training_service.start_scheduler()
        logger.info("Training scheduler started")
        
        logger.info("FinSync360 ML Service started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start ML service: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down FinSync360 ML Service...")
    
    try:
        # Stop training scheduler
        if training_service:
            await training_service.stop_scheduler()
        
        # Close database connection
        await close_database_connection()
        
        logger.info("FinSync360 ML Service shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

# Create FastAPI application
def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    settings = get_settings()
    
    app = FastAPI(
        title="FinSync360 ML Service",
        description="AI/ML Predictive Analytics Microservice for ERP System",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )
    
    # Include API routes
    app.include_router(health.router, prefix="/api/v1", tags=["Health"])
    app.include_router(predictions.router, prefix="/api/v1", tags=["Predictions"])
    app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error(f"Global exception: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )
    
    return app

# Create app instance
app = create_app()

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "FinSync360 ML Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
