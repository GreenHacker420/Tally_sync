#!/bin/bash

# Quick Setup Script for FinSync360 Local Development
# This script sets up the development environment

set -e

echo "🚀 Setting up FinSync360 development environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed (for ML service)
if ! command -v python3 &> /dev/null; then
    print_warning "Python 3 is not installed. Please install Python 3.8+ first."
    echo "Visit: https://python.org/"
    exit 1
fi

print_success "Node.js and Python are installed."

# Install dependencies for all components
print_status "Installing dependencies for all components..."

# Root dependencies
print_status "Installing root dependencies..."
npm install

# Backend dependencies
print_status "Installing backend dependencies..."
cd backend && npm install && cd ..

# Frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Mobile dependencies
print_status "Installing mobile dependencies..."
cd mobile && npm install && cd ..

# Desktop dependencies
print_status "Installing desktop dependencies..."
cd desktop && npm install && cd src/renderer && npm install && cd ../..

# Desktop agent dependencies
print_status "Installing desktop agent dependencies..."
cd desktop-agent && npm install && cd ..

# ML service dependencies
print_status "Installing ML service dependencies..."
cd ml-service && pip3 install -r requirements.txt && cd ..

print_success "All dependencies installed successfully!"

# Create environment files
print_status "Creating environment configuration files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from example"
else
    print_warning "backend/.env already exists"
fi

# ML service .env
if [ ! -f "ml-service/.env" ]; then
    cp ml-service/.env.example ml-service/.env
    print_success "Created ml-service/.env from example"
else
    print_warning "ml-service/.env already exists"
fi

# Root .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created root .env from example"
else
    print_warning "Root .env already exists"
fi

print_success "Environment files created!"

print_status "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure your environment variables in the .env files"
echo "  2. Start MongoDB and Redis locally"
echo "  3. Run 'npm run dev' to start all services"
echo "  4. For Heroku deployment, run './heroku-deploy.sh'"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev              - Start all services in development"
echo "  npm run backend:dev      - Start only backend"
echo "  npm run frontend:dev     - Start only frontend"
echo "  npm run mobile:dev       - Start mobile app"
echo "  npm run desktop:dev      - Start desktop app"
echo "  npm run ml-service:dev   - Start ML service"
echo ""
print_success "Happy coding! 🚀"
