// Temporary fallback PDFViewer for development - No native modules
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { ActivityIndicator, Text, Surface, Button } from 'react-native-paper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PDFViewerProps {
  uri: string;
  onPageChange?: (page: number, totalPages: number) => void;
  onZoomChange?: (zoom: number) => void;
  onTap?: () => void;
  fullScreen?: boolean;
  currentPage?: number;
  zoomLevel?: number;
}

const PDFViewerFallback = ({
  uri,
  onPageChange,
  onZoomChange,
  onTap,
  fullScreen = false,
  currentPage = 1,
  zoomLevel = 1,
}: PDFViewerProps) => {

  const handleOpenExternally = () => {
    Alert.alert(
      'PDF Viewer',
      'PDF viewing requires additional setup. Would you like to open this document externally?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => {
            // In a real implementation, this would use Linking.openURL
            console.log('Would open PDF:', uri);
          }
        },
      ]
    );
  };

  return (
    <Surface style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.content}>
        <Text style={styles.title}>PDF Viewer</Text>
        <Text style={styles.message}>
          PDF viewing is not available in development mode.
        </Text>
        <Text style={styles.filename}>
          File: {uri.split('/').pop() || 'document.pdf'}
        </Text>
        
        <Button 
          mode="contained" 
          onPress={handleOpenExternally}
          style={styles.button}
        >
          Open Externally
        </Button>
        
        <View style={styles.controls}>
          <Text style={styles.pageInfo}>
            Page {currentPage} • Zoom {Math.round(zoomLevel * 100)}%
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 24,
  },
  filename: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  pageInfo: {
    fontSize: 12,
    color: '#666',
  },
});

export default PDFViewerFallback;