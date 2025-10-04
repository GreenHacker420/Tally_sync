#!/bin/bash

# FinSync360 Setup Script
# This script sets up the development environment for FinSync360

set -e

echo "🚀 Setting up FinSync360 Development Environment"
echo "================================================"

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

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Checking MongoDB installation..."
    if command -v mongod &> /dev/null; then
        MONGO_VERSION=$(mongod --version | head -n1)
        print_success "MongoDB is installed: $MONGO_VERSION"
    else
        print_warning "MongoDB is not installed. Please install MongoDB 6.0+ from https://docs.mongodb.com/manual/installation/"
        print_status "You can also use Docker to run MongoDB"
    fi
}

# Check if Git is installed
check_git() {
    print_status "Checking Git installation..."
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git is installed: $GIT_VERSION"
    else
        print_error "Git is not installed. Please install Git from https://git-scm.com/"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    print_success "All dependencies installed successfully!"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy root environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file"
    else
        print_warning ".env file already exists"
    fi
    
    # Copy backend environment file
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env file"
    else
        print_warning "backend/.env file already exists"
    fi
    
    print_warning "Please update the environment files with your configuration:"
    print_warning "- .env (root configuration)"
    print_warning "- backend/.env (backend configuration)"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p frontend/build
    
    print_success "Directories created successfully!"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command -v mongod &> /dev/null; then
        print_status "Starting MongoDB service..."
        
        # Try to start MongoDB (different commands for different systems)
        if command -v systemctl &> /dev/null; then
            sudo systemctl start mongod || print_warning "Could not start MongoDB service"
        elif command -v brew &> /dev/null; then
            brew services start mongodb-community || print_warning "Could not start MongoDB service"
        fi
        
        print_success "Database setup completed!"
    else
        print_warning "MongoDB not found. Using Docker setup instead..."
        if command -v docker &> /dev/null; then
            print_status "Starting MongoDB with Docker..."
            docker run -d --name finsync360-mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:6.0
            print_success "MongoDB started with Docker!"
        else
            print_warning "Docker not found. Please install MongoDB manually or use Docker."
        fi
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run backend tests
    print_status "Running backend tests..."
    cd backend && npm test && cd ..
    
    # Run frontend tests
    print_status "Running frontend tests..."
    cd frontend && npm test -- --watchAll=false && cd ..
    
    print_success "All tests passed!"
}

# Main setup function
main() {
    echo ""
    print_status "Starting FinSync360 setup process..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_mongodb
    check_git
    
    echo ""
    
    # Setup project
    install_dependencies
    setup_environment
    create_directories
    setup_database
    
    echo ""
    
    # Optional: Run tests
    read -p "Do you want to run tests? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    echo ""
    print_success "🎉 FinSync360 setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Update environment files with your configuration"
    echo "2. Start the development servers: npm run dev"
    echo "3. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000"
    echo "   - API Documentation (Swagger): http://localhost:5000/api-docs"
    echo "   - Health Check: http://localhost:5000/health"
    echo ""
    print_status "📖 API Documentation:"
    echo "   - Interactive Swagger UI with 87 documented endpoints"
    echo "   - OpenAPI 3.0 specification available at /api-docs.json"
    echo "   - Complete endpoint reference in backend/API_ENDPOINTS_SUMMARY.md"
    echo ""
    print_status "🔧 Available commands:"
    echo "   npm run dev              - Start all services"
    echo "   npm run backend:dev      - Start backend only"
    echo "   npm run frontend:dev     - Start frontend only"
    echo "   npm test                 - Run all tests"
    echo ""
    print_status "For more information, check the documentation in the docs/ folder"
    echo ""
}

# Handle script interruption
trap 'print_error "Setup interrupted by user"; exit 1' INT

# Run main function
main "$@"
