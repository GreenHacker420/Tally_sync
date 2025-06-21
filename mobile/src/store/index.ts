import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

// Import reducers
import authReducer from './slices/authSlice';
import mlReducer from './slices/mlSlice';
import offlineReducer from './slices/offlineSlice';
import settingsReducer from './slices/settingsSlice';
import companyReducer from './slices/companySlice';
import syncReducer from './slices/syncSlice';
import voucherReducer from './slices/voucherSlice';
import inventoryReducer from './slices/inventorySlice';
import networkReducer from './slices/networkSlice';
import paymentReducer from './slices/paymentSlice';
import reportReducer from './slices/reportSlice';
import notificationReducer from './slices/notificationSlice';
import tallyReducer from './slices/tallySlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['settings', 'offline'], // Only persist these reducers
};

// Secure persist configuration for sensitive data
const authPersistConfig = {
  key: 'auth',
  storage: EncryptedStorage,
};

// Root reducer
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ml: mlReducer,
  offline: offlineReducer,
  settings: settingsReducer,
  company: companyReducer,
  sync: syncReducer,
  voucher: voucherReducer,
  inventory: inventoryReducer,
  network: networkReducer,
  payment: paymentReducer,
  report: reportReducer,
  notification: notificationReducer,
  tally: tallyReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof rootReducer>;
export type PersistedRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
