import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom color palette
const colors = {
  primary: '#2563eb',
  primaryContainer: '#dbeafe',
  secondary: '#7c3aed',
  secondaryContainer: '#ede9fe',
  tertiary: '#059669',
  tertiaryContainer: '#d1fae5',
  surface: '#ffffff',
  surfaceVariant: '#f8fafc',
  background: '#f8fafc',
  error: '#dc2626',
  errorContainer: '#fef2f2',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#1e40af',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#5b21b6',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#047857',
  onSurface: '#1f2937',
  onSurfaceVariant: '#6b7280',
  onBackground: '#1f2937',
  onError: '#ffffff',
  onErrorContainer: '#b91c1c',
  outline: '#d1d5db',
  outlineVariant: '#e5e7eb',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#374151',
  inverseOnSurface: '#f9fafb',
  inversePrimary: '#60a5fa',
  elevation: {
    level0: 'transparent',
    level1: '#ffffff',
    level2: '#f8fafc',
    level3: '#f1f5f9',
    level4: '#e2e8f0',
    level5: '#cbd5e1',
  },
};

const darkColors = {
  primary: '#60a5fa',
  primaryContainer: '#1e40af',
  secondary: '#a78bfa',
  secondaryContainer: '#5b21b6',
  tertiary: '#34d399',
  tertiaryContainer: '#047857',
  surface: '#1f2937',
  surfaceVariant: '#374151',
  background: '#111827',
  error: '#f87171',
  errorContainer: '#b91c1c',
  onPrimary: '#1e40af',
  onPrimaryContainer: '#dbeafe',
  onSecondary: '#5b21b6',
  onSecondaryContainer: '#ede9fe',
  onTertiary: '#047857',
  onTertiaryContainer: '#d1fae5',
  onSurface: '#f9fafb',
  onSurfaceVariant: '#d1d5db',
  onBackground: '#f9fafb',
  onError: '#b91c1c',
  onErrorContainer: '#fef2f2',
  outline: '#6b7280',
  outlineVariant: '#4b5563',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#f9fafb',
  inverseOnSurface: '#374151',
  inversePrimary: '#2563eb',
  elevation: {
    level0: 'transparent',
    level1: '#374151',
    level2: '#4b5563',
    level3: '#6b7280',
    level4: '#9ca3af',
    level5: '#d1d5db',
  },
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      ...MD3LightTheme.fonts.displayLarge,
      fontFamily: 'System',
    },
    displayMedium: {
      ...MD3LightTheme.fonts.displayMedium,
      fontFamily: 'System',
    },
    displaySmall: {
      ...MD3LightTheme.fonts.displaySmall,
      fontFamily: 'System',
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontFamily: 'System',
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontFamily: 'System',
    },
    headlineSmall: {
      ...MD3LightTheme.fonts.headlineSmall,
      fontFamily: 'System',
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    titleSmall: {
      ...MD3LightTheme.fonts.titleSmall,
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontFamily: 'System',
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontFamily: 'System',
    },
    bodySmall: {
      ...MD3LightTheme.fonts.bodySmall,
      fontFamily: 'System',
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    labelMedium: {
      ...MD3LightTheme.fonts.labelMedium,
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    labelSmall: {
      ...MD3LightTheme.fonts.labelSmall,
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  fonts: lightTheme.fonts,
};

// Default theme (light)
export const theme = lightTheme;

// Theme type
export type Theme = typeof lightTheme;
