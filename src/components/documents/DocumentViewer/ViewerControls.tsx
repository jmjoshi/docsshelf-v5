// @ts-nocheck
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Surface,
  IconButton,
  Text,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';

const { width: screenWidth } = Dimensions.get('window');

interface ViewerControlsProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onRotate: () => void;
  onShare: () => void;
  onFullScreen: () => void;
}

const ViewerControls = ({
  currentPage,
  totalPages,
  zoomLevel,
  onPageChange,
  onZoomChange,
  onRotate,
  onShare,
  onFullScreen
}) => {
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.25, 4.0);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 0.5);
    onZoomChange(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange(1.0);
  };

  const formatZoomPercentage = (zoom) => {
    return `${Math.round(zoom * 100)}%`;
  };

  return (
    <Surface style={styles.container} elevation={4}>
      {/* Page Navigation Section */}
      {totalPages > 1 && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Page Navigation</Text>
            <View style={styles.pageControls}>
              <IconButton
                icon="chevron-left"
                mode="contained"
                size={20}
                disabled={currentPage <= 1}
                onPress={handlePreviousPage}
              />
              <Chip style={styles.pageChip}>
                {currentPage} of {totalPages}
              </Chip>
              <IconButton
                icon="chevron-right"
                mode="contained"
                size={20}
                disabled={currentPage >= totalPages}
                onPress={handleNextPage}
              />
            </View>
          </View>
          <Divider style={styles.divider} />
        </>
      )}

      {/* Zoom Controls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zoom</Text>
        <View style={styles.zoomControls}>
          <IconButton
            icon="minus"
            mode="outlined"
            size={18}
            disabled={zoomLevel <= 0.5}
            onPress={handleZoomOut}
          />
          <Button
            mode="outlined"
            onPress={handleZoomReset}
            style={styles.zoomButton}
            compact
          >
            {formatZoomPercentage(zoomLevel)}
          </Button>
          <IconButton
            icon="plus"
            mode="outlined"
            size={18}
            disabled={zoomLevel >= 4.0}
            onPress={handleZoomIn}
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Action Controls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionControls}>
          <IconButton
            icon="rotate-right"
            mode="outlined"
            size={20}
            onPress={onRotate}
            style={styles.actionButton}
          />
          <IconButton
            icon="share"
            mode="outlined"
            size={20}
            onPress={onShare}
            style={styles.actionButton}
          />
          <IconButton
            icon="fullscreen"
            mode="outlined"
            size={20}
            onPress={onFullScreen}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  section: {
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#666',
  },
  divider: {
    marginVertical: 8,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pageChip: {
    minWidth: 80,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  zoomButton: {
    minWidth: 60,
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    margin: 0,
  },
});

export default ViewerControls;