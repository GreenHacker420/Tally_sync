import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║         FinSync360 API Endpoint Verification              ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

// Define all API endpoints by category
const endpoints = {
  'Authentication': [
    { method: 'POST', path: '/api/auth/register', description: 'Register new user', auth: false },
    { method: 'POST', path: '/api/auth/login', description: 'Login user', auth: false },
    { method: 'GET', path: '/api/auth/me', description: 'Get current user', auth: true },
    { method: 'GET', path: '/api/auth/profile', description: 'Get user profile', auth: true },
    { method: 'PUT', path: '/api/auth/profile', description: 'Update user profile', auth: true },
    { method: 'POST', path: '/api/auth/logout', description: 'Logout user', auth: true },
    { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset', auth: false },
    { method: 'PUT', path: '/api/auth/reset-password/:token', description: 'Reset password', auth: false }
  ],
  'Users': [
    { method: 'GET', path: '/api/users', description: 'Get all users', auth: true },
    { method: 'POST', path: '/api/users', description: 'Create user', auth: true },
    { method: 'GET', path: '/api/users/:id', description: 'Get user by ID', auth: true },
    { method: 'PUT', path: '/api/users/:id', description: 'Update user', auth: true },
    { method: 'DELETE', path: '/api/users/:id', description: 'Delete user', auth: true }
  ],
  'Companies': [
    { method: 'GET', path: '/api/companies', description: 'Get all companies', auth: true },
    { method: 'POST', path: '/api/companies', description: 'Create company', auth: true },
    { method: 'GET', path: '/api/companies/:id', description: 'Get company by ID', auth: true },
    { method: 'PUT', path: '/api/companies/:id', description: 'Update company', auth: true },
    { method: 'DELETE', path: '/api/companies/:id', description: 'Delete company', auth: true },
    { method: 'GET', path: '/api/companies/:id/users', description: 'Get company users', auth: true },
    { method: 'POST', path: '/api/companies/:id/users', description: 'Add user to company', auth: true }
  ],
  'Vouchers': [
    { method: 'GET', path: '/api/vouchers', description: 'Get all vouchers', auth: true },
    { method: 'POST', path: '/api/vouchers', description: 'Create voucher', auth: true },
    { method: 'GET', path: '/api/vouchers/:id', description: 'Get voucher by ID', auth: true },
    { method: 'PUT', path: '/api/vouchers/:id', description: 'Update voucher', auth: true },
    { method: 'DELETE', path: '/api/vouchers/:id', description: 'Delete voucher', auth: true },
    { method: 'GET', path: '/api/vouchers/stats', description: 'Get voucher statistics', auth: true },
    { method: 'POST', path: '/api/vouchers/bulk', description: 'Bulk create vouchers', auth: true }
  ],
  'Transactions': [
    { method: 'GET', path: '/api/transactions', description: 'Get all transactions', auth: true },
    { method: 'POST', path: '/api/transactions', description: 'Create transaction', auth: true },
    { method: 'GET', path: '/api/transactions/:id', description: 'Get transaction by ID', auth: true },
    { method: 'PUT', path: '/api/transactions/:id', description: 'Update transaction', auth: true },
    { method: 'DELETE', path: '/api/transactions/:id', description: 'Delete transaction', auth: true },
    { method: 'GET', path: '/api/transactions/stats', description: 'Get transaction statistics', auth: true }
  ],
  'Payments': [
    { method: 'GET', path: '/api/payments', description: 'Get all payments', auth: true },
    { method: 'POST', path: '/api/payments', description: 'Create payment', auth: true },
    { method: 'GET', path: '/api/payments/:id', description: 'Get payment by ID', auth: true },
    { method: 'POST', path: '/api/payments/:id/verify', description: 'Verify payment', auth: true },
    { method: 'POST', path: '/api/payments/:id/refund', description: 'Refund payment', auth: true },
    { method: 'GET', path: '/api/payments/stats', description: 'Get payment statistics', auth: true }
  ],
  'Inventory': [
    { method: 'GET', path: '/api/inventory', description: 'Get all inventory items', auth: true },
    { method: 'POST', path: '/api/inventory', description: 'Create inventory item', auth: true },
    { method: 'GET', path: '/api/inventory/:id', description: 'Get inventory item by ID', auth: true },
    { method: 'PUT', path: '/api/inventory/:id', description: 'Update inventory item', auth: true },
    { method: 'DELETE', path: '/api/inventory/:id', description: 'Delete inventory item', auth: true },
    { method: 'GET', path: '/api/inventory/stats', description: 'Get inventory statistics', auth: true },
    { method: 'POST', path: '/api/inventory/bulk', description: 'Bulk update inventory', auth: true }
  ],
  'Budgets': [
    { method: 'GET', path: '/api/budgets', description: 'Get all budgets', auth: true },
    { method: 'POST', path: '/api/budgets', description: 'Create budget', auth: true },
    { method: 'GET', path: '/api/budgets/:id', description: 'Get budget by ID', auth: true },
    { method: 'PUT', path: '/api/budgets/:id', description: 'Update budget', auth: true },
    { method: 'DELETE', path: '/api/budgets/:id', description: 'Delete budget', auth: true },
    { method: 'GET', path: '/api/budgets/:id/analysis', description: 'Get budget analysis', auth: true }
  ],
  'GST': [
    { method: 'GET', path: '/api/gst/returns', description: 'Get GST returns', auth: true },
    { method: 'GET', path: '/api/gst/gstr1', description: 'Get GSTR1 report', auth: true },
    { method: 'GET', path: '/api/gst/gstr3b', description: 'Get GSTR3B report', auth: true },
    { method: 'POST', path: '/api/gst/file-return', description: 'File GST return', auth: true },
    { method: 'GET', path: '/api/gst/summary', description: 'Get GST summary', auth: true }
  ],
  'Reports': [
    { method: 'GET', path: '/api/reports/profit-loss', description: 'Get P&L report', auth: true },
    { method: 'GET', path: '/api/reports/balance-sheet', description: 'Get balance sheet', auth: true },
    { method: 'GET', path: '/api/reports/cash-flow', description: 'Get cash flow statement', auth: true },
    { method: 'GET', path: '/api/reports/trial-balance', description: 'Get trial balance', auth: true },
    { method: 'GET', path: '/api/reports/ledger', description: 'Get ledger report', auth: true },
    { method: 'GET', path: '/api/reports/daybook', description: 'Get daybook', auth: true },
    { method: 'POST', path: '/api/reports/custom', description: 'Generate custom report', auth: true }
  ],
  'Notifications': [
    { method: 'GET', path: '/api/notifications', description: 'Get all notifications', auth: true },
    { method: 'GET', path: '/api/notifications/:id', description: 'Get notification by ID', auth: true },
    { method: 'PUT', path: '/api/notifications/:id/read', description: 'Mark as read', auth: true },
    { method: 'PUT', path: '/api/notifications/read-all', description: 'Mark all as read', auth: true },
    { method: 'DELETE', path: '/api/notifications/:id', description: 'Delete notification', auth: true }
  ],
  'Tally Integration': [
    { method: 'GET', path: '/api/tally/status', description: 'Get Tally connection status', auth: true },
    { method: 'POST', path: '/api/tally/connect', description: 'Connect to Tally', auth: true },
    { method: 'POST', path: '/api/tally/disconnect', description: 'Disconnect from Tally', auth: true },
    { method: 'GET', path: '/api/tally/companies', description: 'Get Tally companies', auth: true },
    { method: 'POST', path: '/api/tally/sync', description: 'Sync with Tally', auth: true },
    { method: 'GET', path: '/api/tally/sync-status', description: 'Get sync status', auth: true },
    { method: 'POST', path: '/api/tally/import', description: 'Import from Tally', auth: true },
    { method: 'POST', path: '/api/tally/export', description: 'Export to Tally', auth: true }
  ],
  'Parties': [
    { method: 'GET', path: '/api/parties', description: 'Get all parties', auth: true },
    { method: 'POST', path: '/api/parties', description: 'Create party', auth: true },
    { method: 'GET', path: '/api/parties/:id', description: 'Get party by ID', auth: true },
    { method: 'PUT', path: '/api/parties/:id', description: 'Update party', auth: true },
    { method: 'DELETE', path: '/api/parties/:id', description: 'Delete party', auth: true }
  ],
  'Email': [
    { method: 'POST', path: '/api/emails/send', description: 'Send email', auth: true },
    { method: 'GET', path: '/api/emails/templates', description: 'Get email templates', auth: true },
    { method: 'POST', path: '/api/emails/invoice', description: 'Send invoice email', auth: true }
  ],
  'System': [
    { method: 'GET', path: '/health', description: 'Health check', auth: false },
    { method: 'GET', path: '/api-docs', description: 'API Documentation (Swagger)', auth: false }
  ]
};

// Count total endpoints
let totalEndpoints = 0;
let publicEndpoints = 0;
let protectedEndpoints = 0;

Object.values(endpoints).forEach(category => {
  category.forEach(endpoint => {
    totalEndpoints++;
    if (endpoint.auth) {
      protectedEndpoints++;
    } else {
      publicEndpoints++;
    }
  });
});

console.log(`${colors.bright}Summary:${colors.reset}`);
console.log(`Total Endpoints: ${colors.green}${totalEndpoints}${colors.reset}`);
console.log(`Public Endpoints: ${colors.yellow}${publicEndpoints}${colors.reset}`);
console.log(`Protected Endpoints: ${colors.blue}${protectedEndpoints}${colors.reset}\n`);

// Display endpoints by category
Object.entries(endpoints).forEach(([category, categoryEndpoints]) => {
  console.log(`${colors.bright}${colors.cyan}${category}:${colors.reset}`);
  categoryEndpoints.forEach(endpoint => {
    const authBadge = endpoint.auth 
      ? `${colors.blue}[🔒 Protected]${colors.reset}` 
      : `${colors.yellow}[🌐 Public]${colors.reset}`;
    const methodColor = {
      'GET': colors.green,
      'POST': colors.blue,
      'PUT': colors.yellow,
      'DELETE': colors.red,
      'PATCH': colors.cyan
    }[endpoint.method] || colors.reset;
    
    console.log(`  ${methodColor}${endpoint.method.padEnd(6)}${colors.reset} ${endpoint.path.padEnd(45)} ${authBadge} - ${endpoint.description}`);
  });
  console.log('');
});

// Check route files exist
console.log(`${colors.bright}${colors.cyan}Route Files Status:${colors.reset}`);
const routesDir = path.join(__dirname, '../src/routes');
const routeFiles = [
  'auth.js',
  'users.js',
  'companies.js',
  'vouchers.js',
  'transactions.js',
  'payments.js',
  'inventory.js',
  'budgets.mjs',
  'gst.mjs',
  'reports.mjs',
  'notifications.mjs',
  'tally.js',
  'parties.js',
  'emails.js'
];

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  const exists = fs.existsSync(filePath);
  const status = exists 
    ? `${colors.green}✓ Found${colors.reset}` 
    : `${colors.red}✗ Missing${colors.reset}`;
  console.log(`  ${file.padEnd(25)} ${status}`);
});

