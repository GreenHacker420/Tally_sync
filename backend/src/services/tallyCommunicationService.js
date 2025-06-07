const axios = require('axios');
const net = require('net');
const WebSocket = require('ws');
const winston = require('winston');
const tallyXmlService = require('./tallyXmlService');
const TallyConnection = require('../models/TallyConnection');

class TallyCommunicationService {
  constructor() {
    this.connections = new Map(); // Store active connections
    this.defaultTimeout = 30000; // 30 seconds
    this.maxRetries = 3;
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'tally-communication' },
      transports: [
        new winston.transports.File({ filename: 'logs/tally-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/tally-combined.log' })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  /**
   * Send XML request to Tally via HTTP
   * @param {string} xmlRequest - XML request string
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Tally response
   */
  async sendHttpRequest(xmlRequest, options = {}) {
    const {
      host = 'localhost',
      port = 9000,
      timeout = this.defaultTimeout,
      retries = this.maxRetries
    } = options;

    const url = `http://${host}:${port}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.info('Sending HTTP request to Tally', { 
          url, 
          attempt, 
          xmlLength: xmlRequest.length 
        });

        const response = await axios.post(url, xmlRequest, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Length': Buffer.byteLength(xmlRequest, 'utf8')
          },
          timeout,
          validateStatus: () => true // Accept all status codes
        });

        this.logger.info('Received HTTP response from Tally', {
          status: response.status,
          responseLength: response.data?.length || 0
        });

        if (response.status === 200 && response.data) {
          const parsedResponse = tallyXmlService.parseXml(response.data);
          const validation = tallyXmlService.validateTallyResponse(parsedResponse);
          
          if (validation.hasError) {
            throw new Error(`Tally error: ${validation.errorMessage}`);
          }
          
          return {
            success: true,
            data: validation.data,
            rawResponse: response.data,
            responseTime: response.headers['x-response-time'] || 0
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        this.logger.error('HTTP request failed', {
          attempt,
          error: error.message,
          url
        });

        if (attempt === retries) {
          throw new Error(`Failed to communicate with Tally after ${retries} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  /**
   * Send XML request to Tally via TCP
   * @param {string} xmlRequest - XML request string
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Tally response
   */
  async sendTcpRequest(xmlRequest, options = {}) {
    const {
      host = 'localhost',
      port = 9000,
      timeout = this.defaultTimeout
    } = options;

    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let responseData = '';
      let timer;

      // Set timeout
      timer = setTimeout(() => {
        client.destroy();
        reject(new Error('TCP request timeout'));
      }, timeout);

      client.connect(port, host, () => {
        this.logger.info('TCP connection established', { host, port });
        client.write(xmlRequest);
      });

      client.on('data', (data) => {
        responseData += data.toString();
      });

      client.on('close', () => {
        clearTimeout(timer);
        
        try {
          if (responseData) {
            const parsedResponse = tallyXmlService.parseXml(responseData);
            const validation = tallyXmlService.validateTallyResponse(parsedResponse);
            
            if (validation.hasError) {
              reject(new Error(`Tally error: ${validation.errorMessage}`));
            } else {
              resolve({
                success: true,
                data: validation.data,
                rawResponse: responseData
              });
            }
          } else {
            reject(new Error('No response received from Tally'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Tally response: ${error.message}`));
        }
      });

      client.on('error', (error) => {
        clearTimeout(timer);
        this.logger.error('TCP connection error', { error: error.message, host, port });
        reject(new Error(`TCP connection failed: ${error.message}`));
      });
    });
  }

  /**
   * Send request via WebSocket (for desktop agent)
   * @param {string} agentId - Desktop agent ID
   * @param {Object} request - Request object
   * @returns {Promise<Object>} Response from agent
   */
  async sendWebSocketRequest(agentId, request) {
    const connection = this.connections.get(agentId);
    
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      throw new Error(`No active WebSocket connection for agent: ${agentId}`);
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket request timeout'));
      }, this.defaultTimeout);

      // Store request callback
      connection.pendingRequests = connection.pendingRequests || new Map();
      connection.pendingRequests.set(requestId, { resolve, reject, timeout });

      // Send request
      const message = {
        id: requestId,
        type: 'tally_request',
        data: request,
        timestamp: new Date().toISOString()
      };

      connection.send(JSON.stringify(message));
      
      this.logger.info('WebSocket request sent', { 
        agentId, 
        requestId, 
        requestType: request.type 
      });
    });
  }

  /**
   * Handle WebSocket message from desktop agent
   * @param {string} agentId - Agent ID
   * @param {Object} message - Received message
   */
  handleWebSocketMessage(agentId, message) {
    try {
      const connection = this.connections.get(agentId);
      if (!connection) return;

      if (message.type === 'tally_response' && message.id) {
        const pendingRequest = connection.pendingRequests?.get(message.id);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeout);
          connection.pendingRequests.delete(message.id);
          
          if (message.success) {
            pendingRequest.resolve(message.data);
          } else {
            pendingRequest.reject(new Error(message.error || 'Unknown error'));
          }
        }
      } else if (message.type === 'heartbeat') {
        this.handleHeartbeat(agentId);
      } else if (message.type === 'tally_notification') {
        this.handleTallyNotification(agentId, message.data);
      }

    } catch (error) {
      this.logger.error('Error handling WebSocket message', {
        agentId,
        error: error.message,
        message
      });
    }
  }

  /**
   * Register WebSocket connection for desktop agent
   * @param {string} agentId - Agent ID
   * @param {WebSocket} ws - WebSocket connection
   */
  registerWebSocketConnection(agentId, ws) {
    this.connections.set(agentId, ws);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(agentId, message);
      } catch (error) {
        this.logger.error('Invalid WebSocket message', { agentId, error: error.message });
      }
    });

    ws.on('close', () => {
      this.connections.delete(agentId);
      this.logger.info('WebSocket connection closed', { agentId });
    });

    ws.on('error', (error) => {
      this.logger.error('WebSocket error', { agentId, error: error.message });
    });

    this.logger.info('WebSocket connection registered', { agentId });
  }

  /**
   * Send voucher to Tally
   * @param {Object} voucher - Voucher data
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Import result
   */
  async sendVoucherToTally(voucher, options = {}) {
    try {
      const xmlRequest = tallyXmlService.createVoucherXml(voucher);
      
      this.logger.info('Sending voucher to Tally', {
        voucherId: voucher._id,
        voucherType: voucher.type,
        voucherNumber: voucher.number
      });

      const response = await this.sendRequest(xmlRequest, options);
      
      if (response.success) {
        this.logger.info('Voucher sent successfully', {
          voucherId: voucher._id,
          responseTime: response.responseTime
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to send voucher to Tally', {
        voucherId: voucher._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send stock item to Tally
   * @param {Object} item - Item data
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Import result
   */
  async sendStockItemToTally(item, options = {}) {
    try {
      const xmlRequest = tallyXmlService.createStockItemXml(item);
      
      this.logger.info('Sending stock item to Tally', {
        itemId: item._id,
        itemName: item.name
      });

      const response = await this.sendRequest(xmlRequest, options);
      
      if (response.success) {
        this.logger.info('Stock item sent successfully', {
          itemId: item._id,
          responseTime: response.responseTime
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to send stock item to Tally', {
        itemId: item._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send ledger to Tally
   * @param {Object} party - Party data
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Import result
   */
  async sendLedgerToTally(party, options = {}) {
    try {
      const xmlRequest = tallyXmlService.createLedgerXml(party);
      
      this.logger.info('Sending ledger to Tally', {
        partyId: party._id,
        partyName: party.name
      });

      const response = await this.sendRequest(xmlRequest, options);
      
      if (response.success) {
        this.logger.info('Ledger sent successfully', {
          partyId: party._id,
          responseTime: response.responseTime
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to send ledger to Tally', {
        partyId: party._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Export data from Tally
   * @param {string} reportName - Tally report name
   * @param {Object} filters - Export filters
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Export result
   */
  async exportFromTally(reportName, filters = {}, options = {}) {
    try {
      const xmlRequest = tallyXmlService.createExportRequest(reportName, filters);
      
      this.logger.info('Exporting data from Tally', {
        reportName,
        filters
      });

      const response = await this.sendRequest(xmlRequest, options);
      
      if (response.success) {
        this.logger.info('Data exported successfully', {
          reportName,
          responseTime: response.responseTime
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to export data from Tally', {
        reportName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send request using appropriate method
   * @param {string} xmlRequest - XML request
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Response
   */
  async sendRequest(xmlRequest, options = {}) {
    const { method = 'http', agentId } = options;

    switch (method) {
      case 'websocket':
        if (!agentId) {
          throw new Error('Agent ID required for WebSocket communication');
        }
        return this.sendWebSocketRequest(agentId, { xml: xmlRequest });
      
      case 'tcp':
        return this.sendTcpRequest(xmlRequest, options);
      
      case 'http':
      default:
        return this.sendHttpRequest(xmlRequest, options);
    }
  }

  /**
   * Handle heartbeat from desktop agent
   * @param {string} agentId - Agent ID
   */
  async handleHeartbeat(agentId) {
    try {
      const connection = await TallyConnection.findOne({ agentId });
      if (connection) {
        await connection.updateHeartbeat();
      }
    } catch (error) {
      this.logger.error('Error handling heartbeat', { agentId, error: error.message });
    }
  }

  /**
   * Handle Tally notification from desktop agent
   * @param {string} agentId - Agent ID
   * @param {Object} notification - Notification data
   */
  handleTallyNotification(agentId, notification) {
    this.logger.info('Received Tally notification', { agentId, notification });
    // TODO: Implement notification handling logic
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   * @param {string} agentId - Agent ID
   * @returns {Object} Connection status
   */
  getConnectionStatus(agentId) {
    const connection = this.connections.get(agentId);
    return {
      connected: !!connection && connection.readyState === WebSocket.OPEN,
      pendingRequests: connection?.pendingRequests?.size || 0
    };
  }

  /**
   * Close all connections
   */
  closeAllConnections() {
    for (const [agentId, connection] of this.connections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.close();
      }
    }
    this.connections.clear();
    this.logger.info('All connections closed');
  }
}

module.exports = new TallyCommunicationService();
