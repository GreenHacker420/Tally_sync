// Base types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'superadmin' | 'admin' | 'accountant' | 'sales' | 'viewer';
  companies: string[] | Company[];
  avatar?: string;
  preferences: UserPreferences;
  twoFactorAuth: {
    enabled: boolean;
  };
  lastLogin?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: string;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
}

// Company types
export interface Company {
  _id: string;
  name: string;
  displayName?: string;
  gstin?: string;
  pan?: string;
  address: Address;
  contact: Contact;
  businessType: 'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'trust' | 'society' | 'other';
  industry: string;
  financialYear: {
    startDate: Date;
    endDate: Date;
  };
  currency: {
    primary: string;
    symbol: string;
    decimalPlaces: number;
  };
  taxation: {
    gstRegistered: boolean;
    gstType: 'regular' | 'composition' | 'casual' | 'non_resident' | 'exempt';
    tdsApplicable: boolean;
    tcsApplicable: boolean;
  };
  banking: {
    accounts: BankAccount[];
  };
  tallyIntegration: {
    enabled: boolean;
    companyPath?: string;
    lastSyncDate?: Date;
    syncSettings: {
      autoSync: boolean;
      syncInterval: number;
      syncVouchers: boolean;
      syncInventory: boolean;
      syncMasters: boolean;
    };
  };
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    features: {
      maxUsers: number;
      maxVouchers: number;
      maxInventoryItems: number;
      advancedReports: boolean;
      apiAccess: boolean;
      whatsappIntegration: boolean;
    };
  };
  logo?: string;
  isActive: boolean;
  createdBy: string;
  users: CompanyUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Contact {
  phone: string;
  email: string;
  website?: string;
  fax?: string;
}

export interface BankAccount {
  _id?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'savings' | 'current' | 'cc' | 'od';
  branch?: string;
  isDefault: boolean;
}

export interface CompanyUser {
  user: string | User;
  role: 'admin' | 'accountant' | 'sales' | 'viewer';
  permissions: {
    vouchers: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
    inventory: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
    reports: {
      financial: boolean;
      inventory: boolean;
      gst: boolean;
      analytics: boolean;
    };
  };
  joinedAt: Date;
}

// Auth types
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
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

// Voucher types
export interface Voucher {
  _id: string;
  company: string | Company;
  voucherType: 'sales' | 'purchase' | 'receipt' | 'payment' | 'contra' | 'journal' | 'debit_note' | 'credit_note';
  voucherNumber: string;
  date: Date;
  reference?: {
    number: string;
    date: Date;
  };
  party?: string | Party;
  narration?: string;
  items: VoucherItem[];
  ledgerEntries: LedgerEntry[];
  totals: VoucherTotals;
  payment?: PaymentDetails;
  shipping?: ShippingDetails;
  terms?: VoucherTerms;
  status: 'draft' | 'pending' | 'approved' | 'cancelled' | 'paid' | 'partially_paid';
  dueDate?: Date;
  attachments: Attachment[];
  tallySync: {
    synced: boolean;
    tallyId?: string;
    lastSyncDate?: Date;
    syncError?: string;
  };
  workflow: {
    approvalRequired: boolean;
    approvedBy?: string | User;
    approvedAt?: Date;
    rejectedBy?: string | User;
    rejectedAt?: Date;
    rejectionReason?: string;
  };
  createdBy: string | User;
  createdAt: Date;
  updatedAt: Date;
  formattedNumber?: string;
  isOverdue?: boolean;
}

export interface VoucherItem {
  _id?: string;
  item?: string | Item;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discount: {
    percentage: number;
    amount: number;
  };
  taxable: boolean;
  hsnCode?: string;
  gst: {
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
  amount: number;
}

export interface LedgerEntry {
  _id?: string;
  ledger: string | Ledger;
  debit: number;
  credit: number;
  narration?: string;
}

export interface VoucherTotals {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
}

export interface PaymentDetails {
  method?: 'cash' | 'bank' | 'upi' | 'card' | 'cheque' | 'dd' | 'neft' | 'rtgs' | 'other';
  bank?: string | Ledger;
  chequeNumber?: string;
  chequeDate?: Date;
  transactionId?: string;
  upiId?: string;
}

export interface ShippingDetails {
  address?: Address;
  method?: string;
  charges: number;
  trackingNumber?: string;
}

export interface VoucherTerms {
  paymentTerms?: string;
  deliveryTerms?: string;
  otherTerms?: string;
}

export interface Attachment {
  _id?: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
}

// Placeholder interfaces for referenced models
export interface Party {
  _id: string;
  name: string;
  // Add more fields as needed
}

export interface Item {
  _id: string;
  name: string;
  // Add more fields as needed
}

export interface Ledger {
  _id: string;
  name: string;
  // Add more fields as needed
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

// Table types
export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | string;
  onRow?: (record: T, index: number) => any;
}

// Common UI types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: MenuItem[];
  disabled?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

// Error types
export interface ErrorInfo {
  message: string;
  code?: string;
  field?: string;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Theme types
export type Theme = 'light' | 'dark' | 'auto';
