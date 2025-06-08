"""
Payment Prediction ML Model for FinSync360
Predicts payment delays and amounts using customer transaction history
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging

from .base_model import BaseMLModel
from config.database import get_collection
from config.settings import get_settings

logger = logging.getLogger(__name__)

class PaymentDelayPredictor(BaseMLModel):
    """Predicts whether a payment will be delayed"""
    
    def __init__(self):
        super().__init__("payment_delay", "classification")
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.target_column = "is_delayed"
        
    def create_model(self) -> RandomForestClassifier:
        """Create Random Forest classifier for payment delay prediction"""
        return RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        )
    
    async def load_training_data(self) -> pd.DataFrame:
        """Load payment and customer data for training"""
        try:
            # Load payment history
            payments_collection = await get_collection("payments")
            payments_cursor = payments_collection.find({
                "status": {"$in": ["paid", "overdue", "partial"]},
                "dueDate": {"$exists": True},
                "paymentDate": {"$exists": True}
            })
            payments = await payments_cursor.to_list(length=None)
            
            if not payments:
                raise ValueError("No payment data found for training")
            
            # Convert to DataFrame
            df = pd.DataFrame(payments)
            
            # Load customer data
            customers_collection = await get_collection("customers")
            customers_cursor = customers_collection.find({})
            customers = await customers_cursor.to_list(length=None)
            customers_df = pd.DataFrame(customers)
            
            # Load voucher data for additional features
            vouchers_collection = await get_collection("vouchers")
            vouchers_cursor = vouchers_collection.find({
                "voucherType": {"$in": ["Sales", "Purchase"]},
                "date": {"$gte": datetime.now() - timedelta(days=365)}
            })
            vouchers = await vouchers_cursor.to_list(length=None)
            vouchers_df = pd.DataFrame(vouchers)
            
            # Merge data
            if not customers_df.empty:
                df = df.merge(customers_df, left_on="customerId", right_on="_id", how="left", suffixes=("", "_customer"))
            
            logger.info(f"Loaded {len(df)} payment records for training")
            return df
            
        except Exception as e:
            logger.error(f"Error loading payment training data: {e}")
            raise
    
    async def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for payment delay prediction"""
        df = data.copy()
        
        # Convert date columns
        date_columns = ['dueDate', 'paymentDate', 'createdAt']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Calculate target variable (is_delayed)
        if 'paymentDate' in df.columns and 'dueDate' in df.columns:
            df['days_delayed'] = (df['paymentDate'] - df['dueDate']).dt.days
            df['is_delayed'] = (df['days_delayed'] > 0).astype(int)
        else:
            # For prediction, we don't have paymentDate
            df['is_delayed'] = 0  # Placeholder
        
        # Customer-based features
        if 'creditLimit' in df.columns:
            df['credit_limit'] = pd.to_numeric(df['creditLimit'], errors='coerce').fillna(0)
        else:
            df['credit_limit'] = 0
            
        if 'outstandingAmount' in df.columns:
            df['outstanding_amount'] = pd.to_numeric(df['outstandingAmount'], errors='coerce').fillna(0)
        else:
            df['outstanding_amount'] = 0
        
        # Calculate credit utilization
        df['credit_utilization'] = np.where(
            df['credit_limit'] > 0,
            df['outstanding_amount'] / df['credit_limit'],
            0
        )
        
        # Payment amount features
        if 'amount' in df.columns:
            df['payment_amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        else:
            df['payment_amount'] = 0
        
        # Time-based features
        if 'dueDate' in df.columns:
            df['due_day_of_week'] = df['dueDate'].dt.dayofweek
            df['due_day_of_month'] = df['dueDate'].dt.day
            df['due_month'] = df['dueDate'].dt.month
            df['due_quarter'] = df['dueDate'].dt.quarter
        
        # Days until due (for prediction)
        current_date = datetime.now()
        if 'dueDate' in df.columns:
            df['days_until_due'] = (df['dueDate'] - current_date).dt.days
        else:
            df['days_until_due'] = 0
        
        # Customer category encoding
        if 'customerCategory' in df.columns:
            if 'customerCategory' not in self.label_encoders:
                self.label_encoders['customerCategory'] = LabelEncoder()
                df['customer_category_encoded'] = self.label_encoders['customerCategory'].fit_transform(
                    df['customerCategory'].fillna('Unknown')
                )
            else:
                df['customer_category_encoded'] = self.label_encoders['customerCategory'].transform(
                    df['customerCategory'].fillna('Unknown')
                )
        else:
            df['customer_category_encoded'] = 0
        
        # Payment method encoding
        if 'paymentMethod' in df.columns:
            if 'paymentMethod' not in self.label_encoders:
                self.label_encoders['paymentMethod'] = LabelEncoder()
                df['payment_method_encoded'] = self.label_encoders['paymentMethod'].fit_transform(
                    df['paymentMethod'].fillna('Unknown')
                )
            else:
                df['payment_method_encoded'] = self.label_encoders['paymentMethod'].transform(
                    df['paymentMethod'].fillna('Unknown')
                )
        else:
            df['payment_method_encoded'] = 0
        
        # Historical payment behavior (if available)
        # This would require aggregating historical data per customer
        df['avg_delay_days'] = 0  # Placeholder - would calculate from historical data
        df['payment_frequency'] = 1  # Placeholder - would calculate from historical data
        df['total_payments'] = 1  # Placeholder - would calculate from historical data
        
        # Define feature columns
        self.feature_columns = [
            'payment_amount',
            'credit_limit',
            'outstanding_amount',
            'credit_utilization',
            'due_day_of_week',
            'due_day_of_month',
            'due_month',
            'due_quarter',
            'days_until_due',
            'customer_category_encoded',
            'payment_method_encoded',
            'avg_delay_days',
            'payment_frequency',
            'total_payments'
        ]
        
        # Fill missing values
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].fillna(0)
        
        # Scale numerical features
        numerical_features = [
            'payment_amount', 'credit_limit', 'outstanding_amount',
            'credit_utilization', 'days_until_due'
        ]
        
        if hasattr(self, 'scaler') and self.scaler is not None:
            df[numerical_features] = self.scaler.fit_transform(df[numerical_features])
        
        return df
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if not self.is_trained or not hasattr(self.model, 'feature_importances_'):
            return {}
        
        importance_dict = {}
        for feature, importance in zip(self.feature_columns, self.model.feature_importances_):
            importance_dict[feature] = float(importance)
        
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))


