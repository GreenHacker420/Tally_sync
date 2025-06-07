#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      startTime: new Date(),
      endTime: null,
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coverage: {},
      testFiles: [],
      errors: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting FinSync360 ERP Test Suite...\n');

    try {
      // Ensure test output directory exists
      this.ensureTestOutputDir();

      // Run different test suites
      await this.runTestSuite('Authentication Tests', ['auth.test.js']);
      await this.runTestSuite('Voucher Tests', ['vouchers.test.js']);
      await this.runTestSuite('Inventory Tests', ['inventory.test.js']);
      await this.runTestSuite('Party Tests', ['parties.test.js']);
      await this.runTestSuite('Payment Tests', ['payments.test.js']);
      await this.runTestSuite('Email Tests', ['emails.test.js']);

      // Run coverage report
      await this.runCoverageReport();

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.errors.push(error.message);
    } finally {
      this.testResults.endTime = new Date();
      this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
      
      // Save test results
      await this.saveTestResults();
      
      console.log('\n📊 Test Suite Completed!');
      console.log(`⏱️  Total Duration: ${this.formatDuration(this.testResults.duration)}`);
      console.log(`✅ Passed: ${this.testResults.passedTests}`);
      console.log(`❌ Failed: ${this.testResults.failedTests}`);
      console.log(`📈 Total: ${this.testResults.totalTests}`);
    }
  }

  async runTestSuite(suiteName, testFiles) {
    console.log(`\n🧪 Running ${suiteName}...`);
    
    for (const testFile of testFiles) {
      try {
        const result = await this.runSingleTest(testFile);
        this.testResults.testFiles.push({
          name: testFile,
          ...result
        });
        
        console.log(`  ✅ ${testFile}: ${result.passed}/${result.total} tests passed`);
      } catch (error) {
        console.log(`  ❌ ${testFile}: Failed to run`);
        this.testResults.errors.push(`${testFile}: ${error.message}`);
      }
    }
  }

  async runSingleTest(testFile) {
    return new Promise((resolve, reject) => {
      const testPath = path.join(__dirname, testFile);
      
      if (!fs.existsSync(testPath)) {
        reject(new Error(`Test file not found: ${testFile}`));
        return;
      }

      const jest = spawn('npx', ['jest', testFile, '--json'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        output += data.toString();
      });

      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      jest.on('close', (code) => {
        try {
          // Parse Jest JSON output
          const lines = output.split('\n').filter(line => line.trim());
          const jsonLine = lines.find(line => line.startsWith('{'));
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            const testResult = {
              total: result.numTotalTests || 0,
              passed: result.numPassedTests || 0,
              failed: result.numFailedTests || 0,
              duration: result.testResults?.[0]?.perfStats?.end - result.testResults?.[0]?.perfStats?.start || 0,
              success: result.success || false
            };

            this.testResults.totalTests += testResult.total;
            this.testResults.passedTests += testResult.passed;
            this.testResults.failedTests += testResult.failed;

            resolve(testResult);
          } else {
            // Fallback parsing
            const passed = (output.match(/✓/g) || []).length;
            const failed = (output.match(/✕/g) || []).length;
            const total = passed + failed;

            this.testResults.totalTests += total;
            this.testResults.passedTests += passed;
            this.testResults.failedTests += failed;

            resolve({
              total,
              passed,
              failed,
              duration: 0,
              success: failed === 0
            });
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse test output: ${parseError.message}`));
        }
      });

      jest.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runCoverageReport() {
    console.log('\n📊 Generating Coverage Report...');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', '--coverage', '--coverageReporters=json'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';

      jest.stdout.on('data', (data) => {
        output += data.toString();
      });

      jest.on('close', (code) => {
        try {
          // Read coverage report
          const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
          if (fs.existsSync(coveragePath)) {
            const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
            this.testResults.coverage = this.processCoverageData(coverageData);
            console.log('  ✅ Coverage report generated');
          }
          resolve();
        } catch (error) {
          console.log('  ⚠️  Coverage report generation failed');
          resolve(); // Don't fail the entire test suite
        }
      });

      jest.on('error', (error) => {
        console.log('  ⚠️  Coverage report generation failed');
        resolve(); // Don't fail the entire test suite
      });
    });
  }

  processCoverageData(coverageData) {
    const summary = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };

    Object.values(coverageData).forEach(file => {
      if (file.lines) {
        summary.lines.total += Object.keys(file.lines).length;
        summary.lines.covered += Object.values(file.lines).filter(hit => hit > 0).length;
      }
      if (file.functions) {
        summary.functions.total += Object.keys(file.functions).length;
        summary.functions.covered += Object.values(file.functions).filter(hit => hit > 0).length;
      }
      if (file.branches) {
        summary.branches.total += Object.keys(file.branches).length;
        summary.branches.covered += Object.values(file.branches).filter(hit => hit > 0).length;
      }
      if (file.statements) {
        summary.statements.total += Object.keys(file.statements).length;
        summary.statements.covered += Object.values(file.statements).filter(hit => hit > 0).length;
      }
    });

    // Calculate percentages
    Object.keys(summary).forEach(key => {
      if (summary[key].total > 0) {
        summary[key].percentage = Math.round((summary[key].covered / summary[key].total) * 100);
      }
    });

    return summary;
  }

  generateFinalReport() {
    console.log('\n📋 Test Summary Report');
    console.log('========================');
    
    this.testResults.testFiles.forEach(file => {
      const status = file.success ? '✅' : '❌';
      console.log(`${status} ${file.name}: ${file.passed}/${file.total} (${this.formatDuration(file.duration)})`);
    });

    if (Object.keys(this.testResults.coverage).length > 0) {
      console.log('\n📊 Coverage Summary');
      console.log('===================');
      console.log(`Lines: ${this.testResults.coverage.lines.percentage}% (${this.testResults.coverage.lines.covered}/${this.testResults.coverage.lines.total})`);
      console.log(`Functions: ${this.testResults.coverage.functions.percentage}% (${this.testResults.coverage.functions.covered}/${this.testResults.coverage.functions.total})`);
      console.log(`Branches: ${this.testResults.coverage.branches.percentage}% (${this.testResults.coverage.branches.covered}/${this.testResults.coverage.branches.total})`);
      console.log(`Statements: ${this.testResults.coverage.statements.percentage}% (${this.testResults.coverage.statements.covered}/${this.testResults.coverage.statements.total})`);
    }

    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors');
      console.log('==========');
      this.testResults.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
  }

  ensureTestOutputDir() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  async saveTestResults() {
    const outputPath = path.join(__dirname, 'output', `test-results-${Date.now()}.json`);
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.testResults, null, 2));
      console.log(`\n💾 Test results saved to: ${outputPath}`);
    } catch (error) {
      console.log(`\n⚠️  Failed to save test results: ${error.message}`);
    }
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;
