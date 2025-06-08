import { databaseService } from '../services/databaseService';

/**
 * Initialize database and create tables
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await databaseService.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Format date for database storage
 */
export const formatDateForDB = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse date from database
 */
export const parseDateFromDB = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate required fields
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Sanitize data for database storage
 */
export const sanitizeForDB = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data === 'string') {
    return data.trim();
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForDB(value);
    }
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForDB(item));
  }

  return data;
};

/**
 * Convert boolean to integer for SQLite
 */
export const boolToInt = (value: boolean): number => {
  return value ? 1 : 0;
};

/**
 * Convert integer to boolean from SQLite
 */
export const intToBool = (value: number): boolean => {
  return value === 1;
};
