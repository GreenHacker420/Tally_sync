import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Title,
  Paragraph,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showLogo = true,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Icon
            name="chart-line"
            size={80}
            color={theme.colors.primary}
          />
          <Title style={[styles.appName, { color: theme.colors.primary }]}>
            FinSync360
          </Title>
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.spinner}
        />
        <Paragraph style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Paragraph>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingScreen;
