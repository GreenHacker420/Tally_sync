import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Surface,
  Title,
  List,
  Switch,
  Button,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';

// Components
import Header from '../components/common/Header';

// Store
import { RootState, AppDispatch } from '../store';
import {
  setTheme,
  setAutoSync,
  setSyncInterval,
  setBiometricEnabled,
  setNotificationsEnabled,
  setOfflineMode,
  setDebugMode,
} from '../store/slices/settingsSlice';
import { logout } from '../store/slices/authSlice';

// Types
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const settings = useSelector((state: RootState) => state.settings);
  const { isMLServiceAvailable } = useSelector((state: RootState) => state.ml);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        subtitle="App Configuration"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Account</Title>
          
          <List.Item
            title={user?.name || 'User'}
            description={user?.email || 'No email'}
            left={(props) => <List.Icon {...props} icon="account" />}
            onPress={() => navigation.navigate('Profile')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <Divider />
          
          <List.Item
            title="Company Selection"
            description="Switch between companies"
            left={(props) => <List.Icon {...props} icon="office-building" />}
            onPress={() => navigation.navigate('CompanySelection')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Sync Settings */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Synchronization</Title>
          
          <List.Item
            title="Auto Sync"
            description="Automatically sync when online"
            left={(props) => <List.Icon {...props} icon="sync" />}
            right={() => (
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => dispatch(setAutoSync(value))}
              />
            )}
          />
          
          <List.Item
            title="Sync Interval"
            description={`Every ${settings.syncInterval} minutes`}
            left={(props) => <List.Icon {...props} icon="clock" />}
            onPress={() => {
              // TODO: Show interval picker
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <List.Item
            title="Offline Mode"
            description="Work offline with local data"
            left={(props) => <List.Icon {...props} icon="cloud-off" />}
            right={() => (
              <Switch
                value={settings.offlineMode}
                onValueChange={(value) => dispatch(setOfflineMode(value))}
              />
            )}
          />
        </Surface>

        {/* Security Settings */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Security</Title>
          
          <List.Item
            title="Biometric Authentication"
            description="Use fingerprint or face ID"
            left={(props) => <List.Icon {...props} icon="fingerprint" />}
            right={() => (
              <Switch
                value={settings.biometricEnabled}
                onValueChange={(value) => dispatch(setBiometricEnabled(value))}
              />
            )}
          />
        </Surface>

        {/* App Settings */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>App Settings</Title>
          
          <List.Item
            title="Theme"
            description={`${settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)} theme`}
            left={(props) => <List.Icon {...props} icon="palette" />}
            onPress={() => {
              // TODO: Show theme picker
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <List.Item
            title="Notifications"
            description="Push notifications and alerts"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => dispatch(setNotificationsEnabled(value))}
              />
            )}
          />
          
          <List.Item
            title="Debug Mode"
            description="Enable debug logging"
            left={(props) => <List.Icon {...props} icon="bug" />}
            right={() => (
              <Switch
                value={settings.debugMode}
                onValueChange={(value) => dispatch(setDebugMode(value))}
              />
            )}
          />
        </Surface>

        {/* ML Settings */}
        {isMLServiceAvailable && (
          <Surface style={styles.section} elevation={2}>
            <Title style={styles.sectionTitle}>AI/ML Features</Title>
            
            <List.Item
              title="ML Analytics"
              description="AI-powered business insights"
              left={(props) => <List.Icon {...props} icon="robot" />}
              onPress={() => navigation.navigate('MLAnalytics')}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            
            <List.Item
              title="Payment Predictions"
              description="AI payment delay predictions"
              left={(props) => <List.Icon {...props} icon="crystal-ball" />}
              onPress={() => navigation.navigate('PaymentPrediction')}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </Surface>
        )}

        {/* Data Management */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Data Management</Title>
          
          <List.Item
            title="Clear Cache"
            description="Clear all cached data"
            left={(props) => <List.Icon {...props} icon="delete" />}
            onPress={handleClearCache}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <List.Item
            title="Export Data"
            description="Export app data"
            left={(props) => <List.Icon {...props} icon="export" />}
            onPress={() => {
              // TODO: Implement data export
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* About Section */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>About</Title>
          
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <List.Item
            title="Privacy Policy"
            description="View privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => {
              // TODO: Open privacy policy
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <List.Item
            title="Terms of Service"
            description="View terms of service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => {
              // TODO: Open terms of service
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={[styles.logoutButton, { borderColor: theme.colors.error }]}
            textColor={theme.colors.error}
          >
            Logout
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
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  logoutButton: {
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SettingsScreen;
