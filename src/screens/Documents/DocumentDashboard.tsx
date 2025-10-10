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
import { useSelector } from 'react-redux';
import DatabaseService from '../../services/database/DatabaseService';

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
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);
  
  const [stats, setStats] = useState<DocumentStats>({
    scanned: 0,
    processing: 0,
    ready: 0,
    totalSize: 0,
  });
  
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  
  // Load real data from database when user is available
  useEffect(() => {
    console.log('🏠 DocumentDashboard: Auth check - isAuthenticated:', isAuthenticated, 'user:', user?.id);
    
    if (isAuthenticated && user?.id) {
      console.log('🏠 DocumentDashboard: Loading data for user:', user.id);
      loadDocumentData();
    } else {
      console.log('⚠️ DocumentDashboard: User not authenticated or no user ID - showing empty state');
      // Show empty state when not authenticated
      setStats({ scanned: 0, processing: 0, ready: 0, totalSize: 0 });
      setRecentDocuments([]);
    }
  }, [isAuthenticated, user?.id]);
  
  // Add navigation focus listener to refresh data when returning from upload
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated && user?.id) {
        console.log('🔄 Dashboard focused - refreshing data');
        loadDocumentData();
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated, user?.id]);
  
  const loadDocumentData = async () => {
    try {
      if (!user?.id) {
        console.log('❌ No user ID available for loading documents');
        return;
      }

      console.log('📱 Loading documents from database for user:', user.id);
      
      const dbService = DatabaseService.getInstance();
      
      // Get document counts
      const totalDocs = await dbService.getTotalDocumentCount(user.id);
      console.log('� Total documents found:', totalDocs);
      
      // Get recent documents (limit to 5 for dashboard)
      const allDocuments = await dbService.getDocuments(user.id);
      const recentDocs = allDocuments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          name: doc.name,
          status: 'ready' as const,
          size: doc.fileSize,
          timestamp: new Date(doc.createdAt).getTime(),
          confidence: 95 // Default confidence for uploaded docs
        }));
      
      console.log('📄 Recent documents:', recentDocs.length);
      
      setRecentDocuments(recentDocs);
      setStats({
        scanned: totalDocs, // All uploaded docs are "scanned"
        processing: 0,     // No processing for now
        ready: totalDocs,  // All docs are ready
        totalSize: allDocuments.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
      });
    } catch (error) {
      console.error('Error loading documents:', error);
      setRecentDocuments([]);
      setStats({ scanned: 0, processing: 0, ready: 0, totalSize: 0 });
    }
  };

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
            onPress={() => {
              console.log('📸 Scan button pressed');
              navigation.navigate('DocumentScanner' as never);
            }}
          >
            <Text style={styles.actionButtonIcon}>📸</Text>
            <Text style={styles.actionButtonTitle}>SCAN NEW</Text>
            <Text style={styles.actionButtonSubtitle}>Document</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.uploadButton]}
            onPress={() => {
              console.log('📤 Upload button pressed');
              navigation.navigate('DocumentUpload' as never);
            }}
          >
            <Text style={styles.actionButtonIcon}>📤</Text>
            <Text style={styles.actionButtonTitle}>UPLOAD</Text>
            <Text style={styles.actionButtonSubtitle}>Documents</Text>
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
              onPress={() => console.log('Document card tapped:', doc.name)}
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
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => {
                  console.log('👁️ View button tapped for:', doc.name);
                  navigation.navigate('DocumentViewer' as never, { documentId: doc.id } as never);
                }}
              >
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