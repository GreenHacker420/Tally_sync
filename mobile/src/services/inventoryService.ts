import { apiClient } from './apiClient';
import { InventoryItem, CreateInventoryItemData, UpdateInventoryItemData } from '../types';

export interface InventoryListResponse {
  success: boolean;
  data: InventoryItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


export interface InventoryResponse {
  success: boolean;
  data: InventoryItem;
}

export interface InventoryStatsResponse {
  success: boolean;
  data: {
    total: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    categories: Record<string, number>;
    topItems: Array<{
      id: string;
      name: string;
      currentStock: number;
      value: number;
    }>;
  };
}

export interface StockMovementResponse {
  success: boolean;
  data: Array<{
    id: string;
    itemId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reference: string;
    date: string;
    notes?: string;
  }>;
}

class InventoryService {
  private readonly baseURL = '/inventory';

  /**
   * Get inventory items with filtering and pagination
   */
  async getItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    lowStock?: boolean;
    companyId?: string;
  }): Promise<InventoryListResponse> {
    const response = await apiClient.get(`${this.baseURL}/items`, { params });
    return response.data;
  }

  /**
   * Get inventory item by ID
   */
  async getItemById(itemId: string): Promise<InventoryResponse> {
    const response = await apiClient.get(`${this.baseURL}/items/${itemId}`);
    return response.data;
  }

  /**
   * Create new inventory item
   */
  async createItem(itemData: CreateInventoryItemData): Promise<InventoryResponse> {
    const response = await apiClient.post(`${this.baseURL}/items`, itemData);
    return response.data;
  }

  /**
   * Update inventory item
   */
  async updateItem(itemId: string, itemData: UpdateInventoryItemData): Promise<InventoryResponse> {
    const response = await apiClient.put(`${this.baseURL}/items/${itemId}`, itemData);
    return response.data;
  }

  /**
   * Delete inventory item
   */
  async deleteItem(itemId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${this.baseURL}/items/${itemId}`);
    return response.data;
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(companyId?: string): Promise<InventoryStatsResponse> {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get(`${this.baseURL}/stats`, { params });
    return response.data;
  }

  /**
   * Update item stock
   */
  async updateStock(itemId: string, data: {
    quantity: number;
    type: 'in' | 'out' | 'adjustment';
    reference?: string;
    notes?: string;
  }): Promise<InventoryResponse> {
    const response = await apiClient.post(`${this.baseURL}/items/${itemId}/stock`, data);
    return response.data;
  }

  /**
   * Get stock movements for an item
   */
  async getStockMovements(itemId: string, params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StockMovementResponse> {
    const response = await apiClient.get(`${this.baseURL}/items/${itemId}/movements`, { params });
    return response.data;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(companyId?: string): Promise<InventoryListResponse> {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get(`${this.baseURL}/low-stock`, { params });
    return response.data;
  }

  /**
   * Get item categories
   */
  async getCategories(companyId?: string): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      count: number;
    }>;
  }> {
    const params = companyId ? { companyId } : {};
    const response = await apiClient.get(`${this.baseURL}/categories`, { params });
    return response.data;
  }

  /**
   * Search inventory items
   */
  async searchItems(query: string, filters?: {
    category?: string;
    companyId?: string;
  }): Promise<InventoryListResponse> {
    const response = await apiClient.get(`${this.baseURL}/search`, {
      params: { q: query, ...filters }
    });
    return response.data;
  }

  /**
   * Bulk update items
   */
  async bulkUpdateItems(updates: Array<{
    id: string;
    data: Partial<InventoryItem>;
  }>): Promise<{
    success: boolean;
    message: string;
    updated: number;
  }> {
    const response = await apiClient.post(`${this.baseURL}/bulk-update`, { updates });
    return response.data;
  }

  /**
   * Import items from CSV/Excel
   */
  async importItems(file: FormData): Promise<{
    success: boolean;
    message: string;
    imported: number;
    errors?: string[];
  }> {
    const response = await apiClient.upload(`${this.baseURL}/import`, file);
    return response.data;
  }

  /**
   * Export items
   */
  async exportItems(format: 'csv' | 'excel', filters?: {
    category?: string;
    companyId?: string;
  }): Promise<Blob> {
    const response = await apiClient.download(`${this.baseURL}/export`, {
      params: { format, ...filters }
    });
    return response.data;
  }

  /**
   * Generate barcode for item
   */
  async generateBarcode(itemId: string, format: 'code128' | 'qr' = 'code128'): Promise<{
    success: boolean;
    data: {
      barcode: string;
      image: string; // base64 encoded image
    };
  }> {
    const response = await apiClient.post(`${this.baseURL}/items/${itemId}/barcode`, { format });
    return response.data;
  }

  /**
   * Get item valuation
   */
  async getItemValuation(companyId?: string, method: 'fifo' | 'lifo' | 'average' = 'fifo'): Promise<{
    success: boolean;
    data: {
      totalValue: number;
      items: Array<{
        id: string;
        name: string;
        quantity: number;
        rate: number;
        value: number;
      }>;
    };
  }> {
    const params = { method, ...(companyId && { companyId }) };
    const response = await apiClient.get(`${this.baseURL}/valuation`, { params });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
