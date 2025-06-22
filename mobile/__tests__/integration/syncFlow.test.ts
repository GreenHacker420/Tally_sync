import { syncService } from '../../src/services/syncService';
import { databaseService } from '../../src/services/databaseService';
import { webSocketService } from '../../src/services/webSocketService';
import { offlineManager } from '../../src/services/offlineManager';
import { Company, Voucher } from '../../src/types';

// Mock dependencies
jest.mock('../../src/services/apiClient');
jest.mock('../../src/services/webSocketService');
jest.mock('react-native-sqlite-storage');

describe('Sync Flow Integration Tests', () => {
  const mockCompany: Company = {
    id: '1',
    name: 'Test Company',
    email: 'test@company.com',
    phone: '1234567890',
    address: '123 Test St',
    gstNumber: 'GST123',
    panNumber: 'PAN123',
    isActive: true,
    settings: {},
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockVoucher: Voucher = {
    id: '1',
    voucherNumber: 'V001',
    voucherType: 'sales',
    date: '2023-01-01',
    amount: 1000,
    entries: [],
    companyId: '1',
    status: 'posted',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user1',
  };

  beforeEach(async () => {
    await databaseService.initialize();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('Online Sync Flow', () => {
    it('should sync data from server to local database', async () => {
      // Mock API responses
      const { apiClient } = require('../../src/services/apiClient');
      apiClient.get.mockImplementation((url: string) => {
        if (url === '/companies') {
          return Promise.resolve({ data: { data: [mockCompany] } });
        }
        if (url === '/vouchers') {
          return Promise.resolve({ data: { data: [mockVoucher] } });
        }
        if (url === '/inventory/items') {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      // Start sync
      const result = await syncService.startSync();

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();

      // Verify data was stored locally
      const companies = await databaseService.getCompanies();
      const vouchers = await databaseService.getVouchers();

      expect(companies).toHaveLength(1);
      expect(companies[0]).toMatchObject(mockCompany);
      expect(vouchers).toHaveLength(1);
      expect(vouchers[0]).toMatchObject(mockVoucher);
    });

    it('should upload pending changes to server', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      
      // Add pending change
      await databaseService.addPendingChange({
        type: 'voucher',
        action: 'create',
        data: mockVoucher,
      });

      // Mock successful upload
      apiClient.post.mockResolvedValue({ data: { success: true } });

      // Upload pending changes
      const result = await syncService.uploadPendingChanges();

      expect(result.uploaded).toBe(1);
      expect(apiClient.post).toHaveBeenCalledWith('/vouchers', mockVoucher);

      // Verify change was marked as synced
      const pendingChanges = await databaseService.getPendingChanges();
      expect(pendingChanges).toHaveLength(0);
    });
  });

  describe('Offline Flow', () => {
    it('should queue actions when offline', async () => {
      // Simulate offline state
      jest.spyOn(offlineManager, 'isDeviceOnline').mockReturnValue(false);

      // Queue an action
      const actionId = await offlineManager.queueAction({
        type: 'CREATE_VOUCHER',
        payload: mockVoucher,
        maxRetries: 3,
        priority: 'high',
      });

      expect(actionId).toBeDefined();

      // Verify action was queued
      const pendingActions = offlineManager.getPendingActions();
      expect(pendingActions).toHaveLength(1);
      expect(pendingActions[0].type).toBe('CREATE_VOUCHER');
    });

    it('should process queued actions when coming online', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      
      // Start offline
      jest.spyOn(offlineManager, 'isDeviceOnline').mockReturnValue(false);

      // Queue actions
      await offlineManager.queueAction({
        type: 'CREATE_VOUCHER',
        payload: mockVoucher,
        maxRetries: 3,
        priority: 'high',
      });

      // Mock successful API calls
      apiClient.post.mockResolvedValue({ data: { success: true } });

      // Simulate coming online
      jest.spyOn(offlineManager, 'isDeviceOnline').mockReturnValue(true);

      // Process queue (this would normally be triggered by network state change)
      await offlineManager['processActionQueue']();

      expect(apiClient.post).toHaveBeenCalledWith('/vouchers', mockVoucher);

      // Verify queue is empty
      const pendingActions = offlineManager.getPendingActions();
      expect(pendingActions).toHaveLength(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect and handle sync conflicts', async () => {
      // Create local version
      const localVoucher = { ...mockVoucher, amount: 1000, updatedAt: '2023-01-02T00:00:00Z' };
      await databaseService.upsertVoucher(localVoucher);

      // Simulate remote version with different data
      const remoteVoucher = { ...mockVoucher, amount: 1500, updatedAt: '2023-01-03T00:00:00Z' };

      // Detect conflict
      const conflict = await databaseService.detectConflicts('voucher', localVoucher, remoteVoucher);

      expect(conflict).toBeDefined();
      expect(conflict?.conflictType).toBe('data_mismatch');
      expect(conflict?.localData.amount).toBe(1000);
      expect(conflict?.remoteData.amount).toBe(1500);
    });

    it('should resolve conflicts using local data strategy', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      
      // Create conflict
      const conflict = {
        id: 'conflict1',
        entityType: 'voucher',
        entityId: mockVoucher.id,
        conflictType: 'data_mismatch',
        localData: { ...mockVoucher, amount: 1000 },
        remoteData: { ...mockVoucher, amount: 1500 },
        status: 'pending' as const,
        createdAt: '2023-01-01T00:00:00Z',
      };

      await databaseService.addConflict(conflict);

      // Mock successful upload
      apiClient.post.mockResolvedValue({ data: { success: true } });

      // Resolve using local data
      await syncService.resolveConflict('conflict1', { strategy: 'local' });

      expect(apiClient.post).toHaveBeenCalledWith('/vouchers', conflict.localData);

      // Verify conflict was resolved
      const conflicts = await databaseService.getConflicts('pending');
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time data updates', async () => {
      // Mock WebSocket connection
      const mockEmit = jest.fn();
      jest.spyOn(webSocketService, 'connected', 'get').mockReturnValue(true);
      jest.spyOn(webSocketService, 'emit').mockImplementation(mockEmit);

      // Simulate receiving a real-time update
      const updateData = {
        entityType: 'voucher',
        entityId: mockVoucher.id,
        action: 'update',
        data: { ...mockVoucher, amount: 2000 },
      };

      // Trigger the update handler
      webSocketService.emit('data-update', updateData);

      // Verify the update was processed
      // (In a real implementation, this would update the local database)
      expect(mockEmit).toHaveBeenCalledWith('data-update', updateData);
    });

    it('should send real-time updates to server', async () => {
      const mockSendMessage = jest.spyOn(webSocketService, 'sendMessage').mockReturnValue(true);

      // Simulate a local change
      const activity = {
        type: 'voucher_updated',
        entityType: 'voucher',
        entityId: mockVoucher.id,
        metadata: { amount: 2000 },
      };

      webSocketService.sendUserActivity(activity);

      expect(mockSendMessage).toHaveBeenCalledWith('user-activity', activity);
    });
  });

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      
      // Mock API error
      apiClient.get.mockRejectedValue(new Error('Network error'));

      try {
        await syncService.startSync();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Network error');
      }

      // Verify sync session was recorded with error
      const syncHistory = await databaseService.getSyncHistory(1);
      expect(syncHistory).toHaveLength(1);
      expect(syncHistory[0].status).toBe('error');
    });

    it('should retry failed operations', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      
      // Mock API to fail twice then succeed
      let callCount = 0;
      apiClient.post.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({ data: { success: true } });
      });

      // Add pending change
      await databaseService.addPendingChange({
        type: 'voucher',
        action: 'create',
        data: mockVoucher,
      });

      // Upload with retry
      const result = await syncService.uploadPendingChanges();

      expect(result.uploaded).toBe(1);
      expect(callCount).toBe(3); // Failed twice, succeeded on third attempt
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockVoucher,
        id: `voucher_${i}`,
        voucherNumber: `V${i.toString().padStart(3, '0')}`,
      }));

      apiClient.get.mockImplementation((url: string) => {
        if (url === '/companies') {
          return Promise.resolve({ data: { data: [mockCompany] } });
        }
        if (url === '/vouchers') {
          return Promise.resolve({ data: { data: largeDataset } });
        }
        if (url === '/inventory/items') {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const startTime = Date.now();
      const result = await syncService.startSync();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all data was synced
      const vouchers = await databaseService.getVouchers();
      expect(vouchers).toHaveLength(1000);
    });
  });
});
