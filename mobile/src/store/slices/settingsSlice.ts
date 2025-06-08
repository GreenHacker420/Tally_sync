import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSync: boolean;
  syncInterval: number; // in minutes
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  debugMode: boolean;
  isFirstLaunch: boolean;
  selectedCompanyId: string | null;
}

const initialState: SettingsState = {
  theme: 'system',
  language: 'en',
  autoSync: true,
  syncInterval: 5,
  biometricEnabled: false,
  notificationsEnabled: true,
  offlineMode: false,
  debugMode: false,
  isFirstLaunch: true,
  selectedCompanyId: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setAutoSync: (state, action: PayloadAction<boolean>) => {
      state.autoSync = action.payload;
    },
    setSyncInterval: (state, action: PayloadAction<number>) => {
      state.syncInterval = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload;
    },
    setFirstLaunchCompleted: (state) => {
      state.isFirstLaunch = false;
    },
    setSelectedCompany: (state, action: PayloadAction<string | null>) => {
      state.selectedCompanyId = action.payload;
    },
    resetSettings: (state) => {
      return {
        ...initialState,
        isFirstLaunch: false, // Don't reset first launch flag
      };
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setAutoSync,
  setSyncInterval,
  setBiometricEnabled,
  setNotificationsEnabled,
  setOfflineMode,
  setDebugMode,
  setFirstLaunchCompleted,
  setSelectedCompany,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
