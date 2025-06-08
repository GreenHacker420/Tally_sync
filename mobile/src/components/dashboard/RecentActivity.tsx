import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  List,
  Chip,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../services';

interface ActivityItem {
  id: string;
  type: 'voucher' | 'item' | 'sync';
  action: 'created' | 'updated' | 'deleted' | 'synced';
  title: string;
  subtitle?: string;
  timestamp: string;
  status?: 'success' | 'error' | 'pending';
}

const RecentActivity: React.FC = () => {
  const theme = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'voucher',
          action: 'created',
          title: 'Sales Invoice #SI-001',
          subtitle: 'Amount: ₹15,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
          status: 'success',
        },
        {
          id: '2',
          type: 'item',
          action: 'updated',
          title: 'Product ABC',
          subtitle: 'Stock updated: 50 units',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          status: 'success',
        },
        {
          id: '3',
          type: 'sync',
          action: 'synced',
          title: 'Data Synchronization',
          subtitle: '25 items synced successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          status: 'success',
        },
        {
          id: '4',
          type: 'voucher',
          action: 'created',
          title: 'Purchase Order #PO-002',
          subtitle: 'Amount: ₹8,500',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          status: 'pending',
        },
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, action: string): string => {
    switch (type) {
      case 'voucher':
        return action === 'created' ? 'receipt-text' : 'receipt-text-outline';
      case 'item':
        return action === 'created' ? 'package-variant' : 'package-variant-closed';
      case 'sync':
        return 'sync';
      default:
        return 'information';
    }
  };

  const getActivityColor = (status?: string): string => {
    switch (status) {
      case 'success':
        return theme.colors.primary;
      case 'error':
        return theme.colors.error;
      case 'pending':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <List.Item
      title={item.title}
      description={item.subtitle}
      left={(props) => (
        <View style={styles.iconContainer}>
          <Icon
            name={getActivityIcon(item.type, item.action)}
            size={24}
            color={getActivityColor(item.status)}
          />
        </View>
      )}
      right={() => (
        <View style={styles.rightContainer}>
          <Paragraph style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
            {formatTimestamp(item.timestamp)}
          </Paragraph>
          {item.status && item.status !== 'success' && (
            <Chip
              mode="outlined"
              compact
              style={[styles.statusChip, { borderColor: getActivityColor(item.status) }]}
              textStyle={[styles.statusChipText, { color: getActivityColor(item.status) }]}
            >
              {item.status}
            </Chip>
          )}
        </View>
      )}
      style={styles.activityItem}
    />
  );

  if (loading) {
    return (
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Title style={[styles.title, { color: theme.colors.onSurface }]}>
          Recent Activity
        </Title>
        <Paragraph style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Loading...
        </Paragraph>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Title style={[styles.title, { color: theme.colors.onSurface }]}>
        Recent Activity
      </Title>
      
      {activities.length > 0 ? (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No recent activity
        </Paragraph>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  statusChip: {
    height: 20,
  },
  statusChipText: {
    fontSize: 10,
  },
  activityItem: {
    paddingHorizontal: 0,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 8,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
});

export default RecentActivity;
