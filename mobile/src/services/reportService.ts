import { apiClient } from './apiClient';

export interface ReportParams {
  companyId: string;
  dateFrom?: string;
  dateTo?: string;
  format?: 'json' | 'pdf' | 'excel' | 'csv';
  filters?: Record<string, any>;
}

export interface FinancialReport {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  trends: Array<{
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export interface SalesReport {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    orders: number;
  }>;
}

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  topMovingItems: Array<{
    id: string;
    name: string;
    quantity: number;
    value: number;
  }>;
  categoryBreakdown: Record<string, {
    items: number;
    value: number;
  }>;
}

export interface TaxReport {
  totalTaxCollected: number;
  totalTaxPaid: number;
  netTaxLiability: number;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
  taxByPeriod: Array<{
    period: string;
    collected: number;
    paid: number;
  }>;
}

class ReportService {
  private readonly baseURL = '/reports';

  /**
   * Get financial report
   */
  async getFinancialReport(params: ReportParams): Promise<{
    success: boolean;
    data: FinancialReport;
  }> {
    const response = await apiClient.get(`${this.baseURL}/financial`, { params });
    return response.data;
  }

  /**
   * Get sales report
   */
  async getSalesReport(params: ReportParams): Promise<{
    success: boolean;
    data: SalesReport;
  }> {
    const response = await apiClient.get(`${this.baseURL}/sales`, { params });
    return response.data;
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(params: ReportParams): Promise<{
    success: boolean;
    data: InventoryReport;
  }> {
    const response = await apiClient.get(`${this.baseURL}/inventory`, { params });
    return response.data;
  }

  /**
   * Get tax report
   */
  async getTaxReport(params: ReportParams): Promise<{
    success: boolean;
    data: TaxReport;
  }> {
    const response = await apiClient.get(`${this.baseURL}/tax`, { params });
    return response.data;
  }

  /**
   * Get profit & loss report
   */
  async getProfitLossReport(params: ReportParams): Promise<{
    success: boolean;
    data: {
      income: Array<{
        account: string;
        amount: number;
      }>;
      expenses: Array<{
        account: string;
        amount: number;
      }>;
      totalIncome: number;
      totalExpenses: number;
      netProfit: number;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/profit-loss`, { params });
    return response.data;
  }

  /**
   * Get balance sheet report
   */
  async getBalanceSheetReport(params: ReportParams): Promise<{
    success: boolean;
    data: {
      assets: {
        current: Array<{ account: string; amount: number }>;
        fixed: Array<{ account: string; amount: number }>;
        total: number;
      };
      liabilities: {
        current: Array<{ account: string; amount: number }>;
        longTerm: Array<{ account: string; amount: number }>;
        total: number;
      };
      equity: {
        capital: number;
        retainedEarnings: number;
        total: number;
      };
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/balance-sheet`, { params });
    return response.data;
  }

  /**
   * Get cash flow report
   */
  async getCashFlowReport(params: ReportParams): Promise<{
    success: boolean;
    data: {
      operating: Array<{
        description: string;
        amount: number;
      }>;
      investing: Array<{
        description: string;
        amount: number;
      }>;
      financing: Array<{
        description: string;
        amount: number;
      }>;
      netCashFlow: number;
      openingBalance: number;
      closingBalance: number;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/cash-flow`, { params });
    return response.data;
  }

  /**
   * Get trial balance report
   */
  async getTrialBalanceReport(params: ReportParams): Promise<{
    success: boolean;
    data: {
      accounts: Array<{
        account: string;
        debit: number;
        credit: number;
      }>;
      totalDebit: number;
      totalCredit: number;
      isBalanced: boolean;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/trial-balance`, { params });
    return response.data;
  }

  /**
   * Get aging report
   */
  async getAgingReport(params: ReportParams & {
    type: 'receivables' | 'payables';
  }): Promise<{
    success: boolean;
    data: {
      parties: Array<{
        name: string;
        current: number;
        days30: number;
        days60: number;
        days90: number;
        over90: number;
        total: number;
      }>;
      summary: {
        current: number;
        days30: number;
        days60: number;
        days90: number;
        over90: number;
        total: number;
      };
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/aging`, { params });
    return response.data;
  }

  /**
   * Get custom report
   */
  async getCustomReport(reportId: string, params: ReportParams): Promise<{
    success: boolean;
    data: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/custom/${reportId}`, { params });
    return response.data;
  }

  /**
   * Generate report file
   */
  async generateReportFile(reportType: string, params: ReportParams): Promise<Blob> {
    const response = await apiClient.download(`${this.baseURL}/${reportType}/generate`, {
      params
    });
    return response.data;
  }

  /**
   * Get available reports
   */
  async getAvailableReports(): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        options?: string[];
      }>;
    }>;
  }> {
    const response = await apiClient.get(`${this.baseURL}/available`);
    return response.data;
  }

  /**
   * Schedule report
   */
  async scheduleReport(scheduleData: {
    reportType: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    parameters: ReportParams;
  }): Promise<{
    success: boolean;
    message: string;
    scheduleId: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/schedule`, scheduleData);
    return response.data;
  }
}

export const reportService = new ReportService();
