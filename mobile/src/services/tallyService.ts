import { apiClient } from './apiClient';

export interface TallyConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  isActive: boolean;
  lastConnected?: string;
  version?: string;
  companyId: string;
}

export interface SyncStatus {
  companyId: string;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  lastSyncTime?: string;
  progress?: {
    current: number;
    total: number;
    stage: string;
  };
  stats?: {
    vouchers: { synced: number; failed: number };
    items: { synced: number; failed: number };
    parties: { synced: number; failed: number };
  };
}

export interface SyncLog {
  id: string;
  companyId: string;
  type: 'sync_to_tally' | 'sync_from_tally' | 'full_sync';
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SyncConflict {
  id: string;
  companyId: string;
  entityType: 'voucher' | 'item' | 'party';
  entityId: string;
  conflictType: 'data_mismatch' | 'duplicate' | 'missing';
  localData: Record<string, any>;
  tallyData: Record<string, any>;
  status: 'pending' | 'resolved';
  createdAt: string;
}

class TallyService {
  private readonly baseURL = '/tally';

  /**
   * Get Tally connections for a company
   */
  async getConnections(companyId: string): Promise<{
    success: boolean;
    data: TallyConnection[];
  }> {
    const response = await apiClient.get(`${this.baseURL}/connections/${companyId}`);
    return response.data;
  }

  /**
   * Test Tally connection
   */
  async testConnection(connectionData: {
    host: string;
    port: number;
    companyId: string;
  }): Promise<{
    success: boolean;
    data: {
      connected: boolean;
      version?: string;
      companies?: string[];
      message: string;
    };
  }> {
    const response = await apiClient.post(`${this.baseURL}/test-connection`, connectionData);
    return response.data;
  }

  /**
   * Get sync status for a company
   */
  async getSyncStatus(companyId: string): Promise<{
    success: boolean;
    data: SyncStatus;
  }> {
    const response = await apiClient.get(`${this.baseURL}/sync-status/${companyId}`);
    return response.data;
  }

  /**
   * Sync entity to Tally
   */
  async syncToTally(syncData: {
    entityType: 'voucher' | 'item' | 'party';
    entityId: string;
    companyId: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      tallyId: string;
      syncedAt: string;
    };
  }> {
    const response = await apiClient.post(`${this.baseURL}/sync-to-tally`, syncData);
    return response.data;
  }

  /**
   * Sync entity from Tally
   */
  async syncFromTally(syncData: {
    entityType: 'voucher' | 'item' | 'party';
    tallyId: string;
    companyId: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, any>;
  }> {
    const response = await apiClient.post(`${this.baseURL}/sync-from-tally`, syncData);
    return response.data;
  }

  /**
   * Perform full sync for a company
   */
  async performFullSync(companyId: string, options?: {
    direction?: 'to_tally' | 'from_tally' | 'bidirectional';
    entities?: ('vouchers' | 'items' | 'parties')[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    success: boolean;
    message: string;
    syncId: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/full-sync/${companyId}`, options);
    return response.data;
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(companyId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    success: boolean;
    data: SyncLog[];
    pagination: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/sync-logs/${companyId}`, { params });
    return response.data;
  }

  /**
   * Get sync conflicts
   */
  async getSyncConflicts(companyId: string, params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    data: SyncConflict[];
    pagination: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/conflicts/${companyId}`, { params });
    return response.data;
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(conflictId: string, resolution: {
    action: 'use_local' | 'use_tally' | 'merge' | 'skip';
    mergedData?: Record<string, any>;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/resolve-conflict/${conflictId}`, resolution);
    return response.data;
  }

  /**
   * Update integration settings
   */
  async updateSettings(companyId: string, settings: {
    autoSync?: boolean;
    syncInterval?: number;
    syncDirection?: 'to_tally' | 'from_tally' | 'bidirectional';
    conflictResolution?: 'manual' | 'auto_local' | 'auto_tally';
    entities?: {
      vouchers: boolean;
      items: boolean;
      parties: boolean;
    };
  }): Promise<{
    success: boolean;
    message: string;
    data: Record<string, any>;
  }> {
    const response = await apiClient.put(`${this.baseURL}/settings/${companyId}`, settings);
    return response.data;
  }

  /**
   * Get integration settings
   */
  async getSettings(companyId: string): Promise<{
    success: boolean;
    data: {
      autoSync: boolean;
      syncInterval: number;
      syncDirection: string;
      conflictResolution: string;
      entities: {
        vouchers: boolean;
        items: boolean;
        parties: boolean;
      };
      lastModified: string;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/settings/${companyId}`);
    return response.data;
  }

  /**
   * Get Tally companies
   */
  async getTallyCompanies(connectionId: string): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      guid: string;
      isActive: boolean;
    }>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/companies/${connectionId}`);
    return response.data;
  }

  /**
   * Map Tally company
   */
  async mapTallyCompany(mappingData: {
    companyId: string;
    tallyCompanyName: string;
    tallyCompanyGuid: string;
    connectionId: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/map-company`, mappingData);
    return response.data;
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(companyId: string, period?: string): Promise<{
    success: boolean;
    data: {
      totalSyncs: number;
      successfulSyncs: number;
      failedSyncs: number;
      lastSyncTime: string;
      avgSyncTime: number;
      entityStats: {
        vouchers: { total: number; synced: number; pending: number };
        items: { total: number; synced: number; pending: number };
        parties: { total: number; synced: number; pending: number };
      };
      trends: Array<{
        date: string;
        syncs: number;
        success: number;
        failed: number;
      }>;
    };
  }> {
    const params = period ? { period } : {};
    const response = await apiClient.get(`${this.baseURL}/statistics/${companyId}`, { params });
    return response.data;
  }
}

export const tallyService = new TallyService();
