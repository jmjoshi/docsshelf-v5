import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// DocsShelf brand colors
const brandColors = {
  primary: '#1976D2',      // Blue - primary brand color
  secondary: '#424242',    // Dark gray - secondary
  accent: '#FF6F00',       // Orange - accent color
  success: '#4CAF50',      // Green - success states
  warning: '#FF9800',      // Orange - warnings
  error: '#F44336',        // Red - errors
  info: '#2196F3',         // Light blue - info
  surface: '#FFFFFF',      // White - surfaces
  background: '#F5F5F5',   // Light gray - background
  text: '#212121',         // Dark gray - primary text
  textSecondary: '#757575', // Medium gray - secondary text
};

// Light theme configuration
export const lightTheme = {
  ...MD3LightTheme,
  ...NavigationLightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...NavigationLightTheme.colors,
    primary: brandColors.primary,
    primaryContainer: '#E3F2FD',
    secondary: brandColors.secondary,
    secondaryContainer: '#F5F5F5',
    tertiary: brandColors.accent,
    tertiaryContainer: '#FFF3E0',
    surface: brandColors.surface,
    surfaceVariant: '#F8F8F8',
    background: brandColors.background,
    error: brandColors.error,
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: brandColors.text,
    onSurfaceVariant: brandColors.textSecondary,
    onBackground: brandColors.text,
    onError: '#FFFFFF',
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',
    inverseSurface: '#121212',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#90CAF9',
    shadow: '#000000',
    scrim: '#000000',
    // Custom colors
    success: brandColors.success,
    warning: brandColors.warning,
    info: brandColors.info,
  },
};

// Dark theme configuration
export const darkTheme = {
  ...MD3DarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...NavigationDarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    secondary: '#BDBDBD',
    secondaryContainer: '#424242',
    tertiary: '#FFB74D',
    tertiaryContainer: '#E65100',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    background: '#121212',
    error: '#F44336',
    errorContainer: '#B71C1C',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onTertiary: '#000000',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#BDBDBD',
    onBackground: '#FFFFFF',
    onError: '#FFFFFF',
    outline: '#424242',
    outlineVariant: '#2D2D2D',
    inverseSurface: '#F5F5F5',
    inverseOnSurface: '#121212',
    inversePrimary: brandColors.primary,
    shadow: '#000000',
    scrim: '#000000',
    // Custom colors
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
  },
};

// Typography configuration
export const typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};

// Spacing configuration
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius configuration
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow configuration
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5.84,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10.32,
    elevation: 8,
  },
};