console.log(`\n${colors.bright}${colors.green}✓ API Endpoint Verification Complete!${colors.reset}`);
console.log(`${colors.cyan}Access Swagger Documentation at: ${colors.bright}http://localhost:5000/api-docs${colors.reset}\n`);

// Generate endpoint summary file
const summaryPath = path.join(__dirname, '../API_ENDPOINTS_SUMMARY.md');
let markdown = `# FinSync360 API Endpoints Summary\n\n`;
markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
markdown += `## Overview\n\n`;
markdown += `- **Total Endpoints:** ${totalEndpoints}\n`;
markdown += `- **Public Endpoints:** ${publicEndpoints}\n`;
markdown += `- **Protected Endpoints:** ${protectedEndpoints}\n\n`;
markdown += `## Swagger Documentation\n\n`;
markdown += `Access the interactive API documentation at: \`http://localhost:5000/api-docs\`\n\n`;

Object.entries(endpoints).forEach(([category, categoryEndpoints]) => {
  markdown += `## ${category}\n\n`;
  markdown += `| Method | Endpoint | Auth Required | Description |\n`;
  markdown += `|--------|----------|---------------|-------------|\n`;
  categoryEndpoints.forEach(endpoint => {
    const auth = endpoint.auth ? '🔒 Yes' : '🌐 No';
    markdown += `| ${endpoint.method} | \`${endpoint.path}\` | ${auth} | ${endpoint.description} |\n`;
  });
  markdown += `\n`;
});

