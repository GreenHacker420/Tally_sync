# Demo User Setup Scripts

This directory contains scripts to create demo users and sample data for testing the FinSync360 application.

## Available Scripts

### 1. Create Single Demo User
```bash
npm run demo:user
```
Creates a single admin demo user with full permissions.

**Credentials:**
- Email: `demo@finsync360.com`
- Password: `demo123`
- Role: Admin

### 2. Create Multiple Demo Users
```bash
npm run demo:users
```
Creates multiple demo users with different roles and permissions.

**Credentials:**
- **Admin User**
  - Email: `admin@finsync360.com`
  - Password: `admin123`
  - Role: Admin (Full access)

- **Manager User**
  - Email: `manager@finsync360.com`
  - Password: `manager123`
  - Role: Manager (Most features except user management)

- **Accountant User**
  - Email: `accountant@finsync360.com`
  - Password: `accountant123`
  - Role: User (Vouchers and reports focus)

- **Inventory User**
  - Email: `inventory@finsync360.com`
  - Password: `inventory123`
  - Role: User (Inventory management focus)

### 3. Create Demo Data
```bash
npm run demo:data
```
Creates sample inventory items and vouchers for testing.

**Sample Data Includes:**
- 5 Inventory items (Laptop, Office Chair, A4 Paper, Wireless Mouse, Desk Lamp)
- 4 Vouchers (Sales, Purchase, Payment, Receipt)

### 4. Create Everything
```bash
npm run demo:all
```
Creates all demo users and sample data in one command.

## Prerequisites

1. Make sure MongoDB is running
2. Ensure the backend server dependencies are installed:
   ```bash
   cd backend
   npm install
   ```
3. Set up your environment variables in `.env` file

## Usage Instructions

1. **First Time Setup:**
   ```bash
   cd backend
   npm run demo:all
   ```

2. **Start the Backend Server:**
   ```bash
   npm run dev
   ```

3. **Start the Frontend:**
   ```bash
   cd ../frontend-nextjs
   npm run dev
   ```

4. **Login to the Application:**
   - Open http://localhost:3000
   - Use any of the demo user credentials listed above

## User Permissions

### Admin User
- Full access to all features
- User management
- System settings
- All CRUD operations

### Manager User
- Dashboard access
- Company management (view/edit)
- Inventory management
- Voucher management
- Reports and exports
- Settings (view only)

### Accountant User
- Dashboard access
- Company information (view only)
- Voucher management (create/edit)
- Financial reports
- Export capabilities

### Inventory User
- Dashboard access
- Company information (view only)
- Inventory management (create/edit)
- Inventory reports

## Troubleshooting

### "Demo user already exists" Error
If you see this message, the demo users are already created. You can:
1. Use the existing credentials
2. Delete the users from MongoDB and run the script again
3. Modify the script to use different email addresses

### Database Connection Error
Make sure:
1. MongoDB is running
2. The connection string in `.env` is correct
3. The database name matches your configuration

### Permission Errors
If a user can't access certain features:
1. Check the user's role and permissions in the database
2. Verify the frontend permission checks match the backend
3. Re-run the demo user script to reset permissions

## Customization

You can modify the scripts to:
- Add more demo users
- Change user permissions
- Add different sample data
- Modify company information

Edit the respective script files in this directory to customize the demo data according to your needs.
