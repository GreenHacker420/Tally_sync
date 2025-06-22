import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherService, VoucherFilters, CreateVoucherData } from '@/services/voucherService';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export const useVouchers = (
  page: number = 1,
  limit: number = 20,
  filters: VoucherFilters = {}
) => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['vouchers', currentCompany?._id, page, limit, filters],
    queryFn: () => voucherService.getVouchers(currentCompany!._id, page, limit, filters),
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useVoucher = (voucherId: string) => {
  return useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => voucherService.getVoucher(voucherId),
    enabled: !!voucherId,
    select: (data) => data.data,
  });
};

export const useVoucherTypes = () => {
  return useQuery({
    queryKey: ['voucher-types'],
    queryFn: voucherService.getVoucherTypes,
    staleTime: Infinity, // Static data
    select: (data) => data.data,
  });
};

export const useVoucherStatuses = () => {
  return useQuery({
    queryKey: ['voucher-statuses'],
    queryFn: voucherService.getVoucherStatuses,
    staleTime: Infinity, // Static data
    select: (data) => data.data,
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: (data: CreateVoucherData) => 
      voucherService.createVoucher(currentCompany!._id, data),
    onSuccess: (data) => {
      toast.success('Voucher created successfully');
      // Invalidate vouchers list
      queryClient.invalidateQueries({
        queryKey: ['vouchers', currentCompany?._id],
      });
      // Invalidate dashboard data
      queryClient.invalidateQueries({
        queryKey: ['dashboard', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to create voucher');
      console.error('Create voucher error:', error);
    },
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: ({ voucherId, data }: { voucherId: string; data: Partial<CreateVoucherData> }) =>
      voucherService.updateVoucher(voucherId, data),
    onSuccess: (data, variables) => {
      toast.success('Voucher updated successfully');
      // Invalidate specific voucher
      queryClient.invalidateQueries({
        queryKey: ['voucher', variables.voucherId],
      });
      // Invalidate vouchers list
      queryClient.invalidateQueries({
        queryKey: ['vouchers', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to update voucher');
      console.error('Update voucher error:', error);
    },
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: voucherService.deleteVoucher,
    onSuccess: () => {
      toast.success('Voucher deleted successfully');
      // Invalidate vouchers list
      queryClient.invalidateQueries({
        queryKey: ['vouchers', currentCompany?._id],
      });
      // Invalidate dashboard data
      queryClient.invalidateQueries({
        queryKey: ['dashboard', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to delete voucher');
      console.error('Delete voucher error:', error);
    },
  });
};

export const useApproveVoucher = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: ({ voucherId, comments }: { voucherId: string; comments?: string }) =>
      voucherService.approveVoucher(voucherId, comments),
    onSuccess: (data, variables) => {
      toast.success('Voucher approved successfully');
      // Invalidate specific voucher
      queryClient.invalidateQueries({
        queryKey: ['voucher', variables.voucherId],
      });
      // Invalidate vouchers list
      queryClient.invalidateQueries({
        queryKey: ['vouchers', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to approve voucher');
      console.error('Approve voucher error:', error);
    },
  });
};

export const useRejectVoucher = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: ({ voucherId, reason }: { voucherId: string; reason: string }) =>
      voucherService.rejectVoucher(voucherId, reason),
    onSuccess: (data, variables) => {
      toast.success('Voucher rejected');
      // Invalidate specific voucher
      queryClient.invalidateQueries({
        queryKey: ['voucher', variables.voucherId],
      });
      // Invalidate vouchers list
      queryClient.invalidateQueries({
        queryKey: ['vouchers', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to reject voucher');
      console.error('Reject voucher error:', error);
    },
  });
};

export const useSyncVoucherWithTally = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: voucherService.syncWithTally,
    onSuccess: (data, voucherId) => {
      toast.success('Voucher synced with Tally successfully');
      // Invalidate specific voucher
      queryClient.invalidateQueries({
        queryKey: ['voucher', voucherId],
      });
      // Invalidate vouchers list
      queryClient.invalidateQueries({
        queryKey: ['vouchers', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to sync voucher with Tally');
      console.error('Sync voucher error:', error);
    },
  });
};

export const useGenerateVoucherPDF = () => {
  return useMutation({
    mutationFn: voucherService.generateVoucherPDF,
    onSuccess: (blob, voucherId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voucher-${voucherId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF generated successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate PDF');
      console.error('Generate PDF error:', error);
    },
  });
};

export const useUploadVoucherAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ voucherId, file }: { voucherId: string; file: File }) =>
      voucherService.uploadAttachment(voucherId, file),
    onSuccess: (data, variables) => {
      toast.success('Attachment uploaded successfully');
      // Invalidate specific voucher
      queryClient.invalidateQueries({
        queryKey: ['voucher', variables.voucherId],
      });
    },
    onError: (error) => {
      toast.error('Failed to upload attachment');
      console.error('Upload attachment error:', error);
    },
  });
};
