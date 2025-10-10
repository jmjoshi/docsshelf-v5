// @ts-nocheck
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  BackHandler,
  ToastAndroid,
  Platform
} from 'react-native';
import {
  Appbar,
  Button,
  Surface,
  Text,
  ActivityIndicator,
  IconButton,
  Portal,
  Modal,
  Card,
  Chip
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

// Import components
import PDFViewer from '../../components/documents/DocumentViewer/PDFViewer.fallback';
import ImageViewer from '../../components/documents/DocumentViewer/ImageViewer';
import ViewerControls from '../../components/documents/DocumentViewer/ViewerControls';

// Import services and types
import { DocumentViewerService } from '../../services/documents/DocumentViewerService';
import { AuditLogService } from '../../services/security/AuditLogService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DocumentViewerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const { documentId } = route.params;
  
  const documents = useSelector((state) => state.documents.documents);
  const theme = useSelector((state) => state.theme);

  const [state, setState] = React.useState({
    document: null,
    loading: true,
    error: null,
    fileUri: null,
    fileType: 'unknown',
    showControls: true,
    fullScreen: false,
    currentPage: 1,
    totalPages: 1,
    zoomLevel: 1.0,
    showShareModal: false,
  });

  // Initialize document viewer
  React.useEffect(() => {
    initializeDocument();
  }, [documentId]);

  // Handle back button for Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (state.fullScreen) {
          setState(prev => ({ ...prev, fullScreen: false, showControls: true }));
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [state.fullScreen])
  );

  const initializeDocument = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Find document in store
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Load document file
      const documentViewerService = new DocumentViewerService();
      const { fileUri, fileType } = await documentViewerService.loadDocument(document);

      // Log document view
      await AuditLogService.logAction('document_view', {
        documentId: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        timestamp: new Date().toISOString()
      });

      setState(prev => ({
        ...prev,
        document,
        fileUri,
        fileType,
        loading: false
      }));

    } catch (error) {
      console.error('Error loading document:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load document'
      }));
    }
  };

  const handlePageChange = (page: number, totalPages?: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
      ...(totalPages && { totalPages })
    }));
  };

  const handleZoomChange = (zoom: number) => {
    setState(prev => ({ ...prev, zoomLevel: zoom }));
  };

  const toggleControls = () => {
    setState(prev => ({ ...prev, showControls: !prev.showControls }));
  };

  const toggleFullScreen = () => {
    setState(prev => ({
      ...prev,
      fullScreen: !prev.fullScreen,
      showControls: !prev.fullScreen ? false : true
    }));
  };

  const handleShare = async () => {
    if (!state.fileUri || !state.document) {
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(state.fileUri, {
          mimeType: state.fileType === 'pdf' ? 'application/pdf' : 'image/*',
          dialogTitle: `Share ${state.document.fileName}`
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Share Error', 'Failed to share document. Please try again.');
    }
  };

  const handlePrint = async () => {
    if (!state.fileUri || !state.document) {
      return;
    }

    try {
      if (state.fileType === 'pdf') {
        await Print.printAsync({
          uri: state.fileUri,
          printerUrl: undefined // Let user select printer
        });
      } else if (state.fileType === 'image') {
        // For images, create a simple HTML wrapper for printing
        const html = `
          <html>
            <body style="display: flex; justify-content: center; align-items: center; margin: 0; height: 100vh;">
              <img src="${state.fileUri}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            </body>
          </html>
        `;
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Error printing document:', error);
      Alert.alert('Print Error', 'Failed to print document. Please try again.');
    }
  };

  const handleRotate = () => {
    // Rotation will be implemented in individual viewer components
    if (Platform.OS === 'android') {
      ToastAndroid.show('Rotate gesture: Use pinch and rotate', ToastAndroid.SHORT);
    } else {
      Alert.alert('Rotate', 'Use pinch and rotate gesture to rotate the document');
    }
  };

  const renderViewer = () => {
    if (!state.fileUri) {
      return null;
    }

    const viewerProps = {
      uri: state.fileUri,
      onPageChange: handlePageChange,
      onZoomChange: handleZoomChange,
      onTap: toggleControls,
      fullScreen: state.fullScreen,
      currentPage: state.currentPage,
      zoomLevel: state.zoomLevel
    };

    switch (state.fileType) {
      case 'pdf':
        return <PDFViewer {...viewerProps} />;
      case 'image':
        return <ImageViewer {...viewerProps} />;
      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Unsupported file type: {state.document?.fileName}
            </Text>
            <Button mode="contained" onPress={() => navigation.goBack()}>
              Go Back
            </Button>
          </View>
        );
    }
  };

  const renderShareModal = () => (
    <Portal>
      <Modal
        visible={state.showShareModal}
        onDismiss={() => setState(prev => ({ ...prev, showShareModal: false }))}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Card>
          <Card.Title title="Share Document" subtitle={state.document?.fileName} />
          <Card.Content>
            <View style={styles.shareOptions}>
              <Button
                mode="contained"
                icon="share"
                onPress={() => {
                  setState(prev => ({ ...prev, showShareModal: false }));
                  handleShare();
                }}
                style={styles.shareButton}
              >
                Share File
              </Button>
              <Button
                mode="outlined"
                icon="printer"
                onPress={() => {
                  setState(prev => ({ ...prev, showShareModal: false }));
                  handlePrint();
                }}
                style={styles.shareButton}
              >
                Print
              </Button>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => setState(prev => ({ ...prev, showShareModal: false }))}>
              Cancel
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Loading Document..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{state.error}</Text>
          <Button mode="contained" onPress={initializeDocument}>
            Retry
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, state.fullScreen && styles.fullScreenContainer]}>
      <StatusBar hidden={state.fullScreen} />
      
      {!state.fullScreen && (
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content 
            title={state.document?.fileName || 'Document'} 
            subtitle={`Page ${state.currentPage} of ${state.totalPages}`}
          />
          <Appbar.Action 
            icon="share" 
            onPress={() => setState(prev => ({ ...prev, showShareModal: true }))} 
          />
          <Appbar.Action 
            icon="fullscreen" 
            onPress={toggleFullScreen} 
          />
        </Appbar.Header>
      )}

      <View style={styles.viewerContainer}>
        {renderViewer()}
      </View>

      {state.showControls && !state.fullScreen && (
        <ViewerControls
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          zoomLevel={state.zoomLevel}
          onPageChange={handlePageChange}
          onZoomChange={handleZoomChange}
          onRotate={handleRotate}
          onShare={() => setState(prev => ({ ...prev, showShareModal: true }))}
          onFullScreen={toggleFullScreen}
        />
      )}

      {state.fullScreen && (
        <View style={styles.fullScreenControls}>
          <IconButton
            icon="fullscreen-exit"
            iconColor="#fff"
            size={24}
            onPress={toggleFullScreen}
            style={styles.exitFullScreenButton}
          />
        </View>
      )}

      {renderShareModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#000',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#d32f2f',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  fullScreenControls: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1001,
  },
  exitFullScreenButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 8,
  },
  shareOptions: {
    gap: 12,
  },
  shareButton: {
    marginVertical: 4,
  },
});

export { DocumentViewerScreen };
export default DocumentViewerScreen;