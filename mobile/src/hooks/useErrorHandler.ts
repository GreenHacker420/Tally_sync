import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch } from '../store/hooks';

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
  logError?: boolean;
  retryAction?: () => void;
  fallbackAction?: () => void;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

const useErrorHandler = () => {
  const dispatch = useAppDispatch();

  const handleError = useCallback((
    error: Error | ApiError | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showAlert = true,
      alertTitle = 'Error',
      alertMessage,
      logError = true,
      retryAction,
      fallbackAction,
    } = options;

    // Extract error message
    let errorMessage: string;
    let errorCode: string | undefined;
    let statusCode: number | undefined;

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = (error as ApiError).message || 'An unknown error occurred';
      errorCode = (error as ApiError).code;
      statusCode = (error as ApiError).status;
    }

    // Log error if enabled
    if (logError) {
      console.error('Error handled:', {
        message: errorMessage,
        code: errorCode,
        status: statusCode,
        error,
      });
    }

    // Get user-friendly error message
    const userMessage = alertMessage || getUserFriendlyMessage(errorMessage, statusCode);

    // Show alert if enabled
    if (showAlert) {
      const buttons: any[] = [
        { text: 'OK', style: 'default' },
      ];

      if (retryAction) {
        buttons.unshift({
          text: 'Retry',
          onPress: retryAction,
        });
      }

      if (fallbackAction) {
        buttons.push({
          text: 'Go Back',
          onPress: fallbackAction,
        });
      }

      Alert.alert(alertTitle, userMessage, buttons);
    }

    return {
      message: errorMessage,
      userMessage,
      code: errorCode,
      status: statusCode,
    };
  }, [dispatch]);

  const handleApiError = useCallback((
    error: any,
    options: ErrorHandlerOptions = {}
  ) => {
    // Extract API error details
    let apiError: ApiError;

    if (error.response) {
      // Axios error with response
      apiError = {
        message: error.response.data?.message || error.message,
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data,
      };
    } else if (error.request) {
      // Network error
      apiError = {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    } else {
      // Other error
      apiError = {
        message: error.message || 'An unexpected error occurred',
      };
    }

    return handleError(apiError, options);
  }, [handleError]);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleApiError(error, options);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }, [handleApiError]);

  return {
    handleError,
    handleApiError,
    handleAsyncError,
  };
};

const getUserFriendlyMessage = (errorMessage: string, statusCode?: number): string => {
  // Handle specific status codes
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You are not authorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'The data provided is invalid. Please check and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
    }
  }

  // Handle specific error messages
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('network')) {
    return 'Network connection error. Please check your internet connection.';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return 'Authentication failed. Please log in again.';
  }
  
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }
  
  if (lowerMessage.includes('not found')) {
    return 'The requested item was not found.';
  }
  
  if (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists')) {
    return 'This item already exists. Please use a different name.';
  }

  // Return original message if no specific handling
  return errorMessage || 'An unexpected error occurred. Please try again.';
};

export default useErrorHandler;
