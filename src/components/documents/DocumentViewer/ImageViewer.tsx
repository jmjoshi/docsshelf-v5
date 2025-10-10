// @ts-nocheck
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  ScrollView,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
// import ImageZoom from 'react-native-image-zoom-viewer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerProps {
  uri: string;
  onPageChange?: (page: number, totalPages: number) => void;
  onZoomChange?: (zoom: number) => void;
  onTap?: () => void;
  fullScreen?: boolean;
  currentPage?: number;
  zoomLevel?: number;
}

const ImageViewer = ({
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
  const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
  const [scale, setScale] = React.useState(1.0);
  const pan = React.useRef(new Animated.ValueXY()).current;

  // Calculate container dimensions
  const containerWidth = fullScreen ? screenWidth : screenWidth;
  const containerHeight = fullScreen ? screenHeight : screenHeight - 120;

  React.useEffect(() => {
    loadImageDimensions();
  }, [uri]);

  React.useEffect(() => {
    // Notify parent about single page (images are always 1 page)
    onPageChange?.(1, 1);
  }, []);

  const loadImageDimensions = () => {
    setLoading(true);
    setError(null);
    
    Image.getSize(
      uri,
      (width, height) => {
        setImageSize({ width, height });
        setLoading(false);
      },
      (error) => {
        console.error('Error loading image:', error);
        setError('Failed to load image. Please check if the file is valid.');
        setLoading(false);
      }
    );
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = (error) => {
    console.error('Image loading error:', error);
    setError('Failed to load image');
    setLoading(false);
  };

  const handleSingleTap = () => {
    onTap?.();
  };

  const handleZoomChange = (zoom) => {
    setScale(zoom);
    onZoomChange?.(zoom);
  };

  // Calculate image dimensions to fit container while maintaining aspect ratio
  const calculateImageDimensions = () => {
    if (!imageSize.width || !imageSize.height) {
      return { width: containerWidth, height: containerHeight };
    }

    const aspectRatio = imageSize.width / imageSize.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth = containerWidth;
    let displayHeight = containerHeight;

    if (aspectRatio > containerAspectRatio) {
      // Image is wider than container
      displayWidth = containerWidth;
      displayHeight = containerWidth / aspectRatio;
    } else {
      // Image is taller than container
      displayHeight = containerHeight;
      displayWidth = containerHeight * aspectRatio;
    }

    return {
      width: Math.min(displayWidth, containerWidth),
      height: Math.min(displayHeight, containerHeight)
    };
  };

  const renderImageWithZoom = () => {
    // Placeholder for advanced image zoom - using simple ScrollView for now
    return renderSimpleImage();
  };

  const renderSimpleImage = () => {
    const dimensions = calculateImageDimensions();
    
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        maximumZoomScale={4.0}
        minimumZoomScale={0.5}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        centerContent={true}
      >
        <TouchableWithoutFeedback onPress={handleSingleTap}>
          <Image
            source={{ uri }}
            style={[styles.image, dimensions]}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="contain"
          />
        </TouchableWithoutFeedback>
      </ScrollView>
    );
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
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}
      
      <View style={[styles.imageContainer, { opacity: loading ? 0 : 1 }]}>
        {renderSimpleImage()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: 'transparent',
  },
  imageZoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    paddingHorizontal: 20,
  },
});

export default ImageViewer;