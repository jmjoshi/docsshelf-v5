// @ts-nocheck
/**
 * DocumentsScreen - Display and manage documents within a category
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DatabaseService, { Document } from '../../services/database/DatabaseService';
import {
  setDocuments,
  setLoading,
  setError,
} from '../../store/slices/documentSlice';

export const DocumentsScreen = ({ route, navigation }: any) => {
  const { categoryId } = route?.params || {};
  const dispatch = useDispatch();
  const { documents, loading, categories } = useSelector((state: any) => state.document);

  const [categoryDocs, setCategoryDocs] = useState<Document[]>([]);

  useEffect(() => {
    if (categoryId) {
      loadDocuments();
    }
  }, [categoryId]);

  const loadDocuments = async () => {
    if (!categoryId) return;

    try {
      dispatch(setLoading(true));
      const docs = await DatabaseService.getDocumentsByCategory(categoryId);
      setCategoryDocs(docs);
      dispatch(setDocuments(docs));
    } catch (error) {
      console.error('Failed to load documents:', error);
      dispatch(setError('Failed to load documents'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getCategoryName = () => {
    if (!categoryId) return 'All Documents';
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category?.name || 'Documents';
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => {
        Alert.alert('Document', `Opening: ${item.name}`);
      }}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>
          {item.fileType === 'pdf' ? '📄' : '📷'}
        </Text>
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.documentMeta}>
          {(item.fileSize / 1024).toFixed(1)} KB • {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.encrypted && (
          <Text style={styles.encryptedBadge}>🔒 Encrypted</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getCategoryName()}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation?.navigate('DocumentUpload', { categoryId })}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading documents...</Text>
        </View>
      ) : categoryDocs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>No documents yet</Text>
          <Text style={styles.emptySubtext}>
            Upload or scan documents to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoryDocs}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.documentsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  documentsList: {
    padding: 16,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#999999',
  },
  encryptedBadge: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
});