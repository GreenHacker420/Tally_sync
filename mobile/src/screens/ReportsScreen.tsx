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
  Card,
  List,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';
import StatsCard from '../components/dashboard/StatsCard';

// Services
import { apiClient } from '../services';

// Types
import { MainTabScreenProps } from '../types/navigation';

type Props = MainTabScreenProps<'Reports'>;

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'financial' | 'inventory' | 'customer' | 'ml';
}

const reports: ReportItem[] = [
  {
    id: 'profit_loss',
    title: 'Profit & Loss',
    description: 'Income statement and profitability analysis',
    icon: 'chart-line',
    category: 'financial',
  },
  {
    id: 'balance_sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity overview',
    icon: 'scale-balance',
    category: 'financial',
  },
  {
    id: 'cash_flow',
    title: 'Cash Flow',
    description: 'Cash inflows and outflows analysis',
    icon: 'cash-multiple',
    category: 'financial',
  },
  {
    id: 'sales_report',
    title: 'Sales Report',
    description: 'Sales performance and trends',
    icon: 'trending-up',
    category: 'financial',
  },
  {
    id: 'inventory_valuation',
    title: 'Inventory Valuation',
    description: 'Stock value and movement analysis',
    icon: 'package-variant',
    category: 'inventory',
  },
  {
    id: 'stock_movement',
    title: 'Stock Movement',
    description: 'Inventory transactions and transfers',
    icon: 'swap-horizontal',
    category: 'inventory',
  },
  {
    id: 'customer_aging',
    title: 'Customer Aging',
    description: 'Outstanding receivables by age',
    icon: 'account-clock',
    category: 'customer',
  },
  {
    id: 'payment_analysis',
    title: 'Payment Analysis',
    description: 'Payment patterns and delays',
    icon: 'credit-card-clock',
    category: 'customer',
  },
  {
    id: 'risk_assessment',
    title: 'AI Risk Assessment',
    description: 'ML-powered customer risk analysis',
    icon: 'robot',
    category: 'ml',
  },
  {
    id: 'demand_forecast',
    title: 'Demand Forecast',
    description: 'AI-driven inventory demand predictions',
    icon: 'crystal-ball',
    category: 'ml',
  },
];

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalVouchers: number;
  totalItems: number;
  topSellingItems: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const parentNavigation = navigation.getParent();
  const theme = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 40000,
    totalVouchers: 156,
    totalItems: 89,
    topSellingItems: [],
    monthlyTrends: [],
  });

  const filteredReports = selectedCategory === 'all'
    ? reports
    : reports.filter(report => report.category === selectedCategory);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = useCallback(async () => {
    try {
      const response = await apiClient.get('/reports/dashboard');

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  }, [loadReportData]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'financial':
        return theme.colors.primary;
      case 'inventory':
        return theme.colors.secondary;
      case 'customer':
        return theme.colors.tertiary;
      case 'ml':
        return '#8b5cf6';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const handleReportPress = (reportId: string) => {
    switch (reportId) {
      case 'risk_assessment':
      case 'demand_forecast':
        navigation.navigate('MLAnalytics');
        break;
      case 'inventory_valuation':
      case 'stock_movement':
        navigation.navigate('Inventory');
        break;
      default:
        Alert.alert('Coming Soon', `${reportId} report will be available soon`);
    }
  };

  const renderReportItem = (report: ReportItem) => (
    <Card key={report.id} style={styles.reportCard}>
      <List.Item
        title={report.title}
        description={report.description}
        onPress={() => handleReportPress(report.id)}
        left={() => (
          <View style={[styles.iconContainer, { backgroundColor: `${getCategoryColor(report.category)}20` }]}>
            <Icon
              name={report.icon}
              size={24}
              color={getCategoryColor(report.category)}
            />
          </View>
        )}
        right={() => (
          <Icon
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Reports"
        subtitle="Business Intelligence & Analytics"
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
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <StatsCard
            title="Revenue"
            value={formatCurrency(reportData.totalRevenue)}
            icon="trending-up"
            color={theme.colors.primary}
            onPress={() => {}}
          />
          <StatsCard
            title="Expenses"
            value={formatCurrency(reportData.totalExpenses)}
            icon="trending-down"
            color={theme.colors.error}
            onPress={() => {}}
          />
        </View>

        <View style={styles.metricsGrid}>
          <StatsCard
            title="Net Profit"
            value={formatCurrency(reportData.netProfit)}
            icon={reportData.netProfit >= 0 ? "trending-up" : "trending-down"}
            color={reportData.netProfit >= 0 ? theme.colors.primary : theme.colors.error}
            onPress={() => {}}
          />
          <StatsCard
            title="Vouchers"
            value={reportData.totalVouchers.toString()}
            icon="receipt"
            color={theme.colors.secondary}
            onPress={() => navigation.navigate('Vouchers')}
          />
        </View>

        {/* Category Filter */}
        <Surface style={styles.filterCard} elevation={2}>
          <Text variant="titleMedium" style={styles.filterTitle}>Report Categories</Text>
          <SegmentedButtons
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'financial', label: 'Financial' },
              { value: 'inventory', label: 'Inventory' },
              { value: 'customer', label: 'Customer' },
              { value: 'ml', label: 'AI/ML' },
            ]}
          />
        </Surface>

        {/* Quick Actions */}
        <Surface style={styles.quickActionsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('MLAnalytics')}
              style={styles.quickActionButton}
              icon="robot"
            >
              AI Insights
            </Button>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Coming Soon', 'Export functionality will be available soon')}
              style={styles.quickActionButton}
              icon="download"
            >
              Export All
            </Button>
          </View>
        </Surface>

        {/* Reports List */}
        <Surface style={styles.reportsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {selectedCategory === 'all' ? 'All Reports' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Reports`}
          </Text>

          <View style={styles.reportsList}>
            {filteredReports.map(renderReportItem)}
          </View>
        </Surface>

        {/* Report Summary */}
        <Surface style={styles.summaryCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Report Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Icon name="file-chart" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.summaryLabel}>Total Reports</Text>
              <Text variant="titleMedium" style={styles.summaryValue}>{reports.length}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Icon name="robot" size={24} color="#8b5cf6" />
              <Text variant="bodyMedium" style={styles.summaryLabel}>AI Reports</Text>
              <Text variant="titleMedium" style={styles.summaryValue}>
                {reports.filter(r => r.category === 'ml').length}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Icon name="clock" size={24} color={theme.colors.tertiary} />
              <Text variant="bodyMedium" style={styles.summaryLabel}>Last Updated</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>Just now</Text>
            </View>
          </View>
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
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  filterCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
  reportsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reportsList: {
    gap: 8,
  },
  reportCard: {
    borderRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ReportsScreen;
