"""
Configuration settings for FinSync360 ML Service
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application settings
    APP_NAME: str = "FinSync360 ML Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8001, env="PORT")
    
    # Security settings
    SECRET_KEY: str = Field(env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",  # React frontend
            "http://localhost:5000",  # Backend API
            "http://localhost:8000",  # Alternative backend port
        ],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "*"],
        env="ALLOWED_HOSTS"
    )
    
    # Database settings
    MONGODB_URL: str = Field(env="MONGODB_URL")
    DATABASE_NAME: str = Field(default="finsync360", env="DATABASE_NAME")
    
    # Main backend API settings
    BACKEND_API_URL: str = Field(
        default="http://localhost:5000/api",
        env="BACKEND_API_URL"
    )
    BACKEND_API_KEY: Optional[str] = Field(default=None, env="BACKEND_API_KEY")
    
    # ML Model settings
    MODEL_STORAGE_PATH: str = Field(
        default="./models/saved",
        env="MODEL_STORAGE_PATH"
    )
    MODEL_RETRAIN_INTERVAL_HOURS: int = Field(
        default=24,
        env="MODEL_RETRAIN_INTERVAL_HOURS"
    )
    MIN_TRAINING_DATA_SIZE: int = Field(
        default=100,
        env="MIN_TRAINING_DATA_SIZE"
    )
    
    # Prediction settings
    PAYMENT_PREDICTION_DAYS_AHEAD: int = Field(
        default=30,
        env="PAYMENT_PREDICTION_DAYS_AHEAD"
    )
    INVENTORY_FORECAST_DAYS_AHEAD: int = Field(
        default=90,
        env="INVENTORY_FORECAST_DAYS_AHEAD"
    )
    RISK_ASSESSMENT_THRESHOLD: float = Field(
        default=0.7,
        env="RISK_ASSESSMENT_THRESHOLD"
    )
    
    # Redis settings (for caching and task queue)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    CACHE_TTL_SECONDS: int = Field(
        default=3600,  # 1 hour
        env="CACHE_TTL_SECONDS"
    )
    
    # Logging settings
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # Feature engineering settings
    FEATURE_WINDOW_DAYS: int = Field(
        default=365,  # 1 year of historical data
        env="FEATURE_WINDOW_DAYS"
    )
    SEASONAL_PERIODS: List[int] = Field(
        default=[7, 30, 90, 365],  # Weekly, monthly, quarterly, yearly
        env="SEASONAL_PERIODS"
    )
    
    # Model performance thresholds
    MIN_MODEL_ACCURACY: float = Field(
        default=0.75,
        env="MIN_MODEL_ACCURACY"
    )
    MIN_MODEL_PRECISION: float = Field(
        default=0.70,
        env="MIN_MODEL_PRECISION"
    )
    MIN_MODEL_RECALL: float = Field(
        default=0.70,
        env="MIN_MODEL_RECALL"
    )
    
    # Business rules
    HIGH_RISK_CUSTOMER_THRESHOLD: float = Field(
        default=0.8,
        env="HIGH_RISK_CUSTOMER_THRESHOLD"
    )
    LOW_STOCK_THRESHOLD_DAYS: int = Field(
        default=7,
        env="LOW_STOCK_THRESHOLD_DAYS"
    )
    OVERSTOCK_THRESHOLD_MULTIPLIER: float = Field(
        default=3.0,
        env="OVERSTOCK_THRESHOLD_MULTIPLIER"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings"""
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"


class ProductionSettings(Settings):
    """Production environment settings"""
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ALLOWED_HOSTS: List[str] = ["your-domain.com"]


class TestingSettings(Settings):
    """Testing environment settings"""
    DEBUG: bool = True
    DATABASE_NAME: str = "finsync360_test"
    MODEL_RETRAIN_INTERVAL_HOURS: int = 1  # Faster retraining for tests


def get_environment_settings() -> Settings:
    """Get settings based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()
