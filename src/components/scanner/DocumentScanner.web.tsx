/**
 * Platform-Specific Document Scanner Component
 * Web version using browser File API
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DocumentScannerWebProps {
  onDocumentScanned: (file: File) => void;
  onError: (error: string) => void;
}

const DocumentScannerWeb: React.FC<DocumentScannerWebProps> = ({ 
  onDocumentScanned, 
  onError 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
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
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <View style={styles.container}>
      <View 
        style={[styles.dropZone, isDragOver && styles.dropZoneActive]}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Text style={styles.dropText}>
          {isDragOver ? 'Drop document here' : 'Drag & drop documents here'}
        </Text>
        <Text style={styles.orText}>or</Text>
        <TouchableOpacity style={styles.browseButton} onPress={openFileDialog}>
          <Text style={styles.browseButtonText}>Browse Files</Text>
        </TouchableOpacity>
        <Text style={styles.supportedFormats}>
          Supported: PDF, JPEG, PNG, TIFF (Max 20MB)
        </Text>
      </View>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.tiff"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  dropZone: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    minHeight: 200,
    justifyContent: 'center',
  },
  dropZoneActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e7f3ff',
  },
  dropText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportedFormats: {
    fontSize: 12,
    color: '#888',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default DocumentScannerWeb;