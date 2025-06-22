import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, InventoryFilters, CreateInventoryItemData } from '@/services/inventoryService';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export const useInventoryItems = (
  page: number = 1,
  limit: number = 20,
  filters: InventoryFilters = {}
) => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['inventory-items', currentCompany?._id, page, limit, filters],
    queryFn: () => inventoryService.getItems(currentCompany!._id, page, limit, filters),
    enabled: !!currentCompany,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInventoryItem = (itemId: string) => {
  return useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: () => inventoryService.getItem(itemId),
    enabled: !!itemId,
    select: (data) => data.data,
  });
};

export const useLowStockItems = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['low-stock-items', currentCompany?._id],
    queryFn: () => inventoryService.getLowStockItems(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.data,
  });
};

export const useInventoryCategories = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['inventory-categories', currentCompany?._id],
    queryFn: () => inventoryService.getCategories(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data.data,
  });
};

export const useInventorySummary = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['inventory-summary', currentCompany?._id],
    queryFn: () => inventoryService.getInventorySummary(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.data,
  });
};

export const useStockMovements = (itemId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['stock-movements', itemId, page, limit],
    queryFn: () => inventoryService.getStockMovements(itemId, page, limit),
    enabled: !!itemId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: (data: CreateInventoryItemData) => 
      inventoryService.createItem(currentCompany!._id, data),
    onSuccess: () => {
      toast.success('Item created successfully');
      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: ['inventory-items', currentCompany?._id],
      });
      // Invalidate inventory summary
      queryClient.invalidateQueries({
        queryKey: ['inventory-summary', currentCompany?._id],
      });
      // Invalidate dashboard data
      queryClient.invalidateQueries({
        queryKey: ['dashboard', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to create item');
      console.error('Create item error:', error);
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<CreateInventoryItemData> }) =>
      inventoryService.updateItem(itemId, data),
    onSuccess: (data, variables) => {
      toast.success('Item updated successfully');
      // Invalidate specific item
      queryClient.invalidateQueries({
        queryKey: ['inventory-item', variables.itemId],
      });
      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: ['inventory-items', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to update item');
      console.error('Update item error:', error);
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: inventoryService.deleteItem,
    onSuccess: () => {
      toast.success('Item deleted successfully');
      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: ['inventory-items', currentCompany?._id],
      });
      // Invalidate inventory summary
      queryClient.invalidateQueries({
        queryKey: ['inventory-summary', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to delete item');
      console.error('Delete item error:', error);
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: ({ 
      itemId, 
      quantity, 
      reason, 
      type = 'adjustment' 
    }: { 
      itemId: string; 
      quantity: number; 
      reason: string; 
      type?: 'in' | 'out' | 'adjustment';
    }) => inventoryService.adjustStock(itemId, quantity, reason, type),
    onSuccess: (data, variables) => {
      toast.success('Stock adjusted successfully');
      // Invalidate specific item
      queryClient.invalidateQueries({
        queryKey: ['inventory-item', variables.itemId],
      });
      // Invalidate stock movements
      queryClient.invalidateQueries({
        queryKey: ['stock-movements', variables.itemId],
      });
      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: ['inventory-items', currentCompany?._id],
      });
      // Invalidate low stock items
      queryClient.invalidateQueries({
        queryKey: ['low-stock-items', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to adjust stock');
      console.error('Adjust stock error:', error);
    },
  });
};

export const useUploadItemImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, files }: { itemId: string; files: File[] }) =>
      inventoryService.uploadImages(itemId, files),
    onSuccess: (data, variables) => {
      toast.success('Images uploaded successfully');
      // Invalidate specific item
      queryClient.invalidateQueries({
        queryKey: ['inventory-item', variables.itemId],
      });
    },
    onError: (error) => {
      toast.error('Failed to upload images');
      console.error('Upload images error:', error);
    },
  });
};

export const useSyncInventoryWithTally = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: () => inventoryService.syncWithTally(currentCompany!._id),
    onSuccess: () => {
      toast.success('Inventory synced with Tally successfully');
      // Invalidate all inventory data
      queryClient.invalidateQueries({
        queryKey: ['inventory-items', currentCompany?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-summary', currentCompany?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ['low-stock-items', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to sync inventory with Tally');
      console.error('Sync inventory error:', error);
    },
  });
};

export const useGenerateBarcode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: inventoryService.generateBarcode,
    onSuccess: (data, itemId) => {
      toast.success('Barcode generated successfully');
      // Invalidate specific item
      queryClient.invalidateQueries({
        queryKey: ['inventory-item', itemId],
      });
    },
    onError: (error) => {
      toast.error('Failed to generate barcode');
      console.error('Generate barcode error:', error);
    },
  });
};

export const useSearchByBarcode = () => {
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: (barcode: string) => 
      inventoryService.searchByBarcode(barcode, currentCompany!._id),
    onError: (error) => {
      toast.error('Item not found');
      console.error('Search by barcode error:', error);
    },
  });
};
