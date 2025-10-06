// @ts-nocheck
/**
 * DatabaseService - SQLite database management for DocsShelf
 * Handles database initialization, migrations, and CRUD operations
 * 
 * Uses expo-sqlite for Expo managed workflow
 * Production-ready for iOS and Android builds
 */

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'docsshelf.db';
const DATABASE_VERSION = 1;

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
  categoryId: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  encrypted: boolean;
  ocrText: string | null;
  tags: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Open database using expo-sqlite
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      console.log('Database opened successfully');

      // Create tables
      await this.createTables();
      
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const queries = [
      // Categories table with hierarchical structure
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT,
        icon TEXT NOT NULL DEFAULT 'folder',
        color TEXT NOT NULL DEFAULT '#4A90E2',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL,
        FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE CASCADE
      )`,

      // Documents table
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        filePath TEXT NOT NULL,
        fileType TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        encrypted INTEGER NOT NULL DEFAULT 1,
        ocrText TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_categories_userId ON categories(userId)`,
      `CREATE INDEX IF NOT EXISTS idx_categories_parentId ON categories(parentId)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_userId ON documents(userId)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_categoryId ON documents(categoryId)`,
      `CREATE INDEX IF NOT EXISTS idx_documents_ocrText ON documents(ocrText)`,
    ];

    // Execute all queries
    for (const query of queries) {
      await this.db.execAsync(query);
    }
  }

  /**
   * CATEGORY CRUD OPERATIONS
   */

  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const id = this.generateUUID();
    const now = new Date().toISOString();

    const newCategory: Category = {
      id,
      ...category,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.executeSql(
      `INSERT INTO categories (id, name, parentId, icon, color, createdAt, updatedAt, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCategory.id,
        newCategory.name,
        newCategory.parentId,
        newCategory.icon,
        newCategory.color,
        newCategory.createdAt,
        newCategory.updatedAt,
        newCategory.userId,
      ]
    );

    return newCategory;
  }

  async getCategories(userId: string, parentId: string | null = null): Promise<Category[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const query = parentId
      ? `SELECT * FROM categories WHERE userId = ? AND parentId = ? ORDER BY name ASC`
      : `SELECT * FROM categories WHERE userId = ? AND parentId IS NULL ORDER BY name ASC`;

    const params = parentId ? [userId, parentId] : [userId];

    const [results] = await this.db.executeSql(query, params);
    
    const categories: Category[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      categories.push(results.rows.item(i));
    }

    return categories;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const [results] = await this.db.executeSql(
      `SELECT * FROM categories WHERE id = ?`,
      [id]
    );

    if (results.rows.length === 0) {
      return null;
    }

    return results.rows.item(0);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.db.executeSql(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Delete category and all its subcategories (cascades)
    await this.db.executeSql(
      `DELETE FROM categories WHERE id = ?`,
      [id]
    );
  }

  async getCategoryTree(userId: string): Promise<Category[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Get all categories for the user
    const [results] = await this.db.executeSql(
      `SELECT * FROM categories WHERE userId = ? ORDER BY name ASC`,
      [userId]
    );

    const categories: Category[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      categories.push(results.rows.item(i));
    }

    return categories;
  }

  /**
   * DOCUMENT CRUD OPERATIONS
   */

  async createDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const id = this.generateUUID();
    const now = new Date().toISOString();

    const newDocument: Document = {
      id,
      ...document,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.executeSql(
      `INSERT INTO documents (id, name, categoryId, filePath, fileType, fileSize, encrypted, ocrText, tags, createdAt, updatedAt, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newDocument.id,
        newDocument.name,
        newDocument.categoryId,
        newDocument.filePath,
        newDocument.fileType,
        newDocument.fileSize,
        newDocument.encrypted ? 1 : 0,
        newDocument.ocrText,
        newDocument.tags,
        newDocument.createdAt,
        newDocument.updatedAt,
        newDocument.userId,
      ]
    );

    return newDocument;
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const [results] = await this.db.executeSql(
      `SELECT * FROM documents WHERE categoryId = ? ORDER BY createdAt DESC`,
      [categoryId]
    );

    const documents: Document[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const doc = results.rows.item(i);
      documents.push({
        ...doc,
        encrypted: doc.encrypted === 1,
      });
    }

    return documents;
  }

  async getDocumentById(id: string): Promise<Document | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const [results] = await this.db.executeSql(
      `SELECT * FROM documents WHERE id = ?`,
      [id]
    );

    if (results.rows.length === 0) {
      return null;
    }

    const doc = results.rows.item(0);
    return {
      ...doc,
      encrypted: doc.encrypted === 1,
    };
  }

  async searchDocuments(userId: string, searchTerm: string): Promise<Document[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const [results] = await this.db.executeSql(
      `SELECT * FROM documents 
       WHERE userId = ? AND (name LIKE ? OR ocrText LIKE ? OR tags LIKE ?)
       ORDER BY createdAt DESC`,
      [userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );

    const documents: Document[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const doc = results.rows.item(i);
      documents.push({
        ...doc,
        encrypted: doc.encrypted === 1,
      });
    }

    return documents;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        if (key === 'encrypted') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    });

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.db.executeSql(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.executeSql(
      `DELETE FROM documents WHERE id = ?`,
      [id]
    );
  }

  /**
   * Utility Functions
   */

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database closed');
    }
  }
}

export default new DatabaseService();
