import api from '@/lib/api';
import { ApiResponse } from '@/types';

export interface DashboardStats {
  totalRevenue: number;
  totalVouchers: number;
  inventoryItems: number;
  overduePayments: number;
  revenueChange: number;
  vouchersChange: number;
  inventoryChange: number;
  overdueChange: number;
}

export interface RecentActivity {
  id: string;
  type: 'voucher_created' | 'payment_received' | 'item_added' | 'sync_completed';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'primary' | 'success' | 'warning' | 'error';
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  quickActions: QuickAction[];
  alerts: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
  }[];
}

export const dashboardService = {
  // Get dashboard overview data
  async getDashboardData(companyId: string): Promise<ApiResponse<DashboardData>> {
    const response = await api.get<ApiResponse<DashboardData>>(`/api/dashboard/${companyId}`);
    return response.data;
  },

  // Get dashboard stats
  async getStats(companyId: string, period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get<ApiResponse<DashboardStats>>(`/api/dashboard/${companyId}/stats`, {
      params: { period }
    });
    return response.data;
  },

  // Get recent activities
  async getRecentActivities(companyId: string, limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    const response = await api.get<ApiResponse<RecentActivity[]>>(`/api/dashboard/${companyId}/activities`, {
      params: { limit }
    });
    return response.data;
  },

  // Get alerts and notifications
  async getAlerts(companyId: string): Promise<ApiResponse<DashboardData['alerts']>> {
    const response = await api.get<ApiResponse<DashboardData['alerts']>>(`/api/dashboard/${companyId}/alerts`);
    return response.data;
  },

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>(`/api/dashboard/alerts/${alertId}/read`);
    return response.data;
  },

  // Get business metrics from ML service
  async getBusinessMetrics(companyId: string, daysBack: number = 30): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`/api/ml/business-metrics`, {
      params: { 
        company_id: companyId,
        days_back: daysBack 
      }
    });
    return response.data;
  },

  // Get payment trends
  async getPaymentTrends(companyId: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`/api/ml/payment-trends`, {
      params: { company_id: companyId }
    });
    return response.data;
  },

  // Get inventory analytics
  async getInventoryAnalytics(companyId: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`/api/ml/inventory-analytics`, {
      params: { company_id: companyId }
    });
    return response.data;
  },

  // Get risk dashboard data
  async getRiskDashboard(companyId: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`/api/ml/risk-dashboard`, {
      params: { company_id: companyId }
    });
    return response.data;
  },
};
