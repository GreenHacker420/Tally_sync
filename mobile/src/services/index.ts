import { databaseService } from './databaseService';
import { webSocketService } from './webSocketService';
import { syncService } from './syncService';
import { authService } from './authService';
import { mlService } from './mlService';
import { companyService } from './companyService';
import { voucherService } from './voucherService';
import { inventoryService } from './inventoryService';
import { paymentService } from './paymentService';
import { reportService } from './reportService';
import { notificationService } from './notificationService';
import { tallyService } from './tallyService';
import { offlineManager } from './offlineManager';
import { biometricService } from './biometricService';
import { realTimeManager } from './realTimeManager';
import { collaborativeEditingService } from './collaborativeEditingService';

/**
 * Initialize all services
 */
export const initializeServices = async (): Promise<void> => {
  try {
    console.log('Initializing services...');
    
    // Initialize database first
    await databaseService.initialize();
    console.log('✓ Database service initialized');
    
    // Check if user is authenticated
    const isAuthenticated = await authService.isAuthenticated();
    
    if (isAuthenticated) {
      // Initialize WebSocket connection
      await webSocketService.initialize();
      console.log('✓ WebSocket service initialized');

      // Initialize real-time manager
      await realTimeManager.initialize();
      console.log('✓ Real-time manager initialized');

      // Sync service will be initialized automatically when WebSocket connects
      console.log('✓ Sync service ready');
    }
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Cleanup all services
 */
export const cleanupServices = async (): Promise<void> => {
  try {
    console.log('Cleaning up services...');
    
    webSocketService.disconnect();
    await databaseService.close();
    
    console.log('Services cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup services:', error);
  }
};

// Export services
export {
  databaseService,
  webSocketService,
  syncService,
  authService,
  mlService,
  companyService,
  voucherService,
  inventoryService,
  paymentService,
  reportService,
  notificationService,
  tallyService,
  offlineManager,
  biometricService,
  realTimeManager,
  collaborativeEditingService,
};

// Export API client
export { apiClient } from './apiClient';
