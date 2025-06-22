import api from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface InventoryItem {
  _id: string;
  company: string;
  name: string;
  code?: string;
  barcode?: string;
  type: 'product' | 'service';
  category?: string;
  description?: string;
  pricing: {
    costPrice?: number;
    sellingPrice?: number;
    mrp?: number;
    margin?: number;
  };
  stock: {
    quantity: number;
    unit: string;
    reorderLevel?: number;
    maxLevel?: number;
    location?: string;
  };
  taxation: {
    hsnCode?: string;
    sacCode?: string;
    gstRate: number;
    taxable: boolean;
  };
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFilters {
  type?: 'product' | 'service';
  category?: string;
  lowStock?: boolean;
  search?: string;
  isActive?: boolean;
}

export interface CreateInventoryItemData {
  name: string;
  code?: string;
  barcode?: string;
  type: 'product' | 'service';
  category?: string;
  description?: string;
  pricing: {
    costPrice?: number;
    sellingPrice?: number;
    mrp?: number;
  };
  stock: {
    quantity: number;
    unit: string;
    reorderLevel?: number;
    maxLevel?: number;
    location?: string;
  };
  taxation: {
    hsnCode?: string;
    sacCode?: string;
    gstRate: number;
    taxable: boolean;
  };
}

export interface StockMovement {
  _id: string;
  item: string | InventoryItem;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: {
    type: 'voucher' | 'manual' | 'sync';
    id: string;
  };
  user: string;
  timestamp: string;
}

export const inventoryService = {
  // Get all inventory items with pagination and filters
  async getItems(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters: InventoryFilters = {}
  ): Promise<PaginatedResponse<InventoryItem>> {
    const response = await api.get<PaginatedResponse<InventoryItem>>('/api/inventory/items', {
      params: {
        company: companyId,
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  // Get single inventory item by ID
  async getItem(itemId: string): Promise<ApiResponse<InventoryItem>> {
    const response = await api.get<ApiResponse<InventoryItem>>(`/api/inventory/items/${itemId}`);
    return response.data;
  },

  // Create new inventory item
  async createItem(companyId: string, itemData: CreateInventoryItemData): Promise<ApiResponse<InventoryItem>> {
    const response = await api.post<ApiResponse<InventoryItem>>('/api/inventory/items', {
      ...itemData,
      company: companyId,
    });
    return response.data;
  },

  // Update inventory item
  async updateItem(itemId: string, itemData: Partial<CreateInventoryItemData>): Promise<ApiResponse<InventoryItem>> {
    const response = await api.put<ApiResponse<InventoryItem>>(`/api/inventory/items/${itemId}`, itemData);
    return response.data;
  },

  // Delete inventory item
  async deleteItem(itemId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/api/inventory/items/${itemId}`);
    return response.data;
  },

  // Upload item images
  async uploadImages(itemId: string, files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse>(`/api/inventory/items/${itemId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete item image
  async deleteImage(itemId: string, imageUrl: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/api/inventory/items/${itemId}/images`, {
      data: { imageUrl },
    });
    return response.data;
  },

  // Adjust stock
  async adjustStock(
    itemId: string,
    quantity: number,
    reason: string,
    type: 'in' | 'out' | 'adjustment' = 'adjustment'
  ): Promise<ApiResponse<InventoryItem>> {
    const response = await api.post<ApiResponse<InventoryItem>>(`/api/inventory/items/${itemId}/adjust-stock`, {
      quantity,
      reason,
      type,
    });
    return response.data;
  },

  // Get stock movements for an item
  async getStockMovements(
    itemId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<StockMovement>> {
    const response = await api.get<PaginatedResponse<StockMovement>>(`/api/inventory/items/${itemId}/movements`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get low stock items
  async getLowStockItems(companyId: string): Promise<ApiResponse<InventoryItem[]>> {
    const response = await api.get<ApiResponse<InventoryItem[]>>('/api/inventory/low-stock', {
      params: { company: companyId },
    });
    return response.data;
  },

  // Get inventory categories
  async getCategories(companyId: string): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>('/api/inventory/categories', {
      params: { company: companyId },
    });
    return response.data;
  },

  // Get inventory summary
  async getInventorySummary(companyId: string): Promise<ApiResponse<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categories: number;
  }>> {
    const response = await api.get<ApiResponse<any>>('/api/inventory/summary', {
      params: { company: companyId },
    });
    return response.data;
  },

  // Sync with Tally
  async syncWithTally(companyId: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/api/inventory/sync-tally', {
      company: companyId,
    });
    return response.data;
  },

  // Generate barcode
  async generateBarcode(itemId: string): Promise<ApiResponse<{ barcode: string }>> {
    const response = await api.post<ApiResponse<{ barcode: string }>>(`/api/inventory/items/${itemId}/generate-barcode`);
    return response.data;
  },

  // Search items by barcode
  async searchByBarcode(barcode: string, companyId: string): Promise<ApiResponse<InventoryItem>> {
    const response = await api.get<ApiResponse<InventoryItem>>('/api/inventory/search-barcode', {
      params: { barcode, company: companyId },
    });
    return response.data;
  },
};
