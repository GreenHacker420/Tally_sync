import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

// Reducers
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice';
import syncReducer from './slices/syncSlice';
import offlineReducer from './slices/offlineSlice';
import settingsReducer from './slices/settingsSlice';
import voucherReducer from './slices/voucherSlice';
import inventoryReducer from './slices/inventorySlice';
import networkReducer from './slices/networkSlice';
import mlReducer from './slices/mlSlice';

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
  company: companyReducer,
  sync: syncReducer,
  offline: offlineReducer,
  settings: settingsReducer,
  voucher: voucherReducer,
  inventory: inventoryReducer,
  network: networkReducer,
  ml: mlReducer,
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
