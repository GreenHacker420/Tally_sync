const mongoose = require('mongoose');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Item = require('../src/models/Item');
const Voucher = require('../src/models/Voucher');
require('dotenv').config();

const sampleItems = [
  {
    name: 'Laptop Computer',
    code: 'LAP001',
    type: 'product',
    description: 'High-performance laptop for business use',
    units: {
      primary: { name: 'Piece', symbol: 'Pcs', decimalPlaces: 0 }
    },
    pricing: {
      costPrice: 40000,
      sellingPrice: 45000,
      mrp: 50000
    },
    taxation: {
      hsnCode: '8471',
      taxable: true,
      gstRate: { cgst: 9, sgst: 9, igst: 18, cess: 0 }
    },
    inventory: {
      trackInventory: true,
      stockLevels: { minimum: 5, reorderLevel: 10, reorderQuantity: 20 }
    }
  },
  {
    name: 'Office Chair',
    code: 'CHR001',
    type: 'product',
    description: 'Ergonomic office chair with lumbar support',
    units: {
      primary: { name: 'Piece', symbol: 'Pcs', decimalPlaces: 0 }
    },
    pricing: {
      costPrice: 7500,
      sellingPrice: 8500,
      mrp: 9500
    },
    taxation: {
      hsnCode: '9401',
      taxable: true,
      gstRate: { cgst: 9, sgst: 9, igst: 18, cess: 0 }
    },
    inventory: {
      trackInventory: true,
      stockLevels: { minimum: 10, reorderLevel: 15, reorderQuantity: 25 }
    }
  },
  {
    name: 'A4 Paper',
    code: 'PAP001',
    type: 'product',
    description: 'Premium quality A4 printing paper',
    units: {
      primary: { name: 'Ream', symbol: 'Ream', decimalPlaces: 0 }
    },
    pricing: {
      costPrice: 200,
      sellingPrice: 250,
      mrp: 300
    },
    taxation: {
      hsnCode: '4802',
      taxable: true,
      gstRate: { cgst: 6, sgst: 6, igst: 12, cess: 0 }
    },
    inventory: {
      trackInventory: true,
      stockLevels: { minimum: 50, reorderLevel: 75, reorderQuantity: 100 }
    }
  },
  {
    name: 'Wireless Mouse',
    code: 'MOU001',
    type: 'product',
    description: 'Wireless optical mouse with USB receiver',
    units: {
      primary: { name: 'Piece', symbol: 'Pcs', decimalPlaces: 0 }
    },
    pricing: {
      costPrice: 1000,
      sellingPrice: 1200,
      mrp: 1500
    },
    taxation: {
      hsnCode: '8471',
      taxable: true,
      gstRate: { cgst: 9, sgst: 9, igst: 18, cess: 0 }
    },
    inventory: {
      trackInventory: true,
      stockLevels: { minimum: 15, reorderLevel: 20, reorderQuantity: 30 }
    }
  },
  {
    name: 'Desk Lamp',
    code: 'LAM001',
    type: 'product',
    description: 'LED desk lamp with adjustable brightness',
    units: {
      primary: { name: 'Piece', symbol: 'Pcs', decimalPlaces: 0 }
    },
    pricing: {
      costPrice: 2200,
      sellingPrice: 2500,
      mrp: 2800
    },
    taxation: {
      hsnCode: '9405',
      taxable: true,
      gstRate: { cgst: 9, sgst: 9, igst: 18, cess: 0 }
    },
    inventory: {
      trackInventory: true,
      stockLevels: { minimum: 8, reorderLevel: 12, reorderQuantity: 20 }
    }
  }
];

const sampleVouchers = [
  {
    voucherType: 'sales',
    voucherNumber: 'SAL001',
    date: new Date('2024-01-15'),
    narration: 'Sale of laptops to ABC Corp',
    totals: {
      subtotal: 90000,
      discount: 0,
      taxableAmount: 90000,
      cgst: 8100,
      sgst: 8100,
      igst: 0,
      cess: 0,
      totalTax: 16200,
      roundOff: 0,
      grandTotal: 106200
    },
    status: 'approved'
  },
  {
    voucherType: 'purchase',
    voucherNumber: 'PUR001',
    date: new Date('2024-01-10'),
    narration: 'Purchase of office furniture',
    totals: {
      subtotal: 112500,
      discount: 0,
      taxableAmount: 112500,
      cgst: 10125,
      sgst: 10125,
      igst: 0,
      cess: 0,
      totalTax: 20250,
      roundOff: 0,
      grandTotal: 132750
    },
    status: 'approved'
  },
  {
    voucherType: 'payment',
    voucherNumber: 'PAY001',
    date: new Date('2024-01-20'),
    narration: 'Payment to supplier for stationery',
    totals: {
      subtotal: 25000,
      discount: 0,
      taxableAmount: 25000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      totalTax: 0,
      roundOff: 0,
      grandTotal: 25000
    },
    status: 'approved'
  },
  {
    voucherType: 'receipt',
    voucherNumber: 'REC001',
    date: new Date('2024-01-25'),
    narration: 'Receipt from customer for laptop sale',
    totals: {
      subtotal: 45000,
      discount: 0,
      taxableAmount: 45000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      totalTax: 0,
      roundOff: 0,
      grandTotal: 45000
    },
    status: 'approved'
  }
];

const createDemoData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finsync360', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find demo company
    const demoCompany = await Company.findOne({ name: 'Demo Company Ltd.' });
    if (!demoCompany) {
      console.log('Demo company not found. Please run "npm run demo:users" first.');
      process.exit(1);
    }

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@finsync360.com' });
    if (!adminUser) {
      console.log('Admin user not found. Please run "npm run demo:users" first.');
      process.exit(1);
    }

    console.log('Creating demo inventory items...');

    // Create sample items
    for (const itemData of sampleItems) {
      const existingItem = await Item.findOne({ code: itemData.code });
      if (existingItem) {
        console.log(`Item ${itemData.code} already exists, skipping...`);
        continue;
      }

      const item = new Item({
        ...itemData,
        company: demoCompany._id,
        createdBy: adminUser._id,
        isActive: true
      });

      await item.save();
      console.log(`✓ Created item: ${itemData.name} (${itemData.code})`);
    }

    console.log('\nCreating demo vouchers...');

    // Create sample vouchers
    for (const voucherData of sampleVouchers) {
      const existingVoucher = await Voucher.findOne({ voucherNumber: voucherData.voucherNumber });
      if (existingVoucher) {
        console.log(`Voucher ${voucherData.voucherNumber} already exists, skipping...`);
        continue;
      }

      const voucher = new Voucher({
        ...voucherData,
        company: demoCompany._id,
        createdBy: adminUser._id
      });

      await voucher.save();
      console.log(`✓ Created voucher: ${voucherData.voucherNumber} (${voucherData.type})`);
    }

    console.log('\n=== DEMO DATA CREATED ===');
    console.log('Inventory Items: 5');
    console.log('Vouchers: 4');
    console.log('========================');
    console.log('\nDemo data created successfully!');
    console.log('You can now login and explore the application with sample data.');

  } catch (error) {
    console.error('Error creating demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoData();
