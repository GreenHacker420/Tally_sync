import { authService } from '../../src/services/authService';
import { LoginCredentials, RegisterData } from '../../src/types';

// Mock the API client
jest.mock('../../src/services/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'mock-token',
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
              role: 'user',
            },
          },
        },
      };

      const { apiClient } = require('../../src/services/apiClient');
      apiClient.post.mockResolvedValue(mockResponse);

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
    });

    it('should throw error for invalid credentials', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      apiClient.post.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      });

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'mock-token',
            user: {
              id: '1',
              name: 'New User',
              email: 'newuser@example.com',
              role: 'user',
            },
          },
        },
      };

      const { apiClient } = require('../../src/services/apiClient');
      apiClient.post.mockResolvedValue(mockResponse);

      const userData: RegisterData = {
        name: 'New User',
        email: 'newuser@example.com',
        phone: '1234567890',
        password: 'password123',
        companyName: 'Test Company',
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('newuser@example.com');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      apiClient.post.mockResolvedValue({ data: { success: true } });

      await expect(authService.logout()).resolves.not.toThrow();
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should clear local data even if API call fails', async () => {
      const { apiClient } = require('../../src/services/apiClient');
      apiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      const EncryptedStorage = require('react-native-encrypted-storage');
      EncryptedStorage.getItem.mockResolvedValue('mock-token');

      const result = await authService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      const EncryptedStorage = require('react-native-encrypted-storage');
      EncryptedStorage.getItem.mockResolvedValue(null);

      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('biometric authentication', () => {
    it('should setup biometric authentication successfully', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.setupBiometric(credentials);
      expect(result).toBe(true);
    });

    it('should verify biometric authentication successfully', async () => {
      const EncryptedStorage = require('react-native-encrypted-storage');
      EncryptedStorage.getItem.mockResolvedValue(JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }));

      const result = await authService.verifyBiometric();
      expect(result.success).toBe(true);
      expect(result.credentials).toBeDefined();
    });

    it('should check biometric availability', async () => {
      const EncryptedStorage = require('react-native-encrypted-storage');
      EncryptedStorage.getItem.mockResolvedValue('mock-credentials');

      const result = await authService.isBiometricAvailable();
      expect(result).toBe(true);
    });
  });
});
