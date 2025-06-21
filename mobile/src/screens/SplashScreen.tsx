import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';

// Store
import { AppDispatch } from '../store';
import { useAuth } from '../store/hooks';

// Types
import { RootStackScreenProps } from '../types/navigation';

// Services
import { initializeServices } from '../services';

type Props = RootStackScreenProps<'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useAuth();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize app
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize services
      await initializeServices();

      // Wait for minimum splash duration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate based on authentication status
      if (isAuthenticated) {
        navigation.replace('Main');
      } else {
        // Check if user has seen onboarding
        const hasSeenOnboarding = false; // You can check AsyncStorage here

        if (hasSeenOnboarding) {
          navigation.replace('Auth');
        } else {
          navigation.replace('Onboarding');
        }
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      // Navigate to auth on error
      navigation.replace('Auth');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Icon
            name="sync"
            size={80}
            color={theme.colors.onPrimary}
          />
          <Text
            variant="headlineLarge"
            style={[styles.appName, { color: theme.colors.onPrimary }]}
          >
            Tally Sync
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.tagline, { color: theme.colors.onPrimary }]}
          >
            ERP Management Made Simple
          </Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.onPrimary}
          />
          <Text
            variant="bodyMedium"
            style={[styles.loadingText, { color: theme.colors.onPrimary }]}
          >
            Initializing...
          </Text>
        </View>
      </Animated.View>

      {/* Version Info */}
      <View style={styles.footer}>
        <Text
          variant="bodySmall"
          style={[styles.version, { color: theme.colors.onPrimary }]}
        >
          Version 1.0.0
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.copyright, { color: theme.colors.onPrimary }]}
        >
          © 2024 Tally Sync
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    marginTop: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  version: {
    opacity: 0.7,
    marginBottom: 4,
  },
  copyright: {
    opacity: 0.7,
  },
});

export default SplashScreen;
