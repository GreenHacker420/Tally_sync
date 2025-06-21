// User and Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'superadmin';
  isEmailVerified: boolean;
  isActive: boolean;
  companies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  panNumber?: string;
  isActive: boolean;
  settings: CompanySettings;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  gstEnabled: boolean;
  inventoryEnabled: boolean;
  multiCurrencyEnabled: boolean;
}

// Voucher Types
export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string;
  reference?: string;
  narration?: string;
  amount: number;
  status: 'draft' | 'posted' | 'cancelled';
  entries: VoucherEntry[];
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tallyId?: string;
  lastSyncedAt?: string;
}

export interface VoucherEntry {
  id: string;
  accountId: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

export type VoucherType = 
  | 'sales' 
  | 'purchase' 
  | 'receipt' 
  | 'payment' 
  | 'journal' 
  | 'contra' 
  | 'debit_note' 
  | 'credit_note';

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  unit: string;
  rate: number;
  openingStock: number;
  currentStock: number;
  reorderLevel: number;
  maxLevel?: number;
  location?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  tallyId?: string;
  lastSyncedAt?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  rate: number;
  amount: number;
  reference: string;
  date: string;
  companyId: string;
  createdAt: string;
}

// Sync Types
export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'uploading' | 'completed' | 'error';

export interface SyncProgress {
  type: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface SyncSession {
  id: string;
  startTime: string;
  endTime?: string;
  status: SyncStatus;
  totalItems: number;
  processedItems: number;
  errors: SyncError[];
  summary: SyncSummary;
}

export interface SyncError {
  type: string;
  item: string;
  error: string;
  timestamp: string;
}

export interface SyncSummary {
  companies?: { total: number; processed: number; errors: number };
  vouchers?: { total: number; processed: number; errors: number };
  items?: { total: number; processed: number; errors: number };
  parties?: { total: number; processed: number; errors: number };
}

// Network Types
export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSync: boolean;
  syncInterval: number;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  debugMode: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Redux State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  error: string | null;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  autoSync: boolean;
  syncInterval: number;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  debugMode: boolean;
  isFirstLaunch: boolean;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  currentSession: SyncSession | null;
  sessions: SyncSession[];
  progress: SyncProgress | null;
  error: string | null;
}

export interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  filters: {
    category: string;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface MLState {
  isMLServiceAvailable: boolean;
  businessMetrics: BusinessMetrics | null;
  predictions: MLPrediction[];
  isLoading: boolean;
  error: string | null;
}

export interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

export interface VoucherState {
  vouchers: Voucher[];
  isLoading: boolean;
  error: string | null;
  filters: {
    type: string;
    dateFrom: string;
    dateTo: string;
    search: string;
  };
}

export interface OfflineState {
  queuedActions: any[];
  pendingUploads: any[];
  lastSyncAttempt: string | null;
  conflictResolution: 'server' | 'local' | 'manual';
}

// ML Types
export interface MLPrediction {
  id: string;
  type: 'payment' | 'risk' | 'forecast';
  input: any;
  output: any;
  confidence: number;
  timestamp: string;
}

export interface BusinessMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  period: string;
  trends: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

// Additional types for services
export interface CreateCompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  panNumber?: string;
  settings?: Partial<CompanySettings>;
}

export interface UpdateCompanyData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  settings?: Partial<CompanySettings>;
}

export interface CreateVoucherData {
  voucherNumber?: string;
  voucherType: VoucherType;
  date: string;
  reference?: string;
  narration?: string;
  amount?: number;
  entries: VoucherEntry[];
  companyId: string;
  createdBy?: string;
}

export interface UpdateVoucherData {
  voucherType?: VoucherType;
  date?: string;
  reference?: string;
  narration?: string;
  entries?: VoucherEntry[];
  status?: 'draft' | 'posted' | 'cancelled';
}

export interface CreateInventoryItemData {
  name: string;
  code: string;
  description?: string;
  category: string;
  unit: string;
  rate: number;
  openingStock: number;
  reorderLevel: number;
  maxLevel?: number;
  location?: string;
  companyId: string;
}

export interface UpdateInventoryItemData {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  unit?: string;
  rate?: number;
  reorderLevel?: number;
  maxLevel?: number;
  location?: string;
}
