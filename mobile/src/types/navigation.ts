// Navigation Parameter Lists

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  BiometricSetup: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Settings: undefined;
  Profile: undefined;
  CompanySelection: undefined;
  VoucherDetail: { voucherId: string };
  CreateVoucher: { type?: string };
  ItemDetail: { itemId: string };
  CreateItem: undefined;
  MLAnalytics: undefined;
  PaymentPrediction: undefined;
  RiskAssessment: undefined;
  InventoryForecast: undefined;
  Payment: undefined;
  Notifications: undefined;
  TallyIntegration: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Vouchers: undefined;
  Inventory: undefined;
  Reports: undefined;
  Sync: undefined;
  MLAnalytics: undefined;
};

// Screen Props Types
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
