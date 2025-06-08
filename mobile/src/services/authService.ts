import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import { apiClient } from './apiClient';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const BIOMETRIC_KEY = 'biometric_credentials';

class AuthService {
  private biometrics: ReactNativeBiometrics;

  constructor() {
    this.biometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token securely
        await EncryptedStorage.setItem(TOKEN_KEY, token);
        
        // Store user data
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        
        // Store biometric credentials if enabled
        if (credentials.rememberMe) {
          await this.storeBiometricCredentials(credentials);
        }
        
        return {
          success: true,
          token,
          user,
        };
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token securely
        await EncryptedStorage.setItem(TOKEN_KEY, token);
        
        // Store user data
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        
        return {
          success: true,
          token,
          user,
        };
      }
      
      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      await this.clearAuthData();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/refresh');
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Update stored token
        await EncryptedStorage.setItem(TOKEN_KEY, token);
        
        // Update user data
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        
        return {
          success: true,
          token,
          user,
        };
      }
      
      throw new Error('Token refresh failed');
    } catch (error: any) {
      // Clear auth data if refresh fails
      await this.clearAuthData();
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  /**
   * Get stored authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(credentials: LoginCredentials): Promise<boolean> {
    try {
      const { available } = await this.biometrics.isSensorAvailable();
      
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      // Create biometric key
      const { success } = await this.biometrics.createKeys();
      
      if (success) {
        // Store encrypted credentials
        await this.storeBiometricCredentials(credentials);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      return false;
    }
  }

  /**
   * Verify biometric authentication
   */
  async verifyBiometric(): Promise<{ success: boolean; credentials?: LoginCredentials }> {
    try {
      const { available } = await this.biometrics.isSensorAvailable();
      
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      // Prompt for biometric verification
      const { success } = await this.biometrics.simplePrompt({
        promptMessage: 'Verify your identity',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        // Retrieve stored credentials
        const credentials = await this.getBiometricCredentials();
        return { success: true, credentials };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return { success: false };
    }
  }

  /**
   * Check if biometric is available and enabled
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const { available } = await this.biometrics.isSensorAvailable();
      const hasCredentials = await this.hasBiometricCredentials();
      return available && hasCredentials;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store biometric credentials securely
   */
  private async storeBiometricCredentials(credentials: LoginCredentials): Promise<void> {
    try {
      await EncryptedStorage.setItem(BIOMETRIC_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to store biometric credentials:', error);
    }
  }

  /**
   * Get stored biometric credentials
   */
  private async getBiometricCredentials(): Promise<LoginCredentials | null> {
    try {
      const data = await EncryptedStorage.getItem(BIOMETRIC_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get biometric credentials:', error);
      return null;
    }
  }

  /**
   * Check if biometric credentials are stored
   */
  private async hasBiometricCredentials(): Promise<boolean> {
    try {
      const data = await EncryptedStorage.getItem(BIOMETRIC_KEY);
      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        EncryptedStorage.removeItem(TOKEN_KEY),
        EncryptedStorage.removeItem(BIOMETRIC_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }
}

export const authService = new AuthService();
