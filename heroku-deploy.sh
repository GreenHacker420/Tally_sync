#!/bin/zsh

# Heroku Deployment Script for FinSync360
# This script automates the deployment of backend, frontend, and ML service to Heroku

set -e  # Exit on any error


echo "🚀 Starting Heroku deployment for FinSync360..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI is not installed. Please install it first."
    echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    print_error "You are not logged in to Heroku. Please run 'heroku login' first."
    exit 1
fi

print_success "Heroku CLI is installed and you are logged in."

# Get app names from user
echo -n "Enter your backend app name (e.g., your-app-backend): "
read BACKEND_APP
echo -n "Enter your frontend app name (e.g., your-app-frontend): "
read FRONTEND_APP
echo -n "Enter your ML service app name (e.g., your-app-ml): "
read ML_APP

# Validate app names
if [[ -z "$BACKEND_APP" || -z "$FRONTEND_APP" || -z "$ML_APP" ]]; then
    print_error "All app names are required."
    exit 1
fi

print_status "App names configured:"
echo "  Backend: $BACKEND_APP"
echo "  Frontend: $FRONTEND_APP"
echo "  ML Service: $ML_APP"

# Function to create Heroku app if it doesn't exist
create_app_if_not_exists() {
    local app_name=$1
    local app_type=$2
    
    if heroku apps:info $app_name &> /dev/null; then
        print_warning "App $app_name already exists. Skipping creation."
    else
        print_status "Creating Heroku app: $app_name"
        heroku create $app_name
        print_success "Created $app_type app: $app_name"
    fi
}

# Create Heroku apps
print_status "Creating Heroku applications..."
create_app_if_not_exists $BACKEND_APP "backend"
create_app_if_not_exists $FRONTEND_APP "frontend"
create_app_if_not_exists $ML_APP "ML service"

# Deploy Backend
print_status "Deploying Backend..."
cd backend

# Add Heroku remote if not exists
if ! git remote get-url heroku-backend &> /dev/null; then
    heroku git:remote -a $BACKEND_APP -r heroku-backend
fi

# MongoDB Atlas Setup
print_status "Setting up MongoDB Atlas..."
print_warning "Please set up MongoDB Atlas manually using the guide: MONGODB_ATLAS_SETUP.md"
print_warning "After setting up Atlas, run: heroku config:set MONGODB_URI='your-atlas-connection-string' -a $BACKEND_APP"

# Add Redis addon
print_status "Adding Redis addon..."
heroku addons:create heroku-redis:mini -a $BACKEND_APP || print_warning "Redis addon might already exist"

# Set environment variables
print_status "Setting environment variables for backend..."
heroku config:set NODE_ENV=production -a $BACKEND_APP
heroku config:set JWT_SECRET=$(openssl rand -base64 32) -a $BACKEND_APP
heroku config:set ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32) -a $BACKEND_APP
heroku config:set BCRYPT_ROUNDS=12 -a $BACKEND_APP
heroku config:set LOG_LEVEL=info -a $BACKEND_APP

# Get MongoDB URI from addon
MONGODB_URI=$(heroku config:get MONGODB_URI -a $BACKEND_APP)
if [[ -n "$MONGODB_URI" ]]; then
    print_success "MongoDB URI configured automatically"
else
    print_warning "MongoDB URI not found. You may need to configure it manually."
fi

# Deploy backend
print_status "Pushing backend code to Heroku..."
git add .
git commit -m "Deploy backend to Heroku" || print_warning "No changes to commit"
git push heroku-backend master

print_success "Backend deployed successfully!"

# Get backend URL
BACKEND_URL=$(heroku apps:info $BACKEND_APP --json | jq -r '.app.web_url')
print_success "Backend URL: $BACKEND_URL"

cd ..

# Deploy Frontend
print_status "Deploying Frontend..."
cd frontend

# Add Heroku remote if not exists
if ! git remote get-url heroku-frontend &> /dev/null; then
    heroku git:remote -a $FRONTEND_APP -r heroku-frontend
fi

# Set environment variables for frontend
print_status "Setting environment variables for frontend..."
heroku config:set REACT_APP_API_URL="${BACKEND_URL}api" -a $FRONTEND_APP
heroku config:set REACT_APP_APP_NAME="FinSync360" -a $FRONTEND_APP
heroku config:set REACT_APP_VERSION="1.0.0" -a $FRONTEND_APP

# Add Node.js buildpack
heroku buildpacks:set heroku/nodejs -a $FRONTEND_APP

# Deploy frontend
print_status "Pushing frontend code to Heroku..."
git add .
git commit -m "Deploy frontend to Heroku" || print_warning "No changes to commit"
git push heroku-frontend master

print_success "Frontend deployed successfully!"

# Get frontend URL
FRONTEND_URL=$(heroku apps:info $FRONTEND_APP --json | jq -r '.app.web_url')
print_success "Frontend URL: $FRONTEND_URL"

cd ..

# Deploy ML Service
print_status "Deploying ML Service..."
cd ml-service

# Add Heroku remote if not exists
if ! git remote get-url heroku-ml &> /dev/null; then
    heroku git:remote -a $ML_APP -r heroku-ml
fi

# Set Python buildpack
heroku buildpacks:set heroku/python -a $ML_APP

# Set environment variables for ML service
print_status "Setting environment variables for ML service..."
heroku config:set DEBUG=false -a $ML_APP
heroku config:set HOST=0.0.0.0 -a $ML_APP
heroku config:set PORT=8001 -a $ML_APP
heroku config:set SECRET_KEY=$(openssl rand -base64 32) -a $ML_APP
heroku config:set MONGODB_URL=$MONGODB_URI -a $ML_APP
heroku config:set BACKEND_API_URL="${BACKEND_URL}api" -a $ML_APP

# Deploy ML service
print_status "Pushing ML service code to Heroku..."
git add .
git commit -m "Deploy ML service to Heroku" || print_warning "No changes to commit"
git push heroku-ml master

print_success "ML Service deployed successfully!"

# Get ML service URL
ML_URL=$(heroku apps:info $ML_APP --json | jq -r '.app.web_url')
print_success "ML Service URL: $ML_URL"

cd ..

# Final summary
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Application URLs:"
echo "  🖥️  Frontend:   $FRONTEND_URL"
echo "  🔧 Backend:    $BACKEND_URL"
echo "  🤖 ML Service: $ML_URL"
echo ""
echo "📊 Next steps:"
echo "  1. Configure your custom domain (optional)"
echo "  2. Set up SSL certificates"
echo "  3. Configure environment-specific variables"
echo "  4. Set up monitoring and logging"
echo "  5. Configure backup strategies"
echo ""
print_status "Deployment script completed!"
