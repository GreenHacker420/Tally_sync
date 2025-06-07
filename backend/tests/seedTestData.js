const mongoose = require('mongoose');
const TestDataHelper = require('./helpers/testData');
const logger = require('../src/utils/logger');

class TestDataSeeder {
  constructor() {
    this.testHelper = new TestDataHelper();
    this.seededData = {};
  }

  async seedCompleteDataset() {
    try {
      logger.info('Starting test data seeding...');

      // Create primary test data
      const primaryData = await this.testHelper.createCompleteTestData();
      this.seededData.primary = primaryData;

      // Create additional companies
      const additionalCompanies = await this.createAdditionalCompanies(primaryData.user._id);
      this.seededData.additionalCompanies = additionalCompanies;

      // Create multiple parties for each company
      const partiesData = await this.createMultiplePartiesForCompanies();
      this.seededData.parties = partiesData;

      // Create multiple items for each company
      const itemsData = await this.createMultipleItemsForCompanies();
      this.seededData.items = itemsData;

      // Create multiple vouchers for each company
      const vouchersData = await this.createMultipleVouchersForCompanies();
      this.seededData.vouchers = vouchersData;

      // Create test scenarios
      await this.createTestScenarios();

      logger.info('Test data seeding completed successfully');
      return this.seededData;
    } catch (error) {
      logger.error('Test data seeding failed:', error);
      throw error;
    }
  }

  async createAdditionalCompanies(userId) {
    const companies = [];

    // Manufacturing Company
    const manufacturingCompany = await this.testHelper.createTestCompany({
      name: 'ABC Manufacturing Ltd.',
      displayName: 'ABC Manufacturing',
      gstin: '29ABCMFG1234F1Z5',
      pan: 'ABCMF1234G',
      businessType: 'private_limited',
      industry: 'Manufacturing',
      addresses: [{
        type: 'both',
        line1: 'Industrial Area, Plot 123',
        line2: 'Sector 45',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122001',
        country: 'India',
        isDefault: true
      }]
    }, userId);
    companies.push(manufacturingCompany);

    // Trading Company
    const tradingCompany = await this.testHelper.createTestCompany({
      name: 'XYZ Trading Pvt. Ltd.',
      displayName: 'XYZ Trading',
      gstin: '27XYZTRD5678F1Z5',
      pan: 'XYZTR5678H',
      businessType: 'private_limited',
      industry: 'Trading',
      addresses: [{
        type: 'both',
        line1: 'Commercial Complex, Shop 45',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        isDefault: true
      }]
    }, userId);
    companies.push(tradingCompany);

    // Service Company
    const serviceCompany = await this.testHelper.createTestCompany({
      name: 'TechServ Solutions LLP',
      displayName: 'TechServ',
      gstin: '29TECHSV9012F1Z5',
      pan: 'TECHS9012J',
      businessType: 'llp',
      industry: 'Technology',
      addresses: [{
        type: 'both',
        line1: 'IT Park, Building A, Floor 5',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
        isDefault: true
      }]
    }, userId);
    companies.push(serviceCompany);

    return companies;
  }

