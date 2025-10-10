/**
 * Platform-Specific Document Scanner Component
 * Web version using file input
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DocumentScannerWebProps {
  onDocumentScanned: (file: File) => void;
  onError: (error: string) => void;
}

const DocumentScannerWeb = ({ 
  onDocumentScanned, 
  onError 
}: DocumentScannerWebProps) => {

  const handleFileUpload = () => {
    // Simplified file upload for React 19 compatibility
    try {
      // Create a basic file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,.tiff';
      
      input.onchange = (event: any) => {
        const files = event.target.files;
        if (files && files.length > 0) {
          const file = files[0];
          
          // Validate file type
          const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
          if (!supportedTypes.includes(file.type)) {
            onError('Unsupported file type. Please select PDF, JPEG, PNG, or TIFF files.');
            return;
          }
          
          // Validate file size (20MB limit)
          const maxSize = 20 * 1024 * 1024;
          if (file.size > maxSize) {
            onError('File size too large. Maximum size is 20MB.');
            return;
          }
          
          onDocumentScanned(file);
        }
      };
      
      input.click();
    } catch (error) {
      onError('Failed to open file picker');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.uploadArea}>
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.subtitle}>Select a PDF or image file to scan</Text>
        
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={handleFileUpload}
        >
          <Text style={styles.buttonText}>Choose File</Text>
        </TouchableOpacity>
        
        <Text style={styles.supportedFormats}>
          Supported formats: PDF, JPEG, PNG, TIFF
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 40,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  supportedFormats: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});

export default DocumentScannerWeb;