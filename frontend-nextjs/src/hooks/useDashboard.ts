import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, DashboardData, DashboardStats, RecentActivity } from '@/services/dashboardService';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export const useDashboardData = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['dashboard', currentCompany?._id],
    queryFn: () => dashboardService.getDashboardData(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
};

export const useDashboardStats = (period: '7d' | '30d' | '90d' | '1y' = '30d') => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['dashboard-stats', currentCompany?._id, period],
    queryFn: () => dashboardService.getStats(currentCompany!._id, period),
    enabled: !!currentCompany,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.data,
  });
};

export const useRecentActivities = (limit: number = 10) => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['recent-activities', currentCompany?._id, limit],
    queryFn: () => dashboardService.getRecentActivities(currentCompany!._id, limit),
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.data,
  });
};

export const useDashboardAlerts = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['dashboard-alerts', currentCompany?._id],
    queryFn: () => dashboardService.getAlerts(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data.data,
  });
};

export const useBusinessMetrics = (daysBack: number = 30) => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['business-metrics', currentCompany?._id, daysBack],
    queryFn: () => dashboardService.getBusinessMetrics(currentCompany!._id, daysBack),
    enabled: !!currentCompany,
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data.data,
    retry: 1, // ML service might be slower
  });
};

export const usePaymentTrends = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['payment-trends', currentCompany?._id],
    queryFn: () => dashboardService.getPaymentTrends(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 15 * 60 * 1000, // 15 minutes
    select: (data) => data.data,
    retry: 1,
  });
};

export const useInventoryAnalytics = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['inventory-analytics', currentCompany?._id],
    queryFn: () => dashboardService.getInventoryAnalytics(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 15 * 60 * 1000,
    select: (data) => data.data,
    retry: 1,
  });
};

export const useRiskDashboard = () => {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['risk-dashboard', currentCompany?._id],
    queryFn: () => dashboardService.getRiskDashboard(currentCompany!._id),
    enabled: !!currentCompany,
    staleTime: 10 * 60 * 1000,
    select: (data) => data.data,
    retry: 1,
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  return useMutation({
    mutationFn: dashboardService.markAlertAsRead,
    onSuccess: () => {
      // Invalidate alerts query to refetch
      queryClient.invalidateQueries({
        queryKey: ['dashboard-alerts', currentCompany?._id],
      });
    },
    onError: (error) => {
      toast.error('Failed to mark alert as read');
      console.error('Mark alert as read error:', error);
    },
  });
};
