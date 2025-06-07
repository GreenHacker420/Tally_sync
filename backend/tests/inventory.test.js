const request = require('supertest');
const app = require('../src/server');
const Item = require('../src/models/Item');
const TestDataHelper = require('./helpers/testData');
const path = require('path');
const fs = require('fs');

describe('Inventory Endpoints', () => {
  let testHelper;
  let testData;
  let token;

  beforeEach(async () => {
    testHelper = new TestDataHelper();
    testData = await testHelper.createCompleteTestData();
    token = testData.token;
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('GET /api/inventory/items', () => {
    beforeEach(async () => {
      await testHelper.createMultipleItems(5, testData.company._id, testData.user._id);
    });

    it('should get all items for company', async () => {
      const response = await request(app)
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(6); // 5 + 1 from test data
      expect(response.body.data.totalDocs).toBe(6);
    });

    it('should filter items by type', async () => {
      // Create service item
      await testHelper.createTestItem({
        name: 'Test Service',
        type: 'service',
        code: 'SRV001'
      }, testData.company._id, testData.user._id);

      const response = await request(app)
        .get('/api/inventory/items?type=service')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.docs[0].type).toBe('service');
    });

    it('should search items by name and code', async () => {
      const response = await request(app)
        .get('/api/inventory/items?search=TEST001')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
      expect(response.body.data.docs[0].code).toContain('TEST001');
    });

    it('should filter low stock items', async () => {
      // Create item with low stock
      await testHelper.createTestItem({
        name: 'Low Stock Item',
        code: 'LOW001',
        inventory: {
          trackInventory: true,
          stockLevels: {
            reorderLevel: 50
          },
          currentStock: [{
            quantity: 10,
            availableQuantity: 10
          }]
        }
      }, testData.company._id, testData.user._id);

      const response = await request(app)
        .get('/api/inventory/items?lowStock=true')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
    });

    it('should filter out of stock items', async () => {
      // Create out of stock item
      await testHelper.createTestItem({
        name: 'Out of Stock Item',
        code: 'OUT001',
        inventory: {
          trackInventory: true,
          currentStock: [{
            quantity: 0,
            availableQuantity: 0
          }]
        }
      }, testData.company._id, testData.user._id);

      const response = await request(app)
        .get('/api/inventory/items?outOfStock=true')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs.length).toBeGreaterThan(0);
    });

    it('should paginate items', async () => {
      const response = await request(app)
        .get('/api/inventory/items?page=1&limit=3')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(3);
    });
  });

  describe('GET /api/inventory/items/:id', () => {
    it('should get single item by ID', async () => {
      const response = await request(app)
        .get(`/api/inventory/items/${testData.item._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testData.item._id.toString());
      expect(response.body.data.name).toBe('Test Product');
      expect(response.body.data.code).toBe('TEST001');
      expect(response.body.data.pricing).toBeDefined();
      expect(response.body.data.inventory).toBeDefined();
    });

    it('should not get item from different company', async () => {
      const otherCompany = await testHelper.createTestCompany({
        name: 'Other Company',
        gstin: '29ABCDE5678F1Z5'
      }, testData.user._id);

      const otherItem = await testHelper.createTestItem({
        name: 'Other Item',
        code: 'OTHER001'
      }, otherCompany._id, testData.user._id);

      const response = await request(app)
        .get(`/api/inventory/items/${otherItem._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });
  });

  describe('POST /api/inventory/items', () => {
    it('should create product item successfully', async () => {
      const itemData = {
        name: 'New Product',
        code: 'NEW001',
        type: 'product',
        description: 'New product description',
        units: {
          primary: {
            name: 'Kilograms',
            symbol: 'Kg',
            decimalPlaces: 2
          }
        },
        pricing: {
          costPrice: 80,
          sellingPrice: 120,
          mrp: 150
        },
        taxation: {
          hsnCode: '5678',
          taxable: true,
          gstRate: {
            cgst: 6,
            sgst: 6,
            igst: 12,
            cess: 0
          }
        },
        inventory: {
          trackInventory: true,
          stockLevels: {
            minimum: 5,
            maximum: 500,
            reorderLevel: 15,
            reorderQuantity: 50
          }
        }
      };

      const response = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Product');
      expect(response.body.data.code).toBe('NEW001');
      expect(response.body.data.type).toBe('product');
      expect(response.body.data.pricing.costPrice).toBe(80);

      // Verify item was created in database
      const item = await Item.findById(response.body.data._id);
      expect(item).toBeTruthy();
      expect(item.company.toString()).toBe(testData.company._id.toString());
    });

    it('should create service item successfully', async () => {
      const itemData = {
        name: 'Consulting Service',
        code: 'CONS001',
        type: 'service',
        description: 'Business consulting service',
        units: {
          primary: {
            name: 'Hours',
            symbol: 'Hrs',
            decimalPlaces: 2
          }
        },
        pricing: {
          sellingPrice: 2000
        },
        taxation: {
          sacCode: '998314',
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
      };

      const response = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('service');
      expect(response.body.data.taxation.sacCode).toBe('998314');
      expect(response.body.data.inventory.trackInventory).toBe(false);
    });

    it('should not create item with duplicate code', async () => {
      const itemData = {
        name: 'Duplicate Item',
        code: 'TEST001', // Same as existing item
        type: 'product'
      };

      const response = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item code already exists');
    });

    it('should not create item with invalid data', async () => {
      const itemData = {
        name: '', // Empty name
        type: 'invalid-type'
      };

      const response = await request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not create item without authentication', async () => {
      const itemData = {
        name: 'Test Item',
        type: 'product'
      };

      const response = await request(app)
        .post('/api/inventory/items')
        .send(itemData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/inventory/items/:id', () => {
    it('should update item successfully', async () => {
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated description',
        pricing: {
          costPrice: 110,
          sellingPrice: 165,
          mrp: 220
        }
      };

      const response = await request(app)
        .put(`/api/inventory/items/${testData.item._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product Name');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.pricing.costPrice).toBe(110);
    });

    it('should not update item with duplicate code', async () => {
      // Create another item
      const anotherItem = await testHelper.createTestItem({
        name: 'Another Item',
        code: 'ANOTHER001'
      }, testData.company._id, testData.user._id);

      const updateData = {
        code: 'ANOTHER001' // Try to use existing code
      };

      const response = await request(app)
        .put(`/api/inventory/items/${testData.item._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item code already exists');
    });

    it('should not update non-existent item', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/inventory/items/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });
  });

  describe('DELETE /api/inventory/items/:id', () => {
    it('should delete item successfully (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/inventory/items/${testData.item._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item deleted successfully');

      // Verify item was soft deleted
      const item = await Item.findById(testData.item._id);
      expect(item).toBeTruthy();
      expect(item.isActive).toBe(false);
    });

    it('should not delete non-existent item', async () => {
      const response = await request(app)
        .delete('/api/inventory/items/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });
  });

  describe('POST /api/inventory/items/:id/upload', () => {
    it('should upload item images successfully', async () => {
      // Create a test image file
      const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
      
      // Ensure fixtures directory exists
      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      
      // Create a simple test image (1x1 pixel JPEG)
      const testImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0xFF, 0xD9
      ]);
      
      fs.writeFileSync(testImagePath, testImageBuffer);

      const response = await request(app)
        .post(`/api/inventory/items/${testData.item._id}/upload`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .attach('images', testImagePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Files uploaded successfully');
      expect(response.body.data.images).toBeDefined();
      expect(response.body.data.images.length).toBeGreaterThan(0);

      // Clean up test file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it('should not upload files for non-existent item', async () => {
      const response = await request(app)
        .post('/api/inventory/items/507f1f77bcf86cd799439011/upload')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', testData.company._id.toString())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });
  });
});
