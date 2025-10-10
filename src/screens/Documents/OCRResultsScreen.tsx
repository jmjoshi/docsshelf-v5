// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { updateDocument } from '../../store/slices/documentSlice';
import { DocumentOCRService, OCRResult, SmartCategorizationResult } from '../../services/documents/DocumentOCRService';
import DocumentClassificationService, { ClassificationResult, KeyInsight } from '../../services/documents/DocumentClassificationService';
import { theme } from '../../config/theme';

type RootStackParamList = {
  OCRResults: {
    documentId: string;
    imageUri: string;
    ocrResult: OCRResult;
  };
};

type OCRResultsScreenRouteProp = RouteProp<RootStackParamList, 'OCRResults'>;
type OCRResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OCRResults'>;

interface Props {
  route: OCRResultsScreenRouteProp;
  navigation: OCRResultsScreenNavigationProp;
}

const OCRResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { documentId, imageUri, ocrResult: initialOCRResult } = route.params;
  const dispatch = useDispatch();
  
  const [ocrResult, setOcrResult] = useState<OCRResult>(initialOCRResult);
  const [editedText, setEditedText] = useState(initialOCRResult.text);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<SmartCategorizationResult | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(true);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const document = useSelector((state: RootState) => 
    state.document.documents.find(doc => doc.id === documentId)
  );

  const categories = useSelector((state: RootState) => state.document.categories);

  useEffect(() => {
    loadEnhancedAnalysis();
  }, []);

  const loadEnhancedAnalysis = async () => {
    try {
      setIsLoadingSuggestion(true);
      setIsClassifying(true);

      // Run OCR category suggestion first
      let categorySuggestion = null;
      try {
        categorySuggestion = await loadCategorySuggestion();
        setCategorySuggestion(categorySuggestion);
      } catch (error) {
        console.error('Failed to load category suggestion:', error);
      }

      // Run enhanced classification separately
      let classificationResult = null;
      try {
        classificationResult = await loadClassification();
        setClassificationResult(classificationResult);
      } catch (error) {
        console.error('Failed to load classification:', error);
      }

    } catch (error) {
      console.error('Failed to load enhanced analysis:', error);
    } finally {
      setIsLoadingSuggestion(false);
      setIsClassifying(false);
    }
  };

  const loadCategorySuggestion = async (): Promise<SmartCategorizationResult> => {
    try {
      console.log('� Starting smart category suggestion...');
      
      // Use categories from component selector (already available)
      console.log('📂 Available categories:', categories.length);
      
      const documentType = ocrResult?.documentType || 'other';
      const text = ocrResult?.text || '';
      
      // Category mapping based on document type
      const categoryMap: { [key: string]: string[] } = {
        'invoice': ['Business', 'Invoices', 'Expenses', 'Finance'],
        'receipt': ['Receipts', 'Personal', 'Expenses', 'Shopping'],
        'contract': ['Legal', 'Contracts', 'Business', 'Important'],
        'statement': ['Financial', 'Financial Statements', 'Banking', 'Finance'],
        'letter': ['Correspondence', 'Personal', 'Communication'],
        'form': ['Forms', 'Government', 'Applications', 'Personal'],
        'other': ['General', 'Miscellaneous', 'Business']
      };
      
      const suggestedCategories = categoryMap[documentType] || categoryMap.other;
      let bestMatch = suggestedCategories[0];
      let confidence = 0.7;
      
      // Check if any existing categories match the suggestions
      if (categories && categories.length > 0) {
        for (const category of categories) {
          for (const suggestion of suggestedCategories) {
            if (category.name.toLowerCase().includes(suggestion.toLowerCase()) ||
                suggestion.toLowerCase().includes(category.name.toLowerCase())) {
              bestMatch = category.name;
              confidence = 0.9;
              break;
            }
          }
          if (confidence > 0.8) break;
        }
      }
      
      // Content-based enhancement
      const lowercaseText = text.toLowerCase();
      if (lowercaseText.includes('medical') || lowercaseText.includes('health')) {
        bestMatch = 'Medical';
        confidence = 0.85;
      } else if (lowercaseText.includes('tax') || lowercaseText.includes('irs')) {
        bestMatch = 'Tax Documents';
        confidence = 0.85;
      } else if (lowercaseText.includes('insurance')) {
        bestMatch = 'Insurance';
        confidence = 0.85;
      }
      
      console.log(`✅ Category suggestion completed: ${bestMatch} (${Math.round(confidence * 100)}% confidence)`);
      
      return {
        suggestedCategory: bestMatch,
        confidence,
        reasoning: `Based on document type (${documentType}) and content analysis`,
        alternativeCategories: suggestedCategories.slice(1, 4).map(cat => ({
          name: cat,
          confidence: Math.max(0.2, confidence - 0.2)
        }))
      };
      
    } catch (error) {
      console.error('❌ Category suggestion failed:', error);
      
      // Simple fallback based on document type
      const documentType = ocrResult?.documentType || 'other';
      const fallbackMapping: { [key: string]: string } = {
        'invoice': 'Invoices',
        'receipt': 'Receipts',
        'contract': 'Contracts', 
        'statement': 'Financial Statements',
        'letter': 'Personal',
        'form': 'Personal',
        'other': 'Business'
      };
      
      return {
        suggestedCategory: fallbackMapping[documentType] || 'Business',
        confidence: 0.6,
        reasoning: 'Fallback suggestion based on document type',
        alternativeCategories: [
          { name: 'General', confidence: 0.4 },
          { name: 'Miscellaneous', confidence: 0.3 }
        ]
      };
    }
  };

  const loadClassification = async () => {
    try {
      const classificationService = new DocumentClassificationService();
      if (!classificationService || typeof classificationService.classifyDocument !== 'function') {
        console.error('❌ DocumentClassificationService not properly initialized');
        return null;
      }
      return await classificationService.classifyDocument(ocrResult);
    } catch (error) {
      console.error('❌ Classification service error:', error);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update document with edited OCR text
      const updateData = {
        ocrText: editedText,
        ocrConfidence: ocrResult.confidence,
        documentType: ocrResult.documentType,
        extractedData: ocrResult.extractedData,
        processedAt: new Date().toISOString(),
      };

      dispatch(updateDocument({ id: documentId, updates: updateData }));

      Alert.alert(
        'Success',
        'OCR results have been saved successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to save OCR results:', error);
      Alert.alert('Error', 'Failed to save OCR results. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplySuggestedCategory = () => {
    if (!categorySuggestion) return;

    Alert.alert(
      'Apply Suggested Category',
      `Apply category "${categorySuggestion.suggestedCategory}" to this document?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            // Find or create category
            const existingCategory = categories.find(
              cat => cat.name.toLowerCase() === categorySuggestion.suggestedCategory.toLowerCase()
            );

            const categoryId = existingCategory?.id || 'suggested-' + Date.now();

            dispatch(updateDocument({
              id: documentId,
              updates: { categoryId }
            }));

            Alert.alert('Success', 'Category applied successfully!');
          }
        }
      ]
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.colors.success;
    if (confidence >= 0.6) return theme.colors.warning;
    return theme.colors.error;
  };

  const getDocumentTypeIcon = (type: string) => {
    const iconMap = {
      invoice: 'receipt-outline',
      receipt: 'card-outline',
      contract: 'document-text-outline',
      statement: 'list-outline',
      letter: 'mail-outline',
      form: 'clipboard-outline',
      other: 'document-outline'
    };
    return iconMap[type] || 'document-outline';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OCR Results</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "pencil"} 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.documentImage} />
          </View>
        )}

        {/* OCR Confidence */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceHeader}>
            <Ionicons name="analytics-outline" size={20} color={theme.colors.text} />
            <Text style={styles.confidenceTitle}>OCR Confidence</Text>
          </View>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { 
                  width: `${ocrResult.confidence}%`,
                  backgroundColor: getConfidenceColor(ocrResult.confidence / 100)
                }
              ]} 
            />
          </View>
          <Text style={styles.confidenceText}>
            {Math.round(ocrResult.confidence)}% confident
          </Text>
        </View>

        {/* Document Type */}
        {ocrResult.documentType && (
          <View style={styles.documentTypeContainer}>
            <View style={styles.documentTypeHeader}>
              <Ionicons 
                name={getDocumentTypeIcon(ocrResult.documentType)} 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={styles.documentTypeTitle}>Document Type</Text>
            </View>
            <View style={styles.documentTypeBadge}>
              <Text style={styles.documentTypeText}>
                {ocrResult.documentType.charAt(0).toUpperCase() + ocrResult.documentType.slice(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Smart Category Suggestion */}
        <View style={styles.categoryContainer}>
          <View style={styles.categoryHeader}>
            <Ionicons name="pricetags-outline" size={20} color={theme.colors.text} />
            <Text style={styles.categoryTitle}>Smart Category Suggestion</Text>
          </View>
          
          {isLoadingSuggestion ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Analyzing content...</Text>
            </View>
          ) : categorySuggestion ? (
            <View style={styles.suggestionContainer}>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestedCategory}>
                  {categorySuggestion.suggestedCategory}
                </Text>
                <Text style={styles.suggestionReason}>
                  {categorySuggestion.reasoning}
                </Text>
                <Text style={styles.suggestionConfidence}>
                  {Math.round(categorySuggestion.confidence * 100)}% confidence
                </Text>
              </View>
              <TouchableOpacity
                style={styles.applyCategoryButton}
                onPress={handleApplySuggestedCategory}
              >
                <Text style={styles.applyCategoryText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noSuggestionText}>No category suggestion available</Text>
          )}
        </View>

        {/* AI Insights */}
        {classificationResult && classificationResult.keyInsights.length > 0 && (
          <View style={styles.insightsContainer}>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.warning} />
              <Text style={styles.insightsTitle}>AI Insights</Text>
              <View style={styles.insightsBadge}>
                <Text style={styles.insightsBadgeText}>{classificationResult.keyInsights.length}</Text>
              </View>
            </View>

            {classificationResult.keyInsights.map((insight, index) => (
              <View key={index} style={[
                styles.insightCard,
                insight.actionable && styles.insightCardActionable
              ]}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightIcon}>
                    <Text style={styles.insightIconText}>
                      {insight.type === 'amount' ? '💰' : 
                       insight.type === 'date' ? '📅' : 
                       insight.type === 'entity' ? '🏷️' : 
                       insight.type === 'keyword' ? '🔍' : '⚠️'}
                    </Text>
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                  </View>
                  <View style={styles.insightConfidence}>
                    <Text style={styles.insightConfidenceText}>
                      {Math.round(insight.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                {insight.actionable && (
                  <View style={styles.actionableIndicator}>
                    <Ionicons name="warning-outline" size={14} color={theme.colors.warning} />
                    <Text style={styles.actionableText}>Requires Attention</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Enhanced Classification Results */}
        {classificationResult && (
          <View style={styles.classificationContainer}>
            <View style={styles.classificationHeader}>
              <Ionicons name="scan-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.classificationTitle}>Enhanced Analysis</Text>
            </View>

            <View style={styles.classificationMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Processing Time</Text>
                <Text style={styles.metricValue}>{classificationResult.processingTime}ms</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Overall Confidence</Text>
                <Text style={[
                  styles.metricValue,
                  { color: getConfidenceColor(classificationResult.confidence) }
                ]}>
                  {Math.round(classificationResult.confidence * 100)}%
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Category Match</Text>
                <Text style={[
                  styles.metricValue,
                  { color: getConfidenceColor(classificationResult.categoryConfidence) }
                ]}>
                  {Math.round(classificationResult.categoryConfidence * 100)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Extracted Data */}
        {(ocrResult.extractedData || classificationResult?.extractedMetadata) && (
          <View style={styles.extractedDataContainer}>
            <View style={styles.extractedDataHeader}>
              <Ionicons name="analytics-outline" size={20} color={theme.colors.text} />
              <Text style={styles.extractedDataTitle}>Extracted Information</Text>
            </View>

            {/* Use enhanced metadata if available, fallback to OCR data */}
            {(() => {
              const metadata = classificationResult?.extractedMetadata || ocrResult.extractedData;
              return (
                <>
                  {/* Dates */}
                  {metadata.dates && metadata.dates.length > 0 && (
                    <View style={styles.dataSection}>
                      <Text style={styles.dataSectionTitle}>📅 Dates Found</Text>
                      {metadata.dates.map((date, index) => (
                        <Text key={index} style={styles.dataItem}>{date}</Text>
                      ))}
                    </View>
                  )}

                  {/* Amounts */}
                  {metadata.amounts && metadata.amounts.length > 0 && (
                    <View style={styles.dataSection}>
                      <Text style={styles.dataSectionTitle}>💰 Amounts Found</Text>
                      {metadata.amounts.map((amount, index) => (
                        <View key={index} style={styles.amountItem}>
                          <Text style={styles.dataItem}>
                            {amount.value.toFixed(2)} {amount.currency}
                            {amount.type && <Text style={styles.amountType}> ({amount.type})</Text>}
                          </Text>
                          <Text style={styles.amountContext}>{amount.context}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Entities */}
                  {metadata.entities && metadata.entities.length > 0 && (
                    <View style={styles.dataSection}>
                      <Text style={styles.dataSectionTitle}>🏷️ Entities Found</Text>
                      {metadata.entities.map((entity, index) => (
                        <View key={index} style={styles.entityItem}>
                          <Text style={styles.entityType}>{entity.type}</Text>
                          <Text style={styles.dataItem}>{entity.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Metadata */}
                  {metadata.metadata && Object.keys(metadata.metadata).length > 0 && (
                    <View style={styles.dataSection}>
                      <Text style={styles.dataSectionTitle}>📋 Document Metadata</Text>
                      {Object.entries(metadata.metadata).map(([key, value], index) => (
                        <View key={index} style={styles.metadataItem}>
                          <Text style={styles.metadataKey}>{key.replace(/_/g, ' ').toUpperCase()}:</Text>
                          <Text style={styles.metadataValue}>
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        )}

        {/* OCR Text */}
        <View style={styles.textContainer}>
          <View style={styles.textHeader}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
            <Text style={styles.textTitle}>Extracted Text</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editTextButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={editedText}
              onChangeText={setEditedText}
              multiline
              placeholder="Extracted text will appear here..."
              textAlignVertical="top"
            />
          ) : (
            <ScrollView style={styles.textContent} nestedScrollEnabled>
              <Text style={styles.extractedText}>
                {editedText || 'No text extracted'}
              </Text>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      {isEditing && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  confidenceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  documentTypeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  documentTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  documentTypeText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: theme.colors.textSecondary,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestedCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  suggestionReason: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  suggestionConfidence: {
    fontSize: 12,
    color: theme.colors.success,
  },
  applyCategoryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyCategoryText: {
    color: 'white',
    fontWeight: '500',
  },
  noSuggestionText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  extractedDataContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  extractedDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  extractedDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  dataSection: {
    marginBottom: 16,
  },
  dataSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  dataItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  amountItem: {
    marginBottom: 8,
  },
  amountContext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  entityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entityType: {
    fontSize: 12,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  textContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  editTextButton: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  textContent: {
    maxHeight: 300,
  },
  extractedText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // AI Insights Styles
  insightsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  insightsBadge: {
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  insightsBadgeText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  insightCardActionable: {
    borderLeftColor: theme.colors.warning,
    backgroundColor: theme.colors.warning + '05',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightIconText: {
    fontSize: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  insightConfidence: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  insightConfidenceText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionableText: {
    fontSize: 12,
    color: theme.colors.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Enhanced Classification Styles
  classificationContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  classificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  classificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  classificationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  // Enhanced metadata styles
  amountType: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  metadataKey: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 80,
  },
  metadataValue: {
    fontSize: 12,
    color: theme.colors.text,
    flex: 1,
  },
});

export default OCRResultsScreen;