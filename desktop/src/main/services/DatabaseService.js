/**
 * Database Service for FinSync360 Desktop
 * Handles both MongoDB (online) and SQLite (offline) databases
 */

const { MongoClient } = require('mongodb');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const electronLog = require('electron-log');

class DatabaseService {
  constructor() {
    this.mongoClient = null;
    this.mongoDb = null;
    this.sqliteDb = null;
    this.isOnline = false;
    this.dbPath = path.join(app.getPath('userData'), 'finsync360.db');
    
    // Database schema for SQLite
    this.schema = {
      companies: `
        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY,
          companyName TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          email TEXT,
          gstin TEXT,
          pan TEXT,
          financialYearStart TEXT,
          financialYearEnd TEXT,
          baseCurrency TEXT DEFAULT 'INR',
          isActive INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          syncStatus TEXT DEFAULT 'pending'
        )
      `,
      vouchers: `
        CREATE TABLE IF NOT EXISTS vouchers (
          id TEXT PRIMARY KEY,
          companyId TEXT NOT NULL,
          voucherNumber TEXT NOT NULL,
          voucherType TEXT NOT NULL,
          date TEXT NOT NULL,
          reference TEXT,
          partyName TEXT,
          amount REAL NOT NULL,
          narration TEXT,
          ledgerEntries TEXT, -- JSON string
          isPosted INTEGER DEFAULT 0,
          createdBy TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          syncStatus TEXT DEFAULT 'pending',
          FOREIGN KEY (companyId) REFERENCES companies (id)
        )
      `,
      parties: `
        CREATE TABLE IF NOT EXISTS parties (
          id TEXT PRIMARY KEY,
          companyId TEXT NOT NULL,
          partyName TEXT NOT NULL,
          partyType TEXT NOT NULL, -- Customer, Supplier, Employee, etc.
          address TEXT,
          phone TEXT,
          email TEXT,
          gstin TEXT,
          pan TEXT,
          openingBalance REAL DEFAULT 0,
          creditLimit REAL DEFAULT 0,
          creditDays INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          syncStatus TEXT DEFAULT 'pending',
          FOREIGN KEY (companyId) REFERENCES companies (id)
        )
      `,
      inventory: `
        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY,
          companyId TEXT NOT NULL,
          itemName TEXT NOT NULL,
          itemCode TEXT,
          category TEXT,
          unit TEXT DEFAULT 'Nos',
          rate REAL DEFAULT 0,
          stockLevel REAL DEFAULT 0,
          reorderLevel REAL DEFAULT 0,
          maxLevel REAL DEFAULT 0,
          location TEXT,
          description TEXT,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          syncStatus TEXT DEFAULT 'pending',
          FOREIGN KEY (companyId) REFERENCES companies (id)
        )
      `,
      users: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          permissions TEXT, -- JSON string
          isActive INTEGER DEFAULT 1,
          lastLogin TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          syncStatus TEXT DEFAULT 'pending'
        )
      `,
      sync_queue: `
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          operation TEXT NOT NULL, -- create, update, delete
          tableName TEXT NOT NULL,
          recordId TEXT NOT NULL,
          data TEXT, -- JSON string
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'pending', -- pending, synced, failed
          retryCount INTEGER DEFAULT 0,
          error TEXT
        )
      `,
      settings: `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
    };
  }

  async initialize() {
    try {
      electronLog.info('Initializing database service...');
      
      // Initialize SQLite database
      await this.initializeSQLite();
      
      // Try to connect to MongoDB
      await this.connectMongoDB();
      
      electronLog.info('Database service initialized successfully');
    } catch (error) {
      electronLog.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  async initializeSQLite() {
    try {
      // Ensure the directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open SQLite database
      this.sqliteDb = new Database(this.dbPath);
      
      // Enable foreign keys
      this.sqliteDb.pragma('foreign_keys = ON');
      
      // Create tables
      for (const [tableName, schema] of Object.entries(this.schema)) {
        this.sqliteDb.exec(schema);
      }
      
      // Create indexes for better performance
      this.createIndexes();
      
      electronLog.info('SQLite database initialized');
    } catch (error) {
      electronLog.error('Failed to initialize SQLite:', error);
      throw error;
    }
  }

  createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vouchers_company_date ON vouchers(companyId, date)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(voucherType)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_party ON vouchers(partyName)',
      'CREATE INDEX IF NOT EXISTS idx_parties_company_type ON parties(companyId, partyType)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory(companyId)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(tableName)'
    ];

    indexes.forEach(index => {
      try {
        this.sqliteDb.exec(index);
      } catch (error) {
        electronLog.warn('Failed to create index:', error.message);
      }
    });
  }

  async connectMongoDB() {
    try {
      const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
      const dbName = process.env.DATABASE_NAME || 'finsync360';
      
      this.mongoClient = new MongoClient(mongoUrl, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db(dbName);
      
      // Test the connection
      await this.mongoDb.admin().ping();
      
      this.isOnline = true;
      electronLog.info('Connected to MongoDB');
    } catch (error) {
      electronLog.warn('Failed to connect to MongoDB, running in offline mode:', error.message);
      this.isOnline = false;
    }
  }

  // SQLite operations
  async query(sql, params = []) {
    try {
      if (!this.sqliteDb) {
        throw new Error('SQLite database not initialized');
      }
      
      const stmt = this.sqliteDb.prepare(sql);
      const result = stmt.all(params);
      return result;
    } catch (error) {
      electronLog.error('SQLite query error:', error);
      throw error;
    }
  }

  async run(sql, params = []) {
    try {
      if (!this.sqliteDb) {
        throw new Error('SQLite database not initialized');
      }
      
      const stmt = this.sqliteDb.prepare(sql);
      const result = stmt.run(params);
      return result;
    } catch (error) {
      electronLog.error('SQLite run error:', error);
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      if (!this.sqliteDb) {
        throw new Error('SQLite database not initialized');
      }
      
      const stmt = this.sqliteDb.prepare(sql);
      const result = stmt.get(params);
      return result;
    } catch (error) {
      electronLog.error('SQLite get error:', error);
      throw error;
    }
  }

  // MongoDB operations
  async getMongoCollection(collectionName) {
    if (!this.isOnline || !this.mongoDb) {
      throw new Error('MongoDB not available');
    }
    return this.mongoDb.collection(collectionName);
  }

  async findMongo(collectionName, filter = {}, options = {}) {
    try {
      const collection = await this.getMongoCollection(collectionName);
      const cursor = collection.find(filter, options);
      return await cursor.toArray();
    } catch (error) {
      electronLog.error('MongoDB find error:', error);
      throw error;
    }
  }

  async findOneMongo(collectionName, filter = {}, options = {}) {
    try {
      const collection = await this.getMongoCollection(collectionName);
      return await collection.findOne(filter, options);
    } catch (error) {
      electronLog.error('MongoDB findOne error:', error);
      throw error;
    }
  }

  async insertOneMongo(collectionName, document) {
    try {
      const collection = await this.getMongoCollection(collectionName);
      const result = await collection.insertOne(document);
      return result;
    } catch (error) {
      electronLog.error('MongoDB insertOne error:', error);
      throw error;
    }
  }

  async updateOneMongo(collectionName, filter, update, options = {}) {
    try {
      const collection = await this.getMongoCollection(collectionName);
      const result = await collection.updateOne(filter, update, options);
      return result;
    } catch (error) {
      electronLog.error('MongoDB updateOne error:', error);
      throw error;
    }
  }

  async deleteOneMongo(collectionName, filter) {
    try {
      const collection = await this.getMongoCollection(collectionName);
      const result = await collection.deleteOne(filter);
      return result;
    } catch (error) {
      electronLog.error('MongoDB deleteOne error:', error);
      throw error;
    }
  }

  // Unified operations (try MongoDB first, fallback to SQLite)
  async findUnified(tableName, filter = {}, options = {}) {
    if (this.isOnline) {
      try {
        return await this.findMongo(tableName, filter, options);
      } catch (error) {
        electronLog.warn('MongoDB query failed, falling back to SQLite:', error.message);
      }
    }
    
    // Fallback to SQLite
    const sql = this.buildSelectSQL(tableName, filter, options);
    return await this.query(sql.query, sql.params);
  }

  async insertUnified(tableName, document) {
    // Always insert to SQLite first
    const sql = this.buildInsertSQL(tableName, document);
    await this.run(sql.query, sql.params);
    
    // Try to sync to MongoDB if online
    if (this.isOnline) {
      try {
        await this.insertOneMongo(tableName, document);
      } catch (error) {
        electronLog.warn('Failed to sync to MongoDB, queued for later:', error.message);
        await this.queueSyncOperation('create', tableName, document.id, document);
      }
    } else {
      await this.queueSyncOperation('create', tableName, document.id, document);
    }
    
    return { insertedId: document.id };
  }

  async updateUnified(tableName, filter, update) {
    // Update SQLite first
    const sql = this.buildUpdateSQL(tableName, filter, update);
    await this.run(sql.query, sql.params);
    
    // Try to sync to MongoDB if online
    if (this.isOnline) {
      try {
        await this.updateOneMongo(tableName, filter, { $set: update });
      } catch (error) {
        electronLog.warn('Failed to sync to MongoDB, queued for later:', error.message);
        await this.queueSyncOperation('update', tableName, filter.id, update);
      }
    } else {
      await this.queueSyncOperation('update', tableName, filter.id, update);
    }
    
    return { modifiedCount: 1 };
  }

  async deleteUnified(tableName, filter) {
    // Delete from SQLite first
    const sql = this.buildDeleteSQL(tableName, filter);
    await this.run(sql.query, sql.params);
    
    // Try to sync to MongoDB if online
    if (this.isOnline) {
      try {
        await this.deleteOneMongo(tableName, filter);
      } catch (error) {
        electronLog.warn('Failed to sync to MongoDB, queued for later:', error.message);
        await this.queueSyncOperation('delete', tableName, filter.id, null);
      }
    } else {
      await this.queueSyncOperation('delete', tableName, filter.id, null);
    }
    
    return { deletedCount: 1 };
  }

  // Queue sync operations for offline mode
  async queueSyncOperation(operation, tableName, recordId, data) {
    const sql = `
      INSERT INTO sync_queue (operation, tableName, recordId, data)
      VALUES (?, ?, ?, ?)
    `;
    const params = [operation, tableName, recordId, data ? JSON.stringify(data) : null];
    await this.run(sql, params);
  }

  // Get pending sync operations
  async getPendingSyncOperations() {
    const sql = `
      SELECT * FROM sync_queue 
      WHERE status = 'pending' 
      ORDER BY timestamp ASC
    `;
    return await this.query(sql);
  }

  // Mark sync operation as completed
  async markSyncOperationCompleted(id) {
    const sql = `UPDATE sync_queue SET status = 'synced' WHERE id = ?`;
    await this.run(sql, [id]);
  }

  // Mark sync operation as failed
  async markSyncOperationFailed(id, error) {
    const sql = `
      UPDATE sync_queue 
      SET status = 'failed', error = ?, retryCount = retryCount + 1 
      WHERE id = ?
    `;
    await this.run(sql, [error, id]);
  }

  // SQL builders (simplified versions)
  buildSelectSQL(tableName, filter, options) {
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    
    if (Object.keys(filter).length > 0) {
      const conditions = Object.keys(filter).map(key => {
        params.push(filter[key]);
        return `${key} = ?`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    if (options.sort) {
      const sortFields = Object.keys(options.sort).map(key => 
        `${key} ${options.sort[key] === 1 ? 'ASC' : 'DESC'}`
      );
      query += ` ORDER BY ${sortFields.join(', ')}`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    return { query, params };
  }

  buildInsertSQL(tableName, document) {
    const fields = Object.keys(document);
    const placeholders = fields.map(() => '?').join(', ');
    const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const params = fields.map(field => document[field]);
    
    return { query, params };
  }

  buildUpdateSQL(tableName, filter, update) {
    const setFields = Object.keys(update).map(key => `${key} = ?`);
    const whereFields = Object.keys(filter).map(key => `${key} = ?`);
    
    const query = `UPDATE ${tableName} SET ${setFields.join(', ')} WHERE ${whereFields.join(' AND ')}`;
    const params = [...Object.values(update), ...Object.values(filter)];
    
    return { query, params };
  }

  buildDeleteSQL(tableName, filter) {
    const whereFields = Object.keys(filter).map(key => `${key} = ?`);
    const query = `DELETE FROM ${tableName} WHERE ${whereFields.join(' AND ')}`;
    const params = Object.values(filter);
    
    return { query, params };
  }

  // Connection status
  isConnectedToMongo() {
    return this.isOnline;
  }

  // Close connections
  async close() {
    try {
      if (this.sqliteDb) {
        this.sqliteDb.close();
        this.sqliteDb = null;
      }
      
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.mongoClient = null;
        this.mongoDb = null;
      }
      
      electronLog.info('Database connections closed');
    } catch (error) {
      electronLog.error('Error closing database connections:', error);
    }
  }
}

module.exports = DatabaseService;
