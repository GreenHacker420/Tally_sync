import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  DataTable,
  Searchbar,
  Menu,
  Divider,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { useAppDispatch, usePayment, useCompany } from '../store/hooks';
import {
  fetchPaymentOrders,
  fetchPaymentLinks,
  fetchPaymentStats,
  createPaymentOrder,
  createPaymentLink,
  generateUPIQR,
  cancelPaymentLink,
} from '../store/slices/paymentSlice';
import { formatCurrency, formatDate } from '../utils/formatters';

const PaymentScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, paymentLinks, stats, isLoading, error } = usePayment();
  const { selectedCompany } = useCompany();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'links' | 'stats'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (selectedCompany) {
      loadPaymentData();
    }
  }, [selectedCompany, selectedStatus]);

  const loadPaymentData = async () => {
    if (!selectedCompany) return;

    try {
      const params = {
        companyId: selectedCompany.id,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      };

      await Promise.all([
        dispatch(fetchPaymentOrders(params)),
        dispatch(fetchPaymentLinks(params)),
        dispatch(fetchPaymentStats({ companyId: selectedCompany.id })),
      ]);
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
  };

  const handleCreatePaymentOrder = () => {
    Alert.prompt(
      'Create Payment Order',
      'Enter amount:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (amount) => {
            if (amount && selectedCompany) {
              try {
                await dispatch(createPaymentOrder({
                  amount: parseFloat(amount) * 100, // Convert to paise
                  companyId: selectedCompany.id,
                  receipt: `order_${Date.now()}`,
                }));
                Alert.alert('Success', 'Payment order created successfully');
                loadPaymentData();
              } catch (error) {
                Alert.alert('Error', 'Failed to create payment order');
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleCreatePaymentLink = () => {
    Alert.prompt(
      'Create Payment Link',
      'Enter amount:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (amount) => {
            if (amount && selectedCompany) {
              try {
                await dispatch(createPaymentLink({
                  amount: parseFloat(amount) * 100, // Convert to paise
                  description: 'Payment for services',
                  companyId: selectedCompany.id,
                }));
                Alert.alert('Success', 'Payment link created successfully');
                loadPaymentData();
              } catch (error) {
                Alert.alert('Error', 'Failed to create payment link');
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleGenerateUPIQR = () => {
    Alert.prompt(
      'Generate UPI QR Code',
      'Enter amount:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async (amount) => {
            if (amount && selectedCompany) {
              try {
                await dispatch(generateUPIQR({
                  amount: parseFloat(amount),
                  merchant_name: selectedCompany.name,
                  companyId: selectedCompany.id,
                }));
                Alert.alert('Success', 'UPI QR code generated successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to generate UPI QR code');
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleCancelPaymentLink = async (linkId: string) => {
    Alert.alert(
      'Cancel Payment Link',
      'Are you sure you want to cancel this payment link?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await dispatch(cancelPaymentLink(linkId));
              Alert.alert('Success', 'Payment link cancelled successfully');
              loadPaymentData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel payment link');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter(order =>
    order.receipt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLinks = paymentLinks.filter(link =>
    link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.container}>
      {stats && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Title>Payment Overview</Title>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(stats.totalAmount / 100)}</Text>
                  <Text style={styles.statLabel}>Total Amount</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalTransactions}</Text>
                  <Text style={styles.statLabel}>Total Transactions</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.successfulPayments}</Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.failedPayments}</Text>
                  <Text style={styles.statLabel}>Failed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.pendingPayments}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Payment Methods</Title>
              <View style={styles.methodsContainer}>
                {Object.entries(stats.byMethod).map(([method, count]) => (
                  <Chip key={method} style={styles.methodChip}>
                    {method}: {count}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );

  const renderOrdersTab = () => (
    <View style={styles.container}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Order ID</DataTable.Title>
          <DataTable.Title>Amount</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title>Date</DataTable.Title>
        </DataTable.Header>

        {filteredOrders.map((order) => (
          <DataTable.Row key={order.id}>
            <DataTable.Cell>{order.id.substring(0, 8)}...</DataTable.Cell>
            <DataTable.Cell>{formatCurrency(order.amount / 100)}</DataTable.Cell>
            <DataTable.Cell>
              <Chip
                mode="outlined"
                textStyle={{
                  color: order.status === 'paid' ? '#4CAF50' : 
                        order.status === 'failed' ? '#F44336' : '#FF9800'
                }}
              >
                {order.status}
              </Chip>
            </DataTable.Cell>
            <DataTable.Cell>{formatDate(order.createdAt)}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );

  const renderLinksTab = () => (
    <View style={styles.container}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Link ID</DataTable.Title>
          <DataTable.Title>Amount</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>

        {filteredLinks.map((link) => (
          <DataTable.Row key={link.id}>
            <DataTable.Cell>{link.id.substring(0, 8)}...</DataTable.Cell>
            <DataTable.Cell>{formatCurrency(link.amount / 100)}</DataTable.Cell>
            <DataTable.Cell>
              <Chip
                mode="outlined"
                textStyle={{
                  color: link.status === 'paid' ? '#4CAF50' : 
                        link.status === 'cancelled' ? '#F44336' : '#FF9800'
                }}
              >
                {link.status}
              </Chip>
            </DataTable.Cell>
            <DataTable.Cell>
              {link.status === 'created' && (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => handleCancelPaymentLink(link.id)}
                >
                  Cancel
                </Button>
              )}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search payments..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
            >
              Filter: {selectedStatus}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSelectedStatus('all'); setMenuVisible(false); }} title="All" />
          <Menu.Item onPress={() => { setSelectedStatus('created'); setMenuVisible(false); }} title="Created" />
          <Menu.Item onPress={() => { setSelectedStatus('paid'); setMenuVisible(false); }} title="Paid" />
          <Menu.Item onPress={() => { setSelectedStatus('failed'); setMenuVisible(false); }} title="Failed" />
        </Menu>
      </View>

      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'stats' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('stats')}
          style={styles.tabButton}
        >
          Stats
        </Button>
        <Button
          mode={activeTab === 'orders' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('orders')}
          style={styles.tabButton}
        >
          Orders
        </Button>
        <Button
          mode={activeTab === 'links' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('links')}
          style={styles.tabButton}
        >
          Links
        </Button>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'links' && renderLinksTab()}
      </ScrollView>

      <View style={styles.fabContainer}>
        <FAB
          icon="qrcode"
          style={[styles.fab, styles.fabSecondary]}
          onPress={handleGenerateUPIQR}
        />
        <FAB
          icon="link"
          style={[styles.fab, styles.fabSecondary]}
          onPress={handleCreatePaymentLink}
        />
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleCreatePaymentOrder}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    minWidth: 80,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  methodChip: {
    margin: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  fab: {
    marginBottom: 8,
  },
  fabSecondary: {
    backgroundColor: '#FF9800',
  },
});

export default PaymentScreen;
