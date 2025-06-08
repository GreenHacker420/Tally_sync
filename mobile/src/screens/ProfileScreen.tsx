import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  Avatar,
  List,
  Chip,
  useTheme,
} from 'react-native-paper';
import { useSelector } from 'react-redux';

// Components
import Header from '../components/common/Header';

// Store
import { RootState } from '../store';

// Types
import { MainStackScreenProps } from '../types/navigation';

type Props = MainStackScreenProps<'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'superadmin':
        return theme.colors.error;
      case 'admin':
        return theme.colors.primary;
      case 'user':
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        subtitle="User Information"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Surface style={styles.profileHeader} elevation={2}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={getInitials(user?.name || 'U')}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            />
          </View>
          
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user?.name || 'Unknown User'}</Title>
            <Paragraph style={styles.userEmail}>{user?.email || 'No email'}</Paragraph>
            
            <View style={styles.roleContainer}>
              <Chip
                mode="outlined"
                style={[styles.roleChip, { borderColor: getRoleColor(user?.role || 'user') }]}
                textStyle={[styles.roleChipText, { color: getRoleColor(user?.role || 'user') }]}
              >
                {user?.role?.toUpperCase() || 'USER'}
              </Chip>
              
              {user?.isEmailVerified && (
                <Chip
                  mode="outlined"
                  style={[styles.statusChip, { borderColor: theme.colors.primary }]}
                  textStyle={[styles.statusChipText, { color: theme.colors.primary }]}
                  icon="check-circle"
                >
                  Verified
                </Chip>
              )}
            </View>
          </View>
        </Surface>

        {/* Account Information */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Account Information</Title>
          
          <List.Item
            title="User ID"
            description={user?.id || 'N/A'}
            left={(props) => <List.Icon {...props} icon="identifier" />}
          />
          
          <List.Item
            title="Phone"
            description={user?.phone || 'Not provided'}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          
          <List.Item
            title="Account Status"
            description={user?.isActive ? 'Active' : 'Inactive'}
            left={(props) => <List.Icon {...props} icon="account-check" />}
            right={() => (
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.statusChip,
                  { borderColor: user?.isActive ? theme.colors.primary : theme.colors.error }
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: user?.isActive ? theme.colors.primary : theme.colors.error }
                ]}
              >
                {user?.isActive ? 'Active' : 'Inactive'}
              </Chip>
            )}
          />
          
          <List.Item
            title="Member Since"
            description={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
        </Surface>

        {/* Company Access */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Company Access</Title>
          
          <List.Item
            title="Companies"
            description={`Access to ${user?.companies?.length || 0} companies`}
            left={(props) => <List.Icon {...props} icon="office-building" />}
            onPress={() => navigation.navigate('CompanySelection')}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Security */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Security</Title>
          
          <List.Item
            title="Email Verification"
            description={user?.isEmailVerified ? 'Verified' : 'Not verified'}
            left={(props) => <List.Icon {...props} icon="email-check" />}
            right={() => (
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.statusChip,
                  { borderColor: user?.isEmailVerified ? theme.colors.primary : theme.colors.error }
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: user?.isEmailVerified ? theme.colors.primary : theme.colors.error }
                ]}
              >
                {user?.isEmailVerified ? 'Verified' : 'Unverified'}
              </Chip>
            )}
          />
          
          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            onPress={() => {
              // TODO: Navigate to change password screen
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <List.Item
            title="Two-Factor Authentication"
            description="Enable 2FA for extra security"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            onPress={() => {
              // TODO: Navigate to 2FA setup
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

        {/* Activity */}
        <Surface style={styles.section} elevation={2}>
          <Title style={styles.sectionTitle}>Activity</Title>
          
          <List.Item
            title="Last Updated"
            description={user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
            left={(props) => <List.Icon {...props} icon="clock" />}
          />
          
          <List.Item
            title="Login History"
            description="View recent login activity"
            left={(props) => <List.Icon {...props} icon="history" />}
            onPress={() => {
              // TODO: Navigate to login history
            }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </Surface>

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
  profileHeader: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    marginBottom: 8,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    height: 28,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
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
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;
