"""
Base ML Model class for FinSync360 ML Service
Provides common functionality for all ML models
"""

import joblib
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Tuple
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import logging
import os
from datetime import datetime, timedelta
import json

from config.settings import get_settings

logger = logging.getLogger(__name__)

class BaseMLModel(ABC):
    """Base class for all ML models in FinSync360"""
    
    def __init__(self, model_name: str, model_type: str):
        self.model_name = model_name
        self.model_type = model_type
        self.model = None
        self.is_trained = False
        self.feature_columns = []
        self.target_column = None
        self.model_metadata = {}
        self.settings = get_settings()
        
        # Create model storage directory
        self.model_path = os.path.join(
            self.settings.MODEL_STORAGE_PATH,
            f"{model_name}_{model_type}.joblib"
        )
        self.metadata_path = os.path.join(
            self.settings.MODEL_STORAGE_PATH,
            f"{model_name}_{model_type}_metadata.json"
        )
        
        os.makedirs(self.settings.MODEL_STORAGE_PATH, exist_ok=True)
    
    @abstractmethod
    async def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for training/prediction"""
        pass
    
    @abstractmethod
    def create_model(self) -> Any:
        """Create the ML model instance"""
        pass
    
    @abstractmethod
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        pass
    
    async def load_training_data(self) -> pd.DataFrame:
        """Load training data from database - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement load_training_data")
    
    async def train(self, data: Optional[pd.DataFrame] = None, retrain: bool = False) -> Dict[str, Any]:
        """Train the ML model"""
        try:
            logger.info(f"Starting training for {self.model_name}")
            
            # Load data if not provided
            if data is None:
                data = await self.load_training_data()
            
            if len(data) < self.settings.MIN_TRAINING_DATA_SIZE:
                raise ValueError(f"Insufficient training data: {len(data)} < {self.settings.MIN_TRAINING_DATA_SIZE}")
            
            # Prepare features
            processed_data = await self.prepare_features(data)
            
            # Split features and target
            X = processed_data[self.feature_columns]
            y = processed_data[self.target_column]
            
            # Split into train/test sets
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y if self._is_classification() else None
            )
            
            # Create and train model
            if self.model is None or retrain:
                self.model = self.create_model()
            
            self.model.fit(X_train, y_train)
            
            # Evaluate model
            train_score = self.model.score(X_train, y_train)
            test_score = self.model.score(X_test, y_test)
            
            # Get predictions for detailed metrics
            y_pred = self.model.predict(X_test)
            
            # Calculate metrics
            metrics = self._calculate_metrics(y_test, y_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X, y, cv=5)
            
            # Update metadata
            self.model_metadata = {
                "model_name": self.model_name,
                "model_type": self.model_type,
                "trained_at": datetime.now().isoformat(),
                "training_data_size": len(data),
                "feature_count": len(self.feature_columns),
                "train_score": float(train_score),
                "test_score": float(test_score),
                "cv_mean_score": float(cv_scores.mean()),
                "cv_std_score": float(cv_scores.std()),
                "metrics": metrics,
                "feature_columns": self.feature_columns,
                "target_column": self.target_column
            }
            
            # Check if model meets minimum performance requirements
            if not self._meets_performance_requirements(metrics):
                logger.warning(f"Model {self.model_name} does not meet minimum performance requirements")
            
            self.is_trained = True
            
            # Save model and metadata
            await self.save_model()
            
            logger.info(f"Training completed for {self.model_name}. Test score: {test_score:.4f}")
            
            return self.model_metadata
            
        except Exception as e:
            logger.error(f"Training failed for {self.model_name}: {e}")
            raise
    
    async def predict(self, data: pd.DataFrame) -> np.ndarray:
        """Make predictions using the trained model"""
        if not self.is_trained:
            await self.load_model()
        
        if not self.is_trained:
            raise ValueError(f"Model {self.model_name} is not trained")
        
        # Prepare features
        processed_data = await self.prepare_features(data)
        X = processed_data[self.feature_columns]
        
        return self.model.predict(X)
    
    async def predict_proba(self, data: pd.DataFrame) -> np.ndarray:
        """Get prediction probabilities (for classification models)"""
        if not self.is_trained:
            await self.load_model()
        
        if not self.is_trained:
            raise ValueError(f"Model {self.model_name} is not trained")
        
        if not hasattr(self.model, 'predict_proba'):
            raise ValueError(f"Model {self.model_name} does not support probability predictions")
        
        # Prepare features
        processed_data = await self.prepare_features(data)
        X = processed_data[self.feature_columns]
        
        return self.model.predict_proba(X)
    
    async def save_model(self):
        """Save the trained model and metadata to disk"""
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        try:
            # Save model
            joblib.dump(self.model, self.model_path)
            
            # Save metadata
            with open(self.metadata_path, 'w') as f:
                json.dump(self.model_metadata, f, indent=2)
            
            logger.info(f"Model {self.model_name} saved successfully")
            
        except Exception as e:
            logger.error(f"Failed to save model {self.model_name}: {e}")
            raise
    
    async def load_model(self) -> bool:
        """Load the trained model and metadata from disk"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.metadata_path):
                # Load model
                self.model = joblib.load(self.model_path)
                
                # Load metadata
                with open(self.metadata_path, 'r') as f:
                    self.model_metadata = json.load(f)
                
                # Restore model attributes
                self.feature_columns = self.model_metadata.get('feature_columns', [])
                self.target_column = self.model_metadata.get('target_column')
                self.is_trained = True
                
                logger.info(f"Model {self.model_name} loaded successfully")
                return True
            else:
                logger.info(f"No saved model found for {self.model_name}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to load model {self.model_name}: {e}")
            return False
    
    def _is_classification(self) -> bool:
        """Check if this is a classification model"""
        return hasattr(self.model, 'predict_proba') if self.model else False
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate performance metrics"""
        metrics = {}
        
        if self._is_classification():
            # Classification metrics
            metrics['accuracy'] = float(accuracy_score(y_true, y_pred))
            metrics['precision'] = float(precision_score(y_true, y_pred, average='weighted'))
            metrics['recall'] = float(recall_score(y_true, y_pred, average='weighted'))
            metrics['f1_score'] = float(f1_score(y_true, y_pred, average='weighted'))
        else:
            # Regression metrics
            from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
            metrics['mse'] = float(mean_squared_error(y_true, y_pred))
            metrics['mae'] = float(mean_absolute_error(y_true, y_pred))
            metrics['r2_score'] = float(r2_score(y_true, y_pred))
            metrics['rmse'] = float(np.sqrt(metrics['mse']))
        
        return metrics
    
    def _meets_performance_requirements(self, metrics: Dict[str, float]) -> bool:
        """Check if model meets minimum performance requirements"""
        if self._is_classification():
            return (
                metrics.get('accuracy', 0) >= self.settings.MIN_MODEL_ACCURACY and
                metrics.get('precision', 0) >= self.settings.MIN_MODEL_PRECISION and
                metrics.get('recall', 0) >= self.settings.MIN_MODEL_RECALL
            )
        else:
            # For regression, check R² score
            return metrics.get('r2_score', 0) >= 0.5  # Minimum R² threshold
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and metadata"""
        return {
            "model_name": self.model_name,
            "model_type": self.model_type,
            "is_trained": self.is_trained,
            "metadata": self.model_metadata,
            "feature_importance": self.get_feature_importance() if self.is_trained else None
        }
