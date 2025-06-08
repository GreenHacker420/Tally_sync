/**
 * Authentication Service for FinSync360 Desktop
 * Handles user authentication and session management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const electronLog = require('electron-log');
const { EventEmitter } = require('events');

class AuthService extends EventEmitter {
  constructor() {
    super();
    this.currentUser = null;
    this.authToken = null;
    this.databaseService = null;
    this.syncService = null;
    
    // JWT configuration
    this.jwtSecret = process.env.JWT_SECRET || 'finsync360-desktop-secret';
    this.jwtExpiresIn = '24h';
  }

  async initialize() {
    try {
      electronLog.info('Initializing authentication service...');
      
      // Get service references
      const { DatabaseService } = require('./DatabaseService');
      const { SyncService } = require('./SyncService');
      
      this.databaseService = new DatabaseService();
      
      // Try to restore session
      await this.restoreSession();
      
      electronLog.info('Authentication service initialized');
    } catch (error) {
      electronLog.error('Failed to initialize authentication service:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { username, password, rememberMe = false } = credentials;
      
      electronLog.info(`Login attempt for user: ${username}`);
      
      // First try local authentication
      let user = await this.authenticateLocal(username, password);
      
      // If local auth fails or user not found, try backend authentication
      if (!user) {
        user = await this.authenticateBackend(username, password);
        
        // If backend auth succeeds, cache user locally
        if (user) {
          await this.cacheUserLocally(user, password);
        }
      }
      
      if (!user) {
        throw new Error('Invalid username or password');
      }
      
      // Generate JWT token
      this.authToken = this.generateToken(user);
      this.currentUser = user;
      
      // Update last login
      await this.updateLastLogin(user.id);
      
      // Store session if remember me is checked
      if (rememberMe) {
        await this.storeSession();
      }
      
      this.emit('user-logged-in', user);
      
      electronLog.info(`User ${username} logged in successfully`);
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        token: this.authToken
      };
      
    } catch (error) {
      electronLog.error('Login failed:', error);
      this.emit('login-failed', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async authenticateLocal(username, password) {
    try {
      const user = await this.databaseService.get(
        'SELECT * FROM users WHERE username = ? AND isActive = 1',
        [username]
      );
      
      if (!user) {
        return null;
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return null;
      }
      
      return user;
    } catch (error) {
      electronLog.error('Local authentication error:', error);
      return null;
    }
  }

  async authenticateBackend(username, password) {
    try {
      // Try to authenticate with backend API
      if (!this.syncService) {
        const { SyncService } = require('./SyncService');
        this.syncService = new SyncService();
      }
      
      const response = await this.syncService.callBackendAPI('POST', '/api/auth/login', {
        username,
        password
      });
      
      if (response.success && response.user) {
        return response.user;
      }
      
      return null;
    } catch (error) {
      electronLog.warn('Backend authentication failed:', error.message);
      return null;
    }
  }

  async cacheUserLocally(user, password) {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      
      const localUser = {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        passwordHash,
        role: user.role || 'user',
        permissions: typeof user.permissions === 'object' 
          ? JSON.stringify(user.permissions) 
          : user.permissions,
        isActive: 1,
        lastLogin: new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced'
      };
      
      // Insert or update user in local database
      await this.databaseService.run(
        `INSERT OR REPLACE INTO users 
         (id, username, email, passwordHash, role, permissions, isActive, lastLogin, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localUser.id,
          localUser.username,
          localUser.email,
          localUser.passwordHash,
          localUser.role,
          localUser.permissions,
          localUser.isActive,
          localUser.lastLogin,
          localUser.createdAt,
          localUser.updatedAt,
          localUser.syncStatus
        ]
      );
      
      electronLog.info(`User ${user.username} cached locally`);
    } catch (error) {
      electronLog.error('Failed to cache user locally:', error);
    }
  }

  async logout() {
    try {
      electronLog.info(`User ${this.currentUser?.username} logging out`);
      
      // Clear session
      await this.clearSession();
      
      // Clear current user and token
      const previousUser = this.currentUser;
      this.currentUser = null;
      this.authToken = null;
      
      this.emit('user-logged-out', previousUser);
      
      return { success: true };
    } catch (error) {
      electronLog.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const { username, email, password, role = 'user' } = userData;
      
      // Check if user already exists
      const existingUser = await this.databaseService.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const userId = this.generateUserId();
      const now = new Date().toISOString();
      
      const user = {
        id: userId,
        username,
        email,
        passwordHash,
        role,
        permissions: JSON.stringify(this.getDefaultPermissions(role)),
        isActive: 1,
        lastLogin: null,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending'
      };
      
      // Insert user into local database
      await this.databaseService.run(
        `INSERT INTO users 
         (id, username, email, passwordHash, role, permissions, isActive, lastLogin, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.email,
          user.passwordHash,
          user.role,
          user.permissions,
          user.isActive,
          user.lastLogin,
          user.createdAt,
          user.updatedAt,
          user.syncStatus
        ]
      );
      
      electronLog.info(`User ${username} registered successfully`);
      
      return {
        success: true,
        user: this.sanitizeUser(user)
      };
      
    } catch (error) {
      electronLog.error('Registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, this.currentUser.passwordHash);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      await this.databaseService.run(
        'UPDATE users SET passwordHash = ?, updatedAt = ?, syncStatus = ? WHERE id = ?',
        [newPasswordHash, new Date().toISOString(), 'pending', this.currentUser.id]
      );
      
      // Update current user
      this.currentUser.passwordHash = newPasswordHash;
      
      electronLog.info(`Password changed for user ${this.currentUser.username}`);
      
      return { success: true };
    } catch (error) {
      electronLog.error('Password change failed:', error);
      return { success: false, error: error.message };
    }
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      electronLog.warn('Token verification failed:', error.message);
      return null;
    }
  }

  async updateLastLogin(userId) {
    try {
      await this.databaseService.run(
        'UPDATE users SET lastLogin = ?, syncStatus = ? WHERE id = ?',
        [new Date().toISOString(), 'pending', userId]
      );
    } catch (error) {
      electronLog.error('Failed to update last login:', error);
    }
  }

  async storeSession() {
    try {
      if (!this.currentUser || !this.authToken) {
        return;
      }
      
      await this.databaseService.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['stored_session', JSON.stringify({
          user: this.sanitizeUser(this.currentUser),
          token: this.authToken,
          timestamp: new Date().toISOString()
        })]
      );
    } catch (error) {
      electronLog.error('Failed to store session:', error);
    }
  }

  async restoreSession() {
    try {
      const sessionData = await this.databaseService.get(
        'SELECT value FROM settings WHERE key = ?',
        ['stored_session']
      );
      
      if (!sessionData) {
        return false;
      }
      
      const session = JSON.parse(sessionData.value);
      const tokenPayload = this.verifyToken(session.token);
      
      if (!tokenPayload) {
        await this.clearSession();
        return false;
      }
      
      // Restore user from database
      const user = await this.databaseService.get(
        'SELECT * FROM users WHERE id = ? AND isActive = 1',
        [tokenPayload.id]
      );
      
      if (!user) {
        await this.clearSession();
        return false;
      }
      
      this.currentUser = user;
      this.authToken = session.token;
      
      this.emit('session-restored', user);
      
      electronLog.info(`Session restored for user ${user.username}`);
      return true;
    } catch (error) {
      electronLog.error('Failed to restore session:', error);
      await this.clearSession();
      return false;
    }
  }

  async clearSession() {
    try {
      await this.databaseService.run(
        'DELETE FROM settings WHERE key = ?',
        ['stored_session']
      );
    } catch (error) {
      electronLog.error('Failed to clear session:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.authToken;
  }

  hasPermission(permission) {
    if (!this.currentUser) {
      return false;
    }
    
    if (this.currentUser.role === 'admin') {
      return true;
    }
    
    try {
      const permissions = typeof this.currentUser.permissions === 'string'
        ? JSON.parse(this.currentUser.permissions)
        : this.currentUser.permissions;
      
      return permissions && permissions.includes(permission);
    } catch (error) {
      electronLog.error('Permission check error:', error);
      return false;
    }
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getDefaultPermissions(role) {
    const permissions = {
      user: [
        'vouchers.read',
        'vouchers.create',
        'parties.read',
        'inventory.read',
        'reports.read'
      ],
      manager: [
        'vouchers.read',
        'vouchers.create',
        'vouchers.update',
        'parties.read',
        'parties.create',
        'parties.update',
        'inventory.read',
        'inventory.create',
        'inventory.update',
        'reports.read',
        'reports.create'
      ],
      admin: [
        'all'
      ]
    };
    
    return permissions[role] || permissions.user;
  }
}

module.exports = AuthService;
