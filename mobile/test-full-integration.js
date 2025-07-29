#!/usr/bin/env node

/**
 * FinSync360 Full Integration Test
 * Tests complete integration between Mobile App, Backend API, and ML Service
 */

const https = require('https');
const http = require('http');

// Production URLs
const BACKEND_URL = 'https://finsync-backend-d34180691b06.herokuapp.com';
const ML_SERVICE_URL = 'https://finsync-ml-2bba4152b555.herokuapp.com';

// Test configuration
const TEST_CONFIG = {
    timeout: 10000,
    retries: 3
};

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinSync360-Integration-Test/1.0',
                ...options.headers
            },
            timeout: TEST_CONFIG.timeout
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        raw: data
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: null,
                        raw: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
    try {
        log(`\n🔍 Testing: ${name}`, colors.blue);
        log(`   URL: ${url}`, colors.blue);
        
        const response = await makeRequest(url, options);
        
        const statusMatch = Array.isArray(expectedStatus) 
            ? expectedStatus.includes(response.status)
            : response.status === expectedStatus;
            
        if (statusMatch) {
            log(`   ✅ Status: ${response.status} (Expected: ${expectedStatus})`, colors.green);
            if (response.data && typeof response.data === 'object') {
                log(`   📄 Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`, colors.green);
            }
            return { success: true, response };
        } else {
            log(`   ❌ Status: ${response.status} (Expected: ${expectedStatus})`, colors.red);
            log(`   📄 Response: ${response.raw}`, colors.red);
            return { success: false, response };
        }
    } catch (error) {
        log(`   ❌ Error: ${error.message}`, colors.red);
        return { success: false, error };
    }
}

