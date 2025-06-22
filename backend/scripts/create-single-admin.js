const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../src/models/User');

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

// Create a single admin user
const createSingleAdmin = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Creating single admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@finsync360.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🎭 Role:', existingAdmin.role);
      console.log('✅ Active:', existingAdmin.isActive);
      
      // Test password
      const isPasswordValid = await existingAdmin.matchPassword('Admin@123456');
      console.log('🔑 Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('🔄 Updating password...');
        existingAdmin.password = 'Admin@123456';
        await existingAdmin.save();
        console.log('✅ Password updated');
      }
      
      return;
    }
    
    // Create new admin user
    const adminUser = new User({
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
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    
    // Verify the user was created
    const createdUser = await User.findOne({ email: 'admin@finsync360.com' });
    console.log('📋 Created user details:');
    console.log('   📧 Email:', createdUser.email);
    console.log('   👤 Name:', createdUser.name);
    console.log('   📱 Phone:', createdUser.phone);
    console.log('   🎭 Role:', createdUser.role);
    console.log('   ✅ Active:', createdUser.isActive);
    console.log('   📧 Email Verified:', createdUser.isEmailVerified);
    
    // Test password
    const isPasswordValid = await createdUser.matchPassword('Admin@123456');
    console.log('   🔑 Password test:', isPasswordValid ? 'PASS' : 'FAIL');
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('==========================================');
    console.log('📧 Email: admin@finsync360.com');
    console.log('🔑 Password: Admin@123456');
    console.log('🎭 Role: superadmin');
    console.log('==========================================');
    
    console.log('\n🧪 Test login with curl:');
    console.log('curl -X POST https://finsync-backend-d34180691b06.herokuapp.com/api/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "admin@finsync360.com", "password": "Admin@123456"}\'');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  createSingleAdmin();
}

module.exports = { createSingleAdmin };
