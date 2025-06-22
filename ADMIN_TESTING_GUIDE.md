# 👥 Admin & Testing Users Guide

This guide provides information about admin users, test accounts, and how to set up your FinSync360 application for testing and administration.

## 🔐 Default Admin & Test Users

### 🛡️ Admin Users

| Role | Name | Email | Password | Permissions |
|------|------|-------|----------|-------------|
| **Super Admin** | Super Admin | `admin@finsync360.com` | `Admin@123456` | Full system access |
| **System Admin** | System Admin | `sysadmin@finsync360.com` | `SysAdmin@123` | User & company management |
| **Demo User** | Demo User | `demo@finsync360.com` | `Demo@123456` | Standard user with demo data |

### 👨‍💼 Test Users

| Role | Name | Email | Password | Purpose |
|------|------|-------|----------|---------|
| **Accountant** | Test Accountant | `accountant@test.com` | `Test@123456` | Voucher & inventory management |
| **Manager** | Test Manager | `manager@test.com` | `Manager@123` | Reports & approvals |
| **Viewer** | Test Viewer | `viewer@test.com` | `Viewer@123` | Read-only access |

## 🏢 Demo Companies

The demo user comes with pre-configured companies:

1. **Demo Trading Company**
   - GST: `27AABCU9603R1ZX`
   - Business: Trading
   - Location: Mumbai, Maharashtra

2. **Sample Manufacturing Ltd**
   - GST: `27AABCS1234R1ZY`
   - Business: Manufacturing
   - Location: Pune, Maharashtra

3. **Test Services Pvt Ltd**
   - GST: `29AABCT5678R1ZZ`
   - Business: Services
   - Location: Bangalore, Karnataka

## 🚀 Setting Up Admin & Test Users

### Method 1: Automated Script (Recommended)

Run the admin user creation script:

```bash
# Navigate to backend directory
cd backend

# Create admin and test users
npm run create:admin

# Or run directly
node scripts/create-admin-users.js
```

### Method 2: Manual Creation via API

You can also create users manually using the API:

```bash
# Create Super Admin
curl -X POST https://finsync-backend-d34180691b06.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@finsync360.com",
    "password": "Admin@123456",
    "role": "super_admin"
  }'

# Create Demo User
curl -X POST https://finsync-backend-d34180691b06.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo User",
    "email": "demo@finsync360.com",
    "password": "Demo@123456",
    "role": "user"
  }'
```

### Method 3: Database Direct Insert

If you have direct database access:

```javascript
// MongoDB shell commands
use finsync360;

// Insert admin user
db.users.insertOne({
  name: "Super Admin",
  email: "admin@finsync360.com",
  password: "$2a$12$hashed_password_here",
  role: "super_admin",
  isActive: true,
  isEmailVerified: true,
  permissions: ["user_management", "company_management", "system_settings"],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 🔑 User Roles & Permissions

### Super Admin
- **Full system access**
- User management (create, edit, delete users)
- Company management (all companies)
- System settings configuration
- Data export and backup
- Integration management

### System Admin
- User management (limited)
- Company management
- View all data
- Export data
- No system settings access

### Manager
- View reports and analytics
- Manage assigned companies
- User management (limited to their company)
- Approve vouchers and transactions

### Accountant
- Create and edit vouchers
- Manage inventory items
- View reports (limited)
- Tally synchronization
- GST compliance features

### Viewer
- Read-only access to reports
- View vouchers and inventory
- No edit permissions
- Basic dashboard access

## 🧪 Testing Scenarios

### 1. Authentication Testing
```bash
# Test login
curl -X POST https://finsync-backend-d34180691b06.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finsync360.com",
    "password": "Admin@123456"
  }'
```

### 2. Company Management Testing
```bash
# Create company (requires authentication token)
curl -X POST https://finsync-backend-d34180691b06.herokuapp.com/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Company",
    "email": "test@company.com",
    "gstNumber": "27AABCT1234R1ZZ"
  }'
```

### 3. Voucher Testing
```bash
# Create voucher
curl -X POST https://finsync-backend-d34180691b06.herokuapp.com/api/vouchers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "voucherType": "Sales",
    "voucherNumber": "S001",
    "date": "2024-06-21",
    "amount": 1000,
    "companyId": "COMPANY_ID_HERE"
  }'
```

## 🔧 Admin Panel Features

### User Management
- View all users
- Create new users
- Edit user roles and permissions
- Activate/deactivate users
- Reset passwords

### Company Management
- View all companies
- Company settings configuration
- Tally integration setup
- GST configuration

### System Settings
- Application configuration
- Integration settings
- Backup and restore
- Audit logs

### Reports & Analytics
- User activity reports
- Company performance metrics
- System usage statistics
- Error logs and monitoring

## 🛡️ Security Considerations

### Production Security
1. **Change default passwords** immediately
2. **Enable two-factor authentication** for admin accounts
3. **Use strong passwords** (minimum 12 characters)
4. **Regular password rotation** (every 90 days)
5. **Monitor admin activities** through audit logs

### Password Policy
- Minimum 8 characters
- Must include uppercase, lowercase, numbers, and symbols
- Cannot reuse last 5 passwords
- Account lockout after 5 failed attempts

### Session Management
- JWT tokens expire after 7 days
- Refresh tokens expire after 30 days
- Automatic logout after 30 minutes of inactivity
- Single sign-on (SSO) support

## 📊 Monitoring & Logging

### Admin Activities
All admin activities are logged:
- User creation/modification
- Permission changes
- System configuration changes
- Data exports
- Login/logout events

### Audit Trail
- Timestamp of all actions
- User identification
- IP address tracking
- Action details
- Before/after values for changes

## 🚨 Troubleshooting

### Common Issues

**Cannot login with admin credentials**
```bash
# Check if user exists
curl -X GET https://finsync-backend-d34180691b06.herokuapp.com/api/users/admin@finsync360.com \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Permission denied errors**
- Verify user role and permissions
- Check JWT token validity
- Ensure user account is active

**Database connection issues**
```bash
# Check backend logs
heroku logs --tail -a finsync-backend

# Verify MongoDB Atlas connection
# Check environment variables
heroku config -a finsync-backend
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review user activities and audit logs
2. **Monthly**: Update passwords and review permissions
3. **Quarterly**: Security audit and penetration testing
4. **Annually**: Complete system security review

### Backup Strategy
- **Daily**: Automated database backups
- **Weekly**: Full system backup including files
- **Monthly**: Backup verification and restore testing

---

**🔐 Security Reminder**: Always change default passwords in production and implement proper security measures!

**📧 Support**: For issues with admin accounts, contact your system administrator or check the application logs.
