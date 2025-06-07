# FinSync360 ERP - Comprehensive Testing Suite

This directory contains a complete testing framework for the FinSync360 ERP backend system, including unit tests, integration tests, performance benchmarks, and API documentation generation.

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:comprehensive
```

### Individual Test Commands
```bash
# Unit tests only
npm test

# Unit tests with coverage
npm run test:coverage

# Performance benchmarks
npm run test:benchmark

# Generate API documentation
npm run test:docs

# Seed test data
npm run test:seed

# Watch mode for development
npm run test:watch
```

## 📁 Directory Structure

```
tests/
├── README.md                    # This file
├── setup.js                     # Jest test setup
├── jest.config.js               # Jest configuration
├── runTests.js                  # Individual test runner
├── runAllTests.js               # Comprehensive test suite
├── performanceBenchmark.js      # Performance benchmarking
├── generateApiDocs.js           # API documentation generator
├── seedTestData.js              # Test data seeding
├── helpers/
│   └── testData.js              # Test data helper utilities
├── output/                      # Generated reports and data
│   ├── test-report.html         # HTML test report
│   ├── api-documentation.md     # API documentation
│   ├── benchmark-results.json   # Performance results
│   └── seeded-test-data.json    # Test data export
├── auth.test.js                 # Authentication tests
├── vouchers.test.js             # Voucher management tests
├── inventory.test.js            # Inventory management tests
├── parties.test.js              # Party management tests
├── payments.test.js             # Payment integration tests
└── emails.test.js               # Email system tests
```

## 🧪 Test Categories

### 1. Authentication Tests (`auth.test.js`)
- User registration and validation
- Login/logout functionality
- Password reset and change
- JWT token management
- Account verification

### 2. Voucher Tests (`vouchers.test.js`)
- CRUD operations for all voucher types
- Automatic numbering system
- PDF generation
- File attachments
- Business logic validation

### 3. Inventory Tests (`inventory.test.js`)
- Item management (products/services)
- Stock tracking and levels
- Multi-godown support
- File uploads (images/documents)
- Search and filtering

### 4. Party Tests (`parties.test.js`)
- Customer/supplier management
- Contact information handling
- Address management
- Credit limits and balances
- GSTIN validation

### 5. Payment Tests (`payments.test.js`)
- Razorpay integration
- Payment order creation
- UPI QR code generation
- Payment verification
- Webhook handling
- Refund processing

### 6. Email Tests (`emails.test.js`)
- Template rendering
- Email queue management
- Bulk email sending
- Delivery tracking
- Invoice notifications
- Payment reminders

## 📊 Performance Benchmarking

The performance benchmark suite tests response times and throughput for all major API endpoints:

### Metrics Collected
- Average response time
- Minimum/maximum response times
- Success rate
- Throughput (requests per second)
- Memory usage patterns

### Benchmark Categories
- **Authentication**: Login, registration, token validation
- **CRUD Operations**: Create, read, update, delete for all entities
- **File Operations**: Upload, download, PDF generation
- **Complex Queries**: Search, filtering, pagination
- **Integration Points**: Payment processing, email sending

### Performance Targets
- **Excellent**: < 200ms average response time
- **Good**: 200-500ms average response time
- **Acceptable**: 500-1000ms average response time
- **Needs Improvement**: > 1000ms average response time

## 📈 Coverage Requirements

The test suite maintains high code coverage standards:

- **Lines**: Minimum 80% coverage
- **Functions**: Minimum 80% coverage
- **Branches**: Minimum 80% coverage
- **Statements**: Minimum 80% coverage

### Coverage Reports
- Console output during test runs
- HTML report in `coverage/` directory
- JSON report for CI/CD integration

## 🔧 Test Configuration

### Environment Variables
```bash
# Test Database
MONGODB_URI_TEST=mongodb://localhost:27017/finsync360_test

# Email Testing
SMTP_HOST=smtp.test.com
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=test-password

# Payment Testing
RAZORPAY_KEY_ID=test_key_id
RAZORPAY_KEY_SECRET=test_key_secret

# Notification Testing
TWILIO_ACCOUNT_SID=test_account_sid
TWILIO_AUTH_TOKEN=test_auth_token
```

### Jest Configuration
- Uses MongoDB Memory Server for isolated testing
- Automatic cleanup after each test
- 30-second timeout for integration tests
- Parallel test execution
- Mock external services

## 📋 Test Data Management

### Test Data Helper (`helpers/testData.js`)
Provides utilities for creating consistent test data:

```javascript
const testHelper = new TestDataHelper();

