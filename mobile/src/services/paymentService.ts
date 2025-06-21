import { apiClient } from './apiClient';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  createdAt: string;
  notes?: Record<string, any>;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentLink {
  id: string;
  short_url: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface UPIQRCode {
  qr_code: string; // base64 encoded QR code image
  upi_url: string;
  amount: number;
  merchant_name: string;
}

class PaymentService {
  private readonly baseURL = '/payments';

  /**
   * Create payment order
   */
  async createOrder(orderData: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
    companyId: string;
  }): Promise<{
    success: boolean;
    data: PaymentOrder;
  }> {
    const response = await apiClient.post(`${this.baseURL}/orders`, orderData);
    return response.data;
  }

  /**
   * Verify payment
   */
  async verifyPayment(verificationData: PaymentVerification & {
    companyId: string;
  }): Promise<{
    success: boolean;
    data: {
      verified: boolean;
      payment: any;
    };
  }> {
    const response = await apiClient.post(`${this.baseURL}/verify`, verificationData);
    return response.data;
  }

  /**
   * Create payment link
   */
  async createPaymentLink(linkData: {
    amount: number;
    currency?: string;
    description: string;
    customer?: {
      name: string;
      email: string;
      contact: string;
    };
    notify?: {
      sms: boolean;
      email: boolean;
    };
    reminder_enable?: boolean;
    notes?: Record<string, any>;
    companyId: string;
  }): Promise<{
    success: boolean;
    data: PaymentLink;
  }> {
    const response = await apiClient.post(`${this.baseURL}/links`, linkData);
    return response.data;
  }

  /**
   * Generate UPI QR Code
   */
  async generateUPIQR(qrData: {
    amount: number;
    merchant_name: string;
    merchant_upi?: string;
    transaction_ref?: string;
    companyId: string;
  }): Promise<{
    success: boolean;
    data: UPIQRCode;
  }> {
    const response = await apiClient.post(`${this.baseURL}/upi-qr`, qrData);
    return response.data;
  }

  /**
   * Get payment orders
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
  }): Promise<{
    success: boolean;
    data: PaymentOrder[];
    pagination?: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/orders`, { params });
    return response.data;
  }

  /**
   * Get payment order by ID
   */
  async getOrderById(orderId: string): Promise<{
    success: boolean;
    data: PaymentOrder;
  }> {
    const response = await apiClient.get(`${this.baseURL}/orders/${orderId}`);
    return response.data;
  }

  /**
   * Get payment links
   */
  async getPaymentLinks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
  }): Promise<{
    success: boolean;
    data: PaymentLink[];
    pagination?: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/links`, { params });
    return response.data;
  }

  /**
   * Cancel payment link
   */
  async cancelPaymentLink(linkId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseURL}/links/${linkId}/cancel`);
    return response.data;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(companyId?: string, period?: string): Promise<{
    success: boolean;
    data: {
      totalAmount: number;
      totalTransactions: number;
      successfulPayments: number;
      failedPayments: number;
      pendingPayments: number;
      byMethod: Record<string, number>;
      byStatus: Record<string, number>;
      trends: Array<{
        date: string;
        amount: number;
        count: number;
      }>;
    };
  }> {
    const params = { ...(companyId && { companyId }), ...(period && { period }) };
    const response = await apiClient.get(`${this.baseURL}/stats`, { params });
    return response.data;
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, refundData: {
    amount?: number;
    notes?: Record<string, any>;
    receipt?: string;
  }): Promise<{
    success: boolean;
    data: any;
  }> {
    const response = await apiClient.post(`${this.baseURL}/${paymentId}/refund`, refundData);
    return response.data;
  }

  /**
   * Get refunds
   */
  async getRefunds(params?: {
    page?: number;
    limit?: number;
    paymentId?: string;
    companyId?: string;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination?: any;
  }> {
    const response = await apiClient.get(`${this.baseURL}/refunds`, { params });
    return response.data;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(companyId: string): Promise<{
    success: boolean;
    data: {
      cards: boolean;
      netbanking: boolean;
      wallets: boolean;
      upi: boolean;
      emi: boolean;
    };
  }> {
    const response = await apiClient.get(`${this.baseURL}/methods`, {
      params: { companyId }
    });
    return response.data;
  }

  /**
   * Update payment methods
   */
  async updatePaymentMethods(companyId: string, methods: {
    cards?: boolean;
    netbanking?: boolean;
    wallets?: boolean;
    upi?: boolean;
    emi?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.put(`${this.baseURL}/methods`, {
      companyId,
      ...methods
    });
    return response.data;
  }
}

export const paymentService = new PaymentService();
