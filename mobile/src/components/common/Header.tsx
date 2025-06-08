import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Appbar,
  Title,
  Subtitle,
  IconButton,
  Badge,
  useTheme,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSync?: boolean;
  showNotifications?: boolean;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  onProfilePress?: () => void;
  onSyncPress?: () => void;
  onNotificationsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showSync = false,
  showNotifications = false,
  onBackPress,
  onSettingsPress,
  onProfilePress,
  onSyncPress,
  onNotificationsPress,
}) => {
  const theme = useTheme();
  const { isSyncing, pendingChanges } = useSelector((state: RootState) => state.sync);
  const { isOnline } = useSelector((state: RootState) => state.sync);

  return (
    <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      {showBack && (
        <Appbar.BackAction onPress={onBackPress} />
      )}
      
      <View style={styles.titleContainer}>
        <Title style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Title>
        {subtitle && (
          <Subtitle style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Subtitle>
        )}
      </View>

      <View style={styles.actions}>
        {showSync && (
          <View style={styles.syncContainer}>
            <IconButton
              icon={isSyncing ? 'sync' : isOnline ? 'cloud-check' : 'cloud-off'}
              iconColor={
                isSyncing 
                  ? theme.colors.primary 
                  : isOnline 
                    ? theme.colors.primary 
                    : theme.colors.error
              }
              onPress={onSyncPress}
              animated
            />
            {pendingChanges > 0 && (
              <Badge
                style={[styles.badge, { backgroundColor: theme.colors.error }]}
                size={16}
              >
                {pendingChanges > 99 ? '99+' : pendingChanges}
              </Badge>
            )}
          </View>
        )}

        {showNotifications && (
          <IconButton
            icon="bell"
            onPress={onNotificationsPress}
          />
        )}

        {onProfilePress && (
          <IconButton
            icon="account-circle"
            onPress={onProfilePress}
          />
        )}

        {onSettingsPress && (
          <IconButton
            icon="cog"
            onPress={onSettingsPress}
          />
        )}
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: -4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
});

export default Header;
