import http from 'http';

const PORT = process.env.PORT || 5002;

console.log(`\n🔍 Testing Swagger endpoint on port ${PORT}...\n`);

// Test /api-docs endpoint
const testEndpoint = (path, description) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: ${res.statusCode} OK`);
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          console.log(`❌ ${description}: ${res.statusCode} ${res.statusMessage}`);
          resolve({ success: false, statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: Connection failed - ${error.message}`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${description}: Request timeout`);
      reject(new Error('Timeout'));
    });

    req.end();
  });
};

// Run tests
(async () => {
  try {
    console.log('Testing endpoints...\n');
    
    await testEndpoint('/health', 'Health Check');
    await testEndpoint('/api-docs', 'Swagger UI');
    await testEndpoint('/api-docs.json', 'OpenAPI Spec JSON');
    
    console.log('\n✅ All tests completed!\n');
    console.log(`📖 Access Swagger UI at: http://localhost:${PORT}/api-docs\n`);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n⚠️  Make sure the server is running with: npm run dev\n');
    process.exit(1);
  }
})();
