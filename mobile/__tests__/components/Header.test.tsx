import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';

import Header from '../../src/components/common/Header';
import { theme } from '../../src/theme';

// Mock store
const mockStore = configureStore({
  reducer: {
    sync: (state = {
      isSyncing: false,
      pendingChanges: 0,
      isOnline: true,
    }) => state,
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <PaperProvider theme={theme}>
        {component}
      </PaperProvider>
    </Provider>
  );
};

describe('Header Component', () => {
  const defaultProps = {
    title: 'Test Title',
  };

  it('renders title correctly', () => {
    const { getByText } = renderWithProviders(<Header {...defaultProps} />);
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = renderWithProviders(
      <Header {...defaultProps} subtitle="Test Subtitle" />
    );
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('shows back button when showBack is true', () => {
    const onBackPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Header {...defaultProps} showBack onBackPress={onBackPress} />
    );
    
    const backButton = getByTestId('header-back-button');
    expect(backButton).toBeTruthy();
    
    fireEvent.press(backButton);
    expect(onBackPress).toHaveBeenCalled();
  });

  it('shows sync button when showSync is true', () => {
    const onSyncPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Header {...defaultProps} showSync onSyncPress={onSyncPress} />
    );
    
    const syncButton = getByTestId('header-sync-button');
    expect(syncButton).toBeTruthy();
    
    fireEvent.press(syncButton);
    expect(onSyncPress).toHaveBeenCalled();
  });

  it('shows pending changes badge when there are pending changes', () => {
    // Update mock store with pending changes
    const storeWithPendingChanges = configureStore({
      reducer: {
        sync: (state = {
          isSyncing: false,
          pendingChanges: 5,
          isOnline: true,
        }) => state,
      },
    });

    const { getByText } = render(
      <Provider store={storeWithPendingChanges}>
        <PaperProvider theme={theme}>
          <Header {...defaultProps} showSync />
        </PaperProvider>
      </Provider>
    );
    
    expect(getByText('5')).toBeTruthy();
  });

  it('shows settings button when onSettingsPress is provided', () => {
    const onSettingsPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Header {...defaultProps} onSettingsPress={onSettingsPress} />
    );
    
    const settingsButton = getByTestId('header-settings-button');
    expect(settingsButton).toBeTruthy();
    
    fireEvent.press(settingsButton);
    expect(onSettingsPress).toHaveBeenCalled();
  });

  it('shows profile button when onProfilePress is provided', () => {
    const onProfilePress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Header {...defaultProps} onProfilePress={onProfilePress} />
    );
    
    const profileButton = getByTestId('header-profile-button');
    expect(profileButton).toBeTruthy();
    
    fireEvent.press(profileButton);
    expect(onProfilePress).toHaveBeenCalled();
  });

  it('displays correct sync icon based on sync state', () => {
    // Test syncing state
    const syncingStore = configureStore({
      reducer: {
        sync: (state = {
          isSyncing: true,
          pendingChanges: 0,
          isOnline: true,
        }) => state,
      },
    });

    const { rerender } = render(
      <Provider store={syncingStore}>
        <PaperProvider theme={theme}>
          <Header {...defaultProps} showSync />
        </PaperProvider>
      </Provider>
    );

    // Should show sync icon when syncing
    expect(getByTestId('sync-icon')).toBeTruthy();

    // Test offline state
    const offlineStore = configureStore({
      reducer: {
        sync: (state = {
          isSyncing: false,
          pendingChanges: 0,
          isOnline: false,
        }) => state,
      },
    });

    rerender(
      <Provider store={offlineStore}>
        <PaperProvider theme={theme}>
          <Header {...defaultProps} showSync />
        </PaperProvider>
      </Provider>
    );

    // Should show cloud-off icon when offline
    expect(getByTestId('cloud-off-icon')).toBeTruthy();
  });
});
