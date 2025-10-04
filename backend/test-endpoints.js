import http from 'http';

const BASE_URL = 'http://localhost:5002';

// List of all API endpoints to test
const endpoints = [
  { path: '/health', method: 'GET', description: 'Health check' },
  { path: '/api/auth/register', method: 'POST', description: 'Auth - Register' },
  { path: '/api/auth/login', method: 'POST', description: 'Auth - Login' },
  { path: '/api/users', method: 'GET', description: 'Users - List' },
  { path: '/api/companies', method: 'GET', description: 'Companies - List' },
  { path: '/api/vouchers', method: 'GET', description: 'Vouchers - List' },
  { path: '/api/transactions', method: 'GET', description: 'Transactions - List' },
  { path: '/api/inventory', method: 'GET', description: 'Inventory - List' },
  { path: '/api/payments', method: 'GET', description: 'Payments - Info' },
  { path: '/api/tally/connections', method: 'GET', description: 'Tally - Connections' },
  { path: '/api/budgets', method: 'GET', description: 'Budgets - List' },
  { path: '/api/gst/returns', method: 'GET', description: 'GST - Returns' },
  { path: '/api/reports/profit-loss', method: 'GET', description: 'Reports - P&L' },
  { path: '/api/notifications', method: 'GET', description: 'Notifications - List' },
  { path: '/api/emails/templates', method: 'GET', description: 'Emails - Templates' },
  { path: '/api/parties', method: 'GET', description: 'Parties - List' },
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, BASE_URL);
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const result = {
          ...endpoint,
          status,
          success: status < 500, // Any status < 500 means endpoint exists
          response: status === 200 ? 'OK' : 
                   status === 401 ? 'Unauthorized (expected)' :
                   status === 404 ? 'Not Found' :
                   status === 400 ? 'Bad Request (expected)' :
                   `Status ${status}`
        };
        resolve(result);
      });
    });

    req.on('error', (error) => {
      resolve({
        ...endpoint,
        status: 0,
        success: false,
        response: `Error: ${error.message}`
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        ...endpoint,
        status: 0,
        success: false,
        response: 'Timeout'
      });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('\n🔍 Testing FinSync360 Backend Endpoints\n');
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const icon = result.success ? '✅' : '❌';
    const statusColor = result.status === 200 ? '\x1b[32m' : 
                       result.status === 401 ? '\x1b[33m' :
                       result.status === 404 ? '\x1b[31m' : '\x1b[36m';
    const reset = '\x1b[0m';
    
    console.log(`${icon} ${result.method.padEnd(6)} ${result.path.padEnd(35)} ${statusColor}${result.response}${reset}`);
  }
  
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const percentage = ((successful / total) * 100).toFixed(1);
  
  console.log(`\n📊 Summary: ${successful}/${total} endpoints accessible (${percentage}%)\n`);
  
  // Group by status
  const byStatus = results.reduce((acc, r) => {
    const key = r.status === 200 ? 'Working' :
                r.status === 401 ? 'Auth Required' :
                r.status === 404 ? 'Not Found' :
                r.status === 0 ? 'Failed' : 'Other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Status Breakdown:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  console.log('\n');
}

// Wait for server to start, then test
console.log('⏳ Waiting for server to start...');
setTimeout(testAllEndpoints, 2000);
