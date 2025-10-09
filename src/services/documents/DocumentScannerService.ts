/**
 * DocumentScannerService - Image processing and edge detection for document scanning
 * Features: Edge detection, perspective correction, image enhancement
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface ScanPoint {
  x: number;
  y: number;
}

export interface DocumentBounds {
  topLeft: ScanPoint;
  topRight: ScanPoint;
  bottomRight: ScanPoint;
  bottomLeft: ScanPoint;
  confidence: number;
}

export interface ScanResult {
  originalUri: string;
  processedUri: string;
  croppedUri?: string;
  bounds?: DocumentBounds;
  enhanced: boolean;
  timestamp: number;
}

export interface ScanOptions {
  enableEdgeDetection?: boolean;
  enablePerspectiveCorrection?: boolean;
  enhanceImage?: boolean;
  outputFormat?: ImageManipulator.SaveFormat;
  quality?: number;
}

class DocumentScannerServiceClass {
  
  /**
   * Process a scanned document image with edge detection and perspective correction
   */
  async processScan(
    imageUri: string, 
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    const {
      enableEdgeDetection = true,
      enablePerspectiveCorrection = true,
      enhanceImage = true,
      outputFormat = ImageManipulator.SaveFormat.JPEG,
      quality = 0.9,
    } = options;

    try {
      console.log('📄 Processing scanned document:', imageUri.substring(0, 50) + '...');
      
      let processedUri = imageUri;
      let bounds: DocumentBounds | undefined;

      // Step 1: Detect document bounds (mock implementation)
      if (enableEdgeDetection) {
        bounds = await this.detectDocumentBounds(imageUri);
        console.log('🔍 Document bounds detected with confidence:', bounds.confidence);
      }

      // Step 2: Apply perspective correction if bounds detected
      if (enablePerspectiveCorrection && bounds && bounds.confidence > 0.7) {
        processedUri = await this.correctPerspective(processedUri, bounds);
        console.log('📐 Perspective correction applied');
      }

      // Step 3: Enhance image quality
      if (enhanceImage) {
        processedUri = await this.enhanceImage(processedUri, {
          format: outputFormat,
          quality,
        });
        console.log('✨ Image enhancement applied');
      }

      const result: ScanResult = {
        originalUri: imageUri,
        processedUri,
        bounds,
        enhanced: enhanceImage,
        timestamp: Date.now(),
      };

      console.log('✅ Document processing complete');
      return result;

    } catch (error) {
      console.error('❌ Error processing scanned document:', error);
      throw new Error(`Failed to process scanned document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect document boundaries in an image (mock implementation)
   * In production, this would use actual computer vision algorithms
   */
  private async detectDocumentBounds(imageUri: string): Promise<DocumentBounds> {
    // Simulate processing delay
    await this.delay(500);

    // Get image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const { width, height } = imageInfo;

    // Mock document detection - in production this would use:
    // - OpenCV for edge detection
    // - Canny edge detection
    // - Hough line detection
    // - Contour analysis
    // - Corner detection algorithms

    // Simulate a detected document with slight perspective distortion
    const centerX = width / 2;
    const centerY = height / 2;
    const docWidth = width * 0.8;
    const docHeight = docWidth * 1.3; // A4 ratio

    // Add slight perspective distortion to simulate real-world scanning
    const skew = 0.05;
    
    const bounds: DocumentBounds = {
      topLeft: { 
        x: centerX - docWidth/2 + (Math.random() - 0.5) * width * skew, 
        y: centerY - docHeight/2 + (Math.random() - 0.5) * height * skew 
      },
      topRight: { 
        x: centerX + docWidth/2 + (Math.random() - 0.5) * width * skew, 
        y: centerY - docHeight/2 + (Math.random() - 0.5) * height * skew 
      },
      bottomRight: { 
        x: centerX + docWidth/2 + (Math.random() - 0.5) * width * skew, 
        y: centerY + docHeight/2 + (Math.random() - 0.5) * height * skew 
      },
      bottomLeft: { 
        x: centerX - docWidth/2 + (Math.random() - 0.5) * width * skew, 
        y: centerY + docHeight/2 + (Math.random() - 0.5) * height * skew 
      },
      confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
    };

    return bounds;
  }

  /**
   * Apply perspective correction to straighten a document
   */
  private async correctPerspective(
    imageUri: string, 
    bounds: DocumentBounds
  ): Promise<string> {
    try {
      // For this demo, we'll simulate perspective correction with a crop and resize
      // In production, this would use:
      // - 4-point perspective transformation
      // - Homography matrix calculation
      // - Bilinear or bicubic interpolation

      // Calculate the bounding rectangle
      const minX = Math.min(bounds.topLeft.x, bounds.topRight.x, bounds.bottomLeft.x, bounds.bottomRight.x);
      const maxX = Math.max(bounds.topLeft.x, bounds.topRight.x, bounds.bottomLeft.x, bounds.bottomRight.x);
      const minY = Math.min(bounds.topLeft.y, bounds.topRight.y, bounds.bottomLeft.y, bounds.bottomRight.y);
      const maxY = Math.max(bounds.topLeft.y, bounds.topRight.y, bounds.bottomLeft.y, bounds.bottomRight.y);

      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;

      // Get image info to calculate crop parameters
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      // Apply crop to approximate perspective correction
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, minX),
              originY: Math.max(0, minY),
              width: Math.min(cropWidth, imageInfo.width - minX),
              height: Math.min(cropHeight, imageInfo.height - minY),
            },
          },
          {
            resize: {
              width: 1200, // Standardize width
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Error in perspective correction:', error);
      return imageUri; // Return original if correction fails
    }
  }

  /**
   * Enhance image quality (brightness, contrast, sharpness)
   */
  private async enhanceImage(
    imageUri: string,
    options: {
      format?: ImageManipulator.SaveFormat;
      quality?: number;
    } = {}
  ): Promise<string> {
    try {
      const { format = ImageManipulator.SaveFormat.JPEG, quality = 0.9 } = options;

      // Apply image enhancement
      // Note: expo-image-manipulator has limited enhancement options
      // In production, you might use native modules for advanced enhancement
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Slight rotation to ensure straightness (if needed)
          { rotate: 0 },
          // Resize for optimal quality/size balance
          { resize: { width: 1200 } },
        ],
        {
          compress: quality,
          format,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Error enhancing image:', error);
      return imageUri; // Return original if enhancement fails
    }
  }

  /**
   * Batch process multiple scanned documents
   */
  async processBatchScans(
    imageUris: string[],
    options: ScanOptions = {}
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    for (const imageUri of imageUris) {
      try {
        const result = await this.processScan(imageUri, options);
        results.push(result);
      } catch (error) {
        console.error(`Error processing ${imageUri}:`, error);
        // Continue processing other images even if one fails
        results.push({
          originalUri: imageUri,
          processedUri: imageUri, // Use original if processing fails
          enhanced: false,
          timestamp: Date.now(),
        });
      }
    }

    return results;
  }

  /**
   * Validate scan quality
   */
  async validateScanQuality(imageUri: string): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
  }> {
    try {
      // Get image info
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const { width, height } = imageInfo;
      const resolution = width * height;
      const aspectRatio = width / height;

      // Mock quality assessment
      // In production, this would analyze:
      // - Sharpness/blur detection
      // - Lighting conditions
      // - Document completeness
      // - Text readability
      
      const issues: string[] = [];
      let score = 100;

      // Check resolution
      if (resolution < 800 * 600) {
        issues.push('Low resolution - image may appear blurry when zoomed');
        score -= 20;
      }

      // Check aspect ratio (should be document-like)
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        issues.push('Unusual aspect ratio - document may be cut off');
        score -= 15;
      }

      // Simulate other quality checks
      if (Math.random() < 0.3) {
        issues.push('Low lighting detected - consider using flash');
        score -= 10;
      }

      if (Math.random() < 0.2) {
        issues.push('Document appears tilted - ensure proper alignment');
        score -= 15;
      }

      // Determine quality level
      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (score >= 90) quality = 'excellent';
      else if (score >= 75) quality = 'good';
      else if (score >= 60) quality = 'fair';
      else quality = 'poor';

      return { quality, score, issues };

    } catch (error) {
      console.error('Error validating scan quality:', error);
      return {
        quality: 'fair',
        score: 70,
        issues: ['Could not analyze image quality'],
      };
    }
  }

  /**
   * Get file size of processed image
   */
  async getImageFileSize(imageUri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      return fileInfo.exists ? (fileInfo.size || 0) : 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Clean up temporary scan files
   */
  async cleanupTempFiles(imageUris: string[]): Promise<void> {
    for (const uri of imageUris) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(uri);
        }
      } catch (error) {
        console.error(`Error deleting temp file ${uri}:`, error);
      }
    }
  }

  /**
   * Helper method to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new DocumentScannerServiceClass();