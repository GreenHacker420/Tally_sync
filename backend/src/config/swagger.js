import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinSync360 API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for FinSync360 - A complete ERP solution with Tally integration',
      contact: {
        name: 'FinSync360 Support',
        email: 'support@finsync360.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://finsync-backend-62084a54426d.herokuapp.com'
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'accountant', 'manager'],
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Company: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            name: {
              type: 'string',
              example: 'Acme Corporation'
            },
            tallyCompanyName: {
              type: 'string',
              example: 'ACME_CORP'
            },
            gstin: {
              type: 'string',
              example: '29ABCDE1234F1Z5'
            },
            address: {
              type: 'object'
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },
        Voucher: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            voucherNumber: {
              type: 'string',
              example: 'VCH-001'
            },
            voucherType: {
              type: 'string',
              example: 'Sales'
            },
            date: {
              type: 'string',
              format: 'date'
            },
            amount: {
              type: 'number',
              example: 10000
            },
            party: {
              type: 'string',
              example: 'Customer Name'
            },
            narration: {
              type: 'string',
              example: 'Sales invoice'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['debit', 'credit'],
              example: 'credit'
            },
            amount: {
              type: 'number',
              example: 5000
            },
            description: {
              type: 'string',
              example: 'Payment received'
            },
            category: {
              type: 'string',
              example: 'Sales'
            },
            date: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            amount: {
              type: 'number',
              example: 1000
            },
            currency: {
              type: 'string',
              example: 'INR'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              example: 'completed'
            },
            paymentMethod: {
              type: 'string',
              example: 'razorpay'
            },
            transactionId: {
              type: 'string',
              example: 'pay_123456789'
            }
          }
        },
        Inventory: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            itemName: {
              type: 'string',
              example: 'Product A'
            },
            stockQuantity: {
              type: 'number',
              example: 100
            },
            unit: {
              type: 'string',
              example: 'Pcs'
            },
            rate: {
              type: 'number',
              example: 500
            },
            value: {
              type: 'number',
              example: 50000
            }
          }
        },
        Budget: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            name: {
              type: 'string',
              example: 'Q1 2024 Budget'
            },
            category: {
              type: 'string',
              example: 'Marketing'
            },
            allocatedAmount: {
              type: 'number',
              example: 100000
            },
            spentAmount: {
              type: 'number',
              example: 45000
            },
            startDate: {
              type: 'string',
              format: 'date'
            },
            endDate: {
              type: 'string',
              format: 'date'
            }
          }
        },
        Report: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            reportType: {
              type: 'string',
              example: 'profit-loss'
            },
            period: {
              type: 'object'
            },
            data: {
              type: 'object'
            },
            generatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Companies',
        description: 'Company management endpoints'
      },
      {
        name: 'Vouchers',
        description: 'Voucher management endpoints'
      },
      {
        name: 'Transactions',
        description: 'Transaction management endpoints'
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      },
      {
        name: 'Inventory',
        description: 'Inventory management endpoints'
      },
      {
        name: 'Budgets',
        description: 'Budget management endpoints'
      },
      {
        name: 'GST',
        description: 'GST and tax related endpoints'
      },
      {
        name: 'Reports',
        description: 'Report generation endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      },
      {
        name: 'Tally',
        description: 'Tally integration endpoints'
      },
      {
        name: 'Health',
        description: 'System health check endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/routes/*.mjs',
    './src/server.js',
    './src/docs/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
