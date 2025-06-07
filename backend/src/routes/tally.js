const express = require('express');
const {
  getSyncStatus,
  syncToTally,
  syncFromTally,
  performFullSync,
  getSyncConflicts,
  resolveConflict,
  getTallyConnections,
  updateTallySettings,
  testTallyConnection,
  getSyncLogs
} = require('../controllers/tallyController');

const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get Tally sync status for company
// @route   GET /api/tally/sync-status/:companyId
// @access  Private
router.get('/sync-status/:companyId', [
  param('companyId').isMongoId().withMessage('Invalid company ID')
], validateRequest, getSyncStatus);

// @desc    Sync entity to Tally
// @route   POST /api/tally/sync-to-tally
// @access  Private
router.post('/sync-to-tally', [
  body('entityType')
    .isIn(['voucher', 'item', 'party'])
    .withMessage('Entity type must be voucher, item, or party'),
  body('entityId')
    .isMongoId()
    .withMessage('Invalid entity ID'),
  body('companyId')
    .isMongoId()
    .withMessage('Invalid company ID'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'critical'])
    .withMessage('Priority must be low, normal, high, or critical')
], validateRequest, syncToTally);

// @desc    Sync entity from Tally
// @route   POST /api/tally/sync-from-tally
// @access  Private
router.post('/sync-from-tally', [
  body('entityType')
    .isIn(['voucher', 'item', 'party'])
    .withMessage('Entity type must be voucher, item, or party'),
  body('tallyId')
    .notEmpty()
    .withMessage('Tally ID is required'),
  body('companyId')
    .isMongoId()
    .withMessage('Invalid company ID')
], validateRequest, syncFromTally);

// @desc    Perform full sync for company
// @route   POST /api/tally/full-sync/:companyId
// @access  Private (Admin or higher)
router.post('/full-sync/:companyId', [
  param('companyId').isMongoId().withMessage('Invalid company ID')
], validateRequest, authorize('admin', 'superadmin'), performFullSync);

// @desc    Get sync conflicts
// @route   GET /api/tally/conflicts/:companyId
// @access  Private
router.get('/conflicts/:companyId', [
  param('companyId').isMongoId().withMessage('Invalid company ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validateRequest, getSyncConflicts);

// @desc    Resolve sync conflict
// @route   POST /api/tally/resolve-conflict/:conflictId
// @access  Private (Admin or higher)
router.post('/resolve-conflict/:conflictId', [
  param('conflictId').isMongoId().withMessage('Invalid conflict ID'),
  body('resolutionStrategy')
    .isIn(['manual', 'finsync_wins', 'tally_wins', 'merge'])
    .withMessage('Invalid resolution strategy'),
  body('resolvedData')
    .optional()
    .isObject()
    .withMessage('Resolved data must be an object')
], validateRequest, authorize('admin', 'superadmin'), resolveConflict);

// @desc    Get Tally connections
// @route   GET /api/tally/connections/:companyId
// @access  Private
router.get('/connections/:companyId', [
  param('companyId').isMongoId().withMessage('Invalid company ID')
], validateRequest, getTallyConnections);

// @desc    Update Tally integration settings
// @route   PUT /api/tally/settings/:companyId
// @access  Private (Admin or higher)
router.put('/settings/:companyId', [
  param('companyId').isMongoId().withMessage('Invalid company ID'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  body('syncSettings.autoSync')
    .optional()
    .isBoolean()
    .withMessage('Auto sync must be a boolean'),
  body('syncSettings.syncInterval')
    .optional()
    .isInt({ min: 60000 })
    .withMessage('Sync interval must be at least 60000ms (1 minute)'),
  body('syncSettings.syncOnStartup')
    .optional()
    .isBoolean()
    .withMessage('Sync on startup must be a boolean'),
  body('syncSettings.syncOnShutdown')
    .optional()
    .isBoolean()
    .withMessage('Sync on shutdown must be a boolean'),
  body('syncSettings.conflictResolution')
    .optional()
    .isIn(['manual', 'finsync_wins', 'tally_wins', 'timestamp'])
    .withMessage('Invalid conflict resolution strategy'),
  body('syncSettings.enabledEntities.vouchers')
    .optional()
    .isBoolean()
    .withMessage('Vouchers sync setting must be a boolean'),
  body('syncSettings.enabledEntities.items')
    .optional()
    .isBoolean()
    .withMessage('Items sync setting must be a boolean'),
  body('syncSettings.enabledEntities.parties')
    .optional()
    .isBoolean()
    .withMessage('Parties sync setting must be a boolean'),
  body('syncSettings.enabledEntities.ledgers')
    .optional()
    .isBoolean()
    .withMessage('Ledgers sync setting must be a boolean')
], validateRequest, authorize('admin', 'superadmin'), updateTallySettings);

// @desc    Test Tally connection
// @route   POST /api/tally/test-connection
// @access  Private
router.post('/test-connection', [
  body('host')
    .optional()
    .custom((value) => {
      if (value && value !== 'localhost' && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value)) {
        throw new Error('Host must be a valid IP address or localhost');
      }
      return true;
    }),
  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be between 1 and 65535'),
  body('method')
    .optional()
    .isIn(['http', 'tcp', 'websocket'])
    .withMessage('Method must be http, tcp, or websocket')
], validateRequest, testTallyConnection);

// @desc    Get sync logs
// @route   GET /api/tally/sync-logs/:companyId
// @access  Private
router.get('/sync-logs/:companyId', [
  param('companyId').isMongoId().withMessage('Invalid company ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('entityType')
    .optional()
    .isIn(['voucher', 'item', 'party', 'ledger', 'company'])
    .withMessage('Invalid entity type'),
  query('syncStatus')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'failed', 'conflict'])
    .withMessage('Invalid sync status')
], validateRequest, getSyncLogs);

module.exports = router;
