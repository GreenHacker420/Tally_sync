import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mlService, BusinessMetrics, RiskDashboard, InventoryAnalytics, PaymentTrends, ModelStatus } from '../../services/mlService';

interface MLState {
  // Health Status
  isMLServiceAvailable: boolean;
  mlServiceHealth: string;
  
  // Business Metrics
  businessMetrics: BusinessMetrics | null;
  businessMetricsLoading: boolean;
  
  // Risk Dashboard
  riskDashboard: RiskDashboard | null;
  riskDashboardLoading: boolean;
  
  // Inventory Analytics
  inventoryAnalytics: InventoryAnalytics | null;
  inventoryAnalyticsLoading: boolean;
  
  // Payment Trends
  paymentTrends: PaymentTrends | null;
  paymentTrendsLoading: boolean;
  
  // Model Status
  modelStatus: ModelStatus | null;
  modelStatusLoading: boolean;
  
  // Predictions Cache
  paymentPredictions: Record<string, any>;
  riskAssessments: Record<string, any>;
  inventoryForecasts: Record<string, any>;
  
  // UI State
  selectedMetricsPeriod: number;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: MLState = {
  isMLServiceAvailable: false,
  mlServiceHealth: 'unknown',
  businessMetrics: null,
  businessMetricsLoading: false,
  riskDashboard: null,
  riskDashboardLoading: false,
  inventoryAnalytics: null,
  inventoryAnalyticsLoading: false,
  paymentTrends: null,
  paymentTrendsLoading: false,
  modelStatus: null,
  modelStatusLoading: false,
  paymentPredictions: {},
  riskAssessments: {},
  inventoryForecasts: {},
  selectedMetricsPeriod: 30,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const checkMLServiceHealth = createAsyncThunk(
  'ml/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await mlService.getDetailedHealth();
      return health;
    } catch (error: any) {
      return rejectWithValue(error.message || 'ML Service unavailable');
    }
  }
);

export const fetchBusinessMetrics = createAsyncThunk(
  'ml/fetchBusinessMetrics',
  async (daysBack: number = 30, { rejectWithValue }) => {
    try {
      const metrics = await mlService.getBusinessMetrics(daysBack);
      return metrics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch business metrics');
    }
  }
);

export const fetchRiskDashboard = createAsyncThunk(
  'ml/fetchRiskDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const dashboard = await mlService.getRiskDashboard();
      return dashboard;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch risk dashboard');
    }
  }
);

export const fetchInventoryAnalytics = createAsyncThunk(
  'ml/fetchInventoryAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const analytics = await mlService.getInventoryAnalytics();
      return analytics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory analytics');
    }
  }
);

export const fetchPaymentTrends = createAsyncThunk(
  'ml/fetchPaymentTrends',
  async (_, { rejectWithValue }) => {
    try {
      const trends = await mlService.getPaymentTrends();
      return trends;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment trends');
    }
  }
);

export const fetchModelStatus = createAsyncThunk(
  'ml/fetchModelStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await mlService.getModelStatus();
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch model status');
    }
  }
);

export const predictPaymentDelay = createAsyncThunk(
  'ml/predictPaymentDelay',
  async (params: { customer_id: string; amount?: number; due_date?: string }, { rejectWithValue }) => {
    try {
      const prediction = await mlService.predictPaymentDelay(params);
      return { customerId: params.customer_id, prediction };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to predict payment delay');
    }
  }
);

