import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  TextInput,
  Button,
  Card,
  Chip,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';

// Store
import { RootState, AppDispatch } from '../store';
import { predictPaymentDelay } from '../store/slices/mlSlice';

// Services
import { mlService } from '../services/mlService';

// Types
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'PaymentPrediction'>;

interface PredictionForm {
  customer_id: string;
  amount: string;
  due_date: string;
  days_ahead: string;
}

const PaymentPredictionScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { paymentPredictions } = useSelector((state: RootState) => state.ml);
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PredictionForm>({
    defaultValues: {
      customer_id: '',
      amount: '',
      due_date: '',
      days_ahead: '30',
    },
  });

  const onSubmit = async (data: PredictionForm) => {
    try {
      setLoading(true);
      
      const params = {
        customer_id: data.customer_id,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        due_date: data.due_date || undefined,
        days_ahead: parseInt(data.days_ahead) || 30,
      };

      const result = await dispatch(predictPaymentDelay(params)).unwrap();
      setPrediction(result.prediction);
    } catch (error: any) {
      Alert.alert('Prediction Failed', error || 'Failed to predict payment delay');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    reset();
    setPrediction(null);
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
    return mlService.getRiskColor(riskLevel);
  };

  const getRiskIcon = (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'check-circle';
      default:
        return 'information';
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Payment Prediction"
        subtitle="AI-Powered Payment Delay Prediction"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Form */}
        <Surface style={styles.card} elevation={2}>
          <Title style={styles.cardTitle}>Prediction Parameters</Title>
          
          <Controller
            control={control}
            name="customer_id"
            rules={{ required: 'Customer ID is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Customer ID *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                error={!!errors.customer_id}
                style={styles.input}
              />
            )}
          />
          {errors.customer_id && (
            <Paragraph style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.customer_id.message}
            </Paragraph>
          )}

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Payment Amount (Optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-inr" />}
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="due_date"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Due Date (Optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                placeholder="YYYY-MM-DD"
                left={<TextInput.Icon icon="calendar" />}
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="days_ahead"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Prediction Period (Days)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="clock" />}
                style={styles.input}
              />
            )}
          />

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleClear}
              style={styles.clearButton}
              disabled={loading}
            >
              Clear
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              style={styles.predictButton}
              icon="crystal-ball"
            >
              Predict
            </Button>
          </View>
        </Surface>

        {/* Prediction Results */}
        {prediction && (
          <Surface style={styles.card} elevation={2}>
            <Title style={styles.cardTitle}>Prediction Results</Title>
            
            {/* Risk Level */}
            <View style={styles.riskHeader}>
              <Icon
                name={getRiskIcon(prediction.risk_level)}
                size={32}
                color={getRiskColor(prediction.risk_level)}
              />
              <View style={styles.riskInfo}>
                <Title style={[styles.riskLevel, { color: getRiskColor(prediction.risk_level) }]}>
                  {prediction.risk_level} Risk
                </Title>
                <Paragraph style={styles.riskSubtitle}>
                  Customer: {prediction.customer_id}
                </Paragraph>
              </View>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              <Card style={styles.metricCard}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="percent" size={24} color={theme.colors.primary} />
                  <View style={styles.metricText}>
                    <Paragraph style={styles.metricLabel}>Delay Probability</Paragraph>
                    <Title style={styles.metricValue}>
                      {formatPercentage(prediction.delay_probability)}
                    </Title>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.metricCard}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="calendar-clock" size={24} color={theme.colors.secondary} />
                  <View style={styles.metricText}>
                    <Paragraph style={styles.metricLabel}>Predicted Delay</Paragraph>
                    <Title style={styles.metricValue}>
                      {prediction.predicted_delay_days} days
                    </Title>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.metricCard}>
                <Card.Content style={styles.metricContent}>
                  <Icon name="shield-check" size={24} color={theme.colors.tertiary} />
                  <View style={styles.metricText}>
                    <Paragraph style={styles.metricLabel}>Confidence</Paragraph>
                    <Title style={styles.metricValue}>
                      {formatPercentage(prediction.confidence_score)}
                    </Title>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* Confidence Bar */}
            <View style={styles.confidenceContainer}>
              <Paragraph style={styles.confidenceLabel}>
                Prediction Confidence
              </Paragraph>
              <ProgressBar
                progress={prediction.confidence_score}
                color={theme.colors.primary}
                style={styles.confidenceBar}
              />
              <Paragraph style={styles.confidenceText}>
                {mlService.formatConfidenceScore(prediction.confidence_score)}
              </Paragraph>
            </View>

            {/* Key Factors */}
            {prediction.factors && Object.keys(prediction.factors).length > 0 && (
              <View style={styles.factorsContainer}>
                <Title style={styles.factorsTitle}>Key Influencing Factors</Title>
                <View style={styles.factorsGrid}>
                  {Object.entries(prediction.factors).map(([factor, importance]) => (
                    <Chip
                      key={factor}
                      mode="outlined"
                      style={styles.factorChip}
                      textStyle={styles.factorChipText}
                    >
                      {factor}: {formatPercentage(importance as number)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Recommendations */}
            <View style={styles.recommendationsContainer}>
              <Title style={styles.recommendationsTitle}>Recommendations</Title>
              <View style={styles.recommendationsList}>
                {prediction.risk_level === 'High' && (
                  <>
                    <View style={styles.recommendationItem}>
                      <Icon name="alert" size={16} color={theme.colors.error} />
                      <Paragraph style={styles.recommendationText}>
                        Consider requiring advance payment or deposit
                      </Paragraph>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Icon name="phone" size={16} color={theme.colors.error} />
                      <Paragraph style={styles.recommendationText}>
                        Contact customer proactively before due date
                      </Paragraph>
                    </View>
                  </>
                )}
                
                {prediction.risk_level === 'Medium' && (
                  <>
                    <View style={styles.recommendationItem}>
                      <Icon name="calendar-check" size={16} color="#f59e0b" />
                      <Paragraph style={styles.recommendationText}>
                        Send payment reminder 3-5 days before due date
                      </Paragraph>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Icon name="eye" size={16} color="#f59e0b" />
                      <Paragraph style={styles.recommendationText}>
                        Monitor payment closely around due date
                      </Paragraph>
                    </View>
                  </>
                )}
                
                {prediction.risk_level === 'Low' && (
                  <View style={styles.recommendationItem}>
                    <Icon name="check-circle" size={16} color={theme.colors.primary} />
                    <Paragraph style={styles.recommendationText}>
                      Standard payment processing expected
                    </Paragraph>
                  </View>
                )}
              </View>
            </View>
          </Surface>
        )}

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
  input: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
  },
  predictButton: {
    flex: 2,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  riskInfo: {
    marginLeft: 16,
    flex: 1,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  riskSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
  },
  metricContent: {
    alignItems: 'center',
    padding: 12,
  },
  metricText: {
    alignItems: 'center',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confidenceContainer: {
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    textAlign: 'right',
  },
  factorsContainer: {
    marginBottom: 20,
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorChip: {
    marginBottom: 4,
  },
  factorChipText: {
    fontSize: 12,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default PaymentPredictionScreen;
