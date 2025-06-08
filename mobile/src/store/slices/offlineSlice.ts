import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OfflineChange {
  id: string;
  type: 'voucher' | 'item' | 'company';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

interface OfflineState {
  isOfflineMode: boolean;
  pendingChanges: OfflineChange[];
  syncQueue: OfflineChange[];
  maxRetries: number;
  retryDelay: number;
}

const initialState: OfflineState = {
  isOfflineMode: false,
  pendingChanges: [],
  syncQueue: [],
  maxRetries: 3,
  retryDelay: 5000,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOfflineMode = action.payload;
    },
    addPendingChange: (state, action: PayloadAction<Omit<OfflineChange, 'id' | 'timestamp' | 'retryCount'>>) => {
      const change: OfflineChange = {
        ...action.payload,
        id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };
      
      state.pendingChanges.push(change);
    },
    removePendingChange: (state, action: PayloadAction<string>) => {
      state.pendingChanges = state.pendingChanges.filter(change => change.id !== action.payload);
    },
    updatePendingChange: (state, action: PayloadAction<{ id: string; updates: Partial<OfflineChange> }>) => {
      const { id, updates } = action.payload;
      const index = state.pendingChanges.findIndex(change => change.id === id);
      if (index !== -1) {
        state.pendingChanges[index] = { ...state.pendingChanges[index], ...updates };
      }
    },
    addToSyncQueue: (state, action: PayloadAction<OfflineChange>) => {
      // Avoid duplicates
      const exists = state.syncQueue.find(item => item.id === action.payload.id);
      if (!exists) {
        state.syncQueue.push(action.payload);
      }
    },
    removeFromSyncQueue: (state, action: PayloadAction<string>) => {
      state.syncQueue = state.syncQueue.filter(item => item.id !== action.payload);
    },
    clearSyncQueue: (state) => {
      state.syncQueue = [];
    },
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const change = state.pendingChanges.find(c => c.id === action.payload);
      if (change) {
        change.retryCount += 1;
      }
    },
    setLastError: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const { id, error } = action.payload;
      const change = state.pendingChanges.find(c => c.id === id);
      if (change) {
        change.lastError = error;
      }
    },
    clearPendingChanges: (state) => {
      state.pendingChanges = [];
    },
    movePendingToQueue: (state) => {
      // Move all pending changes to sync queue
      state.syncQueue = [...state.syncQueue, ...state.pendingChanges];
      state.pendingChanges = [];
    },
    retryFailedChanges: (state) => {
      // Reset retry count for failed changes
      state.pendingChanges.forEach(change => {
        if (change.retryCount >= state.maxRetries) {
          change.retryCount = 0;
          change.lastError = undefined;
        }
      });
    },
    setMaxRetries: (state, action: PayloadAction<number>) => {
      state.maxRetries = action.payload;
    },
    setRetryDelay: (state, action: PayloadAction<number>) => {
      state.retryDelay = action.payload;
    },
  },
});

export const {
  setOfflineMode,
  addPendingChange,
  removePendingChange,
  updatePendingChange,
  addToSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  incrementRetryCount,
  setLastError,
  clearPendingChanges,
  movePendingToQueue,
  retryFailedChanges,
  setMaxRetries,
  setRetryDelay,
} = offlineSlice.actions;

export default offlineSlice.reducer;
