import { useState, useCallback, useRef } from 'react';

export interface LoadingState {
  [key: string]: boolean;
}

export interface LoadingOptions {
  key?: string;
  showOverlay?: boolean;
  message?: string;
  timeout?: number;
}

const useLoading = (initialState: LoadingState = {}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const setLoading = useCallback((
    key: string,
    loading: boolean,
    options: LoadingOptions = {}
  ) => {
    const { timeout } = options;

    // Clear existing timeout for this key
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
      delete timeoutRefs.current[key];
    }

    // Set loading state
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));

    // Set timeout if provided and loading is true
    if (loading && timeout) {
      timeoutRefs.current[key] = setTimeout(() => {
        setLoadingStates(prev => ({
          ...prev,
          [key]: false,
        }));
        delete timeoutRefs.current[key];
      }, timeout);
    }
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    const { key = 'default', timeout } = options;
    
    try {
      setLoading(key, true, { timeout });
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  const clearLoading = useCallback((key?: string) => {
    if (key) {
      // Clear specific loading state
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
        delete timeoutRefs.current[key];
      }
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      // Clear all loading states
      Object.values(timeoutRefs.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      timeoutRefs.current = {};
      setLoadingStates({});
    }
  }, []);

  const clearAllLoading = useCallback(() => {
    clearLoading();
  }, [clearLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    withLoading,
    clearLoading,
    clearAllLoading,
  };
};

// Hook for managing a single loading state
export const useSingleLoading = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setLoadingWithTimeout = useCallback((
    isLoading: boolean,
    timeout?: number
  ) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    setLoading(isLoading);

    // Set timeout if provided and loading is true
    if (isLoading && timeout) {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        timeoutRef.current = undefined;
      }, timeout);
    }
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    timeout?: number
  ): Promise<T> => {
    try {
      setLoadingWithTimeout(true, timeout);
      const result = await asyncFn();
      return result;
    } finally {
      setLoadingWithTimeout(false);
    }
  }, [setLoadingWithTimeout]);

  const clearLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setLoading(false);
  }, []);

  return {
    loading,
    setLoading: setLoadingWithTimeout,
    withLoading,
    clearLoading,
  };
};

// Hook for managing async operations with loading and error states
export const useAsyncOperation = <T = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    asyncFn: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      clearPreviousData?: boolean;
    } = {}
  ) => {
    const { onSuccess, onError, clearPreviousData = true } = options;

    try {
      setLoading(true);
      setError(null);
      
      if (clearPreviousData) {
        setData(null);
      }

      const result = await asyncFn();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
};

export default useLoading;
