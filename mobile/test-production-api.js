#!/usr/bin/env node

/**
 * Test script to verify production API connectivity
 */

const axios = require('axios');

const PRODUCTION_API_BASE_URL = 'https://finsync-backend-d34180691b06.herokuapp.com/api';

async function testProductionAPI() {
  console.log('🔍 Testing FinSync360 Production API Connection...\n');
  console.log(`🌐 Production Backend: ${PRODUCTION_API_BASE_URL.replace('/api', '')}`);
  console.log(`📡 API Base URL: ${PRODUCTION_API_BASE_URL}\n`);

  const tests = [
    {
      name: 'Backend Health Check',
      url: `${PRODUCTION_API_BASE_URL.replace('/api', '')}/`,
      method: 'GET',
      expectedStatus: [200, 404], // 404 is OK for root endpoint
    },
    {
      name: 'Companies Endpoint (Unauthorized)',
      url: `${PRODUCTION_API_BASE_URL}/companies`,
      method: 'GET',
      expectedStatus: [401], // Should be unauthorized without token
    },
    {
      name: 'Auth Login Endpoint Structure',
      url: `${PRODUCTION_API_BASE_URL}/auth/login`,
      method: 'POST',
      data: {
        email: 'test@example.com',
        password: 'wrongpassword'
      },
      expectedStatus: [400, 401], // Should fail validation or auth
    },
    {
      name: 'Vouchers Endpoint (Unauthorized)',
      url: `${PRODUCTION_API_BASE_URL}/vouchers`,
      method: 'GET',
      expectedStatus: [401], // Should be unauthorized without token
    },
    {
      name: 'Inventory Endpoint (Unauthorized)',
      url: `${PRODUCTION_API_BASE_URL}/inventory/items`,
      method: 'GET',
      expectedStatus: [401], // Should be unauthorized without token
    },
    {
      name: 'User Profile Endpoint (Unauthorized)',
      url: `${PRODUCTION_API_BASE_URL}/auth/profile`,
      method: 'GET',
      expectedStatus: [401], // Should be unauthorized without token
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📡 Testing: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 10000, // 10 second timeout for production
        validateStatus: () => true, // Don't throw on any status code
      };

      if (test.data) {
        config.data = test.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      
      if (test.expectedStatus.includes(response.status)) {
        console.log(`✅ PASS: ${test.name} (Status: ${response.status})`);
        if (response.data && typeof response.data === 'object') {
          console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name} (Expected: ${test.expectedStatus}, Got: ${response.status})`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ FAIL: ${test.name} - Production server not accessible`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`❌ FAIL: ${test.name} - DNS resolution failed`);
      } else {
        console.log(`❌ FAIL: ${test.name} - ${error.message}`);
      }
      failed++;
    }
    console.log('');
  }

  console.log('📊 Production API Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All production API connectivity tests passed!');
    console.log('✅ Production backend server is running and responding correctly');
    console.log('✅ API endpoints are properly secured');
    console.log('✅ Mobile app can communicate with production backend');
  } else {
    console.log('⚠️  Some tests failed. Check production server status.');
  }

  return failed === 0;
}

// Run the tests
testProductionAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
