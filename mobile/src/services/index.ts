import { databaseService } from './databaseService';
import { webSocketService } from './webSocketService';
import { syncService } from './syncService';
import { authService } from './authService';

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
};

// Export API client
export { apiClient } from './apiClient';
