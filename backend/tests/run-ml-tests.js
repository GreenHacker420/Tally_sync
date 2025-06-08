#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * ML Service Test Runner
 * Runs all ML service related tests and generates a comprehensive report
 */
class MLTestRunner {
  constructor() {
    this.testFiles = [
      'ml-service-simple.test.js',
      'ml-service-coverage.test.js'
    ];
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testFiles: [],
      summary: {}
    };
  }

  async runAllMLTests() {
    console.log('🤖 ML Service Test Suite Runner');
    console.log('================================\n');

    try {
      console.log('📋 Running ML Service Tests...');
      console.log('Test files to execute:');
      this.testFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
      console.log('');

      // Run each test file
      for (const testFile of this.testFiles) {
        await this.runTestFile(testFile);
      }

      // Generate summary
      this.generateSummary();
      this.generateReport();

      console.log('\n🎉 ML Service Test Suite Completed!');
      
      if (this.results.failedTests === 0) {
        console.log('✅ All tests passed successfully!');
        process.exit(0);
      } else {
        console.log(`❌ ${this.results.failedTests} tests failed`);
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ ML Service Test Suite Failed:', error.message);
      process.exit(1);
    } finally {
      this.results.endTime = new Date();
    }
  }

  async runTestFile(testFile) {
    console.log(`\n🔬 Running ${testFile}...`);
    console.log('─'.repeat(50));

    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test', '--', testFile], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Show real-time output for important messages
        if (text.includes('✓') || text.includes('✗') || text.includes('PASS') || text.includes('FAIL')) {
          process.stdout.write(text);
        }
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        const fileResult = this.parseTestOutput(output, testFile);
        this.results.testFiles.push(fileResult);
        
        this.results.totalTests += fileResult.total;
        this.results.passedTests += fileResult.passed;
        this.results.failedTests += fileResult.failed;

        if (code === 0) {
          console.log(`✅ ${testFile} completed successfully`);
          console.log(`   Tests: ${fileResult.passed}/${fileResult.total} passed`);
        } else {
          console.log(`❌ ${testFile} failed`);
          console.log(`   Tests: ${fileResult.passed}/${fileResult.total} passed`);
          if (errorOutput) {
            console.log(`   Error: ${errorOutput.substring(0, 200)}...`);
          }
        }

        resolve();
      });

      testProcess.on('error', (error) => {
        console.log(`⚠️  Could not execute ${testFile}: ${error.message}`);
        this.results.testFiles.push({
          name: testFile,
          status: 'error',
          passed: 0,
          failed: 0,
          total: 0,
          error: error.message
        });
        resolve();
      });
    });
  }

  parseTestOutput(output, testFile) {
    const result = {
      name: testFile,
      status: 'unknown',
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0
    };

    try {
      // Parse Jest output
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Look for test summary line
        if (line.includes('Tests:') && line.includes('passed')) {
          const match = line.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
          if (match) {
            result.passed = parseInt(match[1]);
            result.total = parseInt(match[2]);
            result.failed = result.total - result.passed;
          }
        }
        
        // Look for time
        if (line.includes('Time:')) {
          const timeMatch = line.match(/Time:\s+([\d.]+)\s*s/);
          if (timeMatch) {
            result.duration = parseFloat(timeMatch[1]);
          }
        }
        
        // Determine status
        if (line.includes('PASS')) {
          result.status = 'passed';
        } else if (line.includes('FAIL')) {
          result.status = 'failed';
        }
      }

      // If we couldn't parse, try to infer from content
      if (result.total === 0) {
        const testMatches = output.match(/✓/g);
        if (testMatches) {
          result.passed = testMatches.length;
          result.total = testMatches.length;
          result.status = 'passed';
        }
      }

    } catch (error) {
      console.log(`⚠️  Could not parse output for ${testFile}`);
    }

    return result;
  }

  generateSummary() {
    const duration = this.results.endTime - this.results.startTime;
    
    this.results.summary = {
      duration: duration,
      successRate: this.results.totalTests > 0 ? 
        (this.results.passedTests / this.results.totalTests * 100).toFixed(1) : 0,
      averageTestTime: this.results.testFiles.length > 0 ?
        (this.results.testFiles.reduce((sum, file) => sum + file.duration, 0) / this.results.testFiles.length).toFixed(2) : 0,
      filesExecuted: this.results.testFiles.length,
      filesSuccessful: this.results.testFiles.filter(f => f.status === 'passed').length
    };
  }

  generateReport() {
    console.log('\n📊 ML SERVICE TEST SUMMARY');
    console.log('==========================');
    
    console.log(`🕐 Total Duration: ${this.formatDuration(this.results.summary.duration)}`);
    console.log(`📁 Test Files: ${this.results.summary.filesSuccessful}/${this.results.summary.filesExecuted} successful`);
    console.log(`🧪 Total Tests: ${this.results.passedTests}/${this.results.totalTests} passed`);
    console.log(`📈 Success Rate: ${this.results.summary.successRate}%`);
    console.log(`⚡ Avg Test Time: ${this.results.summary.averageTestTime}s`);
    
    console.log('\n📋 Test File Results:');
    this.results.testFiles.forEach(file => {
      const status = file.status === 'passed' ? '✅' : 
                    file.status === 'failed' ? '❌' : '⚠️';
      console.log(`   ${status} ${file.name}: ${file.passed}/${file.total} tests (${file.duration}s)`);
    });

    // Quality assessment
    console.log('\n🎯 Quality Assessment:');
    const successRate = parseFloat(this.results.summary.successRate);
    
    if (successRate >= 95) {
      console.log('   🏆 Excellent - All systems operational');
    } else if (successRate >= 80) {
      console.log('   ✅ Good - Minor issues detected');
    } else if (successRate >= 60) {
      console.log('   ⚠️  Fair - Some issues need attention');
    } else {
      console.log('   ❌ Poor - Significant issues detected');
    }

    // Save results to file
    this.saveResults();
  }

  saveResults() {
    try {
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const resultsPath = path.join(outputDir, 'ml-service-test-results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
      
      console.log(`\n💾 Results saved to: ${resultsPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save results: ${error.message}`);
    }
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MLTestRunner();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('ML Service Test Runner');
    console.log('Usage: node run-ml-tests.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --verbose, -v  Show verbose output');
    console.log('');
    console.log('This script runs all ML service integration tests and generates a summary report.');
    process.exit(0);
  }

  runner.runAllMLTests().catch(console.error);
}

module.exports = MLTestRunner;
