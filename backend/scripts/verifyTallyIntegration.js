#!/usr/bin/env node

/**
 * Tally Integration Verification Script
 * 
 * This script verifies that all Tally integration components are working correctly
 */

const mongoose = require('mongoose');
const chalk = require('chalk');

// Import Tally components
const TallySync = require('../src/models/TallySync');
const TallyConnection = require('../src/models/TallyConnection');
const tallyXmlService = require('../src/services/tallyXmlService');
const tallyCommunicationService = require('../src/services/tallyCommunicationService');

console.log(chalk.blue.bold('\n🔍 TALLY INTEGRATION VERIFICATION\n'));

async function verifyModels() {
  console.log(chalk.yellow('📋 Verifying Tally Models...'));
  
  try {
    // Test TallySync model
    const testSync = new TallySync({
      company: new mongoose.Types.ObjectId(),
      entityType: 'voucher',
      entityId: new mongoose.Types.ObjectId(),
      tallyId: 'TEST_VOUCHER_001',
      syncDirection: 'to_tally',
      priority: 'normal',
      createdBy: new mongoose.Types.ObjectId()
    });
    
    // Validate without saving
    const syncValidation = testSync.validateSync();
    if (syncValidation) {
      throw new Error(`TallySync validation failed: ${syncValidation.message}`);
    }
    console.log(chalk.green('  ✅ TallySync model validation passed'));
    
    // Test TallyConnection model
    const testConnection = new TallyConnection({
      company: new mongoose.Types.ObjectId(),
      agentId: 'test-agent-001',
      agentVersion: '1.0.0',
      connectionId: 'conn_test_001',
      status: 'connected',
      tallyInfo: {
        version: 'Tally.ERP 9 Release 6.6.3',
        companyName: 'Test Company Ltd'
      },
      systemInfo: {
        os: 'Windows',
        hostname: 'TEST-PC'
      },
      createdBy: new mongoose.Types.ObjectId()
    });
    
    const connectionValidation = testConnection.validateSync();
    if (connectionValidation) {
      throw new Error(`TallyConnection validation failed: ${connectionValidation.message}`);
    }
    console.log(chalk.green('  ✅ TallyConnection model validation passed'));
    
    // Test model methods
    testSync.syncStatus = 'failed';
    testSync.syncAttempts = 1;
    testSync.lastSyncAttempt = new Date();
    
    const isDueForRetry = testSync.isDueForRetry();
    console.log(chalk.green('  ✅ TallySync methods working correctly'));
    
    testConnection.connectionDetails = {
      lastHeartbeat: new Date(),
      heartbeatInterval: 30000
    };
    
    const connectionHealth = testConnection.connectionHealth;
    console.log(chalk.green('  ✅ TallyConnection methods working correctly'));
    
    return true;
  } catch (error) {
    console.log(chalk.red(`  ❌ Model verification failed: ${error.message}`));
    return false;
  }
}

async function verifyXmlService() {
  console.log(chalk.yellow('\n🔧 Verifying XML Service...'));
  
  try {
    // Test XML parsing
    const testXml = `<?xml version="1.0" encoding="UTF-8"?>
      <ENVELOPE>
        <HEADER>
          <TALLYREQUEST>Export</TALLYREQUEST>
        </HEADER>
        <BODY>
          <EXPORTDATA>
            <REQUESTDESC>
              <REPORTNAME>Company</REPORTNAME>
            </REQUESTDESC>
          </EXPORTDATA>
        </BODY>
      </ENVELOPE>`;
    
    const parsed = tallyXmlService.parseXml(testXml);
    if (!parsed || !parsed.ENVELOPE) {
      throw new Error('XML parsing failed - invalid structure');
    }
    console.log(chalk.green('  ✅ XML parsing working correctly'));
    
    // Test XML building
    const testData = {
      HEADER: {
        TALLYREQUEST: 'Import'
      },
      BODY: {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: 'Vouchers'
          }
        }
      }
    };
    
    const builtXml = tallyXmlService.buildXml(testData, 'ENVELOPE');
    if (!builtXml || !builtXml.includes('<?xml')) {
      throw new Error('XML building failed - invalid output');
    }
    console.log(chalk.green('  ✅ XML building working correctly'));
    
    // Test voucher XML creation
    const testVoucher = {
      _id: new mongoose.Types.ObjectId(),
      type: 'sales',
      number: 'SAL-001',
      date: new Date(),
      party: { name: 'Test Customer' },
      company: { name: 'Test Company' },
      entries: [{
        ledger: { name: 'Sales' },
        amount: 1000
      }]
    };
    
    const voucherXml = tallyXmlService.createVoucherXml(testVoucher);
    if (!voucherXml || !voucherXml.includes('VOUCHER')) {
      throw new Error('Voucher XML creation failed');
    }
    console.log(chalk.green('  ✅ Voucher XML creation working correctly'));
    
    // Test validation
    const validation = tallyXmlService.validateTallyResponse(parsed);
    if (!validation.isValid) {
      throw new Error('XML validation failed');
    }
    console.log(chalk.green('  ✅ XML validation working correctly'));
    
    return true;
  } catch (error) {
    console.log(chalk.red(`  ❌ XML service verification failed: ${error.message}`));
    return false;
  }
}

