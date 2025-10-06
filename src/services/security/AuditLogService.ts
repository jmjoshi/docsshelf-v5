/**
 * Security Audit Logging Service
 * Comprehensive logging for security events, user actions, and system activities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import EncryptionService from '../encryption/EncryptionService';

// Storage keys for audit logging
const AUDIT_STORAGE_KEYS = {
  SECURITY_LOGS: 'security_audit_logs',
  USER_ACTIVITY_LOGS: 'user_activity_logs',
  SYSTEM_LOGS: 'system_logs',
  LOG_ENCRYPTION_KEY: 'log_encryption_key',
  LOG_METADATA: 'log_metadata',
  FAILED_EVENTS: 'failed_audit_events',
} as const;

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'registration'
  | 'password_change'
  | 'mfa_setup'
  | 'mfa_verification'
  | 'biometric_setup'
  | 'biometric_auth'
  | 'key_rotation'
  | 'data_access'
  | 'permission_change'
  | 'suspicious_activity'
  | 'security_breach'
  | 'system_error';

export type UserActivityType =
  | 'document_upload'
  | 'document_view'
  | 'document_download'
  | 'document_delete'
  | 'document_share'
  | 'search_performed'
  | 'backup_created'
  | 'settings_changed'
  | 'profile_updated'
  | 'category_created'
  | 'folder_created';

export type SystemEventType =
  | 'app_start'
  | 'app_crash'
  | 'database_error'
  | 'network_error'
  | 'storage_full'
  | 'performance_warning'
  | 'update_installed'
  | 'maintenance_mode';

export interface BaseAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityAuditLog extends BaseAuditLog {
  type: 'security';
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: Record<string, any>;
  riskScore: number;
  actionTaken?: string;
  relatedEventId?: string;
}

export interface UserActivityLog extends BaseAuditLog {
  type: 'user_activity';
  eventType: UserActivityType;
  resource?: string;
  resourceId?: string;
  action: string;
  success: boolean;
  duration?: number;
  metadata: Record<string, any>;
}

export interface SystemLog extends BaseAuditLog {
  type: 'system';
  eventType: SystemEventType;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  component: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata: Record<string, any>;
}

export type AuditLog = SecurityAuditLog | UserActivityLog | SystemLog;

export interface DeviceInfo {
  platform: string;
  osVersion?: string;
  appVersion: string;
  deviceModel?: string;
  deviceId: string;
}

export interface AuditLogQuery {
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  severity?: string[];
  userId?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogSummary {
  totalEvents: number;
  securityEvents: number;
  userActivityEvents: number;
  systemEvents: number;
  criticalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  averageRiskScore: number;
  topEvents: { eventType: string; count: number }[];
  timeRange: { start: string; end: string };
}

class AuditLogService {
  private static instance: AuditLogService;
  private logQueue: AuditLog[] = [];
  private isProcessingQueue = false;
  private deviceInfo: DeviceInfo | null = null;
  private sessionId: string | null = null;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize audit logging service
   */
  async initialize(): Promise<void> {
    try {
      // Generate device info
      this.deviceInfo = await this.generateDeviceInfo();
      
      // Generate session ID
      this.sessionId = await this.generateSessionId();
      
      // Start periodic log processing
      this.startLogProcessing();
      
      // Log system start event
      await this.logSystemEvent('app_start', 'info', 'AuditLogService', 'Audit logging service initialized', {
        deviceInfo: this.deviceInfo,
        sessionId: this.sessionId,
      });
      
    } catch (error) {
      console.error('Failed to initialize audit log service:', error);
    }
  }

  // ==================== SECURITY EVENT LOGGING ====================

  /**
   * Log a security event
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecurityAuditLog['severity'],
    description: string,
    metadata: Record<string, any> = {},
    userId?: string,
    riskScore: number = 0
  ): Promise<void> {
    try {
      const logEntry: SecurityAuditLog = {
        id: await this.generateLogId(),
        timestamp: new Date().toISOString(),
        type: 'security',
        eventType,
        severity,
        description,
        metadata: {
          ...metadata,
          detectionTime: new Date().toISOString(),
        },
        riskScore,
        userId,
        sessionId: this.sessionId || undefined,
        deviceInfo: this.deviceInfo!,
        ipAddress: await this.getClientIPAddress(),
        userAgent: await this.getUserAgent(),
      };

      await this.queueLogEntry(logEntry);

      // Handle critical security events immediately
      if (severity === 'critical') {
        await this.handleCriticalSecurityEvent(logEntry);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
      await this.logFailedEvent('security', eventType, error.message);
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(
    eventType: UserActivityType,
    action: string,
    success: boolean,
    userId: string,
    resource?: string,
    resourceId?: string,
    duration?: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const logEntry: UserActivityLog = {
        id: await this.generateLogId(),
        timestamp: new Date().toISOString(),
        type: 'user_activity',
        eventType,
        action,
        success,
        resource,
        resourceId,
        duration,
        metadata: {
          ...metadata,
          browserInfo: await this.getBrowserInfo(),
        },
        userId,
        sessionId: this.sessionId || undefined,
        deviceInfo: this.deviceInfo!,
        ipAddress: await this.getClientIPAddress(),
        userAgent: await this.getUserAgent(),
      };

      await this.queueLogEntry(logEntry);

    } catch (error) {
      console.error('Failed to log user activity:', error);
      await this.logFailedEvent('user_activity', eventType, error.message);
    }
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    eventType: SystemEventType,
    level: SystemLog['level'],
    component: string,
    message: string,
    metadata: Record<string, any> = {},
    error?: Error
  ): Promise<void> {
    try {
      const logEntry: SystemLog = {
        id: await this.generateLogId(),
        timestamp: new Date().toISOString(),
        type: 'system',
        eventType,
        level,
        component,
        message,
        metadata: {
          ...metadata,
          memoryUsage: await this.getMemoryUsage(),
          storageUsage: await this.getStorageUsage(),
        },
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
        sessionId: this.sessionId || undefined,
        deviceInfo: this.deviceInfo!,
      };

      await this.queueLogEntry(logEntry);

    } catch (error) {
      console.error('Failed to log system event:', error);
      await this.logFailedEvent('system', eventType, error.message);
    }
  }

  // ==================== LOG RETRIEVAL ====================

  /**
   * Query audit logs with filters
   */
  async queryLogs(query: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const allLogs = await this.getAllLogs();
      let filteredLogs = allLogs;

      // Apply filters
      if (query.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= query.startDate!);
      }

      if (query.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= query.endDate!);
      }

      if (query.eventTypes && query.eventTypes.length > 0) {
        filteredLogs = filteredLogs.filter(log => query.eventTypes!.includes(log.eventType));
      }

      if (query.severity && query.severity.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.type === 'security' && query.severity!.includes((log as SecurityAuditLog).severity)
        );
      }

      if (query.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
      }

      if (query.searchText) {
        const searchLower = query.searchText.toLowerCase();
        filteredLogs = filteredLogs.filter(log => {
          const searchableText = JSON.stringify(log).toLowerCase();
          return searchableText.includes(searchLower);
        });
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 100;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total: filteredLogs.length,
      };

    } catch (error) {
      throw new Error(`Failed to query logs: ${error.message}`);
    }
  }

  /**
   * Get audit log summary for dashboard
   */
  async getLogSummary(days: number = 30): Promise<AuditLogSummary> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const { logs } = await this.queryLogs({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Calculate summary statistics
      const totalEvents = logs.length;
      const securityEvents = logs.filter(log => log.type === 'security').length;
      const userActivityEvents = logs.filter(log => log.type === 'user_activity').length;
      const systemEvents = logs.filter(log => log.type === 'system').length;
      
      const criticalEvents = logs.filter(log => 
        log.type === 'security' && (log as SecurityAuditLog).severity === 'critical'
      ).length;

      const failedLogins = logs.filter(log => 
        log.type === 'security' && log.eventType === 'login_failed'
      ).length;

      const suspiciousActivities = logs.filter(log => 
        log.type === 'security' && log.eventType === 'suspicious_activity'
      ).length;

      const securityLogs = logs.filter(log => log.type === 'security') as SecurityAuditLog[];
      const averageRiskScore = securityLogs.length > 0 
        ? securityLogs.reduce((sum, log) => sum + log.riskScore, 0) / securityLogs.length
        : 0;

      // Calculate top events
      const eventCounts: { [key: string]: number } = {};
      logs.forEach(log => {
        eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
      });

      const topEvents = Object.entries(eventCounts)
        .map(([eventType, count]) => ({ eventType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEvents,
        securityEvents,
        userActivityEvents,
        systemEvents,
        criticalEvents,
        failedLogins,
        suspiciousActivities,
        averageRiskScore,
        topEvents,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };

    } catch (error) {
      throw new Error(`Failed to generate log summary: ${error.message}`);
    }
  }

  // ==================== LOG MANAGEMENT ====================

  /**
   * Queue log entry for processing
   */
  private async queueLogEntry(logEntry: AuditLog): Promise<void> {
    this.logQueue.push(logEntry);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processLogQueue();
    }
  }

  /**
   * Process queued log entries
   */
  private async processLogQueue(): Promise<void> {
    if (this.isProcessingQueue || this.logQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const batchSize = 10;
      const batch = this.logQueue.splice(0, batchSize);

      for (const logEntry of batch) {
        await this.persistLogEntry(logEntry);
      }

      // Clean up old logs periodically
      await this.cleanupOldLogs();

    } catch (error) {
      console.error('Log processing failed:', error);
    } finally {
      this.isProcessingQueue = false;
      
      // Continue processing if there are more logs
      if (this.logQueue.length > 0) {
        setTimeout(() => this.processLogQueue(), 1000);
      }
    }
  }

  /**
   * Persist log entry to storage
   */
  private async persistLogEntry(logEntry: AuditLog): Promise<void> {
    try {
      // Encrypt log entry for security
      const encryptedLog = await EncryptionService.encryptData(JSON.stringify(logEntry));
      
      // Store encrypted log
      const storageKey = `${AUDIT_STORAGE_KEYS[logEntry.type.toUpperCase() + '_LOGS']}_${logEntry.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(encryptedLog));

      // Update log metadata
      await this.updateLogMetadata(logEntry);

    } catch (error) {
      throw new Error(`Failed to persist log entry: ${error.message}`);
    }
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalSecurityEvent(logEntry: SecurityAuditLog): Promise<void> {
    try {
      // Immediate actions for critical events
      switch (logEntry.eventType) {
        case 'security_breach':
        case 'suspicious_activity':
          // Could trigger alerts, lock account, etc.
          await this.triggerSecurityAlert(logEntry);
          break;
        
        case 'login_failed':
          // Check for brute force attempts
          await this.checkBruteForceAttack(logEntry);
          break;
      }

    } catch (error) {
      console.error('Failed to handle critical security event:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique log ID
   */
  private async generateLogId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const randomBytes = CryptoJS.lib.WordArray.random(8);
    return `log_${timestamp}_${randomBytes.toString(CryptoJS.enc.Hex)}`;
  }

  /**
   * Generate session ID
   */
  private async generateSessionId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const randomBytes = CryptoJS.lib.WordArray.random(16);
    return `session_${timestamp}_${randomBytes.toString(CryptoJS.enc.Hex)}`;
  }

  /**
   * Generate device information
   */
  private async generateDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0', // Should come from app config
      deviceModel: 'Unknown', // Would need native module for actual device model
      deviceId: await this.getOrCreateDeviceId(),
    };
  }

  /**
   * Get or create device ID
   */
  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync('device_id');
      
      if (!deviceId) {
        const randomBytes = CryptoJS.lib.WordArray.random(16);
        deviceId = `device_${randomBytes.toString(CryptoJS.enc.Hex)}`;
        await SecureStore.setItemAsync('device_id', deviceId);
      }

      return deviceId;
    } catch (error) {
      // Fallback to timestamp-based ID
      return `device_${Date.now().toString(36)}`;
    }
  }

  /**
   * Start periodic log processing
   */
  private startLogProcessing(): void {
    setInterval(() => {
      if (this.logQueue.length > 0) {
        this.processLogQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  // Additional helper methods would be implemented here...
  private async getAllLogs(): Promise<AuditLog[]> {
    // Implementation for retrieving all logs from storage
    return [];
  }

  private async updateLogMetadata(logEntry: AuditLog): Promise<void> {
    // Implementation for updating log metadata
  }

  private async cleanupOldLogs(): Promise<void> {
    // Implementation for cleaning up old log entries
  }

  private async logFailedEvent(type: string, eventType: string, error: string): Promise<void> {
    // Implementation for logging failed events
  }

  private async getClientIPAddress(): Promise<string | undefined> {
    // Implementation for getting client IP (if available)
    return undefined;
  }

  private async getUserAgent(): Promise<string | undefined> {
    // Implementation for getting user agent
    return undefined;
  }

  private async getBrowserInfo(): Promise<any> {
    // Implementation for getting browser information
    return {};
  }

  private async getMemoryUsage(): Promise<any> {
    // Implementation for getting memory usage
    return {};
  }

  private async getStorageUsage(): Promise<any> {
    // Implementation for getting storage usage
    return {};
  }

  private async triggerSecurityAlert(logEntry: SecurityAuditLog): Promise<void> {
    // Implementation for triggering security alerts
  }

  private async checkBruteForceAttack(logEntry: SecurityAuditLog): Promise<void> {
    // Implementation for checking brute force attacks
  }
}

export default AuditLogService.getInstance();