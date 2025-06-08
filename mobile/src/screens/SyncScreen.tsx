import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  Button,
  ProgressBar,
  List,
  Chip,
  Switch,
  useTheme,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';

// Store
import { RootState, AppDispatch } from '../store';
import {
  startSync,
  stopSync,
  forceSync,
  getSyncStatus,
  setAutoSyncEnabled,
  setSyncInterval,
} from '../store/slices/syncSlice';

// Types
import { MainTabScreenProps } from '../types/navigation';

type Props = MainTabScreenProps<'Sync'>;

const SyncScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncProgress,
    syncHistory,
    pendingChanges,
    autoSyncEnabled,
    syncInterval,
    error,
  } = useSelector((state: RootState) => state.sync);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getSyncStatus());
  }, [dispatch]);

  const handleStartSync = async () => {
    try {
      await dispatch(startSync()).unwrap();
    } catch (error: any) {
      Alert.alert('Sync Failed', error || 'Failed to start synchronization');
    }
  };

  const handleStopSync = async () => {
    try {
      await dispatch(stopSync()).unwrap();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to stop synchronization');
    }
  };

  const handleForceSync = async () => {
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
            } catch (error: any) {
              Alert.alert('Force Sync Failed', error || 'Failed to force synchronization');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(getSyncStatus());
    setRefreshing(false);
  };

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
        subtitle="Data Synchronization"
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Sync Status */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Title style={styles.statusTitle}>Sync Status</Title>
              <View style={styles.statusRow}>
                <Icon
                  name={isSyncing ? 'sync' : isOnline ? 'cloud-check' : 'cloud-off'}
                  size={16}
                  color={getSyncStatusColor()}
                />
                <Paragraph style={[styles.statusText, { color: getSyncStatusColor() }]}>
                  {getSyncStatusText()}
                </Paragraph>
              </View>
            </View>
            
            <View style={styles.statusActions}>
              {!isSyncing ? (
                <Button
                  mode="contained"
                  onPress={handleStartSync}
                  disabled={!isOnline}
                  icon="sync"
                >
                  Sync Now
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleStopSync}
                  icon="stop"
                >
                  Stop
                </Button>
              )}
            </View>
          </View>

          {syncProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Paragraph style={styles.progressText}>
                  {syncProgress.message}
                </Paragraph>
                <Paragraph style={styles.progressPercent}>
                  {Math.round(syncProgress.percentage)}%
                </Paragraph>
              </View>
              <ProgressBar
                progress={syncProgress.percentage / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Paragraph style={styles.infoLabel}>Last Sync</Paragraph>
              <Paragraph style={styles.infoValue}>
                {formatLastSync(lastSyncTime)}
              </Paragraph>
            </View>
            
            <View style={styles.infoItem}>
              <Paragraph style={styles.infoLabel}>Pending Changes</Paragraph>
              <Chip mode="outlined" compact>
                {pendingChanges}
              </Chip>
            </View>
            
            <View style={styles.infoItem}>
              <Paragraph style={styles.infoLabel}>Connection</Paragraph>
              <View style={styles.connectionStatus}>
                <Icon
                  name={isOnline ? 'wifi' : 'wifi-off'}
                  size={14}
                  color={isOnline ? theme.colors.primary : theme.colors.error}
                />
                <Paragraph style={[
                  styles.connectionText,
                  { color: isOnline ? theme.colors.primary : theme.colors.error }
                ]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Paragraph>
              </View>
            </View>
          </View>
        </Surface>

        {/* Sync Settings */}
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Sync Settings</Title>
          
          <List.Item
            title="Auto Sync"
            description="Automatically sync when online"
            left={(props) => <List.Icon {...props} icon="sync" />}
            right={() => (
              <Switch
                value={autoSyncEnabled}
                onValueChange={(value) => dispatch(setAutoSyncEnabled(value))}
              />
            )}
          />
          
          <List.Item
            title="Sync Interval"
            description={`Every ${syncInterval} minutes`}
            left={(props) => <List.Icon {...props} icon="clock" />}
            onPress={() => {
              // TODO: Show interval picker
            }}
          />
        </Surface>

        {/* Advanced Actions */}
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Advanced</Title>
          
          <Button
            mode="outlined"
            onPress={handleForceSync}
            disabled={isSyncing || !isOnline}
            icon="download"
            style={styles.advancedButton}
          >
            Force Sync from Server
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Clear local data
            }}
            disabled={isSyncing}
            icon="delete"
            style={styles.advancedButton}
          >
            Clear Local Data
          </Button>
        </Surface>

        {/* Sync History */}
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Recent Sync History</Title>
          
          {syncHistory.length > 0 ? (
            syncHistory.slice(0, 5).map((session) => (
              <List.Item
                key={session.id}
                title={`Sync ${session.status}`}
                description={`${session.processedItems}/${session.totalItems} items • ${new Date(session.startTime).toLocaleString()}`}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={session.status === 'completed' ? 'check-circle' : 'alert-circle'}
                    color={session.status === 'completed' ? theme.colors.primary : theme.colors.error}
                  />
                )}
              />
            ))
          ) : (
            <Paragraph style={styles.emptyText}>No sync history available</Paragraph>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusActions: {
    marginLeft: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  infoItem: {
    flex: 1,
    minWidth: 100,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
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
  advancedButton: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SyncScreen;
