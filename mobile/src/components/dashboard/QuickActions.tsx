import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';

interface QuickActionsProps {
  onActionPress: (action: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'create_voucher',
    label: 'New Voucher',
    icon: 'plus',
  },
  {
    id: 'create_item',
    label: 'Add Item',
    icon: 'package-variant-plus',
  },
  {
    id: 'sync',
    label: 'Sync Now',
    icon: 'sync',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart-line',
  },
];

const QuickActions: React.FC<QuickActionsProps> = ({ onActionPress }) => {
  const theme = useTheme();

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Text
        variant="titleMedium"
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        Quick Actions
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
      >
        {quickActions.map((action) => (
          <Button
            key={action.id}
            mode="outlined"
            onPress={() => onActionPress(action.id)}
            icon={action.icon}
            style={[
              styles.actionButton,
              { borderColor: theme.colors.outline }
            ]}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.actionButtonLabel}
          >
            {action.label}
          </Button>
        ))}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
    paddingRight: 16,
  },
  actionButton: {
    minWidth: 120,
  },
  actionButtonContent: {
    height: 48,
    flexDirection: 'column',
  },
  actionButtonLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default QuickActions;
