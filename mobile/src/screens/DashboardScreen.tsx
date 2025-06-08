import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text as PaperText,
  Button,
  Chip,
  Surface,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';
import StatsCard from '../components/dashboard/StatsCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import SyncStatusCard from '../components/dashboard/SyncStatusCard';

// Store
import { AppDispatch } from '../store';
import { useAuth, useSync, useML } from '../store/hooks';
import { getSyncStatus } from '../store/slices/syncSlice';
import { checkMLServiceHealth, fetchBusinessMetrics } from '../store/slices/mlSlice';

// Services
import { apiClient } from '../services';

// Types
import { MainTabScreenProps, MainStackScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalVouchers: number;
  totalItems: number;
  pendingSync: number;
  lastSyncTime: string | null;
}

type Props = MainTabScreenProps<'Dashboard'>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  // Get parent navigator to access stack screens
  const parentNavigation = navigation.getParent();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useAuth();
  const { isOnline, isSyncing, lastSyncTime, pendingChanges } = useSync();
  const { isMLServiceAvailable, businessMetrics } = useML();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalVouchers: 0,
    totalItems: 0,
    pendingSync: 0,
    lastSyncTime: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    dispatch(getSyncStatus());
  }, [dispatch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const [vouchersRes, itemsRes] = await Promise.all([
        apiClient.get('/vouchers/stats'),
        apiClient.get('/inventory/stats'),
      ]);

      setStats({
        totalVouchers: vouchersRes.data.data.total || 0,
        totalItems: itemsRes.data.data.total || 0,
        pendingSync: pendingChanges,
        lastSyncTime,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    dispatch(getSyncStatus());
    setRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_voucher':
        parentNavigation?.navigate('CreateVoucher');
        break;
      case 'create_item':
        parentNavigation?.navigate('CreateItem');
        break;
      case 'sync':
        navigation.navigate('Sync');
        break;
      case 'reports':
        navigation.navigate('Reports');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}`}
        showSync
        onSettingsPress={() => parentNavigation?.navigate('Settings')}
        onProfilePress={() => parentNavigation?.navigate('Profile')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status */}
        <Surface style={styles.statusCard} elevation={1}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Icon
                name={isOnline ? 'wifi' : 'wifi-off'}
                size={20}
                color={isOnline ? theme.colors.primary : theme.colors.error}
              />
              <PaperText variant="bodyMedium" style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </PaperText>
            </View>
            
            <View style={styles.statusItem}>
              <Icon
                name={isSyncing ? 'sync' : 'sync-off'}
                size={20}
                color={isSyncing ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <PaperText variant="bodyMedium" style={styles.statusText}>
                {isSyncing ? 'Syncing...' : 'Idle'}
              </PaperText>
            </View>

            {pendingChanges > 0 && (
              <Chip
                mode="outlined"
                compact
                style={styles.pendingChip}
                textStyle={styles.pendingChipText}
              >
                {pendingChanges} pending
              </Chip>
            )}
          </View>
        </Surface>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <StatsCard
            title="Vouchers"
            value={stats.totalVouchers}
            icon="receipt"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('Vouchers')}
          />
          <StatsCard
            title="Items"
            value={stats.totalItems}
            icon="package-variant"
            color={theme.colors.secondary}
            onPress={() => navigation.navigate('Inventory')}
          />
        </View>

        {/* Sync Status */}
        <SyncStatusCard
          lastSyncTime={lastSyncTime}
          pendingChanges={pendingChanges}
          isOnline={isOnline}
          isSyncing={isSyncing}
          onSyncPress={() => navigation.navigate('Sync')}
        />

        {/* Quick Actions */}
        <QuickActions onActionPress={handleQuickAction} />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pendingChip: {
    height: 28,
  },
  pendingChipText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default DashboardScreen;
