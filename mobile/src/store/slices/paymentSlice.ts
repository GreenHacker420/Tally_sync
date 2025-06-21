import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentService, PaymentOrder, PaymentLink, PaymentVerification, UPIQRCode } from '../../services/paymentService';

interface PaymentState {
  orders: PaymentOrder[];
  paymentLinks: PaymentLink[];
  selectedOrder: PaymentOrder | null;
  selectedLink: PaymentLink | null;
  isLoading: boolean;
  error: string | null;
  stats: {
    totalAmount: number;
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    trends: Array<{
      date: string;
      amount: number;
      count: number;
    }>;
  } | null;
  upiQRCode: UPIQRCode | null;
  paymentMethods: {
    cards: boolean;
    netbanking: boolean;
    wallets: boolean;
    upi: boolean;
    emi: boolean;
  } | null;
}

const initialState: PaymentState = {
  orders: [],
  paymentLinks: [],
  selectedOrder: null,
  selectedLink: null,
  isLoading: false,
  error: null,
  stats: null,
  upiQRCode: null,
  paymentMethods: null,
};

// Async thunks
export const createPaymentOrder = createAsyncThunk(
  'payment/createOrder',
  async (orderData: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
    companyId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await paymentService.createOrder(orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment order');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async (verificationData: PaymentVerification & { companyId: string }, { rejectWithValue }) => {
    try {
      const response = await paymentService.verifyPayment(verificationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify payment');
    }
  }
);

export const createPaymentLink = createAsyncThunk(
  'payment/createPaymentLink',
  async (linkData: {
    amount: number;
    currency?: string;
    description: string;
    customer?: {
      name: string;
      email: string;
      contact: string;
    };
    notify?: {
      sms: boolean;
      email: boolean;
    };
    reminder_enable?: boolean;
    notes?: Record<string, any>;
    companyId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await paymentService.createPaymentLink(linkData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment link');
    }
  }
);

export const generateUPIQR = createAsyncThunk(
  'payment/generateUPIQR',
  async (qrData: {
    amount: number;
    merchant_name: string;
    merchant_upi?: string;
    transaction_ref?: string;
    companyId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await paymentService.generateUPIQR(qrData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate UPI QR code');
    }
  }
);

export const fetchPaymentOrders = createAsyncThunk(
  'payment/fetchOrders',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getOrders(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment orders');
    }
  }
);

export const fetchPaymentLinks = createAsyncThunk(
  'payment/fetchPaymentLinks',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentLinks(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment links');
    }
  }
);

export const fetchPaymentStats = createAsyncThunk(
  'payment/fetchStats',
  async (params: { companyId?: string; period?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentStats(params.companyId, params.period);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment stats');
    }
  }
);

export const cancelPaymentLink = createAsyncThunk(
  'payment/cancelPaymentLink',
  async (linkId: string, { rejectWithValue }) => {
    try {
      await paymentService.cancelPaymentLink(linkId);
      return linkId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel payment link');
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payment/refundPayment',
  async ({ paymentId, refundData }: {
    paymentId: string;
    refundData: {
      amount?: number;
      notes?: Record<string, any>;
      receipt?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await paymentService.refundPayment(paymentId, refundData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refund payment');
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'payment/fetchPaymentMethods',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentMethods(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment methods');
    }
  }
);

export const updatePaymentMethods = createAsyncThunk(
  'payment/updatePaymentMethods',
  async ({ companyId, methods }: {
    companyId: string;
    methods: {
      cards?: boolean;
      netbanking?: boolean;
      wallets?: boolean;
      upi?: boolean;
      emi?: boolean;
    };
  }, { rejectWithValue }) => {
    try {
      await paymentService.updatePaymentMethods(companyId, methods);
      return methods;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update payment methods');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedOrder: (state, action: PayloadAction<PaymentOrder | null>) => {
      state.selectedOrder = action.payload;
    },
    setSelectedLink: (state, action: PayloadAction<PaymentLink | null>) => {
      state.selectedLink = action.payload;
    },
    clearUPIQR: (state) => {
      state.upiQRCode = null;
    },
  },
  extraReducers: (builder) => {
    // Create payment order
    builder
      .addCase(createPaymentOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create payment link
    builder
      .addCase(createPaymentLink.fulfilled, (state, action) => {
        state.paymentLinks.unshift(action.payload);
      });

    // Generate UPI QR
    builder
      .addCase(generateUPIQR.fulfilled, (state, action) => {
        state.upiQRCode = action.payload;
      });

    // Fetch payment orders
    builder
      .addCase(fetchPaymentOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      });

    // Fetch payment links
    builder
      .addCase(fetchPaymentLinks.fulfilled, (state, action) => {
        state.paymentLinks = action.payload;
      });

    // Fetch payment stats
    builder
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // Cancel payment link
    builder
      .addCase(cancelPaymentLink.fulfilled, (state, action) => {
        const index = state.paymentLinks.findIndex(link => link.id === action.payload);
        if (index !== -1) {
          state.paymentLinks[index].status = 'cancelled';
        }
      });

    // Fetch payment methods
    builder
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload;
      });

    // Update payment methods
    builder
      .addCase(updatePaymentMethods.fulfilled, (state, action) => {
        if (state.paymentMethods) {
          state.paymentMethods = { ...state.paymentMethods, ...action.payload };
        }
      });
  },
});

export const {
  clearError,
  setSelectedOrder,
  setSelectedLink,
  clearUPIQR,
} = paymentSlice.actions;

export default paymentSlice.reducer;
