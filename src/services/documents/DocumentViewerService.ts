// @ts-nocheck
/**
 * DocumentViewerService - Handles document loading and type detection for viewing
 * Supports PDF and image files with proper URI handling
 */
import * as FileSystem from 'expo-file-system';
import { Document } from '../../types';

export class DocumentViewerService {
  private static instance: DocumentViewerService;

  public static getInstance(): DocumentViewerService {
    if (!DocumentViewerService.instance) {
      DocumentViewerService.instance = new DocumentViewerService();
    }
    return DocumentViewerService.instance;
  }

  /**
   * Load a document and determine its type for appropriate viewer
   */
  public async loadDocument(document: Document): Promise<{
    fileUri: string;
    fileType: 'pdf' | 'image' | 'unknown';
  }> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(document.filePath);
      if (!fileInfo.exists) {
        throw new Error('Document file not found');
      }

      // Determine file type based on extension and MIME type
      const fileType = this.determineFileType(document.fileName, document.mimeType);
      
      // For security and compatibility, use the file:// URI directly
      const fileUri = document.filePath;

      return {
        fileUri,
        fileType
      };

    } catch (error) {
      console.error('Error loading document:', error);
      throw new Error(`Failed to load document: ${error.message}`);
    }
  }

  /**
   * Determine file type from filename and MIME type
   */
  private determineFileType(fileName: string, mimeType?: string): 'pdf' | 'image' | 'unknown' {
    // Check MIME type first if available
    if (mimeType) {
      if (mimeType === 'application/pdf') {
        return 'pdf';
      }
      if (mimeType.startsWith('image/')) {
        return 'image';
      }
    }

    // Fallback to file extension
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return 'image';
      default:
        return 'unknown';
    }
  }

  /**
   * Get supported file types for document viewing
   */
  public getSupportedFileTypes(): string[] {
    return [
      // PDF files
      'pdf',
      // Image files
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'
    ];
  }

  /**
   * Check if a document type is supported for viewing
   */
  public isDocumentSupported(document: Document): boolean {
    const fileType = this.determineFileType(document.fileName, document.mimeType);
    return fileType !== 'unknown';
  }

  /**
   * Get file size in human readable format
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get document metadata for viewer
   */
  public async getDocumentMetadata(document: Document): Promise<{
    fileName: string;
    fileSize: string;
    fileType: string;
    lastModified?: string;
    isSupported: boolean;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(document.filePath);
      const fileType = this.determineFileType(document.fileName, document.mimeType);
      
      return {
        fileName: document.fileName,
        fileSize: this.formatFileSize(document.fileSize || fileInfo.size || 0),
        fileType: fileType,
        lastModified: fileInfo.modificationTime 
          ? new Date(fileInfo.modificationTime).toLocaleDateString()
          : undefined,
        isSupported: fileType !== 'unknown'
      };
    } catch (error) {
      console.error('Error getting document metadata:', error);
      return {
        fileName: document.fileName,
        fileSize: 'Unknown',
        fileType: 'unknown',
        isSupported: false
      };
    }
  }

  /**
   * Validate document before viewing
   */
  public async validateDocument(document: Document): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if document exists
      if (!document) {
        errors.push('Document is null or undefined');
        return { isValid: false, errors };
      }

      // Check required fields
      if (!document.filePath) {
        errors.push('Document file path is missing');
      }

      if (!document.fileName) {
        errors.push('Document file name is missing');
      }

      // Check if file exists on disk
      if (document.filePath) {
        const fileInfo = await FileSystem.getInfoAsync(document.filePath);
        if (!fileInfo.exists) {
          errors.push('Document file does not exist on disk');
        } else if (fileInfo.isDirectory) {
          errors.push('Document path points to a directory, not a file');
        }
      }

      // Check if file type is supported
      if (!this.isDocumentSupported(document)) {
        errors.push(`File type '${document.fileName.split('.').pop()}' is not supported for viewing`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Error validating document:', error);
      errors.push(`Validation failed: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Prepare document URI for viewer components
   */
  public prepareDocumentUri(filePath: string): string {
    // Ensure proper file:// URI format
    if (!filePath.startsWith('file://')) {
      return `file://${filePath}`;
    }
    return filePath;
  }

  /**
   * Get thumbnail path for document (if available)
   */
  public getThumbnailPath(document: Document): string | null {
    // This will be implemented when thumbnail service is added
    return null;
  }
}

export default DocumentViewerService;