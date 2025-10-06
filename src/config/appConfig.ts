/**
 * Platform-Specific App Configuration
 * Handles different configurations for web, Android, and iOS platforms
 */

import { getPlatformConfig } from '@/utils/Platform';
import { getEnvConfig } from '@/config/environment';

export interface PlatformAppConfig {
  name: string;
  version: string;
  buildNumber: string;
  bundleId: string;
  displayName: string;
  description: string;
  orientation: 'portrait' | 'landscape' | 'default';
  theme: {
    primaryColor: string;
    backgroundColor: string;
    statusBarStyle: 'light' | 'dark' | 'auto';
  };
  features: {
    camera: boolean;
    biometrics: boolean;
    push: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  performance: {
    enableHermes: boolean;
    enableProguard: boolean;
    enableShrinking: boolean;
  };
}

/**
 * Web-specific configuration
 */
const webConfig: Partial<PlatformAppConfig> = {
  displayName: 'DocsShelf Web',
  description: 'DocsShelf Document Management - Web Application',
  orientation: 'default',
  theme: {
    primaryColor: '#007AFF',
    backgroundColor: '#ffffff',
    statusBarStyle: 'dark',
  },
  features: {
    camera: false, // Web camera API available but different implementation
    biometrics: false, // WebAuthn can be implemented later
    push: true, // Web Push API
    analytics: true,
    crashReporting: true,
  },
  performance: {
    enableHermes: false,
    enableProguard: false,
    enableShrinking: true, // Web bundling optimization
  },
};

/**
 * iOS-specific configuration
 */
const iosConfig: Partial<PlatformAppConfig> = {
  displayName: 'DocsShelf',
  description: 'DocsShelf Document Management - iOS Application',
  orientation: 'portrait',
  bundleId: 'com.docsshelf.v4.ios',
  theme: {
    primaryColor: '#007AFF',
    backgroundColor: '#ffffff',
    statusBarStyle: 'dark',
  },
  features: {
    camera: true,
    biometrics: true, // Face ID, Touch ID
    push: true, // APNs
    analytics: true,
    crashReporting: true,
  },
  performance: {
    enableHermes: true,
    enableProguard: false,
    enableShrinking: false,
  },
};

/**
 * Android-specific configuration
 */
const androidConfig: Partial<PlatformAppConfig> = {
  displayName: 'DocsShelf',
  description: 'DocsShelf Document Management - Android Application',
  orientation: 'portrait',
  bundleId: 'com.docsshelf.v4.android',
  theme: {
    primaryColor: '#1976D2', // Material Design primary
    backgroundColor: '#ffffff',
    statusBarStyle: 'dark',
  },
  features: {
    camera: true,
    biometrics: true, // Fingerprint, Face unlock
    push: true, // FCM
    analytics: true,
    crashReporting: true,
  },
  performance: {
    enableHermes: true,
    enableProguard: true,
    enableShrinking: true,
  },
};

/**
 * Base configuration shared across platforms
 */
const baseConfig: PlatformAppConfig = {
  name: 'docsshelf-v4',
  version: '1.0.0',
  buildNumber: '1',
  bundleId: 'com.docsshelf.v4',
  displayName: 'DocsShelf v4',
  description: 'DocsShelf Document Management Application',
  orientation: 'portrait',
  theme: {
    primaryColor: '#007AFF',
    backgroundColor: '#ffffff',
    statusBarStyle: 'dark',
  },
  features: {
    camera: true,
    biometrics: true,
    push: true,
    analytics: true,
    crashReporting: true,
  },
  performance: {
    enableHermes: true,
    enableProguard: true,
    enableShrinking: true,
  },
};

/**
 * Get platform-specific app configuration
 */
export const getAppConfig = (): PlatformAppConfig => {
  const platformConfig = getPlatformConfig();
  const envConfig = getEnvConfig();
  
  let platformSpecificConfig: Partial<PlatformAppConfig> = {};
  
  if (platformConfig.isWeb) {
    platformSpecificConfig = webConfig;
  } else if (platformConfig.isIOS) {
    platformSpecificConfig = iosConfig;
  } else if (platformConfig.isAndroid) {
    platformSpecificConfig = androidConfig;
  }
  
  // Merge base config with platform-specific config
  const mergedConfig = {
    ...baseConfig,
    ...platformSpecificConfig,
    features: {
      ...baseConfig.features,
      ...platformSpecificConfig.features,
      // Override with environment config
      analytics: envConfig.analytics,
      crashReporting: envConfig.crashReporting,
    },
  };
  
  return mergedConfig;
};

/**
 * Get build-specific configuration
 */
export const getBuildConfig = () => {
  const appConfig = getAppConfig();
  const envConfig = getEnvConfig();
  const platformConfig = getPlatformConfig();
  
  return {
    app: appConfig,
    env: envConfig,
    platform: platformConfig,
    buildId: `${appConfig.version}-${appConfig.buildNumber}-${envConfig.environment}`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Platform-specific asset paths
 */
export const getAssetPaths = () => {
  const platformConfig = getPlatformConfig();
  
  return {
    icons: {
      small: platformConfig.isWeb ? '/favicon-16x16.png' : undefined,
      medium: platformConfig.isWeb ? '/favicon-32x32.png' : undefined,
      large: platformConfig.isWeb ? '/android-chrome-192x192.png' : undefined,
      apple: platformConfig.isIOS ? '/apple-touch-icon.png' : undefined,
    },
    splash: {
      portrait: platformConfig.isNative ? '/splash-portrait.png' : undefined,
      landscape: platformConfig.isNative ? '/splash-landscape.png' : undefined,
    },
  };
};

export default getAppConfig;