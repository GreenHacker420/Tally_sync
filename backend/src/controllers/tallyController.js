const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const tallySyncService = require('../services/tallySyncService');
const tallyCommunicationService = require('../services/tallyCommunicationService');
const TallySync = require('../models/TallySync');
const TallyConnection = require('../models/TallyConnection');
const Company = require('../models/Company');

// @desc    Get Tally sync status for company
// @route   GET /api/tally/sync-status/:companyId
// @access  Private
exports.getSyncStatus = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Check if user has access to company
  const company = await Company.findById(companyId);
  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  if (!company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  // Get sync statistics
  const stats = await TallySync.getSyncStats(companyId, '24h');
  
  // Get active connections
  const connections = await TallyConnection.findActiveConnections(companyId);
  
  // Get pending syncs
  const pendingSyncs = await TallySync.getPendingSyncs(companyId, { limit: 10 });

  res.status(200).json({
    success: true,
    data: {
      company: {
        id: company._id,
        name: company.name,
        tallyIntegration: company.tallyIntegration
      },
      statistics: stats,
      connections: connections.map(conn => ({
        id: conn._id,
        agentId: conn.agentId,
        status: conn.status,
        connectionHealth: conn.connectionHealth,
        lastConnected: conn.lastConnected,
        successRate: conn.successRate,
        tallyInfo: conn.tallyInfo
      })),
      pendingSyncs: pendingSyncs.map(sync => ({
        id: sync._id,
        entityType: sync.entityType,
        entityId: sync.entityId,
        syncStatus: sync.syncStatus,
        priority: sync.priority,
        lastSyncAttempt: sync.lastSyncAttempt,
        syncAttempts: sync.syncAttempts
      }))
    }
  });
});

// @desc    Sync entity to Tally
// @route   POST /api/tally/sync-to-tally
// @access  Private
exports.syncToTally = asyncHandler(async (req, res, next) => {
  const { entityType, entityId, companyId, priority = 'normal' } = req.body;

  // Validate input
  if (!entityType || !entityId || !companyId) {
    return next(new ErrorResponse('Entity type, entity ID, and company ID are required', 400));
  }

  const validEntityTypes = ['voucher', 'item', 'party'];
  if (!validEntityTypes.includes(entityType)) {
    return next(new ErrorResponse('Invalid entity type', 400));
  }

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  if (!company.tallyIntegration.enabled) {
    return next(new ErrorResponse('Tally integration is not enabled for this company', 400));
  }

  try {
    const result = await tallySyncService.syncToTally(entityType, entityId, companyId, {
      userId: req.user.id,
      priority
    });

    res.status(200).json({
      success: true,
      message: 'Entity synced to Tally successfully',
      data: {
        syncRecord: result.syncRecord,
        tallyResponse: result.response
      }
    });

  } catch (error) {
    return next(new ErrorResponse(`Sync failed: ${error.message}`, 500));
  }
});

// @desc    Sync entity from Tally
// @route   POST /api/tally/sync-from-tally
// @access  Private
exports.syncFromTally = asyncHandler(async (req, res, next) => {
  const { entityType, tallyId, companyId } = req.body;

  // Validate input
  if (!entityType || !tallyId || !companyId) {
    return next(new ErrorResponse('Entity type, Tally ID, and company ID are required', 400));
  }

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  try {
    const result = await tallySyncService.syncFromTally(entityType, tallyId, companyId, {
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Entity synced from Tally successfully',
      data: result
    });

  } catch (error) {
    return next(new ErrorResponse(`Sync failed: ${error.message}`, 500));
  }
});

// @desc    Perform full sync for company
// @route   POST /api/tally/full-sync/:companyId
// @access  Private
exports.performFullSync = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  if (!company.tallyIntegration.enabled) {
    return next(new ErrorResponse('Tally integration is not enabled for this company', 400));
  }

  try {
    const results = await tallySyncService.performFullSync(companyId);

    res.status(200).json({
      success: true,
      message: 'Full sync completed',
      data: results
    });

  } catch (error) {
    return next(new ErrorResponse(`Full sync failed: ${error.message}`, 500));
  }
});

