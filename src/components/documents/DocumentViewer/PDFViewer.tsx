// @ts-nocheck
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  GestureResponderEvent,
  PanResponder,
} from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import Pdf from 'react-native-pdf';

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

const PDFViewer = ({
  uri,
  onPageChange,
  onZoomChange,
  onTap,
  fullScreen = false,
  currentPage = 1,
  zoomLevel = 1.0
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [pdfDocument, setPdfDocument] = React.useState(null);
  const [totalPages, setTotalPages] = React.useState(1);
  const [scale, setScale] = React.useState(1.0);
  const pdfRef = React.useRef(null);

  // Calculate container dimensions
  const containerWidth = fullScreen ? screenWidth : screenWidth;
  const containerHeight = fullScreen ? screenHeight : screenHeight - 120; // Account for headers

  React.useEffect(() => {
    setLoading(true);
    setError(null);
  }, [uri]);

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log('PDF loaded successfully:', numberOfPages, 'pages');
    setTotalPages(numberOfPages);
    setLoading(false);
    onPageChange?.(1, numberOfPages);
  };

  const handlePageChanged = (page: number, numberOfPages: number) => {
    console.log('Page changed:', page, 'of', numberOfPages);
    onPageChange?.(page, numberOfPages);
  };

  const handleError = (error: any) => {
    console.error('PDF loading error:', error);
    setError('Failed to load PDF document. Please check if the file is valid.');
    setLoading(false);
  };

  const handleScaleChanged = (scale: number) => {
    setScale(scale);
    onZoomChange?.(scale);
  };

  const handleSingleTap = () => {
    onTap?.();
  };

  const handlePressStart = () => {
    // Optional: Handle press start for additional feedback
  };

  const handlePressEnd = () => {
    // Optional: Handle press end for additional feedback
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
      
      <Pdf
        ref={pdfRef}
        source={{ uri }}
        onLoadComplete={handleLoadComplete}
        onPageChanged={handlePageChanged}
        onError={handleError}
        onScaleChanged={handleScaleChanged}
        onPressLink={(linkUri) => {
          console.log('Link pressed:', linkUri);
          // Handle link navigation if needed
        }}
        onPageSingleTap={handleSingleTap}
        onPageDoublesTap={() => {
          // Handle double tap for zoom
          const newScale = scale > 1.5 ? 1.0 : 2.0;
          setScale(newScale);
          onZoomChange?.(newScale);
        }}
        style={[styles.pdf, { opacity: loading ? 0 : 1 }]}
        // PDF Configuration
        trustAllCerts={false}
        enablePaging={true}
        enableRTL={false}
        enableAnnotationRendering={true}
        enableAntialiasing={true}
        enableDoubletapZoom={true}
        enablePinchZoom={true}
        // Fit settings
        fitWidth={!fullScreen}
        fitPolicy={fullScreen ? 0 : 2} // 0: fit width, 1: fit height, 2: fit both
        // Spacing and margins
        spacing={10}
        horizontal={false}
        // Performance settings
        renderActivityIndicator={() => <View />} // We handle loading ourselves
        // Page navigation
        page={currentPage}
        scale={scale}
        minScale={0.5}
        maxScale={4.0}
        // Accessibility
        accessibilityLabel="PDF Document Viewer"
        // Additional settings
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        scrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pdf: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#d32f2f',
    paddingHorizontal: 20,
  },
});

export default PDFViewer;