  async createMultiplePartiesForCompanies() {
    const partiesData = {};

    for (const [key, company] of Object.entries(this.seededData.additionalCompanies || {})) {
      const customers = [];
      const suppliers = [];

      // Create customers
      for (let i = 1; i <= 5; i++) {
        const customer = await this.testHelper.createTestParty({
          name: `Customer ${i} - ${company.displayName}`,
          type: 'customer',
          category: i <= 3 ? 'business' : 'individual',
          gstin: i <= 3 ? `29CUST${i.toString().padStart(3, '0')}${company.name.substring(0, 3).toUpperCase()}F1Z5` : undefined,
          contact: {
            phone: `+9198765432${10 + i}`,
            email: `customer${i}@${company.displayName.toLowerCase().replace(/\s+/g, '')}.com`
          },
          addresses: [{
            type: 'both',
            line1: `Customer ${i} Address Line 1`,
            city: `Customer City ${i}`,
            state: 'Test State',
            pincode: `12345${i}`,
            country: 'India',
            isDefault: true
          }],
          creditLimit: {
            amount: 50000 + (i * 10000),
            days: 30 + (i * 5)
          }
        }, company._id, this.seededData.primary.user._id);
        customers.push(customer);
      }

      // Create suppliers
      for (let i = 1; i <= 3; i++) {
        const supplier = await this.testHelper.createTestParty({
          name: `Supplier ${i} - ${company.displayName}`,
          type: 'supplier',
          category: 'business',
          gstin: `29SUPP${i.toString().padStart(3, '0')}${company.name.substring(0, 3).toUpperCase()}F1Z5`,
          contact: {
            phone: `+9198765433${10 + i}`,
            email: `supplier${i}@${company.displayName.toLowerCase().replace(/\s+/g, '')}.com`
          },
          addresses: [{
            type: 'both',
            line1: `Supplier ${i} Address Line 1`,
            city: `Supplier City ${i}`,
            state: 'Test State',
            pincode: `54321${i}`,
            country: 'India',
            isDefault: true
          }]
        }, company._id, this.seededData.primary.user._id);
        suppliers.push(supplier);
      }

      partiesData[key] = { customers, suppliers };
    }

    return partiesData;
  }

  async createMultipleItemsForCompanies() {
    const itemsData = {};

    for (const [key, company] of Object.entries(this.seededData.additionalCompanies || {})) {
      const items = [];

      // Create products
      const productTypes = [
        { name: 'Laptop', code: 'LAP', costPrice: 45000, sellingPrice: 55000, hsnCode: '8471' },
        { name: 'Mobile Phone', code: 'MOB', costPrice: 15000, sellingPrice: 20000, hsnCode: '8517' },
        { name: 'Tablet', code: 'TAB', costPrice: 25000, sellingPrice: 30000, hsnCode: '8471' },
        { name: 'Headphones', code: 'HEAD', costPrice: 2000, sellingPrice: 3000, hsnCode: '8518' },
        { name: 'Keyboard', code: 'KEY', costPrice: 1500, sellingPrice: 2000, hsnCode: '8471' }
      ];

      for (let i = 0; i < productTypes.length; i++) {
        const product = productTypes[i];
        const item = await this.testHelper.createTestItem({
          name: `${product.name} - ${company.displayName}`,
          code: `${product.code}${(i + 1).toString().padStart(3, '0')}`,
          type: 'product',
          description: `${product.name} for ${company.displayName}`,
          pricing: {
            costPrice: product.costPrice,
            sellingPrice: product.sellingPrice,
            mrp: product.sellingPrice * 1.2
          },
          taxation: {
            hsnCode: product.hsnCode,
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
              quantity: 50 + (i * 10),
              reservedQuantity: 0,
              availableQuantity: 50 + (i * 10)
            }]
          }
        }, company._id, this.seededData.primary.user._id);
        items.push(item);
      }

      // Create services
      const serviceTypes = [
        { name: 'Installation Service', code: 'INST', sellingPrice: 5000, sacCode: '998314' },
        { name: 'Maintenance Service', code: 'MAINT', sellingPrice: 3000, sacCode: '998314' },
        { name: 'Consulting Service', code: 'CONS', sellingPrice: 10000, sacCode: '998314' }
      ];

      for (let i = 0; i < serviceTypes.length; i++) {
        const service = serviceTypes[i];
        const item = await this.testHelper.createTestItem({
          name: `${service.name} - ${company.displayName}`,
          code: `${service.code}${(i + 1).toString().padStart(3, '0')}`,
          type: 'service',
          description: `${service.name} for ${company.displayName}`,
          pricing: {
            sellingPrice: service.sellingPrice
          },
          taxation: {
            sacCode: service.sacCode,
            taxable: true,
            gstRate: {
              cgst: 9,
              sgst: 9,
              igst: 18,
              cess: 0
            }
          },
          inventory: {
            trackInventory: false
          }
        }, company._id, this.seededData.primary.user._id);
        items.push(item);
      }

