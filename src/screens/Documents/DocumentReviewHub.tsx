// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { useState, useEffect } = React;

interface ScannedDocument {
  id: string;
  name: string;
  uri: string;
  status: 'ready' | 'processing' | 'failed';
  size: number;
  timestamp: number;
  confidence?: number;
  ocrText?: string;
  documentType?: string;
}

export const DocumentReviewHub = () => {
  const navigation = useNavigation();
  
  const [documents, setDocuments] = useState<ScannedDocument[]>([
    {
      id: '1',
      name: 'scan_001.jpg',
      uri: 'placeholder_uri',
      status: 'ready',
      size: 425000,
      timestamp: Date.now() - 300000,
      confidence: 87,
      ocrText: 'Invoice - ABC Corp\nAmount: $1,250.00\nDate: 10/09/2025',
      documentType: 'invoice'
    },
    {
      id: '2',
      name: 'scan_002.jpg', 
      uri: 'placeholder_uri',
      status: 'processing',
      size: 322000,
      timestamp: Date.now() - 60000
    },
    {
      id: '3',
      name: 'scan_003.jpg',
      uri: 'placeholder_uri', 
      status: 'ready',
      size: 100000,
      timestamp: Date.now() - 120000,
      confidence: 92,
      ocrText: 'Receipt - Coffee Shop\nAmount: $4.50\nDate: 10/09/2025',
      documentType: 'receipt'
    }
  ]);

  const readyDocuments = documents.filter(doc => doc.status === 'ready');
  const processingDocuments = documents.filter(doc => doc.status === 'processing');
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

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

  const getDocumentTypeIcon = (type?: string) => {
    switch (type) {
      case 'invoice': return '🧾';
      case 'receipt': return '🧺';
      case 'contract': return '📋';
      case 'id': return '🪪';
      default: return '📄';
    }
  };

  const handleUploadAll = () => {
    if (readyDocuments.length === 0) {
      Alert.alert('No Documents Ready', 'Please wait for OCR processing to complete.');
      return;
    }

    Alert.alert(
      'Upload Documents',
      `Upload ${readyDocuments.length} document(s) to cloud storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: () => {
            navigation.navigate('DocumentUpload' as never, {
              documents: readyDocuments
            } as never);
          }
        }
      ]
    );
  };

  const handleViewDocument = (document: ScannedDocument) => {
    if (document.status === 'ready' && document.ocrText) {
      navigation.navigate('OCRResults' as never, {
        ocrResult: {
          text: document.ocrText,
          confidence: document.confidence || 0,
          documentType: document.documentType || 'other'
        },
        documentUri: document.uri,
        documentId: document.id
      } as never);
    } else {
      Alert.alert(
        'Document Processing',
        document.status === 'processing' 
          ? 'This document is still being processed. Please wait.'
          : 'This document failed to process.'
      );
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(docs => docs.filter(doc => doc.id !== documentId));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Review Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Scan Session Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryBadge, { backgroundColor: '#34C759' }]}>
                <Text style={styles.summaryNumber}>{readyDocuments.length}</Text>
              </View>
              <Text style={styles.summaryLabel}>Ready to upload</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryBadge, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.summaryNumber}>{processingDocuments.length}</Text>
              </View>
              <Text style={styles.summaryLabel}>Still processing</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryBadge, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.summarySize}>{formatBytes(totalSize)}</Text>
              </View>
              <Text style={styles.summaryLabel}>Total size</Text>
            </View>
          </View>
        </View>

        {/* Documents List */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documents</Text>
          
          {documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <View style={styles.documentMainInfo}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentTitleRow}>
                    <Text style={styles.documentIcon}>
                      {getDocumentTypeIcon(doc.documentType)}
                    </Text>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentStatus}>
                      {getStatusIcon(doc.status)}
                    </Text>
                  </View>
                  <Text style={styles.documentSize}>{formatBytes(doc.size)}</Text>
                </View>
                
                {doc.status === 'ready' && doc.ocrText && (
                  <View style={styles.ocrPreview}>
                    <Text style={styles.ocrPreviewText} numberOfLines={2}>
                      "{doc.ocrText}"
                    </Text>
                    {doc.confidence && (
                      <Text style={styles.confidenceText}>
                        {doc.confidence}% confidence
                      </Text>
                    )}
                  </View>
                )}
                
                {doc.status === 'processing' && (
                  <View style={styles.processingIndicator}>
                    <Text style={styles.processingText}>Processing OCR...</Text>
                    <View style={styles.processingBar}>
                      <View style={styles.processingProgress} />
                    </View>
                  </View>
                )}
              </View>
              
              <View style={styles.documentActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => handleViewDocument(doc)}
                  disabled={doc.status !== 'ready'}
                >
                  <Text style={styles.actionButtonText}>👁️</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteDocument(doc.id)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Upload Action */}
        <View style={styles.uploadSection}>
          <TouchableOpacity 
            style={[
              styles.uploadButton,
              readyDocuments.length === 0 && styles.uploadButtonDisabled
            ]}
            onPress={handleUploadAll}
            disabled={readyDocuments.length === 0}
          >
            <Text style={styles.uploadButtonIcon}>📤</Text>
            <Text style={styles.uploadButtonText}>
              UPLOAD ALL ({readyDocuments.length} ready)
            </Text>
            <Text style={styles.uploadButtonSubtext}>
              {readyDocuments.length > 0 
                ? `${formatBytes(readyDocuments.reduce((sum, doc) => sum + doc.size, 0))} total`
                : 'No documents ready'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('DocumentScanner' as never)}
          >
            <Text style={styles.quickActionIcon}>📸</Text>
            <Text style={styles.quickActionText}>Scan More</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('DocumentStorage' as never)}
          >
            <Text style={styles.quickActionIcon}>📂</Text>
            <Text style={styles.quickActionText}>View Storage</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    paddingRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Balance the back button
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summarySize: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  documentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentMainInfo: {
    flex: 1,
  },
  documentHeader: {
    marginBottom: 8,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  documentStatus: {
    fontSize: 16,
    marginLeft: 8,
  },
  documentSize: {
    fontSize: 12,
    color: '#6c757d',
  },
  ocrPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  ocrPreviewText: {
    fontSize: 12,
    color: '#495057',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
  },
  processingIndicator: {
    marginTop: 8,
  },
  processingText: {
    fontSize: 12,
    color: '#FF9500',
    marginBottom: 6,
  },
  processingBar: {
    height: 3,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  processingProgress: {
    height: '100%',
    width: '70%', // Simulate progress
    backgroundColor: '#FF9500',
    borderRadius: 2,
  },
  documentActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#34C759',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  uploadButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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

export default DocumentReviewHub;