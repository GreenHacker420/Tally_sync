const WebSocket = require('ws');
const EventEmitter = require('events');
const electronLog = require('electron-log');
const crypto = require('crypto-js');
const { machineId } = require('node-machine-id');

class WebSocketClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    
    this.config = {
      serverUrl: 'ws://localhost:5000/tally-agent',
      apiKey: '',
      agentId: '',
      heartbeatInterval: 30000,
      heartbeatTimeout: 10000,
      maxMessageSize: 1024 * 1024 // 1MB
    };
    
    this.logger = electronLog.scope('WebSocketClient');
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize() {
    this.logger.info('Initializing WebSocket Client...');
    
    try {
      // Load configuration
      await this.loadConfig();
      
      // Generate unique agent ID if not exists
      await this.generateAgentId();
      
      // Connect to server
      await this.connect();
      
      this.logger.info('WebSocket Client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket Client:', error);
      throw error;
    }
  }

  async loadConfig() {
    const Store = require('electron-store');
    const store = new Store();
    
    const savedConfig = store.get('webSocketConfig', {});
    this.config = { ...this.config, ...savedConfig };
    
    this.logger.info('WebSocket configuration loaded');
  }

  async saveConfig(newConfig) {
    const Store = require('electron-store');
    const store = new Store();
    
    this.config = { ...this.config, ...newConfig };
    store.set('webSocketConfig', this.config);
    
    this.logger.info('WebSocket configuration saved');
  }

  async generateAgentId() {
    if (!this.config.agentId) {
      try {
        const machineIdValue = await machineId();
        this.config.agentId = crypto.SHA256(machineIdValue).toString();
        await this.saveConfig(this.config);
        this.logger.info('Generated unique agent ID');
      } catch (error) {
        this.logger.error('Failed to generate agent ID:', error);
        // Fallback to random ID
        this.config.agentId = crypto.lib.WordArray.random(32).toString();
      }
    }
  }

  async connect() {
    if (this.isConnected || this.isReconnecting) {
      return;
    }

    this.logger.info('Connecting to FinSync360 server...');
    
    try {
      const url = new URL(this.config.serverUrl);
      url.searchParams.set('agentId', this.config.agentId);
      url.searchParams.set('apiKey', this.config.apiKey);
      
      this.ws = new WebSocket(url.toString(), {
        headers: {
          'User-Agent': 'FinSync360-Desktop-Agent/1.0.0'
        }
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.ws.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.ws.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error('Failed to connect to server:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.ws.on('open', () => {
      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      
      this.logger.info('Connected to FinSync360 server');
      this.emit('connected');
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
      // Send agent registration
      this.sendMessage('agent-register', {
        agentId: this.config.agentId,
        version: require('../../package.json').version,
        platform: process.platform,
        arch: process.arch
      });
    });

    this.ws.on('close', (code, reason) => {
      this.isConnected = false;
      this.stopHeartbeat();
      
      this.logger.info(`Disconnected from server: ${code} - ${reason}`);
      this.emit('disconnected', { code, reason });
      
      // Attempt reconnection
      if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error:', error);
      this.emit('error', error);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        this.logger.error('Failed to parse message:', error);
      }
    });

    this.ws.on('ping', () => {
      this.ws.pong();
    });

    this.ws.on('pong', () => {
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
    });
  }

  handleMessage(message) {
    this.logger.debug('Received message:', message.type);
    
    switch (message.type) {
      case 'sync-request':
        this.handleSyncRequest(message.data);
        break;
        
      case 'config-update':
        this.handleConfigUpdate(message.data);
        break;
        
      case 'ping':
        this.sendMessage('pong', { timestamp: Date.now() });
        break;
        
      case 'agent-command':
        this.handleAgentCommand(message.data);
        break;
        
      default:
        this.emit('message', message);
        break;
    }
  }

  handleSyncRequest(data) {
    this.logger.info('Received sync request:', data);
    this.emit('sync-request', data);
  }

  handleConfigUpdate(data) {
    this.logger.info('Received config update');
    this.emit('config-update', data);
  }

  handleAgentCommand(data) {
    this.logger.info('Received agent command:', data.command);
    this.emit('agent-command', data);
  }

  sendMessage(type, data = {}) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      agentId: this.config.agentId
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        
        if (messageStr.length > this.config.maxMessageSize) {
          this.logger.error('Message too large:', messageStr.length);
          return false;
        }
        
        this.ws.send(messageStr);
        this.logger.debug('Sent message:', type);
        return true;
      } catch (error) {
        this.logger.error('Failed to send message:', error);
        return false;
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      this.logger.debug('Queued message:', type);
      return false;
    }
  }

  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      
      try {
        const messageStr = JSON.stringify(message);
        this.ws.send(messageStr);
        this.logger.debug('Sent queued message:', message.type);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error('Failed to send queued message:', error);
        // Put message back at the front of the queue
        this.messageQueue.unshift(message);
        break;
      }
    }
    
    this.isProcessingQueue = false;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          this.logger.warn('Heartbeat timeout - connection may be lost');
          this.ws.terminate();
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  scheduleReconnect() {
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    this.logger.info(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnect attempt failed:', error);
        this.isReconnecting = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.logger.error('Max reconnect attempts reached');
          this.emit('max-reconnect-attempts-reached');
        }
      }
    }, delay);
  }

  async disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Agent shutdown');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    
    this.logger.info('Disconnected from server');
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      serverUrl: this.config.serverUrl,
      agentId: this.config.agentId
    };
  }

  updateConfig(newConfig) {
    const oldServerUrl = this.config.serverUrl;
    this.config = { ...this.config, ...newConfig };
    
    // If server URL changed, reconnect
    if (oldServerUrl !== this.config.serverUrl && this.isConnected) {
      this.disconnect();
      setTimeout(() => this.connect(), 1000);
    }
    
    this.saveConfig(this.config);
  }
}

module.exports = WebSocketClient;
