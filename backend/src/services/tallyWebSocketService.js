import { WebSocketServer } from 'ws';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import TallyConnection from '../models/TallyConnection.js';
import tallyCommunicationService from './tallyCommunicationService.js';

class TallyWebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // agentId -> connection info
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'tally-websocket' },
      transports: [
        new winston.transports.File({ filename: 'logs/websocket-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/websocket-combined.log' })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   * @param {string} path - WebSocket path
   */
  initialize(server, path = '/tally-agent') {
    this.wss = new WebSocketServer({
      server,
      path,
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    // Start heartbeat interval
    this.startHeartbeatInterval();

    this.logger.info('Tally WebSocket server initialized', { path });
  }

  /**
   * Verify client connection
   * @param {Object} info - Connection info
   * @returns {boolean} Whether to accept connection
   */
  verifyClient(info) {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      const agentId = url.searchParams.get('agentId');

      if (!token || !agentId) {
        this.logger.warn('WebSocket connection rejected: Missing token or agentId');
        return false;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        this.logger.warn('WebSocket connection rejected: Invalid token');
        return false;
      }

      // Store connection info for later use
      info.req.user = decoded;
      info.req.agentId = agentId;

      return true;
    } catch (error) {
      this.logger.error('Error verifying WebSocket client', { error: error.message });
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} req - HTTP request
   */
  async handleConnection(ws, req) {
    const agentId = req.agentId;
    const user = req.user;

    try {
      this.logger.info('New Tally agent connection', { agentId, userId: user.id });

      // Store connection
      this.connections.set(agentId, {
        ws,
        agentId,
        user,
        lastHeartbeat: new Date(),
        isAlive: true
      });

      // Register with communication service
      tallyCommunicationService.registerWebSocketConnection(agentId, ws);

      // Set up WebSocket event handlers
      ws.on('message', (data) => this.handleMessage(agentId, data));
      ws.on('close', (code, reason) => this.handleDisconnection(agentId, code, reason));
      ws.on('error', (error) => this.handleConnectionError(agentId, error));
      ws.on('pong', () => this.handlePong(agentId));

      // Send welcome message
      this.sendMessage(agentId, {
        type: 'welcome',
        message: 'Connected to FinSync360 Tally Integration',
        timestamp: new Date().toISOString()
      });

      // Update connection status in database
      await this.updateConnectionStatus(agentId, 'connected');

    } catch (error) {
      this.logger.error('Error handling WebSocket connection', {
        agentId,
        error: error.message
      });
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {string} agentId - Agent ID
   * @param {Buffer} data - Message data
   */
  async handleMessage(agentId, data) {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.connections.get(agentId);

      if (!connection) {
        this.logger.warn('Message from unknown agent', { agentId });
        return;
      }

      this.logger.debug('Received message from agent', {
        agentId,
        messageType: message.type,
        messageId: message.id
      });

      switch (message.type) {
        case 'heartbeat':
          await this.handleHeartbeat(agentId, message);
          break;

        case 'agent_info':
          await this.handleAgentInfo(agentId, message);
          break;

        case 'tally_response':
          // Forward to communication service
          tallyCommunicationService.handleWebSocketMessage(agentId, message);
          break;

        case 'tally_notification':
          await this.handleTallyNotification(agentId, message);
          break;

        case 'error':
          await this.handleAgentError(agentId, message);
          break;

        default:
          this.logger.warn('Unknown message type', {
            agentId,
            messageType: message.type
          });
      }

    } catch (error) {
      this.logger.error('Error handling WebSocket message', {
        agentId,
        error: error.message
      });
    }
  }

  /**
   * Handle WebSocket disconnection
   * @param {string} agentId - Agent ID
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  async handleDisconnection(agentId, code, reason) {
    try {
      this.logger.info('Tally agent disconnected', {
        agentId,
        code,
        reason: reason.toString()
      });

      // Remove from connections
      this.connections.delete(agentId);

      // Update connection status in database
      await this.updateConnectionStatus(agentId, 'disconnected', reason.toString());

    } catch (error) {
      this.logger.error('Error handling WebSocket disconnection', {
        agentId,
        error: error.message
      });
    }
  }

  /**
   * Handle WebSocket connection error
   * @param {string} agentId - Agent ID
   * @param {Error} error - Error object
   */
  async handleConnectionError(agentId, error) {
    this.logger.error('WebSocket connection error', {
      agentId,
      error: error.message
    });

    try {
      await this.updateConnectionStatus(agentId, 'error', error.message);
    } catch (dbError) {
      this.logger.error('Error updating connection status', {
        agentId,
        error: dbError.message
      });
    }
  }

  /**
   * Handle heartbeat message
   * @param {string} agentId - Agent ID
   * @param {Object} message - Heartbeat message
   */
  async handleHeartbeat(agentId, message) {
    const connection = this.connections.get(agentId);
    if (connection) {
      connection.lastHeartbeat = new Date();
      connection.isAlive = true;
    }

    // Update database
    try {
      const dbConnection = await TallyConnection.findOne({ agentId });
      if (dbConnection) {
        await dbConnection.updateHeartbeat();
        
        // Update system info if provided
        if (message.data && message.data.systemInfo) {
          dbConnection.systemInfo = {
            ...dbConnection.systemInfo,
            ...message.data.systemInfo
          };
          await dbConnection.save();
        }
      }
    } catch (error) {
      this.logger.error('Error updating heartbeat', {
        agentId,
        error: error.message
      });
    }

    // Send heartbeat response
    this.sendMessage(agentId, {
      type: 'heartbeat_ack',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle agent info message
   * @param {string} agentId - Agent ID
   * @param {Object} message - Agent info message
   */
  async handleAgentInfo(agentId, message) {
    try {
      const { agentVersion, tallyInfo, systemInfo, capabilities } = message.data;

      // Find or create connection record
      let dbConnection = await TallyConnection.findOne({ agentId });
      
      if (!dbConnection) {
        // Create new connection record
        dbConnection = new TallyConnection({
          agentId,
          agentVersion,
          company: message.data.companyId, // Should be provided by agent
          connectionId: this.generateConnectionId(),
          status: 'connected',
          createdBy: this.connections.get(agentId)?.user?.id
        });
      }

      // Update connection info
      if (agentVersion) dbConnection.agentVersion = agentVersion;
      if (tallyInfo) dbConnection.tallyInfo = { ...dbConnection.tallyInfo, ...tallyInfo };
      if (systemInfo) dbConnection.systemInfo = { ...dbConnection.systemInfo, ...systemInfo };
      if (capabilities) dbConnection.capabilities = { ...dbConnection.capabilities, ...capabilities };

      await dbConnection.save();

      this.logger.info('Agent info updated', { agentId });

      // Send acknowledgment
      this.sendMessage(agentId, {
        type: 'agent_info_ack',
        message: 'Agent information updated successfully'
      });

    } catch (error) {
      this.logger.error('Error handling agent info', {
        agentId,
        error: error.message
      });
    }
  }

  /**
   * Handle Tally notification
   * @param {string} agentId - Agent ID
   * @param {Object} message - Notification message
   */
  async handleTallyNotification(agentId, message) {
    this.logger.info('Received Tally notification', {
      agentId,
      notificationType: message.data?.type,
      notification: message.data
    });

    // TODO: Process different types of Tally notifications
    // - Data changes
    // - Company events
    // - Error notifications
    // - Status updates
  }

  /**
   * Handle agent error
   * @param {string} agentId - Agent ID
   * @param {Object} message - Error message
   */
  async handleAgentError(agentId, message) {
    this.logger.error('Agent reported error', {
      agentId,
      error: message.data
    });

    // Update connection with error
    try {
      const dbConnection = await TallyConnection.findOne({ agentId });
      if (dbConnection) {
        dbConnection.addLog('error', message.data.message || 'Agent error', message.data);
        await dbConnection.save();
      }
    } catch (error) {
      this.logger.error('Error logging agent error', {
        agentId,
        error: error.message
      });
    }
  }

  /**
   * Handle pong response
   * @param {string} agentId - Agent ID
   */
  handlePong(agentId) {
    const connection = this.connections.get(agentId);
    if (connection) {
      connection.isAlive = true;
    }
  }

  /**
   * Handle WebSocket server error
   * @param {Error} error - Server error
   */
  handleServerError(error) {
    this.logger.error('WebSocket server error', {
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Send message to agent
   * @param {string} agentId - Agent ID
   * @param {Object} message - Message to send
   * @returns {boolean} Success status
   */
  sendMessage(agentId, message) {
    const connection = this.connections.get(agentId);
    
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot send message: Agent not connected', { agentId });
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.logger.error('Error sending message to agent', {
        agentId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Broadcast message to all connected agents
   * @param {Object} message - Message to broadcast
   * @param {Array} excludeAgents - Agent IDs to exclude
   */
  broadcastMessage(message, excludeAgents = []) {
    let sentCount = 0;
    
    for (const [agentId, connection] of this.connections) {
      if (!excludeAgents.includes(agentId) && connection.ws.readyState === WebSocket.OPEN) {
        if (this.sendMessage(agentId, message)) {
          sentCount++;
        }
      }
    }

    this.logger.info('Message broadcasted', { sentCount, totalConnections: this.connections.size });
    return sentCount;
  }

  /**
   * Start heartbeat interval to check connection health
   */
  startHeartbeatInterval() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Update connection status in database
   * @param {string} agentId - Agent ID
   * @param {string} status - Connection status
   * @param {string} reason - Reason for status change
   */
  async updateConnectionStatus(agentId, status, reason = '') {
    try {
      const dbConnection = await TallyConnection.findOne({ agentId });
      if (dbConnection) {
        if (status === 'connected') {
          await dbConnection.connect();
        } else if (status === 'disconnected') {
          await dbConnection.disconnect(reason);
        } else {
          dbConnection.status = status;
          if (reason) {
            dbConnection.addLog('info', `Status changed to ${status}: ${reason}`);
          }
          await dbConnection.save();
        }
      }
    } catch (error) {
      this.logger.error('Error updating connection status', {
        agentId,
        status,
        error: error.message
      });
    }
  }

  /**
   * Generate unique connection ID
   * @returns {string} Connection ID
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    const totalConnections = this.connections.size;
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.ws.readyState === WebSocket.OPEN).length;

    return {
      totalConnections,
      activeConnections,
      inactiveConnections: totalConnections - activeConnections
    };
  }

  /**
   * Close all connections and shutdown server
   */
  shutdown() {
    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });
      this.wss.close();
    }

    this.connections.clear();
    this.logger.info('Tally WebSocket service shutdown complete');
  }
}

export default new TallyWebSocketService();
