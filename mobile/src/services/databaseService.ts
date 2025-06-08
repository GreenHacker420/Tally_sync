import SQLite from 'react-native-sqlite-storage';
import { Company, Voucher, InventoryItem, SyncSession } from '../types';

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

interface PendingChange {
  id: string;
  type: 'voucher' | 'item' | 'company';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  synced: boolean;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'finsync360.db';
  private readonly dbVersion = '1.0';
  private readonly dbDisplayName = 'FinSync360 Database';
  private readonly dbSize = 200000;

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        version: this.dbVersion,
        displayName: this.dbDisplayName,
        size: this.dbSize,
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Companies table
      `CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        gstNumber TEXT,
        panNumber TEXT,
        isActive INTEGER DEFAULT 1,
        settings TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        lastSyncedAt TEXT
      )`,

      // Vouchers table
      `CREATE TABLE IF NOT EXISTS vouchers (
        id TEXT PRIMARY KEY,
        voucherNumber TEXT NOT NULL,
        voucherType TEXT NOT NULL,
        date TEXT NOT NULL,
        reference TEXT,
        narration TEXT,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'draft',
        entries TEXT,
        companyId TEXT NOT NULL,
        createdBy TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        tallyId TEXT,
        lastSyncedAt TEXT,
        FOREIGN KEY (companyId) REFERENCES companies (id)
      )`,

      // Inventory items table
      `CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        category TEXT,
        unit TEXT,
        rate REAL DEFAULT 0,
        openingStock REAL DEFAULT 0,
        currentStock REAL DEFAULT 0,
        reorderLevel REAL DEFAULT 0,
        maxLevel REAL,
        location TEXT,
        isActive INTEGER DEFAULT 1,
        companyId TEXT NOT NULL,
        createdAt TEXT,
        updatedAt TEXT,
        tallyId TEXT,
        lastSyncedAt TEXT,
        FOREIGN KEY (companyId) REFERENCES companies (id)
      )`,

      // Pending changes table for offline sync
      `CREATE TABLE IF NOT EXISTS pending_changes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )`,

