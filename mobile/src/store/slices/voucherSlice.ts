import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { voucherService } from '../../services/voucherService';
import { databaseService } from '../../services/databaseService';
import { Voucher, CreateVoucherData, UpdateVoucherData } from '../../types';

interface VoucherState {
  vouchers: Voucher[];
  selectedVoucher: Voucher | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: VoucherState = {
  vouchers: [],
  selectedVoucher: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const fetchVouchers = createAsyncThunk(
  'voucher/fetchVouchers',
  async (params: { page?: number; refresh?: boolean } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { filters, pagination } = state.voucher;
      const page = params.page || (params.refresh ? 1 : pagination.page);

      const response = await voucherService.getVouchers({
        page,
        limit: pagination.limit,
        ...filters,
      });

      return {
        vouchers: response.data,
        pagination: response.pagination,
        refresh: params.refresh,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vouchers');
    }
  }
);

export const fetchVoucherById = createAsyncThunk(
  'voucher/fetchVoucherById',
  async (voucherId: string, { rejectWithValue }) => {
    try {
      const response = await voucherService.getVoucherById(voucherId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch voucher');
    }
  }
);

export const createVoucher = createAsyncThunk(
  'voucher/createVoucher',
  async (voucherData: CreateVoucherData, { rejectWithValue }) => {
    try {
      const response = await voucherService.createVoucher(voucherData);

      // Also store locally for offline access
      await databaseService.upsertVoucher(response.data);

      return response.data;
    } catch (error: any) {
      // Store as pending change if offline
      if (!navigator.onLine) {
        await databaseService.addPendingChange({
          type: 'voucher',
          action: 'create',
          data: voucherData,
        });
        
        // Create temporary voucher for UI
        const tempVoucher: Voucher = {
          id: `temp_${Date.now()}`,
          voucherNumber: voucherData.voucherNumber || 'TEMP',
          voucherType: voucherData.voucherType || 'journal',
          date: voucherData.date || new Date().toISOString(),
          amount: voucherData.amount || 0,
          status: 'draft',
          entries: voucherData.entries || [],
          companyId: voucherData.companyId || '',
          createdBy: voucherData.createdBy || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return tempVoucher;
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to create voucher');
    }
  }
);

export const updateVoucher = createAsyncThunk(
  'voucher/updateVoucher',
  async ({ id, data }: { id: string; data: UpdateVoucherData }, { rejectWithValue }) => {
    try {
      const response = await voucherService.updateVoucher(id, data);

      // Also update locally
      await databaseService.upsertVoucher(response.data);

      return response.data;
    } catch (error: any) {
      // Store as pending change if offline
      if (!navigator.onLine) {
        await databaseService.addPendingChange({
          type: 'voucher',
          action: 'update',
          data: { id, ...data },
        });
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to update voucher');
    }
  }
);

export const deleteVoucher = createAsyncThunk(
  'voucher/deleteVoucher',
  async (voucherId: string, { rejectWithValue }) => {
    try {
      await voucherService.deleteVoucher(voucherId);
      return voucherId;
    } catch (error: any) {
      // Store as pending change if offline
      if (!navigator.onLine) {
        await databaseService.addPendingChange({
          type: 'voucher',
          action: 'delete',
          data: { id: voucherId },
        });
        return voucherId;
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to delete voucher');
    }
  }
);

const voucherSlice = createSlice({
  name: 'voucher',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedVoucher: (state, action: PayloadAction<Voucher | null>) => {
      state.selectedVoucher = action.payload;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset pagination when filters change
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch vouchers
    builder
      .addCase(fetchVouchers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVouchers.fulfilled, (state, action) => {
        state.isLoading = false;
        const { vouchers, pagination, refresh } = action.payload;
        
        if (refresh || pagination.page === 1) {
          state.vouchers = vouchers;
        } else {
          state.vouchers = [...state.vouchers, ...vouchers];
        }
        
        state.pagination = {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          hasMore: pagination.page < pagination.pages,
        };
        state.error = null;
      })
      .addCase(fetchVouchers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch voucher by ID
    builder
      .addCase(fetchVoucherById.fulfilled, (state, action) => {
        state.selectedVoucher = action.payload;
        
        // Update in list if exists
        const index = state.vouchers.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vouchers[index] = action.payload;
        }
      });

    // Create voucher
    builder
      .addCase(createVoucher.fulfilled, (state, action) => {
        state.vouchers.unshift(action.payload);
        state.pagination.total += 1;
      });

    // Update voucher
    builder
      .addCase(updateVoucher.fulfilled, (state, action) => {
        const index = state.vouchers.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vouchers[index] = action.payload;
        }
        if (state.selectedVoucher?.id === action.payload.id) {
          state.selectedVoucher = action.payload;
        }
      });

    // Delete voucher
    builder
      .addCase(deleteVoucher.fulfilled, (state, action) => {
        state.vouchers = state.vouchers.filter(v => v.id !== action.payload);
        if (state.selectedVoucher?.id === action.payload) {
          state.selectedVoucher = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      });
  },
});

export const {
  clearError,
  setSelectedVoucher,
  setFilters,
  clearFilters,
  resetPagination,
} = voucherSlice.actions;

export default voucherSlice.reducer;
