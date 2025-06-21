import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Surface,
  List,
  Chip,
  FAB,
  Searchbar,
  Text,
  Button,
  Menu,
  IconButton,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';

// Store
import { AppDispatch } from '../store';
import { useVoucher } from '../store/hooks';
import { fetchVouchers, deleteVoucher, clearError } from '../store/slices/voucherSlice';

// Types
import { MainTabScreenProps } from '../types/navigation';
import { Voucher } from '../types';

interface VoucherFilters {
  type: string;
  status: string;
  dateRange: string;
  search: string;
}

type Props = MainTabScreenProps<'Vouchers'>;

const VouchersScreen: React.FC<Props> = ({ navigation }) => {
  const parentNavigation = navigation.getParent();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { vouchers, error } = useVoucher();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [filters, setFilters] = useState<VoucherFilters>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    search: '',
  });

  useEffect(() => {
    loadVouchers();
  }, [dispatch, filters]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadVouchers = useCallback(async () => {
    try {
      await dispatch(fetchVouchers({ refresh: true })).unwrap();
    } catch (error) {
      console.error('Failed to load vouchers:', error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVouchers();
    setRefreshing(false);
  }, [loadVouchers]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query }));
  }, []);

  const handleVoucherPress = useCallback((voucherId: string) => {
    parentNavigation?.navigate('VoucherDetail', { voucherId });
  }, [parentNavigation]);

  const handleDeleteVoucher = useCallback(async (voucherId: string) => {
    Alert.alert(
      'Delete Voucher',
      'Are you sure you want to delete this voucher? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteVoucher(voucherId)).unwrap();
              Alert.alert('Success', 'Voucher deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete voucher');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const getVoucherTypeIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'sales': return 'cash-register';
      case 'purchase': return 'cart';
      case 'payment': return 'credit-card';
      case 'receipt': return 'receipt';
      case 'journal': return 'book-open';
      default: return 'file-document';
    }
  };

  const getVoucherStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved': return theme.colors.primary;
      case 'pending': return theme.colors.tertiary;
      case 'rejected': return theme.colors.error;
      case 'draft': return theme.colors.outline;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderVoucherItem = ({ item }: { item: Voucher }) => (
    <Surface style={[styles.voucherCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <List.Item
        title={`${item.voucherNumber} - ${item.voucherType}`}
        description={`${item.narration || 'No description'} • ${formatDate(item.date)}`}
        left={() => (
          <View style={styles.iconContainer}>
            <Icon
              name={getVoucherTypeIcon(item.voucherType)}
              size={24}
              color={theme.colors.primary}
            />
          </View>
        )}
        right={() => (
          <View style={styles.rightContainer}>
            <Text
              variant="titleMedium"
              style={[styles.amount, { color: theme.colors.onSurface }]}
            >
              {formatAmount(item.amount)}
            </Text>
            <Chip
              mode="outlined"
              compact
              style={[styles.statusChip, { borderColor: getVoucherStatusColor(item.status) }]}
              textStyle={[styles.statusChipText, { color: getVoucherStatusColor(item.status) }]}
            >
              {item.status}
            </Chip>
            <Menu
              visible={menuVisible && selectedVoucher === item.id}
              onDismiss={() => {
                setMenuVisible(false);
                setSelectedVoucher(null);
              }}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    setSelectedVoucher(item.id);
                    setMenuVisible(true);
                  }}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedVoucher(null);
                  handleVoucherPress(item.id);
                }}
                title="View Details"
                leadingIcon="eye"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedVoucher(null);
                  parentNavigation?.navigate('CreateVoucher', { type: 'edit', voucherId: item.id });
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedVoucher(null);
                  handleDeleteVoucher(item.id);
                }}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>
        )}
        onPress={() => handleVoucherPress(item.id)}
        style={styles.listItem}
      />
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Vouchers"
        subtitle={`${vouchers.length} vouchers`}
        showSync
        onSettingsPress={() => parentNavigation?.navigate('Settings')}
      />

      <View style={styles.content}>
        {/* Search and Filters */}
        <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Searchbar
            placeholder="Search vouchers..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />
          <Button
            mode="outlined"
            onPress={() => setShowFilters(!showFilters)}
            icon="filter"
            compact
            style={styles.filterButton}
          >
            Filters
          </Button>
        </Surface>

        {/* Vouchers List */}
        <FlatList
          data={vouchers}
          renderItem={renderVoucherItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="receipt-outline"
                size={64}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="headlineSmall"
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                No Vouchers Found
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first voucher to get started'}
              </Text>
              {!searchQuery && (
                <Button
                  mode="contained"
                  onPress={() => parentNavigation?.navigate('CreateVoucher')}
                  icon="plus"
                  style={styles.emptyButton}
                >
                  Create Voucher
                </Button>
              )}
            </View>
          }
        />
      </View>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => parentNavigation?.navigate('CreateVoucher')}
        label="New Voucher"
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
  },
  filterButton: {
    minWidth: 80,
  },
  listContainer: {
    paddingBottom: 100,
  },
  voucherCard: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  listItem: {
    paddingVertical: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  amount: {
    fontWeight: '600',
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VouchersScreen;
