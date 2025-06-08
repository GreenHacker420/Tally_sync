"""
Training Service for FinSync360 ML Service
Handles model training, retraining, and scheduling
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from models.payment_prediction import PaymentDelayPredictor, PaymentAmountPredictor
from config.settings import get_settings
from config.database import get_collection

logger = logging.getLogger(__name__)

class TrainingService:
    """Service for handling ML model training and scheduling"""
    
    def __init__(self):
        self.settings = get_settings()
        self.scheduler = AsyncIOScheduler()
        self.training_in_progress = {}
        
        # Initialize models
        self.payment_delay_model = PaymentDelayPredictor()
        self.payment_amount_model = PaymentAmountPredictor()
        
        # Training history
        self.training_history = []
    
    async def start_scheduler(self):
        """Start the training scheduler"""
        try:
            # Schedule periodic retraining
            self.scheduler.add_job(
                self._scheduled_training,
                trigger=IntervalTrigger(hours=self.settings.MODEL_RETRAIN_INTERVAL_HOURS),
                id='periodic_training',
                name='Periodic Model Training',
                max_instances=1,
                coalesce=True
            )
            
            # Schedule daily model performance check
            self.scheduler.add_job(
                self._check_model_performance,
                trigger=IntervalTrigger(hours=24),
                id='performance_check',
                name='Model Performance Check',
                max_instances=1,
                coalesce=True
            )
            
            self.scheduler.start()
            logger.info("Training scheduler started")
            
        except Exception as e:
            logger.error(f"Failed to start training scheduler: {e}")
            raise
    
    async def stop_scheduler(self):
        """Stop the training scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=True)
            logger.info("Training scheduler stopped")
    
    async def train_all_models(self, force_retrain: bool = False) -> Dict[str, Any]:
        """Train all ML models"""
        results = {}
        
        try:
            logger.info("Starting training for all models")
            
            # Train payment delay model
            results['payment_delay'] = await self._train_model(
                self.payment_delay_model,
                'payment_delay',
                force_retrain
            )
            
            # Train payment amount model
            results['payment_amount'] = await self._train_model(
                self.payment_amount_model,
                'payment_amount',
                force_retrain
            )
            
            # Record training session
            training_session = {
                'timestamp': datetime.now(),
                'results': results,
                'type': 'manual' if force_retrain else 'scheduled'
            }
            self.training_history.append(training_session)
            
            # Keep only last 50 training sessions
            if len(self.training_history) > 50:
                self.training_history = self.training_history[-50:]
            
            logger.info("All models training completed")
            return results
            
        except Exception as e:
            logger.error(f"Training all models failed: {e}")
            raise
    
    async def train_specific_model(self, model_type: str, force_retrain: bool = False) -> Dict[str, Any]:
        """Train a specific model"""
        try:
            if model_type == 'payment_delay':
                return await self._train_model(
                    self.payment_delay_model,
                    'payment_delay',
                    force_retrain
                )
            elif model_type == 'payment_amount':
                return await self._train_model(
                    self.payment_amount_model,
                    'payment_amount',
                    force_retrain
                )
            else:
                raise ValueError(f"Unknown model type: {model_type}")
                
        except Exception as e:
            logger.error(f"Training model {model_type} failed: {e}")
            raise
    
    async def _train_model(self, model, model_type: str, force_retrain: bool = False) -> Dict[str, Any]:
        """Train a single model with error handling and logging"""
        if model_type in self.training_in_progress:
            return {
                'status': 'skipped',
                'reason': 'Training already in progress'
            }
        
        try:
            self.training_in_progress[model_type] = True
            logger.info(f"Starting training for {model_type} model")
            
            # Check if model needs training
            if not force_retrain and model.is_trained:
                # Check if model is recent enough
                last_trained = model.model_metadata.get('trained_at')
                if last_trained:
                    last_trained_date = datetime.fromisoformat(last_trained.replace('Z', '+00:00'))
                    if datetime.now() - last_trained_date < timedelta(hours=self.settings.MODEL_RETRAIN_INTERVAL_HOURS):
                        return {
                            'status': 'skipped',
                            'reason': 'Model is recent enough'
                        }
            
            # Check data availability
            data_check = await self._check_training_data_availability(model_type)
            if not data_check['sufficient']:
                return {
                    'status': 'failed',
                    'reason': f"Insufficient training data: {data_check['count']} < {self.settings.MIN_TRAINING_DATA_SIZE}"
                }
            
            # Train the model
            start_time = datetime.now()
            training_result = await model.train(retrain=force_retrain)
            end_time = datetime.now()
            
            training_duration = (end_time - start_time).total_seconds()
            
            # Save training metadata to database
            await self._save_training_metadata(model_type, training_result, training_duration)
            
            logger.info(f"Training completed for {model_type} model in {training_duration:.2f} seconds")
            
            return {
                'status': 'success',
                'training_duration_seconds': training_duration,
                'metrics': training_result.get('metrics', {}),
                'data_size': training_result.get('training_data_size', 0)
            }
            
        except Exception as e:
            logger.error(f"Training failed for {model_type}: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }
        finally:
            self.training_in_progress.pop(model_type, None)
    
    async def _scheduled_training(self):
        """Scheduled training job"""
        try:
            logger.info("Starting scheduled model training")
            results = await self.train_all_models(force_retrain=False)
            
            # Log results
            successful_models = [k for k, v in results.items() if v.get('status') == 'success']
            failed_models = [k for k, v in results.items() if v.get('status') == 'failed']
            
            if successful_models:
                logger.info(f"Scheduled training successful for models: {successful_models}")
            if failed_models:
                logger.warning(f"Scheduled training failed for models: {failed_models}")
                
        except Exception as e:
            logger.error(f"Scheduled training failed: {e}")
    
    async def _check_model_performance(self):
        """Check model performance and trigger retraining if needed"""
        try:
            logger.info("Checking model performance")
            
            models_to_retrain = []
            
            # Check payment delay model
            if self.payment_delay_model.is_trained:
                metrics = self.payment_delay_model.model_metadata.get('metrics', {})
                if not self._meets_performance_threshold(metrics, 'classification'):
                    models_to_retrain.append('payment_delay')
            
            # Check payment amount model
            if self.payment_amount_model.is_trained:
                metrics = self.payment_amount_model.model_metadata.get('metrics', {})
                if not self._meets_performance_threshold(metrics, 'regression'):
                    models_to_retrain.append('payment_amount')
            
            # Retrain underperforming models
            if models_to_retrain:
                logger.info(f"Retraining underperforming models: {models_to_retrain}")
                for model_type in models_to_retrain:
                    await self.train_specific_model(model_type, force_retrain=True)
            else:
                logger.info("All models meet performance thresholds")
                
        except Exception as e:
            logger.error(f"Model performance check failed: {e}")
    
    async def _check_training_data_availability(self, model_type: str) -> Dict[str, Any]:
        """Check if sufficient training data is available"""
        try:
            if model_type == 'payment_delay':
                collection = await get_collection("payments")
                count = await collection.count_documents({
                    "status": {"$in": ["paid", "overdue", "partial"]},
                    "dueDate": {"$exists": True}
                })
            elif model_type == 'payment_amount':
                collection = await get_collection("payments")
                count = await collection.count_documents({
                    "status": "paid",
                    "amount": {"$exists": True, "$gt": 0}
                })
            else:
                return {'sufficient': False, 'count': 0}
            
            return {
                'sufficient': count >= self.settings.MIN_TRAINING_DATA_SIZE,
                'count': count
            }
            
        except Exception as e:
            logger.error(f"Error checking training data availability: {e}")
            return {'sufficient': False, 'count': 0}
    
    async def _save_training_metadata(self, model_type: str, training_result: Dict[str, Any], duration: float):
        """Save training metadata to database"""
        try:
            ml_models_collection = await get_collection("ml_models")
            
            metadata = {
                'model_type': model_type,
                'version': training_result.get('trained_at', datetime.now().isoformat()),
                'training_duration_seconds': duration,
                'metrics': training_result.get('metrics', {}),
                'training_data_size': training_result.get('training_data_size', 0),
                'feature_count': training_result.get('feature_count', 0),
                'created_at': datetime.now(),
                'status': 'active'
            }
            
            # Insert new record
            await ml_models_collection.insert_one(metadata)
            
            # Mark previous versions as inactive
            await ml_models_collection.update_many(
                {
                    'model_type': model_type,
                    'version': {'$ne': metadata['version']},
                    'status': 'active'
                },
                {'$set': {'status': 'inactive'}}
            )
            
            logger.info(f"Training metadata saved for {model_type}")
            
        except Exception as e:
            logger.error(f"Failed to save training metadata: {e}")
    
    def _meets_performance_threshold(self, metrics: Dict[str, float], model_category: str) -> bool:
        """Check if model meets minimum performance thresholds"""
        if model_category == 'classification':
            return (
                metrics.get('accuracy', 0) >= self.settings.MIN_MODEL_ACCURACY and
                metrics.get('precision', 0) >= self.settings.MIN_MODEL_PRECISION and
                metrics.get('recall', 0) >= self.settings.MIN_MODEL_RECALL
            )
        elif model_category == 'regression':
            return metrics.get('r2_score', 0) >= 0.5  # Minimum R² threshold
        
        return False
    
    def get_training_status(self) -> Dict[str, Any]:
        """Get current training status"""
        return {
            'scheduler_running': self.scheduler.running if self.scheduler else False,
            'training_in_progress': dict(self.training_in_progress),
            'last_training_sessions': self.training_history[-5:] if self.training_history else [],
            'next_scheduled_training': self._get_next_scheduled_time()
        }
    
    def _get_next_scheduled_time(self) -> Optional[str]:
        """Get next scheduled training time"""
        try:
            if self.scheduler and self.scheduler.running:
                job = self.scheduler.get_job('periodic_training')
                if job and job.next_run_time:
                    return job.next_run_time.isoformat()
        except Exception:
            pass
        return None
    
    async def get_training_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get training history from database"""
        try:
            ml_models_collection = await get_collection("ml_models")
            cursor = ml_models_collection.find(
                {},
                sort=[("created_at", -1)],
                limit=limit
            )
            
            history = await cursor.to_list(length=None)
            
            # Convert ObjectId to string for JSON serialization
            for record in history:
                record['_id'] = str(record['_id'])
                if 'created_at' in record:
                    record['created_at'] = record['created_at'].isoformat()
            
            return history
            
        except Exception as e:
            logger.error(f"Failed to get training history: {e}")
            return []
