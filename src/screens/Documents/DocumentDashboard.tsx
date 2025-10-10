// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { useState, useEffect } = React;

const { width: screenWidth } = Dimensions.get('window');

interface DocumentStats {
  scanned: number;
  processing: number;
  ready: number;
  totalSize: number;
}

interface RecentDocument {
  id: string;
  name: string;
  status: 'ready' | 'processing' | 'failed';
  size: number;
  timestamp: number;
  confidence?: number;
}

export const DocumentDashboard = () => {
  const navigation = useNavigation();
  
  const [stats, setStats] = useState<DocumentStats>({
    scanned: 3,
    processing: 1,
    ready: 2,
    totalSize: 847000, // bytes
  });
  
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([
    {
      id: '1',
      name: 'Invoice_001.jpg',
      status: 'ready',
      size: 425000,
      timestamp: Date.now() - 300000,
      confidence: 87
    },
    {
      id: '2', 
      name: 'Receipt_002.jpg',
      status: 'processing',
      size: 322000,
      timestamp: Date.now() - 60000
    },
    {
      id: '3',
      name: 'Contract_003.jpg', 
      status: 'ready',
      size: 100000,
      timestamp: Date.now() - 120000,
      confidence: 92
    }
  ]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  const getStatusText = (doc: RecentDocument) => {
    switch (doc.status) {
      case 'ready':
        return `Processed • ${doc.confidence}% confidence`;
      case 'processing':
        return 'Processing OCR...';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📱 DocShelf</Text>
          <Text style={styles.headerSubtitle}>Document Management</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📄 Your Documents</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.scanned}</Text>
              <Text style={styles.statLabel}>Scanned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9500' }]}>{stats.processing}</Text>
              <Text style={styles.statLabel}>Processing</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.ready}</Text>
              <Text style={styles.statLabel}>Ready</Text>
            </View>
          </View>
          <Text style={styles.totalSize}>
            Total: {formatBytes(stats.totalSize)}
          </Text>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.scanButton]}
            onPress={() => navigation.navigate('DocumentScanner' as never)}
          >
            <Text style={styles.actionButtonIcon}>📸</Text>
            <Text style={styles.actionButtonTitle}>SCAN NEW</Text>
            <Text style={styles.actionButtonSubtitle}>Document</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.uploadButton]}
            onPress={() => navigation.navigate('DocumentReviewHub' as never)}
            disabled={stats.ready === 0}
          >
            <Text style={styles.actionButtonIcon}>📤</Text>
            <Text style={styles.actionButtonTitle}>UPLOAD</Text>
            <Text style={styles.actionButtonSubtitle}>Ready ({stats.ready})</Text>
            {stats.ready > 0 && <View style={styles.readyBadge} />}
          </TouchableOpacity>
        </View>

        {/* Recent Documents */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('DocumentStorage' as never)}
            >
              <Text style={styles.seeAllButton}>See All →</Text>
            </TouchableOpacity>
          </View>

          {recentDocuments.map((doc) => (
            <TouchableOpacity 
              key={doc.id}
              style={styles.documentCard}
              onPress={() => navigation.navigate('DocumentDetail' as never, { documentId: doc.id } as never)}
            >
              <View style={styles.documentInfo}>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentName}>
                    {getStatusIcon(doc.status)} {doc.name}
                  </Text>
                  <Text style={styles.documentSize}>{formatBytes(doc.size)}</Text>
                </View>
                <Text style={styles.documentStatus}>
                  {getStatusText(doc)}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>👁️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CategoryManagement' as never)}
            >
              <Text style={styles.quickActionIcon}>🏷️</Text>
              <Text style={styles.quickActionText}>Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('DocumentStorage' as never)}
            >
              <Text style={styles.quickActionIcon}>📂</Text>
              <Text style={styles.quickActionText}>Storage</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Help' as never)}
            >
              <Text style={styles.quickActionIcon}>❓</Text>
              <Text style={styles.quickActionText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  totalSize: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  scanButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  uploadButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  readyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  recentSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  documentSize: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  documentStatus: {
    fontSize: 12,
    color: '#6c757d',
  },
  viewButton: {
    padding: 8,
  },
  viewButtonText: {
    fontSize: 16,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 64) / 2, // 2 columns with gaps
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});

export default DocumentDashboard;