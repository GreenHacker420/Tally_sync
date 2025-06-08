"""
Database configuration and connection management for ML Service
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging
from typing import Optional
from .settings import get_settings

logger = logging.getLogger(__name__)

# Global database client and database instances
_client: Optional[AsyncIOMotorClient] = None
_database = None

async def get_database():
    """Get database instance, creating connection if needed"""
    global _client, _database
    
    if _database is None:
        settings = get_settings()
        
        try:
            # Create MongoDB client
            _client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,         # 10 second connection timeout
                socketTimeoutMS=20000,          # 20 second socket timeout
                maxPoolSize=10,                 # Maximum connection pool size
                minPoolSize=1,                  # Minimum connection pool size
            )
            
            # Test the connection
            await _client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            
            # Get database
            _database = _client[settings.DATABASE_NAME]
            
            # Create indexes for better performance
            await create_indexes()
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise
    
    return _database

async def close_database_connection():
    """Close database connection"""
    global _client, _database
    
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("Database connection closed")

async def create_indexes():
    """Create database indexes for optimal performance"""
    if not _database:
        return
    
    try:
        # Indexes for vouchers collection (for payment predictions)
        await _database.vouchers.create_index([
            ("voucherType", 1),
            ("date", -1)
        ])
        await _database.vouchers.create_index([
            ("partyName", 1),
            ("date", -1)
        ])
        await _database.vouchers.create_index([
            ("dueDate", 1),
            ("isPaid", 1)
        ])
        
        # Indexes for inventory collection (for demand forecasting)
        await _database.inventory.create_index([
            ("itemName", 1),
            ("lastUpdated", -1)
        ])
        await _database.inventory.create_index([
            ("category", 1),
            ("stockLevel", 1)
        ])
        
        # Indexes for customers collection (for risk assessment)
        await _database.customers.create_index([
            ("customerName", 1)
        ])
        await _database.customers.create_index([
            ("creditLimit", 1),
            ("outstandingAmount", 1)
        ])
        
        # Indexes for payments collection
        await _database.payments.create_index([
            ("customerId", 1),
            ("paymentDate", -1)
        ])
        await _database.payments.create_index([
            ("status", 1),
            ("dueDate", 1)
        ])
        
        # Indexes for sales transactions (for business intelligence)
        await _database.sales.create_index([
            ("date", -1),
            ("amount", 1)
        ])
        await _database.sales.create_index([
            ("customerId", 1),
            ("date", -1)
        ])
        
        # Indexes for ML model metadata
        await _database.ml_models.create_index([
            ("model_type", 1),
            ("version", -1)
        ])
        await _database.ml_models.create_index([
            ("created_at", -1)
        ])
        
        # Indexes for prediction cache
        await _database.prediction_cache.create_index([
            ("cache_key", 1)
        ])
        await _database.prediction_cache.create_index([
            ("expires_at", 1)
        ], expireAfterSeconds=0)  # TTL index
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating database indexes: {e}")
        # Don't raise here as indexes are not critical for basic functionality

async def get_collection(collection_name: str):
    """Get a specific collection from the database"""
    db = await get_database()
    return db[collection_name]

# Database health check
async def check_database_health() -> dict:
    """Check database connection health"""
    try:
        if not _client:
            return {"status": "disconnected", "error": "No database connection"}
        
        # Ping the database
        await _client.admin.command('ping')
        
        # Get database stats
        db = await get_database()
        stats = await db.command("dbStats")
        
        return {
            "status": "healthy",
            "database": stats.get("db"),
            "collections": stats.get("collections", 0),
            "dataSize": stats.get("dataSize", 0),
            "indexSize": stats.get("indexSize", 0)
        }
        
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Utility functions for common database operations
async def aggregate_pipeline(collection_name: str, pipeline: list):
    """Execute aggregation pipeline on a collection"""
    collection = await get_collection(collection_name)
    cursor = collection.aggregate(pipeline)
    return await cursor.to_list(length=None)

async def find_documents(collection_name: str, filter_dict: dict, limit: int = None, sort: list = None):
    """Find documents in a collection with optional limit and sort"""
    collection = await get_collection(collection_name)
    cursor = collection.find(filter_dict)
    
    if sort:
        cursor = cursor.sort(sort)
    
    if limit:
        cursor = cursor.limit(limit)
    
    return await cursor.to_list(length=None)

async def count_documents(collection_name: str, filter_dict: dict = None):
    """Count documents in a collection"""
    collection = await get_collection(collection_name)
    if filter_dict:
        return await collection.count_documents(filter_dict)
    else:
        return await collection.estimated_document_count()
