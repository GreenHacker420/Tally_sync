# FinSync360 Installation Guide

This guide will help you set up FinSync360 on your local machine or server.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for initial setup and integrations

### Software Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **MongoDB**: Version 6.0 or higher
- **Git**: For version control
- **Docker** (optional): For containerized deployment

## Installation Methods

### Method 1: Local Development Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd FinSync360
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

#### 3. Set Up Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

#### 4. Set Up MongoDB
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use finsync360
> db.createUser({
    user: "finsync360",
    pwd: "your-password",
    roles: ["readWrite"]
  })
```

#### 5. Start Development Servers
```bash
# Start all services in development mode
npm run dev

# Or start services individually
npm run backend:dev    # Backend API (port 5000)
npm run frontend:dev   # Frontend Web App (port 3000)
```

### Method 2: Docker Deployment

#### 1. Prerequisites
```bash
# Install Docker and Docker Compose
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. Environment Configuration
```bash
# Copy and configure environment file
cp .env.example .env
nano .env
```

#### 3. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration

### Backend Configuration

Edit `backend/.env` with your specific settings:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/finsync360

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# WhatsApp Integration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# GST Integration
GSTN_API_KEY=your-gstn-api-key

# Tally Integration
TALLY_SERVER_HOST=localhost
TALLY_SERVER_PORT=9000
```

### Frontend Configuration

Edit `frontend/.env` with your settings:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=FinSync360
```

## Database Setup

### Initialize Database
```bash
# Run database initialization script
cd backend
npm run seed
```

### Create Admin User
```bash
# Access the application and register the first user
# The first registered user automatically becomes an admin
```

## Verification

### 1. Check Services
```bash
# Check if all services are running
curl http://localhost:5000/health  # Backend health check
curl http://localhost:3000         # Frontend access
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api/docs (if enabled)

### 3. Test Basic Functionality
1. Register a new account
2. Create a company
3. Navigate through the dashboard
4. Test API endpoints

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Check MongoDB logs
sudo journalctl -u mongodb
```

#### Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check container logs
docker-compose logs backend
docker-compose logs frontend
```

### Performance Optimization

#### For Production Deployment
1. **Enable SSL/HTTPS**
2. **Configure reverse proxy (Nginx)**
3. **Set up monitoring and logging**
4. **Configure backup strategies**
5. **Optimize database indexes**
6. **Enable caching (Redis)**

#### Memory and CPU Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Use PM2 for process management
npm install -g pm2
pm2 start backend/src/server.js --name "finsync360-backend"
```

## Next Steps

1. **Configure Integrations**: Set up Razorpay, Twilio, GSTN APIs
2. **Tally Integration**: Install and configure Tally sync agent
3. **Mobile Apps**: Set up React Native development environment
4. **Desktop Apps**: Set up Electron development environment
5. **Security**: Configure SSL, firewall, and security headers
6. **Monitoring**: Set up logging, monitoring, and alerting
7. **Backup**: Configure automated backup strategies

## Support

For installation support:
- Check the [FAQ](./FAQ.md)
- Review [troubleshooting guide](./TROUBLESHOOTING.md)
- Create an issue on GitHub
- Contact support team

## Security Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable HTTPS in production**
4. **Configure firewall rules**
5. **Regular security updates**
6. **Monitor access logs**
