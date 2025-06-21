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
  List,
  TextInput,
  Switch,
  ActivityIndicator,
  Text,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { useAppDispatch, useTally, useCompany } from '../store/hooks';
import {
  fetchTallyConnections,
  testTallyConnection,
  fetchSyncStatus,
  performFullSync,
  fetchSyncLogs,
  fetchSyncConflicts,
  fetchTallySettings,
  updateTallySettings,
  fetchSyncStatistics,
} from '../store/slices/tallySlice';
import { formatDate, formatTime } from '../utils/formatters';

const TallyIntegrationScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    connections, 
    syncStatus, 
    syncLogs, 
    syncConflicts, 
    settings, 
    statistics,
    isLoading, 
    isSyncing, 
    error 
  } = useTally();
  const { selectedCompany } = useCompany();
  
  const [activeTab, setActiveTab] = useState<'status' | 'settings' | 'logs' | 'conflicts'>('status');
  const [refreshing, setRefreshing] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    host: 'localhost',
    port: '9000',
  });

  useEffect(() => {
    if (selectedCompany) {
      loadTallyData();
    }
  }, [selectedCompany]);

  const loadTallyData = async () => {
    if (!selectedCompany) return;

    try {
      await Promise.all([
        dispatch(fetchTallyConnections(selectedCompany.id)),
        dispatch(fetchSyncStatus(selectedCompany.id)),
        dispatch(fetchSyncLogs({ companyId: selectedCompany.id })),
        dispatch(fetchSyncConflicts({ companyId: selectedCompany.id })),
        dispatch(fetchTallySettings(selectedCompany.id)),
        dispatch(fetchSyncStatistics({ companyId: selectedCompany.id })),
      ]);
    } catch (error) {
      console.error('Error loading Tally data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTallyData();
    setRefreshing(false);
  };

  const handleTestConnection = async () => {
    if (!selectedCompany) return;

    try {
      const result = await dispatch(testTallyConnection({
        host: connectionForm.host,
        port: parseInt(connectionForm.port),
        companyId: selectedCompany.id,
      }));

      if (result.payload.connected) {
        Alert.alert('Success', 'Connection to Tally successful!');
      } else {
        Alert.alert('Error', result.payload.message || 'Failed to connect to Tally');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    }
  };

  const handleFullSync = async () => {
    if (!selectedCompany) return;

    Alert.alert(
      'Full Sync',
      'This will sync all data between the app and Tally. This may take some time. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              await dispatch(performFullSync({
                companyId: selectedCompany.id,
                options: {
                  direction: 'bidirectional',
                  entities: ['vouchers', 'items', 'parties'],
                },
              }));
              Alert.alert('Success', 'Full sync initiated successfully');
              loadTallyData();
            } catch (error) {
              Alert.alert('Error', 'Failed to initiate full sync');
            }
          },
        },
      ]
    );
  };

  const handleSettingsUpdate = async (newSettings: any) => {
    if (!selectedCompany) return;

    try {
      await dispatch(updateTallySettings({
        companyId: selectedCompany.id,
        settings: newSettings,
      }));
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'syncing':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderStatusTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Connection Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Connection Status</Title>
          {connections.length > 0 ? (
            connections.map((connection) => (
              <List.Item
                key={connection.id}
                title={connection.name}
                description={`${connection.host}:${connection.port}`}
                left={(props) => (
                  <List.Icon 
                    {...props} 
                    icon={connection.isActive ? "check-circle" : "alert-circle"}
                    color={connection.isActive ? "#4CAF50" : "#F44336"}
                  />
                )}
                right={(props) => (
                  <Chip mode="outlined">
                    {connection.isActive ? 'Active' : 'Inactive'}
                  </Chip>
                )}
              />
            ))
          ) : (
            <Paragraph>No connections configured</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Sync Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Sync Status</Title>
          {syncStatus ? (
            <>
              <View style={styles.statusRow}>
                <Text>Status:</Text>
                <Chip 
                  mode="outlined"
                  textStyle={{ color: getSyncStatusColor(syncStatus.status) }}
                >
                  {syncStatus.status}
                </Chip>
              </View>
              
              {syncStatus.lastSyncTime && (
                <View style={styles.statusRow}>
                  <Text>Last Sync:</Text>
                  <Text>{formatDate(syncStatus.lastSyncTime)} at {formatTime(syncStatus.lastSyncTime)}</Text>
                </View>
              )}

              {syncStatus.progress && (
                <View style={styles.progressContainer}>
                  <Text>Progress: {syncStatus.progress.current}/{syncStatus.progress.total}</Text>
                  <ProgressBar 
                    progress={syncStatus.progress.current / syncStatus.progress.total}
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressStage}>{syncStatus.progress.stage}</Text>
                </View>
              )}

              {syncStatus.stats && (
                <View style={styles.statsContainer}>
                  <Title style={styles.statsTitle}>Sync Statistics</Title>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Vouchers</Text>
                      <Text style={styles.statValue}>
                        {syncStatus.stats.vouchers.synced}/{syncStatus.stats.vouchers.synced + syncStatus.stats.vouchers.failed}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Items</Text>
                      <Text style={styles.statValue}>
                        {syncStatus.stats.items.synced}/{syncStatus.stats.items.synced + syncStatus.stats.items.failed}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Parties</Text>
                      <Text style={styles.statValue}>
                        {syncStatus.stats.parties.synced}/{syncStatus.stats.parties.synced + syncStatus.stats.parties.failed}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Paragraph>No sync status available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Test Connection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Test Connection</Title>
          <TextInput
            label="Host"
            value={connectionForm.host}
            onChangeText={(text) => setConnectionForm({ ...connectionForm, host: text })}
            style={styles.input}
          />
          <TextInput
            label="Port"
            value={connectionForm.port}
            onChangeText={(text) => setConnectionForm({ ...connectionForm, port: text })}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleTestConnection}
            style={styles.testButton}
          >
            Test Connection
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      {settings && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Sync Settings</Title>
            
            <View style={styles.settingRow}>
              <Text>Auto Sync</Text>
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => 
                  handleSettingsUpdate({ ...settings, autoSync: value })
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text>Sync Interval (minutes)</Text>
              <TextInput
                value={settings.syncInterval.toString()}
                onChangeText={(text) => 
                  handleSettingsUpdate({ ...settings, syncInterval: parseInt(text) || 30 })
                }
                keyboardType="numeric"
                style={styles.intervalInput}
              />
            </View>

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>Sync Entities</Title>
            
            <View style={styles.settingRow}>
              <Text>Vouchers</Text>
              <Switch
                value={settings.entities.vouchers}
                onValueChange={(value) => 
                  handleSettingsUpdate({ 
                    ...settings, 
                    entities: { ...settings.entities, vouchers: value }
                  })
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text>Items</Text>
              <Switch
                value={settings.entities.items}
                onValueChange={(value) => 
                  handleSettingsUpdate({ 
                    ...settings, 
                    entities: { ...settings.entities, items: value }
                  })
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text>Parties</Text>
              <Switch
                value={settings.entities.parties}
                onValueChange={(value) => 
                  handleSettingsUpdate({ 
                    ...settings, 
                    entities: { ...settings.entities, parties: value }
                  })
                }
              />
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  const renderLogsTab = () => (
    <ScrollView style={styles.tabContent}>
      {syncLogs.map((log) => (
        <Card key={log.id} style={styles.card}>
          <Card.Content>
            <View style={styles.logHeader}>
              <Chip 
                mode="outlined"
                textStyle={{ 
                  color: log.status === 'success' ? '#4CAF50' : 
                        log.status === 'error' ? '#F44336' : '#FF9800'
                }}
              >
                {log.status}
              </Chip>
              <Text style={styles.logDate}>
                {formatDate(log.timestamp)} {formatTime(log.timestamp)}
              </Text>
            </View>
            <Paragraph style={styles.logMessage}>{log.message}</Paragraph>
            <Text style={styles.logType}>{log.type}</Text>
          </Card.Content>
        </Card>
      ))}
      
      {syncLogs.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text>No sync logs available</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderConflictsTab = () => (
    <ScrollView style={styles.tabContent}>
      {syncConflicts.map((conflict) => (
        <Card key={conflict.id} style={styles.card}>
          <Card.Content>
            <View style={styles.conflictHeader}>
              <Title>{conflict.entityType} Conflict</Title>
              <Chip mode="outlined">{conflict.conflictType}</Chip>
            </View>
            <Paragraph>Entity ID: {conflict.entityId}</Paragraph>
            <Text style={styles.conflictDate}>
              {formatDate(conflict.createdAt)}
            </Text>
            
            <View style={styles.conflictActions}>
              <Button mode="outlined" style={styles.conflictButton}>
                Use Local
              </Button>
              <Button mode="outlined" style={styles.conflictButton}>
                Use Tally
              </Button>
              <Button mode="contained" style={styles.conflictButton}>
                Merge
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}
      
      {syncConflicts.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text>No sync conflicts</Text>
        </View>
      )}
    </ScrollView>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading Tally integration...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'status' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('status')}
          style={styles.tabButton}
        >
          Status
        </Button>
        <Button
          mode={activeTab === 'settings' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('settings')}
          style={styles.tabButton}
        >
          Settings
        </Button>
        <Button
          mode={activeTab === 'logs' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('logs')}
          style={styles.tabButton}
        >
          Logs
        </Button>
        <Button
          mode={activeTab === 'conflicts' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('conflicts')}
          style={styles.tabButton}
        >
          Conflicts
        </Button>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'status' && renderStatusTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'logs' && renderLogsTab()}
        {activeTab === 'conflicts' && renderConflictsTab()}
      </ScrollView>

      <FAB
        icon="sync"
        style={styles.fab}
        onPress={handleFullSync}
        disabled={isSyncing}
        loading={isSyncing}
      />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    marginVertical: 8,
  },
  progressStage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  input: {
    marginVertical: 8,
  },
  testButton: {
    marginTop: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  intervalInput: {
    width: 80,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDate: {
    fontSize: 12,
    color: '#666',
  },
  logMessage: {
    marginVertical: 8,
  },
  logType: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictDate: {
    fontSize: 12,
    color: '#666',
    marginVertical: 8,
  },
  conflictActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  conflictButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

export default TallyIntegrationScreen;
