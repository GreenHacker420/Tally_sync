#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

/**
 * ML Service Starter for Testing
 * Starts the ML service if it's not already running
 */
class MLServiceStarter {
  constructor() {
    this.mlServicePath = path.join(__dirname, '../../ml-service');
    this.mlServiceURL = 'http://localhost:8001';
    this.maxRetries = 30;
    this.retryInterval = 2000; // 2 seconds
    this.mlProcess = null;
  }

  async startMLService() {
    console.log('🤖 Starting ML Service for Testing...');
    console.log('====================================');

    try {
      // Check if ML service is already running
      if (await this.isMLServiceRunning()) {
        console.log('✅ ML Service is already running');
        return true;
      }

      // Check if ML service directory exists
      if (!fs.existsSync(this.mlServicePath)) {
        console.log('❌ ML Service directory not found');
        console.log('   Expected path:', this.mlServicePath);
        return false;
      }

      // Check if we can use the test version
      const testMainPath = path.join(this.mlServicePath, 'test_main.py');
      const mainPath = path.join(this.mlServicePath, 'main.py');
      
      let scriptToRun = null;
      if (fs.existsSync(testMainPath)) {
        scriptToRun = testMainPath;
        console.log('📝 Using test ML service (test_main.py)');
      } else if (fs.existsSync(mainPath)) {
        scriptToRun = mainPath;
        console.log('📝 Using full ML service (main.py)');
      } else {
        console.log('❌ No ML service script found');
        return false;
      }

      // Start the ML service
      console.log('🚀 Starting ML service...');
      
      this.mlProcess = spawn('python', [scriptToRun], {
        cwd: this.mlServicePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      // Handle process output
      this.mlProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Uvicorn running')) {
          console.log('✅ ML Service started successfully');
        }
      });

      this.mlProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('WARNING') && !error.includes('INFO')) {
          console.log('⚠️  ML Service error:', error);
        }
      });

      this.mlProcess.on('close', (code) => {
        console.log(`🔄 ML Service process exited with code ${code}`);
      });

      this.mlProcess.on('error', (error) => {
        console.error('❌ Failed to start ML Service:', error.message);
      });

      // Wait for service to be ready
      const isReady = await this.waitForMLService();
      
      if (isReady) {
        console.log('✅ ML Service is ready for testing');
        return true;
      } else {
        console.log('❌ ML Service failed to start within timeout');
        this.stopMLService();
        return false;
      }

    } catch (error) {
      console.error('❌ Error starting ML Service:', error.message);
      return false;
    }
  }

  async isMLServiceRunning() {
    try {
      const response = await axios.get(`${this.mlServiceURL}/api/v1/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async waitForMLService() {
    console.log('⏳ Waiting for ML Service to be ready...');
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await axios.get(`${this.mlServiceURL}/api/v1/health`, {
          timeout: 3000
        });
        
        if (response.status === 200) {
          console.log(`✅ ML Service responded after ${(i + 1) * this.retryInterval / 1000}s`);
          return true;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }

      if (i < this.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryInterval));
        process.stdout.write('.');
      }
    }

    console.log('\n❌ ML Service did not respond within timeout');
    return false;
  }

  stopMLService() {
    if (this.mlProcess) {
      console.log('🛑 Stopping ML Service...');
      this.mlProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds if it doesn't stop gracefully
      setTimeout(() => {
        if (this.mlProcess && !this.mlProcess.killed) {
          console.log('🔨 Force killing ML Service...');
          this.mlProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.mlProcess = null;
    }
  }

  async checkMLServiceDependencies() {
    console.log('🔍 Checking ML Service dependencies...');
    
    try {
      // Check if Python is available
      const pythonCheck = spawn('python', ['--version'], { stdio: 'pipe' });
      
      await new Promise((resolve, reject) => {
        pythonCheck.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Python is available');
            resolve();
          } else {
            console.log('❌ Python is not available');
            reject(new Error('Python not found'));
          }
        });
      });

      // Check if requirements.txt exists
      const requirementsPath = path.join(this.mlServicePath, 'requirements.txt');
      if (fs.existsSync(requirementsPath)) {
        console.log('✅ requirements.txt found');
      } else {
        console.log('⚠️  requirements.txt not found');
      }

      // Check if FastAPI dependencies are installed
      const fastApiCheck = spawn('python', ['-c', 'import fastapi; print("FastAPI available")'], {
        stdio: 'pipe',
        cwd: this.mlServicePath
      });

      await new Promise((resolve) => {
        let output = '';
        fastApiCheck.stdout.on('data', (data) => {
          output += data.toString();
        });

        fastApiCheck.on('close', (code) => {
          if (code === 0 && output.includes('FastAPI available')) {
            console.log('✅ FastAPI is available');
          } else {
            console.log('⚠️  FastAPI may not be installed');
          }
          resolve();
        });
      });

      return true;

    } catch (error) {
      console.error('❌ Dependency check failed:', error.message);
      return false;
    }
  }

  async installMLServiceDependencies() {
    console.log('📦 Installing ML Service dependencies...');
    
    try {
      const requirementsPath = path.join(this.mlServicePath, 'requirements.txt');
      
      if (!fs.existsSync(requirementsPath)) {
        console.log('⚠️  No requirements.txt found, skipping dependency installation');
        return true;
      }

      const installProcess = spawn('pip', ['install', '-r', 'requirements.txt'], {
        cwd: this.mlServicePath,
        stdio: 'inherit'
      });

      await new Promise((resolve, reject) => {
        installProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Dependencies installed successfully');
            resolve();
          } else {
            console.log('❌ Failed to install dependencies');
            reject(new Error('Dependency installation failed'));
          }
        });
      });

      return true;

    } catch (error) {
      console.error('❌ Error installing dependencies:', error.message);
      return false;
    }
  }

  // Cleanup on process exit
  setupCleanup() {
    const cleanup = () => {
      this.stopMLService();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }
}

// CLI interface
if (require.main === module) {
  const starter = new MLServiceStarter();
  
  async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    switch (command) {
      case 'start':
        starter.setupCleanup();
        const success = await starter.startMLService();
        if (!success) {
          process.exit(1);
        }
        // Keep the process running
        process.stdin.resume();
        break;

      case 'stop':
        starter.stopMLService();
        break;

      case 'check':
        const isRunning = await starter.isMLServiceRunning();
        console.log(`ML Service is ${isRunning ? 'running' : 'not running'}`);
        process.exit(isRunning ? 0 : 1);
        break;

      case 'deps':
        await starter.checkMLServiceDependencies();
        break;

      case 'install':
        await starter.installMLServiceDependencies();
        break;

      default:
        console.log('Usage: node start-ml-service.js [start|stop|check|deps|install]');
        process.exit(1);
    }
  }

  main().catch(console.error);
}

module.exports = MLServiceStarter;
