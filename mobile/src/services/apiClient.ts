import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '@env';
import { authService } from './authService';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { setNetworkStatus } from '../store/slices/networkSlice';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

export interface RetryConfig {
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: AxiosError) => boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private cancelTokens: Map<string, AbortController> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const response = await authService.refreshToken();
            const { token } = response;

            // Process failed queue
            this.processQueue(null, token);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.processQueue(refreshError, null);
            store.dispatch(logout());
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle network errors
        this.handleNetworkError(error);

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private handleNetworkError(error: AxiosError): void {
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
    const isOnline = isNetworkError ? false : true;

    // Update network status in store
    store.dispatch(setNetworkStatus({ isOnline }));
  }

  private transformError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      isNetworkError: false,
      isTimeoutError: false,
    };

    if (error.response) {
      // Server responded with error status
      apiError.status = error.response.status;
      apiError.message = error.response.data?.message || error.message;
      apiError.code = error.response.data?.code;
      apiError.details = error.response.data;
    } else if (error.request) {
      // Network error
      apiError.isNetworkError = true;
      apiError.message = 'Network error. Please check your connection.';

      if (error.code === 'ECONNABORTED') {
        apiError.isTimeoutError = true;
        apiError.message = 'Request timed out. Please try again.';
      }
    } else {
      // Other error
      apiError.message = error.message;
    }

    return apiError;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    config: RetryConfig = {}
  ): Promise<AxiosResponse<T>> {
    const { retries = 3, retryDelay = 1000, retryCondition } = config;

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Check if we should retry this error
        if (retryCondition && !retryCondition(error as AxiosError)) {
          break;
        }

        // Default retry condition: retry on network errors and 5xx status codes
        const axiosError = error as AxiosError;
        const shouldRetry = !axiosError.response ||
          (axiosError.response.status >= 500 && axiosError.response.status < 600) ||
          axiosError.code === 'ECONNABORTED';

        if (!shouldRetry) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError;
  }

  // HTTP Methods with retry support
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig & { retry?: RetryConfig }
  ): Promise<AxiosResponse<T>> {
    const { retry, ...axiosConfig } = config || {};

    if (retry) {
      return this.retryRequest(() => this.client.get(url, axiosConfig), retry);
    }

    return this.client.get(url, axiosConfig);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { retry?: RetryConfig }
  ): Promise<AxiosResponse<T>> {
    const { retry, ...axiosConfig } = config || {};

    if (retry) {
      return this.retryRequest(() => this.client.post(url, data, axiosConfig), retry);
    }

    return this.client.post(url, data, axiosConfig);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { retry?: RetryConfig }
  ): Promise<AxiosResponse<T>> {
    const { retry, ...axiosConfig } = config || {};

    if (retry) {
      return this.retryRequest(() => this.client.put(url, data, axiosConfig), retry);
    }

    return this.client.put(url, data, axiosConfig);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { retry?: RetryConfig }
  ): Promise<AxiosResponse<T>> {
    const { retry, ...axiosConfig } = config || {};

    if (retry) {
      return this.retryRequest(() => this.client.patch(url, data, axiosConfig), retry);
    }

    return this.client.patch(url, data, axiosConfig);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & { retry?: RetryConfig }
  ): Promise<AxiosResponse<T>> {
    const { retry, ...axiosConfig } = config || {};

    if (retry) {
      return this.retryRequest(() => this.client.delete(url, axiosConfig), retry);
    }

    return this.client.delete(url, axiosConfig);
  }

  // File upload
  async upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }

  // Download file
  async download(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> {
    return this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
  }

  // Get client instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }

  // Update base URL
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  // Set default headers
  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  // Request cancellation
  createCancelToken(key: string): AbortController {
    const controller = new AbortController();
    this.cancelTokens.set(key, controller);
    return controller;
  }

  cancelRequest(key: string): void {
    const controller = this.cancelTokens.get(key);
    if (controller) {
      controller.abort();
      this.cancelTokens.delete(key);
    }
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.cancelTokens.forEach((controller) => {
      controller.abort();
    });
    this.cancelTokens.clear();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get error details for debugging
  getErrorDetails(error: any): {
    message: string;
    status?: number;
    code?: string;
    isNetworkError: boolean;
    isTimeoutError: boolean;
  } {
    if (error.isAxiosError) {
      return this.transformError(error);
    }

    return {
      message: error.message || 'Unknown error',
      isNetworkError: false,
      isTimeoutError: false,
    };
  }
}

export const apiClient = new ApiClient();
