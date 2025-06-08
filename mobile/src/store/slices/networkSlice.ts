import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
  connectionHistory: ConnectionEvent[];
}

interface ConnectionEvent {
  timestamp: string;
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
}

const initialState: NetworkState = {
  isConnected: false,
  type: 'unknown',
  isInternetReachable: false,
  connectionHistory: [],
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkState: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        type: string;
        isInternetReachable: boolean;
      }>
    ) => {
      const { isConnected, type, isInternetReachable } = action.payload;
      
      // Add to history if state changed
      if (
        state.isConnected !== isConnected ||
        state.isInternetReachable !== isInternetReachable
      ) {
        state.connectionHistory.unshift({
          timestamp: new Date().toISOString(),
          isConnected,
          type,
          isInternetReachable,
        });
        
        // Keep only last 50 events
        if (state.connectionHistory.length > 50) {
          state.connectionHistory = state.connectionHistory.slice(0, 50);
        }
      }
      
      state.isConnected = isConnected;
      state.type = type;
      state.isInternetReachable = isInternetReachable;
    },
    clearConnectionHistory: (state) => {
      state.connectionHistory = [];
    },
  },
});

export const { setNetworkState, clearConnectionHistory } = networkSlice.actions;
export default networkSlice.reducer;
