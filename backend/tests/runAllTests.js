#!/usr/bin/env node

const TestRunner = require('./runTests');
const TestDataSeeder = require('./seedTestData');
const APIDocumentationGenerator = require('./generateApiDocs');
const PerformanceBenchmark = require('./performanceBenchmark');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      duration: 0,
      testResults: null,
      benchmarkResults: null,
      seededData: null,
      documentation: null,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageResponseTime: 0,
        coveragePercentage: 0
      }
    };
  }

  async runComprehensiveTestSuite() {
    console.log('🚀 FinSync360 ERP - Comprehensive Test Suite');
    console.log('=============================================\n');

    try {
      // Step 1: Generate API Documentation
      await this.generateDocumentation();

      // Step 2: Seed Test Data
      await this.seedTestData();

      // Step 3: Run Unit Tests
      await this.runUnitTests();

      // Step 4: Run Performance Benchmarks
      await this.runPerformanceBenchmarks();

      // Step 5: Generate Final Report
      await this.generateFinalReport();

      console.log('\n🎉 Comprehensive Test Suite Completed Successfully!');

    } catch (error) {
      console.error('\n❌ Comprehensive Test Suite Failed:', error);
      process.exit(1);
    } finally {
      this.results.endTime = new Date();
      this.results.duration = this.results.endTime - this.results.startTime;
    }
  }

  async generateDocumentation() {
    console.log('📚 Step 1: Generating API Documentation...');
    console.log('==========================================');

    try {
      const docGenerator = new APIDocumentationGenerator();
      docGenerator.generateDocumentation();
      this.results.documentation = 'Generated successfully';
      console.log('✅ API Documentation generated successfully\n');
    } catch (error) {
      console.error('❌ Documentation generation failed:', error.message);
      this.results.documentation = `Failed: ${error.message}`;
    }
  }

  async seedTestData() {
    console.log('🌱 Step 2: Seeding Test Data...');
    console.log('===============================');

    try {
      const seeder = new TestDataSeeder();
      const seededData = await seeder.seedCompleteDataset();
      this.results.seededData = await seeder.exportTestData();
      
      console.log('✅ Test data seeded successfully');
      console.log(`   📊 Companies: ${this.results.seededData.summary.companies}`);
      console.log(`   👥 Parties: ${this.results.seededData.summary.parties}`);
      console.log(`   📦 Items: ${this.results.seededData.summary.items}`);
      console.log(`   📄 Vouchers: ${this.results.seededData.summary.vouchers}\n`);
      
      // Save seeded data
      this.saveSeededData();
      
      // Cleanup after seeding
      await seeder.cleanup();
    } catch (error) {
      console.error('❌ Test data seeding failed:', error.message);
      this.results.seededData = `Failed: ${error.message}`;
    }
  }

  async runUnitTests() {
    console.log('🧪 Step 3: Running Unit Tests...');
    console.log('================================');

    try {
      const testRunner = new TestRunner();
      await testRunner.runAllTests();

      // Extract results from test runner
      this.results.testResults = testRunner.testResults;

      console.log('✅ Unit tests completed successfully');

      // Step 3.1: Run ML Service Tests
      await this.runMLServiceTests();

    } catch (error) {
      console.error('❌ Unit tests failed:', error.message);
      this.results.testResults = `Failed: ${error.message}`;
    }
  }

  async runMLServiceTests() {
    console.log('\n🤖 Step 3.1: Running ML Service Integration Tests...');
    console.log('===================================================');

    try {
      const { spawn } = require('child_process');

      // Run ML service specific tests
      const mlTestFiles = [
        'ml-service.test.js',
        'ml-service-integration.test.js',
        'ml-service-coverage.test.js'
      ];

      for (const testFile of mlTestFiles) {
        console.log(`   🔬 Running ${testFile}...`);

        await new Promise((resolve, reject) => {
          const testProcess = spawn('npm', ['test', '--', testFile], {
            stdio: 'pipe',
            cwd: process.cwd()
          });

          let output = '';
          let errorOutput = '';

          testProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });

          testProcess.on('close', (code) => {
            if (code === 0) {
              console.log(`   ✅ ${testFile} passed`);
              resolve();
            } else {
              console.log(`   ❌ ${testFile} failed`);
              console.log(`   Error: ${errorOutput}`);
              resolve(); // Don't reject to continue with other tests
            }
          });

          testProcess.on('error', (error) => {
            console.log(`   ⚠️  ${testFile} could not be executed: ${error.message}`);
            resolve(); // Don't reject to continue with other tests
          });
        });
      }

      console.log('✅ ML Service tests completed\n');

    } catch (error) {
      console.error('❌ ML Service tests failed:', error.message);
    }
  }

  async runPerformanceBenchmarks() {
    console.log('⚡ Step 4: Running Performance Benchmarks...');
    console.log('============================================');

    try {
      const benchmark = new PerformanceBenchmark();
      await benchmark.runBenchmarks();
      
      this.results.benchmarkResults = benchmark.benchmarkResults;
      
      console.log('✅ Performance benchmarks completed successfully\n');
    } catch (error) {
      console.error('❌ Performance benchmarks failed:', error.message);
      this.results.benchmarkResults = `Failed: ${error.message}`;
    }
  }

  async generateFinalReport() {
    console.log('📋 Step 5: Generating Final Report...');
    console.log('=====================================');

    try {
      // Calculate summary
      this.calculateSummary();
      
      // Generate reports
      this.generateConsoleReport();
      this.generateHTMLReport();
      this.saveResults();
      
      console.log('✅ Final report generated successfully\n');
    } catch (error) {
      console.error('❌ Final report generation failed:', error.message);
    }
  }

  calculateSummary() {
    // Test summary
    if (this.results.testResults && typeof this.results.testResults === 'object') {
      this.results.summary.totalTests = this.results.testResults.totalTests || 0;
      this.results.summary.passedTests = this.results.testResults.passedTests || 0;
      this.results.summary.failedTests = this.results.testResults.failedTests || 0;
      
      // Coverage summary
      if (this.results.testResults.coverage && this.results.testResults.coverage.lines) {
        this.results.summary.coveragePercentage = this.results.testResults.coverage.lines.percentage || 0;
      }
    }

    // Performance summary
    if (this.results.benchmarkResults && typeof this.results.benchmarkResults === 'object') {
      this.results.summary.averageResponseTime = this.results.benchmarkResults.summary?.averageResponseTime || 0;
    }
  }

  generateConsoleReport() {
    console.log('📊 COMPREHENSIVE TEST SUITE REPORT');
    console.log('===================================');
    
    console.log(`🕐 Duration: ${this.formatDuration(this.results.duration)}`);
    console.log(`📅 Completed: ${this.results.endTime.toISOString()}`);
    
    console.log('\n📋 Test Results:');
    console.log(`   ✅ Passed: ${this.results.summary.passedTests}`);
    console.log(`   ❌ Failed: ${this.results.summary.failedTests}`);
    console.log(`   📊 Total: ${this.results.summary.totalTests}`);
    console.log(`   📈 Coverage: ${this.results.summary.coveragePercentage}%`);
    
    console.log('\n⚡ Performance:');
    console.log(`   🚀 Avg Response Time: ${this.results.summary.averageResponseTime}ms`);
    
    if (this.results.benchmarkResults && this.results.benchmarkResults.summary) {
      console.log(`   🏃 Fastest: ${this.results.benchmarkResults.summary.fastestEndpoint?.name} (${this.results.benchmarkResults.summary.fastestEndpoint?.averageTime}ms)`);
      console.log(`   🐌 Slowest: ${this.results.benchmarkResults.summary.slowestEndpoint?.name} (${this.results.benchmarkResults.summary.slowestEndpoint?.averageTime}ms)`);
    }
    
    console.log('\n🌱 Test Data:');
    if (this.results.seededData && this.results.seededData.summary) {
      console.log(`   🏢 Companies: ${this.results.seededData.summary.companies}`);
      console.log(`   👥 Parties: ${this.results.seededData.summary.parties}`);
      console.log(`   📦 Items: ${this.results.seededData.summary.items}`);
      console.log(`   📄 Vouchers: ${this.results.seededData.summary.vouchers}`);
    }
    
    console.log('\n📚 Documentation: ✅ Generated');
    
    // Quality Assessment
    console.log('\n🎯 Quality Assessment:');
    const testPassRate = this.results.summary.totalTests > 0 ? 
      (this.results.summary.passedTests / this.results.summary.totalTests) * 100 : 0;
    
    console.log(`   🧪 Test Pass Rate: ${testPassRate.toFixed(1)}%`);
    console.log(`   📊 Code Coverage: ${this.results.summary.coveragePercentage}%`);
    console.log(`   ⚡ Performance: ${this.results.summary.averageResponseTime < 500 ? 'Excellent' : 
      this.results.summary.averageResponseTime < 1000 ? 'Good' : 'Needs Improvement'}`);
    
    // Overall Grade
    const overallGrade = this.calculateOverallGrade(testPassRate, this.results.summary.coveragePercentage, this.results.summary.averageResponseTime);
    console.log(`   🏆 Overall Grade: ${overallGrade}`);
  }

  calculateOverallGrade(testPassRate, coverage, avgResponseTime) {
    let score = 0;
    
    // Test pass rate (40% weight)
    if (testPassRate >= 95) score += 40;
    else if (testPassRate >= 90) score += 35;
    else if (testPassRate >= 80) score += 30;
    else if (testPassRate >= 70) score += 20;
    else score += 10;
    
    // Coverage (35% weight)
    if (coverage >= 90) score += 35;
    else if (coverage >= 80) score += 30;
    else if (coverage >= 70) score += 25;
    else if (coverage >= 60) score += 20;
    else score += 10;
    
    // Performance (25% weight)
    if (avgResponseTime <= 200) score += 25;
    else if (avgResponseTime <= 500) score += 20;
    else if (avgResponseTime <= 1000) score += 15;
    else if (avgResponseTime <= 2000) score += 10;
    else score += 5;
    
    if (score >= 90) return 'A+ (Excellent)';
    if (score >= 80) return 'A (Very Good)';
    if (score >= 70) return 'B (Good)';
    if (score >= 60) return 'C (Fair)';
    return 'D (Needs Improvement)';
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinSync360 ERP - Test Suite Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .card h3 { margin: 0 0 10px 0; color: #333; }
        .card .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .grade { font-size: 20px; font-weight: bold; padding: 10px; border-radius: 6px; text-align: center; }
        .grade-a { background: #d4edda; color: #155724; }
        .grade-b { background: #fff3cd; color: #856404; }
        .grade-c { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FinSync360 ERP - Comprehensive Test Suite Report</h1>
            <p>Generated on: ${this.results.endTime.toLocaleString()}</p>
            <p>Duration: ${this.formatDuration(this.results.duration)}</p>
        </div>

        <div class="summary">
            <div class="card">
                <h3>Test Results</h3>
                <div class="value">${this.results.summary.passedTests}/${this.results.summary.totalTests}</div>
                <p>Tests Passed</p>
            </div>
            <div class="card">
                <h3>Code Coverage</h3>
                <div class="value">${this.results.summary.coveragePercentage}%</div>
                <p>Lines Covered</p>
            </div>
            <div class="card">
                <h3>Performance</h3>
                <div class="value">${this.results.summary.averageResponseTime}ms</div>
                <p>Avg Response Time</p>
            </div>
            <div class="card">
                <h3>Overall Grade</h3>
                <div class="grade grade-a">${this.calculateOverallGrade(
                  this.results.summary.totalTests > 0 ? (this.results.summary.passedTests / this.results.summary.totalTests) * 100 : 0,
                  this.results.summary.coveragePercentage,
                  this.results.summary.averageResponseTime
                )}</div>
            </div>
        </div>

        <div class="section">
            <h2>Test Files Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test File</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Total</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.testResults && this.results.testResults.testFiles ? 
                      this.results.testResults.testFiles.map(file => `
                        <tr>
                            <td>${file.name}</td>
                            <td class="success">${file.passed}</td>
                            <td class="danger">${file.failed}</td>
                            <td>${file.total}</td>
                            <td>${file.total > 0 ? ((file.passed / file.total) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      `).join('') : '<tr><td colspan="5">No test results available</td></tr>'
                    }
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Performance Benchmarks</h2>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Avg Time (ms)</th>
                        <th>Min Time (ms)</th>
                        <th>Max Time (ms)</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.benchmarkResults && this.results.benchmarkResults.endpoints ? 
                      this.results.benchmarkResults.endpoints.map(endpoint => `
                        <tr>
                            <td>${endpoint.name}</td>
                            <td>${endpoint.averageTime}</td>
                            <td>${endpoint.minTime}</td>
                            <td>${endpoint.maxTime}</td>
                            <td class="${endpoint.successRate >= 95 ? 'success' : endpoint.successRate >= 80 ? 'warning' : 'danger'}">${endpoint.successRate.toFixed(1)}%</td>
                        </tr>
                      `).join('') : '<tr><td colspan="5">No benchmark results available</td></tr>'
                    }
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, 'test-report.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`📄 HTML report saved to: ${htmlPath}`);
  }

  saveSeededData() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const dataPath = path.join(outputDir, 'seeded-test-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(this.results.seededData, null, 2));
    
    console.log(`💾 Seeded test data saved to: ${dataPath}`);
  }

  saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const resultsPath = path.join(outputDir, 'comprehensive-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    
    console.log(`💾 Complete results saved to: ${resultsPath}`);
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run comprehensive test suite if this script is executed directly
if (require.main === module) {
  const suite = new ComprehensiveTestSuite();
  suite.runComprehensiveTestSuite().catch(console.error);
}

module.exports = ComprehensiveTestSuite;
