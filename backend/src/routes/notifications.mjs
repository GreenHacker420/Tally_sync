import express from 'express';
import { protect, checkCompanyAccess } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.mjs';

const router = express.Router();

router.use(protect);

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', getUnreadCount);

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', markAllAsRead);

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', getNotifications);

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
router.post('/', checkCompanyAccess, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['payment_reminder', 'budget_alert', 'gst_filing_due', 'low_stock', 'voucher_approval', 'system', 'info', 'warning', 'error']).withMessage('Invalid notification type')
], createNotification);

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id', getNotification);

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', markAsRead);

// @desc    Archive notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
router.put('/:id/archive', archiveNotification);

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', deleteNotification);

export default router;

