import { apiClient } from './apiClient';
import { Company, CreateCompanyData, UpdateCompanyData } from '../types';

export interface CompanyListResponse {
  success: boolean;
  data: Company[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CompanyResponse {
  success: boolean;
  data: Company;
}

export interface CompanyStatsResponse {
  success: boolean;
  data: {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    totalVouchers: number;
    totalItems: number;
  };
}

class CompanyService {
  private readonly baseURL = '/companies';

  /**
   * Get all companies for the current user
   */
  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<CompanyListResponse> {
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * Get company by ID
   */
  async getCompanyById(companyId: string): Promise<CompanyResponse> {
    const response = await apiClient.get(`${this.baseURL}/${companyId}`);
    return response.data;
  }

  /**
   * Create new company
   */
  async createCompany(companyData: CreateCompanyData): Promise<CompanyResponse> {
    const response = await apiClient.post(this.baseURL, companyData);
    return response.data;
  }

  /**
   * Update company
   */
  async updateCompany(companyId: string, companyData: UpdateCompanyData): Promise<CompanyResponse> {
    const response = await apiClient.put(`${this.baseURL}/${companyId}`, companyData);
    return response.data;
  }

  /**
   * Delete company (soft delete)
   */
  async deleteCompany(companyId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${this.baseURL}/${companyId}`);
    return response.data;
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string): Promise<CompanyStatsResponse> {
    const response = await apiClient.get(`${this.baseURL}/${companyId}/stats`);
    return response.data;
  }

  /**
   * Switch active company
   */
  async switchCompany(companyId: string): Promise<CompanyResponse> {
    const response = await apiClient.post(`${this.baseURL}/${companyId}/switch`);
    return response.data;
  }

  /**
   * Get company settings
   */
  async getCompanySettings(companyId: string): Promise<{
    success: boolean;
    data: Record<string, any>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/${companyId}/settings`);
    return response.data;
  }

  /**
   * Update company settings
   */
  async updateCompanySettings(
    companyId: string,
    settings: Record<string, any>
  ): Promise<{
    success: boolean;
    data: Record<string, any>;
  }> {
    const response = await apiClient.put(`${this.baseURL}/${companyId}/settings`, settings);
    return response.data;
  }

  /**
   * Get company users
   */
  async getCompanyUsers(companyId: string, params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination?: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/${companyId}/users`, { params });
    return response.data;
  }

  /**
   * Invite user to company
   */
  async inviteUser(companyId: string, userData: {
    email: string;
    role: string;
    permissions?: string[];
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/${companyId}/invite`, userData);
    return response.data;
  }

  /**
   * Remove user from company
   */
  async removeUser(companyId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.delete(`${this.baseURL}/${companyId}/users/${userId}`);
    return response.data;
  }
}

export const companyService = new CompanyService();