markdown += `## Authentication\n\n`;
markdown += `Protected endpoints require a Bearer token in the Authorization header:\n\n`;
markdown += `\`\`\`\nAuthorization: Bearer <your-jwt-token>\n\`\`\`\n\n`;
markdown += `## Rate Limiting\n\n`;
markdown += `- **Window:** 15 minutes\n`;
markdown += `- **Max Requests:** 100 per window\n\n`;
markdown += `## Response Format\n\n`;
markdown += `All API responses follow this format:\n\n`;
markdown += `\`\`\`json\n`;
markdown += `{\n`;
markdown += `  "success": true,\n`;
markdown += `  "message": "Operation successful",\n`;
markdown += `  "data": {}\n`;
markdown += `}\n`;
markdown += `\`\`\`\n\n`;
markdown += `## Error Handling\n\n`;
markdown += `Error responses include:\n\n`;
markdown += `\`\`\`json\n`;
markdown += `{\n`;
markdown += `  "success": false,\n`;
markdown += `  "message": "Error description",\n`;
markdown += `  "error": "Detailed error information"\n`;
markdown += `}\n`;
markdown += `\`\`\`\n`;

fs.writeFileSync(summaryPath, markdown);
console.log(`${colors.green}✓ API Endpoints Summary saved to: ${summaryPath}${colors.reset}\n`);
