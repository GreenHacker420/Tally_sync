import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tallyService, TallyConnection, SyncStatus, SyncLog, SyncConflict } from '../../services/tallyService';

interface TallyState {
  connections: TallyConnection[];
  selectedConnection: TallyConnection | null;
  syncStatus: SyncStatus | null;
  syncLogs: SyncLog[];
  syncConflicts: SyncConflict[];
  settings: {
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
  } | null;
  statistics: {
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
  } | null;
  tallyCompanies: Array<{
    name: string;
    guid: string;
    isActive: boolean;
  }>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

const initialState: TallyState = {
  connections: [],
  selectedConnection: null,
  syncStatus: null,
  syncLogs: [],
  syncConflicts: [],
  settings: null,
  statistics: null,
  tallyCompanies: [],
  isLoading: false,
  isSyncing: false,
  error: null,
};

// Async thunks
export const fetchTallyConnections = createAsyncThunk(
  'tally/fetchConnections',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await tallyService.getConnections(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Tally connections');
    }
  }
);

export const testTallyConnection = createAsyncThunk(
  'tally/testConnection',
  async (connectionData: {
    host: string;
    port: number;
    companyId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.testConnection(connectionData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to test Tally connection');
    }
  }
);

export const fetchSyncStatus = createAsyncThunk(
  'tally/fetchSyncStatus',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await tallyService.getSyncStatus(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sync status');
    }
  }
);

export const syncToTally = createAsyncThunk(
  'tally/syncToTally',
  async (syncData: {
    entityType: 'voucher' | 'item' | 'party';
    entityId: string;
    companyId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.syncToTally(syncData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync to Tally');
    }
  }
);

export const syncFromTally = createAsyncThunk(
  'tally/syncFromTally',
  async (syncData: {
    entityType: 'voucher' | 'item' | 'party';
    tallyId: string;
    companyId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.syncFromTally(syncData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync from Tally');
    }
  }
);

export const performFullSync = createAsyncThunk(
  'tally/performFullSync',
  async ({ companyId, options }: {
    companyId: string;
    options?: {
      direction?: 'to_tally' | 'from_tally' | 'bidirectional';
      entities?: ('vouchers' | 'items' | 'parties')[];
      dateFrom?: string;
      dateTo?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.performFullSync(companyId, options);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform full sync');
    }
  }
);

export const fetchSyncLogs = createAsyncThunk(
  'tally/fetchSyncLogs',
  async ({ companyId, params }: {
    companyId: string;
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.getSyncLogs(companyId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sync logs');
    }
  }
);

export const fetchSyncConflicts = createAsyncThunk(
  'tally/fetchSyncConflicts',
  async ({ companyId, params }: {
    companyId: string;
    params?: {
      page?: number;
      limit?: number;
      entityType?: string;
      status?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.getSyncConflicts(companyId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sync conflicts');
    }
  }
);

export const resolveSyncConflict = createAsyncThunk(
  'tally/resolveSyncConflict',
  async ({ conflictId, resolution }: {
    conflictId: string;
    resolution: {
      action: 'use_local' | 'use_tally' | 'merge' | 'skip';
      mergedData?: Record<string, any>;
    };
  }, { rejectWithValue }) => {
    try {
      await tallyService.resolveConflict(conflictId, resolution);
      return conflictId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve sync conflict');
    }
  }
);

export const fetchTallySettings = createAsyncThunk(
  'tally/fetchSettings',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await tallyService.getSettings(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Tally settings');
    }
  }
);

export const updateTallySettings = createAsyncThunk(
  'tally/updateSettings',
  async ({ companyId, settings }: {
    companyId: string;
    settings: {
      autoSync?: boolean;
      syncInterval?: number;
      syncDirection?: 'to_tally' | 'from_tally' | 'bidirectional';
      conflictResolution?: 'manual' | 'auto_local' | 'auto_tally';
      entities?: {
        vouchers: boolean;
        items: boolean;
        parties: boolean;
      };
    };
  }, { rejectWithValue }) => {
    try {
      const response = await tallyService.updateSettings(companyId, settings);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update Tally settings');
    }
  }
);

export const fetchTallyCompanies = createAsyncThunk(
  'tally/fetchTallyCompanies',
  async (connectionId: string, { rejectWithValue }) => {
    try {
      const response = await tallyService.getTallyCompanies(connectionId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Tally companies');
    }
  }
);

export const mapTallyCompany = createAsyncThunk(
  'tally/mapTallyCompany',
  async (mappingData: {
    companyId: string;
    tallyCompanyName: string;
    tallyCompanyGuid: string;
    connectionId: string;
  }, { rejectWithValue }) => {
    try {
      await tallyService.mapTallyCompany(mappingData);
      return mappingData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to map Tally company');
    }
  }
);

export const fetchSyncStatistics = createAsyncThunk(
  'tally/fetchSyncStatistics',
  async ({ companyId, period }: { companyId: string; period?: string }, { rejectWithValue }) => {
    try {
      const response = await tallyService.getSyncStatistics(companyId, period);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sync statistics');
    }
  }
);

const tallySlice = createSlice({
  name: 'tally',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedConnection: (state, action: PayloadAction<TallyConnection | null>) => {
      state.selectedConnection = action.payload;
    },
    updateSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
      state.isSyncing = action.payload.status === 'syncing';
    },
    addSyncLog: (state, action: PayloadAction<SyncLog>) => {
      state.syncLogs.unshift(action.payload);
      // Keep only last 100 logs
      if (state.syncLogs.length > 100) {
        state.syncLogs = state.syncLogs.slice(0, 100);
      }
    },
    clearSyncLogs: (state) => {
      state.syncLogs = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Tally connections
    builder
      .addCase(fetchTallyConnections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTallyConnections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.connections = action.payload;
        state.error = null;
      })
      .addCase(fetchTallyConnections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch sync status
    builder
      .addCase(fetchSyncStatus.fulfilled, (state, action) => {
        state.syncStatus = action.payload;
        state.isSyncing = action.payload.status === 'syncing';
      });

    // Perform full sync
    builder
      .addCase(performFullSync.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(performFullSync.fulfilled, (state) => {
        state.isSyncing = false;
      })
      .addCase(performFullSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload as string;
      });

    // Fetch sync logs
    builder
      .addCase(fetchSyncLogs.fulfilled, (state, action) => {
        state.syncLogs = action.payload;
      });

    // Fetch sync conflicts
    builder
      .addCase(fetchSyncConflicts.fulfilled, (state, action) => {
        state.syncConflicts = action.payload;
      });

    // Resolve sync conflict
    builder
      .addCase(resolveSyncConflict.fulfilled, (state, action) => {
        const index = state.syncConflicts.findIndex(c => c.id === action.payload);
        if (index !== -1) {
          state.syncConflicts[index].status = 'resolved';
        }
      });

    // Fetch Tally settings
    builder
      .addCase(fetchTallySettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });

    // Update Tally settings
    builder
      .addCase(updateTallySettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });

    // Fetch Tally companies
    builder
      .addCase(fetchTallyCompanies.fulfilled, (state, action) => {
        state.tallyCompanies = action.payload;
      });

    // Fetch sync statistics
    builder
      .addCase(fetchSyncStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedConnection,
  updateSyncStatus,
  addSyncLog,
  clearSyncLogs,
} = tallySlice.actions;

export default tallySlice.reducer;
