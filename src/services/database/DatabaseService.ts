// @ts-nocheck
/**
 * DatabaseService - SQLite database management for DocsShelf
 * Uses expo-sqlite for Expo managed workflow
 * Production-ready for iOS and Android builds via EAS Build
 */

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'docsshelf.db';

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

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      console.log('✅ Database opened successfully');

      await this.createTables();
      console.log('✅ Database tables created');
      
      await this.runMigrations();
      console.log('✅ Database migrations completed');
      
      await this.createIndexes();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
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

    // Create base tables without indexes first
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT,
        icon TEXT NOT NULL DEFAULT 'folder',
        color TEXT NOT NULL DEFAULT '#4A90E2',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        originalName TEXT,
        categoryId TEXT,
        filePath TEXT NOT NULL,
        fileType TEXT NOT NULL,
        mimeType TEXT,
        fileSize INTEGER NOT NULL,
        fileHash TEXT,
        encrypted INTEGER NOT NULL DEFAULT 1,
        ocrText TEXT,
        tags TEXT,
        metadata TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        userId TEXT NOT NULL
      );
    `);
  }

  /**
   * Create database indexes (called after migrations)
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_categories_userId ON categories(userId);
        CREATE INDEX IF NOT EXISTS idx_categories_parentId ON categories(parentId);
        CREATE INDEX IF NOT EXISTS idx_documents_userId ON documents(userId);
        CREATE INDEX IF NOT EXISTS idx_documents_categoryId ON documents(categoryId);
        CREATE INDEX IF NOT EXISTS idx_documents_ocrText ON documents(ocrText);
        CREATE INDEX IF NOT EXISTS idx_documents_fileHash ON documents(fileHash);
      `);
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('⚠️ Index creation warning:', error);
      // Don't throw - indexes are optional for functionality
    }
  }

  /**
   * Run database migrations for schema changes
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if documents table exists and get its columns
      const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(documents)`);
      const existingColumns = tableInfo.map((col: any) => col.name);

      // Migration: Add new columns if they don't exist
      const columnsToAdd = [
        { name: 'originalName', type: 'TEXT', defaultValue: null },
        { name: 'mimeType', type: 'TEXT', defaultValue: null },
        { name: 'fileHash', type: 'TEXT', defaultValue: null },
        { name: 'metadata', type: 'TEXT', defaultValue: null },
      ];

      for (const column of columnsToAdd) {
        if (!existingColumns.includes(column.name)) {
          console.log(`📝 Adding column: ${column.name}`);
          const defaultClause = column.defaultValue !== null ? `DEFAULT ${column.defaultValue}` : '';
          await this.db.execAsync(
            `ALTER TABLE documents ADD COLUMN ${column.name} ${column.type} ${defaultClause};`
          );
          console.log(`✅ Column added: ${column.name}`);
        }
      }

      // Update existing documents to have categoryId = NULL if needed
      const categoryIdColumn = tableInfo.find((col: any) => col.name === 'categoryId');
      if (categoryIdColumn && categoryIdColumn.notnull === 1) {
        // categoryId is NOT NULL, but we need it to be nullable
        // SQLite doesn't support modifying columns, so we'll handle this in queries
        console.log('ℹ️ categoryId column exists (keeping as is)');
      }
    } catch (error) {
      console.error('❌ Migration error:', error);
      // Don't throw - migrations are optional and shouldn't break the app
    }
  }

  /**
   * CATEGORY CRUD OPERATIONS
   */

  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateUUID();
    const now = new Date().toISOString();

    const newCategory: Category = {
      id,
      ...category,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runAsync(
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
    if (!this.db) throw new Error('Database not initialized');

    const query = parentId
      ? `SELECT * FROM categories WHERE userId = ? AND parentId = ? ORDER BY name ASC`
      : `SELECT * FROM categories WHERE userId = ? AND parentId IS NULL ORDER BY name ASC`;

    const params = parentId ? [userId, parentId] : [userId];
    const result = await this.db.getAllAsync(query, params);
    
    return result as Category[];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM categories WHERE id = ?`,
      [id]
    );

    return result as Category | null;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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

    await this.db.runAsync(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete all subcategories first (manual cascade)
    const subcategories = await this.db.getAllAsync(
      `SELECT id FROM categories WHERE parentId = ?`,
      [id]
    );

    for (const subcat of subcategories as any[]) {
      await this.deleteCategory(subcat.id);
    }

    // Delete all documents in this category
    await this.db.runAsync(`DELETE FROM documents WHERE categoryId = ?`, [id]);
    
    // Delete the category
    await this.db.runAsync(`DELETE FROM categories WHERE id = ?`, [id]);
  }

  async getCategoryTree(userId: string): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM categories WHERE userId = ? ORDER BY name ASC`,
      [userId]
    );

    return result as Category[];
  }

  /**
   * DOCUMENT CRUD OPERATIONS
   */

  async createDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateUUID();
    const now = new Date().toISOString();

    const newDocument: Document = {
      id,
      ...document,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runAsync(
      `INSERT INTO documents (id, name, originalName, categoryId, filePath, fileType, mimeType, fileSize, fileHash, encrypted, ocrText, tags, metadata, createdAt, updatedAt, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newDocument.id,
        newDocument.name,
        newDocument.originalName || newDocument.name,
        newDocument.categoryId,
        newDocument.filePath,
        newDocument.fileType,
        newDocument.mimeType || null,
        newDocument.fileSize,
        newDocument.fileHash || null,
        newDocument.encrypted ? 1 : 0,
        newDocument.ocrText,
        typeof newDocument.tags === 'string' ? newDocument.tags : JSON.stringify(newDocument.tags || []),
        newDocument.metadata ? JSON.stringify(newDocument.metadata) : null,
        newDocument.createdAt,
        newDocument.updatedAt,
        newDocument.userId,
      ]
    );

    return newDocument;
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM documents WHERE categoryId = ? ORDER BY createdAt DESC`,
      [categoryId]
    );

    return (result as any[]).map(doc => ({
      ...doc,
      encrypted: doc.encrypted === 1,
    }));
  }

  async getDocumentById(id: string): Promise<Document | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM documents WHERE id = ?`,
      [id]
    );

    if (!result) return null;

    return {
      ...(result as any),
      encrypted: (result as any).encrypted === 1,
    };
  }

  async getDocumentByHash(fileHash: string, userId: string): Promise<Document | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT * FROM documents WHERE fileHash = ? AND userId = ?`,
      [fileHash, userId]
    );

    if (!result) return null;

    return {
      ...(result as any),
      encrypted: (result as any).encrypted === 1,
      tags: (result as any).tags ? JSON.parse((result as any).tags) : [],
      metadata: (result as any).metadata ? JSON.parse((result as any).metadata) : null,
    };
  }

  async searchDocuments(userId: string, searchTerm: string): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM documents 
       WHERE userId = ? AND (name LIKE ? OR ocrText LIKE ? OR tags LIKE ?)
       ORDER BY createdAt DESC`,
      [userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );

    return (result as any[]).map(doc => ({
      ...doc,
      encrypted: doc.encrypted === 1,
    }));
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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

    await this.db.runAsync(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`DELETE FROM documents WHERE id = ?`, [id]);
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
      await this.db.closeAsync();
      this.db = null;
      console.log('✅ Database closed');
    }
  }
}

export default new DatabaseService();
