const request = require('supertest');
const app = require('../src/server');
const TestDataHelper = require('./helpers/testData');

class PerformanceBenchmark {
  constructor() {
    this.testHelper = new TestDataHelper();
    this.benchmarkResults = {
      timestamp: new Date().toISOString(),
      endpoints: [],
      summary: {
        totalTests: 0,
        averageResponseTime: 0,
        slowestEndpoint: null,
        fastestEndpoint: null
      }
    };
  }

  async runBenchmarks() {
    console.log('🚀 Starting Performance Benchmarks...\n');

    try {
      // Setup test data
      const testData = await this.testHelper.createCompleteTestData();
      const token = testData.token;
      const companyId = testData.company._id.toString();

      // Authentication benchmarks
      await this.benchmarkAuth();

      // Voucher benchmarks
      await this.benchmarkVouchers(token, companyId, testData);

      // Inventory benchmarks
      await this.benchmarkInventory(token, companyId, testData);

      // Party benchmarks
      await this.benchmarkParties(token, companyId, testData);

      // Payment benchmarks
      await this.benchmarkPayments(token, companyId, testData);

      // Email benchmarks
      await this.benchmarkEmails(token, companyId, testData);

      // Calculate summary
      this.calculateSummary();

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    } finally {
      await this.testHelper.cleanup();
    }
  }

  async benchmarkEndpoint(name, requestFn, iterations = 10) {
    console.log(`📊 Benchmarking ${name}...`);
    
    const times = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        const response = await requestFn();
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        times.push(responseTime);
        
        if (response.status >= 200 && response.status < 300) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        times.push(5000); // Penalty for errors
      }
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

    const result = {
      name,
      iterations,
      successCount,
      errorCount,
      successRate: (successCount / iterations) * 100,
      averageTime: Math.round(avgTime),
      minTime,
      maxTime,
      medianTime,
      times
    };

    this.benchmarkResults.endpoints.push(result);
    
    console.log(`  ✅ ${name}: ${avgTime.toFixed(0)}ms avg (${successCount}/${iterations} success)`);
    
