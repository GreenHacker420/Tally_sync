import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import {
  ActivityIndicator,
  Text,
  Surface,
  useTheme,
} from 'react-native-paper';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
  size = 'large',
  color,
}) => {
  const theme = useTheme();
  const indicatorColor = color || theme.colors.primary;

  if (!visible) return null;

  return (
    <Modal
      transparent={transparent}
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator
            size={size}
            color={indicatorColor}
            style={styles.indicator}
          />
          {message && (
            <Text style={[styles.message, { color: theme.colors.onSurface }]}>
              {message}
            </Text>
          )}
        </Surface>
      </View>
    </Modal>
  );
};

// Inline loading component for use within screens
export const InlineLoading: React.FC<{
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}> = ({
  visible,
  message = 'Loading...',
  size = 'large',
  color,
  style,
}) => {
  const theme = useTheme();
  const indicatorColor = color || theme.colors.primary;

  if (!visible) return null;

  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator
        size={size}
        color={indicatorColor}
        style={styles.inlineIndicator}
      />
      {message && (
        <Text style={[styles.inlineMessage, { color: theme.colors.onSurface }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// Skeleton loading component
export const SkeletonLoader: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
        },
        style,
      ]}
    />
  );
};

// Card skeleton for list items
export const CardSkeleton: React.FC<{
  showAvatar?: boolean;
  lines?: number;
  style?: any;
}> = ({
  showAvatar = false,
  lines = 3,
  style,
}) => {
  return (
    <Surface style={[styles.cardSkeleton, style]}>
      <View style={styles.cardSkeletonContent}>
        {showAvatar && (
          <SkeletonLoader
            width={40}
            height={40}
            borderRadius={20}
            style={styles.avatarSkeleton}
          />
        )}
        <View style={styles.textSkeleton}>
          <SkeletonLoader height={16} style={styles.titleSkeleton} />
          {Array.from({ length: lines - 1 }).map((_, index) => (
            <SkeletonLoader
              key={index}
              height={12}
              width={`${Math.random() * 40 + 60}%`}
              style={styles.lineSkeleton}
            />
          ))}
        </View>
      </View>
    </Surface>
  );
};

// List skeleton
export const ListSkeleton: React.FC<{
  itemCount?: number;
  showAvatar?: boolean;
  lines?: number;
}> = ({
  itemCount = 5,
  showAvatar = false,
  lines = 3,
}) => {
  return (
    <View>
      {Array.from({ length: itemCount }).map((_, index) => (
        <CardSkeleton
          key={index}
          showAvatar={showAvatar}
          lines={lines}
          style={styles.listSkeletonItem}
        />
      ))}
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  inlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inlineIndicator: {
    marginBottom: 12,
  },
  inlineMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  skeleton: {
    opacity: 0.7,
  },
  cardSkeleton: {
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  cardSkeletonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSkeleton: {
    marginRight: 12,
  },
  textSkeleton: {
    flex: 1,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  lineSkeleton: {
    marginBottom: 6,
  },
  listSkeletonItem: {
    marginBottom: 8,
  },
});

export default LoadingOverlay;