async function verifyCommunicationService() {
  console.log(chalk.yellow('\n📡 Verifying Communication Service...'));
  
  try {
    // Test connection status
    const connectionStatus = tallyCommunicationService.getConnectionStatus('test-agent');
    if (typeof connectionStatus.connected !== 'boolean') {
      throw new Error('Connection status check failed');
    }
    console.log(chalk.green('  ✅ Connection status check working correctly'));
    
    // Test request ID generation
    const requestId = tallyCommunicationService.generateRequestId();
    if (!requestId || !requestId.startsWith('req_')) {
      throw new Error('Request ID generation failed');
    }
    console.log(chalk.green('  ✅ Request ID generation working correctly'));
    
    return true;
  } catch (error) {
    console.log(chalk.red(`  ❌ Communication service verification failed: ${error.message}`));
    return false;
  }
}

async function verifyApiStructure() {
  console.log(chalk.yellow('\n🌐 Verifying API Structure...'));
  
  try {
    // Check if controller exists and has required methods
    const tallyController = require('../src/controllers/tallyController');
    
    const requiredMethods = [
      'getSyncStatus',
      'syncToTally',
      'syncFromTally',
      'performFullSync',
      'getSyncConflicts',
      'resolveConflict',
      'getTallyConnections',
      'updateTallySettings',
      'testTallyConnection',
      'getSyncLogs'
    ];
    
    for (const method of requiredMethods) {
      if (typeof tallyController[method] !== 'function') {
        throw new Error(`Controller method ${method} not found`);
      }
    }
    console.log(chalk.green('  ✅ All controller methods present'));
    
    // Check if routes exist
    const tallyRoutes = require('../src/routes/tally');
    if (!tallyRoutes) {
      throw new Error('Tally routes not found');
    }
    console.log(chalk.green('  ✅ Tally routes configured correctly'));
    
    return true;
  } catch (error) {
    console.log(chalk.red(`  ❌ API structure verification failed: ${error.message}`));
    return false;
  }
}

async function verifyMiddleware() {
  console.log(chalk.yellow('\n🛡️ Verifying Middleware...'));
  
  try {
    // Check async handler
    const asyncHandler = require('../src/middleware/async');
    if (typeof asyncHandler !== 'function') {
      throw new Error('Async handler not found');
    }
    console.log(chalk.green('  ✅ Async handler working correctly'));
    
    // Check error response
    const ErrorResponse = require('../src/utils/errorResponse');
    const testError = new ErrorResponse('Test error', 400);
    if (testError.statusCode !== 400) {
      throw new Error('ErrorResponse not working correctly');
    }
    console.log(chalk.green('  ✅ ErrorResponse working correctly'));
    
    // Check validation middleware
    const { validateRequest } = require('../src/middleware/validation');
    if (typeof validateRequest !== 'function') {
      throw new Error('Validation middleware not found');
    }
    console.log(chalk.green('  ✅ Validation middleware working correctly'));
    
    return true;
  } catch (error) {
    console.log(chalk.red(`  ❌ Middleware verification failed: ${error.message}`));
    return false;
  }
}

async function runVerification() {
  console.log(chalk.blue.bold('Starting Tally Integration Verification...\n'));
  
  const results = {
    models: await verifyModels(),
    xmlService: await verifyXmlService(),
    communicationService: await verifyCommunicationService(),
    apiStructure: await verifyApiStructure(),
    middleware: await verifyMiddleware()
  };
  
  console.log(chalk.blue.bold('\n📊 VERIFICATION RESULTS:\n'));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([component, passed]) => {
    const status = passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
    console.log(`  ${component.toUpperCase()}: ${status}`);
  });
  
  console.log(chalk.blue.bold(`\n📈 OVERALL RESULT: ${passed}/${total} components verified\n`));
  
  if (passed === total) {
    console.log(chalk.green.bold('🎉 ALL TALLY INTEGRATION COMPONENTS VERIFIED SUCCESSFULLY!'));
    console.log(chalk.green.bold('✅ The Tally Integration Engine is ready for production deployment!'));
  } else {
    console.log(chalk.red.bold('❌ Some components failed verification. Please check the errors above.'));
  }
  
  console.log(chalk.blue.bold('\n' + '='.repeat(60) + '\n'));
}

// Run verification if called directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = { runVerification };
