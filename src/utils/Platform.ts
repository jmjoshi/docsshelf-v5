/**
 * Platform Detection and Configuration Utilities
 * Handles platform-specific logic and component loading per technical requirements
 */

import { Platform } from 'react-native';

export interface PlatformConfig {
  isWeb: boolean;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasCamera: boolean;
  hasBiometrics: boolean;
  hasFileSystem: boolean;
  hasNFC: boolean;
}

/**
 * Get current platform configuration
 * Used to conditionally load platform-specific components
 */
export const getPlatformConfig = (): PlatformConfig => {
  const isWeb = Platform.OS === 'web';
  const isNative = Platform.OS !== 'web';
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  return {
    isWeb,
    isNative,
    isIOS,
    isAndroid,
    hasCamera: isNative, // Native platforms have camera access
    hasBiometrics: isNative, // Biometrics available on native platforms
    hasFileSystem: true, // All platforms support file operations (different implementations)
    hasNFC: isAndroid, // NFC primarily available on Android
  };
};

/**
 * Platform-specific component loader
 * Ensures only required components are bundled for each platform
 */
export const loadPlatformComponent = <T>(components: {
  web?: T;
  native?: T;
  ios?: T;
  android?: T;
  default: T;
}): T => {
  const config = getPlatformConfig();

  if (config.isWeb && components.web) {
    return components.web;
  }
  
  if (config.isIOS && components.ios) {
    return components.ios;
  }
  
  if (config.isAndroid && components.android) {
    return components.android;
  }
  
  if (config.isNative && components.native) {
    return components.native;
  }

  return components.default;
};

/**
 * Platform-specific feature availability check
 */
export const isFeatureAvailable = (feature: keyof Omit<PlatformConfig, 'isWeb' | 'isNative' | 'isIOS' | 'isAndroid'>): boolean => {
  const config = getPlatformConfig();
  return config[feature];
};

/**
 * Get platform-specific styles
 */
export const getPlatformStyles = <T>(styles: {
  web?: T;
  native?: T;
  ios?: T;
  android?: T;
  default: T;
}): T => {
  return loadPlatformComponent(styles);
};

/**
 * Platform-specific navigation configuration
 */
export const getPlatformNavigation = () => {
  const config = getPlatformConfig();
  
  return {
    headerMode: config.isWeb ? 'float' : 'screen',
    cardStyle: config.isWeb ? { backgroundColor: '#f5f5f5' } : { backgroundColor: '#ffffff' },
    animationEnabled: !config.isWeb,
    gestureEnabled: config.isNative,
  };
};