      itemsData[key] = items;
    }

    return itemsData;
  }

  async createMultipleVouchersForCompanies() {
    const vouchersData = {};

    for (const [key, company] of Object.entries(this.seededData.additionalCompanies || {})) {
      const vouchers = [];
      const parties = this.seededData.parties[key];
      const items = this.seededData.items[key];

      if (!parties || !items) continue;

      // Create sales vouchers
      for (let i = 1; i <= 5; i++) {
        const customer = parties.customers[i % parties.customers.length];
        const item = items[i % items.length];
        
        const voucher = await this.testHelper.createTestVoucher({
          voucherType: 'sales',
          voucherNumber: `SAL${new Date().getFullYear()}-${i.toString().padStart(4, '0')}`,
          date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // i days ago
          dueDate: new Date(Date.now() + ((30 - i) * 24 * 60 * 60 * 1000)), // 30-i days from now
          items: [{
            item: item._id,
            quantity: 2 + i,
            rate: item.pricing.sellingPrice,
            taxable: true,
            cgst: 9,
            sgst: 9,
            igst: 0,
            cess: 0
          }],
          status: i <= 3 ? 'pending' : 'approved'
        }, company._id, this.seededData.primary.user._id, customer._id);
        vouchers.push(voucher);
      }

      // Create purchase vouchers
      for (let i = 1; i <= 3; i++) {
        const supplier = parties.suppliers[i % parties.suppliers.length];
        const item = items[i % items.length];
        
        const voucher = await this.testHelper.createTestVoucher({
          voucherType: 'purchase',
          voucherNumber: `PUR${new Date().getFullYear()}-${i.toString().padStart(4, '0')}`,
          date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          items: [{
            item: item._id,
            quantity: 10 + i,
            rate: item.pricing.costPrice || item.pricing.sellingPrice * 0.8,
            taxable: true,
            cgst: 9,
            sgst: 9,
            igst: 0,
            cess: 0
          }],
          status: 'approved'
        }, company._id, this.seededData.primary.user._id, supplier._id);
        vouchers.push(voucher);
      }

      vouchersData[key] = vouchers;
    }

    return vouchersData;
  }

  async createTestScenarios() {
    // Scenario 1: Overdue invoices
    const overdueVoucher = await this.testHelper.createTestVoucher({
      voucherType: 'sales',
      voucherNumber: 'OVERDUE-001',
      date: new Date(Date.now() - (45 * 24 * 60 * 60 * 1000)), // 45 days ago
      dueDate: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)), // 15 days overdue
      status: 'pending'
    }, this.seededData.primary.company._id, this.seededData.primary.user._id, this.seededData.primary.party._id);

    // Scenario 2: Low stock items
    const lowStockItem = await this.testHelper.createTestItem({
      name: 'Low Stock Product',
      code: 'LOWSTOCK001',
      inventory: {
        trackInventory: true,
        stockLevels: {
          reorderLevel: 50
        },
        currentStock: [{
          quantity: 5, // Below reorder level
          availableQuantity: 5
        }]
      }
    }, this.seededData.primary.company._id, this.seededData.primary.user._id);

    // Scenario 3: High value transactions
    const highValueVoucher = await this.testHelper.createTestVoucher({
      voucherType: 'sales',
      voucherNumber: 'HIGHVAL-001',
      totals: {
        subtotal: 500000,
        totalTax: 90000,
        grandTotal: 590000
      }
    }, this.seededData.primary.company._id, this.seededData.primary.user._id, this.seededData.primary.party._id);

    this.seededData.scenarios = {
      overdueVoucher,
      lowStockItem,
      highValueVoucher
    };
  }

  async cleanup() {
    await this.testHelper.cleanup();
    this.seededData = {};
  }

  getSeededData() {
    return this.seededData;
  }

  async exportTestData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        companies: Object.keys(this.seededData.additionalCompanies || {}).length + 1,
        parties: Object.values(this.seededData.parties || {}).reduce((sum, p) => sum + p.customers.length + p.suppliers.length, 0),
        items: Object.values(this.seededData.items || {}).reduce((sum, items) => sum + items.length, 0),
        vouchers: Object.values(this.seededData.vouchers || {}).reduce((sum, vouchers) => sum + vouchers.length, 0)
      },
      data: this.seededData
    };

    return exportData;
  }
}

module.exports = TestDataSeeder;
