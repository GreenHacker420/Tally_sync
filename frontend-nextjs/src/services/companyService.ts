import api from '@/lib/api';
import { Company, ApiResponse, PaginatedResponse } from '@/types';

export const companyService = {
  // Get all companies for current user
  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Company>> {
    const response = await api.get<PaginatedResponse<Company>>('/companies', { params });
    return response.data;
  },

  // Get company by ID
  async getCompany(id: string): Promise<ApiResponse<Company>> {
    const response = await api.get<ApiResponse<Company>>(`/companies/${id}`);
    return response.data;
  },

  // Create new company
  async createCompany(companyData: Partial<Company>): Promise<ApiResponse<Company>> {
    const response = await api.post<ApiResponse<Company>>('/companies', companyData);
    return response.data;
  },

  // Update company
  async updateCompany(id: string, companyData: Partial<Company>): Promise<ApiResponse<Company>> {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}`, companyData);
    return response.data;
  },

  // Delete company
  async deleteCompany(id: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/companies/${id}`);
    return response.data;
  },

  // Upload company logo
  async uploadLogo(id: string, file: File): Promise<ApiResponse<Company>> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await api.post<ApiResponse<Company>>(`/companies/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Delete company logo
  async deleteLogo(id: string): Promise<ApiResponse<Company>> {
    const response = await api.delete<ApiResponse<Company>>(`/companies/${id}/logo`);
    return response.data;
  },

  // Add user to company
  async addUser(id: string, userData: {
    email: string;
    role: string;
    permissions?: any;
  }): Promise<ApiResponse<Company>> {
    const response = await api.post<ApiResponse<Company>>(`/companies/${id}/users`, userData);
    return response.data;
  },

  // Update user role in company
  async updateUserRole(id: string, userId: string, roleData: {
    role: string;
    permissions?: any;
  }): Promise<ApiResponse<Company>> {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}/users/${userId}`, roleData);
    return response.data;
  },

  // Remove user from company
  async removeUser(id: string, userId: string): Promise<ApiResponse<Company>> {
    const response = await api.delete<ApiResponse<Company>>(`/companies/${id}/users/${userId}`);
    return response.data;
  },

  // Get company statistics
  async getCompanyStats(id: string): Promise<ApiResponse<{
    totalVouchers: number;
    totalRevenue: number;
    totalExpenses: number;
    totalItems: number;
    recentActivity: any[];
  }>> {
    const response = await api.get(`/companies/${id}/stats`);
    return response.data;
  },

  // Update Tally integration settings
  async updateTallySettings(id: string, settings: {
    enabled: boolean;
    companyPath?: string;
    syncSettings?: {
      autoSync: boolean;
      syncInterval: number;
      syncVouchers: boolean;
      syncInventory: boolean;
      syncMasters: boolean;
    };
  }): Promise<ApiResponse<Company>> {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}/tally-settings`, settings);
    return response.data;
  },

  // Sync with Tally
  async syncWithTally(id: string, options?: {
    syncType?: 'full' | 'incremental';
    entities?: string[];
  }): Promise<ApiResponse<{
    syncId: string;
    status: string;
    message: string;
  }>> {
    const response = await api.post(`/companies/${id}/sync-tally`, options);
    return response.data;
  },

  // Get sync status
  async getSyncStatus(id: string, syncId?: string): Promise<ApiResponse<{
    status: string;
    progress: number;
    message: string;
    errors?: string[];
  }>> {
    const url = syncId ? `/companies/${id}/sync-status/${syncId}` : `/companies/${id}/sync-status`;
    const response = await api.get(url);
    return response.data;
  },

  // Update subscription
  async updateSubscription(id: string, subscriptionData: {
    plan: string;
    features?: any;
  }): Promise<ApiResponse<Company>> {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}/subscription`, subscriptionData);
    return response.data;
  },

  // Get company financial year
  async getFinancialYear(id: string): Promise<ApiResponse<{
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>> {
    const response = await api.get(`/companies/${id}/financial-year`);
    return response.data;
  },

  // Update financial year
  async updateFinancialYear(id: string, financialYear: {
    startDate: Date;
    endDate: Date;
  }): Promise<ApiResponse<Company>> {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}/financial-year`, financialYear);
    return response.data;
  },

  // Validate company data
  validateCompanyData(data: Partial<Company>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Company name is required');
    }

    if (!data.address?.line1?.trim()) {
      errors.push('Address line 1 is required');
    }

    if (!data.address?.city?.trim()) {
      errors.push('City is required');
    }

    if (!data.address?.state?.trim()) {
      errors.push('State is required');
    }

    if (!data.address?.pincode?.trim()) {
      errors.push('Pincode is required');
    } else if (!/^[1-9][0-9]{5}$/.test(data.address.pincode)) {
      errors.push('Invalid pincode format');
    }

    if (!data.contact?.phone?.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\+?[1-9]\d{1,14}$/.test(data.contact.phone)) {
      errors.push('Invalid phone number format');
    }

    if (!data.contact?.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.contact.email)) {
      errors.push('Invalid email format');
    }

    if (data.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstin)) {
      errors.push('Invalid GSTIN format');
    }

    if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan)) {
      errors.push('Invalid PAN format');
    }

    if (!data.businessType) {
      errors.push('Business type is required');
    }

    if (!data.industry?.trim()) {
      errors.push('Industry is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default companyService;
