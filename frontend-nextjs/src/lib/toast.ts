import { toast as hotToast, ToastOptions } from "react-hot-toast";
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon 
} from "@heroicons/react/24/outline";
import React from "react";

interface CustomToastOptions extends Omit<ToastOptions, 'icon'> {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Custom toast component
const CustomToast: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ type, title, description, action }) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-primary-600',
  };

  const Icon = icons[type];

  return React.createElement(
    'div',
    { className: 'flex items-start space-x-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md' },
    React.createElement(Icon, { className: `h-5 w-5 mt-0.5 ${colors[type]} flex-shrink-0` }),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      title && React.createElement(
        'p',
        { className: 'text-sm font-medium text-gray-900' },
        title
      ),
      description && React.createElement(
        'p',
        { className: `text-sm ${title ? 'text-gray-600 mt-1' : 'text-gray-900'}` },
        description
      ),
      action && React.createElement(
        'button',
        {
          onClick: action.onClick,
          className: 'mt-2 text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline'
        },
        action.label
      )
    )
  );
};

// Enhanced toast functions
export const toast = {
  success: (message: string, options?: CustomToastOptions) => {
    const { title, description, action, ...toastOptions } = options || {};
    
    if (title || description || action) {
      return hotToast.custom(
        React.createElement(CustomToast, {
          type: 'success',
          title: title || message,
          description: title ? message : description,
          action,
        }),
        {
          duration: 4000,
          ...toastOptions,
        }
      );
    }
    
    return hotToast.success(message, {
      duration: 3000,
      ...toastOptions,
    });
  },

  error: (message: string, options?: CustomToastOptions) => {
    const { title, description, action, ...toastOptions } = options || {};
    
    if (title || description || action) {
      return hotToast.custom(
        React.createElement(CustomToast, {
          type: 'error',
          title: title || message,
          description: title ? message : description,
          action,
        }),
        {
          duration: 6000,
          ...toastOptions,
        }
      );
    }
    
    return hotToast.error(message, {
      duration: 5000,
      ...toastOptions,
    });
  },

  warning: (message: string, options?: CustomToastOptions) => {
    const { title, description, action, ...toastOptions } = options || {};
    
    if (title || description || action) {
      return hotToast.custom(
        React.createElement(CustomToast, {
          type: 'warning',
          title: title || message,
          description: title ? message : description,
          action,
        }),
        {
          duration: 5000,
          ...toastOptions,
        }
      );
    }
    
    return hotToast(message, {
      duration: 4000,
      icon: '⚠️',
      ...toastOptions,
    });
  },

  info: (message: string, options?: CustomToastOptions) => {
    const { title, description, action, ...toastOptions } = options || {};
    
    if (title || description || action) {
      return hotToast.custom(
        React.createElement(CustomToast, {
          type: 'info',
          title: title || message,
          description: title ? message : description,
          action,
        }),
        {
          duration: 4000,
          ...toastOptions,
        }
      );
    }
    
    return hotToast(message, {
      duration: 4000,
      icon: 'ℹ️',
      ...toastOptions,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return hotToast.loading(message, {
      duration: Infinity,
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return hotToast.promise(promise, messages, {
      success: {
        duration: 3000,
      },
      error: {
        duration: 5000,
      },
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    return hotToast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    return hotToast.remove(toastId);
  },
};

// Utility functions for common scenarios
export const toastUtils = {
  // API operation toasts
  apiSuccess: (operation: string, resource?: string) => {
    const message = resource 
      ? `${resource} ${operation} successfully`
      : `${operation} completed successfully`;
    return toast.success(message);
  },

  apiError: (operation: string, error: any, resource?: string) => {
    const baseMessage = resource 
      ? `Failed to ${operation.toLowerCase()} ${resource}`
      : `${operation} failed`;
    
    const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
    
    return toast.error(baseMessage, {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    });
  },

  // Form validation toasts
  validationError: (message: string = 'Please check the form for errors') => {
    return toast.warning(message);
  },

  // Network status toasts
  networkError: () => {
    return toast.error('Network Error', {
      description: 'Please check your internet connection and try again',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    });
  },

  // Permission toasts
  permissionDenied: (action?: string) => {
    const message = action 
      ? `You don't have permission to ${action}`
      : 'Access denied';
    
    return toast.error(message, {
      description: 'Please contact your administrator if you believe this is an error',
    });
  },

  // Sync status toasts
  syncSuccess: (service: string = 'Tally') => {
    return toast.success(`Synced with ${service}`, {
      description: 'All data has been synchronized successfully',
    });
  },

  syncError: (service: string = 'Tally', error?: any) => {
    return toast.error(`Sync with ${service} failed`, {
      description: error?.message || 'Please try again later',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    });
  },
};
