import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from cookies first (for SSR), then localStorage
    let token: string | undefined;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || Cookies.get('token');
    } else {
      token = Cookies.get('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            Cookies.remove('token');
            
            if (window.location.pathname !== '/login') {
              toast.error('Session expired. Please login again.');
              window.location.href = '/login';
            }
          }
          break;
          
        case 403:
          // Forbidden
          toast.error((data as any)?.message || 'Access denied');
          break;
          
        case 404:
          // Not found
          toast.error((data as any)?.message || 'Resource not found');
          break;
          
        case 422:
          // Validation error
          if ((data as any)?.errors && Array.isArray((data as any).errors)) {
            (data as any).errors.forEach((err: any) => 
              toast.error(err.msg || err.message)
            );
          } else {
            toast.error((data as any)?.message || 'Validation failed');
          }
          break;
          
        case 429:
          // Rate limit exceeded
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Other errors
          toast.error((data as any)?.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to set auth token
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
  Cookies.set('token', token, { expires: 7 }); // 7 days
};

// Helper function to remove auth token
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  Cookies.remove('token');
};

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || Cookies.get('token') || null;
  }
  return Cookies.get('token') || null;
};

export default api;
