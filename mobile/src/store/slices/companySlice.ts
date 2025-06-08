import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';
import { Company } from '../../types';

interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  companies: [],
  selectedCompany: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'company/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/companies');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
    }
  }
);

export const selectCompany = createAsyncThunk(
  'company/selectCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/companies/${companyId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to select company');
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
    updateCompany: (state, action: PayloadAction<Company>) => {
      const index = state.companies.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.companies[index] = action.payload;
      }
      if (state.selectedCompany?.id === action.payload.id) {
        state.selectedCompany = action.payload;
      }
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

    // Select company
    builder
      .addCase(selectCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(selectCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCompany = action.payload;
        state.error = null;
      })
      .addCase(selectCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedCompany, updateCompany } = companySlice.actions;
export default companySlice.reducer;
