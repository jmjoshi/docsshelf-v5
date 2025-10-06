// @ts-nocheck
/**
 * Document Redux Slice
 * Manages document and category state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Document {
  id: string;
  name: string;
  originalName?: string;
  categoryId: string | null;
  filePath: string;
  fileType: string;
  mimeType?: string;
  fileSize: number;
  fileHash?: string;
  encrypted: boolean;
  ocrText: string | null;
  tags: string | string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface DocumentState {
  categories: Category[];
  documents: Document[];
  selectedCategory: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  categories: [],
  documents: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    // Categories
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(cat => cat.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload);
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },

    // Documents
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload);
    },
    updateDocument: (state, action: PayloadAction<Document>) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
    },
    removeDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
    },

    // Loading and Error
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset
    resetDocumentState: () => initialState,
  },
});

export const {
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setSelectedCategory,
  setDocuments,
  addDocument,
  updateDocument,
  removeDocument,
  setLoading,
  setError,
  clearError,
  resetDocumentState,
} = documentSlice.actions;

export default documentSlice.reducer;
