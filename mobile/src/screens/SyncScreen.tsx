import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  ProgressBar,
  List,
  Chip,
  Switch,
  useTheme,
  Divider,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';

// Store
import { AppDispatch } from '../store';
import { useAuth, useSync } from '../store/hooks';
import {
  startSync,
  pauseSync,
  resumeSync,
  forceSync,
  clearSyncError,
  updateSyncSettings,
} from '../store/slices/syncSlice';

// Types
import { MainTabScreenProps } from '../types/navigation';

interface SyncStatus {
  lastSync: string | null;
  totalItems: number;
  syncedItems: number;
  pendingItems: number;
  failedItems: number;
  isAutoSyncEnabled: boolean;
  syncInterval: number;
}

type Props = MainTabScreenProps<'Sync'>;

const SyncScreen: React.FC<Props> = ({ navigation }) => {
  const parentNavigation = navigation.getParent();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useAuth();
  const {
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncTime,
    error: syncError,
    pendingChanges,
    syncHistory
  } = useSync();

  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    totalItems: 0,
    syncedItems: 0,
    pendingItems: 0,
    failedItems: 0,
    isAutoSyncEnabled: true,
    syncInterval: 300, // 5 minutes
  });

  useEffect(() => {
    loadSyncStatus();
  }, []);

  useEffect(() => {
    if (syncError) {
      Alert.alert('Sync Error', syncError);
      dispatch(clearSyncError());
    }
  }, [syncError, dispatch]);

  const loadSyncStatus = useCallback(async () => {
    try {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: lastSyncTime,
        pendingItems: pendingChanges,
      }));
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, [lastSyncTime, pendingChanges]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSyncStatus();
    setRefreshing(false);
  }, [loadSyncStatus]);

  const handleStartSync = useCallback(async () => {
    try {
      await dispatch(startSync()).unwrap();
      Alert.alert('Success', 'Sync completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    }
  }, [dispatch]);

  const handlePauseSync = useCallback(() => {
    dispatch(pauseSync());
  }, [dispatch]);

  const handleResumeSync = useCallback(() => {
    dispatch(resumeSync());
  }, [dispatch]);

  const handleForceSync = useCallback(async () => {
    Alert.alert(
      'Force Sync',
      'This will override any pending changes and sync all data from the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(forceSync()).unwrap();
              Alert.alert('Success', 'Force sync completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to force sync');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const handleToggleAutoSync = useCallback(async (enabled: boolean) => {
    try {
      await dispatch(updateSyncSettings({ autoSync: enabled })).unwrap();
      setSyncStatus(prev => ({ ...prev, isAutoSyncEnabled: enabled }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update sync settings');
    }
  }, [dispatch]);

  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    return date.toLocaleString();
  };

  const getSyncStatusColor = (): string => {
    if (error) return theme.colors.error;
    if (isSyncing) return theme.colors.primary;
    if (!isOnline) return theme.colors.error;
    if (pendingChanges > 0) return theme.colors.tertiary;
    return theme.colors.primary;
  };

  const getSyncStatusText = (): string => {
    if (error) return 'Error';
    if (isSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (pendingChanges > 0) return 'Pending changes';
    return 'Up to date';
  };

  return (
    <View style={styles.container}>
      <Header
        title="Sync"
        subtitle="Data synchronization"
        showSync
        onSettingsPress={() => parentNavigation?.navigate('Settings')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Sync Status */}
        <Surface style={[styles.statusCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text variant="titleLarge" style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                Sync Status
              </Text>
              <View style={styles.statusRow}>
                <Chip
                  mode="outlined"
                  style={[styles.statusChip, { borderColor: getSyncStatusColor() }]}
                  textStyle={[styles.statusChipText, { color: getSyncStatusColor() }]}
                  icon={isOnline ? 'cloud-check' : 'cloud-off'}
                >
                  {getSyncStatusText()}
                </Chip>
                <Text variant="bodyMedium" style={[styles.lastSync, { color: theme.colors.onSurfaceVariant }]}>
                  Last sync: {formatLastSync(syncStatus.lastSync)}
                </Text>
              </View>
            </View>
            <Icon
              name={isOnline ? 'cloud-check' : 'cloud-off'}
              size={32}
              color={getSyncStatusColor()}
            />
          </View>

          {isSyncing && (
            <View style={styles.progressContainer}>
              <Text variant="bodyMedium" style={[styles.progressText, { color: theme.colors.onSurface }]}>
                Syncing... {Math.round(syncProgress * 100)}%
              </Text>
              <ProgressBar
                progress={syncProgress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text variant="bodySmall" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Last Sync
              </Text>
              <Text variant="bodyMedium" style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                {formatLastSync(lastSyncTime)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text variant="bodySmall" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Pending Changes
              </Text>
              <Chip mode="outlined" compact>
                {pendingChanges}
              </Chip>
            </View>

            <View style={styles.infoItem}>
              <Text variant="bodySmall" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Connection
              </Text>
              <View style={styles.connectionStatus}>
                <Icon
                  name={isOnline ? 'wifi' : 'wifi-off'}
                  size={14}
                  color={isOnline ? theme.colors.primary : theme.colors.error}
                />
                <Text variant="bodyMedium" style={[
                  styles.connectionText,
                  { color: isOnline ? theme.colors.primary : theme.colors.error }
                ]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Sync Actions */}
        <Surface style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Sync Actions
          </Text>

          <View style={styles.actionButtons}>
            {!isSyncing ? (
              <Button
                mode="contained"
                onPress={handleStartSync}
                icon="sync"
                style={styles.actionButton}
                disabled={!isOnline}
              >
                Start Sync
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={handlePauseSync}
                icon="pause"
                style={styles.actionButton}
              >
                Pause Sync
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={handleForceSync}
              icon="sync-alert"
              style={styles.actionButton}
              disabled={!isOnline}
            >
              Force Sync
            </Button>
          </View>
        </Surface>

        {/* Sync Settings */}
        <Surface style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Sync Settings
          </Text>

          <List.Item
            title="Auto Sync"
            description="Automatically sync data when online"
            left={() => <Icon name="sync" size={24} color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={syncStatus.isAutoSyncEnabled}
                onValueChange={handleToggleAutoSync}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Sync Interval"
            description={`Every ${syncStatus.syncInterval / 60} minutes`}
            left={() => <Icon name="timer" size={24} color={theme.colors.primary} />}
            right={() => <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />}
            onPress={() => Alert.alert('Coming Soon', 'Sync interval settings')}
          />

          <Divider />

          <List.Item
            title="Sync on WiFi Only"
            description="Use WiFi only for large syncs"
            left={() => <Icon name="wifi" size={24} color={theme.colors.primary} />}
            right={() => <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />}
            onPress={() => Alert.alert('Coming Soon', 'WiFi sync settings')}
          />
        </Surface>

        {/* Sync History */}
        <Surface style={[styles.historyCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Recent Sync History
          </Text>

          {syncHistory && syncHistory.length > 0 ? (
            syncHistory.slice(0, 5).map((session) => (
              <List.Item
                key={session.id}
                title={`Sync ${session.status}`}
                description={`${session.processedItems}/${session.totalItems} items • ${new Date(session.startTime).toLocaleString()}`}
                left={() => (
                  <Icon
                    name={session.status === 'completed' ? 'check-circle' : 'alert-circle'}
                    size={24}
                    color={session.status === 'completed' ? theme.colors.primary : theme.colors.error}
                  />
                )}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No sync history available
            </Text>
          )}
        </Surface>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
  },
  lastSync: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 100,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  settingsCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  historyCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SyncScreen;
