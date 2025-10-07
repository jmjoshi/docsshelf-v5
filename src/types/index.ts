/**
 * Global Type Definitions for DocsShelf v4
 * Comprehensive type system for the entire application
 */

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: PhoneNumber[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
}

export interface PhoneNumber {
  id: string;
  type: 'mobile' | 'home' | 'work';
  number: string;
  verified: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  backup: BackupSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  documentProcessing: boolean;
  backupReminders: boolean;
  securityAlerts: boolean;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  crashReports: boolean;
  biometricData: boolean;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptionEnabled: boolean;
  includeMetadata: boolean;
}

// ==================== SECURITY TYPES ====================

export interface SecuritySettings {
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  biometricType: BiometricType | null;
  totpEnabled: boolean;
  smsEnabled: boolean;
  trustedDevices: TrustedDevice[];
  sessionTimeout: number; // minutes
  autoLockEnabled: boolean;
  autoLockTime: number; // minutes
}

export type BiometricType = 'fingerprint' | 'faceId' | 'voice' | 'iris';

export interface TrustedDevice {
  id: string;
  name: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  addedAt: string;
  lastUsed: string;
  isActive: boolean;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

export interface EncryptionKey {
  id: string;
  keyData: string; // Base64 encoded
  algorithm: 'AES-256-CBC';
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// ==================== DOCUMENT TYPES ====================

export interface Document {
  id: string;
  name: string;
  originalName: string;
  filePath: string;
  encryptedPath: string;
  size: number;
  mimeType: string;
  extension: string;
  categoryId?: string;
  folderId?: string;
  tags: Tag[];
  metadata: DocumentMetadata;
  ocrData?: OCRData;
  thumbnailPath?: string;
  checksum: string; // SHA-256 hash
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
  version: number;
  isEncrypted: boolean;
  encryptionKeyId?: string;
}

export interface DocumentMetadata {
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  createdDate?: string;
  modifiedDate?: string;
  pages?: number;
  language?: string;
  classification?: DocumentClassification;
  confidence?: number; // 0-1 confidence score
  extractedEntities?: ExtractedEntity[];
}

export type DocumentClassification = 
  | 'invoice' 
  | 'receipt' 
  | 'contract' 
  | 'id_document' 
  | 'medical_record' 
  | 'financial_statement' 
  | 'legal_document' 
  | 'personal_document' 
  | 'business_document' 
  | 'other';

export interface ExtractedEntity {
  type: 'date' | 'amount' | 'name' | 'address' | 'email' | 'phone' | 'custom';
  value: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRData {
  text: string;
  confidence: number;
  language: string;
  blocks: OCRBlock[];
  processedAt: string;
  processingTime: number; // milliseconds
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: OCRLine[];
}

export interface OCRLine {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ==================== CATEGORY & FOLDER TYPES ====================

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentId?: string;
  children: Category[];
  documentCount: number;
  rules: CategoryRule[];
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  parentId?: string;
  children: Folder[];
  documentCount: number;
  path: string; // Full path from root
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface CategoryRule {
  id: string;
  type: 'keyword' | 'file_type' | 'size' | 'date' | 'content';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  isActive: boolean;
}

// ==================== TAG TYPES ====================

export interface Tag {
  id: string;
  name: string;
  color: string;
  parentId?: string;
  children: Tag[];
  documentCount: number;
  isSystem: boolean; // System tags vs user-created
  createdAt: string;
  updatedAt: string;
}

// ==================== SEARCH TYPES ====================

export interface SearchQuery {
  id?: string;
  query: string;
  filters: SearchFilter[];
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export interface SearchFilter {
  type: 'category' | 'folder' | 'tag' | 'date' | 'size' | 'file_type' | 'text';
  field: string;
  operator: 'equals' | 'contains' | 'between' | 'greater_than' | 'less_than';
  value: string | number | Date | [Date, Date] | [number, number];
}

export interface SearchResult {
  documents: Document[];
  totalCount: number;
  facets: SearchFacet[];
  executionTime: number; // milliseconds
  query: SearchQuery;
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export type SortOption = 
  | 'relevance' 
  | 'name' 
  | 'created_date' 
  | 'modified_date' 
  | 'accessed_date' 
  | 'size' 
  | 'category' 
  | 'file_type';

// ==================== BACKUP & SYNC TYPES ====================

export interface BackupConfig {
  id: string;
  name: string;
  type: 'local' | 'external_device' | 'network';
  destination: string;
  schedule: BackupSchedule;
  encryption: BackupEncryption;
  includeFiles: string[]; // File patterns to include
  excludeFiles: string[]; // File patterns to exclude
  retentionPolicy: RetentionPolicy;
  isActive: boolean;
  lastBackup?: BackupRecord;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSchedule {
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
}

export interface BackupEncryption {
  enabled: boolean;
  algorithm: 'AES-256-CBC';
  keyDerivation: 'PBKDF2';
  iterations: number;
}

export interface RetentionPolicy {
  maxBackups: number;
  maxAge: number; // days
  sizeLimit: number; // bytes
}

export interface BackupRecord {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number; // seconds
  filesCount: number;
  totalSize: number; // bytes
  compressedSize: number; // bytes
  checksum: string;
  errorMessage?: string;
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  appVersion: string;
  databaseVersion: string;
  deviceInfo: {
    platform: string;
    osVersion: string;
    modelName: string;
  };
  encryptionInfo: {
    algorithm: string;
    keyId: string;
  };
}

// ==================== SHARING TYPES ====================

export interface ShareConfig {
  id: string;
  documentIds: string[];
  type: 'nfc' | 'qr_code' | 'email' | 'link';
  accessLevel: 'view' | 'download';
  expiresAt?: string;
  passwordProtected: boolean;
  password?: string;
  maxUses?: number;
  currentUses: number;
  recipientInfo?: RecipientInfo;
  createdAt: string;
  isActive: boolean;
}

export interface RecipientInfo {
  name?: string;
  email?: string;
  phone?: string;
  deviceId?: string;
}

export interface ShareRecord {
  id: string;
  shareConfigId: string;
  accessedAt: string;
  accessorInfo: {
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  action: 'view' | 'download';
  documentId: string;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId: string;
}

export interface UsageStatistics {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  metrics: {
    documentsUploaded: number;
    documentsScanned: number;
    searchesPerformed: number;
    backupsCreated: number;
    sharesCreated: number;
    ocrProcessed: number;
    storageUsed: number; // bytes
    activeTime: number; // minutes
  };
}

// ==================== API TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== NAVIGATION TYPES ====================

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Register: undefined;
  MFAChallenge: { userId: string };
  TOTPSetup: { userId: string };
  BiometricSetup: { userId: string };
  CategoryManagement: undefined;
  DocumentUpload: { categoryId?: string };
  Main: undefined;
  DocumentViewer: { documentId: string };
  Scanner: { categoryId?: string; folderId?: string };
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MFASetup: { userId: string };
  BiometricSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Documents: undefined;
  Categories: undefined;
  Search: undefined;
  Profile: undefined;
};

export type DocumentStackParamList = {
  DocumentList: { categoryId?: string; folderId?: string };
  DocumentViewer: { documentId: string };
  DocumentEdit: { documentId: string };
};

// ==================== REDUX STORE TYPES ====================

export interface RootState {
  auth: AuthState;
  documents: DocumentState;
  categories: CategoryState;
  search: SearchState;
  backup: BackupState;
  settings: SettingsState;
  ui: UIState;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: AuthToken | null;
  biometricAvailable: boolean;
  mfaRequired: boolean;
  loading: boolean;
  error: string | null;
}

export interface DocumentState {
  documents: Record<string, Document>;
  currentDocument: Document | null;
  uploadQueue: UploadQueueItem[];
  loading: boolean;
  error: string | null;
}

export interface UploadQueueItem {
  id: string;
  file: FileInfo;
  categoryId?: string;
  folderId?: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  lastModified: number;
}

export interface CategoryState {
  categories: Record<string, Category>;
  folders: Record<string, Folder>;
  currentCategory: Category | null;
  currentFolder: Folder | null;
  loading: boolean;
  error: string | null;
}

export interface SearchState {
  query: SearchQuery | null;
  results: SearchResult | null;
  history: SearchQuery[];
  savedQueries: SearchQuery[];
  loading: boolean;
  error: string | null;
}

export interface BackupState {
  configs: BackupConfig[];
  currentBackup: BackupRecord | null;
  history: BackupRecord[];
  loading: boolean;
  error: string | null;
}

export interface SettingsState {
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  isOnboarded: boolean;
  activeModal: string | null;
  notifications: Notification[];
  loading: {
    global: boolean;
    components: Record<string, boolean>;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number; // milliseconds, undefined = persistent
  timestamp: string;
}

// ==================== UTILITY TYPES ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DatabaseEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEntityInput<T extends DatabaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateEntityInput<T extends DatabaseEntity> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  id: string;
};