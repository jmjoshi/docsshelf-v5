/**
 * ImagePickerService - Production-ready service for selecting images from camera and gallery
 * Integrates with DocumentUploadService for comprehensive document input options
 */

import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ImagePickerOptions {
  mediaTypes?: ImagePicker.MediaTypeOptions;
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  quality?: number;
  aspect?: [number, number];
  base64?: boolean;
}

class ImagePickerServiceClass {
  
  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required', 
          'DocsShelf needs camera access to take photos of documents. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required', 
          'DocsShelf needs access to your photo library to select document images. Please enable photo library permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Take photo using device camera
   */
  async takePhoto(options?: ImagePickerOptions): Promise<ImagePickerResult[]> {
    try {
      // Request camera permission
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return [];
      }

      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: options?.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing || false,
        allowsMultipleSelection: options?.allowsMultipleSelection || false,
        quality: options?.quality || 0.8,
        aspect: options?.aspect || [4, 3],
        base64: options?.base64 || false,
        exif: false, // Don't include EXIF data for privacy
      };

      const result = await ImagePicker.launchCameraAsync(defaultOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      return result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: `camera_photo_${Date.now()}_${index}.jpg`,
        size: asset.fileSize || 0,
        type: asset.type || 'image',
        mimeType: asset.mimeType || 'image/jpeg',
        width: asset.width,
        height: asset.height,
      }));

    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
      return [];
    }
  }

  /**
   * Select images from photo library/gallery
   */
  async selectFromGallery(options?: ImagePickerOptions): Promise<ImagePickerResult[]> {
    try {
      // Request media library permission
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return [];
      }

      const defaultOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: options?.mediaTypes || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing || false,
        allowsMultipleSelection: options?.allowsMultipleSelection || true,
        quality: options?.quality || 1.0,
        base64: options?.base64 || false,
        exif: false, // Don't include EXIF data for privacy
      };

      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      return result.assets.map((asset, index) => {
        // Generate filename from original or create timestamp-based name
        const originalName = asset.fileName || `gallery_image_${Date.now()}_${index}`;
        const extension = this.getFileExtension(asset.mimeType || 'image/jpeg');
        
        return {
          uri: asset.uri,
          name: originalName.includes('.') ? originalName : `${originalName}.${extension}`,
          size: asset.fileSize || 0,
          type: asset.type || 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          width: asset.width,
          height: asset.height,
        };
      });

    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Gallery Error', 'Failed to select images from gallery. Please try again.');
      return [];
    }
  }

  /**
   * Get recent photos from media library (for quick access)
   */
  async getRecentPhotos(limit: number = 20): Promise<ImagePickerResult[]> {
    try {
      // Check if we have media library permissions
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        const hasPermission = await this.requestMediaLibraryPermissions();
        if (!hasPermission) {
          return [];
        }
      }

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: limit,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      if (!assets.assets || assets.assets.length === 0) {
        return [];
      }

      // Get asset info to get file URIs
      const assetInfoPromises = assets.assets.map(asset => 
        MediaLibrary.getAssetInfoAsync(asset)
      );
      
      const assetInfos = await Promise.all(assetInfoPromises);

      return assetInfos
        .filter(info => info.localUri) // Only include assets with local URIs
        .map((info, index) => ({
          uri: info.localUri!,
          name: info.filename || `recent_photo_${Date.now()}_${index}.jpg`,
          size: 0, // MediaLibrary doesn't provide file size
          type: 'image',
          mimeType: this.getMimeTypeFromFilename(info.filename || ''),
          width: info.width,
          height: info.height,
        }));

    } catch (error) {
      console.error('Error getting recent photos:', error);
      return [];
    }
  }

  /**
   * Show action sheet with camera and gallery options
   */
  async showImageSourceActionSheet(options?: {
    title?: string;
    message?: string;
    allowMultiple?: boolean;
  }): Promise<ImagePickerResult[]> {
    return new Promise((resolve) => {
      const title = options?.title || 'Select Document Image';
      const message = options?.message || 'Choose how you want to add document images:';
      const allowMultiple = options?.allowMultiple !== false;

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const results = await this.takePhoto({ 
                allowsMultipleSelection: false // Camera only supports single photo
              });
              resolve(results);
            }
          },
          {
            text: allowMultiple ? 'Choose from Gallery' : 'Choose Photo',
            onPress: async () => {
              const results = await this.selectFromGallery({ 
                allowsMultipleSelection: allowMultiple 
              });
              resolve(results);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve([])
          }
        ],
        { cancelable: true, onDismiss: () => resolve([]) }
      );
    });
  }

  /**
   * Utility: Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExtension: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/svg+xml': 'svg',
    };

    return mimeToExtension[mimeType.toLowerCase()] || 'jpg';
  }

  /**
   * Utility: Get MIME type from filename
   */
  private getMimeTypeFromFilename(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const extensionToMime: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'svg': 'image/svg+xml',
    };

    return extensionToMime[extension] || 'image/jpeg';
  }

  /**
   * Check if device supports camera
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false; // Web doesn't support native camera through ImagePicker
      }
      
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      return status !== 'undetermined'; // If undetermined, camera might not be available
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }

  /**
   * Check if device supports media library access
   */
  async isMediaLibraryAvailable(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      return true; // If we can check permissions, library is available
    } catch (error) {
      console.error('Error checking media library availability:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new ImagePickerServiceClass();