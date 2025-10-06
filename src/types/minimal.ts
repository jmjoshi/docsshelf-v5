/**
 * Minimal types for testing compilation
 */

export interface PhoneNumber {
  id: string;
  type: 'mobile' | 'home' | 'work';
  number: string;
  verified: boolean;
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  addedAt: string;
  lastUsed: string;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  biometricType: BiometricType | null;
  totpEnabled: boolean;
  smsEnabled: boolean;
  trustedDevices: TrustedDevice[];
  sessionTimeout: number;
  autoLockEnabled: boolean;
  autoLockTime: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: PhoneNumber[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

export type BiometricType = 'fingerprint' | 'faceId' | 'voice' | 'iris';

export interface EncryptionKey {
  id: string;
  keyData: string;
  algorithm: 'AES-256-CBC';
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}