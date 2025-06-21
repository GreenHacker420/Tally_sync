import { apiClient } from './apiClient';
import { Voucher, CreateVoucherData, UpdateVoucherData, VoucherEntry } from '../types';

export interface VoucherListResponse {
  success: boolean;
  data: Voucher[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VoucherResponse {
  success: boolean;
  data: Voucher;
}

export interface VoucherStatsResponse {
  success: boolean;
  data: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalAmount: number;
    thisMonth: number;
    lastMonth: number;
  };
}

class VoucherService {
  private readonly baseURL = '/vouchers';

  /**
   * Get vouchers with filtering and pagination
   */
  async getVouchers(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    companyId?: string;
  }): Promise<VoucherListResponse> {
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Get voucher by ID
   */
  async getVoucherById(voucherId: string): Promise<VoucherResponse> {
    const response = await apiClient.get(`${this.baseURL}/${voucherId}`);
    return response.data;
  }

  /**
   * Create new voucher
   */
  async createVoucher(voucherData: CreateVoucherData): Promise<VoucherResponse> {
    const response = await apiClient.post(this.baseURL, voucherData);
    return response.data;
  }

  /**
   * Update voucher
   */
  async updateVoucher(voucherId: string, voucherData: UpdateVoucherData): Promise<VoucherResponse> {
    const response = await apiClient.put(`${this.baseURL}/${voucherId}`, voucherData);
    return response.data;
  }

  /**
   * Delete voucher
   */
  async deleteVoucher(voucherId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${this.baseURL}/${voucherId}`);
    return response.data;
  }

  /**
   * Get voucher statistics
   */
  async getVoucherStats(companyId?: string): Promise<VoucherStatsResponse> {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get(`${this.baseURL}/stats`, { params });
    return response.data;
  }

  /**
   * Generate voucher PDF
   */
  async generateVoucherPDF(voucherId: string): Promise<Blob> {
    const response = await apiClient.download(`${this.baseURL}/${voucherId}/pdf`);
    return response.data;
  }

  /**
   * Duplicate voucher
   */
  async duplicateVoucher(voucherId: string): Promise<VoucherResponse> {
    const response = await apiClient.post(`${this.baseURL}/${voucherId}/duplicate`);
    return response.data;
  }

  /**
   * Get voucher types
   */
  async getVoucherTypes(): Promise<{
    success: boolean;
    data: Array<{
      type: string;
      label: string;
      description: string;
    }>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/types`);
    return response.data;
  }

  /**
   * Validate voucher entries
   */
  async validateVoucherEntries(entries: VoucherEntry[]): Promise<{
    success: boolean;
    isValid: boolean;
    errors?: string[];
  }> {
    const response = await apiClient.post(`${this.baseURL}/validate-entries`, { entries });
    return response.data;
  }

  /**
   * Get next voucher number
   */
  async getNextVoucherNumber(type: string, companyId: string): Promise<{
    success: boolean;
    data: {
      nextNumber: string;
      prefix: string;
      sequence: number;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/next-number`, {
      params: { type, companyId }
    });
    return response.data;
  }

  /**
   * Search vouchers
   */
  async searchVouchers(query: string, filters?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
  }): Promise<VoucherListResponse> {
    const response = await apiClient.get(`${this.baseURL}/search`, {
      params: { q: query, ...filters }
    });
    return response.data;
  }

  /**
   * Get recent vouchers
   */
  async getRecentVouchers(limit: number = 10, companyId?: string): Promise<VoucherListResponse> {
    const params = { limit, ...(companyId && { companyId }) };
    const response = await apiClient.get(`${this.baseURL}/recent`, { params });
    return response.data;
  }

  /**
   * Bulk delete vouchers
   */
  async bulkDeleteVouchers(voucherIds: string[]): Promise<{
    success: boolean;
    message: string;
    deleted: number;
  }> {
    const response = await apiClient.post(`${this.baseURL}/bulk-delete`, { voucherIds });
    return response.data;
  }

  /**
   * Export vouchers
   */
  async exportVouchers(format: 'csv' | 'excel', filters?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
  }): Promise<Blob> {
    const response = await apiClient.download(`${this.baseURL}/export`, {
      params: { format, ...filters }
    });
    return response.data;
  }
}

export const voucherService = new VoucherService();
