import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { reportService, ReportParams, FinancialReport, SalesReport, InventoryReport, TaxReport } from '../../services/reportService';

interface ReportState {
  financialReport: FinancialReport | null;
  salesReport: SalesReport | null;
  inventoryReport: InventoryReport | null;
  taxReport: TaxReport | null;
  profitLossReport: any | null;
  balanceSheetReport: any | null;
  cashFlowReport: any | null;
  trialBalanceReport: any | null;
  agingReport: any | null;
  customReports: Record<string, any>;
  availableReports: any[];
  isLoading: boolean;
  error: string | null;
  selectedReportType: string | null;
  reportParams: ReportParams | null;
}

const initialState: ReportState = {
  financialReport: null,
  salesReport: null,
  inventoryReport: null,
  taxReport: null,
  profitLossReport: null,
  balanceSheetReport: null,
  cashFlowReport: null,
  trialBalanceReport: null,
  agingReport: null,
  customReports: {},
  availableReports: [],
  isLoading: false,
  error: null,
  selectedReportType: null,
  reportParams: null,
};

// Async thunks
export const fetchFinancialReport = createAsyncThunk(
  'report/fetchFinancialReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getFinancialReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch financial report');
    }
  }
);

export const fetchSalesReport = createAsyncThunk(
  'report/fetchSalesReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getSalesReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sales report');
    }
  }
);

export const fetchInventoryReport = createAsyncThunk(
  'report/fetchInventoryReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getInventoryReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory report');
    }
  }
);

export const fetchTaxReport = createAsyncThunk(
  'report/fetchTaxReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getTaxReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tax report');
    }
  }
);

export const fetchProfitLossReport = createAsyncThunk(
  'report/fetchProfitLossReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getProfitLossReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profit & loss report');
    }
  }
);

export const fetchBalanceSheetReport = createAsyncThunk(
  'report/fetchBalanceSheetReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getBalanceSheetReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch balance sheet report');
    }
  }
);

export const fetchCashFlowReport = createAsyncThunk(
  'report/fetchCashFlowReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getCashFlowReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cash flow report');
    }
  }
);

export const fetchTrialBalanceReport = createAsyncThunk(
  'report/fetchTrialBalanceReport',
  async (params: ReportParams, { rejectWithValue }) => {
    try {
      const response = await reportService.getTrialBalanceReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trial balance report');
    }
  }
);

export const fetchAgingReport = createAsyncThunk(
  'report/fetchAgingReport',
  async (params: ReportParams & { type: 'receivables' | 'payables' }, { rejectWithValue }) => {
    try {
      const response = await reportService.getAgingReport(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch aging report');
    }
  }
);

export const fetchCustomReport = createAsyncThunk(
  'report/fetchCustomReport',
  async ({ reportId, params }: { reportId: string; params: ReportParams }, { rejectWithValue }) => {
    try {
      const response = await reportService.getCustomReport(reportId, params);
      return { reportId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch custom report');
    }
  }
);

export const fetchAvailableReports = createAsyncThunk(
  'report/fetchAvailableReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportService.getAvailableReports();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch available reports');
    }
  }
);

export const generateReportFile = createAsyncThunk(
  'report/generateReportFile',
  async ({ reportType, params }: { reportType: string; params: ReportParams }, { rejectWithValue }) => {
    try {
      const blob = await reportService.generateReportFile(reportType, params);
      return blob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate report file');
    }
  }
);

export const scheduleReport = createAsyncThunk(
  'report/scheduleReport',
  async (scheduleData: {
    reportType: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    parameters: ReportParams;
  }, { rejectWithValue }) => {
    try {
      const response = await reportService.scheduleReport(scheduleData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to schedule report');
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedReportType: (state, action: PayloadAction<string | null>) => {
      state.selectedReportType = action.payload;
    },
    setReportParams: (state, action: PayloadAction<ReportParams | null>) => {
      state.reportParams = action.payload;
    },
    clearReports: (state) => {
      state.financialReport = null;
      state.salesReport = null;
      state.inventoryReport = null;
      state.taxReport = null;
      state.profitLossReport = null;
      state.balanceSheetReport = null;
      state.cashFlowReport = null;
      state.trialBalanceReport = null;
      state.agingReport = null;
      state.customReports = {};
    },
  },
  extraReducers: (builder) => {
    // Financial report
    builder
      .addCase(fetchFinancialReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFinancialReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.financialReport = action.payload;
        state.error = null;
      })
      .addCase(fetchFinancialReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Sales report
    builder
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.salesReport = action.payload;
      });

    // Inventory report
    builder
      .addCase(fetchInventoryReport.fulfilled, (state, action) => {
        state.inventoryReport = action.payload;
      });

    // Tax report
    builder
      .addCase(fetchTaxReport.fulfilled, (state, action) => {
        state.taxReport = action.payload;
      });

    // Profit & Loss report
    builder
      .addCase(fetchProfitLossReport.fulfilled, (state, action) => {
        state.profitLossReport = action.payload;
      });

    // Balance Sheet report
    builder
      .addCase(fetchBalanceSheetReport.fulfilled, (state, action) => {
        state.balanceSheetReport = action.payload;
      });

    // Cash Flow report
    builder
      .addCase(fetchCashFlowReport.fulfilled, (state, action) => {
        state.cashFlowReport = action.payload;
      });

    // Trial Balance report
    builder
      .addCase(fetchTrialBalanceReport.fulfilled, (state, action) => {
        state.trialBalanceReport = action.payload;
      });

    // Aging report
    builder
      .addCase(fetchAgingReport.fulfilled, (state, action) => {
        state.agingReport = action.payload;
      });

    // Custom report
    builder
      .addCase(fetchCustomReport.fulfilled, (state, action) => {
        const { reportId, data } = action.payload;
        state.customReports[reportId] = data;
      });

    // Available reports
    builder
      .addCase(fetchAvailableReports.fulfilled, (state, action) => {
        state.availableReports = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedReportType,
  setReportParams,
  clearReports,
} = reportSlice.actions;

export default reportSlice.reducer;
