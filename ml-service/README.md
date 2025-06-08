# FinSync360 ML Service

AI/ML Predictive Analytics Microservice for the FinSync360 ERP System. This service provides machine learning capabilities including payment prediction, customer risk assessment, inventory forecasting, and business intelligence analytics.

## 🚀 Features

### Core ML Capabilities
- **Payment Delay Prediction** - Predict which payments are likely to be delayed
- **Payment Amount Forecasting** - Forecast payment amounts based on customer behavior
- **Customer Risk Assessment** - Assess credit and payment risk for customers
- **Inventory Demand Forecasting** - Predict inventory demand and optimize stock levels
- **Business Intelligence Analytics** - Comprehensive business metrics and insights

### Technical Features
- **FastAPI Framework** - High-performance async API with automatic documentation
- **Scikit-learn Models** - Production-ready machine learning models
- **Automated Training** - Scheduled model retraining and performance monitoring
- **MongoDB Integration** - Seamless integration with FinSync360 database
- **Redis Caching** - High-performance caching for predictions
- **Docker Support** - Containerized deployment ready

## 📁 Project Structure

```
ml-service/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── config/
│   ├── settings.py        # Configuration management
│   └── database.py        # Database connections
├── models/
│   ├── base_model.py      # Base ML model class
│   ├── payment_prediction.py    # Payment prediction models
│   ├── risk_assessment.py       # Customer risk models
│   └── inventory_forecast.py    # Inventory forecasting
├── services/
│   ├── prediction_service.py    # ML prediction orchestration
│   ├── training_service.py      # Model training pipeline
│   └── analytics_service.py     # Business intelligence
├── api/
│   └── routes/
│       ├── predictions.py       # Prediction endpoints
│       ├── analytics.py         # Analytics endpoints
│       └── health.py            # Health check endpoints
└── tests/
    ├── test_models.py
    ├── test_services.py
    └── test_api.py
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+
- MongoDB 6.0+
- Redis (optional, for caching)
- FinSync360 Backend API running

### 1. Environment Setup

```bash
# Clone the repository and navigate to ml-service
cd ml-service

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Or using the npm script from root directory
npm run install:ml-service
```

### 3. Configure Environment Variables

Edit `.env` file with your settings:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=finsync360

# Security
SECRET_KEY=your-secret-key-here

# Backend API
BACKEND_API_URL=http://localhost:5000/api

# ML Configuration
MODEL_RETRAIN_INTERVAL_HOURS=24
MIN_TRAINING_DATA_SIZE=100
```

## 🚀 Running the Service

### Development Mode

```bash
# Start development server with auto-reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Or using npm script
npm run dev
```

### Production Mode

```bash
# Start production server
python -m uvicorn main:app --host 0.0.0.0 --port 8001

# Or using npm script
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t finsync360-ml-service .

# Run container
docker run -p 8001:8001 --env-file .env finsync360-ml-service
```

## 📚 API Documentation

Once the service is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Key Endpoints

#### Health & Status
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health with database status

#### Predictions
- `POST /api/v1/payment-delay` - Predict payment delay for customer
- `POST /api/v1/payment-delay/bulk` - Bulk payment delay predictions
- `POST /api/v1/inventory-forecast` - Forecast inventory demand
- `POST /api/v1/risk-assessment` - Assess customer risk

#### Analytics
- `GET /api/v1/business-metrics` - Comprehensive business metrics
- `GET /api/v1/customer-insights/{customer_id}` - Customer insights
- `GET /api/v1/inventory-analytics` - Inventory analytics
- `GET /api/v1/payment-trends` - Payment trends analysis

#### Model Management
- `GET /api/v1/models/status` - Get model status
- `POST /api/v1/models/retrain` - Trigger model retraining

## 🧪 Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=. --cov-report=html

# Or using npm scripts
npm test
npm run test:coverage
```

## 🔧 Model Training

### Initial Training

```bash
# Train all models initially
python -c "import asyncio; from services.training_service import TrainingService; asyncio.run(TrainingService().train_all_models(force_retrain=True))"

# Or using npm script
npm run train:models
```

### Automated Training

The service automatically retrains models based on the configured interval (`MODEL_RETRAIN_INTERVAL_HOURS`). You can also trigger manual retraining via the API.

## 📊 Business Intelligence Features

### Payment Analytics
- Payment delay probability prediction
- Customer payment behavior analysis
- Cash flow forecasting
- Payment trend analysis

### Customer Risk Assessment
- Credit risk scoring
- Payment history analysis
- Customer segmentation
- Risk-based recommendations

### Inventory Intelligence
- Demand forecasting
- Stock optimization
- Reorder point calculation
- Seasonal trend analysis

### Business Metrics
- Revenue forecasting
- Performance KPIs
- Customer lifetime value
- Profitability analysis

## 🔒 Security

- JWT token authentication
- CORS configuration
- Input validation and sanitization
- Rate limiting (configurable)
- Secure environment variable handling

## 🚀 Deployment

### Production Checklist

1. **Environment Configuration**
   - Set `DEBUG=false`
   - Configure production database URLs
   - Set secure `SECRET_KEY`
   - Configure proper CORS origins

2. **Performance Optimization**
   - Enable Redis caching
   - Configure appropriate worker processes
   - Set up load balancing if needed

3. **Monitoring**
   - Set up health check monitoring
   - Configure logging aggregation
   - Monitor model performance metrics

### Docker Compose Integration

The ML service integrates with the main FinSync360 docker-compose setup. See the root `docker-compose.yml` for full stack deployment.

## 🤝 Integration with FinSync360

The ML service integrates seamlessly with the FinSync360 ecosystem:

- **Backend API**: Fetches data from the main backend database
- **Frontend**: Provides ML insights to the web application
- **Desktop Agent**: Can trigger predictions for Tally sync data
- **Mobile Apps**: Provides risk assessments and forecasts

## 📈 Performance & Scaling

- **Async Processing**: FastAPI with async/await for high concurrency
- **Model Caching**: Redis caching for frequently requested predictions
- **Batch Processing**: Bulk prediction endpoints for efficiency
- **Horizontal Scaling**: Stateless design allows multiple instances

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MongoDB connection
   curl http://localhost:8001/api/v1/health/detailed
   ```

2. **Model Training Failures**
   ```bash
   # Check training data availability
   # Ensure minimum data requirements are met
   ```

3. **Performance Issues**
   ```bash
   # Enable Redis caching
   # Check model loading times
   # Monitor memory usage
   ```

## 📝 Contributing

1. Follow Python PEP 8 style guidelines
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass before submitting

## 📄 License

MIT License - see the LICENSE file for details.