export const assessCustomerRisk = createAsyncThunk(
  'ml/assessCustomerRisk',
  async (params: { customer_id: string; assessment_type?: string }, { rejectWithValue }) => {
    try {
      const assessment = await mlService.assessCustomerRisk(params);
      return { customerId: params.customer_id, assessment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assess customer risk');
    }
  }
);

export const forecastInventoryDemand = createAsyncThunk(
  'ml/forecastInventoryDemand',
  async (params: { item_ids?: string[]; days_ahead?: number }, { rejectWithValue }) => {
    try {
      const forecast = await mlService.forecastInventoryDemand(params);
      return forecast;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to forecast inventory demand');
    }
  }
);

export const retrainModels = createAsyncThunk(
  'ml/retrainModels',
  async (_, { rejectWithValue }) => {
    try {
      const result = await mlService.retrainModels();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to retrain models');
    }
  }
);

// ML slice
const mlSlice = createSlice({
  name: 'ml',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedMetricsPeriod: (state, action: PayloadAction<number>) => {
      state.selectedMetricsPeriod = action.payload;
    },
    clearPredictionCache: (state) => {
      state.paymentPredictions = {};
      state.riskAssessments = {};
      state.inventoryForecasts = {};
    },
    updateLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Health check
    builder
      .addCase(checkMLServiceHealth.fulfilled, (state, action) => {
        state.isMLServiceAvailable = true;
        state.mlServiceHealth = action.payload.status;
        state.error = null;
      })
      .addCase(checkMLServiceHealth.rejected, (state, action) => {
        state.isMLServiceAvailable = false;
        state.mlServiceHealth = 'unavailable';
        state.error = action.payload as string;
      });

    // Business metrics
    builder
      .addCase(fetchBusinessMetrics.pending, (state) => {
        state.businessMetricsLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessMetrics.fulfilled, (state, action) => {
        state.businessMetricsLoading = false;
        state.businessMetrics = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchBusinessMetrics.rejected, (state, action) => {
        state.businessMetricsLoading = false;
        state.error = action.payload as string;
      });

    // Risk dashboard
    builder
      .addCase(fetchRiskDashboard.pending, (state) => {
        state.riskDashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchRiskDashboard.fulfilled, (state, action) => {
        state.riskDashboardLoading = false;
        state.riskDashboard = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchRiskDashboard.rejected, (state, action) => {
        state.riskDashboardLoading = false;
        state.error = action.payload as string;
      });

    // Inventory analytics
    builder
      .addCase(fetchInventoryAnalytics.pending, (state) => {
        state.inventoryAnalyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryAnalytics.fulfilled, (state, action) => {
        state.inventoryAnalyticsLoading = false;
        state.inventoryAnalytics = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchInventoryAnalytics.rejected, (state, action) => {
        state.inventoryAnalyticsLoading = false;
        state.error = action.payload as string;
      });

    // Payment trends
    builder
      .addCase(fetchPaymentTrends.pending, (state) => {
        state.paymentTrendsLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentTrends.fulfilled, (state, action) => {
        state.paymentTrendsLoading = false;
        state.paymentTrends = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPaymentTrends.rejected, (state, action) => {
        state.paymentTrendsLoading = false;
        state.error = action.payload as string;
      });

    // Model status
    builder
      .addCase(fetchModelStatus.pending, (state) => {
        state.modelStatusLoading = true;
        state.error = null;
      })
      .addCase(fetchModelStatus.fulfilled, (state, action) => {
        state.modelStatusLoading = false;
        state.modelStatus = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchModelStatus.rejected, (state, action) => {
        state.modelStatusLoading = false;
        state.error = action.payload as string;
      });

    // Payment prediction
    builder
      .addCase(predictPaymentDelay.fulfilled, (state, action) => {
        const { customerId, prediction } = action.payload;
        state.paymentPredictions[customerId] = prediction;
      });

    // Risk assessment
    builder
      .addCase(assessCustomerRisk.fulfilled, (state, action) => {
        const { customerId, assessment } = action.payload;
        state.riskAssessments[customerId] = assessment;
      });

    // Inventory forecast
    builder
      .addCase(forecastInventoryDemand.fulfilled, (state, action) => {
        const forecasts = action.payload;
        forecasts.forEach((forecast) => {
          state.inventoryForecasts[forecast.item_id] = forecast;
        });
      });
  },
});

export const {
  clearError,
  setSelectedMetricsPeriod,
  clearPredictionCache,
  updateLastUpdated,
} = mlSlice.actions;

export default mlSlice.reducer;