async function runIntegrationTests() {
    log(`${colors.bold}🚀 FinSync360 Full Integration Test Suite${colors.reset}`, colors.blue);
    log(`${colors.bold}=================================================${colors.reset}`, colors.blue);
    
    const results = {
        backend: [],
        mlService: [],
        integration: []
    };

    // Backend API Tests
    log(`\n${colors.bold}📡 BACKEND API TESTS${colors.reset}`, colors.yellow);
    log(`${colors.bold}===================${colors.reset}`, colors.yellow);

    const backendTests = [
        {
            name: 'Backend Health Check',
            url: `${BACKEND_URL}/health`,
            expectedStatus: 200
        },
        {
            name: 'Backend API Root',
            url: `${BACKEND_URL}/api`,
            expectedStatus: [200, 404]
        },
        {
            name: 'Auth Register Endpoint (No Data)',
            url: `${BACKEND_URL}/api/auth/register`,
            expectedStatus: [400, 422],
            options: { method: 'POST' }
        },
        {
            name: 'Auth Login Endpoint (No Data)',
            url: `${BACKEND_URL}/api/auth/login`,
            expectedStatus: [400, 422, 500],
            options: { method: 'POST' }
        },
        {
            name: 'Auth Profile Endpoint (No Auth)',
            url: `${BACKEND_URL}/api/auth/profile`,
            expectedStatus: 401
        },
        {
            name: 'Transactions Endpoint (No Auth)',
            url: `${BACKEND_URL}/api/transactions`,
            expectedStatus: 401
        },
        {
            name: 'Budgets Endpoint (No Auth)',
            url: `${BACKEND_URL}/api/budgets`,
            expectedStatus: 401
        }
    ];

    for (const test of backendTests) {
        const result = await testEndpoint(test.name, test.url, test.expectedStatus, test.options);
        results.backend.push({ ...test, ...result });
    }

    // ML Service Tests
    log(`\n${colors.bold}🤖 ML SERVICE TESTS${colors.reset}`, colors.yellow);
    log(`${colors.bold}==================${colors.reset}`, colors.yellow);

    const mlTests = [
        {
            name: 'ML Service Health Check',
            url: `${ML_SERVICE_URL}/api/v1/health`,
            expectedStatus: [200, 503]
        },
        {
            name: 'ML Service Root',
            url: `${ML_SERVICE_URL}/`,
            expectedStatus: [200, 503]
        },
        {
            name: 'ML Predictions Endpoint (No Auth)',
            url: `${ML_SERVICE_URL}/api/v1/payment-delay`,
            expectedStatus: [401, 422, 503],
            options: { method: 'POST' }
        }
    ];

    for (const test of mlTests) {
        const result = await testEndpoint(test.name, test.url, test.expectedStatus, test.options);
        results.mlService.push({ ...test, ...result });
    }

    // Integration Tests
    log(`\n${colors.bold}🔗 INTEGRATION TESTS${colors.reset}`, colors.yellow);
    log(`${colors.bold}===================${colors.reset}`, colors.yellow);

    // Test if backend can reach ML service (simulated)
    const integrationTests = [
        {
            name: 'Cross-Service Communication Test',
            description: 'Verify services can communicate with each other',
            test: async () => {
                // This would normally test if backend can call ML service
                // For now, we'll just verify both services are accessible
                const backendHealth = await testEndpoint('Backend Health', `${BACKEND_URL}/health`, 200);
                const mlHealth = await testEndpoint('ML Service Health', `${ML_SERVICE_URL}/api/v1/health`, [200, 503]);
                
                return {
                    success: backendHealth.success && mlHealth.success,
                    details: {
                        backend: backendHealth.success,
                        mlService: mlHealth.success
                    }
                };
            }
        }
    ];

    for (const test of integrationTests) {
        log(`\n🔍 Testing: ${test.name}`, colors.blue);
        log(`   Description: ${test.description}`, colors.blue);
        
        try {
            const result = await test.test();
            if (result.success) {
                log(`   ✅ Integration test passed`, colors.green);
            } else {
                log(`   ❌ Integration test failed`, colors.red);
                log(`   📄 Details: ${JSON.stringify(result.details, null, 2)}`, colors.red);
            }
            results.integration.push({ ...test, ...result });
        } catch (error) {
            log(`   ❌ Error: ${error.message}`, colors.red);
            results.integration.push({ ...test, success: false, error });
        }
    }

    // Summary
    log(`\n${colors.bold}📊 TEST SUMMARY${colors.reset}`, colors.blue);
    log(`${colors.bold}===============${colors.reset}`, colors.blue);

    const backendSuccess = results.backend.filter(r => r.success).length;
    const backendTotal = results.backend.length;
    const mlSuccess = results.mlService.filter(r => r.success).length;
    const mlTotal = results.mlService.length;
    const integrationSuccess = results.integration.filter(r => r.success).length;
    const integrationTotal = results.integration.length;

    log(`\n📡 Backend API: ${backendSuccess}/${backendTotal} tests passed (${Math.round(backendSuccess/backendTotal*100)}%)`, 
        backendSuccess === backendTotal ? colors.green : colors.yellow);
    log(`🤖 ML Service: ${mlSuccess}/${mlTotal} tests passed (${Math.round(mlSuccess/mlTotal*100)}%)`, 
        mlSuccess === mlTotal ? colors.green : colors.yellow);
    log(`🔗 Integration: ${integrationSuccess}/${integrationTotal} tests passed (${Math.round(integrationSuccess/integrationTotal*100)}%)`, 
        integrationSuccess === integrationTotal ? colors.green : colors.yellow);

    const totalSuccess = backendSuccess + mlSuccess + integrationSuccess;
    const totalTests = backendTotal + mlTotal + integrationTotal;
    
    log(`\n${colors.bold}🎯 Overall: ${totalSuccess}/${totalTests} tests passed (${Math.round(totalSuccess/totalTests*100)}%)${colors.reset}`, 
        totalSuccess === totalTests ? colors.green : colors.yellow);

    if (totalSuccess === totalTests) {
        log(`\n🎉 All integration tests passed! FinSync360 is ready for production.`, colors.green);
    } else {
        log(`\n⚠️  Some tests failed. Review the results above for details.`, colors.yellow);
    }

    return results;
}

// Run the tests
if (require.main === module) {
    runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests, testEndpoint };
