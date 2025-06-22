# 🚀 MongoDB Atlas Production Setup Guide

This guide will help you set up MongoDB Atlas for production deployment with Heroku.

## 📋 Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Sign up** for a free account
3. **Verify your email** address

## 🏗️ Step 2: Create a Production Cluster

### Create New Project
1. Click **"New Project"**
2. Name it: `FinSync360-Production`
3. Click **"Next"** → **"Create Project"**

### Create Cluster
1. Click **"Build a Database"**
2. Choose **"M0 Sandbox"** (Free tier - perfect for starting)
3. **Cloud Provider**: AWS (recommended)
4. **Region**: Choose closest to your Heroku region
   - US East (N. Virginia) - `us-east-1` (if using Heroku US)
   - Europe (Ireland) - `eu-west-1` (if using Heroku Europe)
5. **Cluster Name**: `finsync360-prod`
6. Click **"Create"**

## 🔐 Step 3: Configure Security

### Database Access (Users)
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `finsync360_user`
5. **Password**: Generate secure password (save it!)
6. **Database User Privileges**: 
   - Select **"Built-in Role"**
   - Choose **"Read and write to any database"**
7. Click **"Add User"**

### Network Access (IP Whitelist)
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. **For Heroku deployment**:
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Comment: "Heroku Production Access"
4. Click **"Confirm"**

⚠️ **Security Note**: For enhanced security, you can whitelist specific Heroku IP ranges instead.

## 🔗 Step 4: Get Connection String

1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. **Copy the connection string**:
   ```
   mongodb+srv://finsync360_user:<password>@finsync360-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace `<password>`** with your actual password
8. **Add database name** at the end:
   ```
   mongodb+srv://finsync360_user:your_password@finsync360-prod.xxxxx.mongodb.net/finsync360?retryWrites=true&w=majority
   ```

## ⚙️ Step 5: Configure Heroku

### Set Environment Variables
```bash
# Set MongoDB URI
heroku config:set MONGODB_URI="mongodb+srv://finsync360_user:your_password@finsync360-prod.xxxxx.mongodb.net/finsync360?retryWrites=true&w=majority" -a finsync-backend

# Verify it's set
heroku config:get MONGODB_URI -a finsync-backend
```

### Update Backend Configuration
Your backend is already configured to use `process.env.MONGODB_URI`, so no code changes needed!

## 🔧 Step 6: Production Optimizations

### Database Indexes (Run after deployment)
```javascript
// Connect to your database and run these commands
// You can do this via MongoDB Compass or Atlas UI

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Company indexes
db.companies.createIndex({ userId: 1 });
db.companies.createIndex({ name: 1 });

// Voucher indexes
db.vouchers.createIndex({ companyId: 1, date: -1 });
db.vouchers.createIndex({ voucherNumber: 1, companyId: 1 });
db.vouchers.createIndex({ voucherType: 1, companyId: 1 });

// Inventory indexes
db.inventory.createIndex({ companyId: 1, category: 1 });
db.inventory.createIndex({ companyId: 1, name: "text" });
db.inventory.createIndex({ companyId: 1, currentStock: 1 });
```

### Connection Pool Settings
Your backend already has optimal settings in `backend/src/config/database.js`:
```javascript
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};
```

## 📊 Step 7: Monitoring and Alerts

### Set Up Alerts in Atlas
1. Go to **"Alerts"** in Atlas
2. Click **"Add Alert"**
3. **Recommended alerts**:
   - **Connection Count**: Alert when > 80% of connection limit
   - **Disk Usage**: Alert when > 80% full
   - **Query Performance**: Alert on slow queries
   - **Replication Lag**: Alert on delays

### Enable Profiler
1. Go to **"Database"** → **"Browse Collections"**
2. Click **"Performance Advisor"**
3. Enable **"Real Time Performance Panel"**

## 🔄 Step 8: Backup Strategy

### Automatic Backups (Atlas handles this)
- **Continuous Backup**: Enabled by default
- **Point-in-time Recovery**: Available
- **Backup Retention**: 2 days (free tier)

### Manual Backup Script
```bash
#!/bin/bash
# backup-atlas.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_NAME="finsync360"

mkdir -p $BACKUP_DIR

# Export collections
mongodump --uri="$MONGODB_URI" --db=$DB_NAME --out=$BACKUP_DIR/$DATE

# Compress
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

echo "Backup completed: backup_$DATE.tar.gz"
```

## 🚀 Step 9: Deploy to Heroku

Now deploy your backend with the MongoDB Atlas connection:

```bash
cd backend
git add .
git commit -m "Configure MongoDB Atlas for production"
git push heroku-backend master

# Check logs
heroku logs --tail -a finsync-backend
```

## 📈 Step 10: Scale for Production

### Atlas Scaling
- **M0 (Free)**: 512MB storage, shared CPU
- **M2 ($9/month)**: 2GB storage, shared CPU
- **M5 ($25/month)**: 5GB storage, dedicated CPU

### Heroku Scaling
```bash
# Scale web dynos
heroku ps:scale web=2 -a finsync-backend

# Enable auto-scaling
heroku ps:autoscale:enable web --min=1 --max=5 -a finsync-backend
```

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit these to git!
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### 2. Connection Security
- ✅ Use SSL/TLS (enabled by default in Atlas)
- ✅ Use authentication (configured above)
- ✅ Whitelist IPs (configured above)
- ✅ Use strong passwords

### 3. Application Security
```javascript
// Your backend already has these security measures:
// - Input validation
// - Rate limiting
// - CORS configuration
// - Helmet security headers
```

## 🎯 Cost Estimation

### Free Tier (Perfect for MVP)
- **MongoDB Atlas M0**: $0/month (512MB)
- **Heroku Basic Dyno**: $7/month
- **Heroku Redis Mini**: $3/month
- **Total**: ~$10/month

### Production Tier
- **MongoDB Atlas M2**: $9/month (2GB)
- **Heroku Standard Dyno**: $25/month
- **Heroku Redis Premium**: $15/month
- **Total**: ~$49/month

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] MongoDB Atlas cluster is running
- [ ] Database user created with proper permissions
- [ ] IP whitelist configured for Heroku
- [ ] Connection string set in Heroku config
- [ ] Backend deploys successfully
- [ ] Application can connect to database
- [ ] Basic CRUD operations work
- [ ] Indexes are created
- [ ] Monitoring is enabled

## 🆘 Troubleshooting

### Common Issues

**Connection Timeout**
```bash
# Check if IP is whitelisted
# Verify connection string format
# Check Heroku config vars
heroku config -a finsync-backend
```

**Authentication Failed**
```bash
# Verify username/password
# Check database user permissions
# Ensure authSource=admin in connection string
```

**Slow Queries**
```bash
# Check Performance Advisor in Atlas
# Create appropriate indexes
# Monitor query patterns
```

---

**🎉 Your MongoDB Atlas production setup is complete!**

This setup gives you:
- ✅ Production-ready database
- ✅ Automatic backups
- ✅ Monitoring and alerts
- ✅ Scalability options
- ✅ Security best practices
