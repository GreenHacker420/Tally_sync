import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Typed selectors for specific slices
export const useAuth = () => useAppSelector((state) => state.auth);
export const useSettings = () => useAppSelector((state) => state.settings);
export const useSync = () => useAppSelector((state) => state.sync);
export const useInventory = () => useAppSelector((state) => state.inventory);
export const useML = () => useAppSelector((state) => state.ml);
export const useNetwork = () => useAppSelector((state) => state.network);
export const useCompany = () => useAppSelector((state) => state.company);
export const useVoucher = () => useAppSelector((state) => state.voucher);
export const useOffline = () => useAppSelector((state) => state.offline);
