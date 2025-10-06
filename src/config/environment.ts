/**
 * Environment Configuration
 * Supports dev, qa, and production environments per technical requirements
 */

export type Environment = 'development' | 'qa' | 'production';

export interface EnvConfig {
  environment: Environment;
  apiUrl: string;
  debugMode: boolean;
  analytics: boolean;
  crashReporting: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  encryptionLevel: 'standard' | 'high';
  offlineMode: boolean;
  maxFileSize: number; // in MB
  supportedFormats: string[];
  biometricAuth: boolean;
  cloudSync: boolean;
}

// Development environment configuration
const developmentConfig: EnvConfig = {
  environment: 'development',
  apiUrl: 'http://localhost:3000/api',
  debugMode: true,
  analytics: false,
  crashReporting: false,
  logLevel: 'debug',
  encryptionLevel: 'standard',
  offlineMode: true,
  maxFileSize: 50, // 50MB for testing
  supportedFormats: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
  biometricAuth: false, // Disabled for easier testing
  cloudSync: false,
};

// QA environment configuration
const qaConfig: EnvConfig = {
  environment: 'qa',
  apiUrl: 'https://qa-api.docsshelf.com/api',
  debugMode: true,
  analytics: true,
  crashReporting: true,
  logLevel: 'info',
  encryptionLevel: 'high',
  offlineMode: true,
  maxFileSize: 25, // 25MB
  supportedFormats: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'tiff'],
  biometricAuth: true,
  cloudSync: false, // Disabled in QA for controlled testing
};

// Production environment configuration
const productionConfig: EnvConfig = {
  environment: 'production',
  apiUrl: 'https://api.docsshelf.com/api',
  debugMode: false,
  analytics: true,
  crashReporting: true,
  logLevel: 'error',
  encryptionLevel: 'high',
  offlineMode: true,
  maxFileSize: 20, // 20MB production limit
  supportedFormats: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'tiff', 'rtf'],
  biometricAuth: true,
  cloudSync: true, // Available in production
};

/**
 * Get current environment from build configuration
 */
const getCurrentEnvironment = (): Environment => {
  // This would typically come from build-time environment variables
  // For now, defaulting to development
  if (__DEV__) {
    return 'development';
  }
  
  // In a real app, this would be set during build process
  const buildEnv = process.env.NODE_ENV;
  
  switch (buildEnv) {
    case 'production':
      return 'production';
    case 'qa':
    case 'staging':
      return 'qa';
    default:
      return 'development';
  }
};

/**
 * Get configuration for current environment
 */
export const getEnvConfig = (): EnvConfig => {
  const environment = getCurrentEnvironment();
  
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'qa':
      return qaConfig;
    default:
      return developmentConfig;
  }
};

/**
 * Check if feature is enabled in current environment
 */
export const isFeatureEnabled = (feature: keyof Omit<EnvConfig, 'environment'>): boolean => {
  const config = getEnvConfig();
  return Boolean(config[feature]);
};

/**
 * Get environment-specific file size limit
 */
export const getMaxFileSize = (): number => {
  return getEnvConfig().maxFileSize;
};

/**
 * Get supported file formats for current environment
 */
export const getSupportedFormats = (): string[] => {
  return getEnvConfig().supportedFormats;
};

/**
 * Environment-specific logging function
 */
export const envLog = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
  const config = getEnvConfig();
  const logLevels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = logLevels.indexOf(config.logLevel);
  const messageLevelIndex = logLevels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    console[level](`[${config.environment.toUpperCase()}] ${message}`, data || '');
  }
};

export default getEnvConfig;