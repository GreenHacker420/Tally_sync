const net = require('net');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const EventEmitter = require('events');
const electronLog = require('electron-log');

class TallyService extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.client = null;
    this.config = {
      host: 'localhost',
      port: 9000,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 5000
    };
    
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true
    });
    
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      indentBy: '  '
    });
    
    this.logger = electronLog.scope('TallyService');
  }

  async initialize() {
    this.logger.info('Initializing Tally Service...');
    
    try {
      // Load configuration
      await this.loadConfig();
      
      // Test initial connection
      await this.testConnection();
      
      this.logger.info('Tally Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Tally Service:', error);
      throw error;
    }
  }

  async loadConfig() {
    // Load configuration from store or use defaults
    const Store = require('electron-store');
    const store = new Store();
    
    const savedConfig = store.get('tallyConfig', {});
    this.config = { ...this.config, ...savedConfig };
    
    this.logger.info('Tally configuration loaded:', {
      host: this.config.host,
      port: this.config.port
    });
  }

  async saveConfig(newConfig) {
    const Store = require('electron-store');
    const store = new Store();
    
    this.config = { ...this.config, ...newConfig };
    store.set('tallyConfig', this.config);
    
    this.logger.info('Tally configuration saved');
  }

  async testConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (client) {
          client.destroy();
        }
        reject(new Error('Connection timeout'));
      }, this.config.timeout);

      const client = new net.Socket();
      
      client.connect(this.config.port, this.config.host, () => {
        clearTimeout(timeout);
        this.logger.info('Tally connection test successful');
        
        // Send a simple request to verify Tally is responding
        const testRequest = this.buildXmlRequest('EXPORT', 'Collection', {
          'FETCH': 'List of Companies'
        });
        
        client.write(testRequest);
      });

      client.on('data', (data) => {
        clearTimeout(timeout);
        client.destroy();
        
        try {
          const response = this.parseXmlResponse(data.toString());
          if (response && response.ENVELOPE) {
            this.isConnected = true;
            this.emit('connectionStatusChanged', true);
            resolve(true);
          } else {
            reject(new Error('Invalid response from Tally'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Tally response'));
        }
      });

      client.on('error', (error) => {
        clearTimeout(timeout);
        this.isConnected = false;
        this.emit('connectionStatusChanged', false);
        this.logger.error('Tally connection error:', error);
        reject(error);
      });

      client.on('close', () => {
        clearTimeout(timeout);
        this.isConnected = false;
        this.emit('connectionStatusChanged', false);
      });
    });
  }

  async connect() {
    if (this.isConnected && this.client) {
      return true;
    }

    return new Promise((resolve, reject) => {
      this.client = new net.Socket();
      
      const timeout = setTimeout(() => {
        if (this.client) {
          this.client.destroy();
        }
        reject(new Error('Connection timeout'));
      }, this.config.timeout);

      this.client.connect(this.config.port, this.config.host, () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.emit('connectionStatusChanged', true);
        this.logger.info('Connected to Tally');
        resolve(true);
      });

      this.client.on('error', (error) => {
        clearTimeout(timeout);
        this.isConnected = false;
        this.emit('connectionStatusChanged', false);
        this.logger.error('Tally connection error:', error);
        reject(error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.emit('connectionStatusChanged', false);
        this.logger.info('Disconnected from Tally');
      });
    });
  }

  async disconnect() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.isConnected = false;
    this.emit('connectionStatusChanged', false);
    this.logger.info('Disconnected from Tally');
  }

  async sendRequest(requestType, collection, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const xmlRequest = this.buildXmlRequest(requestType, collection, options);
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, this.config.timeout);

      let responseData = '';

      const onData = (data) => {
        responseData += data.toString();
        
        // Check if we have a complete XML response
        if (responseData.includes('</ENVELOPE>')) {
          clearTimeout(timeout);
          this.client.removeListener('data', onData);
          
          try {
            const response = this.parseXmlResponse(responseData);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        }
      };

      this.client.on('data', onData);
      
      this.client.on('error', (error) => {
        clearTimeout(timeout);
        this.client.removeListener('data', onData);
        reject(error);
      });

      this.client.write(xmlRequest);
    });
  }

  async getCompanies() {
    try {
      const response = await this.sendRequest('EXPORT', 'Collection', {
        'FETCH': 'List of Companies'
      });

      if (response && response.ENVELOPE && response.ENVELOPE.BODY) {
        const companies = this.extractCompaniesFromResponse(response);
        this.logger.info(`Retrieved ${companies.length} companies from Tally`);
        return companies;
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get companies from Tally:', error);
      throw error;
    }
  }

  async getVouchers(companyName, fromDate, toDate) {
    try {
      const response = await this.sendRequest('EXPORT', 'Collection', {
        'FETCH': 'All Vouchers',
        'COMPANY': companyName,
        'FROMDATE': fromDate,
        'TODATE': toDate
      });

      if (response && response.ENVELOPE && response.ENVELOPE.BODY) {
        const vouchers = this.extractVouchersFromResponse(response);
        this.logger.info(`Retrieved ${vouchers.length} vouchers from Tally`);
        return vouchers;
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get vouchers from Tally:', error);
      throw error;
    }
  }

  async getStockItems(companyName) {
    try {
      const response = await this.sendRequest('EXPORT', 'Collection', {
        'FETCH': 'All Stock Items',
        'COMPANY': companyName
      });

      if (response && response.ENVELOPE && response.ENVELOPE.BODY) {
        const items = this.extractStockItemsFromResponse(response);
        this.logger.info(`Retrieved ${items.length} stock items from Tally`);
        return items;
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get stock items from Tally:', error);
      throw error;
    }
  }

  buildXmlRequest(requestType, collection, options = {}) {
    const envelope = {
      ENVELOPE: {
        HEADER: {
          TALLYREQUEST: requestType
        },
        BODY: {
          EXPORTDATA: {
            REQUESTDESC: {
              REPORTNAME: collection,
              ...options
            }
          }
        }
      }
    };

    return this.xmlBuilder.build(envelope);
  }

  parseXmlResponse(xmlString) {
    try {
      return this.xmlParser.parse(xmlString);
    } catch (error) {
      this.logger.error('Failed to parse XML response:', error);
      throw new Error('Invalid XML response from Tally');
    }
  }

  extractCompaniesFromResponse(response) {
    const companies = [];
    
    try {
      const collection = response.ENVELOPE.BODY.EXPORTDATA?.REQUESTDATA?.TALLYMESSAGE?.COMPANY;
      
      if (Array.isArray(collection)) {
        collection.forEach(company => {
          if (company['@_NAME']) {
            companies.push({
              name: company['@_NAME'],
              guid: company['@_GUID'] || null,
              alterid: company['@_ALTERID'] || null
            });
          }
        });
      } else if (collection && collection['@_NAME']) {
        companies.push({
          name: collection['@_NAME'],
          guid: collection['@_GUID'] || null,
          alterid: collection['@_ALTERID'] || null
        });
      }
    } catch (error) {
      this.logger.error('Failed to extract companies from response:', error);
    }
    
    return companies;
  }

  extractVouchersFromResponse(response) {
    const vouchers = [];
    
    try {
      const collection = response.ENVELOPE.BODY.EXPORTDATA?.REQUESTDATA?.TALLYMESSAGE?.VOUCHER;
      
      if (Array.isArray(collection)) {
        collection.forEach(voucher => {
          vouchers.push(this.parseVoucherData(voucher));
        });
      } else if (collection) {
        vouchers.push(this.parseVoucherData(collection));
      }
    } catch (error) {
      this.logger.error('Failed to extract vouchers from response:', error);
    }
    
    return vouchers;
  }

  extractStockItemsFromResponse(response) {
    const items = [];
    
    try {
      const collection = response.ENVELOPE.BODY.EXPORTDATA?.REQUESTDATA?.TALLYMESSAGE?.STOCKITEM;
      
      if (Array.isArray(collection)) {
        collection.forEach(item => {
          items.push(this.parseStockItemData(item));
        });
      } else if (collection) {
        items.push(this.parseStockItemData(collection));
      }
    } catch (error) {
      this.logger.error('Failed to extract stock items from response:', error);
    }
    
    return items;
  }

  parseVoucherData(voucher) {
    return {
      voucherNumber: voucher['@_VOUCHERNUMBER'] || '',
      voucherType: voucher['@_VOUCHERTYPE'] || '',
      date: voucher['@_DATE'] || '',
      amount: voucher['@_AMOUNT'] || 0,
      reference: voucher['@_REFERENCE'] || '',
      narration: voucher.NARRATION || '',
      guid: voucher['@_GUID'] || null,
      alterid: voucher['@_ALTERID'] || null
    };
  }

  parseStockItemData(item) {
    return {
      name: item['@_NAME'] || '',
      alias: item['@_ALIAS'] || '',
      parent: item['@_PARENT'] || '',
      category: item['@_CATEGORY'] || '',
      baseUnits: item['@_BASEUNITS'] || '',
      openingBalance: item['@_OPENINGBALANCE'] || 0,
      openingValue: item['@_OPENINGVALUE'] || 0,
      guid: item['@_GUID'] || null,
      alterid: item['@_ALTERID'] || null
    };
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      host: this.config.host,
      port: this.config.port,
      lastConnectionTest: new Date().toISOString()
    };
  }
}

module.exports = TallyService;
