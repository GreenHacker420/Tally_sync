import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/inventoryService';
import { databaseService } from '../../services/databaseService';
import { InventoryItem, CreateInventoryItemData, UpdateInventoryItemData } from '../../types';

interface InventoryState {
  items: InventoryItem[];
  selectedItem: InventoryItem | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    category?: string;
    search?: string;
    lowStock?: boolean;
  };
  stats: {
    total: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    categories: Record<string, number>;
    topItems: Array<{
      id: string;
      name: string;
      currentStock: number;
      value: number;
    }>;
  };
}

const initialState: InventoryState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  filters: {},
  stats: {
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    categories: {},
    topItems: [],
  },
};

// Async thunks
export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchItems',
  async (params: { refresh?: boolean } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { filters } = state.inventory;

      const response = await inventoryService.getItems(filters);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory items');
    }
  }
);

export const fetchInventoryStats = createAsyncThunk(
  'inventory/fetchStats',
  async (companyId: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getInventoryStats(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory stats');
    }
  }
);

export const fetchItemById = createAsyncThunk(
  'inventory/fetchItemById',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getItemById(itemId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch item');
    }
  }
);

export const createItem = createAsyncThunk(
  'inventory/createItem',
  async (itemData: CreateInventoryItemData, { rejectWithValue }) => {
    try {
      const response = await inventoryService.createItem(itemData);

      // Also store locally for offline access
      await databaseService.upsertInventoryItem(response.data);

      return response.data;
    } catch (error: any) {
      // Store as pending change if offline
      if (!navigator.onLine) {
        await databaseService.addPendingChange({
          type: 'item',
          action: 'create',
          data: itemData,
        });
        
        // Create temporary item for UI
        const tempItem: InventoryItem = {
          id: `temp_${Date.now()}`,
          name: itemData.name || 'New Item',
          code: itemData.code || '',
          category: itemData.category || 'General',
          unit: itemData.unit || 'Nos',
          rate: itemData.rate || 0,
          openingStock: itemData.openingStock || 0,
          currentStock: itemData.openingStock || 0,
          reorderLevel: itemData.reorderLevel || 0,
          isActive: true,
          companyId: itemData.companyId || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return tempItem;
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to create item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, data }: { id: string; data: UpdateInventoryItemData }, { rejectWithValue }) => {
    try {
      const response = await inventoryService.updateItem(id, data);

      // Also update locally
      await databaseService.upsertInventoryItem(response.data);

      return response.data;
    } catch (error: any) {
      // Store as pending change if offline
      if (!navigator.onLine) {
        await databaseService.addPendingChange({
          type: 'item',
          action: 'update',
          data: { id, ...data },
        });
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const deleteItem = createAsyncThunk(
  'inventory/deleteItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await inventoryService.deleteItem(itemId);
      return itemId;
    } catch (error: any) {
      // Store as pending change if offline
      if (!navigator.onLine) {
        await databaseService.addPendingChange({
          type: 'item',
          action: 'delete',
          data: { id: itemId },
        });
        return itemId;
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to delete item');
    }
  }
);

export const updateStock = createAsyncThunk(
  'inventory/updateStock',
  async (
    { itemId, quantity, type, reference, notes }: {
      itemId: string;
      quantity: number;
      type: 'in' | 'out' | 'adjustment';
      reference?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await inventoryService.updateStock(itemId, {
        quantity,
        type,
        reference,
        notes,
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update stock');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedItem: (state, action: PayloadAction<InventoryItem | null>) => {
      state.selectedItem = action.payload;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateItemStock: (state, action: PayloadAction<{ itemId: string; newStock: number }>) => {
      const { itemId, newStock } = action.payload;
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        item.currentStock = newStock;
      }
      if (state.selectedItem?.id === itemId) {
        state.selectedItem.currentStock = newStock;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch items
    builder
      .addCase(fetchInventoryItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch stats
    builder
      .addCase(fetchInventoryStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // Fetch item by ID
    builder
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.selectedItem = action.payload;
        
        // Update in list if exists
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });

    // Create item
    builder
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.stats.total += 1;
      });

    // Update item
    builder
      .addCase(updateItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      });

    // Delete item
    builder
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
        if (state.selectedItem?.id === action.payload) {
          state.selectedItem = null;
        }
        state.stats.total = Math.max(0, state.stats.total - 1);
      });

    // Update stock
    builder
      .addCase(updateStock.fulfilled, (state, action) => {
        const item = action.payload;
        const index = state.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          state.items[index] = item;
        }
        if (state.selectedItem?.id === item.id) {
          state.selectedItem = item;
        }
      });
  },
});

export const {
  clearError,
  setSelectedItem,
  setFilters,
  clearFilters,
  updateItemStock,
} = inventorySlice.actions;

export default inventorySlice.reducer;