// Create complete test dataset
const testData = await testHelper.createCompleteTestData();

// Create specific entities
const user = await testHelper.createTestUser();
const company = await testHelper.createTestCompany();
const party = await testHelper.createTestParty();
const item = await testHelper.createTestItem();
const voucher = await testHelper.createTestVoucher();
```

### Data Seeding (`seedTestData.js`)
Creates comprehensive test datasets for manual testing:

- Multiple companies with different business types
- Diverse party portfolios (customers/suppliers)
- Product and service catalogs
- Transaction histories
- Test scenarios (overdue payments, low stock, etc.)

## 📄 API Documentation

### Auto-Generated Documentation
The test suite automatically generates comprehensive API documentation:

- **Markdown Format**: Human-readable documentation
- **JSON Format**: Machine-readable API specification
- **Interactive Examples**: Request/response samples
- **Error Codes**: Complete error handling documentation

### Documentation Sections
1. Authentication endpoints
2. Voucher management
3. Inventory operations
4. Party management
5. Payment processing
6. Email notifications
7. File operations
8. Reporting endpoints

## 🎯 Quality Metrics

### Overall Grade Calculation
The test suite provides an overall quality grade based on:

- **Test Pass Rate** (40% weight)
- **Code Coverage** (35% weight)
- **Performance** (25% weight)

### Grade Scale
- **A+ (90-100)**: Excellent - Production ready
- **A (80-89)**: Very Good - Minor improvements needed
- **B (70-79)**: Good - Some optimization required
- **C (60-69)**: Fair - Significant improvements needed
- **D (0-59)**: Poor - Major issues to address

## 🚨 Continuous Integration

### CI/CD Integration
```bash
# Run in CI environment
npm run test:ci

# Generate reports for CI
npm run test:comprehensive
```

### GitHub Actions Example
```yaml
- name: Run Comprehensive Tests
  run: npm run test:comprehensive
  
- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: tests/output/
```

## 🔍 Debugging Tests

### Common Issues
1. **Database Connection**: Ensure MongoDB is running
2. **Environment Variables**: Check all required variables are set
3. **Port Conflicts**: Ensure test ports are available
4. **Memory Issues**: Increase Node.js memory limit if needed

### Debug Commands
```bash
# Run specific test file
npx jest auth.test.js

# Run with verbose output
npx jest --verbose

# Run single test
npx jest --testNamePattern="should register user"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📞 Support

For issues with the testing suite:

1. Check the console output for specific error messages
2. Verify all dependencies are installed
3. Ensure environment variables are properly set
4. Review the generated test reports in `tests/output/`
5. Check individual test files for specific test failures

## 🔄 Contributing

When adding new tests:

1. Follow existing test patterns and naming conventions
2. Include both positive and negative test cases
3. Add performance benchmarks for new endpoints
4. Update API documentation for new features
5. Maintain minimum coverage requirements
6. Add test data helpers for new entities

## 📊 Sample Output

```
🚀 FinSync360 ERP - Comprehensive Test Suite
=============================================

📚 Step 1: Generating API Documentation...
✅ API Documentation generated successfully

🌱 Step 2: Seeding Test Data...
✅ Test data seeded successfully
   📊 Companies: 4
   👥 Parties: 24
   📦 Items: 32
   📄 Vouchers: 16

🧪 Step 3: Running Unit Tests...
✅ Unit tests completed successfully

⚡ Step 4: Running Performance Benchmarks...
✅ Performance benchmarks completed successfully

📋 Step 5: Generating Final Report...
✅ Final report generated successfully

🎉 Comprehensive Test Suite Completed Successfully!

📊 COMPREHENSIVE TEST SUITE REPORT
===================================
🕐 Duration: 2.3m
📅 Completed: 2024-01-15T10:30:45.123Z

📋 Test Results:
   ✅ Passed: 156
   ❌ Failed: 2
   📊 Total: 158
   📈 Coverage: 87%

⚡ Performance:
   🚀 Avg Response Time: 245ms
   🏃 Fastest: GET /auth/me (45ms)
   🐌 Slowest: POST /vouchers/:id/pdf (1200ms)

🎯 Quality Assessment:
   🧪 Test Pass Rate: 98.7%
   📊 Code Coverage: 87%
   ⚡ Performance: Excellent
   🏆 Overall Grade: A+ (Excellent)
```
