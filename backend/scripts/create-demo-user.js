const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
require('dotenv').config();

const createDemoUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finsync360', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@finsync360.com' });
    if (existingUser) {
      console.log('Demo user already exists!');
      console.log('Email: demo@finsync360.com');
      console.log('Password: demo123');
      process.exit(0);
    }

    // Hash password first
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('demo123', saltRounds);

    // Create demo user first (needed for company creation)
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@finsync360.com',
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

    const savedUser = await demoUser.save();
    console.log('Demo user created (without company)');

    // Create demo company
    const demoCompany = new Company({
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
      createdBy: savedUser._id
    });

    const savedCompany = await demoCompany.save();
    console.log('Demo company created:', savedCompany.name);

    // Update user with company
    savedUser.companies = [savedCompany._id];
    await savedUser.save();

    console.log('Demo user updated with company information');
    console.log('');
    console.log('=== DEMO USER CREDENTIALS ===');
    console.log('Email: demo@finsync360.com');
    console.log('Password: demo123');
    console.log('Role: admin');
    console.log('Company:', savedCompany.name);
    console.log('==============================');
    console.log('');
    console.log('You can now use these credentials to login to the application.');

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoUser();
