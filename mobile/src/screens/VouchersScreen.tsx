import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Surface,
  List,
  Chip,
  FAB,
  Searchbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';

// Components
import Header from '../components/common/Header';

// Store
import { RootState, AppDispatch } from '../store';
import { fetchVouchers, setFilters } from '../store/slices/voucherSlice';

// Types
import { MainTabScreenProps } from '../types/navigation';
import { Voucher } from '../types';

type Props = MainTabScreenProps<'Vouchers'>;

const VouchersScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { vouchers, isLoading, filters, pagination } = useSelector(
    (state: RootState) => state.voucher
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchVouchers({ refresh: true }));
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchVouchers({ refresh: true }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoading) {
      dispatch(fetchVouchers({ page: pagination.page + 1 }));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch(setFilters({ ...filters, search: query }));
    dispatch(fetchVouchers({ refresh: true }));
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getVoucherTypeColor = (type: string): string => {
    switch (type) {
      case 'sales':
        return theme.colors.primary;
      case 'purchase':
        return theme.colors.secondary;
      case 'receipt':
        return theme.colors.tertiary;
      case 'payment':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'posted':
        return theme.colors.primary;
      case 'draft':
        return theme.colors.tertiary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderVoucherItem = ({ item }: { item: Voucher }) => (
    <Surface style={styles.voucherCard} elevation={1}>
      <List.Item
        title={`${item.voucherType.toUpperCase()} - ${item.voucherNumber}`}
        description={item.narration || 'No description'}
        onPress={() => navigation.navigate('VoucherDetail', { voucherId: item.id })}
        left={(props) => (
          <List.Icon
            {...props}
            icon="receipt"
            color={getVoucherTypeColor(item.voucherType)}
          />
        )}
        right={() => (
          <View style={styles.voucherRight}>
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, { color: theme.colors.onSurface }]}>
                {formatAmount(item.amount)}
              </Text>
              <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                {formatDate(item.date)}
              </Text>
            </View>
            <Chip
              mode="outlined"
              compact
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
            >
              {item.status}
            </Chip>
          </View>
        )}
      />
    </Surface>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
        No vouchers found
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Vouchers"
        subtitle={`${vouchers.length} vouchers`}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <View style={styles.content}>
        <Searchbar
          placeholder="Search vouchers..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        <FlatList
          data={vouchers}
          renderItem={renderVoucherItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateVoucher')}
      />
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
  searchbar: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  voucherCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  voucherRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VouchersScreen;
