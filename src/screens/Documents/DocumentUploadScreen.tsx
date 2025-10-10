// @ts-nocheck
/**
 * DocumentUploadScreen - Upload and manage document uploads
 * Features: Multi-file selection, progress tracking, duplicate detection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DocumentUploadService, { UploadProgress } from '../../services/documents/DocumentUploadService';
import { documentOCRService } from '../../services/documents/DocumentOCRService';
import { documentClassificationService } from '../../services/documents/DocumentClassificationService';
import { addDocument, updateDocument } from '../../store/slices/documentSlice';
import DatabaseService from '../../services/database/DatabaseService';

interface UploadItem extends UploadProgress {
  documentId?: string;
}

/**
 * Enhanced OCR and Classification processing
 */
async function processDocumentWithOCRAndClassification(
  documentId: string, 
  fileUri: string, 
  mimeType: string
): Promise<void> {
  try {
    console.log(`🤖 Starting enhanced processing for document ${documentId}...`);
    
    // Step 1: Perform OCR
    let ocrResult;
    if (mimeType.startsWith('image/')) {
      ocrResult = await documentOCRService.extractTextFromImage(fileUri);
    } else if (mimeType === 'application/pdf') {
      const results = await documentOCRService.extractTextFromPDF(fileUri);
      ocrResult = results[0]; // Use first page for now
    } else {
      console.log('⚠️ Unsupported file type for OCR:', mimeType);
      return;
    }

    console.log(`✅ OCR completed. Confidence: ${ocrResult.confidence}%`);
    
    // Step 2: Intelligent Classification and Analysis
    const classificationResult = await documentClassificationService.classifyDocument(ocrResult);
    
    console.log(`🧠 Classification completed: ${classificationResult.documentType} (${Math.round(classificationResult.confidence * 100)}%)`);
    console.log(`📁 Suggested category: ${classificationResult.suggestedCategory}`);
    console.log(`🔍 Key insights: ${classificationResult.keyInsights.length} insights generated`);
    
    // Step 3: Update document with comprehensive results
    const enhancedUpdateData = {
      // OCR Results
      ocrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      ocrWords: ocrResult.words,
      
      // Classification Results
      documentType: classificationResult.documentType,
      typeConfidence: classificationResult.confidence,
      suggestedCategory: classificationResult.suggestedCategory,
      categoryConfidence: classificationResult.categoryConfidence,
      
      // Enhanced Metadata
      extractedData: {
        ...ocrResult.extractedData,
        ...classificationResult.extractedMetadata
      },
      
      // AI Insights
      keyInsights: classificationResult.keyInsights,
      processingMetrics: {
        ocrProcessingTime: Date.now(), // Would track actual time
        classificationTime: classificationResult.processingTime,
        totalProcessingTime: classificationResult.processingTime,
      },
      
      // Processing Status
      enhancedProcessing: true,
      processedAt: new Date().toISOString(),
      
      // Quick Access Fields
      hasAmounts: classificationResult.extractedMetadata.amounts?.length > 0,
      hasDates: classificationResult.extractedMetadata.dates?.length > 0,
      hasEntities: classificationResult.extractedMetadata.entities?.length > 0,
      requiresAttention: classificationResult.keyInsights.some(insight => insight.actionable),
      confidenceScore: Math.round((ocrResult.confidence + classificationResult.confidence * 100) / 2)
    };

    // Dispatch update to Redux store
    const { store } = await import('../../store');
    store.dispatch(updateDocument({ id: documentId, updates: enhancedUpdateData }));

    console.log(`🎉 Enhanced processing completed for document ${documentId}`);
    console.log(`📊 Confidence Score: ${enhancedUpdateData.confidenceScore}%`);
    console.log(`🎯 Document Type: ${classificationResult.documentType}`);
    console.log(`📁 Suggested Category: ${classificationResult.suggestedCategory} (${Math.round(classificationResult.categoryConfidence * 100)}%)`);
    
    // Log key insights for debugging
    if (classificationResult.keyInsights.length > 0) {
      console.log('💡 Key Insights:');
      classificationResult.keyInsights.forEach((insight, index) => {
        console.log(`  ${index + 1}. ${insight.title}: ${insight.description} (${Math.round(insight.confidence * 100)}%)`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Enhanced processing failed for document ${documentId}:`, error);
    
    // Update document with error status but don't fail completely
    const { store } = await import('../../store');
    store.dispatch(updateDocument({ 
      id: documentId, 
      updates: { 
        processingError: error.message,
        processedAt: new Date().toISOString(),
        enhancedProcessing: false
      } 
    }));
    
    throw error; // Re-throw for caller handling
  }
}

export default function DocumentUploadScreen({ route, navigation }: any) {
  const { categoryId, scannedDocuments } = route?.params || {};
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);
  const { categories } = useSelector((state: any) => state.document);

  // Debug authentication state
  React.useEffect(() => {
    console.log('📤 DocumentUpload: Auth state check');
    console.log('📤 isAuthenticated:', isAuthenticated);
    console.log('📤 user:', user ? `${user.firstName} (${user.id})` : 'null');
    console.log('📤 categories:', categories.length);
    
    // If user is not authenticated, redirect to login
    if (!isAuthenticated || !user?.id) {
      Alert.alert(
        'Authentication Required',
        'Please log in to upload documents',
        [
          { text: 'OK', onPress: () => navigation.navigate('Auth') }
        ]
      );
    }
  }, [isAuthenticated, user, categories]);

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(categoryId);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const getCategoryName = () => {
    if (!selectedCategory) return 'Select Category';
    const category = categories.find((cat: any) => cat.id === selectedCategory);
    return category?.name || 'Unknown Category';
  };

  useEffect(() => {
    // Load categories if not already loaded
    if (user?.id) {
      console.log('📁 DocumentUpload: Loading categories for user:', user.id);
      console.log('📁 Current categories in state:', categories.length);
      
      if (categories.length === 0) {
        DatabaseService.getInstance().getCategoryTree(user.id).then(async (cats) => {
          console.log('📁 Loaded categories from DB:', cats.length);
          
          // If no categories exist, create some default ones
          if (cats.length === 0) {
            console.log('📁 No categories found - creating defaults');
            try {
              const defaultCategories = [
                { name: 'Documents', icon: 'folder', color: '#4A90E2' },
                { name: 'Receipts', icon: 'receipt', color: '#34C759' },
                { name: 'Invoices', icon: 'document', color: '#FF9500' },
                { name: 'Contracts', icon: 'contract', color: '#AF52DE' }
              ];
              
              const createdCategories = [];
              for (const catData of defaultCategories) {
                const newCat = await DatabaseService.getInstance().createCategory({
                  ...catData,
                  parentId: null,
                  userId: user.id
                });
                createdCategories.push(newCat);
              }
              
              console.log('📁 Created default categories:', createdCategories.length);
              dispatch({ type: 'document/setCategories', payload: createdCategories });
            } catch (error) {
              console.error('❌ Error creating default categories:', error);
            }
          } else {
            dispatch({ type: 'document/setCategories', payload: cats });
          }
        }).catch(error => {
          console.error('❌ Error loading categories:', error);
        });
      }
    } else {
      console.log('⚠️ DocumentUpload: No user ID available');
    }
  }, [user?.id, categories.length]);

  useEffect(() => {
    // Handle scanned documents from scanner
    if (scannedDocuments && scannedDocuments.length > 0) {
      handleScannedDocuments(scannedDocuments);
    }
  }, [scannedDocuments]);

  const handlePickDocuments = async () => {
    // Require category selection first
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category before choosing files');
      setShowCategoryPicker(true);
      return;
    }

    try {
      // Use comprehensive document source options (Files, Camera, Gallery)
      const files = await DocumentUploadService.showDocumentSourceOptions({
        allowMultipleFiles: true,
        allowMultiplePhotos: true
      });

      if (files.length === 0) {
        return; // User cancelled
      }

      console.log('📁 Picked files:', files.map(f => ({ name: f.name, size: f.size, type: f.type, mimeType: f.mimeType })));

      await handleFiles(files);

      setUploads(initialUploads);

      // Upload files one by one
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const result = await DocumentUploadService.uploadDocument({
            file: {
              uri: file.uri,
              name: file.name,
              type: file.type || file.mimeType,
              size: file.size,
            },
            categoryId: selectedCategory,
            userId: user.id,
            onProgress: (progress) => {
              setUploads(prev =>
                prev.map(item =>
                  item.fileName === progress.fileName ? { ...item, ...progress } : item
                )
              );
            },
          });

          if (result.success && result.document) {
            // Update upload item with document ID
            setUploads(prev =>
              prev.map(item =>
                item.fileName === file.name ? { ...item, documentId: result.document.id } : item
              )
            );

            // Add the document directly to Redux (no need to fetch from DB again)
            dispatch(addDocument(result.document));

            // Start OCR processing in background for supported file types
            if (result.document.mimeType.startsWith('image/') || result.document.mimeType === 'application/pdf') {
              console.log(`🔍 Starting enhanced OCR and classification processing for ${result.document.name}...`);
              processDocumentWithOCRAndClassification(
                result.document.id,
                result.document.filePath,
                result.document.mimeType
              ).catch(error => {
                console.error('OCR and classification processing failed:', error);
                // OCR failure doesn't affect upload success
              });
            }

            results.push({ success: true, fileName: file.name });
          } else {
            results.push({ success: false, fileName: file.name, error: result.error });
          }
        } catch (error) {
          const fileName = file?.name || 'Unknown file';
          console.error(`Upload error for ${fileName}:`, error);
          results.push({
            success: false,
            fileName: fileName,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setIsUploading(false);

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        Alert.alert(
          'Upload Complete',
          `Successfully uploaded ${successCount} document${successCount === 1 ? '' : 's'}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        const failedFiles = results.filter(r => !r.success);
        Alert.alert(
          'Upload Completed with Errors',
          `Successful: ${successCount}\nFailed: ${failCount}\n\nFailed files:\n${failedFiles
            .map(f => `• ${f.fileName}: ${f.error}`)
            .join('\n')}`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (successCount > 0) {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error picking documents:', error);
      Alert.alert('Error', 'Failed to select documents');
      setIsUploading(false);
    }
  };

  const handleFiles = async (files: any[]) => {
    try {
      setIsUploading(true);

      // Initialize upload items
      const initialUploads: UploadItem[] = files.map((file) => ({
        fileId: `${Date.now()}_${file.name}`,
        fileName: file.name || 'unknown',
        totalSize: file.size || 0,
        uploadedSize: 0,
        percentage: 0,
        status: 'pending' as const,
      }));

      setUploads(initialUploads);

      // Upload files one by one
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const result = await DocumentUploadService.uploadDocument({
            file: {
              uri: file.uri,
              name: file.name,
              type: file.type || file.mimeType,
              size: file.size,
            },
            categoryId: selectedCategory,
            userId: user.id,
            onProgress: (progress) => {
              setUploads(prev =>
                prev.map(item =>
                  item.fileName === progress.fileName ? { ...item, ...progress } : item
                )
              );
            },
          });

          if (result.success && result.document) {
            setUploads(prev =>
              prev.map(item =>
                item.fileName === file.name ? { ...item, documentId: result.document.id } : item
              )
            );

            dispatch(addDocument(result.document));
            results.push({ success: true, fileName: file.name });
          } else {
            results.push({ success: false, fileName: file.name, error: result.error });
          }
        } catch (error) {
          const fileName = file?.name || 'Unknown file';
          console.error('Error uploading file:', fileName, error);
          setUploads(prev =>
            prev.map(item =>
              item.fileName === fileName
                ? { ...item, status: 'failed' as const, error: String(error) }
                : item
            )
          );
          results.push({ success: false, fileName, error: String(error) });
        }
      }

      setIsUploading(false);

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        Alert.alert(
          'Upload Complete',
          `Successfully uploaded ${successCount} document${successCount === 1 ? '' : 's'}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        const failedFiles = results.filter(r => !r.success);
        Alert.alert(
          'Upload Completed with Errors',
          `Successful: ${successCount}\\nFailed: ${failCount}\\n\\nFailed files:\\n${failedFiles
            .map(f => `• ${f.fileName}: ${f.error}`)
            .join('\\n')}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error handling files:', error);
      Alert.alert('Upload Error', 'Failed to process files');
      setIsUploading(false);
    }
  };

  const handleScannedDocuments = async (scannedFiles: any[]) => {
    // Require category selection first
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category for scanned documents');
      setShowCategoryPicker(true);
      return;
    }

    try {
      console.log('📷 Processing scanned documents:', scannedFiles.length);

      setIsUploading(true);

      // Initialize upload items for scanned documents
      const initialUploads: UploadItem[] = scannedFiles.map((file) => ({
        fileId: `scan_${Date.now()}_${file.name}`,
        fileName: file.name || 'scanned_document.jpg',
        totalSize: file.size || 0,
        uploadedSize: 0,
        percentage: 0,
        status: 'pending' as const,
      }));

      setUploads(initialUploads);

      // Upload scanned files
      const results = [];
      for (let i = 0; i < scannedFiles.length; i++) {
        const file = scannedFiles[i];
        
        try {
          const result = await DocumentUploadService.uploadDocument({
            file: {
              uri: file.uri,
              name: file.name,
              type: file.type || 'image/jpeg',
              size: file.size || 0,
            },
            categoryId: selectedCategory,
            userId: user.id,
            onProgress: (progress) => {
              setUploads(prev =>
                prev.map(item =>
                  item.fileName === progress.fileName ? { ...item, ...progress } : item
                )
              );
            },
          });

          if (result.success && result.document) {
            setUploads(prev =>
              prev.map(item =>
                item.fileName === file.name ? { ...item, documentId: result.document.id } : item
              )
            );

            dispatch(addDocument(result.document));
            results.push({ success: true, fileName: file.name });
          } else {
            results.push({ success: false, fileName: file.name, error: result.error });
          }
        } catch (error) {
          const fileName = file?.name || 'Unknown file';
          console.error(`Upload error for scanned ${fileName}:`, error);
          results.push({
            success: false,
            fileName: fileName,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setIsUploading(false);

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        Alert.alert(
          'Scanned Documents Uploaded',
          `Successfully uploaded ${successCount} scanned document${successCount === 1 ? '' : 's'}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Upload Completed with Errors',
          `Successful: ${successCount}\nFailed: ${failCount}`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (successCount > 0) {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing scanned documents:', error);
      Alert.alert('Error', 'Failed to process scanned documents');
      setIsUploading(false);
    }
  };

  const renderUploadItem = ({ item }: { item: UploadItem }) => {
    const getStatusIcon = () => {
      switch (item.status) {
        case 'completed':
          return '✅';
        case 'failed':
          return '❌';
        case 'cancelled':
          return '⏸️';
        case 'uploading':
        case 'processing':
          return '⏳';
        default:
          return '📄';
      }
    };

    const getStatusColor = () => {
      switch (item.status) {
        case 'completed':
          return '#4CAF50';
        case 'failed':
          return '#F44336';
        case 'cancelled':
          return '#9E9E9E';
        default:
          return '#2196F3';
      }
    };

    return (
      <View style={styles.uploadItem}>
        <Text style={styles.uploadIcon}>{getStatusIcon()}</Text>
        <View style={styles.uploadInfo}>
          <Text style={styles.uploadFileName} numberOfLines={1}>
            {item.fileName}
          </Text>
          <Text style={styles.uploadSize}>
            {(item.totalSize / 1024).toFixed(1)} KB
          </Text>
          {item.status === 'failed' && item.error && (
            <Text style={styles.uploadError}>{item.error}</Text>
          )}
        </View>
        <View style={styles.uploadProgress}>
          <Text style={[styles.uploadPercentage, { color: getStatusColor() }]}>
            {item.percentage}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.percentage}%`, backgroundColor: getStatusColor() },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload to Category</Text>
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryIconText}>📁</Text>
            </View>
            <Text style={[styles.categoryName, !selectedCategory && styles.categoryNamePlaceholder]}>
              {getCategoryName()}
            </Text>
            <Text style={styles.categoryArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Instructions */}
        {uploads.length === 0 && !isUploading && (
          <View style={styles.section}>
            <Text style={styles.instructionsTitle}>Upload Instructions</Text>
            <Text style={styles.instructionsText}>• Select one or multiple files</Text>
            <Text style={styles.instructionsText}>• Maximum file size: 50MB</Text>
            <Text style={styles.instructionsText}>
              • Supported formats: PDF, Images, Office documents
            </Text>
            <Text style={styles.instructionsText}>• Files will be encrypted automatically</Text>
            <Text style={styles.instructionsText}>• Duplicate files will be detected</Text>
          </View>
        )}

        {/* Upload List */}
        {uploads.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Progress</Text>
            <FlatList
              data={uploads}
              renderItem={renderUploadItem}
              keyExtractor={(item) => item.fileId}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Document Input Options */}
        {!isUploading && uploads.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Documents</Text>
            <Text style={styles.sectionSubtitle}>Choose how you want to add documents:</Text>
            
            {/* Primary Action: Comprehensive Options */}
            <TouchableOpacity style={styles.primaryButton} onPress={handlePickDocuments}>
              <Text style={styles.primaryButtonIcon}>📂</Text>
              <View style={styles.primaryButtonContent}>
                <Text style={styles.primaryButtonText}>Add Documents</Text>
                <Text style={styles.primaryButtonSubtext}>Files, Camera, or Gallery</Text>
              </View>
              <Text style={styles.primaryButtonArrow}>›</Text>
            </TouchableOpacity>
            
            {/* Quick Action Buttons */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity 
                style={styles.quickActionButton} 
                onPress={async () => {
                  if (!selectedCategory) {
                    Alert.alert('Select Category', 'Please select a category first');
                    setShowCategoryPicker(true);
                    return;
                  }
                  try {
                    const files = await DocumentUploadService.takePhoto();
                    if (files.length > 0) {
                      handleFiles(files);
                    }
                  } catch (error) {
                    Alert.alert('Camera Error', 'Failed to take photo');
                  }
                }}
              >
                <Text style={styles.quickActionIcon}>📸</Text>
                <Text style={styles.quickActionText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={async () => {
                  if (!selectedCategory) {
                    Alert.alert('Select Category', 'Please select a category first');
                    setShowCategoryPicker(true);
                    return;
                  }
                  try {
                    const files = await DocumentUploadService.selectFromGallery(true);
                    if (files.length > 0) {
                      handleFiles(files);
                    }
                  } catch (error) {
                    Alert.alert('Gallery Error', 'Failed to select from gallery');
                  }
                }}
              >
                <Text style={styles.quickActionIcon}>�️</Text>
                <Text style={styles.quickActionText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={async () => {
                  if (!selectedCategory) {
                    Alert.alert('Select Category', 'Please select a category first');
                    setShowCategoryPicker(true);
                    return;
                  }
                  try {
                    const files = await DocumentUploadService.pickDocuments();
                    if (files.length > 0) {
                      handleFiles(files);
                    }
                  } catch (error) {
                    Alert.alert('File Error', 'Failed to select files');
                  }
                }}
              >
                <Text style={styles.quickActionIcon}>📁</Text>
                <Text style={styles.quickActionText}>Files</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Uploading Indicator */}
        {isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.uploadingText}>Uploading documents...</Text>
          </View>
        )}
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            
            <ScrollView style={styles.categoryList}>
              {categories.length === 0 ? (
                <View style={styles.emptyCategoryState}>
                  <Text style={styles.emptyCategoryText}>No categories available</Text>
                  <TouchableOpacity
                    style={styles.createCategoryButton}
                    onPress={() => {
                      setShowCategoryPicker(false);
                      navigation.navigate('CategoryManagement');
                    }}
                  >
                    <Text style={styles.createCategoryButtonText}>Create Category</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                categories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === cat.id && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={[styles.categoryOptionIcon, { backgroundColor: cat.color }]}>
                      <Text style={styles.categoryOptionIconText}>📁</Text>
                    </View>
                    <Text style={styles.categoryOptionName}>{cat.name}</Text>
                    {selectedCategory === cat.id && (
                      <Text style={styles.categoryOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    color: '#2196F3',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  selectButton: {
    margin: 16,
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  selectButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  selectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // New Enhanced UI Styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  primaryButtonContent: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontSize: 12,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  primaryButtonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
  uploadItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  uploadSize: {
    fontSize: 12,
    color: '#999999',
  },
  uploadError: {
    fontSize: 11,
    color: '#F44336',
    marginTop: 2,
  },
  uploadProgress: {
    width: 80,
    alignItems: 'flex-end',
  },
  uploadPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  uploadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  categoryArrow: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  categoryNamePlaceholder: {
    color: '#999999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  categoryList: {
    maxHeight: 400,
  },
  emptyCategoryState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  createCategoryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createCategoryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  categoryOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  categoryOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryOptionIconText: {
    fontSize: 20,
  },
  categoryOptionName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  categoryOptionCheck: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
});
