import api, { setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse 
} from '@/types';

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);

    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }

    return response.data;
  },

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', userData);

    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }

    return response.data;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
    }
  },

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
    return response.data;
  },

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const response = await api.put<AuthResponse>(`/api/auth/reset-password/${token}`, {
      password
    });

    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }

    return response.data;
  },

  // Update profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await api.put<ApiResponse<{ user: User }>>('/api/auth/profile', userData);
    return response.data;
  },

  // Change password
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await api.get<ApiResponse>(`/api/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  async resendVerificationEmail(): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/api/auth/resend-verification');
    return response.data;
  },

  // Enable 2FA
  async enable2FA(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    const response = await api.post<ApiResponse<{ qrCode: string; secret: string }>>('/api/auth/2fa/enable');
    return response.data;
  },

  // Verify 2FA setup
  async verify2FASetup(token: string): Promise<ApiResponse<{ backupCodes: string[] }>> {
    const response = await api.post<ApiResponse<{ backupCodes: string[] }>>('/api/auth/2fa/verify-setup', {
      token
    });
    return response.data;
  },

  // Disable 2FA
  async disable2FA(token: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/api/auth/2fa/disable', { token });
    return response.data;
  },

  // Verify 2FA token
  async verify2FA(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/2fa/verify', { token });

    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }

    return response.data;
  },

  // Upload avatar
  async uploadAvatar(file: File): Promise<ApiResponse<{ user: User }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<ApiResponse<{ user: User }>>('/api/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Delete avatar
  async deleteAvatar(): Promise<ApiResponse<{ user: User }>> {
    const response = await api.delete<ApiResponse<{ user: User }>>('/api/auth/avatar');
    return response.data;
  },

  // Update preferences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<ApiResponse<{ user: User }>> {
    const response = await api.put<ApiResponse<{ user: User }>>('/api/auth/preferences', preferences);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.getAuthToken();
  },

  // Get stored user data (for SSR)
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  },

  // Store user data
  storeUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear stored user data
  clearStoredUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  },

  // Remove auth token (delegated to API module)
  removeAuthToken(): void {
    removeAuthToken();
  },

  // Set auth token (delegated to API module)
  setAuthToken(token: string): void {
    setAuthToken(token);
  },

  // Get auth token (delegated to API module)
  getAuthToken(): string | null {
    return getAuthToken();
  }
};

export default authService;