class PaymentAmountPredictor(BaseMLModel):
    """Predicts payment amounts based on customer behavior"""
    
    def __init__(self):
        super().__init__("payment_amount", "regression")
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.target_column = "payment_amount"
        
    def create_model(self) -> RandomForestRegressor:
        """Create Random Forest regressor for payment amount prediction"""
        return RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
    
    async def load_training_data(self) -> pd.DataFrame:
        """Load payment data for amount prediction training"""
        # Similar to PaymentDelayPredictor but focused on amount prediction
        try:
            payments_collection = await get_collection("payments")
            payments_cursor = payments_collection.find({
                "status": "paid",
                "amount": {"$exists": True, "$gt": 0}
            })
            payments = await payments_cursor.to_list(length=None)
            
            if not payments:
                raise ValueError("No payment amount data found for training")
            
            df = pd.DataFrame(payments)
            logger.info(f"Loaded {len(df)} payment records for amount prediction training")
            return df
            
        except Exception as e:
            logger.error(f"Error loading payment amount training data: {e}")
            raise
    
    async def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for payment amount prediction"""
        df = data.copy()
        
        # Similar feature engineering as PaymentDelayPredictor
        # but focused on predicting payment amounts
        
        # Convert amount to numeric
        if 'amount' in df.columns:
            df['payment_amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        
        # Add invoice/bill amount if available
        if 'invoiceAmount' in df.columns:
            df['invoice_amount'] = pd.to_numeric(df['invoiceAmount'], errors='coerce').fillna(0)
            df['payment_ratio'] = np.where(
                df['invoice_amount'] > 0,
                df['payment_amount'] / df['invoice_amount'],
                1.0
            )
        else:
            df['invoice_amount'] = df['payment_amount']
            df['payment_ratio'] = 1.0
        
        # Time-based features
        if 'paymentDate' in df.columns:
            df['paymentDate'] = pd.to_datetime(df['paymentDate'], errors='coerce')
            df['payment_day_of_week'] = df['paymentDate'].dt.dayofweek
            df['payment_month'] = df['paymentDate'].dt.month
        
        # Customer features (similar to delay predictor)
        df['credit_limit'] = pd.to_numeric(df.get('creditLimit', 0), errors='coerce').fillna(0)
        df['outstanding_amount'] = pd.to_numeric(df.get('outstandingAmount', 0), errors='coerce').fillna(0)
        
        # Define feature columns
        self.feature_columns = [
            'invoice_amount',
            'credit_limit',
            'outstanding_amount',
            'payment_day_of_week',
            'payment_month',
            'payment_ratio'
        ]
        
        # Fill missing values
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
            df[col] = df[col].fillna(0)
        
        return df
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if not self.is_trained or not hasattr(self.model, 'feature_importances_'):
            return {}
        
        importance_dict = {}
        for feature, importance in zip(self.feature_columns, self.model.feature_importances_):
            importance_dict[feature] = float(importance)
        
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
