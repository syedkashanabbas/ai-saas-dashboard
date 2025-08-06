const express = require('express');
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateNotification, validateNotificationId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user's notifications
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const isRead = req.query.isRead;
    const type = req.query.type;

    let whereClause = 'WHERE user_id = ?';
    let queryParams = [req.user.id];

    // Apply read status filter
    if (isRead !== undefined) {
      whereClause += ' AND is_read = ?';
      queryParams.push(isRead === 'true');
    }

    // Apply type filter
    if (type) {
      whereClause += ' AND type = ?';
      queryParams.push(type);
    }

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get notifications with pagination
    const [notifications] = await db.execute(
      `SELECT n.*, 
              u.first_name as created_by_first_name, 
              u.last_name as created_by_last_name
       FROM notifications n 
       LEFT JOIN users u ON n.created_by = u.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get unread count
    const [unreadResult] = await db.execute(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      notifications,
      unreadCount: unreadResult[0].unread_count,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

// Get notification by ID
router.get('/:id', authenticateToken, validateNotificationId, async (req, res) => {
  try {
    const notificationId = req.params.id;

    const [notifications] = await db.execute(
      `SELECT n.*, 
              u.first_name as created_by_first_name, 
              u.last_name as created_by_last_name
       FROM notifications n 
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.id = ? AND n.user_id = ?`,
      [notificationId, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification: notifications[0] });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: 'Failed to get notification' });
  }
});

// Create notification (Admin/Super Admin only)
router.post('/', authenticateToken, requirePermission('notifications', 'create'), validateNotification, async (req, res) => {
  try {
    const { title, message, type, userId, tenantId, actionUrl } = req.body;

    // If userId is provided, create for specific user
    if (userId) {
      // Validate user exists and user has access
      let userWhereClause = 'WHERE id = ?';
      let userQueryParams = [userId];

      if (req.user.role_name !== 'Super Admin') {
        userWhereClause += ' AND tenant_id = ?';
        userQueryParams.push(req.user.tenant_id);
      }

      const [users] = await db.execute(
        `SELECT id, tenant_id FROM users ${userWhereClause}`,
        userQueryParams
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found or access denied' });
      }

      // Create notification for specific user
      const [result] = await db.execute(
        `INSERT INTO notifications (user_id, tenant_id, title, message, type, action_url, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, users[0].tenant_id, title, message, type || 'info', actionUrl || null, req.user.id]
      );

      const [newNotifications] = await db.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        message: 'Notification created successfully',
        notification: newNotifications[0]
      });
    }

    // If tenantId is provided, create for all users in tenant
    if (tenantId) {
      // Validate tenant exists and user has access
      if (req.user.role_name !== 'Super Admin' && req.user.tenant_id !== parseInt(tenantId)) {
        return res.status(403).json({ message: 'Access denied to this tenant' });
      }

      const [tenants] = await db.execute(
        'SELECT id FROM tenants WHERE id = ?',
        [tenantId]
      );

      if (tenants.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get all users in tenant
      const [tenantUsers] = await db.execute(
        'SELECT id FROM users WHERE tenant_id = ? AND status = "active"',
        [tenantId]
      );

      // Create notifications for all users in tenant
      const notifications = [];
      for (const user of tenantUsers) {
        const [result] = await db.execute(
          `INSERT INTO notifications (user_id, tenant_id, title, message, type, action_url, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, tenantId, title, message, type || 'info', actionUrl || null, req.user.id]
        );
        notifications.push(result.insertId);
      }

      return res.status(201).json({
        message: `Notifications created successfully for ${notifications.length} users`,
        notificationIds: notifications
      });
    }

    // If neither userId nor tenantId provided, create for current user's tenant (if not Super Admin)
    if (req.user.role_name !== 'Super Admin' && req.user.tenant_id) {
      const [tenantUsers] = await db.execute(
        'SELECT id FROM users WHERE tenant_id = ? AND status = "active"',
        [req.user.tenant_id]
      );

      const notifications = [];
      for (const user of tenantUsers) {
        const [result] = await db.execute(
          `INSERT INTO notifications (user_id, tenant_id, title, message, type, action_url, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, req.user.tenant_id, title, message, type || 'info', actionUrl || null, req.user.id]
        );
        notifications.push(result.insertId);
      }

      return res.status(201).json({
        message: `Notifications created successfully for ${notifications.length} users`,
        notificationIds: notifications
      });
    }

    return res.status(400).json({ message: 'userId or tenantId is required' });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, validateNotificationId, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Check if notification exists and belongs to user
    const [notifications] = await db.execute(
      'SELECT id, is_read FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notifications[0].is_read) {
      return res.status(400).json({ message: 'Notification already marked as read' });
    }

    // Mark as read
    await db.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark notification as unread
router.patch('/:id/unread', authenticateToken, validateNotificationId, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Check if notification exists and belongs to user
    const [notifications] = await db.execute(
      'SELECT id, is_read FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notifications[0].is_read) {
      return res.status(400).json({ message: 'Notification already marked as unread' });
    }

    // Mark as unread
    await db.execute(
      'UPDATE notifications SET is_read = FALSE, read_at = NULL WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as unread' });
  } catch (error) {
    console.error('Mark notification as unread error:', error);
    res.status(500).json({ message: 'Failed to mark notification as unread' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, validateNotificationId, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Check if notification exists and belongs to user or user has permission
    let whereClause = 'WHERE id = ? AND (user_id = ?';
    let queryParams = [notificationId, req.user.id];

    // Allow deletion if user has notification delete permission
    if (req.user.permissions.notifications && req.user.permissions.notifications.includes('delete')) {
      whereClause += ' OR created_by = ?';
      queryParams.push(req.user.id);
    }

    whereClause += ')';

    const [notifications] = await db.execute(
      `SELECT id FROM notifications ${whereClause}`,
      queryParams
    );

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found or access denied' });
    }

    // Delete notification
    await db.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get notification statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [req.user.id];

    // If user has permission to view all notifications, show tenant stats
    if (req.user.permissions.notifications && req.user.permissions.notifications.includes('read') && req.user.tenant_id) {
      whereClause = 'WHERE tenant_id = ?';
      queryParams = [req.user.tenant_id];
    }

    // Get notification counts by type
    const [typeCounts] = await db.execute(
      `SELECT type, COUNT(*) as count FROM notifications ${whereClause} GROUP BY type`,
      queryParams
    );

    // Get read/unread counts
    const [readCounts] = await db.execute(
      `SELECT is_read, COUNT(*) as count FROM notifications ${whereClause} GROUP BY is_read`,
      queryParams
    );

    // Get recent notifications (last 7 days)
    const [recentNotifications] = await db.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM notifications 
       ${whereClause} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      queryParams
    );

    res.json({
      typeCounts,
      readCounts,
      recentNotifications
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ message: 'Failed to get notification statistics' });
  }
});

module.exports = router;

