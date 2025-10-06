/**
 * DocumentUploadService - STUB VERSION for testing
 * This is a temporary stub to test if the app runs without document upload functionality
 */

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

class DocumentUploadServiceClass {
  async pickDocuments(): Promise<any[]> {
    console.warn('DocumentUploadService: Using stub version - document picking not implemented');
    return [];
  }

  async uploadDocument(): Promise<{ success: boolean; error: string }> {
    console.warn('DocumentUploadService: Using stub version - document upload not implemented');
    return {
      success: false,
      error: 'Document upload not implemented in stub version',
    };
  }

  async uploadMultipleDocuments(): Promise<{
    successful: string[];
    failed: Array<{ fileName: string; error: string }>;
  }> {
    console.warn('DocumentUploadService: Using stub version - multiple document upload not implemented');
    return {
      successful: [],
      failed: [],
    };
  }

  cancelUpload(): void {
    console.warn('DocumentUploadService: Using stub version - cancel upload not implemented');
  }

  getUploadProgress(): UploadProgress | undefined {
    return undefined;
  }

  getActiveUploads(): UploadProgress[] {
    return [];
  }

  clearCompletedUploads(): void {
    console.warn('DocumentUploadService: Using stub version - clear completed uploads not implemented');
  }
}

export default new DocumentUploadServiceClass();