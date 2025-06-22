const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Company = require('../src/models/Company');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Admin and test users data
const adminUsers = [
  {
    name: 'Super Admin',
    email: 'admin@finsync360.com',
    phone: '+919999999999',
    password: 'Admin@123456',
    role: 'superadmin',
    isActive: true,
    isEmailVerified: true,
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: true },
      inventory: { create: true, read: true, update: true, delete: true },
      reports: { financial: true, inventory: true, gst: true, analytics: true },
      settings: { company: true, users: true, integrations: true }
    }
  },
  {
    name: 'System Admin',
    email: 'sysadmin@finsync360.com',
    phone: '+919999999998',
    password: 'SysAdmin@123',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      reports: { financial: true, inventory: true, gst: true, analytics: true },
      settings: { company: true, users: true, integrations: false }
    }
  },
  {
    name: 'Demo User',
    email: 'demo@finsync360.com',
    phone: '+919999999997',
    password: 'Demo@123456',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      reports: { financial: true, inventory: true, gst: true, analytics: false },
      settings: { company: true, users: false, integrations: false }
    }
  }
];

const testUsers = [
  {
    name: 'Test Accountant',
    email: 'accountant@test.com',
    phone: '+919999999996',
    password: 'Test@123456',
    role: 'accountant',
    isActive: true,
    isEmailVerified: true,
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      reports: { financial: true, inventory: true, gst: true, analytics: false },
      settings: { company: false, users: false, integrations: false }
    }
  },
  {
    name: 'Test Sales',
    email: 'sales@test.com',
    phone: '+919999999995',
    password: 'Sales@123',
    role: 'sales',
    isActive: true,
    isEmailVerified: true,
    permissions: {
      vouchers: { create: true, read: true, update: false, delete: false },
      inventory: { create: false, read: true, update: false, delete: false },
      reports: { financial: false, inventory: true, gst: false, analytics: false },
      settings: { company: false, users: false, integrations: false }
    }
  },
  {
    name: 'Test Viewer',
    email: 'viewer@test.com',
    phone: '+919999999994',
    password: 'Viewer@123',
    role: 'viewer',
    isActive: true,
    isEmailVerified: true,
    permissions: {
      vouchers: { create: false, read: true, update: false, delete: false },
      inventory: { create: false, read: true, update: false, delete: false },
      reports: { financial: true, inventory: true, gst: true, analytics: false },
      settings: { company: false, users: false, integrations: false }
    }
  }
];

// Demo companies data
const demoCompanies = [
  {
    name: 'Demo Trading Company',
    email: 'demo@trading.com',
    phone: '+919876543210',
    address: '123 Business Street, Mumbai, Maharashtra 400001',
    gstNumber: '27AABCU9603R1ZX',
    panNumber: 'AABCU9603R',
    businessType: 'Trading',
    settings: {
      currency: 'INR',
      financialYear: '2024-25',
      gstEnabled: true,
      tallyIntegration: true,
      autoBackup: true
    }
  },
  {
    name: 'Sample Manufacturing Ltd',
    email: 'info@manufacturing.com',
    phone: '+919876543211',
    address: '456 Industrial Area, Pune, Maharashtra 411001',
    gstNumber: '27AABCS1234R1ZY',
    panNumber: 'AABCS1234R',
    businessType: 'Manufacturing',
    settings: {
      currency: 'INR',
      financialYear: '2024-25',
      gstEnabled: true,
      tallyIntegration: true,
      autoBackup: true
    }
  },
  {
    name: 'Test Services Pvt Ltd',
    email: 'contact@services.com',
    phone: '+919876543212',
    address: '789 Service Center, Bangalore, Karnataka 560001',
    gstNumber: '29AABCT5678R1ZZ',
    panNumber: 'AABCT5678R',
    businessType: 'Services',
    settings: {
      currency: 'INR',
      financialYear: '2024-25',
      gstEnabled: true,
      tallyIntegration: false,
      autoBackup: true
    }
  }
];

// Create users function
const createUsers = async (users, userType) => {
  console.log(`\n📝 Creating ${userType} users...`);
  
  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user (password will be hashed automatically by the model)
      const user = new User({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();
      console.log(`✅ Created ${userType} user: ${userData.email}`);
      
      // Store original password for display (don't do this in production!)
      user.originalPassword = userData.password;
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
};

// Create companies function
const createCompanies = async () => {
  console.log('\n🏢 Creating demo companies...');
  
  // Get demo user
  const demoUser = await User.findOne({ email: 'demo@finsync360.com' });
  if (!demoUser) {
    console.log('⚠️  Demo user not found, skipping company creation');
    return;
  }

  for (const companyData of demoCompanies) {
    try {
      // Check if company already exists
      const existingCompany = await Company.findOne({ 
        name: companyData.name,
        userId: demoUser._id 
      });
      
      if (existingCompany) {
        console.log(`⚠️  Company ${companyData.name} already exists, skipping...`);
        continue;
      }

      // Create company
      const company = new Company({
        ...companyData,
        userId: demoUser._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await company.save();
      console.log(`✅ Created company: ${companyData.name}`);
      
    } catch (error) {
      console.error(`❌ Error creating company ${companyData.name}:`, error.message);
    }
  }
};

// Main function
const createAdminAndTestUsers = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting admin and test user creation...');
    
    // Create admin users
    await createUsers(adminUsers, 'admin');
    
    // Create test users
    await createUsers(testUsers, 'test');
    
    // Create demo companies
    await createCompanies();
    
    console.log('\n🎉 Admin and test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('==========================================');
    
    // Display all created users
    const allUsers = [...adminUsers, ...testUsers];
    allUsers.forEach(user => {
      console.log(`👤 ${user.name} (${user.role})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log('   ----------------------------------------');
    });
    
    console.log('\n🔐 Security Note:');
    console.log('Please change these default passwords in production!');
    console.log('\n🌐 Access your application at:');
    console.log('Frontend: https://finsync-frontend-62084a54426d.herokuapp.com/');
    console.log('Backend: https://finsync-backend-d34180691b06.herokuapp.com/');
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  createAdminAndTestUsers();
}

module.exports = { createAdminAndTestUsers };