      // Sync history table
      `CREATE TABLE IF NOT EXISTS sync_history (
        id TEXT PRIMARY KEY,
        startTime TEXT NOT NULL,
        endTime TEXT,
        status TEXT NOT NULL,
        totalItems INTEGER DEFAULT 0,
        processedItems INTEGER DEFAULT 0,
        errors TEXT,
        summary TEXT
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT
      )`,
    ];

    for (const table of tables) {
      await this.db.executeSql(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vouchers_company ON vouchers(companyId)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(voucherType)',
      'CREATE INDEX IF NOT EXISTS idx_items_company ON inventory_items(companyId)',
      'CREATE INDEX IF NOT EXISTS idx_items_category ON inventory_items(category)',
      'CREATE INDEX IF NOT EXISTS idx_pending_changes_synced ON pending_changes(synced)',
    ];

    for (const index of indexes) {
      await this.db.executeSql(index);
    }
  }

  /**
   * Company operations
   */
  async upsertCompany(company: Company): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT OR REPLACE INTO companies 
      (id, name, email, phone, address, gstNumber, panNumber, isActive, settings, createdAt, updatedAt, lastSyncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      company.id,
      company.name,
      company.email,
      company.phone,
      company.address,
      company.gstNumber || null,
      company.panNumber || null,
      company.isActive ? 1 : 0,
      JSON.stringify(company.settings),
      company.createdAt,
      company.updatedAt,
      new Date().toISOString(),
    ]);
  }

  async getCompanies(): Promise<Company[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM companies WHERE isActive = 1');
    const companies: Company[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      companies.push({
        ...row,
        isActive: row.isActive === 1,
        settings: JSON.parse(row.settings || '{}'),
      });
    }

    return companies;
  }

  /**
   * Voucher operations
   */
  async upsertVoucher(voucher: Voucher): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT OR REPLACE INTO vouchers 
      (id, voucherNumber, voucherType, date, reference, narration, amount, status, entries, companyId, createdBy, createdAt, updatedAt, tallyId, lastSyncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      voucher.id,
      voucher.voucherNumber,
      voucher.voucherType,
      voucher.date,
      voucher.reference || null,
      voucher.narration || null,
      voucher.amount,
      voucher.status,
      JSON.stringify(voucher.entries),
      voucher.companyId,
      voucher.createdBy,
      voucher.createdAt,
      voucher.updatedAt,
      voucher.tallyId || null,
      new Date().toISOString(),
    ]);
  }

  async getVouchers(companyId?: string, limit = 100): Promise<Voucher[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM vouchers';
    const params: any[] = [];

    if (companyId) {
      sql += ' WHERE companyId = ?';
      params.push(companyId);
    }

    sql += ' ORDER BY date DESC, createdAt DESC LIMIT ?';
    params.push(limit);

    const [results] = await this.db.executeSql(sql, params);
    const vouchers: Voucher[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      vouchers.push({
        ...row,
        entries: JSON.parse(row.entries || '[]'),
      });
    }

    return vouchers;
  }

  /**
   * Inventory item operations
   */
  async upsertInventoryItem(item: InventoryItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT OR REPLACE INTO inventory_items 
      (id, name, code, description, category, unit, rate, openingStock, currentStock, reorderLevel, maxLevel, location, isActive, companyId, createdAt, updatedAt, tallyId, lastSyncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      item.id,
      item.name,
      item.code || null,
      item.description || null,
      item.category,
      item.unit,
      item.rate,
      item.openingStock,
      item.currentStock,
      item.reorderLevel,
      item.maxLevel || null,
      item.location || null,
      item.isActive ? 1 : 0,
      item.companyId,
      item.createdAt,
      item.updatedAt,
      item.tallyId || null,
      new Date().toISOString(),
    ]);
  }

  async getInventoryItems(companyId?: string): Promise<InventoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM inventory_items WHERE isActive = 1';
    const params: any[] = [];

    if (companyId) {
      sql += ' AND companyId = ?';
      params.push(companyId);
    }

    sql += ' ORDER BY name';

    const [results] = await this.db.executeSql(sql, params);
    const items: InventoryItem[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      items.push({
        ...row,
        isActive: row.isActive === 1,
      });
    }

    return items;
  }

  /**
   * Pending changes operations
   */
  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const sql = `
      INSERT INTO pending_changes (id, type, action, data, timestamp, synced)
      VALUES (?, ?, ?, ?, ?, 0)
    `;

    await this.db.executeSql(sql, [
      id,
      change.type,
      change.action,
      JSON.stringify(change.data),
      timestamp,
    ]);
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM pending_changes WHERE synced = 0 ORDER BY timestamp'
    );

    const changes: PendingChange[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      changes.push({
        ...row,
        data: JSON.parse(row.data),
        synced: row.synced === 1,
      });
    }

    return changes;
  }

  async getPendingChangesCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM pending_changes WHERE synced = 0'
    );

    return results.rows.item(0).count;
  }

  async markChangeAsSynced(changeId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      'UPDATE pending_changes SET synced = 1 WHERE id = ?',
      [changeId]
    );
  }

  /**
   * Sync history operations
   */
  async addSyncSession(session: SyncSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO sync_history (id, startTime, endTime, status, totalItems, processedItems, errors, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      session.id,
      session.startTime,
      session.endTime || null,
      session.status,
      session.totalItems,
      session.processedItems,
      JSON.stringify(session.errors),
      JSON.stringify(session.summary),
    ]);
  }

  async getSyncHistory(limit = 50): Promise<SyncSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM sync_history ORDER BY startTime DESC LIMIT ?',
      [limit]
    );

    const sessions: SyncSession[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      sessions.push({
        ...row,
        errors: JSON.parse(row.errors || '[]'),
        summary: JSON.parse(row.summary || '{}'),
      });
    }

    return sessions;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
