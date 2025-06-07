const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
require('dotenv').config();

const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@finsync360.com',
    password: 'admin123',
    phone: '+919876543210',
    role: 'admin',
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: true },
      inventory: { create: true, read: true, update: true, delete: true },
      reports: { financial: true, inventory: true, gst: true, analytics: true },
      settings: { company: true, users: true, integrations: true }
    }
  },
  {
    name: 'Manager User',
    email: 'manager@finsync360.com',
    password: 'manager123',
    phone: '+919876543211',
    role: 'accountant',
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      reports: { financial: true, inventory: true, gst: true, analytics: false },
      settings: { company: false, users: false, integrations: false }
    }
  },
  {
    name: 'Accountant User',
    email: 'accountant@finsync360.com',
    password: 'accountant123',
    phone: '+919876543212',
    role: 'accountant',
    permissions: {
      vouchers: { create: true, read: true, update: true, delete: false },
      inventory: { create: false, read: true, update: false, delete: false },
      reports: { financial: true, inventory: false, gst: true, analytics: false },
      settings: { company: false, users: false, integrations: false }
    }
  },
  {
    name: 'Inventory User',
    email: 'inventory@finsync360.com',
    password: 'inventory123',
    phone: '+919876543213',
    role: 'sales',
    permissions: {
      vouchers: { create: false, read: true, update: false, delete: false },
      inventory: { create: true, read: true, update: true, delete: false },
      reports: { financial: false, inventory: true, gst: false, analytics: false },
      settings: { company: false, users: false, integrations: false }
    }
  }
];

const createDemoUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finsync360', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create a temporary admin user first for company creation
    let tempAdminUser = await User.findOne({ email: 'admin@finsync360.com' });

    if (!tempAdminUser) {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);

      tempAdminUser = new User({
        name: 'Admin User',
        email: 'admin@finsync360.com',
        password: hashedPassword,
        phone: '+919876543210',
        role: 'admin',
        isActive: true,
        permissions: {
          vouchers: { create: true, read: true, update: true, delete: true },
          inventory: { create: true, read: true, update: true, delete: true },
          reports: { financial: true, inventory: true, gst: true, analytics: true },
          settings: { company: true, users: true, integrations: true }
        },
        preferences: {
          theme: 'light',
          language: 'en',
          dateFormat: 'DD/MM/YYYY',
          currency: 'INR'
        }
      });

      tempAdminUser = await tempAdminUser.save();
      console.log('Temporary admin user created for company setup');
    }

    // Find or create demo company
    let demoCompany = await Company.findOne({ name: 'Demo Company Ltd.' });

    if (!demoCompany) {
      demoCompany = new Company({
        name: 'Demo Company Ltd.',
        displayName: 'Demo Company Ltd.',
        gstin: '27ABCDE1234F1Z5', // Valid GSTIN format
        pan: 'ABCDE1234F',
        address: {
          line1: '123 Demo Street',
          line2: 'Demo Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        contact: {
          phone: '+919876543210',
          email: 'contact@democompany.com',
          website: 'https://democompany.com'
        },
        businessType: 'private_limited',
        industry: 'Information Technology',
        financialYear: {
          startDate: new Date('2024-04-01'),
          endDate: new Date('2025-03-31')
        },
        currency: {
          primary: 'INR',
          symbol: '₹',
          decimalPlaces: 2
        },
        taxation: {
          gstRegistered: true,
          gstType: 'regular',
          tdsApplicable: true,
          tcsApplicable: false
        },
        subscription: {
          plan: 'professional',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: true,
          features: {
            maxUsers: 10,
            maxVouchers: 10000,
            maxInventoryItems: 1000,
            advancedReports: true,
            apiAccess: true,
            whatsappIntegration: true
          }
        },
        isActive: true,
        createdBy: tempAdminUser._id
      });

      demoCompany = await demoCompany.save();
      console.log('Demo company created:', demoCompany.name);

      // Update the temp admin user with company
      tempAdminUser.companies = [demoCompany._id];
      await tempAdminUser.save();
    } else {
      console.log('Using existing demo company:', demoCompany.name);
    }

    console.log('\nCreating demo users...\n');

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating companies...`);
        if (!existingUser.companies.includes(demoCompany._id)) {
          existingUser.companies.push(demoCompany._id);
          await existingUser.save();
        }
        continue;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role,
        companies: [demoCompany._id],
        isActive: true,
        permissions: userData.permissions,
        preferences: {
          theme: 'light',
          language: 'en',
          dateFormat: 'DD/MM/YYYY',
          currency: 'INR'
        }
      });

      await user.save();
      console.log(`✓ Created user: ${userData.name} (${userData.email})`);
    }

    console.log('\n=== DEMO USER CREDENTIALS ===');
    console.log('Admin User:');
    console.log('  Email: admin@finsync360.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Manager User:');
    console.log('  Email: manager@finsync360.com');
    console.log('  Password: manager123');
    console.log('');
    console.log('Accountant User:');
    console.log('  Email: accountant@finsync360.com');
    console.log('  Password: accountant123');
    console.log('');
    console.log('Inventory User:');
    console.log('  Email: inventory@finsync360.com');
    console.log('  Password: inventory123');
    console.log('==============================');
    console.log('\nAll demo users created successfully!');

  } catch (error) {
    console.error('Error creating demo users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoUsers();
