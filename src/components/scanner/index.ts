/**
 * Platform-Specific Document Scanner Component Wrapper
 * Automatically loads the appropriate scanner for current platform
 */

import { loadPlatformComponent } from '../../utils/Platform';

// Platform-specific component imports
import DocumentScannerNative from './DocumentScanner.native';

interface DocumentScannerProps {
  onDocumentScanned: (fileOrUri: File | string) => void;
  onError: (error: string) => void;
}

/**
 * Main Document Scanner Component
 * Uses platform detection to load appropriate scanner implementation
 */
const DocumentScanner = loadPlatformComponent({
  // Web version would be imported here when web components are needed
  // web: DocumentScannerWeb,
  native: DocumentScannerNative,
  default: DocumentScannerNative,
});

export default DocumentScanner;
export type { DocumentScannerProps };