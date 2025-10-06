/**
 * Security Monitoring Service
 * Real-time security monitoring, anomaly detection, and automated alerting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import AuditLogService from './AuditLogService';
import type { SecurityAuditLog, DeviceInfo } from './AuditLogService';

// Monitoring configuration
const MONITORING_CONFIG = {
  MAX_FAILED_LOGINS: 5,
  FAILED_LOGIN_WINDOW_MINUTES: 15,
  ANOMALY_DETECTION_WINDOW_HOURS: 24,
  RISK_SCORE_THRESHOLD: 75,
  SESSION_TIMEOUT_MINUTES: 30,
  SUSPICIOUS_ACTIVITY_THRESHOLD: 3,
} as const;

export interface SecurityThreat {
  id: string;
  type: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  riskScore: number;
  detectedAt: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  indicators: ThreatIndicator[];
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  actions: SecurityAction[];
  relatedEvents: string[];
}

export type ThreatType = 
  | 'brute_force_attack'
  | 'suspicious_login'
  | 'anomalous_behavior'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'malicious_device'
  | 'session_hijacking'
  | 'unusual_location'
  | 'rapid_actions'
  | 'unauthorized_access';

export interface ThreatIndicator {
  type: string;
  value: string;
  confidence: number;
  description: string;
  timestamp: string;
}

export interface SecurityAction {
  action: 'block_user' | 'require_mfa' | 'log_event' | 'alert_admin' | 'lock_session' | 'notify_user';
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  details?: Record<string, any>;
}

export interface AnomalyPattern {
  userId: string;
  pattern: string;
  baseline: number;
  current: number;
  deviation: number;
  confidence: number;
  lastUpdated: string;
}

export interface SecurityMetrics {
  totalThreats: number;
  activeThreats: number;
  criticalThreats: number;
  blockedAttempts: number;
  averageRiskScore: number;
  threatTrends: {
    period: string;
    count: number;
    type: ThreatType;
  }[];
  topThreats: {
    type: ThreatType;
    count: number;
  }[];
  responseMetrics: {
    averageDetectionTime: number;
    averageResponseTime: number;
    falsePositiveRate: number;
  };
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  type: ThreatType;
  conditions: RuleCondition[];
  actions: SecurityAction[];
  severity: SecurityThreat['severity'];
  enabled: boolean;
  riskScore: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: string | number;
  timeWindow?: number; // minutes
  threshold?: number;
}

class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private monitoringRules: Map<string, MonitoringRule> = new Map();
  private activeThreats: Map<string, SecurityThreat> = new Map();
  private userBehaviorBaselines: Map<string, UserBehaviorBaseline> = new Map();
  private isMonitoring = false;
  private alertHandlers: SecurityAlertHandler[] = [];
  private appStateSubscription: any = null;

  private constructor() {}

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize security monitoring service
   */
  async initialize(): Promise<void> {
    try {
      // Load monitoring rules
      await this.loadMonitoringRules();
      
      // Load existing threats
      await this.loadActiveThreats();
      
      // Load user behavior baselines
      await this.loadUserBehaviorBaselines();
      
      // Start monitoring
      this.startMonitoring();
      
      // Initialize default rules if none exist
      if (this.monitoringRules.size === 0) {
        await this.initializeDefaultRules();
      }

      await AuditLogService.logSystemEvent(
        'app_start',
        'info',
        'SecurityMonitoring',
        'Security monitoring service initialized',
        { rulesCount: this.monitoringRules.size }
      );

    } catch (error) {
      console.error('Failed to initialize security monitoring:', error);
      throw error;
    }
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    // Start periodic threat assessment
    this.startThreatAssessment();

    // Start anomaly detection
    this.startAnomalyDetection();

    console.log('Security monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    console.log('Security monitoring stopped');
  }

  // ==================== THREAT DETECTION ====================

  /**
   * Analyze security event for threats
   */
  async analyzeSecurityEvent(event: SecurityAuditLog): Promise<SecurityThreat[]> {
    const detectedThreats: SecurityThreat[] = [];

    try {
      // Check against all monitoring rules
      for (const rule of this.monitoringRules.values()) {
        if (!rule.enabled) continue;

        const isMatch = await this.evaluateRule(rule, event);
        
        if (isMatch) {
          const threat = await this.createThreatFromRule(rule, event);
          detectedThreats.push(threat);
          
          // Execute rule actions
          await this.executeSecurityActions(rule.actions, threat);
        }
      }

      // Check for behavioral anomalies
      if (event.userId) {
        const anomalies = await this.detectBehavioralAnomalies(event);
        detectedThreats.push(...anomalies);
      }

      // Store detected threats
      for (const threat of detectedThreats) {
        this.activeThreats.set(threat.id, threat);
        await this.persistThreat(threat);
        await this.notifyThreatDetected(threat);
      }

      return detectedThreats;

    } catch (error) {
      console.error('Threat analysis failed:', error);
      return [];
    }
  }

  /**
   * Check for brute force attacks
   */
  async checkBruteForceAttack(userId?: string, ipAddress?: string): Promise<SecurityThreat | null> {
    try {
      // Get recent failed login attempts
      const { logs } = await AuditLogService.queryLogs({
        eventTypes: ['login_failed'],
        startDate: new Date(Date.now() - MONITORING_CONFIG.FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString(),
        limit: 100,
      });

      // Group by user ID or IP address
      const attempts = new Map<string, number>();
      
      for (const log of logs) {
        const key = userId || ipAddress || 'unknown';
        attempts.set(key, (attempts.get(key) || 0) + 1);
      }

      // Check for excessive attempts
      for (const [key, count] of attempts.entries()) {
        if (count >= MONITORING_CONFIG.MAX_FAILED_LOGINS) {
          const threat: SecurityThreat = {
            id: await this.generateThreatId(),
            type: 'brute_force_attack',
            severity: count > 10 ? 'critical' : 'high',
            title: 'Brute Force Attack Detected',
            description: `${count} failed login attempts detected within ${MONITORING_CONFIG.FAILED_LOGIN_WINDOW_MINUTES} minutes`,
            riskScore: Math.min(100, count * 10),
            detectedAt: new Date().toISOString(),
            userId,
            deviceInfo: await this.getCurrentDeviceInfo(),
            indicators: [
              {
                type: 'failed_attempts',
                value: count.toString(),
                confidence: 0.9,
                description: `${count} failed login attempts`,
                timestamp: new Date().toISOString(),
              },
            ],
            status: 'active',
            actions: [
              {
                action: 'block_user',
                timestamp: new Date().toISOString(),
                status: 'pending',
              },
              {
                action: 'alert_admin',
                timestamp: new Date().toISOString(),
                status: 'pending',
              },
            ],
            relatedEvents: logs.map(log => log.id),
          };

          return threat;
        }
      }

      return null;

    } catch (error) {
      console.error('Brute force check failed:', error);
      return null;
    }
  }

  /**
   * Detect behavioral anomalies
   */
  async detectBehavioralAnomalies(event: SecurityAuditLog): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      if (!event.userId) return threats;

      // Get user behavior baseline
      let baseline = this.userBehaviorBaselines.get(event.userId);
      
      if (!baseline) {
        baseline = await this.createUserBehaviorBaseline(event.userId);
        this.userBehaviorBaselines.set(event.userId, baseline);
      }

      // Analyze various behavioral patterns
      const anomalies = await this.analyzeBehaviorPatterns(event, baseline);

      for (const anomaly of anomalies) {
        if (anomaly.confidence > 0.7 && anomaly.deviation > 2.0) {
          const threat: SecurityThreat = {
            id: await this.generateThreatId(),
            type: 'anomalous_behavior',
            severity: anomaly.confidence > 0.9 ? 'high' : 'medium',
            title: 'Anomalous User Behavior Detected',
            description: `Unusual ${anomaly.pattern} pattern detected for user`,
            riskScore: Math.floor(anomaly.confidence * anomaly.deviation * 25),
            detectedAt: new Date().toISOString(),
            userId: event.userId,
            deviceInfo: event.deviceInfo,
            indicators: [
              {
                type: 'behavior_anomaly',
                value: anomaly.pattern,
                confidence: anomaly.confidence,
                description: `${anomaly.pattern}: baseline=${anomaly.baseline}, current=${anomaly.current}`,
                timestamp: new Date().toISOString(),
              },
            ],
            status: 'active',
            actions: [
              {
                action: 'log_event',
                timestamp: new Date().toISOString(),
                status: 'completed',
              },
              {
                action: 'require_mfa',
                timestamp: new Date().toISOString(),
                status: 'pending',
              },
            ],
            relatedEvents: [event.id],
          };

          threats.push(threat);
        }
      }

      // Update baseline with new data
      await this.updateUserBehaviorBaseline(event.userId, event);

      return threats;

    } catch (error) {
      console.error('Behavioral anomaly detection failed:', error);
      return [];
    }
  }

  // ==================== RULE MANAGEMENT ====================

  /**
   * Add or update monitoring rule
   */
  async addMonitoringRule(rule: MonitoringRule): Promise<void> {
    try {
      this.monitoringRules.set(rule.id, rule);
      await this.persistMonitoringRules();

      await AuditLogService.logSystemEvent(
        'app_start',
        'info',
        'SecurityMonitoring',
        `Monitoring rule added: ${rule.name}`,
        { ruleId: rule.id, type: rule.type }
      );

    } catch (error) {
      throw new Error(`Failed to add monitoring rule: ${error.message}`);
    }
  }

  /**
   * Remove monitoring rule
   */
  async removeMonitoringRule(ruleId: string): Promise<void> {
    try {
      const rule = this.monitoringRules.get(ruleId);
      
      if (rule) {
        this.monitoringRules.delete(ruleId);
        await this.persistMonitoringRules();

        await AuditLogService.logSystemEvent(
          'app_start',
          'info',
          'SecurityMonitoring',
          `Monitoring rule removed: ${rule.name}`,
          { ruleId }
        );
      }

    } catch (error) {
      throw new Error(`Failed to remove monitoring rule: ${error.message}`);
    }
  }

  /**
   * Get monitoring rules
   */
  getMonitoringRules(): MonitoringRule[] {
    return Array.from(this.monitoringRules.values());
  }

  // ==================== THREAT MANAGEMENT ====================

  /**
   * Get active threats
   */
  getActiveThreats(): SecurityThreat[] {
    return Array.from(this.activeThreats.values())
      .filter(threat => threat.status === 'active')
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Resolve threat
   */
  async resolveThreat(threatId: string, resolution: 'resolved' | 'false_positive', notes?: string): Promise<void> {
    try {
      const threat = this.activeThreats.get(threatId);
      
      if (threat) {
        threat.status = resolution;
        await this.persistThreat(threat);

        await AuditLogService.logSecurityEvent(
          'suspicious_activity',
          'medium',
          `Threat ${resolution}: ${threat.title}`,
          { threatId, resolution, notes },
          threat.userId,
          0
        );
      }

    } catch (error) {
      throw new Error(`Failed to resolve threat: ${error.message}`);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(days: number = 7): Promise<SecurityMetrics> {
    try {
      const threats = Array.from(this.activeThreats.values());
      const recentThreats = threats.filter(threat => {
        const threatDate = new Date(threat.detectedAt);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return threatDate >= cutoff;
      });

      const totalThreats = recentThreats.length;
      const activeThreats = threats.filter(t => t.status === 'active').length;
      const criticalThreats = threats.filter(t => t.severity === 'critical').length;
      
      const averageRiskScore = totalThreats > 0 
        ? recentThreats.reduce((sum, t) => sum + t.riskScore, 0) / totalThreats
        : 0;

      // Calculate threat trends and top threats
      const threatCounts = new Map<ThreatType, number>();
      recentThreats.forEach(threat => {
        threatCounts.set(threat.type, (threatCounts.get(threat.type) || 0) + 1);
      });

      const topThreats = Array.from(threatCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalThreats,
        activeThreats,
        criticalThreats,
        blockedAttempts: 0, // Would be calculated from action logs
        averageRiskScore,
        threatTrends: [], // Would be calculated from historical data
        topThreats,
        responseMetrics: {
          averageDetectionTime: 0, // Would be calculated from detection logs
          averageResponseTime: 0, // Would be calculated from response logs
          falsePositiveRate: 0, // Would be calculated from resolved threats
        },
      };

    } catch (error) {
      throw new Error(`Failed to calculate security metrics: ${error.message}`);
    }
  }

  // ==================== ALERT HANDLING ====================

  /**
   * Register alert handler
   */
  registerAlertHandler(handler: SecurityAlertHandler): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Notify threat detected
   */
  private async notifyThreatDetected(threat: SecurityThreat): Promise<void> {
    for (const handler of this.alertHandlers) {
      try {
        await handler.handleThreat(threat);
      } catch (error) {
        console.error('Alert handler failed:', error);
      }
    }
  }

  // ==================== PRIVATE METHODS ====================

  private async initializeDefaultRules(): Promise<void> {
    const defaultRules: MonitoringRule[] = [
      {
        id: 'brute_force_rule',
        name: 'Brute Force Detection',
        description: 'Detect multiple failed login attempts',
        type: 'brute_force_attack',
        conditions: [
          {
            field: 'eventType',
            operator: 'equals',
            value: 'login_failed',
            timeWindow: 15,
            threshold: 5,
          },
        ],
        actions: [
          { action: 'block_user', timestamp: '', status: 'pending' },
          { action: 'alert_admin', timestamp: '', status: 'pending' },
        ],
        severity: 'high',
        enabled: true,
        riskScore: 80,
      },
      // Add more default rules...
    ];

    for (const rule of defaultRules) {
      await this.addMonitoringRule(rule);
    }
  }

  private async evaluateRule(rule: MonitoringRule, event: SecurityAuditLog): Promise<boolean> {
    // Implementation for rule evaluation logic
    return false;
  }

  private async createThreatFromRule(rule: MonitoringRule, event: SecurityAuditLog): Promise<SecurityThreat> {
    // Implementation for creating threat from rule match
    return {} as SecurityThreat;
  }

  private async executeSecurityActions(actions: SecurityAction[], threat: SecurityThreat): Promise<void> {
    // Implementation for executing security actions
  }

  // Additional helper method implementations would go here...
  private async generateThreatId(): Promise<string> {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
      deviceModel: 'Unknown',
      deviceId: 'device_' + Date.now(),
    };
  }

  private handleAppStateChange(nextAppState: string): void {
    // Handle app state changes for security monitoring
  }

  private startThreatAssessment(): void {
    // Start periodic threat assessment
  }

  private startAnomalyDetection(): void {
    // Start anomaly detection
  }

  // Additional private method stubs...
  private async loadMonitoringRules(): Promise<void> {}
  private async loadActiveThreats(): Promise<void> {}
  private async loadUserBehaviorBaselines(): Promise<void> {}
  private async persistThreat(threat: SecurityThreat): Promise<void> {}
  private async persistMonitoringRules(): Promise<void> {}
  private async createUserBehaviorBaseline(userId: string): Promise<UserBehaviorBaseline> { return {} as any; }
  private async analyzeBehaviorPatterns(event: SecurityAuditLog, baseline: UserBehaviorBaseline): Promise<AnomalyPattern[]> { return []; }
  private async updateUserBehaviorBaseline(userId: string, event: SecurityAuditLog): Promise<void> {}
}

// Helper interfaces
interface UserBehaviorBaseline {
  userId: string;
  loginTimes: number[];
  deviceTypes: string[];
  ipAddresses: string[];
  activityPatterns: Map<string, number>;
  lastUpdated: string;
}

interface SecurityAlertHandler {
  handleThreat(threat: SecurityThreat): Promise<void>;
}

export default SecurityMonitoringService.getInstance();