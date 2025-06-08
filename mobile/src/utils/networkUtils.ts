import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import { setOnlineStatus } from '../store/slices/syncSlice';

/**
 * Setup network listener to monitor connectivity
 */
export const setupNetworkListener = (): void => {
  const unsubscribe = NetInfo.addEventListener(state => {
    const isConnected = state.isConnected && state.isInternetReachable;
    
    console.log('Network state changed:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });

    // Update sync state
    store.dispatch(setOnlineStatus(!!isConnected));
  });

  // Store unsubscribe function for cleanup
  (global as any).networkUnsubscribe = unsubscribe;
};

/**
 * Get current network state
 */
export const getNetworkState = async () => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
};

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
};

/**
 * Cleanup network listener
 */
export const cleanupNetworkListener = (): void => {
  const unsubscribe = (global as any).networkUnsubscribe;
  if (unsubscribe) {
    unsubscribe();
    delete (global as any).networkUnsubscribe;
  }
};
