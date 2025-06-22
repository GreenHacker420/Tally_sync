import api from '@/lib/api';
import { ApiResponse, PaginatedResponse, Voucher } from '@/types';

export interface VoucherFilters {
  voucherType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  party?: string;
  search?: string;
}

export interface CreateVoucherData {
  voucherType: 'sales' | 'purchase' | 'receipt' | 'payment' | 'contra' | 'journal' | 'debit_note' | 'credit_note';
  date: string;
  party?: string;
  reference?: {
    number: string;
    date: string;
  };
  narration?: string;
  items: Array<{
    item?: string;
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
  }>;
  ledgerEntries: Array<{
    ledger: string;
    debit: number;
    credit: number;
    narration?: string;
  }>;
  payment?: {
    method?: 'cash' | 'bank' | 'upi' | 'card' | 'cheque' | 'dd' | 'neft' | 'rtgs' | 'other';
    bank?: string;
    chequeNumber?: string;
    chequeDate?: string;
    transactionId?: string;
    upiId?: string;
  };
  shipping?: {
    address?: any;
    method?: string;
    charges: number;
    trackingNumber?: string;
  };
  terms?: {
    paymentTerms?: string;
    deliveryTerms?: string;
    otherTerms?: string;
  };
  dueDate?: string;
}

export const voucherService = {
  // Get all vouchers with pagination and filters
  async getVouchers(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters: VoucherFilters = {}
  ): Promise<PaginatedResponse<Voucher>> {
    const response = await api.get<PaginatedResponse<Voucher>>('/api/vouchers', {
      params: {
        company: companyId,
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  // Get single voucher by ID
  async getVoucher(voucherId: string): Promise<ApiResponse<Voucher>> {
    const response = await api.get<ApiResponse<Voucher>>(`/api/vouchers/${voucherId}`);
    return response.data;
  },

  // Create new voucher
  async createVoucher(companyId: string, voucherData: CreateVoucherData): Promise<ApiResponse<Voucher>> {
    const response = await api.post<ApiResponse<Voucher>>('/api/vouchers', {
      ...voucherData,
      company: companyId,
    });
    return response.data;
  },

  // Update voucher
  async updateVoucher(voucherId: string, voucherData: Partial<CreateVoucherData>): Promise<ApiResponse<Voucher>> {
    const response = await api.put<ApiResponse<Voucher>>(`/api/vouchers/${voucherId}`, voucherData);
    return response.data;
  },

  // Delete voucher
  async deleteVoucher(voucherId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/api/vouchers/${voucherId}`);
    return response.data;
  },

  // Generate PDF for voucher
  async generateVoucherPDF(voucherId: string): Promise<Blob> {
    const response = await api.get(`/api/vouchers/${voucherId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Approve voucher
  async approveVoucher(voucherId: string, comments?: string): Promise<ApiResponse<Voucher>> {
    const response = await api.post<ApiResponse<Voucher>>(`/api/vouchers/${voucherId}/approve`, {
      comments,
    });
    return response.data;
  },

  // Reject voucher
  async rejectVoucher(voucherId: string, reason: string): Promise<ApiResponse<Voucher>> {
    const response = await api.post<ApiResponse<Voucher>>(`/api/vouchers/${voucherId}/reject`, {
      reason,
    });
    return response.data;
  },

  // Sync voucher with Tally
  async syncWithTally(voucherId: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>(`/api/vouchers/${voucherId}/sync-tally`);
    return response.data;
  },

  // Get voucher types
  async getVoucherTypes(): Promise<ApiResponse<Array<{ value: string; label: string }>>> {
    const voucherTypes = [
      { value: 'sales', label: 'Sales' },
      { value: 'purchase', label: 'Purchase' },
      { value: 'receipt', label: 'Receipt' },
      { value: 'payment', label: 'Payment' },
      { value: 'contra', label: 'Contra' },
      { value: 'journal', label: 'Journal' },
      { value: 'debit_note', label: 'Debit Note' },
      { value: 'credit_note', label: 'Credit Note' },
    ];
    
    return {
      success: true,
      data: voucherTypes,
    };
  },

  // Get voucher statuses
  async getVoucherStatuses(): Promise<ApiResponse<Array<{ value: string; label: string }>>> {
    const statuses = [
      { value: 'draft', label: 'Draft' },
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'paid', label: 'Paid' },
      { value: 'partially_paid', label: 'Partially Paid' },
    ];
    
    return {
      success: true,
      data: statuses,
    };
  },

  // Upload voucher attachment
  async uploadAttachment(voucherId: string, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('attachment', file);

    const response = await api.post<ApiResponse>(`/api/vouchers/${voucherId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete voucher attachment
  async deleteAttachment(voucherId: string, attachmentId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/api/vouchers/${voucherId}/attachments/${attachmentId}`);
    return response.data;
  },
};
