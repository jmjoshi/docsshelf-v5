/**
 * Platform-Specific Document Scanner Component
 * Native version using device camera
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface DocumentScannerNativeProps {
  onDocumentScanned: (uri: string) => void;
  onError: (error: string) => void;
}

const DocumentScannerNative: React.FC<DocumentScannerNativeProps> = ({ 
  onDocumentScanned, 
  onError 
}) => {

  const handleCameraScan = () => {
    // Placeholder for camera integration
    // This would use expo-camera or react-native-camera in Phase 2
    Alert.alert(
      'Camera Scanner',
      'Camera integration will be implemented in Phase 2.\nFor now, this demonstrates platform-specific component loading.',
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  const handleGalleryPick = () => {
    // Placeholder for gallery picker
    // This would use expo-image-picker in Phase 2
    Alert.alert(
      'Gallery Picker',
      'Gallery integration will be implemented in Phase 2.\nThis shows native-specific functionality.',
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        <Text style={styles.title}>Document Scanner</Text>
        <Text style={styles.subtitle}>Native Camera & Gallery Access</Text>
        
        <TouchableOpacity style={styles.cameraButton} onPress={handleCameraScan}>
          <Text style={styles.buttonText}>📷 Scan with Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.galleryButton} onPress={handleGalleryPick}>
          <Text style={styles.buttonText}>🖼️ Pick from Gallery</Text>
        </TouchableOpacity>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Native Features Available:</Text>
          <Text style={styles.feature}>• Hardware camera access</Text>
          <Text style={styles.feature}>• Real-time image processing</Text>
          <Text style={styles.feature}>• Automatic edge detection</Text>
          <Text style={styles.feature}>• OCR text recognition</Text>
          <Text style={styles.feature}>• Secure file storage</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scannerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
  },
  galleryButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#2d5a2d',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default DocumentScannerNative;