import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
  ActivityIndicator,
  Card,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Store
import { AppDispatch } from '../../store';
import { setBiometricEnabled } from '../../store/slices/authSlice';

// Types
import { AuthStackScreenProps } from '../../types/navigation';

// Styles
import { styles } from './BiometricSetupScreen.styles';

type Props = AuthStackScreenProps<'BiometricSetup'>;

interface BiometricType {
  available: boolean;
  type: 'TouchID' | 'FaceID' | 'Fingerprint' | null;
  error?: string;
}

const BiometricSetupScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const [biometricInfo, setBiometricInfo] = useState<BiometricType>({
    available: false,
    type: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsLoading(true);

      // Simulate checking biometric availability
      // In a real app, you would use react-native-biometrics or similar
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBiometricInfo({
        available: true,
        type: 'Fingerprint', // Default to fingerprint for demo
      });
    } catch (error: any) {
      setBiometricInfo({
        available: false,
        type: null,
        error: error.message || 'Biometric authentication not available',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enableBiometric = async () => {
    try {
      setIsEnabling(true);

      // Simulate biometric setup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Enable biometric in store
      dispatch(setBiometricEnabled(true));

      Alert.alert(
        'Success',
        'Biometric authentication has been enabled successfully!',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Biometric setup error:', error);

      Alert.alert(
        'Setup Failed',
        error.message || 'Failed to enable biometric authentication',
        [{ text: 'OK' }]
      );
    } finally {
      setIsEnabling(false);
    }
  };

  const skipBiometric = () => {
    Alert.alert(
      'Skip Biometric Setup',
      'You can enable biometric authentication later in settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  const getBiometricIcon = () => {
    switch (biometricInfo.type) {
      case 'TouchID':
        return 'fingerprint';
      case 'FaceID':
        return 'face-recognition';
      case 'Fingerprint':
        return 'fingerprint';
      default:
        return 'security';
    }
  };

  const getBiometricTitle = () => {
    switch (biometricInfo.type) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric Authentication';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Checking biometric availability...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Icon
            name={getBiometricIcon()}
            size={80}
            color={biometricInfo.available ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            {getBiometricTitle()}
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {biometricInfo.available
              ? 'Secure your account with biometric authentication'
              : 'Biometric authentication is not available on this device'
            }
          </Text>
        </View>

        {biometricInfo.available ? (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.featureItem}>
                <Icon name="shield-check" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Enhanced security for your account
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="lightning-bolt" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Quick and convenient login
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="lock" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Your biometric data stays on your device
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Surface style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Icon name="alert-circle" size={48} color={theme.colors.error} />
            <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
              {biometricInfo.error || 'Biometric authentication is not supported on this device'}
            </Text>
          </Surface>
        )}
      </View>

      <View style={styles.actions}>
        {biometricInfo.available && (
          <Button
            mode="contained"
            onPress={enableBiometric}
            loading={isEnabling}
            disabled={isEnabling}
            style={styles.primaryButton}
          >
            {isEnabling ? 'Setting up...' : `Enable ${getBiometricTitle()}`}
          </Button>
        )}

        <Button
          mode="outlined"
          onPress={biometricInfo.available ? skipBiometric : () => navigation.navigate('Login')}
          style={styles.secondaryButton}
        >
          {biometricInfo.available ? 'Skip for now' : 'Continue'}
        </Button>
      </View>
    </View>
  );
};

export default BiometricSetupScreen;
