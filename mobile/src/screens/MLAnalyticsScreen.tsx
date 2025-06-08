import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  Button,
  Chip,
  Card,
  ProgressBar,
  useTheme,
  SegmentedButtons,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';
import LoadingScreen from '../components/common/LoadingScreen';

// Store
import { RootState, AppDispatch } from '../store';
import {
  checkMLServiceHealth,
  fetchBusinessMetrics,
  fetchRiskDashboard,
  fetchInventoryAnalytics,
  fetchPaymentTrends,
  fetchModelStatus,
  setSelectedMetricsPeriod,
} from '../store/slices/mlSlice';

// Types
import { MainStackScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

type Props = MainStackScreenProps<'MLAnalytics'>;

const MLAnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    isMLServiceAvailable,
    mlServiceHealth,
    businessMetrics,
    businessMetricsLoading,
    riskDashboard,
    riskDashboardLoading,
    inventoryAnalytics,
    inventoryAnalyticsLoading,
    paymentTrends,
    paymentTrendsLoading,
    modelStatus,
    selectedMetricsPeriod,
    error,
    lastUpdated,
  } = useSelector((state: RootState) => state.ml);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    initializeMLData();
  }, [dispatch]);

  const initializeMLData = async () => {
    try {
      // Check ML service health first
      await dispatch(checkMLServiceHealth()).unwrap();
      
      // Load all ML data
      await Promise.all([
        dispatch(fetchBusinessMetrics(selectedMetricsPeriod)),
        dispatch(fetchRiskDashboard()),
        dispatch(fetchInventoryAnalytics()),
        dispatch(fetchPaymentTrends()),
        dispatch(fetchModelStatus()),
      ]);
    } catch (error) {
      console.error('Failed to initialize ML data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeMLData();
    setRefreshing(false);
  };

  const handlePeriodChange = (period: number) => {
    dispatch(setSelectedMetricsPeriod(period));
    dispatch(fetchBusinessMetrics(period));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return '#f59e0b';
      case 'low':
        return theme.colors.primary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  if (!isMLServiceAvailable) {
    return (
      <View style={styles.container}>
        <Header
          title="ML Analytics"
          subtitle="AI-Powered Insights"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.errorContainer}>
          <Icon
            name="robot-confused"
            size={80}
            color={theme.colors.error}
          />
          <Title style={[styles.errorTitle, { color: theme.colors.error }]}>
            ML Service Unavailable
          </Title>
          <Paragraph style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
            The AI/ML service is currently unavailable. Please check your connection and try again.
          </Paragraph>
          <Button
            mode="contained"
            onPress={handleRefresh}
            style={styles.retryButton}
            icon="refresh"
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (businessMetricsLoading && !businessMetrics) {
    return <LoadingScreen message="Loading AI insights..." />;
  }

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Period Selector */}
      <Surface style={styles.card} elevation={2}>
        <Title style={styles.cardTitle}>Analysis Period</Title>
        <SegmentedButtons
          value={selectedMetricsPeriod.toString()}
          onValueChange={(value) => handlePeriodChange(parseInt(value))}
          buttons={[
            { value: '7', label: '7 Days' },
            { value: '30', label: '30 Days' },
            { value: '90', label: '90 Days' },
          ]}
        />
      </Surface>

      {/* Business Metrics */}
      {businessMetrics && (
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Business Performance</Title>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Icon name="trending-up" size={24} color={theme.colors.primary} />
              <Paragraph style={styles.metricLabel}>Revenue Growth</Paragraph>
              <Title style={[styles.metricValue, { color: theme.colors.primary }]}>
                {formatPercentage(businessMetrics.revenue_forecast.growth_rate)}
              </Title>
            </View>
            
            <View style={styles.metricItem}>
              <Icon name="clock-check" size={24} color={theme.colors.tertiary} />
              <Paragraph style={styles.metricLabel}>On-time Payments</Paragraph>
              <Title style={[styles.metricValue, { color: theme.colors.tertiary }]}>
                {formatPercentage(businessMetrics.payment_insights.on_time_percentage)}
              </Title>
            </View>
            
            <View style={styles.metricItem}>
              <Icon name="account-group" size={24} color={theme.colors.secondary} />
              <Paragraph style={styles.metricLabel}>Total Customers</Paragraph>
              <Title style={[styles.metricValue, { color: theme.colors.secondary }]}>
                {businessMetrics.customer_analytics.total_customers}
              </Title>
            </View>
            
            <View style={styles.metricItem}>
              <Icon name="package-variant" size={24} color={theme.colors.tertiary} />
              <Paragraph style={styles.metricLabel}>Inventory Items</Paragraph>
              <Title style={[styles.metricValue, { color: theme.colors.tertiary }]}>
                {businessMetrics.inventory_insights.total_items}
              </Title>
            </View>
          </View>
        </Surface>
      )}

      {/* Risk Summary */}
      {riskDashboard && (
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Risk Overview</Title>
          
          <View style={styles.riskSummary}>
            <View style={styles.riskItem}>
              <Chip
                mode="outlined"
                style={[styles.riskChip, { borderColor: theme.colors.error }]}
                textStyle={{ color: theme.colors.error }}
              >
                {riskDashboard.summary.total_high_risk} High Risk
              </Chip>
            </View>
            
            <View style={styles.riskItem}>
              <Chip
                mode="outlined"
                style={[styles.riskChip, { borderColor: '#f59e0b' }]}
                textStyle={{ color: '#f59e0b' }}
              >
                {riskDashboard.summary.total_overdue} Overdue
              </Chip>
            </View>
            
            <View style={styles.riskItem}>
              <Chip
                mode="outlined"
                style={[styles.riskChip, { borderColor: theme.colors.tertiary }]}
                textStyle={{ color: theme.colors.tertiary }}
              >
                {riskDashboard.summary.total_credit_alerts} Credit Alerts
              </Chip>
            </View>
          </View>
        </Surface>
      )}

      {/* Model Status */}
      {modelStatus && (
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>AI Model Status</Title>
          
          <View style={styles.modelGrid}>
            {Object.entries(modelStatus.models).map(([modelName, model]) => (
              <View key={modelName} style={styles.modelItem}>
                <View style={styles.modelHeader}>
                  <Icon
                    name={model.status === 'active' ? 'check-circle' : 'alert-circle'}
                    size={16}
                    color={model.status === 'active' ? theme.colors.primary : theme.colors.error}
                  />
                  <Paragraph style={styles.modelName}>
                    {modelName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Paragraph>
                </View>
                <Paragraph style={styles.modelAccuracy}>
                  Accuracy: {formatPercentage(model.accuracy)}
                </Paragraph>
                <ProgressBar
                  progress={model.accuracy}
                  color={theme.colors.primary}
                  style={styles.accuracyBar}
                />
              </View>
            ))}
          </View>
        </Surface>
      )}
    </View>
  );

  const renderPredictionsTab = () => (
    <View style={styles.tabContent}>
      <Surface style={styles.card} elevation={2}>
        <Title style={styles.cardTitle}>Prediction Tools</Title>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('PaymentPrediction')}
          style={styles.predictionButton}
          icon="crystal-ball"
        >
          Payment Delay Prediction
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('RiskAssessment')}
          style={styles.predictionButton}
          icon="shield-alert"
        >
          Customer Risk Assessment
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('InventoryForecast')}
          style={styles.predictionButton}
          icon="chart-timeline-variant"
        >
          Inventory Demand Forecast
        </Button>
      </Surface>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="ML Analytics"
        subtitle="AI-Powered Business Insights"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.tabSelector}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'predictions', label: 'Predictions' },
          ]}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'overview' ? renderOverviewTab() : renderPredictionsTab()}
        
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
  tabSelector: {
    padding: 16,
    paddingBottom: 0,
  },
  tabContent: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: (width - 64) / 2,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  riskSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  riskItem: {
    flex: 1,
    minWidth: 100,
  },
  riskChip: {
    width: '100%',
  },
  modelGrid: {
    gap: 12,
  },
  modelItem: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modelName: {
    fontSize: 14,
    fontWeight: '500',
  },
  modelAccuracy: {
    fontSize: 12,
    marginBottom: 8,
  },
  accuracyBar: {
    height: 4,
    borderRadius: 2,
  },
  predictionButton: {
    marginBottom: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default MLAnalyticsScreen;
