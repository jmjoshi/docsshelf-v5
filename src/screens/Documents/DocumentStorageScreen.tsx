// @ts-nocheck
import React from 'react';

const { useState, useEffect } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DocumentStorageService, StoredDocument } from '../../services/storage/DocumentStorageService';

export const DocumentStorageScreen = () => {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [storageInfo, setStorageInfo] = useState({
    totalDocuments: 0,
    totalSize: 0,
    storageLocation: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const [docs, info] = await Promise.all([
        DocumentStorageService.getStoredDocuments(),
        DocumentStorageService.getStorageInfo(),
      ]);
      
      setDocuments(docs);
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load documents:', error);
      Alert.alert('Error', 'Failed to load stored documents');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
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
          onPress: async () => {
            try {
              await DocumentStorageService.deleteDocument(documentId);
              await loadDocuments();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const cleanupTempFiles = async () => {
    try {
      await DocumentStorageService.cleanupTempFiles();
      Alert.alert('Cleanup Complete', 'Temporary files have been cleaned up.');
    } catch (error) {
      Alert.alert('Error', 'Failed to cleanup temporary files');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Document Storage</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Storage Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📱 Storage Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Documents:</Text>
            <Text style={styles.infoValue}>{storageInfo.totalDocuments}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Size:</Text>
            <Text style={styles.infoValue}>{formatBytes(storageInfo.totalSize)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Storage Locations */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📂 Storage Locations</Text>
          <Text style={styles.locationText}>
            <Text style={styles.locationLabel}>App Documents: </Text>
            {storageInfo.storageLocation}
          </Text>
          {Platform.OS === 'android' && (
            <Text style={styles.locationText}>
              <Text style={styles.locationLabel}>Device Gallery: </Text>
              DocShelf album (if permissions granted)
            </Text>
          )}
          <Text style={styles.helpText}>
            📱 On Android, documents are stored both in the app's private storage and optionally in your device's gallery under the "DocShelf" album for easy access.
          </Text>
        </View>

        {/* Documents List */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.infoTitle}>📄 Stored Documents</Text>
            <TouchableOpacity
              style={styles.cleanupButton}
              onPress={cleanupTempFiles}
            >
              <Text style={styles.cleanupButtonText}>🧹 Cleanup</Text>
            </TouchableOpacity>
          </View>

          {documents.length === 0 ? (
            <Text style={styles.emptyText}>No documents stored yet</Text>
          ) : (
            documents.map((doc: StoredDocument) => (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.filename}</Text>
                  <Text style={styles.documentDetails}>
                    {formatBytes(doc.size)} • {formatDate(doc.timestamp)}
                  </Text>
                  {doc.mediaLibraryAsset && (
                    <Text style={styles.galleryIndicator}>📱 Saved to Gallery</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteDocument(doc.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Usage Tips */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Usage Tips</Text>
          <Text style={styles.tipText}>
            • Documents are automatically saved when you scan them
          </Text>
          <Text style={styles.tipText}>
            • Files remain accessible even when offline
          </Text>
          <Text style={styles.tipText}>
            • On Android, check your gallery's "DocShelf" album
          </Text>
          <Text style={styles.tipText}>
            • Use cleanup to remove temporary files periodically
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    marginBottom: 8,
    color: '#666',
  },
  locationLabel: {
    fontWeight: '600',
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cleanupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  cleanupButtonText: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentDetails: {
    fontSize: 12,
    color: '#666',
  },
  galleryIndicator: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
});