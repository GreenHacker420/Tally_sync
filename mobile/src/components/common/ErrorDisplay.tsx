import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface ErrorDisplayProps {
  error?: Error | string | null;
  title?: string;
  message?: string;
  showRetry?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
  variant?: 'card' | 'inline' | 'banner';
  severity?: 'error' | 'warning' | 'info';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  message,
  showRetry = true,
  showDetails = false,
  onRetry,
  onDismiss,
  style,
  variant = 'card',
  severity = 'error',
}) => {
  const theme = useTheme();

  if (!error && !message) return null;

  const errorMessage = message || (typeof error === 'string' ? error : error?.message) || 'An error occurred';
  const errorTitle = title || getDefaultTitle(severity);
  const iconName = getIconName(severity);
  const iconColor = getIconColor(severity, theme);

  const renderContent = () => (
    <>
      <View style={styles.header}>
        <Icon name={iconName} size={24} color={iconColor} />
        <Title style={[styles.title, { color: iconColor }]}>
          {errorTitle}
        </Title>
      </View>

      <Paragraph style={styles.message}>
        {errorMessage}
      </Paragraph>

      {showDetails && error && typeof error !== 'string' && (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Technical Details:</Text>
          <Text style={styles.detailsText}>
            {error.stack || error.toString()}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {showRetry && onRetry && (
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.retryButton}
          >
            Try Again
          </Button>
        )}
        {onDismiss && (
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.dismissButton}
          >
            Dismiss
          </Button>
        )}
      </View>
    </>
  );

  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, style]}>
        {renderContent()}
      </View>
    );
  }

  if (variant === 'banner') {
    return (
      <View style={[styles.bannerContainer, { backgroundColor: getBannerColor(severity, theme) }, style]}>
        {renderContent()}
      </View>
    );
  }

  return (
    <Card style={[styles.cardContainer, style]}>
      <Card.Content>
        {renderContent()}
      </Card.Content>
    </Card>
  );
};

// Network error component
export const NetworkError: React.FC<{
  onRetry?: () => void;
  style?: any;
}> = ({ onRetry, style }) => (
  <ErrorDisplay
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    style={style}
    severity="warning"
  />
);

// Not found error component
export const NotFoundError: React.FC<{
  resource?: string;
  onGoBack?: () => void;
  style?: any;
}> = ({ resource = 'item', onGoBack, style }) => (
  <ErrorDisplay
    title="Not Found"
    message={`The ${resource} you're looking for could not be found.`}
    showRetry={false}
    onDismiss={onGoBack}
    style={style}
    severity="info"
  />
);

// Permission error component
export const PermissionError: React.FC<{
  action?: string;
  onGoBack?: () => void;
  style?: any;
}> = ({ action = 'perform this action', onGoBack, style }) => (
  <ErrorDisplay
    title="Permission Denied"
    message={`You don't have permission to ${action}. Please contact your administrator.`}
    showRetry={false}
    onDismiss={onGoBack}
    style={style}
    severity="warning"
  />
);

// Validation error component
export const ValidationError: React.FC<{
  errors: string[];
  onDismiss?: () => void;
  style?: any;
}> = ({ errors, onDismiss, style }) => (
  <ErrorDisplay
    title="Validation Error"
    message={errors.join('\n')}
    showRetry={false}
    onDismiss={onDismiss}
    style={style}
    severity="warning"
    variant="banner"
  />
);

const getDefaultTitle = (severity: string): string => {
  switch (severity) {
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Information';
    default:
      return 'Error';
  }
};

const getIconName = (severity: string): string => {
  switch (severity) {
    case 'warning':
      return 'alert';
    case 'info':
      return 'information';
    default:
      return 'alert-circle';
  }
};

const getIconColor = (severity: string, theme: any): string => {
  switch (severity) {
    case 'warning':
      return '#FF9800';
    case 'info':
      return theme.colors.primary;
    default:
      return '#F44336';
  }
};

const getBannerColor = (severity: string, theme: any): string => {
  switch (severity) {
    case 'warning':
      return '#FFF3E0';
    case 'info':
      return theme.colors.primaryContainer;
    default:
      return '#FFEBEE';
  }
};

const styles = StyleSheet.create({
  cardContainer: {
    margin: 16,
  },
  inlineContainer: {
    padding: 16,
  },
  bannerContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  details: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  detailsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  retryButton: {
    minWidth: 100,
  },
  dismissButton: {
    minWidth: 100,
  },
});

export default ErrorDisplay;
