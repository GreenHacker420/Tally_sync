import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Surface,
  Text,
  Chip,
  Card,
  List,
  Button,
  useTheme,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import Header from '../components/common/Header';
import LoadingScreen from '../components/common/LoadingScreen';

// Store
import { RootState, AppDispatch } from '../store';
import { fetchVoucherById } from '../store/slices/voucherSlice';

// Types
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'VoucherDetail'>;

const VoucherDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { voucherId } = route.params;
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { selectedVoucher, isLoading } = useSelector((state: RootState) => state.voucher);

  useEffect(() => {
    dispatch(fetchVoucherById(voucherId));
  }, [dispatch, voucherId]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN');
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

  if (isLoading || !selectedVoucher) {
    return <LoadingScreen message="Loading voucher details..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Voucher Details"
        subtitle={selectedVoucher.voucherNumber}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Voucher Header */}
        <Surface style={styles.headerCard} elevation={2}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.voucherNumber}>
                {selectedVoucher.voucherNumber}
              </Text>
              <Text variant="bodyMedium" style={styles.voucherDate}>
                {formatDate(selectedVoucher.date)}
              </Text>
            </View>
            
            <View style={styles.headerChips}>
              <Chip
                mode="outlined"
                style={[styles.typeChip, { borderColor: getVoucherTypeColor(selectedVoucher.voucherType) }]}
                textStyle={[styles.typeChipText, { color: getVoucherTypeColor(selectedVoucher.voucherType) }]}
              >
                {selectedVoucher.voucherType.toUpperCase()}
              </Chip>
              
              <Chip
                mode="outlined"
                style={[styles.statusChip, { borderColor: getStatusColor(selectedVoucher.status) }]}
                textStyle={[styles.statusChipText, { color: getStatusColor(selectedVoucher.status) }]}
              >
                {selectedVoucher.status.toUpperCase()}
              </Chip>
            </View>
          </View>
          
          <View style={styles.amountContainer}>
            <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.primary }]}>
              {formatCurrency(selectedVoucher.amount)}
            </Text>
          </View>
        </Surface>

        {/* Voucher Details */}
        <Surface style={styles.detailsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Voucher Information</Text>
          
          <List.Item
            title="Voucher Type"
            description={selectedVoucher.voucherType}
            left={(props) => <List.Icon {...props} icon="receipt" />}
          />
          
          <List.Item
            title="Reference"
            description={selectedVoucher.reference || 'No reference'}
            left={(props) => <List.Icon {...props} icon="link" />}
          />
          
          <List.Item
            title="Narration"
            description={selectedVoucher.narration || 'No narration'}
            left={(props) => <List.Icon {...props} icon="text" />}
          />
          
          <List.Item
            title="Created By"
            description={selectedVoucher.createdBy}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          
          <List.Item
            title="Created At"
            description={new Date(selectedVoucher.createdAt).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar-plus" />}
          />
          
          <List.Item
            title="Last Updated"
            description={new Date(selectedVoucher.updatedAt).toLocaleString()}
            left={(props) => <List.Icon {...props} icon="calendar-edit" />}
          />
        </Surface>

        {/* Voucher Entries */}
        <Surface style={styles.entriesCard} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Accounting Entries</Text>
          
          {selectedVoucher.entries.map((entry, index) => (
            <Card key={entry.id} style={styles.entryCard}>
              <Card.Content>
                <View style={styles.entryHeader}>
                  <Text variant="titleSmall" style={styles.accountName}>{entry.accountName}</Text>
                  <View style={styles.entryAmounts}>
                    {entry.debitAmount > 0 && (
                      <Chip
                        mode="outlined"
                        compact
                        style={[styles.amountChip, { borderColor: theme.colors.error }]}
                        textStyle={[styles.amountChipText, { color: theme.colors.error }]}
                      >
                        Dr. {formatCurrency(entry.debitAmount)}
                      </Chip>
                    )}
                    {entry.creditAmount > 0 && (
                      <Chip
                        mode="outlined"
                        compact
                        style={[styles.amountChip, { borderColor: theme.colors.primary }]}
                        textStyle={[styles.amountChipText, { color: theme.colors.primary }]}
                      >
                        Cr. {formatCurrency(entry.creditAmount)}
                      </Chip>
                    )}
                  </View>
                </View>
                
                {entry.narration && (
                  <Text variant="bodyMedium" style={styles.entryNarration}>
                    {entry.narration}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </Surface>

        {/* Sync Information */}
        {selectedVoucher.tallyId && (
          <Surface style={styles.syncCard} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>Sync Information</Text>
            
            <List.Item
              title="Tally ID"
              description={selectedVoucher.tallyId}
              left={(props) => <List.Icon {...props} icon="sync" />}
            />
            
            {selectedVoucher.lastSyncedAt && (
              <List.Item
                title="Last Synced"
                description={new Date(selectedVoucher.lastSyncedAt).toLocaleString()}
                left={(props) => <List.Icon {...props} icon="clock-check" />}
              />
            )}
          </Surface>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Edit voucher
            }}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Duplicate voucher
            }}
            style={styles.actionButton}
            icon="content-copy"
          >
            Duplicate
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Print/Export voucher
            }}
            style={styles.actionButton}
            icon="printer"
          >
            Print
          </Button>
        </View>

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
  headerCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  voucherNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  voucherDate: {
    fontSize: 16,
    opacity: 0.7,
  },
  headerChips: {
    gap: 8,
  },
  typeChip: {
    height: 28,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'center',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  entriesCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  entryCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  entryAmounts: {
    gap: 4,
  },
  amountChip: {
    height: 24,
  },
  amountChipText: {
    fontSize: 12,
  },
  entryNarration: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  syncCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default VoucherDetailScreen;
