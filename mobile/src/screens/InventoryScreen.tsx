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
import { useInventory } from '../store/hooks';
import { fetchInventoryItems, deleteItem, clearError } from '../store/slices/inventorySlice';

// Types
import { MainTabScreenProps } from '../types/navigation';
import { InventoryItem } from '../types';

interface InventoryFilters {
  category: string;
  status: string;
  stockLevel: string;
  search: string;
}

type Props = MainTabScreenProps<'Inventory'>;

const InventoryScreen: React.FC<Props> = ({ navigation }) => {
  const parentNavigation = navigation.getParent();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { items, error } = useInventory();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({
    category: 'all',
    status: 'all',
    stockLevel: 'all',
    search: '',
  });

  useEffect(() => {
    loadItems();
  }, [dispatch, filters]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadItems = useCallback(async () => {
    try {
      await dispatch(fetchInventoryItems({ refresh: true })).unwrap();
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query }));
  }, []);

  const handleItemPress = useCallback((itemId: string) => {
    parentNavigation?.navigate('ItemDetail', { itemId });
  }, [parentNavigation]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteItem(itemId)).unwrap();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const getStockStatusIcon = (stockLevel: number, minStock: number): string => {
    if (stockLevel <= 0) return 'alert-circle';
    if (stockLevel <= minStock) return 'alert';
    return 'check-circle';
  };

  const getStockStatusColor = (stockLevel: number, minStock: number): string => {
    if (stockLevel <= 0) return theme.colors.error;
    if (stockLevel <= minStock) return theme.colors.tertiary;
    return theme.colors.primary;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <Surface style={[styles.itemCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <List.Item
        title={item.name}
        description={`${item.category} • ${item.unit}`}
        left={() => (
          <View style={styles.iconContainer}>
            <Icon
              name="package-variant"
              size={24}
              color={theme.colors.primary}
            />
          </View>
        )}
        right={() => (
          <View style={styles.rightContainer}>
            <View style={styles.stockInfo}>
              <Text
                variant="titleMedium"
                style={[styles.stockLevel, { color: getStockStatusColor(item.currentStock, item.reorderLevel) }]}
              >
                {item.currentStock} {item.unit}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.price, { color: theme.colors.onSurfaceVariant }]}
              >
                {formatCurrency(item.rate)}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Icon
                name={getStockStatusIcon(item.currentStock, item.reorderLevel)}
                size={16}
                color={getStockStatusColor(item.currentStock, item.reorderLevel)}
              />
              {item.currentStock <= item.reorderLevel && (
                <Chip
                  mode="outlined"
                  compact
                  style={[styles.statusChip, { borderColor: theme.colors.error }]}
                  textStyle={[styles.statusChipText, { color: theme.colors.error }]}
                >
                  Low Stock
                </Chip>
              )}
            </View>
            <Menu
              visible={menuVisible && selectedItem === item.id}
              onDismiss={() => {
                setMenuVisible(false);
                setSelectedItem(null);
              }}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    setSelectedItem(item.id);
                    setMenuVisible(true);
                  }}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedItem(null);
                  handleItemPress(item.id);
                }}
                title="View Details"
                leadingIcon="eye"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedItem(null);
                  parentNavigation?.navigate('CreateItem', { type: 'edit', itemId: item.id });
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedItem(null);
                  handleDeleteItem(item.id);
                }}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>
        )}
        onPress={() => handleItemPress(item.id)}
        style={styles.listItem}
      />
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Inventory"
        subtitle={`${items.length} items`}
        showSync
        onSettingsPress={() => parentNavigation?.navigate('Settings')}
      />

      <View style={styles.content}>
        {/* Search and Filters */}
        <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Searchbar
            placeholder="Search items..."
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

        {/* Items List */}
        <FlatList
          data={items}
          renderItem={renderInventoryItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="package-variant-closed"
                size={64}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="headlineSmall"
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                No Items Found
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                {searchQuery ? 'Try adjusting your search criteria' : 'Add your first inventory item to get started'}
              </Text>
              {!searchQuery && (
                <Button
                  mode="contained"
                  onPress={() => parentNavigation?.navigate('CreateItem')}
                  icon="plus"
                  style={styles.emptyButton}
                >
                  Add Item
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
        onPress={() => parentNavigation?.navigate('CreateItem')}
        label="Add Item"
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
  itemCard: {
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
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockLevel: {
    fontWeight: '600',
  },
  price: {
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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

export default InventoryScreen;
