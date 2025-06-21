import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Chip,
  Divider,
  useTheme,
  ActivityIndicator,
  IconButton,
  List,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';

// Store
import { AppDispatch } from '../store';
import { useInventory } from '../store/hooks';
import { fetchItemById, deleteItem } from '../store/slices/inventorySlice';

// Types
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'ItemDetail'>;

const ItemDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId } = route.params;
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedItem, isLoading, error } = useInventory();

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadItemDetail();
  }, [itemId]);

  const loadItemDetail = async () => {
    try {
      await dispatch(fetchItemById(itemId)).unwrap();
    } catch (error) {
      console.error('Failed to load item:', error);
      Alert.alert('Error', 'Failed to load item details');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditItem', { itemId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await dispatch(deleteItem(itemId)).unwrap();
      Alert.alert('Success', 'Item deleted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to delete item:', error);
      Alert.alert('Error', 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockStatusColor = (stockLevel: string) => {
    switch (stockLevel?.toLowerCase()) {
      case 'in_stock':
        return theme.colors.primary;
      case 'low_stock':
        return '#f59e0b';
      case 'out_of_stock':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading item details...
        </Text>
      </View>
    );
  }

  if (error || !selectedItem) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="alert-circle" size={64} color={theme.colors.error} />
        <Text variant="headlineSmall" style={styles.errorTitle}>
          Item Not Found
        </Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {error || 'The requested item could not be found.'}
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Item Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerActions}>
            <IconButton
              icon="pencil"
              size={24}
              onPress={handleEdit}
            />
            <IconButton
              icon="delete"
              size={24}
              iconColor={theme.colors.error}
              onPress={handleDelete}
              disabled={isDeleting}
            />
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Header */}
        <Surface style={styles.headerCard} elevation={2}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text variant="headlineSmall" style={styles.itemName}>
                {selectedItem.name}
              </Text>
              <Text variant="bodyMedium" style={styles.itemCode}>
                Code: {selectedItem.code}
              </Text>
              <Text variant="bodyMedium" style={styles.itemCategory}>
                {selectedItem.category}
              </Text>
            </View>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStockStatusColor(selectedItem.stockLevel) }]}
              textStyle={{ color: getStockStatusColor(selectedItem.stockLevel) }}
            >
              {selectedItem.stockLevel?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </Chip>
          </View>
        </Surface>

        {/* Basic Info */}
        <Surface style={styles.detailsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Item Information
          </Text>

          <List.Item
            title="Item ID"
            description={itemId}
            left={() => <List.Icon icon="identifier" />}
          />

          <List.Item
            title="Name"
            description={selectedItem.name || 'Not specified'}
            left={() => <List.Icon icon="tag" />}
          />

          <List.Item
            title="Code"
            description={selectedItem.code || 'Not specified'}
            left={() => <List.Icon icon="barcode" />}
          />

          <List.Item
            title="Category"
            description={selectedItem.category || 'Not specified'}
            left={() => <List.Icon icon="folder" />}
          />
        </Surface>
      </ScrollView>

      {/* Action Buttons */}
      <Surface style={styles.actionBar} elevation={4}>
        <Button
          mode="outlined"
          onPress={handleEdit}
          style={styles.actionButton}
          icon="pencil"
        >
          Edit
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
        >
          Done
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
  },
  itemCode: {
    marginTop: 4,
    opacity: 0.7,
  },
  itemCategory: {
    marginTop: 2,
    opacity: 0.7,
  },
  statusChip: {
    marginLeft: 16,
  },
  detailsCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default ItemDetailScreen;
