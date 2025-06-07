const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Company = require('../../src/models/Company');
const Party = require('../../src/models/Party');
const Item = require('../../src/models/Item');
const Voucher = require('../../src/models/Voucher');

class TestDataHelper {
  constructor() {
    this.testData = {};
  }

  // Create test user
  async createTestUser(userData = {}) {
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919876543210',
      password: 'password123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    };

    const user = await User.create({ ...defaultUser, ...userData });
    this.testData.user = user;
    return user;
  }

  // Create test company
  async createTestCompany(companyData = {}, userId = null) {
    const user = userId || this.testData.user?._id;
    
    const defaultCompany = {
      name: 'Test Company Ltd.',
      displayName: 'Test Company',
      gstin: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      address: {
        line1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        country: 'India'
      },
      contact: {
        phone: '+919876543210',
        email: 'info@testcompany.com'
      },
      businessType: 'private_limited',
      industry: 'Technology',
      financialYear: {
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31')
      },
      taxation: {
        gstRegistered: true,
        gstType: 'regular'
      },
      users: [{
        user: user,
        role: 'admin',
        permissions: ['all']
      }],
      createdBy: user
    };

    const company = await Company.create({ ...defaultCompany, ...companyData });
    this.testData.company = company;
    
    // Update user with company
    if (this.testData.user) {
      this.testData.user.companies.push(company._id);
      await this.testData.user.save();
    }
    
    return company;
  }

  // Create test party
  async createTestParty(partyData = {}, companyId = null, userId = null) {
    const company = companyId || this.testData.company?._id;
    const user = userId || this.testData.user?._id;
    
    const defaultParty = {
      company,
      name: 'Test Customer',
      type: 'customer',
      category: 'business',
      gstin: '29ZYXWV9876E1Z5',
      contact: {
        phone: '+919876543211',
        email: 'customer@example.com'
      },
      addresses: [{
        type: 'both',
        line1: '456 Customer Street',
        city: 'Customer City',
        state: 'Customer State',
        pincode: '654321',
        country: 'India',
        isDefault: true
      }],
      creditLimit: {
        amount: 100000,
        days: 30
      },
      balances: {
        opening: {
          amount: 0,
          type: 'debit',
          asOn: new Date()
        },
        current: {
          amount: 0,
          type: 'debit'
        }
      },
      createdBy: user
    };

    const party = await Party.create({ ...defaultParty, ...partyData });
    this.testData.party = party;
    return party;
  }

  // Create test item
  async createTestItem(itemData = {}, companyId = null, userId = null) {
    const company = companyId || this.testData.company?._id;
    const user = userId || this.testData.user?._id;
    
    const defaultItem = {
      company,
      name: 'Test Product',
      code: 'TEST001',
      type: 'product',
      description: 'Test product description',
      units: {
        primary: {
          name: 'Pieces',
          symbol: 'Pcs',
          decimalPlaces: 0
        }
      },
      pricing: {
        costPrice: 100,
        sellingPrice: 150,
        mrp: 200
      },
      taxation: {
        hsnCode: '1234',
        taxable: true,
        gstRate: {
          cgst: 9,
          sgst: 9,
          igst: 18,
          cess: 0
        }
      },
      inventory: {
        trackInventory: true,
        stockLevels: {
          minimum: 10,
          maximum: 1000,
          reorderLevel: 20,
          reorderQuantity: 100
        },
        currentStock: [{
          quantity: 100,
          reservedQuantity: 0,
          availableQuantity: 100
        }]
      },
      createdBy: user
    };

    const item = await Item.create({ ...defaultItem, ...itemData });
    this.testData.item = item;
    return item;
  }

  // Create test voucher
  async createTestVoucher(voucherData = {}, companyId = null, userId = null, partyId = null) {
    const company = companyId || this.testData.company?._id;
    const user = userId || this.testData.user?._id;
    const party = partyId || this.testData.party?._id;
    
    const defaultVoucher = {
      company,
      voucherType: 'sales',
      voucherNumber: 'SAL2024-0001',
      date: new Date(),
      party,
      items: [{
        item: this.testData.item?._id,
        quantity: 5,
        rate: 150,
        amount: 750,
        taxable: true,
        cgst: 9,
        sgst: 9,
        igst: 0,
        cess: 0
      }],
      totals: {
        subtotal: 750,
        totalDiscount: 0,
        totalTax: 135,
        grandTotal: 885,
        taxBreakup: {
          cgst: 67.5,
          sgst: 67.5,
          igst: 0,
          cess: 0
        }
      },
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdBy: user
    };

    const voucher = await Voucher.create({ ...defaultVoucher, ...voucherData });
    this.testData.voucher = voucher;
    return voucher;
  }

  // Generate JWT token for testing
  generateAuthToken(userId = null) {
    const user = userId || this.testData.user?._id;
    return jwt.sign(
      { id: user, email: this.testData.user?.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  // Create complete test dataset
  async createCompleteTestData() {
    const user = await this.createTestUser();
    const company = await this.createTestCompany();
    const party = await this.createTestParty();
    const item = await this.createTestItem();
    const voucher = await this.createTestVoucher();
    
    return {
      user,
      company,
      party,
      item,
      voucher,
      token: this.generateAuthToken()
    };
  }

  // Create multiple test parties
  async createMultipleParties(count = 5, companyId = null, userId = null) {
    const parties = [];
    
    for (let i = 0; i < count; i++) {
      const party = await this.createTestParty({
        name: `Test Customer ${i + 1}`,
        contact: {
          phone: `+9198765432${10 + i}`,
          email: `customer${i + 1}@example.com`
        },
        gstin: `29ZYXWV987${i}E1Z5`
      }, companyId, userId);
      
      parties.push(party);
    }
    
    return parties;
  }

  // Create multiple test items
  async createMultipleItems(count = 5, companyId = null, userId = null) {
    const items = [];
    
    for (let i = 0; i < count; i++) {
      const item = await this.createTestItem({
        name: `Test Product ${i + 1}`,
        code: `TEST00${i + 1}`,
        pricing: {
          costPrice: 100 + (i * 10),
          sellingPrice: 150 + (i * 15),
          mrp: 200 + (i * 20)
        }
      }, companyId, userId);
      
      items.push(item);
    }
    
    return items;
  }

  // Create multiple test vouchers
  async createMultipleVouchers(count = 5, companyId = null, userId = null, partyId = null) {
    const vouchers = [];
    
    for (let i = 0; i < count; i++) {
      const voucher = await this.createTestVoucher({
        voucherNumber: `SAL2024-000${i + 1}`,
        totals: {
          subtotal: 750 + (i * 100),
          totalDiscount: 0,
          totalTax: 135 + (i * 18),
          grandTotal: 885 + (i * 118)
        }
      }, companyId, userId, partyId);
      
      vouchers.push(voucher);
    }
    
    return vouchers;
  }

  // Clean up test data
  async cleanup() {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Party.deleteMany({});
    await Item.deleteMany({});
    await Voucher.deleteMany({});
    this.testData = {};
  }

  // Get test data
  getTestData() {
    return this.testData;
  }
}

module.exports = TestDataHelper;
