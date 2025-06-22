# API Integration Documentation

## Overview

This document provides comprehensive information about the API integration in the FinSync360 mobile application. The app integrates with a backend API to provide real-time financial data synchronization with Tally ERP.

## Architecture

### Service Layer

The application uses a service-oriented architecture with the following key services:

- **ApiClient**: Core HTTP client with retry logic, error handling, and request cancellation
- **AuthService**: Authentication and authorization management
- **SyncService**: Data synchronization between local and remote databases
- **DatabaseService**: Local SQLite database operations
- **WebSocketService**: Real-time communication
- **OfflineManager**: Offline functionality and queue management

### Data Flow

```
Mobile App ↔ API Client ↔ Backend API ↔ Tally ERP
     ↓
Local Database (SQLite)
```

## API Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

#### POST /auth/register
Register a new user.

#### POST /auth/refresh
Refresh authentication token.

#### POST /auth/logout
Logout current user.

### Companies

#### GET /companies
Retrieve all companies.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `isActive`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "company_id",
      "name": "Company Name",
      "email": "company@example.com",
      "phone": "1234567890",
      "address": "Company Address",
      "gstNumber": "GST123456789",
      "panNumber": "ABCDE1234F",
      "isActive": true,
      "settings": {},
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### GET /companies/:id
Retrieve a specific company.

#### POST /companies
Create a new company.

#### PUT /companies/:id
Update a company.

#### DELETE /companies/:id
Delete a company.

### Vouchers

#### GET /vouchers
Retrieve vouchers with filtering and pagination.

**Query Parameters:**
- `companyId`: Filter by company
- `voucherType`: Filter by voucher type
- `fromDate`: Start date filter
- `toDate`: End date filter
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

#### GET /vouchers/:id
Retrieve a specific voucher.

#### POST /vouchers
Create a new voucher.

#### PUT /vouchers/:id
Update a voucher.

#### DELETE /vouchers/:id
Delete a voucher.

### Inventory

#### GET /inventory/items
Retrieve inventory items.

#### GET /inventory/items/:id
Retrieve a specific inventory item.

#### POST /inventory/items
Create a new inventory item.

#### PUT /inventory/items/:id
Update an inventory item.

#### DELETE /inventory/items/:id
Delete an inventory item.

#### GET /inventory/stock-levels
Get current stock levels.

#### POST /inventory/stock-adjustment
Adjust stock levels.

### Payments

#### GET /payments
Retrieve payments.

#### GET /payments/:id
Retrieve a specific payment.

#### POST /payments
Create a new payment.

#### PUT /payments/:id
Update a payment.

#### DELETE /payments/:id
Delete a payment.

### Reports

#### GET /reports/dashboard
Get dashboard data.

#### GET /reports/financial
Get financial reports.

#### GET /reports/inventory
Get inventory reports.

#### GET /reports/sales
Get sales reports.

### Sync

#### GET /sync/status
Get synchronization status.

#### POST /sync/start
Start synchronization process.

#### POST /sync/stop
Stop synchronization process.

#### GET /sync/history
Get synchronization history.

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Validation Error
- **429**: Too Many Requests
- **500**: Internal Server Error
- **502**: Bad Gateway
- **503**: Service Unavailable

### Error Handling in the App

The app handles errors at multiple levels:

1. **Network Level**: Automatic retry for network failures
2. **API Level**: Structured error responses with user-friendly messages
3. **Application Level**: Error boundaries and fallback UI
4. **User Level**: Toast notifications and error displays

## Authentication

### JWT Token Management

- Tokens are stored securely using `react-native-encrypted-storage`
- Automatic token refresh when expired
- Logout on refresh failure
- Biometric authentication support

### Request Authentication

All authenticated requests include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Offline Support

### Data Caching

- Critical data is cached locally in SQLite
- Cache expiration based on data type
- Automatic cache invalidation on updates

### Offline Operations

- Actions are queued when offline
- Automatic sync when connection restored
- Conflict resolution for concurrent edits

### Sync Strategy

1. **Download**: Fetch latest data from server
2. **Upload**: Send pending local changes
3. **Resolve**: Handle any conflicts
4. **Verify**: Ensure data consistency

## Real-time Features

### WebSocket Connection

- Automatic connection management
- Heartbeat for connection health
- Automatic reconnection on failure

### Real-time Events

- Data updates
- Sync progress
- Notifications
- User activity
- System alerts

## Performance Optimization

### Request Optimization

- Request batching for bulk operations
- Pagination for large datasets
- Compression for large payloads
- Request cancellation for navigation

### Caching Strategy

- Memory cache for frequently accessed data
- Disk cache for offline access
- Cache invalidation on updates
- Background cache refresh

### Database Optimization

- Indexed queries for performance
- Connection pooling
- Batch operations for bulk inserts
- Regular database maintenance

## Security

### Data Protection

- HTTPS for all API communication
- JWT token encryption
- Sensitive data encryption at rest
- Biometric authentication

### API Security

- Rate limiting
- Request validation
- SQL injection prevention
- XSS protection

## Testing

### Unit Tests

- Service layer testing
- Redux slice testing
- Utility function testing
- Component testing

### Integration Tests

- API integration testing
- Database operation testing
- Sync flow testing
- Error handling testing

### End-to-End Tests

- Complete user workflows
- Offline/online scenarios
- Error recovery testing
- Performance testing

## Deployment

### Environment Configuration

- Development: Local API server
- Staging: Staging API server
- Production: Production API server

### Build Configuration

- API endpoints configured via environment variables
- Feature flags for gradual rollout
- Crash reporting integration
- Analytics integration

## Monitoring

### Error Tracking

- Crash reporting with stack traces
- API error monitoring
- Performance metrics
- User behavior analytics

### Health Checks

- API endpoint health monitoring
- Database connection monitoring
- Sync status monitoring
- Real-time connection monitoring

## Troubleshooting

### Common Issues

#### Connection Errors
- Check network connectivity
- Verify API endpoint URLs
- Check authentication tokens
- Review firewall settings

#### Sync Issues
- Check sync status in app
- Review sync history for errors
- Verify data permissions
- Check for conflicts

#### Performance Issues
- Monitor API response times
- Check database query performance
- Review memory usage
- Optimize cache settings

#### Authentication Issues
- Verify token validity
- Check user permissions
- Review biometric settings
- Clear app data if needed

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// In development
__DEV__ && console.log('Debug info');

// Enable network logging
import { NetworkLogger } from 'react-native-network-logger';
NetworkLogger.enableXHRInterception();
```

### Support

For technical support:
- Check the troubleshooting guide
- Review error logs
- Contact development team
- Submit bug reports with logs
