// @ts-nocheck
/**
 * DocumentScannerScreen - Camera-based document scanning with edge detection
 * Features: Document boundary detection, perspective correction, multi-page scanning
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Polygon } from 'react-native-svg';
import { documentOCRService, OCRResult } from '../../services/documents/DocumentOCRService';
import { DocumentStorageService } from '../../services/storage/DocumentStorageService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ScanPoint {
  x: number;
  y: number;
}

interface DetectedDocument {
  corners: ScanPoint[];
  confidence: number;
}

interface ScannedDocument {
  id: string;
  uri: string;
  originalUri: string;
  timestamp: number;
  processed: boolean;
  ocrResult?: OCRResult;
  ocrProcessing?: boolean;
}

export default function DocumentScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId } = (route.params as any) || {};
  
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([]);
  
  // Debug state changes
  useEffect(() => {
    console.log('🔄 ScannedDocuments state changed:', scannedDocuments.length, 'documents');
    scannedDocuments.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.id} - OCR: ${doc.ocrResult ? 'Complete' : (doc.ocrProcessing ? 'Processing' : 'Pending')}`);
    });
  }, [scannedDocuments]);
  const [detectedDocument, setDetectedDocument] = useState<DetectedDocument | null>(null);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [autoCapture, setAutoCapture] = useState(false);

  // Mock document detection for demo purposes
  // In production, this would use actual edge detection algorithms
  const mockDetectDocument = (): DetectedDocument => {
    const centerX = screenWidth / 2;
    const centerY = (screenHeight - 200) / 2; // Account for UI elements
    const width = screenWidth * 0.7;
    const height = width * 0.75; // A4 ratio approximately

    return {
      corners: [
        { x: centerX - width/2, y: centerY - height/2 }, // Top-left
        { x: centerX + width/2, y: centerY - height/2 }, // Top-right
        { x: centerX + width/2, y: centerY + height/2 }, // Bottom-right
        { x: centerX - width/2, y: centerY + height/2 }, // Bottom-left
      ],
      confidence: 0.85,
    };
  };

  useEffect(() => {
    // Request permissions on mount
    if (!permission?.granted) {
      requestPermission();
    }
    if (!mediaPermission?.granted) {
      requestMediaPermission();
    }

    // Simulate document detection
    const interval = setInterval(() => {
      if (!isCapturing && !isProcessing) {
        const detected = mockDetectDocument();
        setDetectedDocument(detected);
        
        // Auto-capture if enabled and confidence is high
        if (autoCapture && detected.confidence > 0.8) {
          console.log('🚀 Auto-capture triggered with confidence:', detected.confidence);
          handleCapture();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCapturing, isProcessing, autoCapture, permission, mediaPermission]);

  // Debug: Track scannedDocuments changes
  useEffect(() => {
    console.log('🔄 ScannedDocuments state changed:', scannedDocuments.length, 'documents');
    scannedDocuments.forEach((doc, index) => {
      console.log(`  Document ${index + 1}: ${doc.id} (processing: ${doc.ocrProcessing})`);
    });
  }, [scannedDocuments]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || isProcessing) {
      console.log('❌ Capture blocked - camera ref:', !!cameraRef.current, 'capturing:', isCapturing, 'processing:', isProcessing);
      return;
    }

    try {
      console.log('📸 Starting capture...');
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log('📸 Photo taken:', !!photo?.uri);
      if (photo?.uri) {
        await processScannedImage(photo.uri);
      } else {
        console.log('❌ No photo URI received');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const processScannedImage = async (imageUri: string) => {
    try {
      console.log('🔄 Processing scanned image:', imageUri);
      setIsProcessing(true);

      // For demo purposes, we'll just resize and enhance the image
      // In production, this would include perspective correction based on detected corners
      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }, // Standardize width
          { rotate: 0 }, // Would rotate based on detection
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const documentId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store document permanently on device
      const storedDocument = await DocumentStorageService.storeDocument(processedImage.uri, documentId);
      
      const scannedDoc: ScannedDocument = {
        id: documentId,
        uri: storedDocument.uri, // Use permanent storage URI
        originalUri: imageUri,
        timestamp: Date.now(),
        processed: true,
        ocrProcessing: true,
      };

      console.log('📄 Created and stored scanned document:', {
        id: scannedDoc.id,
        location: storedDocument.uri,
        size: Math.round(storedDocument.size / 1024) + 'KB'
      });
      
      setScannedDocuments(prev => {
        const newDocs = [...prev, scannedDoc];
        console.log('📋 Updated scanned documents count:', newDocs.length);
        console.log('📋 Previous docs:', prev.length, 'New docs array:', newDocs);
        console.log('📋 New document ID:', scannedDoc.id);
        return newDocs;
      });
      
      // Start OCR processing in background
      processOCR(scannedDoc.id, processedImage.uri);
      
      // Show success feedback with storage info
      Alert.alert(
        'Document Scanned & Stored! 📄',
        `Document saved to device storage:\n• App Documents: ${storedDocument.filename}\n• Size: ${Math.round(storedDocument.size / 1024)}KB\n${Platform.OS === 'android' ? '• Gallery: DocShelf album (if permission granted)' : ''}\n\nOCR processing is running in the background.`,
        [
          { text: 'Scan Another', style: 'default' },
          { 
            text: 'Review All Scans', 
            onPress: () => navigation.navigate('DocumentReviewHub' as never),
            style: 'default'
          },
        ]
      );

    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process scanned image');
    } finally {
      setIsProcessing(false);
    }
  };

  const processOCR = async (documentId: string, imageUri: string) => {
    try {
      console.log('🔍 Starting OCR processing for scanned document...');
      
      // Perform OCR on the scanned image
      const ocrResult = await documentOCRService.extractTextFromImage(imageUri);
      
      // Update the scanned document with OCR results
      setScannedDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, ocrResult, ocrProcessing: false }
            : doc
        )
      );
      
      console.log('✅ OCR processing completed for scanned document');
      console.log(`Extracted text preview: "${ocrResult.text.substring(0, 100)}..."`);
      
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      
      // Update document with error status but keep it in the array
      setScannedDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                ocrProcessing: false,
                ocrResult: {
                  text: 'OCR processing failed. Document captured but text extraction unsuccessful.',
                  confidence: 0.0,
                  words: [],
                  documentType: 'other' as DocumentType,
                  extractedData: {}
                }
              }
            : doc
        )
      );
      
      Alert.alert(
        'OCR Processing Failed',
        'Document was captured but text extraction failed. You can still upload the document image.',
        [{ text: 'OK' }]
      );
    }
  };

  const showScanReview = () => {
    // Use setState callback to get the current state value
    setScannedDocuments(currentDocs => {
      console.log('🔍 Showing scan review - scanned documents:', currentDocs);
      console.log('📊 Scanned documents count:', currentDocs.length);
      
      const ocrCount = currentDocs.filter(doc => doc.ocrResult).length;
      const processingCount = currentDocs.filter(doc => doc.ocrProcessing).length;
      
      console.log('📊 OCR count:', ocrCount, 'Processing count:', processingCount);
      
      let message = `You have ${currentDocs.length} scanned document(s).`;
      if (ocrCount > 0) {
        message += ` ${ocrCount} have been processed with OCR.`;
      }
      if (processingCount > 0) {
        message += ` ${processingCount} are still being processed.`;
      }
      message += ' Would you like to upload them now?';
      
      // Show the alert with current state
      Alert.alert(
        'Scan Review',
        message,
        [
          { text: 'Continue Scanning', style: 'cancel' },
          { 
            text: 'View OCR Results', 
            onPress: () => navigateToOCRResults(currentDocs),
            style: 'default'
          },
          { 
            text: 'Upload Now', 
            onPress: () => navigateToUpload(currentDocs),
            style: 'default'
          },
        ]
      );
      
      // Return the same array (no state change)
      return currentDocs;
    });
  };

  const navigateToOCRResults = (currentDocs = scannedDocuments) => {
    const processedDocuments = currentDocs.filter(doc => doc.ocrResult);
    if (processedDocuments.length === 0) {
      Alert.alert('No OCR Results', 'No documents have been processed with OCR yet.');
      return;
    }
    
    // Navigate to OCR results screen with the first processed document
    navigation.navigate('OCRResults' as never, { 
      ocrResult: processedDocuments[0].ocrResult,
      documentUri: processedDocuments[0].uri,
      documentId: processedDocuments[0].id,
    } as never);
  };

  const navigateToUpload = (currentDocs = scannedDocuments) => {
    // Convert scanned documents to upload format and navigate
    const documentsForUpload = currentDocs.map(doc => ({
      uri: doc.uri,
      name: `scanned_document_${new Date(doc.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`,
      type: 'image/jpeg',
      size: 0, // Would calculate actual size
    }));

    navigation.navigate('DocumentUpload' as never, { 
      categoryId,
      scannedDocuments: documentsForUpload,
    } as never);
  };

  const toggleFlash = () => {
    setFlashMode(current => current === 'off' ? 'on' : 'off');
  };

  const toggleAutoCapture = () => {
    setAutoCapture(current => !current);
  };

  const renderDocumentOverlay = () => {
    if (!detectedDocument) return null;

    const points = detectedDocument.corners
      .map(point => `${point.x},${point.y}`)
      .join(' ');

    const confidence = detectedDocument.confidence;
    const color = confidence > 0.8 ? '#4CAF50' : confidence > 0.6 ? '#FF9800' : '#F44336';

    return (
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={screenWidth}
        height={screenHeight}
      >
        <Polygon
          points={points}
          fill="transparent"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="10,5"
        />
      </Svg>
    );
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionMessage}>
          Camera access is needed to scan documents. Please grant permission to continue.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Storage Info Button */}
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: '#4CAF50', right: 60 }]}
          onPress={() => navigation.navigate('DocumentStorage' as never)}
        >
          <Text style={styles.headerButtonText}>📂</Text>
        </TouchableOpacity>
        
        {/* Debug Test Button - Remove in production */}
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: '#FF6B6B', right: 120 }]}
          onPress={() => {
            console.log('🧪 Adding test document');
            const testDoc: ScannedDocument = {
              id: `test_${Date.now()}`,
              uri: 'test://uri',
              originalUri: 'test://original',
              timestamp: Date.now(),
              processed: true,
              ocrProcessing: false,
              ocrResult: {
                text: 'Test document text',
                confidence: 0.95,
                engine: 'test',
                timestamp: Date.now(),
              }
            };
            setScannedDocuments(prev => {
              const newDocs = [...prev, testDoc];
              console.log('🧪 Test docs added, new count:', newDocs.length);
              return newDocs;
            });
          }}
        >
          <Text style={[styles.headerButtonText, { fontSize: 12 }]}>TEST</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Scan Document</Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={toggleFlash}
        >
          <Text style={styles.headerButtonText}>
            {flashMode === 'on' ? '⚡' : '○'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flashMode}
        />
        
        {/* Overlay elements positioned absolutely over camera */}
        {renderDocumentOverlay()}
        
        {/* Detection Status */}
        <View style={styles.detectionStatus}>
          <View style={[
            styles.detectionIndicator,
            { backgroundColor: detectedDocument?.confidence > 0.8 ? '#4CAF50' : '#FF9800' }
          ]} />
          <Text style={styles.detectionText}>
            {detectedDocument?.confidence > 0.8 
              ? 'Document detected - Ready to scan'
              : 'Position document in frame'
            }
          </Text>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Processing scan...</Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleAutoCapture}
        >
          <Text style={[
            styles.controlButtonText,
            { color: autoCapture ? '#4CAF50' : '#FFFFFF' }
          ]}>
            AUTO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.captureButton,
            (isCapturing || isProcessing) && styles.captureButtonDisabled
          ]}
          onPress={handleCapture}
          disabled={isCapturing || isProcessing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            // Use setState callback to get current count
            setScannedDocuments(currentDocs => {
              console.log('🔘 Review button pressed - current count:', currentDocs.length);
              if (currentDocs.length > 0) {
                navigation.navigate('DocumentReviewHub' as never);
              } else {
                Alert.alert('No Scans', 'No documents have been scanned yet.');
              }
              return currentDocs; // No state change
            });
          }}
        >
          <Text style={styles.controlButtonText}>
            {scannedDocuments.length > 0 
              ? `${scannedDocuments.length}${scannedDocuments.some(doc => doc.ocrProcessing) ? '⏳' : ''}` 
              : 'REVIEW'
            }
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: '#FF6B35' }]}
          onPress={() => {
            console.log('🧪 Adding test document...');
            const testDoc: ScannedDocument = {
              id: `test_${Date.now()}`,
              uri: 'test://mock-image.jpg',
              originalUri: 'test://mock-image.jpg',
              timestamp: Date.now(),
              processed: true,
              ocrProcessing: false,
              ocrResult: {
                text: 'Test document text',
                confidence: 0.95,
                words: [],
                documentType: 'other'
              }
            };
            setScannedDocuments(prev => [...prev, testDoc]);
            console.log('🧪 Test document added');
          }}
        >
          <Text style={styles.controlButtonText}>TEST</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Position document within the highlighted area
        </Text>
        {detectedDocument?.confidence > 0.8 && (
          <Text style={styles.instructionSubtext}>
            Tap capture or enable auto-scan
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  detectionStatus: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  detectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  detectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
  },
  instructions: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  instructionSubtext: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});