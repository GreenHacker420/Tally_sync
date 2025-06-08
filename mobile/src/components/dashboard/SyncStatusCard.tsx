import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SyncStatusCardProps {
  lastSyncTime: string | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
  onSyncPress: () => void;
}

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  lastSyncTime,
  pendingChanges,
  isOnline,
  isSyncing,
  onSyncPress,
}) => {
  const theme = useTheme();

  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getSyncStatusColor = (): string => {
    if (isSyncing) return theme.colors.primary;
    if (!isOnline) return theme.colors.error;
    if (pendingChanges > 0) return theme.colors.tertiary;
    return theme.colors.primary;
  };

  const getSyncStatusIcon = (): string => {
    if (isSyncing) return 'sync';
    if (!isOnline) return 'cloud-off';
    if (pendingChanges > 0) return 'cloud-upload';
    return 'cloud-check';
  };

  const getSyncStatusText = (): string => {
    if (isSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (pendingChanges > 0) return 'Pending sync';
    return 'Up to date';
  };

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Title style={[styles.title, { color: theme.colors.onSurface }]}>
            Sync Status
          </Title>
          <View style={styles.statusRow}>
            <Icon
              name={getSyncStatusIcon()}
              size={16}
              color={getSyncStatusColor()}
            />
            <Paragraph style={[styles.statusText, { color: getSyncStatusColor() }]}>
              {getSyncStatusText()}
            </Paragraph>
          </View>
        </View>
        
        <Button
          mode="outlined"
          onPress={onSyncPress}
          disabled={isSyncing}
          compact
          icon={isSyncing ? 'sync' : 'refresh'}
        >
          {isSyncing ? 'Syncing' : 'Sync'}
        </Button>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Paragraph style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Last sync:
          </Paragraph>
          <Paragraph style={[styles.value, { color: theme.colors.onSurface }]}>
            {formatLastSync(lastSyncTime)}
          </Paragraph>
        </View>

        {pendingChanges > 0 && (
          <View style={styles.infoRow}>
            <Paragraph style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Pending changes:
            </Paragraph>
            <Chip
              mode="outlined"
              compact
              style={styles.pendingChip}
              textStyle={styles.pendingChipText}
            >
              {pendingChanges}
            </Chip>
          </View>
        )}

        <View style={styles.infoRow}>
          <Paragraph style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Connection:
          </Paragraph>
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
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
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
  content: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  pendingChip: {
    height: 24,
  },
  pendingChipText: {
    fontSize: 12,
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
});

export default SyncStatusCard;
