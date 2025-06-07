// MongoDB initialization script
db = db.getSiblingDB('finsync360');

// Create collections with indexes
db.createCollection('users');
db.createCollection('companies');
db.createCollection('vouchers');
db.createCollection('parties');
db.createCollection('items');
db.createCollection('ledgers');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ companies: 1 });
db.users.createIndex({ isActive: 1 });

db.companies.createIndex({ gstin: 1 }, { unique: true, sparse: true });
db.companies.createIndex({ createdBy: 1 });
db.companies.createIndex({ isActive: 1 });
db.companies.createIndex({ 'users.user': 1 });

db.vouchers.createIndex({ company: 1, voucherType: 1, voucherNumber: 1 }, { unique: true });
db.vouchers.createIndex({ company: 1, date: -1 });
db.vouchers.createIndex({ company: 1, party: 1 });
db.vouchers.createIndex({ company: 1, status: 1 });
db.vouchers.createIndex({ company: 1, dueDate: 1 });
db.vouchers.createIndex({ 'tallySync.synced': 1 });

db.parties.createIndex({ company: 1, name: 1 });
db.parties.createIndex({ company: 1, type: 1 });
db.parties.createIndex({ company: 1, gstin: 1 });
db.parties.createIndex({ company: 1, isActive: 1 });
db.parties.createIndex({ 'contact.phone': 1 });
db.parties.createIndex({ 'contact.email': 1 });

db.items.createIndex({ company: 1, name: 1 });
db.items.createIndex({ company: 1, code: 1 });
db.items.createIndex({ company: 1, barcode: 1 });
db.items.createIndex({ company: 1, category: 1 });
db.items.createIndex({ company: 1, type: 1 });
db.items.createIndex({ company: 1, isActive: 1 });
db.items.createIndex({ 'taxation.hsnCode': 1 });

print('Database initialized successfully with collections and indexes');
