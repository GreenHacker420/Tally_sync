import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import VouchersScreen from '../screens/VouchersScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SyncScreen from '../screens/SyncScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MLAnalyticsScreen from '../screens/MLAnalyticsScreen';
import PaymentPredictionScreen from '../screens/PaymentPredictionScreen';
import VoucherDetailScreen from '../screens/VoucherDetailScreen';
import CreateVoucherScreen from '../screens/CreateVoucherScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import CreateItemScreen from '../screens/CreateItemScreen';
import CompanySelectionScreen from '../screens/CompanySelectionScreen';
import PaymentScreen from '../screens/PaymentScreen';
import NotificationScreen from '../screens/NotificationScreen';
import TallyIntegrationScreen from '../screens/TallyIntegrationScreen';

// Types
import { MainTabParamList, MainStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Tab Navigator
const TabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Vouchers':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Inventory':
              iconName = focused ? 'package-variant' : 'package-variant-closed';
              break;
            case 'Reports':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Sync':
              iconName = focused ? 'sync' : 'sync-off';
              break;
            case 'MLAnalytics':
              iconName = focused ? 'robot' : 'robot-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Vouchers" 
        component={VouchersScreen}
        options={{ tabBarLabel: 'Vouchers' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{ tabBarLabel: 'Inventory' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{ tabBarLabel: 'Sync' }}
      />
      <Tab.Screen
        name="MLAnalytics"
        component={MLAnalyticsScreen}
        options={{ tabBarLabel: 'AI Insights' }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      
      {/* Modal Screens */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="CompanySelection" component={CompanySelectionScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="TallyIntegration" component={TallyIntegrationScreen} />
      </Stack.Group>

      {/* Detail Screens */}
      <Stack.Screen name="VoucherDetail" component={VoucherDetailScreen} />
      <Stack.Screen name="CreateVoucher" component={CreateVoucherScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="CreateItem" component={CreateItemScreen} />

      {/* ML Screens */}
      <Stack.Screen name="PaymentPrediction" component={PaymentPredictionScreen} />
      {/* TODO: Add RiskAssessmentScreen and InventoryForecastScreen */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
