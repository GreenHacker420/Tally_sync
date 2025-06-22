import { databaseService } from '../../src/services/databaseService';
import { Company, Voucher, InventoryItem } from '../../src/types';

// Mock SQLite
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => ({
    executeSql: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('DatabaseService', () => {
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

  const mockInventoryItem: InventoryItem = {
    id: '1',
    name: 'Test Item',
    code: 'ITEM001',
    description: 'Test item description',
    category: 'Test Category',
    unit: 'pcs',
    rate: 100,
    currentStock: 50,
    reorderLevel: 10,
    maxLevel: 100,
    companyId: '1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    await databaseService.initialize();
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('Company Operations', () => {
    it('should upsert a company', async () => {
      const result = await databaseService.upsertCompany(mockCompany);
      expect(result).toBe(mockCompany.id);
    });

    it('should get companies', async () => {
      await databaseService.upsertCompany(mockCompany);
      const companies = await databaseService.getCompanies();
      expect(companies).toHaveLength(1);
      expect(companies[0]).toMatchObject(mockCompany);
    });

    it('should get company by ID', async () => {
      await databaseService.upsertCompany(mockCompany);
      const company = await databaseService.getCompanyById(mockCompany.id);
      expect(company).toMatchObject(mockCompany);
    });

    it('should delete a company', async () => {
      await databaseService.upsertCompany(mockCompany);
      await databaseService.deleteCompany(mockCompany.id);
      const company = await databaseService.getCompanyById(mockCompany.id);
      expect(company).toBeNull();
    });
  });

  describe('Voucher Operations', () => {
    beforeEach(async () => {
      await databaseService.upsertCompany(mockCompany);
    });

    it('should upsert a voucher', async () => {
      const result = await databaseService.upsertVoucher(mockVoucher);
      expect(result).toBe(mockVoucher.id);
    });

    it('should get vouchers', async () => {
      await databaseService.upsertVoucher(mockVoucher);
      const vouchers = await databaseService.getVouchers();
      expect(vouchers).toHaveLength(1);
      expect(vouchers[0]).toMatchObject(mockVoucher);
    });

    it('should get voucher by ID', async () => {
      await databaseService.upsertVoucher(mockVoucher);
      const voucher = await databaseService.getVoucherById(mockVoucher.id);
      expect(voucher).toMatchObject(mockVoucher);
    });

    it('should delete a voucher', async () => {
      await databaseService.upsertVoucher(mockVoucher);
      await databaseService.deleteVoucher(mockVoucher.id);
      const voucher = await databaseService.getVoucherById(mockVoucher.id);
      expect(voucher).toBeNull();
    });

    it('should filter vouchers by company', async () => {
      await databaseService.upsertVoucher(mockVoucher);
      const vouchers = await databaseService.getVouchers({ companyId: mockCompany.id });
      expect(vouchers).toHaveLength(1);
      expect(vouchers[0].companyId).toBe(mockCompany.id);
    });
  });

  describe('Inventory Operations', () => {
    beforeEach(async () => {
      await databaseService.upsertCompany(mockCompany);
    });

    it('should upsert an inventory item', async () => {
      const result = await databaseService.upsertInventoryItem(mockInventoryItem);
      expect(result).toBe(mockInventoryItem.id);
    });

    it('should get inventory items', async () => {
      await databaseService.upsertInventoryItem(mockInventoryItem);
      const items = await databaseService.getInventoryItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject(mockInventoryItem);
    });

    it('should get inventory item by ID', async () => {
      await databaseService.upsertInventoryItem(mockInventoryItem);
      const item = await databaseService.getInventoryItemById(mockInventoryItem.id);
      expect(item).toMatchObject(mockInventoryItem);
    });

    it('should delete an inventory item', async () => {
      await databaseService.upsertInventoryItem(mockInventoryItem);
      await databaseService.deleteInventoryItem(mockInventoryItem.id);
      const item = await databaseService.getInventoryItemById(mockInventoryItem.id);
      expect(item).toBeNull();
    });

    it('should filter items by low stock', async () => {
      const lowStockItem = { ...mockInventoryItem, currentStock: 5 };
      await databaseService.upsertInventoryItem(lowStockItem);
      
      const items = await databaseService.getInventoryItems({ lowStock: true });
      expect(items).toHaveLength(1);
      expect(items[0].currentStock).toBeLessThan(items[0].reorderLevel);
    });
  });

  describe('Settings Operations', () => {
    it('should set and get settings', async () => {
      await databaseService.setSetting('test_key', 'test_value');
      const value = await databaseService.getSetting('test_key');
      expect(value).toBe('test_value');
    });

    it('should return null for non-existent setting', async () => {
      const value = await databaseService.getSetting('non_existent');
      expect(value).toBeNull();
    });

    it('should delete a setting', async () => {
      await databaseService.setSetting('test_key', 'test_value');
      await databaseService.deleteSetting('test_key');
      const value = await databaseService.getSetting('test_key');
      expect(value).toBeNull();
    });
  });

  describe('Sync Operations', () => {
    it('should add pending changes', async () => {
      const change = {
        type: 'CREATE_VOUCHER',
        data: mockVoucher,
      };

      const changeId = await databaseService.addPendingChange(change);
      expect(changeId).toBeDefined();
    });

    it('should get pending changes', async () => {
      const change = {
        type: 'CREATE_VOUCHER',
        data: mockVoucher,
      };

      await databaseService.addPendingChange(change);
      const changes = await databaseService.getPendingChanges();
      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(change.type);
    });

    it('should mark changes as synced', async () => {
      const change = {
        type: 'CREATE_VOUCHER',
        data: mockVoucher,
      };

      const changeId = await databaseService.addPendingChange(change);
      await databaseService.markChangeAsSynced(changeId);
      
      const changes = await databaseService.getPendingChanges();
      expect(changes).toHaveLength(0);
    });
  });

  describe('Cache Operations', () => {
    it('should set and get cache data', async () => {
      const testData = { key: 'value', number: 123 };
      await databaseService.setCache('test_cache', testData);
      
      const cachedData = await databaseService.getCache('test_cache');
      expect(cachedData).toEqual(testData);
    });

    it('should return null for expired cache', async () => {
      const testData = { key: 'value' };
      await databaseService.setCache('test_cache', testData, -1); // Expired 1 minute ago
      
      const cachedData = await databaseService.getCache('test_cache');
      expect(cachedData).toBeNull();
    });

    it('should clear expired cache', async () => {
      await databaseService.setCache('expired', { data: 'old' }, -1);
      await databaseService.setCache('valid', { data: 'new' }, 60);
      
      await databaseService.clearExpiredCache();
      
      const expiredData = await databaseService.getCache('expired');
      const validData = await databaseService.getCache('valid');
      
      expect(expiredData).toBeNull();
      expect(validData).toEqual({ data: 'new' });
    });
  });

  describe('Conflict Operations', () => {
    it('should add and get conflicts', async () => {
      const conflict = {
        entityType: 'voucher',
        entityId: '1',
        conflictType: 'data_mismatch',
        localData: { version: 1 },
        remoteData: { version: 2 },
        status: 'pending' as const,
      };

      const conflictId = await databaseService.addConflict(conflict);
      const conflicts = await databaseService.getConflicts();
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe(conflictId);
      expect(conflicts[0].entityType).toBe(conflict.entityType);
    });

    it('should resolve conflicts', async () => {
      const conflict = {
        entityType: 'voucher',
        entityId: '1',
        conflictType: 'data_mismatch',
        localData: { version: 1 },
        remoteData: { version: 2 },
        status: 'pending' as const,
      };

      const conflictId = await databaseService.addConflict(conflict);
      await databaseService.resolveConflict(conflictId, 'resolved');
      
      const conflicts = await databaseService.getConflicts('resolved');
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].status).toBe('resolved');
    });
  });
});
