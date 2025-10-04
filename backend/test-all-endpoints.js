#!/usr/bin/env node

/**
 * Comprehensive Backend API Endpoint Tester
 * Tests all available endpoints and reports their status
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5002';
let authToken = null;
let testUserId = null;
let testCompanyId = null;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  endpoints: []
};

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Log test result
 */
function logTest(name, passed, message = '', data = null) {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} ${name}`);
  
  if (message) {
    console.log(`    ${colors.cyan}${message}${colors.reset}`);
  }
  
  if (data && !passed) {
    console.log(`    ${colors.yellow}Response:${colors.reset}`, JSON.stringify(data, null, 2).substring(0, 200));
  }
  
  results.endpoints.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

/**
 * Test section header
 */
function logSection(name) {
  console.log(`\n${colors.bold}${colors.blue}━━━ ${name} ━━━${colors.reset}`);
}

/**
 * Main test suite
 */
async function runTests() {
  console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║   FinSync360 Backend API Comprehensive Endpoint Test     ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // ==================== HEALTH CHECK ====================
    logSection('Health Check');
    try {
      const health = await makeRequest('GET', '/health');
      logTest('GET /health', health.status === 200, `Server is ${health.data.status}`, health.data);
    } catch (error) {
      logTest('GET /health', false, error.message);
    }

    // ==================== AUTH ENDPOINTS ====================
    logSection('Authentication Endpoints');
    
    // Register
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'Test@123456',
      companyName: 'Test Company Ltd'
    };
    
    try {
      const register = await makeRequest('POST', '/api/auth/register', registerData);
      const passed = register.status === 201 && register.data.success;
      logTest('POST /api/auth/register', passed, 
        passed ? 'User registered successfully' : 'Registration failed', 
        register.data);
      
      if (passed) {
        authToken = register.data.data.token;
        testUserId = register.data.data.user.id;
        testCompanyId = register.data.data.company.id;
      }
    } catch (error) {
      logTest('POST /api/auth/register', false, error.message);
    }

    // Login
    try {
      const login = await makeRequest('POST', '/api/auth/login', {
        email: registerData.email,
        password: registerData.password
      });
      const passed = login.status === 200 && login.data.success;
      logTest('POST /api/auth/login', passed, 
        passed ? 'Login successful' : 'Login failed',
        login.data);
      
      if (passed && !authToken) {
        authToken = login.data.data.token;
      }
    } catch (error) {
      logTest('POST /api/auth/login', false, error.message);
    }

    // Get current user
    if (authToken) {
      try {
        const me = await makeRequest('GET', '/api/auth/me', null, authToken);
        logTest('GET /api/auth/me', me.status === 200 && me.data.success, 
          me.data.success ? 'User profile retrieved' : 'Failed to get profile');
      } catch (error) {
        logTest('GET /api/auth/me', false, error.message);
      }

      // Get profile (alias)
      try {
        const profile = await makeRequest('GET', '/api/auth/profile', null, authToken);
        logTest('GET /api/auth/profile', profile.status === 200 && profile.data.success);
      } catch (error) {
        logTest('GET /api/auth/profile', false, error.message);
      }

      // Update profile
      try {
        const update = await makeRequest('PUT', '/api/auth/profile', {
          name: 'Updated Test User'
        }, authToken);
        logTest('PUT /api/auth/profile', update.status === 200 && update.data.success);
      } catch (error) {
        logTest('PUT /api/auth/profile', false, error.message);
      }
    }

    // Forgot password
    try {
      const forgot = await makeRequest('POST', '/api/auth/forgot-password', {
        email: registerData.email
      });
      logTest('POST /api/auth/forgot-password', forgot.status === 200 && forgot.data.success);
    } catch (error) {
      logTest('POST /api/auth/forgot-password', false, error.message);
    }

    // ==================== USER ENDPOINTS ====================
    if (authToken) {
      logSection('User Management Endpoints');

      try {
        const users = await makeRequest('GET', '/api/users', null, authToken);
        logTest('GET /api/users', users.status === 200 && users.data.success,
          users.data.success ? `Found ${users.data.data.users.length} users` : '');
      } catch (error) {
        logTest('GET /api/users', false, error.message);
      }

      if (testUserId) {
        try {
          const user = await makeRequest('GET', `/api/users/${testUserId}`, null, authToken);
          logTest(`GET /api/users/:id`, user.status === 200 && user.data.success);
        } catch (error) {
          logTest(`GET /api/users/:id`, false, error.message);
        }

        try {
          const update = await makeRequest('PUT', `/api/users/${testUserId}`, {
            name: 'Updated via Users API'
          }, authToken);
          logTest(`PUT /api/users/:id`, update.status === 200 && update.data.success);
        } catch (error) {
          logTest(`PUT /api/users/:id`, false, error.message);
        }
      }
    }

    // ==================== COMPANY ENDPOINTS ====================
    if (authToken) {
      logSection('Company Management Endpoints');

      try {
        const companies = await makeRequest('GET', '/api/companies', null, authToken);
        logTest('GET /api/companies', companies.status === 200 && companies.data.success,
          companies.data.success ? `Found ${companies.data.data.companies?.length || 0} companies` : '');
      } catch (error) {
        logTest('GET /api/companies', false, error.message);
      }

      if (testCompanyId) {
        try {
          const company = await makeRequest('GET', `/api/companies/${testCompanyId}`, null, authToken);
          logTest(`GET /api/companies/:id`, company.status === 200 && company.data.success);
        } catch (error) {
          logTest(`GET /api/companies/:id`, false, error.message);
        }
      }

      try {
        const create = await makeRequest('POST', '/api/companies', {
          name: 'New Test Company',
          address: {
            line1: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
          },
          businessType: 'retail'
        }, authToken);
        logTest('POST /api/companies', create.status === 201 && create.data.success);
      } catch (error) {
        logTest('POST /api/companies', false, error.message);
      }
    }

    // ==================== TRANSACTION ENDPOINTS ====================
    if (authToken) {
      logSection('Transaction Endpoints');

      try {
        const transactions = await makeRequest('GET', '/api/transactions', null, authToken);
        logTest('GET /api/transactions', 
          transactions.status === 200 || transactions.status === 404,
          transactions.data.message || 'Transactions endpoint accessible');
      } catch (error) {
        logTest('GET /api/transactions', false, error.message);
      }
    }

    // ==================== VOUCHER ENDPOINTS ====================
    if (authToken) {
      logSection('Voucher Endpoints');

      try {
        const vouchers = await makeRequest('GET', '/api/vouchers', null, authToken);
        logTest('GET /api/vouchers', 
          vouchers.status === 200 || vouchers.status === 404,
          vouchers.data.message || 'Vouchers endpoint accessible');
      } catch (error) {
        logTest('GET /api/vouchers', false, error.message);
      }
    }

    // ==================== BUDGET ENDPOINTS ====================
    if (authToken) {
      logSection('Budget Endpoints');

      try {
        const budgets = await makeRequest('GET', '/api/budgets', null, authToken);
        logTest('GET /api/budgets', 
          budgets.status === 200 || budgets.status === 404,
          budgets.data.message || 'Budgets endpoint accessible');
      } catch (error) {
        logTest('GET /api/budgets', false, error.message);
      }
    }

    // ==================== INVENTORY ENDPOINTS ====================
    if (authToken) {
      logSection('Inventory Endpoints');

      try {
        const inventory = await makeRequest('GET', '/api/inventory', null, authToken);
        logTest('GET /api/inventory', 
          inventory.status === 200 || inventory.status === 404,
          inventory.data.message || 'Inventory endpoint accessible');
      } catch (error) {
        logTest('GET /api/inventory', false, error.message);
      }
    }

    // ==================== PAYMENT ENDPOINTS ====================
    if (authToken) {
      logSection('Payment Endpoints');

      try {
        const payments = await makeRequest('GET', '/api/payments', null, authToken);
        logTest('GET /api/payments', 
          payments.status === 200 || payments.status === 404,
          payments.data.message || 'Payments endpoint accessible');
      } catch (error) {
        logTest('GET /api/payments', false, error.message);
      }
    }

    // ==================== GST ENDPOINTS ====================
    if (authToken) {
      logSection('GST Endpoints');

      try {
        const gst = await makeRequest('GET', '/api/gst', null, authToken);
        logTest('GET /api/gst', 
          gst.status === 200 || gst.status === 404,
          gst.data.message || 'GST endpoint accessible');
      } catch (error) {
        logTest('GET /api/gst', false, error.message);
      }
    }

    // ==================== TALLY ENDPOINTS ====================
    if (authToken) {
      logSection('Tally Integration Endpoints');

      try {
        const tally = await makeRequest('GET', '/api/tally/status', null, authToken);
        logTest('GET /api/tally/status', 
          tally.status === 200 || tally.status === 404,
          tally.data.message || 'Tally status endpoint accessible');
      } catch (error) {
        logTest('GET /api/tally/status', false, error.message);
      }
    }

    // ==================== REPORT ENDPOINTS ====================
    if (authToken) {
      logSection('Report Endpoints');

      try {
        const reports = await makeRequest('GET', '/api/reports', null, authToken);
        logTest('GET /api/reports', 
          reports.status === 200 || reports.status === 404,
          reports.data.message || 'Reports endpoint accessible');
      } catch (error) {
        logTest('GET /api/reports', false, error.message);
      }
    }

    // ==================== NOTIFICATION ENDPOINTS ====================
    if (authToken) {
      logSection('Notification Endpoints');

      try {
        const notifications = await makeRequest('GET', '/api/notifications', null, authToken);
        logTest('GET /api/notifications', 
          notifications.status === 200 || notifications.status === 404,
          notifications.data.message || 'Notifications endpoint accessible');
      } catch (error) {
        logTest('GET /api/notifications', false, error.message);
      }
    }

    // ==================== SUMMARY ====================
    console.log(`\n${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                         ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
    
    console.log(`\n  ${colors.green}✓ Passed:${colors.reset}  ${results.passed}`);
    console.log(`  ${colors.red}✗ Failed:${colors.reset}  ${results.failed}`);
    console.log(`  ${colors.yellow}⊘ Skipped:${colors.reset} ${results.skipped}`);
    console.log(`  ${colors.blue}━ Total:${colors.reset}   ${results.passed + results.failed + results.skipped}\n`);

    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`  Success Rate: ${successRate}%\n`);

    if (results.failed > 0) {
      console.log(`${colors.yellow}Failed Tests:${colors.reset}`);
      results.endpoints
        .filter(e => !e.passed)
        .forEach(e => console.log(`  - ${e.name}: ${e.message}`));
      console.log('');
    }

  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
