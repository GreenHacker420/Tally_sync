#!/usr/bin/env node

/**
 * Simple script to test API connectivity between mobile app and backend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAPIConnection() {
  console.log('🔍 Testing FinSync360 Mobile App API Connection...\n');

  const tests = [
    {
      name: 'Backend Health Check',
      url: `${API_BASE_URL.replace('/api', '')}/`,
      method: 'GET',
      expectedStatus: [200, 404], // 404 is OK for root endpoint
    },
    {
      name: 'Companies Endpoint (Unauthorized)',
      url: `${API_BASE_URL}/companies`,
      method: 'GET',
      expectedStatus: [401], // Should be unauthorized without token
    },
    {
      name: 'Auth Login Endpoint Structure',
      url: `${API_BASE_URL}/auth/login`,
      method: 'POST',
      data: {
        email: 'test@example.com',
        password: 'wrongpassword'
      },
      expectedStatus: [400, 401], // Should fail validation or auth
    },
    {
      name: 'Vouchers Endpoint (Unauthorized)',
      url: `${API_BASE_URL}/vouchers`,
      method: 'GET',
      expectedStatus: [401], // Should be unauthorized without token
    },
    {
      name: 'Inventory Endpoint (Unauthorized)',
      url: `${API_BASE_URL}/inventory/items`,
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
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status code
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      if (test.expectedStatus.includes(response.status)) {
        console.log(`✅ PASS: ${test.name} (Status: ${response.status})`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name} (Expected: ${test.expectedStatus}, Got: ${response.status})`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ FAIL: ${test.name} - Backend server not running`);
      } else {
        console.log(`❌ FAIL: ${test.name} - ${error.message}`);
      }
      failed++;
    }
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All API connectivity tests passed!');
    console.log('✅ Backend server is running and responding correctly');
    console.log('✅ API endpoints are properly secured');
    console.log('✅ Mobile app can communicate with backend');
  } else {
    console.log('⚠️  Some tests failed. Check backend server status.');
  }

  return failed === 0;
}

// Run the tests
testAPIConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
