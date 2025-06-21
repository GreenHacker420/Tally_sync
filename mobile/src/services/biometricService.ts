import TouchID from 'react-native-touch-id';
import { Platform } from 'react-native';
import { databaseService } from './databaseService';

export interface BiometricConfig {
  title: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  color?: string;
  imageColor?: string;
  imageErrorColor?: string;
  sensorDescription?: string;
  sensorErrorDescription?: string;
  passcodeFallback?: boolean;
  showFallbackButton?: boolean;
  unifiedErrors?: boolean;
}

export interface BiometricCapabilities {
  isSupported: boolean;
  biometryType: 'TouchID' | 'FaceID' | 'Fingerprint' | null;
  isEnrolled: boolean;
}

class BiometricService {
  private defaultConfig: BiometricConfig = {
    title: 'Authenticate',
    subtitle: 'Use your biometric to authenticate',
    description: 'Place your finger on the sensor or look at the camera',
    fallbackLabel: 'Use Passcode',
    cancelLabel: 'Cancel',
    passcodeFallback: true,
    showFallbackButton: true,
    unifiedErrors: false,
  };

  /**
   * Check if biometric authentication is supported
   */
  async isSupported(): Promise<BiometricCapabilities> {
    try {
      const biometryType = await TouchID.isSupported();
      
      return {
        isSupported: true,
        biometryType: biometryType as any,
        isEnrolled: true, // TouchID.isSupported() only returns true if enrolled
      };
    } catch (error: any) {
      return {
        isSupported: false,
        biometryType: null,
        isEnrolled: false,
      };
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(config?: Partial<BiometricConfig>): Promise<boolean> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      await TouchID.authenticate(
        finalConfig.description || 'Authenticate to continue',
        {
          title: finalConfig.title,
          subtitle: finalConfig.subtitle,
          fallbackLabel: finalConfig.fallbackLabel,
          cancelLabel: finalConfig.cancelLabel,
          color: finalConfig.color,
          imageColor: finalConfig.imageColor,
          imageErrorColor: finalConfig.imageErrorColor,
          sensorDescription: finalConfig.sensorDescription,
          sensorErrorDescription: finalConfig.sensorErrorDescription,
          passcodeFallback: finalConfig.passcodeFallback,
          showFallbackButton: finalConfig.showFallbackButton,
          unifiedErrors: finalConfig.unifiedErrors,
        }
      );

      return true;
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);
      
      // Handle specific error cases
      switch (error.name) {
        case 'LAErrorUserCancel':
        case 'UserCancel':
          throw new Error('Authentication was cancelled by user');
        case 'LAErrorUserFallback':
        case 'UserFallback':
          throw new Error('User chose to use fallback authentication');
        case 'LAErrorSystemCancel':
        case 'SystemCancel':
          throw new Error('Authentication was cancelled by system');
        case 'LAErrorPasscodeNotSet':
        case 'PasscodeNotSet':
          throw new Error('Passcode is not set on device');
        case 'LAErrorBiometryNotAvailable':
        case 'BiometryNotAvailable':
          throw new Error('Biometry is not available');
        case 'LAErrorBiometryNotEnrolled':
        case 'BiometryNotEnrolled':
          throw new Error('No biometric data is enrolled');
        case 'LAErrorBiometryLockout':
        case 'BiometryLockout':
          throw new Error('Biometry is locked out');
        default:
          throw new Error('Biometric authentication failed');
      }
    }
  }

  /**
   * Check if biometric authentication is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await databaseService.getSetting('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometric(): Promise<void> {
    const capabilities = await this.isSupported();
    
    if (!capabilities.isSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    if (!capabilities.isEnrolled) {
      throw new Error('No biometric data is enrolled on this device');
    }

    // Test authentication before enabling
    await this.authenticate({
      title: 'Enable Biometric Authentication',
      description: 'Authenticate to enable biometric login',
    });

    await databaseService.setSetting('biometric_enabled', 'true');
  }

  /**
   * Disable biometric authentication for the app
   */
  async disableBiometric(): Promise<void> {
    await databaseService.setSetting('biometric_enabled', 'false');
  }

  /**
   * Get biometric type string for display
   */
  async getBiometricTypeString(): Promise<string> {
    const capabilities = await this.isSupported();
    
    if (!capabilities.isSupported) {
      return 'Not supported';
    }

    switch (capabilities.biometryType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  }

  /**
   * Store encrypted data using biometric authentication
   */
  async storeSecureData(key: string, data: string): Promise<void> {
    const capabilities = await this.isSupported();
    
    if (!capabilities.isSupported) {
      throw new Error('Biometric authentication is not supported');
    }

    // For now, we'll store in regular database
    // In a real implementation, you'd use Keychain/Keystore with biometric protection
    await databaseService.setSetting(`secure_${key}`, data);
  }

  /**
   * Retrieve encrypted data using biometric authentication
   */
  async getSecureData(key: string, config?: Partial<BiometricConfig>): Promise<string | null> {
    const capabilities = await this.isSupported();
    
    if (!capabilities.isSupported) {
      throw new Error('Biometric authentication is not supported');
    }

    // Authenticate before retrieving data
    await this.authenticate({
      title: 'Access Secure Data',
      description: 'Authenticate to access your secure data',
      ...config,
    });

    return await databaseService.getSetting(`secure_${key}`);
  }

  /**
   * Remove secure data
   */
  async removeSecureData(key: string): Promise<void> {
    await databaseService.deleteSetting(`secure_${key}`);
  }

  /**
   * Quick authentication for app unlock
   */
  async quickAuthenticate(): Promise<boolean> {
    const isEnabled = await this.isBiometricEnabled();
    
    if (!isEnabled) {
      return false;
    }

    try {
      return await this.authenticate({
        title: 'Unlock App',
        description: 'Use your biometric to unlock the app',
        showFallbackButton: false,
      });
    } catch (error) {
      console.error('Quick authentication failed:', error);
      return false;
    }
  }

  /**
   * Get platform-specific biometric prompt configuration
   */
  private getPlatformConfig(): Partial<BiometricConfig> {
    if (Platform.OS === 'ios') {
      return {
        fallbackLabel: 'Use Passcode',
        passcodeFallback: true,
      };
    } else {
      return {
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint to authenticate',
        description: 'Place your finger on the sensor',
        cancelLabel: 'Cancel',
        color: '#2196F3',
      };
    }
  }

  /**
   * Authenticate with platform-specific configuration
   */
  async authenticateWithPlatformConfig(customConfig?: Partial<BiometricConfig>): Promise<boolean> {
    const platformConfig = this.getPlatformConfig();
    const finalConfig = { ...platformConfig, ...customConfig };
    
    return await this.authenticate(finalConfig);
  }
}

export const biometricService = new BiometricService();
