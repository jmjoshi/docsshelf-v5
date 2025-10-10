import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export interface StoredDocument {
  id: string;
  uri: string;
  filename: string;
  size: number;
  timestamp: number;
  mediaLibraryAsset?: MediaLibrary.Asset;
}

export class DocumentStorageService {
  private static documentsDirectory = `${FileSystem.documentDirectory}scanned_documents/`;

  /**
   * Initialize the storage directory for scanned documents
   */
  static async initializeStorage(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.documentsDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.documentsDirectory, { intermediates: true });
        console.log('📁 Created documents storage directory:', this.documentsDirectory);
      }
    } catch (error) {
      console.error('❌ Failed to initialize storage directory:', error);
      throw error;
    }
  }

  /**
   * Store a scanned document permanently on device
   */
  static async storeDocument(tempUri: string, documentId: string): Promise<StoredDocument> {
    try {
      await this.initializeStorage();
      
      const timestamp = Date.now();
      const filename = `scan_${documentId}_${timestamp}.jpg`;
      const permanentUri = `${this.documentsDirectory}${filename}`;
      
      // Copy from temp location to permanent storage
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri,
      });
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      const size = 'size' in fileInfo ? fileInfo.size : 0;
      
      console.log('💾 Document stored permanently:', {
        filename,
        size: Math.round(size / 1024) + 'KB',
        location: permanentUri
      });

      const storedDoc: StoredDocument = {
        id: documentId,
        uri: permanentUri,
        filename,
        size,
        timestamp,
      };

      // Optionally save to device gallery (requires permission)
      if (Platform.OS === 'android') {
        try {
          const mediaPermissions = await MediaLibrary.requestPermissionsAsync();
          if (mediaPermissions.granted) {
            const asset = await MediaLibrary.createAssetAsync(permanentUri);
            
            // Create or get DocShelf album
            let album = await MediaLibrary.getAlbumAsync('DocShelf');
            if (!album) {
              album = await MediaLibrary.createAlbumAsync('DocShelf', asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
            
            storedDoc.mediaLibraryAsset = asset;
            console.log('📱 Document saved to device gallery in DocShelf album');
          }
        } catch (mediaError) {
          console.log('ℹ️ Could not save to gallery (optional feature):', mediaError);
        }
      }

      return storedDoc;
    } catch (error) {
      console.error('❌ Failed to store document:', error);
      throw error;
    }
  }

  /**
   * Get all stored documents
   */
  static async getStoredDocuments(): Promise<StoredDocument[]> {
    try {
      await this.initializeStorage();
      
      const files = await FileSystem.readDirectoryAsync(this.documentsDirectory);
      const documents: StoredDocument[] = [];
      
      for (const filename of files) {
        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png')) {
          const uri = `${this.documentsDirectory}${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(uri);
          
          if (fileInfo.exists && 'size' in fileInfo) {
            // Extract document ID from filename
            const idMatch = filename.match(/scan_([^_]+)_/);
            const id = idMatch ? idMatch[1] : filename.split('.')[0];
            
            documents.push({
              id,
              uri,
              filename,
              size: fileInfo.size,
              timestamp: fileInfo.modificationTime || 0,
            });
          }
        }
      }
      
      // Sort by timestamp (newest first)
      return documents.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Failed to get stored documents:', error);
      return [];
    }
  }

  /**
   * Delete a stored document
   */
  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const documents = await this.getStoredDocuments();
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        console.log('⚠️ Document not found for deletion:', documentId);
        return false;
      }
      
      // Delete from app storage
      await FileSystem.deleteAsync(document.uri);
      
      // Delete from media library if exists
      if (document.mediaLibraryAsset) {
        try {
          await MediaLibrary.deleteAssetsAsync([document.mediaLibraryAsset]);
          console.log('🗑️ Document deleted from gallery');
        } catch (mediaError) {
          console.log('ℹ️ Could not delete from gallery:', mediaError);
        }
      }
      
      console.log('🗑️ Document deleted successfully:', document.filename);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Get storage info
   */
  static async getStorageInfo(): Promise<{
    totalDocuments: number;
    totalSize: number;
    storageLocation: string;
  }> {
    try {
      const documents = await this.getStoredDocuments();
      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      
      return {
        totalDocuments: documents.length,
        totalSize,
        storageLocation: this.documentsDirectory,
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
        storageLocation: this.documentsDirectory,
      };
    }
  }

  /**
   * Clean up old temporary files (call this periodically)
   */
  static async cleanupTempFiles(): Promise<void> {
    try {
      // Clean up expo cache directory if needed
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const file of cacheFiles) {
          if (file.includes('ImagePicker') || file.includes('Camera')) {
            const fileUri = `${cacheDir}${file}`;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            
            if (fileInfo.exists && 'modificationTime' in fileInfo) {
              const age = now - (fileInfo.modificationTime || 0);
              if (age > maxAge) {
                await FileSystem.deleteAsync(fileUri);
                console.log('🧹 Cleaned up old temp file:', file);
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Cleanup completed with minor issues:', error);
    }
  }
}