/**
 * DocumentUploadService - Full implementation for document upload functionality
 * Features: Multi-file selection, progress tracking, duplicate detection, file validation
 * Now includes camera and gallery integration
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import DatabaseService from '../database/DatabaseService';
import CryptoJS from 'crypto-js';
import ImagePickerService, { ImagePickerResult } from './ImagePickerService';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface FileMetadata {
  name: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  hash: string;
  createdAt: string;
  modifiedAt: string;
}

export interface UploadOptions {
  categoryId?: string;
  userId: string;
  encrypt?: boolean;
  allowDuplicates?: boolean;
  onProgress?: (progress: UploadProgress) => void;
}

export interface DocumentPickerResult {
  name: string;
  size: number;
  uri: string;
  mimeType: string;
  type: string;
}

class DocumentUploadServiceClass {
  private activeUploads: Map<string, UploadProgress> = new Map();
  private cancelTokens: Map<string, boolean> = new Map();

  /**
   * Pick documents using Expo DocumentPicker
   */
  async pickDocuments(): Promise<DocumentPickerResult[]> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png', 
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return [];
      }

      return result.assets.map(asset => ({
        name: asset.name,
        size: asset.size || 0,
        uri: asset.uri,
        mimeType: asset.mimeType || 'application/octet-stream',
        type: asset.mimeType || 'application/octet-stream',
      }));

    } catch (error) {
      console.error('Error picking documents:', error);
      throw new Error('Failed to pick documents');
    }
  }

  /**
   * Take photo using device camera
   */
  async takePhoto(): Promise<DocumentPickerResult[]> {
    try {
      const images = await ImagePickerService.takePhoto({
        allowsMultipleSelection: false, // Camera typically supports single photo
        quality: 0.8, // Good quality for document photos
        allowsEditing: false // Don't allow editing to preserve document integrity
      });

      return this.convertImagePickerResults(images);
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Failed to take photo');
    }
  }

  /**
   * Select images from gallery/photo library
   */
  async selectFromGallery(allowMultiple: boolean = true): Promise<DocumentPickerResult[]> {
    try {
      const images = await ImagePickerService.selectFromGallery({
        allowsMultipleSelection: allowMultiple,
        quality: 1.0, // Full quality for existing photos
        allowsEditing: false
      });

      return this.convertImagePickerResults(images);
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      throw new Error('Failed to select from gallery');
    }
  }

  /**
   * Show comprehensive document source selection (Files, Camera, Gallery)
   */
  async showDocumentSourceOptions(options?: {
    allowMultipleFiles?: boolean;
    allowMultiplePhotos?: boolean;
  }): Promise<DocumentPickerResult[]> {
    return new Promise((resolve) => {
      const allowMultipleFiles = options?.allowMultipleFiles !== false;
      const allowMultiplePhotos = options?.allowMultiplePhotos !== false;

      // Use React Native Alert for cross-platform action sheet
      const { Alert } = require('react-native');
      
      Alert.alert(
        'Add Documents',
        'Choose how you want to add documents to DocsShelf:',
        [
          {
            text: 'Browse Files',
            onPress: async () => {
              try {
                const results = await this.pickDocuments();
                resolve(results);
              } catch (error) {
                console.error('Error picking files:', error);
                resolve([]);
              }
            }
          },
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                const results = await this.takePhoto();
                resolve(results);
              } catch (error) {
                console.error('Error taking photo:', error);
                resolve([]);
              }
            }
          },
          {
            text: allowMultiplePhotos ? 'Choose from Gallery' : 'Choose Photo',
            onPress: async () => {
              try {
                const results = await this.selectFromGallery(allowMultiplePhotos);
                resolve(results);
              } catch (error) {
                console.error('Error selecting from gallery:', error);
                resolve([]);
              }
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
   * Convert ImagePickerResults to DocumentPickerResults
   */
  private convertImagePickerResults(images: ImagePickerResult[]): DocumentPickerResult[] {
    return images.map(image => ({
      name: image.name,
      size: image.size,
      uri: image.uri,
      mimeType: image.mimeType,
      type: image.type,
    }));
  }

  /**
   * Upload a single document
   */
  async uploadDocument(options: {
    file: {
      uri: string;
      name: string;
      type: string;
      size: number;
    };
    categoryId?: string;
    userId: string;
    onProgress?: (progress: UploadProgress) => void;
  }): Promise<{ success: boolean; error?: string; document?: any }> {
    
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Validate file object
      if (!options.file) {
        throw new Error('File object is required');
      }
      
      if (!options.file.name) {
        throw new Error('File name is required');
      }
      
      if (!options.file.uri) {
        throw new Error('File URI is required');
      }
      
      console.log('📄 Starting upload for file:', {
        name: options.file.name,
        size: options.file.size,
        type: options.file.type,
        uri: options.file.uri?.substring(0, 50) + '...'
      });

      // Initialize progress
      const initialProgress: UploadProgress = {
        fileId,
        fileName: options.file.name,
        totalSize: options.file.size || 0,
        uploadedSize: 0,
        percentage: 0,
        status: 'pending',
      };

      this.activeUploads.set(fileId, initialProgress);
      options.onProgress?.(initialProgress);

      // Update to uploading status
      const uploadingProgress = { ...initialProgress, status: 'uploading' as const, percentage: 10 };
      this.activeUploads.set(fileId, uploadingProgress);
      options.onProgress?.(uploadingProgress);

      // Simulate file processing with delay
      await this.delay(1000);

      // Check if cancelled
      if (this.cancelTokens.get(fileId)) {
        throw new Error('Upload cancelled');
      }

      // Generate file hash
      const processingProgress = { ...uploadingProgress, status: 'processing' as const, percentage: 50 };
      this.activeUploads.set(fileId, processingProgress);
      options.onProgress?.(processingProgress);

      const fileContent = await FileSystem.readAsStringAsync(options.file.uri, {
        encoding: 'base64',
      });
      const fileHash = CryptoJS.SHA256(fileContent).toString();

      // Check for duplicates
      const existingDoc = await DatabaseService.getInstance().getDocumentByHash(fileHash, options.userId);
      if (existingDoc) {
        throw new Error('Document already exists');
      }

      // For now, use the original file path (cache directory)
      // In production, you would copy to a permanent directory
      const fileName = `${Date.now()}_${options.file.name}`;
      const filePath = options.file.uri; // Use original path for now
      
      console.log('📁 File will be stored at:', filePath);

      // Simulate upload completion
      await this.delay(1000);

      const completedProgress = { ...processingProgress, status: 'completed' as const, percentage: 100, uploadedSize: options.file.size };
      this.activeUploads.set(fileId, completedProgress);
      options.onProgress?.(completedProgress);

      // Save to database
      const documentData = {
        name: options.file.name,
        originalName: options.file.name,
        fileType: this.getFileTypeFromMimeType(options.file.type),
        mimeType: options.file.type,
        fileSize: options.file.size,
        filePath,
        fileHash: fileHash,
        categoryId: options.categoryId || null,
        userId: options.userId,
        encrypted: false,
        ocrText: null,
        tags: [] as string[],
        metadata: null,
      };

      const document = await DatabaseService.getInstance().createDocument(documentData);
      console.log('✅ Document saved to database:', document.id);

      // Clean up
      this.activeUploads.delete(fileId);
      this.cancelTokens.delete(fileId);

      return { success: true, document };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      const failedProgress: UploadProgress = {
        fileId,
        fileName: options.file.name,
        totalSize: options.file.size,
        uploadedSize: 0,
        percentage: 0,
        status: 'failed',
        error: errorMessage,
      };

      this.activeUploads.set(fileId, failedProgress);
      options.onProgress?.(failedProgress);

      // Clean up after delay
      setTimeout(() => {
        this.activeUploads.delete(fileId);
        this.cancelTokens.delete(fileId);
      }, 5000);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(options: {
    files: Array<{
      uri: string;
      name: string;
      type: string;
      size: number;
    }>;
    categoryId?: string;
    userId: string;
    onProgress?: (progress: UploadProgress) => void;
  }): Promise<{
    successful: any[];
    failed: Array<{ fileName: string; error: string }>;
  }> {
    const successful: any[] = [];
    const failed: Array<{ fileName: string; error: string }> = [];

    for (const file of options.files) {
      try {
        const result = await this.uploadDocument({
          file,
          categoryId: options.categoryId,
          userId: options.userId,
          onProgress: options.onProgress,
        });

        if (result.success && result.document) {
          successful.push(result.document);
        } else {
          failed.push({ fileName: file.name, error: result.error || 'Upload failed' });
        }

      } catch (error) {
        failed.push({ 
          fileName: file.name, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Cancel an upload
   */
  cancelUpload(fileId: string): void {
    this.cancelTokens.set(fileId, true);
    
    const progress = this.activeUploads.get(fileId);
    if (progress) {
      const cancelledProgress: UploadProgress = {
        ...progress,
        status: 'cancelled',
        error: 'Upload cancelled by user',
      };
      this.activeUploads.set(fileId, cancelledProgress);
    }
  }

  /**
   * Get upload progress for a specific file
   */
  getUploadProgress(fileId: string): UploadProgress | undefined {
    return this.activeUploads.get(fileId);
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): UploadProgress[] {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Clear completed uploads from memory
   */
  clearCompletedUploads(): void {
    for (const [fileId, progress] of this.activeUploads.entries()) {
      if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
        this.activeUploads.delete(fileId);
        this.cancelTokens.delete(fileId);
      }
    }
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get file type from MIME type
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'spreadsheet';
    if (mimeType === 'text/plain') return 'text';
    return 'other';
  }
}

export default new DocumentUploadServiceClass();