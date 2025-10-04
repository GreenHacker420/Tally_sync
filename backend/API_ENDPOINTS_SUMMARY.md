# FinSync360 API Endpoints Summary

**Generated:** 2025-10-04T06:44:03.074Z

## Overview

- **Total Endpoints:** 87
- **Public Endpoints:** 6
- **Protected Endpoints:** 81

## Swagger Documentation

Access the interactive API documentation at: `http://localhost:5000/api-docs`

## Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | 🌐 No | Register new user |
| POST | `/api/auth/login` | 🌐 No | Login user |
| GET | `/api/auth/me` | 🔒 Yes | Get current user |
| GET | `/api/auth/profile` | 🔒 Yes | Get user profile |
| PUT | `/api/auth/profile` | 🔒 Yes | Update user profile |
| POST | `/api/auth/logout` | 🔒 Yes | Logout user |
| POST | `/api/auth/forgot-password` | 🌐 No | Request password reset |
| PUT | `/api/auth/reset-password/:token` | 🌐 No | Reset password |

## Users

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/users` | 🔒 Yes | Get all users |
| POST | `/api/users` | 🔒 Yes | Create user |
| GET | `/api/users/:id` | 🔒 Yes | Get user by ID |
| PUT | `/api/users/:id` | 🔒 Yes | Update user |
| DELETE | `/api/users/:id` | 🔒 Yes | Delete user |

## Companies

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/companies` | 🔒 Yes | Get all companies |
| POST | `/api/companies` | 🔒 Yes | Create company |
| GET | `/api/companies/:id` | 🔒 Yes | Get company by ID |
| PUT | `/api/companies/:id` | 🔒 Yes | Update company |
| DELETE | `/api/companies/:id` | 🔒 Yes | Delete company |
| GET | `/api/companies/:id/users` | 🔒 Yes | Get company users |
| POST | `/api/companies/:id/users` | 🔒 Yes | Add user to company |

## Vouchers

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/vouchers` | 🔒 Yes | Get all vouchers |
| POST | `/api/vouchers` | 🔒 Yes | Create voucher |
| GET | `/api/vouchers/:id` | 🔒 Yes | Get voucher by ID |
| PUT | `/api/vouchers/:id` | 🔒 Yes | Update voucher |
| DELETE | `/api/vouchers/:id` | 🔒 Yes | Delete voucher |
| GET | `/api/vouchers/stats` | 🔒 Yes | Get voucher statistics |
| POST | `/api/vouchers/bulk` | 🔒 Yes | Bulk create vouchers |

## Transactions

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/transactions` | 🔒 Yes | Get all transactions |
| POST | `/api/transactions` | 🔒 Yes | Create transaction |
| GET | `/api/transactions/:id` | 🔒 Yes | Get transaction by ID |
| PUT | `/api/transactions/:id` | 🔒 Yes | Update transaction |
| DELETE | `/api/transactions/:id` | 🔒 Yes | Delete transaction |
| GET | `/api/transactions/stats` | 🔒 Yes | Get transaction statistics |

## Payments

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/payments` | 🔒 Yes | Get all payments |
| POST | `/api/payments` | 🔒 Yes | Create payment |
| GET | `/api/payments/:id` | 🔒 Yes | Get payment by ID |
| POST | `/api/payments/:id/verify` | 🔒 Yes | Verify payment |
| POST | `/api/payments/:id/refund` | 🔒 Yes | Refund payment |
| GET | `/api/payments/stats` | 🔒 Yes | Get payment statistics |

## Inventory

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/inventory` | 🔒 Yes | Get all inventory items |
| POST | `/api/inventory` | 🔒 Yes | Create inventory item |
| GET | `/api/inventory/:id` | 🔒 Yes | Get inventory item by ID |
| PUT | `/api/inventory/:id` | 🔒 Yes | Update inventory item |
| DELETE | `/api/inventory/:id` | 🔒 Yes | Delete inventory item |
| GET | `/api/inventory/stats` | 🔒 Yes | Get inventory statistics |
| POST | `/api/inventory/bulk` | 🔒 Yes | Bulk update inventory |

## Budgets

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/budgets` | 🔒 Yes | Get all budgets |
| POST | `/api/budgets` | 🔒 Yes | Create budget |
| GET | `/api/budgets/:id` | 🔒 Yes | Get budget by ID |
| PUT | `/api/budgets/:id` | 🔒 Yes | Update budget |
| DELETE | `/api/budgets/:id` | 🔒 Yes | Delete budget |
| GET | `/api/budgets/:id/analysis` | 🔒 Yes | Get budget analysis |

## GST

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/gst/returns` | 🔒 Yes | Get GST returns |
| GET | `/api/gst/gstr1` | 🔒 Yes | Get GSTR1 report |
| GET | `/api/gst/gstr3b` | 🔒 Yes | Get GSTR3B report |
| POST | `/api/gst/file-return` | 🔒 Yes | File GST return |
| GET | `/api/gst/summary` | 🔒 Yes | Get GST summary |

## Reports

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/reports/profit-loss` | 🔒 Yes | Get P&L report |
| GET | `/api/reports/balance-sheet` | 🔒 Yes | Get balance sheet |
| GET | `/api/reports/cash-flow` | 🔒 Yes | Get cash flow statement |
| GET | `/api/reports/trial-balance` | 🔒 Yes | Get trial balance |
| GET | `/api/reports/ledger` | 🔒 Yes | Get ledger report |
| GET | `/api/reports/daybook` | 🔒 Yes | Get daybook |
| POST | `/api/reports/custom` | 🔒 Yes | Generate custom report |

## Notifications

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/notifications` | 🔒 Yes | Get all notifications |
| GET | `/api/notifications/:id` | 🔒 Yes | Get notification by ID |
| PUT | `/api/notifications/:id/read` | 🔒 Yes | Mark as read |
| PUT | `/api/notifications/read-all` | 🔒 Yes | Mark all as read |
| DELETE | `/api/notifications/:id` | 🔒 Yes | Delete notification |

## Tally Integration

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/tally/status` | 🔒 Yes | Get Tally connection status |
| POST | `/api/tally/connect` | 🔒 Yes | Connect to Tally |
| POST | `/api/tally/disconnect` | 🔒 Yes | Disconnect from Tally |
| GET | `/api/tally/companies` | 🔒 Yes | Get Tally companies |
| POST | `/api/tally/sync` | 🔒 Yes | Sync with Tally |
| GET | `/api/tally/sync-status` | 🔒 Yes | Get sync status |
| POST | `/api/tally/import` | 🔒 Yes | Import from Tally |
| POST | `/api/tally/export` | 🔒 Yes | Export to Tally |

## Parties

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/parties` | 🔒 Yes | Get all parties |
| POST | `/api/parties` | 🔒 Yes | Create party |
| GET | `/api/parties/:id` | 🔒 Yes | Get party by ID |
| PUT | `/api/parties/:id` | 🔒 Yes | Update party |
| DELETE | `/api/parties/:id` | 🔒 Yes | Delete party |

## Email

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/emails/send` | 🔒 Yes | Send email |
| GET | `/api/emails/templates` | 🔒 Yes | Get email templates |
| POST | `/api/emails/invoice` | 🔒 Yes | Send invoice email |

## System

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | 🌐 No | Health check |
| GET | `/api-docs` | 🌐 No | API Documentation (Swagger) |

## Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per window

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error Handling

Error responses include:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```
