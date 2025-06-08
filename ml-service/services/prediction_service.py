"""
Prediction Service for FinSync360 ML Service
Orchestrates ML model predictions and provides business intelligence
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging
import asyncio

from models.payment_prediction import PaymentDelayPredictor, PaymentAmountPredictor
from config.database import get_collection
from config.settings import get_settings

logger = logging.getLogger(__name__)

class PredictionService:
    """Service for handling ML predictions and business intelligence"""
    
    def __init__(self):
        self.settings = get_settings()
        self.payment_delay_model = PaymentDelayPredictor()
        self.payment_amount_model = PaymentAmountPredictor()
        self.models_loaded = False
    
    async def load_models(self):
        """Load all ML models"""
        try:
            logger.info("Loading ML models...")
            
            # Load payment prediction models
            delay_loaded = await self.payment_delay_model.load_model()
            amount_loaded = await self.payment_amount_model.load_model()
            
            if not delay_loaded:
                logger.info("Payment delay model not found, will train on first use")
            
            if not amount_loaded:
                logger.info("Payment amount model not found, will train on first use")
            
            self.models_loaded = True
            logger.info("ML models loading completed")
            
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}")
            raise
    
    async def predict_payment_delay(
        self,
        customer_id: str,
        amount: Optional[float] = None,
        due_date: Optional[datetime] = None,
        days_ahead: int = 30
    ) -> Dict[str, Any]:
        """Predict payment delay for a specific customer/payment"""
        try:
            # Ensure model is trained
            if not self.payment_delay_model.is_trained:
                await self._ensure_model_trained(self.payment_delay_model)
            
            # Get customer data
            customer_data = await self._get_customer_data(customer_id)
            if not customer_data:
                raise ValueError(f"Customer {customer_id} not found")
            
            # Prepare prediction data
            prediction_data = pd.DataFrame([{
                'customerId': customer_id,
                'amount': amount or customer_data.get('averageOrderValue', 1000),
                'dueDate': due_date or (datetime.now() + timedelta(days=days_ahead)),
                'creditLimit': customer_data.get('creditLimit', 0),
                'outstandingAmount': customer_data.get('outstandingAmount', 0),
                'customerCategory': customer_data.get('category', 'Regular'),
                'paymentMethod': customer_data.get('preferredPaymentMethod', 'Bank Transfer')
            }])
            
            # Get prediction
            delay_prob = await self.payment_delay_model.predict_proba(prediction_data)
            delay_prediction = await self.payment_delay_model.predict(prediction_data)
            
            # Calculate risk level
            delay_probability = float(delay_prob[0][1])  # Probability of delay
            risk_level = self._calculate_risk_level(delay_probability)
            
            # Get feature importance for explanation
            feature_importance = self.payment_delay_model.get_feature_importance()
            top_factors = dict(list(feature_importance.items())[:5])
            
            return {
                'customer_id': customer_id,
                'delay_probability': delay_probability,
                'predicted_delay_days': int(delay_prediction[0]) if delay_prediction[0] > 0 else 0,
                'risk_level': risk_level,
                'confidence_score': max(delay_probability, 1 - delay_probability),
                'factors': top_factors
            }
            
        except Exception as e:
            logger.error(f"Payment delay prediction failed for customer {customer_id}: {e}")
            raise
    
    async def predict_payment_delay_bulk(
        self,
        customer_ids: List[str],
        days_ahead: int = 30
    ) -> Dict[str, Any]:
        """Predict payment delays for multiple customers"""
        try:
            predictions = []
            high_risk_count = 0
            medium_risk_count = 0
            low_risk_count = 0
            
            for customer_id in customer_ids:
                try:
                    prediction = await self.predict_payment_delay(
                        customer_id=customer_id,
                        days_ahead=days_ahead
                    )
                    predictions.append(prediction)
                    
                    # Count risk levels
                    if prediction['risk_level'] == 'High':
                        high_risk_count += 1
                    elif prediction['risk_level'] == 'Medium':
                        medium_risk_count += 1
                    else:
                        low_risk_count += 1
                        
                except Exception as e:
                    logger.warning(f"Failed to predict for customer {customer_id}: {e}")
                    continue
            
            summary = {
                'total_customers': len(customer_ids),
                'successful_predictions': len(predictions),
                'high_risk_customers': high_risk_count,
                'medium_risk_customers': medium_risk_count,
                'low_risk_customers': low_risk_count,
                'average_delay_probability': np.mean([p['delay_probability'] for p in predictions]) if predictions else 0
            }
            
            return {
                'predictions': predictions,
                'summary': summary
            }
            
        except Exception as e:
            logger.error(f"Bulk payment delay prediction failed: {e}")
            raise
    
    async def forecast_inventory_demand(
        self,
        item_ids: List[str],
        days_ahead: int = 90,
        include_seasonality: bool = True
    ) -> List[Dict[str, Any]]:
        """Forecast inventory demand for items"""
        try:
            results = []
            
            for item_id in item_ids:
                # Get item data
                item_data = await self._get_item_data(item_id)
                if not item_data:
                    logger.warning(f"Item {item_id} not found")
                    continue
                
                # Get historical sales data
                sales_data = await self._get_item_sales_history(item_id)
                
                # Simple demand forecasting (placeholder for more sophisticated models)
                current_stock = item_data.get('stockLevel', 0)
                avg_daily_demand = self._calculate_average_daily_demand(sales_data)
                
                # Generate forecast
                forecast_data = []
                for day in range(1, days_ahead + 1):
                    forecast_date = datetime.now() + timedelta(days=day)
                    
                    # Simple linear forecast with seasonal adjustment
                    base_demand = avg_daily_demand
                    if include_seasonality:
                        seasonal_factor = self._get_seasonal_factor(forecast_date, sales_data)
                        base_demand *= seasonal_factor
                    
                    forecast_data.append({
                        'date': forecast_date.isoformat(),
                        'predicted_demand': max(0, int(base_demand)),
                        'confidence': 0.75  # Placeholder confidence score
                    })
                
                # Calculate reorder recommendation
                total_predicted_demand = sum(f['predicted_demand'] for f in forecast_data)
                reorder_point = max(0, total_predicted_demand - current_stock)
                
                results.append({
                    'item_id': item_id,
                    'item_name': item_data.get('itemName', 'Unknown'),
                    'current_stock': current_stock,
                    'predicted_demand': forecast_data,
                    'reorder_recommendation': {
                        'should_reorder': reorder_point > 0,
                        'recommended_quantity': reorder_point,
                        'reorder_date': (datetime.now() + timedelta(days=7)).isoformat(),
                        'reason': f"Predicted demand ({total_predicted_demand}) exceeds current stock ({current_stock})"
                    },
                    'confidence_score': 0.75
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Inventory demand forecasting failed: {e}")
            raise
    
    async def assess_customer_risk(
        self,
        customer_id: str,
        assessment_type: str = "credit"
    ) -> Dict[str, Any]:
        """Assess customer risk (credit, payment, overall)"""
        try:
            # Get customer data
            customer_data = await self._get_customer_data(customer_id)
            if not customer_data:
                raise ValueError(f"Customer {customer_id} not found")
            
            # Get payment history
            payment_history = await self._get_customer_payment_history(customer_id)
            
            # Calculate risk factors
            risk_factors = []
            risk_score = 0.0
            
            # Credit utilization risk
            credit_limit = customer_data.get('creditLimit', 0)
            outstanding = customer_data.get('outstandingAmount', 0)
            if credit_limit > 0:
                utilization = outstanding / credit_limit
                if utilization > 0.8:
                    risk_factors.append({
                        'factor': 'High Credit Utilization',
                        'value': f"{utilization:.1%}",
                        'impact': 'High'
                    })
                    risk_score += 0.3
            
            # Payment history risk
            if payment_history:
                late_payments = sum(1 for p in payment_history if p.get('isLate', False))
                late_payment_ratio = late_payments / len(payment_history)
                if late_payment_ratio > 0.2:
                    risk_factors.append({
                        'factor': 'Frequent Late Payments',
                        'value': f"{late_payment_ratio:.1%}",
                        'impact': 'High'
                    })
                    risk_score += 0.4
            
            # Outstanding amount risk
            if outstanding > credit_limit * 0.5:
                risk_factors.append({
                    'factor': 'High Outstanding Amount',
                    'value': f"₹{outstanding:,.2f}",
                    'impact': 'Medium'
                })
                risk_score += 0.2
            
            # Determine risk level
            if risk_score >= 0.7:
                risk_level = "High"
            elif risk_score >= 0.4:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            # Generate recommendations
            recommendations = self._generate_risk_recommendations(risk_level, risk_factors)
            
            return {
                'customer_id': customer_id,
                'risk_score': min(risk_score, 1.0),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'recommendations': recommendations,
                'assessment_date': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Risk assessment failed for customer {customer_id}: {e}")
            raise
    
    async def get_models_status(self) -> Dict[str, Any]:
        """Get status of all ML models"""
        return {
            'payment_delay_predictor': {
                'loaded': self.payment_delay_model.is_trained,
                'last_trained': self.payment_delay_model.model_metadata.get('trained_at'),
                'performance': self.payment_delay_model.model_metadata.get('metrics', {})
            },
            'payment_amount_predictor': {
                'loaded': self.payment_amount_model.is_trained,
                'last_trained': self.payment_amount_model.model_metadata.get('trained_at'),
                'performance': self.payment_amount_model.model_metadata.get('metrics', {})
            }
        }
    
    async def retrain_models(self, model_types: Optional[List[str]] = None) -> Dict[str, Any]:
        """Trigger model retraining"""
        results = {}
        
        if not model_types or 'payment_delay' in model_types:
            try:
                result = await self.payment_delay_model.train(retrain=True)
                results['payment_delay'] = {'status': 'success', 'metrics': result}
            except Exception as e:
                results['payment_delay'] = {'status': 'failed', 'error': str(e)}
        
        if not model_types or 'payment_amount' in model_types:
            try:
                result = await self.payment_amount_model.train(retrain=True)
                results['payment_amount'] = {'status': 'success', 'metrics': result}
            except Exception as e:
                results['payment_amount'] = {'status': 'failed', 'error': str(e)}
        
        return results
    
    # Helper methods
    async def _ensure_model_trained(self, model):
        """Ensure a model is trained, train if necessary"""
        if not model.is_trained:
            logger.info(f"Training {model.model_name} model...")
            await model.train()
    
    async def _get_customer_data(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get customer data from database"""
        try:
            customers_collection = await get_collection("customers")
            customer = await customers_collection.find_one({"_id": customer_id})
            return customer
        except Exception as e:
            logger.error(f"Failed to get customer data for {customer_id}: {e}")
            return None
    
    async def _get_item_data(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get item data from database"""
        try:
            inventory_collection = await get_collection("inventory")
            item = await inventory_collection.find_one({"_id": item_id})
            return item
        except Exception as e:
            logger.error(f"Failed to get item data for {item_id}: {e}")
            return None
    
    async def _get_item_sales_history(self, item_id: str) -> List[Dict[str, Any]]:
        """Get sales history for an item"""
        try:
            sales_collection = await get_collection("sales")
            cursor = sales_collection.find(
                {"itemId": item_id},
                sort=[("date", -1)],
                limit=365  # Last year of data
            )
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Failed to get sales history for item {item_id}: {e}")
            return []
    
    async def _get_customer_payment_history(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get payment history for a customer"""
        try:
            payments_collection = await get_collection("payments")
            cursor = payments_collection.find(
                {"customerId": customer_id},
                sort=[("paymentDate", -1)],
                limit=50  # Last 50 payments
            )
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Failed to get payment history for customer {customer_id}: {e}")
            return []
    
    def _calculate_risk_level(self, probability: float) -> str:
        """Calculate risk level based on probability"""
        if probability >= 0.7:
            return "High"
        elif probability >= 0.4:
            return "Medium"
        else:
            return "Low"
    
    def _calculate_average_daily_demand(self, sales_data: List[Dict[str, Any]]) -> float:
        """Calculate average daily demand from sales data"""
        if not sales_data:
            return 1.0  # Default demand
        
        total_quantity = sum(sale.get('quantity', 0) for sale in sales_data)
        days = len(set(sale.get('date', datetime.now()).date() for sale in sales_data))
        
        return total_quantity / max(days, 1)
    
    def _get_seasonal_factor(self, date: datetime, sales_data: List[Dict[str, Any]]) -> float:
        """Get seasonal adjustment factor"""
        # Simple seasonal factor based on month (placeholder)
        month = date.month
        seasonal_factors = {
            1: 0.8, 2: 0.9, 3: 1.1, 4: 1.0, 5: 1.0, 6: 1.0,
            7: 1.2, 8: 1.1, 9: 1.0, 10: 1.1, 11: 1.3, 12: 1.4
        }
        return seasonal_factors.get(month, 1.0)
    
    def _generate_risk_recommendations(self, risk_level: str, risk_factors: List[Dict[str, Any]]) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []
        
        if risk_level == "High":
            recommendations.extend([
                "Consider reducing credit limit or requiring advance payment",
                "Implement more frequent payment reminders",
                "Review customer's financial stability and payment capacity"
            ])
        elif risk_level == "Medium":
            recommendations.extend([
                "Monitor payment behavior closely",
                "Consider offering payment plan options",
                "Send proactive payment reminders"
            ])
        else:
            recommendations.append("Continue regular monitoring")
        
        # Add specific recommendations based on risk factors
        for factor in risk_factors:
            if "Credit Utilization" in factor['factor']:
                recommendations.append("Consider discussing credit limit adjustment")
            elif "Late Payments" in factor['factor']:
                recommendations.append("Implement automated payment reminders")
        
        return recommendations
