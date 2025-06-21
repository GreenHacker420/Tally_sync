import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { companyService } from '../../services/companyService';
import { Company, CreateCompanyData, UpdateCompanyData } from '../../types';

interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
  stats: {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    totalVouchers: number;
    totalItems: number;
  } | null;
  settings: Record<string, any> | null;
  users: any[];
  usersLoading: boolean;
}

const initialState: CompanyState = {
  companies: [],
  selectedCompany: null,
  isLoading: false,
  error: null,
  stats: null,
  settings: null,
  users: [],
  usersLoading: false,
};

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'company/fetchCompanies',
  async (params: { search?: string; isActive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await companyService.getCompanies(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'company/fetchCompanyById',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await companyService.getCompanyById(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch company');
    }
  }
);

export const createCompany = createAsyncThunk(
  'company/createCompany',
  async (companyData: CreateCompanyData, { rejectWithValue }) => {
    try {
      const response = await companyService.createCompany(companyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'company/updateCompany',
  async ({ id, data }: { id: string; data: UpdateCompanyData }, { rejectWithValue }) => {
    try {
      const response = await companyService.updateCompany(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'company/deleteCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      await companyService.deleteCompany(companyId);
      return companyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete company');
    }
  }
);

export const switchCompany = createAsyncThunk(
  'company/switchCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await companyService.switchCompany(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to switch company');
    }
  }
);

export const fetchCompanyStats = createAsyncThunk(
  'company/fetchCompanyStats',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await companyService.getCompanyStats(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch company stats');
    }
  }
);

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCompany: (state, action: PayloadAction<Company | null>) => {
      state.selectedCompany = action.payload;
    },
    clearCompanies: (state) => {
      state.companies = [];
      state.selectedCompany = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch companies
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = action.payload;
        state.error = null;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch company by ID
    builder
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.selectedCompany = action.payload;

        // Update in list if exists
        const index = state.companies.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
      });

    // Create company
    builder
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.unshift(action.payload);
      });

    // Update company
    builder
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
        if (state.selectedCompany?.id === action.payload.id) {
          state.selectedCompany = action.payload;
        }
      });

    // Delete company
    builder
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c.id !== action.payload);
        if (state.selectedCompany?.id === action.payload) {
          state.selectedCompany = null;
        }
      });

    // Switch company
    builder
      .addCase(switchCompany.fulfilled, (state, action) => {
        state.selectedCompany = action.payload;
      });

    // Fetch company stats
    builder
      .addCase(fetchCompanyStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError, setSelectedCompany, clearCompanies } = companySlice.actions;
export default companySlice.reducer;