// @desc    Get sync conflicts
// @route   GET /api/tally/conflicts/:companyId
// @access  Private
exports.getSyncConflicts = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  const conflicts = await TallySync.find({
    company: companyId,
    syncStatus: 'conflict'
  })
  .populate('entityId')
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);

  const total = await TallySync.countDocuments({
    company: companyId,
    syncStatus: 'conflict'
  });

  res.status(200).json({
    success: true,
    data: {
      conflicts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Resolve sync conflict
// @route   POST /api/tally/resolve-conflict/:conflictId
// @access  Private
exports.resolveConflict = asyncHandler(async (req, res, next) => {
  const { conflictId } = req.params;
  const { resolutionStrategy, resolvedData } = req.body;

  const conflict = await TallySync.findById(conflictId);
  if (!conflict) {
    return next(new ErrorResponse('Conflict not found', 404));
  }

  // Check company access
  const company = await Company.findById(conflict.company);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  if (conflict.syncStatus !== 'conflict') {
    return next(new ErrorResponse('This sync record is not in conflict state', 400));
  }

  const validStrategies = ['manual', 'finsync_wins', 'tally_wins', 'merge'];
  if (!validStrategies.includes(resolutionStrategy)) {
    return next(new ErrorResponse('Invalid resolution strategy', 400));
  }

  try {
    // Update conflict resolution
    conflict.conflictData.resolutionStrategy = resolutionStrategy;
    conflict.conflictData.resolvedBy = req.user.id;
    conflict.conflictData.resolvedAt = new Date();

    if (resolutionStrategy === 'manual' && resolvedData) {
      conflict.conflictData.resolvedData = resolvedData;
    }

    conflict.syncStatus = 'pending'; // Will be processed by sync service
    await conflict.save();

    res.status(200).json({
      success: true,
      message: 'Conflict resolution strategy set successfully',
      data: conflict
    });

  } catch (error) {
    return next(new ErrorResponse(`Failed to resolve conflict: ${error.message}`, 500));
  }
});

// @desc    Get Tally connections
// @route   GET /api/tally/connections/:companyId
// @access  Private
exports.getTallyConnections = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  const connections = await TallyConnection.find({ company: companyId })
    .sort({ lastConnected: -1 });

  res.status(200).json({
    success: true,
    data: connections.map(conn => ({
      id: conn._id,
      agentId: conn.agentId,
      agentVersion: conn.agentVersion,
      status: conn.status,
      connectionHealth: conn.connectionHealth,
      tallyInfo: conn.tallyInfo,
      systemInfo: conn.systemInfo,
      performance: conn.performance,
      lastConnected: conn.lastConnected,
      lastDisconnected: conn.lastDisconnected,
      totalUptime: conn.totalUptime,
      currentUptime: conn.currentUptime
    }))
  });
});

// @desc    Update Tally integration settings
// @route   PUT /api/tally/settings/:companyId
// @access  Private
exports.updateTallySettings = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { enabled, syncSettings } = req.body;

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  // Update Tally integration settings
  if (typeof enabled === 'boolean') {
    company.tallyIntegration.enabled = enabled;
  }

  if (syncSettings) {
    company.tallyIntegration.syncSettings = {
      ...company.tallyIntegration.syncSettings,
      ...syncSettings
    };
  }

  await company.save();

  // Update scheduled sync if auto sync settings changed
  if (syncSettings && (syncSettings.autoSync !== undefined || syncSettings.syncInterval)) {
    tallySyncService.scheduleAutoSync(companyId, company.tallyIntegration.syncSettings);
  }

  res.status(200).json({
    success: true,
    message: 'Tally integration settings updated successfully',
    data: {
      tallyIntegration: company.tallyIntegration
    }
  });
});

// @desc    Test Tally connection
// @route   POST /api/tally/test-connection
// @access  Private
exports.testTallyConnection = asyncHandler(async (req, res, next) => {
  const { host = 'localhost', port = 9000, method = 'http' } = req.body;

  try {
    // Create a simple test XML request
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

    const startTime = Date.now();
    const response = await tallyCommunicationService.sendRequest(testXml, {
      method,
      host,
      port,
      timeout: 10000
    });
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: 'Tally connection test successful',
      data: {
        connected: response.success,
        responseTime,
        tallyVersion: response.data?.COMPANY?.VERSION || 'Unknown',
        method,
        host,
        port
      }
    });

  } catch (error) {
    res.status(200).json({
      success: false,
      message: 'Tally connection test failed',
      error: error.message,
      data: {
        connected: false,
        method,
        host,
        port
      }
    });
  }
});

// @desc    Get sync logs
// @route   GET /api/tally/sync-logs/:companyId
// @access  Private
exports.getSyncLogs = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, limit = 20, entityType, syncStatus } = req.query;

  // Check company access
  const company = await Company.findById(companyId);
  if (!company || !company.hasUserAccess(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  const query = { company: companyId };
  
  if (entityType) {
    query.entityType = entityType;
  }
  
  if (syncStatus) {
    query.syncStatus = syncStatus;
  }

  const logs = await TallySync.find(query)
    .populate('entityId', 'name number')
    .sort({ lastSyncDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await TallySync.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});
