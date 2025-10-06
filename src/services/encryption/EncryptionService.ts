/**
 * Encryption and Key Management Service
 * Handles AES-256-CBC encryption, key generation, storage, and rotation
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import type { EncryptionKey } from '../../types/minimal';

// Storage keys for encryption management
const ENCRYPTION_STORAGE_KEYS = {
  MASTER_KEY: 'master_encryption_key',
  ACTIVE_KEYS: 'active_encryption_keys',
  KEY_METADATA: 'encryption_key_metadata',
  KEY_ROTATION_LOG: 'key_rotation_log',
  DATA_INDEX: 'encrypted_data_index',
} as const;

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  keyId: string;
  algorithm: 'AES-256-CBC';
  timestamp: string;
  checksum: string;
}

export interface KeyRotationLog {
  id: string;
  oldKeyId: string;
  newKeyId: string;
  timestamp: string;
  reason: 'scheduled' | 'manual' | 'compromise' | 'expiry';
  affectedDataCount: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface EncryptionMetrics {
  totalKeysGenerated: number;
  activeKeys: number;
  lastRotation: string;
  nextScheduledRotation: string;
  encryptedDataCount: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
}

class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: string | null = null;
  private activeKeys: Map<string, EncryptionKey> = new Map();
  private keyRotationInProgress = false;

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize the encryption service with master key
   */
  async initialize(userPassword?: string): Promise<void> {
    try {
      // Try to retrieve existing master key
      this.masterKey = await SecureStore.getItemAsync(ENCRYPTION_STORAGE_KEYS.MASTER_KEY);
      
      if (!this.masterKey) {
        // Generate new master key if none exists
        this.masterKey = await this.generateMasterKey(userPassword);
        await SecureStore.setItemAsync(
          ENCRYPTION_STORAGE_KEYS.MASTER_KEY,
          this.masterKey,
          {
            requireAuthentication: true,
          }
        );
      }

      // Load active encryption keys
      await this.loadActiveKeys();
      
      // Ensure we have at least one active key
      if (this.activeKeys.size === 0) {
        await this.generateNewEncryptionKey();
      }

      // Schedule key rotation check
      this.scheduleKeyRotationCheck();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption service initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Generate master key using PBKDF2 with user password or device-based entropy
   */
  private async generateMasterKey(userPassword?: string): Promise<string> {
    try {
      let keyMaterial: string;
      
      if (userPassword) {
        // Use user password as key material
        keyMaterial = userPassword;
      } else {
        // Generate device-based entropy
        const deviceEntropy = await this.generateDeviceEntropy();
        keyMaterial = deviceEntropy;
      }

      // Generate salt
      const salt = CryptoJS.lib.WordArray.random(256/8);
      
      // Derive master key using PBKDF2
      const masterKey = CryptoJS.PBKDF2(keyMaterial, salt, {
        keySize: 256/32,
        iterations: 100000, // High iteration count for security
        hasher: CryptoJS.algo.SHA256,
      });

      return masterKey.toString(CryptoJS.enc.Base64);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Master key generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate device-specific entropy for master key
   */
  private async generateDeviceEntropy(): Promise<string> {
    try {
      // Combine multiple sources of entropy
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const timestamp = Date.now().toString();
      const platform = Platform.OS;
      
      // Create device fingerprint (in production, use more device-specific data)
      const deviceData = `${platform}-${timestamp}`;
      
      // Combine entropy sources
      const combinedEntropy = CryptoJS.SHA256(
        randomBytes.join('') + deviceData
      ).toString(CryptoJS.enc.Base64);

      return combinedEntropy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Device entropy generation failed: ${errorMessage}`);
    }
  }

  // ==================== KEY MANAGEMENT ====================

  /**
   * Generate a new encryption key
   */
  async generateNewEncryptionKey(setAsActive: boolean = true): Promise<EncryptionKey> {
    try {
      const keyId = await this.generateUniqueKeyId();
      const keyData = CryptoJS.lib.WordArray.random(256/8);
      
      const encryptionKey: EncryptionKey = {
        id: keyId,
        keyData: keyData.toString(CryptoJS.enc.Base64),
        algorithm: 'AES-256-CBC',
        createdAt: new Date().toISOString(),
        expiresAt: this.calculateKeyExpiry(),
        isActive: setAsActive,
      };

      // Encrypt key data with master key before storage
      const encryptedKeyData = await this.encryptWithMasterKey(encryptionKey.keyData);
      
      // Store encrypted key
      await SecureStore.setItemAsync(
        `encryption_key_${keyId}`,
        JSON.stringify({
          ...encryptionKey,
          keyData: encryptedKeyData,
        }),
        {
          requireAuthentication: true,
        }
      );

      // Add to active keys if requested
      if (setAsActive) {
        this.activeKeys.set(keyId, encryptionKey);
        await this.updateActiveKeysList();
      }

      return encryptionKey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Key generation failed: ${errorMessage}`);
    }
  }

  /**
   * Load active encryption keys from storage
   */
  private async loadActiveKeys(): Promise<void> {
    try {
      const activeKeyIds = await SecureStore.getItemAsync(ENCRYPTION_STORAGE_KEYS.ACTIVE_KEYS);
      
      if (activeKeyIds) {
        const keyIds = JSON.parse(activeKeyIds);
        
        for (const keyId of keyIds) {
          try {
            const encryptedKeyData = await SecureStore.getItemAsync(`encryption_key_${keyId}`);
            
            if (encryptedKeyData) {
              const keyInfo = JSON.parse(encryptedKeyData);
              
              // Decrypt key data
              const decryptedKeyData = await this.decryptWithMasterKey(keyInfo.keyData);
              
              const encryptionKey: EncryptionKey = {
                ...keyInfo,
                keyData: decryptedKeyData,
              };

              this.activeKeys.set(keyId, encryptionKey);
            }
          } catch (error) {
            console.warn(`Failed to load encryption key ${keyId}:`, error);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load active keys: ${errorMessage}`);
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(reason: KeyRotationLog['reason'] = 'scheduled'): Promise<void> {
    if (this.keyRotationInProgress) {
      throw new Error('Key rotation already in progress');
    }

    try {
      this.keyRotationInProgress = true;
      
      const rotationId = await this.generateUniqueKeyId();
      const oldKeys = Array.from(this.activeKeys.values());
      
      // Create rotation log entry
      const rotationLog: KeyRotationLog = {
        id: rotationId,
        oldKeyId: oldKeys.length > 0 ? oldKeys[0].id : 'none',
        newKeyId: 'pending',
        timestamp: new Date().toISOString(),
        reason,
        affectedDataCount: await this.getEncryptedDataCount(),
        status: 'in-progress',
      };

      await this.saveRotationLog(rotationLog);

      // Generate new encryption key
      const newKey = await this.generateNewEncryptionKey(true);
      rotationLog.newKeyId = newKey.id;

      // Mark old keys as inactive (but don't delete them yet)
      for (const oldKey of oldKeys) {
        oldKey.isActive = false;
        await this.updateStoredKey(oldKey);
      }

      // Update rotation log
      rotationLog.status = 'completed';
      await this.saveRotationLog(rotationLog);

      // Schedule cleanup of old encrypted data (re-encryption)
      this.scheduleDataReEncryption(oldKeys.map(k => k.id), newKey.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Key rotation failed: ${errorMessage}`);
    } finally {
      this.keyRotationInProgress = false;
    }
  }

  // ==================== ENCRYPTION/DECRYPTION ====================

  /**
   * Encrypt data with the current active key
   */
  async encryptData(data: string, keyId?: string): Promise<EncryptedData> {
    const startTime = Date.now();
    
    try {
      // Get encryption key
      const encryptionKey = keyId 
        ? this.activeKeys.get(keyId)
        : this.getCurrentActiveKey();

      if (!encryptionKey) {
        throw new Error('No active encryption key available');
      }

      // Generate initialization vector
      const iv = CryptoJS.lib.WordArray.random(128/8); // 16 bytes for CBC
      
      // Parse key data
      const key = CryptoJS.enc.Base64.parse(encryptionKey.keyData);
      
      // Encrypt data using AES-256-CBC
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Generate checksum for integrity verification
      const checksum = CryptoJS.SHA256(data + encryptionKey.id).toString(CryptoJS.enc.Hex);

      const result: EncryptedData = {
        data: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        tag: '',  // CBC mode doesn't use authentication tags
        keyId: encryptionKey.id,
        algorithm: 'AES-256-CBC' as const,
        timestamp: new Date().toISOString(),
        checksum,
      };

      // Update encryption metrics
      const encryptionTime = Date.now() - startTime;
      await this.updateEncryptionMetrics('encrypt', encryptionTime);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Data encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Decrypt data using the specified key
   */
  async decryptData(encryptedData: EncryptedData): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get decryption key
      const encryptionKey = this.activeKeys.get(encryptedData.keyId) || 
                           await this.loadKeyById(encryptedData.keyId);

      if (!encryptionKey) {
        throw new Error(`Encryption key not found: ${encryptedData.keyId}`);
      }

      // Parse components
      const key = CryptoJS.enc.Base64.parse(encryptionKey.keyData);
      const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
      const tag = CryptoJS.enc.Base64.parse(encryptedData.tag);
      const ciphertext = CryptoJS.enc.Base64.parse(encryptedData.data);

      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(
        ciphertext.toString(CryptoJS.enc.Base64),
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        throw new Error('Decryption failed - invalid data or key');
      }

      // Verify integrity using checksum
      const expectedChecksum = CryptoJS.SHA256(decryptedText + encryptedData.keyId).toString(CryptoJS.enc.Hex);
      
      if (expectedChecksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed');
      }

      // Update decryption metrics
      const decryptionTime = Date.now() - startTime;
      await this.updateEncryptionMetrics('decrypt', decryptionTime);

      return decryptedText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Data decryption failed: ${errorMessage}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get current active encryption key
   */
  private getCurrentActiveKey(): EncryptionKey | null {
    for (const key of this.activeKeys.values()) {
      if (key.isActive && new Date(key.expiresAt) > new Date()) {
        return key;
      }
    }
    return null;
  }

  /**
   * Generate unique key ID
   */
  private async generateUniqueKeyId(): Promise<string> {
    const randomBytes = CryptoJS.lib.WordArray.random(16);
    const timestamp = Date.now().toString(36);
    return `key_${timestamp}_${randomBytes.toString(CryptoJS.enc.Hex).substring(0, 8)}`;
  }

  /**
   * Calculate key expiry date (90 days from creation)
   */
  private calculateKeyExpiry(): string {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // 90 days
    return expiryDate.toISOString();
  }

  /**
   * Encrypt data with master key
   */
  private async encryptWithMasterKey(data: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const iv = CryptoJS.lib.WordArray.random(128/8);
    const key = CryptoJS.enc.Base64.parse(this.masterKey);
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return JSON.stringify({
      data: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Base64),
    });
  }

  /**
   * Decrypt data with master key
   */
  private async decryptWithMasterKey(encryptedData: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const { data, iv } = JSON.parse(encryptedData);
    const key = CryptoJS.enc.Base64.parse(this.masterKey);

    const decrypted = CryptoJS.AES.decrypt(
      data,
      key,
      {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Update active keys list in storage
   */
  private async updateActiveKeysList(): Promise<void> {
    const activeKeyIds = Array.from(this.activeKeys.keys());
    await SecureStore.setItemAsync(
      ENCRYPTION_STORAGE_KEYS.ACTIVE_KEYS,
      JSON.stringify(activeKeyIds)
    );
  }

  /**
   * Update stored key information
   */
  private async updateStoredKey(key: EncryptionKey): Promise<void> {
    const encryptedKeyData = await this.encryptWithMasterKey(key.keyData);
    
    await SecureStore.setItemAsync(
      `encryption_key_${key.id}`,
      JSON.stringify({
        ...key,
        keyData: encryptedKeyData,
      }),
      {
        requireAuthentication: true,
      }
    );
  }

  /**
   * Load encryption key by ID
   */
  private async loadKeyById(keyId: string): Promise<EncryptionKey | null> {
    try {
      const encryptedKeyData = await SecureStore.getItemAsync(`encryption_key_${keyId}`);
      
      if (encryptedKeyData) {
        const keyInfo = JSON.parse(encryptedKeyData);
        const decryptedKeyData = await this.decryptWithMasterKey(keyInfo.keyData);
        
        return {
          ...keyInfo,
          keyData: decryptedKeyData,
        };
      }
      
      return null;
    } catch (error) {
      console.warn(`Failed to load key ${keyId}:`, error);
      return null;
    }
  }

  /**
   * Schedule key rotation check
   */
  private scheduleKeyRotationCheck(): void {
    // Check for key rotation every 24 hours
    setInterval(() => {
      this.checkAndRotateKeys();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Check if keys need rotation and perform if necessary
   */
  private async checkAndRotateKeys(): Promise<void> {
    try {
      const currentKey = this.getCurrentActiveKey();
      
      if (!currentKey) {
        await this.rotateKeys('expiry');
        return;
      }

      // Check if key is near expiry (7 days before)
      const expiryDate = new Date(currentKey.expiresAt);
      const warningDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (new Date() > warningDate) {
        await this.rotateKeys('scheduled');
      }
    } catch (error) {
      console.error('Key rotation check failed:', error);
    }
  }

  // Additional helper methods for metrics, logging, etc.
  private async saveRotationLog(log: KeyRotationLog): Promise<void> {
    const logs = await SecureStore.getItemAsync('key_rotation_logs') || '[]';
    const rotationLogs = JSON.parse(logs);
    rotationLogs.push(log);
    await SecureStore.setItemAsync('key_rotation_logs', JSON.stringify(rotationLogs));
  }

  private async getEncryptedDataCount(): Promise<number> {
    // Implementation for counting encrypted data entries
    return 0;
  }

  private async updateEncryptionMetrics(operation: 'encrypt' | 'decrypt', time: number): Promise<void> {
    const metrics = await SecureStore.getItemAsync('encryption_metrics') || '{}';
    const metricsData = JSON.parse(metrics);
    metricsData[operation] = metricsData[operation] || [];
    metricsData[operation].push({ time, timestamp: new Date().toISOString() });
    await SecureStore.setItemAsync('encryption_metrics', JSON.stringify(metricsData));
  }

  private scheduleDataReEncryption(oldKeyIds: string[], newKeyId: string): void {
    // Implementation for scheduling background re-encryption of data
  }
}

export default EncryptionService.getInstance();