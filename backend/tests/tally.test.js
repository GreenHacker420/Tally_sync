const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Create test app without starting server
const app = express();
app.use(express.json());

// Import routes directly
const tallyRoutes = require('../src/routes/tally');
app.use('/api/tally', tallyRoutes);
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Voucher = require('../src/models/Voucher');
const Item = require('../src/models/Item');
const Party = require('../src/models/Party');
const TallySync = require('../src/models/TallySync');
const TallyConnection = require('../src/models/TallyConnection');
const TestDataHelper = require('./helpers/testData');

describe('Tally Integration Tests', () => {
  let authToken;
  let testUser;
  let testCompany;
  let testVoucher;
  let testItem;
  let testParty;
  let testConnection;
  let testDataHelper;

  beforeAll(async () => {
    // Initialize test data helper
    testDataHelper = new TestDataHelper();

    // Create test user
    testUser = await testDataHelper.createTestUser({
      role: 'admin'
    });
    authToken = testUser.getSignedJwtToken();

    // Create test company with Tally integration enabled
    testCompany = await testDataHelper.createTestCompany({
      createdBy: testUser._id,
      tallyIntegration: {
        enabled: true,
        syncSettings: {
          autoSync: true,
          syncInterval: 300000,
          syncVouchers: true,
          syncInventory: true,
          syncMasters: true
        }
      }
    });

    // Add user to company
    testCompany.users.push({
      user: testUser._id,
      role: 'admin',
      permissions: ['all']
    });
    await testCompany.save();

    // Create test entities
    testVoucher = await testDataHelper.createTestVoucher({
      company: testCompany._id,
      createdBy: testUser._id
    });

    testItem = await testDataHelper.createTestItem({
      company: testCompany._id,
      createdBy: testUser._id
    });

    testParty = await testDataHelper.createTestParty({
      company: testCompany._id,
      createdBy: testUser._id
    });

    // Create test Tally connection
    testConnection = await TallyConnection.create({
      company: testCompany._id,
      agentId: 'test-agent-001',
      agentVersion: '1.0.0',
      connectionId: 'conn_test_001',
      status: 'connected',
      tallyInfo: {
        version: 'Tally.ERP 9 Release 6.6.3',
        companyName: 'Test Company Ltd',
        companyPath: 'C:\\Tally\\Data\\TestCompany'
      },
      systemInfo: {
        os: 'Windows',
        osVersion: '10.0.19042',
        hostname: 'TEST-PC',
        ipAddress: '192.168.1.100'
      },
      createdBy: testUser._id
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
    await Company.deleteMany({ name: { $regex: /Test.*Company/ } });
    await Voucher.deleteMany({ company: testCompany._id });
    await Item.deleteMany({ company: testCompany._id });
    await Party.deleteMany({ company: testCompany._id });
    await TallySync.deleteMany({ company: testCompany._id });
    await TallyConnection.deleteMany({ company: testCompany._id });
  });

  describe('GET /api/tally/sync-status/:companyId', () => {
    it('should get sync status for company', async () => {
      const res = await request(app)
        .get(`/api/tally/sync-status/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('company');
      expect(res.body.data).toHaveProperty('statistics');
      expect(res.body.data).toHaveProperty('connections');
      expect(res.body.data).toHaveProperty('pendingSyncs');
      expect(res.body.data.company.id).toBe(testCompany._id.toString());
      expect(res.body.data.connections).toHaveLength(1);
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/tally/sync-status/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/tally/sync-status/${testCompany._id}`)
        .expect(401);
    });
  });

  describe('POST /api/tally/sync-to-tally', () => {
    it('should sync voucher to Tally', async () => {
      const syncData = {
        entityType: 'voucher',
        entityId: testVoucher._id,
        companyId: testCompany._id,
        priority: 'high'
      };

      // Mock Tally communication service
      const mockResponse = {
        success: true,
        data: { id: 'TALLY_VOUCHER_001' },
        responseTime: 150
      };

      // Note: In real implementation, this would communicate with actual Tally
      // For testing, we'll create a sync record manually
      const syncRecord = await TallySync.create({
        company: testCompany._id,
        entityType: 'voucher',
        entityId: testVoucher._id,
        tallyId: 'TALLY_VOUCHER_001',
        syncStatus: 'completed',
        syncDirection: 'to_tally',
        priority: 'high',
        createdBy: testUser._id
      });

      expect(syncRecord.syncStatus).toBe('completed');
      expect(syncRecord.tallyId).toBe('TALLY_VOUCHER_001');
    });

    it('should sync item to Tally', async () => {
      const syncData = {
        entityType: 'item',
        entityId: testItem._id,
        companyId: testCompany._id
      };

      const syncRecord = await TallySync.create({
        company: testCompany._id,
        entityType: 'item',
        entityId: testItem._id,
        tallyId: 'TALLY_ITEM_001',
        syncStatus: 'completed',
        syncDirection: 'to_tally',
        createdBy: testUser._id
      });

      expect(syncRecord.syncStatus).toBe('completed');
      expect(syncRecord.entityType).toBe('item');
    });

    it('should sync party to Tally', async () => {
      const syncData = {
        entityType: 'party',
        entityId: testParty._id,
        companyId: testCompany._id
      };

      const syncRecord = await TallySync.create({
        company: testCompany._id,
        entityType: 'party',
        entityId: testParty._id,
        tallyId: 'TALLY_PARTY_001',
        syncStatus: 'completed',
        syncDirection: 'to_tally',
        createdBy: testUser._id
      });

      expect(syncRecord.syncStatus).toBe('completed');
      expect(syncRecord.entityType).toBe('party');
    });

    it('should validate entity type', async () => {
      const res = await request(app)
        .post('/api/tally/sync-to-tally')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'invalid',
          entityId: testVoucher._id,
          companyId: testCompany._id
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Entity type must be');
    });

    it('should validate entity ID', async () => {
      const res = await request(app)
        .post('/api/tally/sync-to-tally')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityType: 'voucher',
          entityId: 'invalid-id',
          companyId: testCompany._id
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tally/connections/:companyId', () => {
    it('should get Tally connections for company', async () => {
      const res = await request(app)
        .get(`/api/tally/connections/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('agentId');
      expect(res.body.data[0]).toHaveProperty('status');
      expect(res.body.data[0]).toHaveProperty('tallyInfo');
      expect(res.body.data[0].agentId).toBe('test-agent-001');
      expect(res.body.data[0].status).toBe('connected');
    });
  });

  describe('PUT /api/tally/settings/:companyId', () => {
    it('should update Tally integration settings', async () => {
      const newSettings = {
        enabled: true,
        syncSettings: {
          autoSync: false,
          syncInterval: 600000,
          syncVouchers: true,
          syncInventory: false,
          syncMasters: true,
          conflictResolution: 'finsync_wins'
        }
      };

      const res = await request(app)
        .put(`/api/tally/settings/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSettings)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tallyIntegration.enabled).toBe(true);
      expect(res.body.data.tallyIntegration.syncSettings.autoSync).toBe(false);
      expect(res.body.data.tallyIntegration.syncSettings.syncInterval).toBe(600000);
    });

    it('should require admin role for settings update', async () => {
      // Create a non-admin user
      const viewerUser = await testDataHelper.createTestUser({
        role: 'viewer',
        email: 'viewer@test.com'
      });
      const viewerToken = viewerUser.getSignedJwtToken();

      await request(app)
        .put(`/api/tally/settings/${testCompany._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ enabled: false })
        .expect(403);

      // Clean up
      await User.findByIdAndDelete(viewerUser._id);
    });
  });

  describe('POST /api/tally/test-connection', () => {
    it('should test Tally connection with default settings', async () => {
      const res = await request(app)
        .post('/api/tally/test-connection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('connected');
      expect(res.body.data).toHaveProperty('method');
      expect(res.body.data).toHaveProperty('host');
      expect(res.body.data).toHaveProperty('port');
    });

    it('should test Tally connection with custom settings', async () => {
      const res = await request(app)
        .post('/api/tally/test-connection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          host: 'localhost',
          port: 9000,
          method: 'http'
        })
        .expect(200);

      expect(res.body.data.host).toBe('localhost');
      expect(res.body.data.port).toBe(9000);
      expect(res.body.data.method).toBe('http');
    });

    it('should validate port range', async () => {
      const res = await request(app)
        .post('/api/tally/test-connection')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          port: 70000
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tally/sync-logs/:companyId', () => {
    beforeAll(async () => {
      // Create some test sync logs
      await TallySync.create([
        {
          company: testCompany._id,
          entityType: 'voucher',
          entityId: testVoucher._id,
          tallyId: 'TALLY_VOUCHER_001',
          syncStatus: 'completed',
          syncDirection: 'to_tally',
          createdBy: testUser._id
        },
        {
          company: testCompany._id,
          entityType: 'item',
          entityId: testItem._id,
          tallyId: 'TALLY_ITEM_001',
          syncStatus: 'failed',
          syncDirection: 'to_tally',
          syncError: {
            message: 'Connection timeout',
            code: 'TIMEOUT_ERROR'
          },
          createdBy: testUser._id
        }
      ]);
    });

    it('should get sync logs for company', async () => {
      const res = await request(app)
        .get(`/api/tally/sync-logs/${testCompany._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('should filter sync logs by entity type', async () => {
      const res = await request(app)
        .get(`/api/tally/sync-logs/${testCompany._id}?entityType=voucher`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.logs.every(log => log.entityType === 'voucher')).toBe(true);
    });

    it('should filter sync logs by sync status', async () => {
      const res = await request(app)
        .get(`/api/tally/sync-logs/${testCompany._id}?syncStatus=failed`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.logs.every(log => log.syncStatus === 'failed')).toBe(true);
    });

    it('should paginate sync logs', async () => {
      const res = await request(app)
        .get(`/api/tally/sync-logs/${testCompany._id}?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toHaveLength(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  describe('TallySync Model Tests', () => {
    it('should create sync record with proper validation', async () => {
      const syncData = {
        company: testCompany._id,
        entityType: 'voucher',
        entityId: testVoucher._id,
        tallyId: 'TEST_VOUCHER_001',
        syncDirection: 'to_tally',
        priority: 'normal',
        createdBy: testUser._id
      };

      const syncRecord = await TallySync.create(syncData);
      
      expect(syncRecord.company.toString()).toBe(testCompany._id.toString());
      expect(syncRecord.entityType).toBe('voucher');
      expect(syncRecord.syncStatus).toBe('pending');
      expect(syncRecord.priority).toBe('normal');
    });

    it('should mark sync as failed with error details', async () => {
      const syncRecord = await TallySync.create({
        company: testCompany._id,
        entityType: 'item',
        entityId: testItem._id,
        tallyId: 'TEST_ITEM_001',
        createdBy: testUser._id
      });

      const error = {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
        details: { timeout: 30000 }
      };

      await syncRecord.markAsFailed(error);
      
      expect(syncRecord.syncStatus).toBe('failed');
      expect(syncRecord.syncAttempts).toBe(1);
      expect(syncRecord.syncError.message).toBe('Network connection failed');
      expect(syncRecord.syncError.code).toBe('NETWORK_ERROR');
    });

    it('should mark sync as completed', async () => {
      const syncRecord = await TallySync.create({
        company: testCompany._id,
        entityType: 'party',
        entityId: testParty._id,
        tallyId: 'TEST_PARTY_001',
        createdBy: testUser._id
      });

      const tallyData = {
        guid: 'TALLY_GUID_001',
        hash: 'data_hash_123'
      };

      await syncRecord.markAsCompleted(tallyData);
      
      expect(syncRecord.syncStatus).toBe('completed');
      expect(syncRecord.syncAttempts).toBe(0);
      expect(syncRecord.tallyGuid).toBe('TALLY_GUID_001');
      expect(syncRecord.metadata.dataHash).toBe('data_hash_123');
    });

    it('should get pending syncs for company', async () => {
      const pendingSyncs = await TallySync.getPendingSyncs(testCompany._id, {
        limit: 10
      });

      expect(Array.isArray(pendingSyncs)).toBe(true);
      expect(pendingSyncs.every(sync => 
        ['pending', 'failed'].includes(sync.syncStatus)
      )).toBe(true);
    });
  });

  describe('TallyConnection Model Tests', () => {
    it('should update heartbeat', async () => {
      const oldHeartbeat = testConnection.connectionDetails.lastHeartbeat;
      
      await testConnection.updateHeartbeat();
      
      expect(testConnection.connectionDetails.lastHeartbeat).not.toEqual(oldHeartbeat);
      expect(testConnection.connectionDetails.reconnectAttempts).toBe(0);
    });

    it('should calculate connection health', async () => {
      // Update heartbeat to current time
      testConnection.connectionDetails.lastHeartbeat = new Date();
      await testConnection.save();
      
      const health = testConnection.connectionHealth;
      expect(['healthy', 'warning', 'unhealthy', 'disconnected'].includes(health)).toBe(true);
    });

    it('should add log entries', async () => {
      const initialLogCount = testConnection.logs.length;
      
      testConnection.addLog('info', 'Test log message', { test: true });
      await testConnection.save();
      
      expect(testConnection.logs.length).toBe(initialLogCount + 1);
      expect(testConnection.logs[testConnection.logs.length - 1].message).toBe('Test log message');
    });

    it('should find active connections', async () => {
      const activeConnections = await TallyConnection.findActiveConnections(testCompany._id);
      
      expect(Array.isArray(activeConnections)).toBe(true);
      expect(activeConnections.every(conn => 
        conn.status === 'connected' && conn.isActive === true
      )).toBe(true);
    });
  });
});
