const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requirePermission, requireTenantAccess } = require('../middleware/auth');
const { validateUserUpdate, validateUserId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all users (with pagination and filtering)
router.get('/', authenticateToken, requirePermission('users', 'read'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const roleId = req.query.roleId;
    const tenantId = req.query.tenantId;
    const status = req.query.status;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    // Apply tenant filtering for non-Super Admin users
    if (req.user.role_name !== 'Super Admin') {
      whereClause += ' AND u.tenant_id = ?';
      queryParams.push(req.user.tenant_id);
    }

    // Apply search filter
    if (search) {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Apply role filter
    if (roleId) {
      whereClause += ' AND u.role_id = ?';
      queryParams.push(roleId);
    }

    // Apply tenant filter (for Super Admin)
    if (tenantId && req.user.role_name === 'Super Admin') {
      whereClause += ' AND u.tenant_id = ?';
      queryParams.push(tenantId);
    }

    // Apply status filter
    if (status) {
      whereClause += ' AND u.status = ?';
      queryParams.push(status);
    }

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get users with pagination
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, 
              u.email_verified, u.last_login, u.created_at, u.updated_at,
              r.name as role_name, t.name as tenant_name, t.slug as tenant_slug
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, requirePermission('users', 'read'), validateUserId, async (req, res) => {
  try {
    const userId = req.params.id;

    let whereClause = 'WHERE u.id = ?';
    let queryParams = [userId];

    // Apply tenant filtering for non-Super Admin users
    if (req.user.role_name !== 'Super Admin') {
      whereClause += ' AND u.tenant_id = ?';
      queryParams.push(req.user.tenant_id);
    }

    const [users] = await db.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
              u.status, u.email_verified, u.last_login, u.created_at, u.updated_at,
              r.id as role_id, r.name as role_name, r.permissions,
              t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       ${whereClause}`,
      queryParams
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    user.permissions = user.permissions ? JSON.parse(user.permissions) : {};

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update user
router.put('/:id', authenticateToken, requirePermission('users', 'update'), validateUserId, validateUserUpdate, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, phone, roleId, status, avatarUrl } = req.body;

    // Check if user exists and user has access
    let whereClause = 'WHERE id = ?';
    let queryParams = [userId];

    if (req.user.role_name !== 'Super Admin') {
      whereClause += ' AND tenant_id = ?';
      queryParams.push(req.user.tenant_id);
    }

    const [existingUsers] = await db.execute(
      `SELECT id, role_id FROM users ${whereClause}`,
      queryParams
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role if provided
    if (roleId) {
      const [roles] = await db.execute(
        'SELECT id FROM roles WHERE id = ?',
        [roleId]
      );

      if (roles.length === 0) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }
    }

    // Build update query
    let updateFields = [];
    let updateParams = [];

    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateParams.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateParams.push(lastName);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateParams.push(phone);
    }
    if (roleId !== undefined) {
      updateFields.push('role_id = ?');
      updateParams.push(roleId);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    if (avatarUrl !== undefined) {
      updateFields.push('avatar_url = ?');
      updateParams.push(avatarUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(userId);

    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // Get updated user
    const [updatedUsers] = await db.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
              u.status, u.email_verified, u.last_login, u.created_at, u.updated_at,
              r.name as role_name, t.name as tenant_name, t.slug as tenant_slug
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, requirePermission('users', 'delete'), validateUserId, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user exists and user has access
    let whereClause = 'WHERE id = ?';
    let queryParams = [userId];

    if (req.user.role_name !== 'Super Admin') {
      whereClause += ' AND tenant_id = ?';
      queryParams.push(req.user.tenant_id);
    }

    const [existingUsers] = await db.execute(
      `SELECT id FROM users ${whereClause}`,
      queryParams
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get user statistics
router.get('/stats/overview', authenticateToken, requirePermission('users', 'read'), async (req, res) => {
  try {
    let whereClause = '';
    let queryParams = [];

    // Apply tenant filtering for non-Super Admin users
    if (req.user.role_name !== 'Super Admin') {
      whereClause = 'WHERE tenant_id = ?';
      queryParams.push(req.user.tenant_id);
    }

    // Get user counts by status
    const [statusCounts] = await db.execute(
      `SELECT status, COUNT(*) as count FROM users ${whereClause} GROUP BY status`,
      queryParams
    );

    // Get user counts by role
    const [roleCounts] = await db.execute(
      `SELECT r.name as role_name, COUNT(u.id) as count 
       FROM roles r 
       LEFT JOIN users u ON r.id = u.role_id ${whereClause ? 'AND u.tenant_id = ?' : ''}
       GROUP BY r.id, r.name`,
      queryParams
    );

    // Get recent registrations (last 30 days)
    const [recentRegistrations] = await db.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM users 
       ${whereClause} ${whereClause ? 'AND' : 'WHERE'} created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      queryParams
    );

    res.json({
      statusCounts,
      roleCounts,
      recentRegistrations
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to get user statistics' });
  }
});

module.exports = router;

