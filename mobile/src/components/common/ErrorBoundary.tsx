import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Title,
  Paragraph,
  Button,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Surface style={styles.errorContainer} elevation={2}>
            <Icon
              name="alert-circle"
              size={64}
              color="#dc2626"
              style={styles.icon}
            />
            
            <Title style={styles.title}>Something went wrong</Title>
            
            <Paragraph style={styles.message}>
              An unexpected error occurred. Please try restarting the app.
            </Paragraph>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Paragraph style={styles.debugTitle}>Debug Info:</Paragraph>
                <Paragraph style={styles.debugText}>
                  {this.state.error.toString()}
                </Paragraph>
                {this.state.errorInfo && (
                  <Paragraph style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Paragraph>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={this.handleRestart}
                style={styles.button}
              >
                Try Again
              </Button>
            </View>
          </Surface>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
  },
  debugContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 8,
  },
});

export default ErrorBoundary;
