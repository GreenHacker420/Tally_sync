import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Store and Navigation
import { store, persistor } from './store';
import AppNavigator from './navigation/AppNavigator';

// Services
import { initializeServices } from './services';

// Theme and Components
import { theme } from './theme';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Utils
import { setupNetworkListener } from './utils/networkUtils';
import { initializeDatabase } from './utils/databaseUtils';

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

const App: React.FC = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize local database
        await initializeDatabase();
        
        // Initialize services
        await initializeServices();
        
        // Setup network monitoring
        setupNetworkListener();
        
        console.log('FinSync360 Mobile App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <PaperProvider theme={theme}>
              <NavigationContainer>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={theme.colors.surface}
                  translucent={false}
                />
                <AppNavigator />
                <Toast />
              </NavigationContainer>
            </PaperProvider>
          </PersistGate>
        </ReduxProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