    return result;
  }

  async benchmarkAuth() {
    console.log('\n🔐 Authentication Benchmarks');
    console.log('============================');

    // Register benchmark
    await this.benchmarkEndpoint('POST /auth/register', async () => {
      const userData = {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: `+9198765${Math.floor(Math.random() * 100000)}`,
        password: 'password123'
      };
      
      return request(app)
        .post('/api/auth/register')
        .send(userData);
    }, 5);

    // Login benchmark
    const user = await this.testHelper.createTestUser({
      email: 'benchmark@example.com',
      password: 'password123'
    });

    await this.benchmarkEndpoint('POST /auth/login', async () => {
      return request(app)
        .post('/api/auth/login')
        .send({
          email: 'benchmark@example.com',
          password: 'password123'
        });
    });

    // Get current user benchmark
    const token = this.testHelper.generateAuthToken(user._id);
    
    await this.benchmarkEndpoint('GET /auth/me', async () => {
      return request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
    });
  }

  async benchmarkVouchers(token, companyId, testData) {
    console.log('\n📄 Voucher Benchmarks');
    console.log('=====================');

    // Get vouchers benchmark
    await this.benchmarkEndpoint('GET /vouchers', async () => {
      return request(app)
        .get('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Get single voucher benchmark
    await this.benchmarkEndpoint('GET /vouchers/:id', async () => {
      return request(app)
        .get(`/api/vouchers/${testData.voucher._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Create voucher benchmark
    await this.benchmarkEndpoint('POST /vouchers', async () => {
      const voucherData = {
        voucherType: 'sales',
        date: new Date().toISOString(),
        party: testData.party._id,
        items: [{
          item: testData.item._id,
          quantity: Math.floor(Math.random() * 10) + 1,
          rate: 150,
          taxable: true,
          cgst: 9,
          sgst: 9,
          igst: 0,
          cess: 0
        }],
        narration: `Benchmark voucher ${Date.now()}`
      };
      
      return request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId)
        .send(voucherData);
    }, 5);

    // Generate PDF benchmark
    await this.benchmarkEndpoint('GET /vouchers/:id/pdf', async () => {
      return request(app)
        .get(`/api/vouchers/${testData.voucher._id}/pdf`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    }, 3);
  }

  async benchmarkInventory(token, companyId, testData) {
    console.log('\n📦 Inventory Benchmarks');
    console.log('=======================');

    // Get items benchmark
    await this.benchmarkEndpoint('GET /inventory/items', async () => {
      return request(app)
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Get single item benchmark
    await this.benchmarkEndpoint('GET /inventory/items/:id', async () => {
      return request(app)
        .get(`/api/inventory/items/${testData.item._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Create item benchmark
    await this.benchmarkEndpoint('POST /inventory/items', async () => {
      const itemData = {
        name: `Benchmark Product ${Date.now()}`,
        code: `BENCH${Date.now().toString().slice(-6)}`,
        type: 'product',
        description: 'Benchmark product',
        units: {
          primary: {
            name: 'Pieces',
            symbol: 'Pcs',
            decimalPlaces: 0
          }
        },
        pricing: {
          costPrice: Math.floor(Math.random() * 1000) + 100,
          sellingPrice: Math.floor(Math.random() * 1500) + 150,
          mrp: Math.floor(Math.random() * 2000) + 200
        },
        taxation: {
          hsnCode: '1234',
          taxable: true,
          gstRate: {
            cgst: 9,
            sgst: 9,
            igst: 18,
            cess: 0
          }
        },
        inventory: {
          trackInventory: true,
          stockLevels: {
            minimum: 10,
            maximum: 1000,
            reorderLevel: 20,
            reorderQuantity: 100
          }
        }
      };
      
      return request(app)
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId)
        .send(itemData);
    }, 5);
  }

  async benchmarkParties(token, companyId, testData) {
    console.log('\n👥 Party Benchmarks');
    console.log('===================');

    // Get parties benchmark
    await this.benchmarkEndpoint('GET /parties', async () => {
      return request(app)
        .get('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Get single party benchmark
    await this.benchmarkEndpoint('GET /parties/:id', async () => {
      return request(app)
        .get(`/api/parties/${testData.party._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Create party benchmark
    await this.benchmarkEndpoint('POST /parties', async () => {
      const timestamp = Date.now();
      const partyData = {
        name: `Benchmark Customer ${timestamp}`,
        type: 'customer',
        category: 'business',
        gstin: `29BENCH${timestamp.toString().slice(-6)}F1Z5`,
        contact: {
          phone: `+919876${timestamp.toString().slice(-6)}`,
          email: `benchmark${timestamp}@example.com`
        },
        addresses: [{
          type: 'both',
          line1: 'Benchmark Address',
          city: 'Benchmark City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
          isDefault: true
        }]
      };
      
      return request(app)
        .post('/api/parties')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId)
        .send(partyData);
    }, 5);
  }

  async benchmarkPayments(token, companyId, testData) {
    console.log('\n💳 Payment Benchmarks');
    console.log('=====================');

    // Create payment order benchmark
    await this.benchmarkEndpoint('POST /payments/orders', async () => {
      const orderData = {
        amount: Math.floor(Math.random() * 10000) + 1000,
        currency: 'INR',
        voucherId: testData.voucher._id
      };
      
      return request(app)
        .post('/api/payments/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId)
        .send(orderData);
    }, 5);

    // Generate UPI QR benchmark
    await this.benchmarkEndpoint('POST /payments/upi-qr', async () => {
      // Set company UPI ID for testing
      testData.company.banking = { upiId: 'testcompany@upi' };
      
      const qrData = {
        amount: Math.floor(Math.random() * 5000) + 500,
        transactionNote: 'Benchmark payment'
      };
      
      return request(app)
        .post('/api/payments/upi-qr')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId)
        .send(qrData);
    }, 3);
  }

  async benchmarkEmails(token, companyId, testData) {
    console.log('\n📧 Email Benchmarks');
    console.log('===================');

    // Send email benchmark
    await this.benchmarkEndpoint('POST /emails/send', async () => {
      const emailData = {
        to: 'benchmark@example.com',
        subject: `Benchmark Email ${Date.now()}`,
        template: 'welcome',
        data: {
          user: {
            name: 'Benchmark User',
            email: 'benchmark@example.com'
          }
        }
      };
      
      return request(app)
        .post('/api/emails/send')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId)
        .send(emailData);
    }, 3);

    // Preview template benchmark
    await this.benchmarkEndpoint('GET /emails/preview/welcome', async () => {
      return request(app)
        .get('/api/emails/preview/welcome')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });

    // Get queue status benchmark
    await this.benchmarkEndpoint('GET /emails/queue-status', async () => {
      return request(app)
        .get('/api/emails/queue-status')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Company-ID', companyId);
    });
  }

  calculateSummary() {
    const totalTests = this.benchmarkResults.endpoints.reduce((sum, endpoint) => sum + endpoint.iterations, 0);
    const totalTime = this.benchmarkResults.endpoints.reduce((sum, endpoint) => sum + (endpoint.averageTime * endpoint.iterations), 0);
    const averageResponseTime = totalTime / totalTests;

    const sortedByTime = [...this.benchmarkResults.endpoints].sort((a, b) => a.averageTime - b.averageTime);
    
    this.benchmarkResults.summary = {
      totalTests,
      averageResponseTime: Math.round(averageResponseTime),
      fastestEndpoint: sortedByTime[0],
      slowestEndpoint: sortedByTime[sortedByTime.length - 1]
    };
  }

  generateReport() {
    console.log('\n📊 Performance Benchmark Report');
    console.log('================================');
    
    console.log(`Total Tests: ${this.benchmarkResults.summary.totalTests}`);
    console.log(`Average Response Time: ${this.benchmarkResults.summary.averageResponseTime}ms`);
    console.log(`Fastest Endpoint: ${this.benchmarkResults.summary.fastestEndpoint.name} (${this.benchmarkResults.summary.fastestEndpoint.averageTime}ms)`);
    console.log(`Slowest Endpoint: ${this.benchmarkResults.summary.slowestEndpoint.name} (${this.benchmarkResults.summary.slowestEndpoint.averageTime}ms)`);

    console.log('\n📈 Detailed Results:');
    console.log('====================');
    
    this.benchmarkResults.endpoints
      .sort((a, b) => a.averageTime - b.averageTime)
      .forEach(endpoint => {
        const status = endpoint.successRate === 100 ? '✅' : endpoint.successRate >= 90 ? '⚠️' : '❌';
        console.log(`${status} ${endpoint.name.padEnd(30)} ${endpoint.averageTime.toString().padStart(4)}ms (${endpoint.successRate.toFixed(0)}% success)`);
      });

    // Save results
    this.saveBenchmarkResults();
  }

  saveBenchmarkResults() {
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `benchmark-results-${Date.now()}.json`);
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.benchmarkResults, null, 2));
      console.log(`\n💾 Benchmark results saved to: ${outputPath}`);
    } catch (error) {
      console.log(`\n⚠️  Failed to save benchmark results: ${error.message}`);
    }
  }
}

// Run benchmarks if this script is executed directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runBenchmarks().catch(console.error);
}

module.exports = PerformanceBenchmark;
