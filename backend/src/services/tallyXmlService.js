import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import xml2js from 'xml2js';
import xmlbuilder2 from 'xmlbuilder2';
import logger from '../utils/logger.js';
import winston from 'winston';

class TallyXmlService {
  constructor() {
    // XML Parser configuration
    this.parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseNodeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      alwaysCreateTextNode: false,
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Define which elements should always be arrays
        const arrayElements = [
          'VOUCHER', 'LEDGER', 'STOCKITEM', 'COMPANY', 'GROUP',
          'ALLINVENTORYENTRIES', 'ALLLEDGERENTRIES', 'INVENTORYENTRIES',
          'LEDGERENTRIES', 'CATEGORYENTRIES'
        ];
        return arrayElements.includes(name.toUpperCase());
      }
    };

    // XML Builder configuration
    this.builderOptions = {
      format: 'xml',
      wellFormed: true,
      prettyPrint: true,
      indent: '  ',
      newline: '\n',
      allowEmptyTags: false
    };

    this.parser = new XMLParser(this.parserOptions);
    this.builder = new XMLBuilder(this.builderOptions);
  }

  /**
   * Parse Tally XML response
   * @param {string} xmlString - XML string from Tally
   * @returns {Object} Parsed XML object
   */
  parseXml(xmlString) {
    try {
      if (!xmlString || typeof xmlString !== 'string') {
        throw new Error('Invalid XML string provided');
      }

      // Clean XML string
      const cleanXml = this.cleanXmlString(xmlString);
      
      // Parse XML
      const parsed = this.parser.parse(cleanXml);
      
      logger.debug('XML parsed successfully', { 
        originalLength: xmlString.length,
        cleanedLength: cleanXml.length 
      });
      
      return parsed;
    } catch (error) {
      logger.error('XML parsing failed', { 
        error: error.message,
        xmlPreview: xmlString.substring(0, 200) 
      });
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Build XML for Tally request
   * @param {Object} data - Data object to convert to XML
   * @param {string} rootElement - Root element name
   * @returns {string} XML string
   */
  buildXml(data, rootElement = 'ENVELOPE') {
    try {
      const xmlObject = {
        [rootElement]: data
      };

      const xml = this.builder.build(xmlObject);
      
      // Add XML declaration and Tally-specific formatting
      const formattedXml = this.formatForTally(xml);
      
      logger.debug('XML built successfully', { 
        rootElement,
        xmlLength: formattedXml.length 
      });
      
      return formattedXml;
    } catch (error) {
      logger.error('XML building failed', { 
        error: error.message,
        rootElement,
        dataKeys: Object.keys(data || {})
      });
      throw new Error(`XML building failed: ${error.message}`);
    }
  }

  /**
   * Create Tally request XML
   * @param {string} requestType - Type of request (Import/Export)
   * @param {Object} requestData - Request data
   * @returns {string} Formatted XML request
   */
  createTallyRequest(requestType, requestData) {
    const envelope = {
      HEADER: {
        TALLYREQUEST: requestType.toUpperCase()
      },
      BODY: requestData
    };

    return this.buildXml(envelope);
  }

  /**
   * Create voucher XML for Tally import
   * @param {Object} voucher - Voucher data from FinSync360
   * @returns {string} Tally-formatted voucher XML
   */
  createVoucherXml(voucher) {
    try {
      const tallyVoucher = this.mapVoucherToTally(voucher);
      
      const requestData = {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: 'Vouchers',
            STATICVARIABLES: {
              SVCURRENTCOMPANY: voucher.company.name || 'Default Company'
            }
          },
          REQUESTDATA: {
            TALLYMESSAGE: {
              '@_xmlns:UDF': 'TallyUDF',
              VOUCHER: tallyVoucher
            }
          }
        }
      };

      return this.createTallyRequest('Import', requestData);
    } catch (error) {
      logger.error('Voucher XML creation failed', { 
        error: error.message,
        voucherId: voucher._id 
      });
      throw error;
    }
  }

  /**
   * Create item/stock item XML for Tally import
   * @param {Object} item - Item data from FinSync360
   * @returns {string} Tally-formatted stock item XML
   */
  createStockItemXml(item) {
    try {
      const tallyStockItem = this.mapItemToTally(item);
      
      const requestData = {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: 'StockItems',
            STATICVARIABLES: {
              SVCURRENTCOMPANY: item.company.name || 'Default Company'
            }
          },
          REQUESTDATA: {
            TALLYMESSAGE: {
              '@_xmlns:UDF': 'TallyUDF',
              STOCKITEM: tallyStockItem
            }
          }
        }
      };

      return this.createTallyRequest('Import', requestData);
    } catch (error) {
      logger.error('Stock item XML creation failed', { 
        error: error.message,
        itemId: item._id 
      });
      throw error;
    }
  }

  /**
   * Create ledger XML for Tally import
   * @param {Object} party - Party data from FinSync360
   * @returns {string} Tally-formatted ledger XML
   */
  createLedgerXml(party) {
    try {
      const tallyLedger = this.mapPartyToTally(party);
      
      const requestData = {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: 'Ledgers',
            STATICVARIABLES: {
              SVCURRENTCOMPANY: party.company.name || 'Default Company'
            }
          },
          REQUESTDATA: {
            TALLYMESSAGE: {
              '@_xmlns:UDF': 'TallyUDF',
              LEDGER: tallyLedger
            }
          }
        }
      };

      return this.createTallyRequest('Import', requestData);
    } catch (error) {
      logger.error('Ledger XML creation failed', { 
        error: error.message,
        partyId: party._id 
      });
      throw error;
    }
  }

  /**
   * Create export request XML
   * @param {string} reportName - Tally report name
   * @param {Object} filters - Export filters
   * @returns {string} Export request XML
   */
  createExportRequest(reportName, filters = {}) {
    const requestData = {
      EXPORTDATA: {
        REQUESTDESC: {
          REPORTNAME: reportName,
          STATICVARIABLES: {
            SVCURRENTCOMPANY: filters.company || 'Default Company',
            SVFROMDATE: filters.fromDate || '1-Apr-2023',
            SVTODATE: filters.toDate || '31-Mar-2024'
          }
        }
      }
    };

    return this.createTallyRequest('Export', requestData);
  }

  /**
   * Map FinSync360 voucher to Tally format
   * @param {Object} voucher - FinSync360 voucher
   * @returns {Object} Tally voucher object
   */
  mapVoucherToTally(voucher) {
    return {
      '@_REMOTEID': voucher._id.toString(),
      '@_VCHKEY': voucher.tallySync?.tallyId || '',
      '@_VCHTYPE': this.mapVoucherType(voucher.type),
      DATE: this.formatTallyDate(voucher.date),
      VOUCHERTYPENAME: this.mapVoucherType(voucher.type),
      VOUCHERNUMBER: voucher.number,
      PARTYLEDGERNAME: voucher.party?.name || '',
      REFERENCE: voucher.reference || '',
      NARRATION: voucher.narration || '',
      ALLLEDGERENTRIES: {
        LEDGERENTRIES: voucher.entries?.map(entry => ({
          LEDGERNAME: entry.ledger?.name || '',
          ISDEEMEDPOSITIVE: entry.amount >= 0 ? 'Yes' : 'No',
          AMOUNT: Math.abs(entry.amount),
          BILLALLOCATIONS: entry.billAllocations?.map(bill => ({
            NAME: bill.name,
            BILLTYPE: bill.type,
            AMOUNT: bill.amount
          })) || []
        })) || []
      }
    };
  }

  /**
   * Map FinSync360 item to Tally stock item format
   * @param {Object} item - FinSync360 item
   * @returns {Object} Tally stock item object
   */
  mapItemToTally(item) {
    return {
      '@_REMOTEID': item._id.toString(),
      '@_KEY': item.tallySync?.tallyId || '',
      NAME: item.name,
      ALIAS: item.displayName || '',
      PARENT: item.category?.name || 'Primary',
      CATEGORY: item.category?.name || '',
      TAXCLASSIFICATIONNAME: item.taxation?.hsnCode || '',
      DESCRIPTION: item.description || '',
      BASEUNITS: item.units?.base || 'Nos',
      ADDITIONALUNITS: item.units?.additional || '',
      GSTAPPLICABLE: item.taxation?.taxable ? 'Applicable' : 'Not Applicable',
      GSTTYPEOFSUPPLY: 'Goods',
      COSTINGMETHOD: 'Avg. Cost',
      VALUATIONMETHOD: 'Avg. Price',
      RATEOFVAT: item.taxation?.gstRate?.igst || 0,
      OPENINGBALANCE: item.inventory?.openingStock || 0,
      OPENINGVALUE: item.inventory?.openingValue || 0,
      OPENINGRATE: item.pricing?.costPrice || 0
    };
  }

  /**
   * Map FinSync360 party to Tally ledger format
   * @param {Object} party - FinSync360 party
   * @returns {Object} Tally ledger object
   */
  mapPartyToTally(party) {
    const parentGroup = party.type === 'customer' ? 'Sundry Debtors' : 'Sundry Creditors';
    
    return {
      '@_REMOTEID': party._id.toString(),
      '@_KEY': party.tallySync?.tallyId || '',
      NAME: party.name,
      ALIAS: party.displayName || '',
      PARENT: parentGroup,
      GSTREGISTRATIONTYPE: party.gstin ? 'Regular' : 'Unregistered',
      PARTYGSTIN: party.gstin || '',
      LEDGERPHONE: party.contact?.phone || '',
      LEDGEREMAIL: party.contact?.email || '',
      OPENINGBALANCE: party.balances?.opening?.amount || 0,
      CREDITLIMIT: party.creditLimit?.amount || 0,
      BILLWISESTATUS: 'Yes',
      COSTCENTREON: 'No',
      INTERESTON: 'No',
      ALLOWINMOBILE: 'No',
      ISBILLWISEON: 'Yes',
      ISCOSTCENTREON: 'No'
    };
  }

  /**
   * Map voucher type from FinSync360 to Tally
   * @param {string} type - FinSync360 voucher type
   * @returns {string} Tally voucher type
   */
  mapVoucherType(type) {
    const typeMapping = {
      'sales': 'Sales',
      'purchase': 'Purchase',
      'payment': 'Payment',
      'receipt': 'Receipt',
      'journal': 'Journal',
      'contra': 'Contra',
      'debit_note': 'Debit Note',
      'credit_note': 'Credit Note'
    };
    
    return typeMapping[type] || 'Journal';
  }

  /**
   * Format date for Tally
   * @param {Date} date - JavaScript Date object
   * @returns {string} Tally formatted date
   */
  formatTallyDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  /**
   * Clean XML string for parsing
   * @param {string} xmlString - Raw XML string
   * @returns {string} Cleaned XML string
   */
  cleanXmlString(xmlString) {
    return xmlString
      .replace(/^\uFEFF/, '') // Remove BOM
      .replace(/&(?![a-zA-Z0-9#]{1,6};)/g, '&amp;') // Escape unescaped ampersands
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  /**
   * Format XML for Tally compatibility
   * @param {string} xml - Generated XML
   * @returns {string} Tally-compatible XML
   */
  formatForTally(xml) {
    // Add XML declaration if not present
    if (!xml.startsWith('<?xml')) {
      xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
    }
    
    return xml;
  }

  /**
   * Validate Tally XML response
   * @param {Object} parsedXml - Parsed XML object
   * @returns {Object} Validation result
   */
  validateTallyResponse(parsedXml) {
    const result = {
      isValid: false,
      hasError: false,
      errorMessage: '',
      data: null
    };

    try {
      if (!parsedXml || typeof parsedXml !== 'object') {
        result.errorMessage = 'Invalid XML structure';
        return result;
      }

      // Check for Tally error response
      if (parsedXml.ERROR || parsedXml.LINEERROR) {
        result.hasError = true;
        result.errorMessage = parsedXml.ERROR || parsedXml.LINEERROR;
        return result;
      }

      // Check for successful response structure
      if (parsedXml.ENVELOPE || parsedXml.RESPONSE) {
        result.isValid = true;
        result.data = parsedXml.ENVELOPE || parsedXml.RESPONSE;
      }

      return result;
    } catch (error) {
      result.errorMessage = `Validation error: ${error.message}`;
      return result;
    }
  }
}

export default new TallyXmlService();
