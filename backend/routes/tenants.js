const express = require('express');
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateTenant, validateTenantId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all tenants (Super Admin only)
router.get('/', authenticateToken, requirePermission('tenants', 'read'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const subscriptionPlan = req.query.subscriptionPlan;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    // Apply search filter
    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR slug LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Apply status filter
    if (status) {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    // Apply subscription plan filter
    if (subscriptionPlan) {
      whereClause += ' AND subscription_plan = ?';
      queryParams.push(subscriptionPlan);
    }

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM tenants ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get tenants with pagination
    const [tenants] = await db.execute(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count
       FROM tenants t 
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Failed to get tenants' });
  }
});

// Get tenant by ID
router.get('/:id', authenticateToken, requirePermission('tenants', 'read'), validateTenantId, async (req, res) => {
  try {
    const tenantId = req.params.id;

    const [tenants] = await db.execute(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
              (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND status = 'active') as active_user_count
       FROM tenants t 
       WHERE t.id = ?`,
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Get tenant users
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.last_login,
              r.name as role_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.tenant_id = ?
       ORDER BY u.created_at DESC`,
      [tenantId]
    );

    res.json({
      tenant: {
        ...tenants[0],
        users
      }
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Failed to get tenant' });
  }
});

// Create tenant (Super Admin only)
router.post('/', authenticateToken, requirePermission('tenants', 'create'), validateTenant, async (req, res) => {
  try {
    const { name, slug, email, phone, address, subscriptionPlan } = req.body;

    // Check if slug or email already exists
    const [existingTenants] = await db.execute(
      'SELECT id FROM tenants WHERE slug = ? OR email = ?',
      [slug, email]
    );

    if (existingTenants.length > 0) {
      return res.status(400).json({ message: 'Slug or email already exists' });
    }

    // Create tenant
    const [result] = await db.execute(
      `INSERT INTO tenants (name, slug, email, phone, address, subscription_plan) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, email, phone || null, address || null, subscriptionPlan || 'free']
    );

    // Get created tenant
    const [newTenants] = await db.execute(
      'SELECT * FROM tenants WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: newTenants[0]
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

// Update tenant
router.put('/:id', authenticateToken, requirePermission('tenants', 'update'), validateTenantId, validateTenant, async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { name, slug, email, phone, address, status, subscriptionPlan } = req.body;

    // Check if tenant exists
    const [existingTenants] = await db.execute(
      'SELECT id FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (existingTenants.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if slug or email already exists (excluding current tenant)
    const [duplicateTenants] = await db.execute(
      'SELECT id FROM tenants WHERE (slug = ? OR email = ?) AND id != ?',
      [slug, email, tenantId]
    );

    if (duplicateTenants.length > 0) {
      return res.status(400).json({ message: 'Slug or email already exists' });
    }

    // Update tenant
    await db.execute(
      `UPDATE tenants 
       SET name = ?, slug = ?, email = ?, phone = ?, address = ?, 
           status = ?, subscription_plan = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, slug, email, phone || null, address || null, status || 'active', subscriptionPlan || 'free', tenantId]
    );

    // Get updated tenant
    const [updatedTenants] = await db.execute(
      'SELECT * FROM tenants WHERE id = ?',
      [tenantId]
    );

    res.json({
      message: 'Tenant updated successfully',
      tenant: updatedTenants[0]
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Failed to update tenant' });
  }
});

// Delete tenant (Super Admin only)
router.delete('/:id', authenticateToken, requirePermission('tenants', 'delete'), validateTenantId, async (req, res) => {
  try {
    const tenantId = req.params.id;

    // Check if tenant exists
    const [existingTenants] = await db.execute(
      'SELECT id FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (existingTenants.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if tenant has users
    const [users] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = ?',
      [tenantId]
    );

    if (users[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tenant with existing users. Please remove all users first.' 
      });
    }

    // Delete tenant
    await db.execute('DELETE FROM tenants WHERE id = ?', [tenantId]);

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Failed to delete tenant' });
  }
});

// Get tenant statistics
router.get('/stats/overview', authenticateToken, requirePermission('tenants', 'read'), async (req, res) => {
  try {
    // Get tenant counts by status
    const [statusCounts] = await db.execute(
      'SELECT status, COUNT(*) as count FROM tenants GROUP BY status'
    );

    // Get tenant counts by subscription plan
    const [planCounts] = await db.execute(
      'SELECT subscription_plan, COUNT(*) as count FROM tenants GROUP BY subscription_plan'
    );

    // Get recent tenant registrations (last 30 days)
    const [recentRegistrations] = await db.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM tenants 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`
    );

    // Get top tenants by user count
    const [topTenants] = await db.execute(
      `SELECT t.name, t.slug, COUNT(u.id) as user_count
       FROM tenants t
       LEFT JOIN users u ON t.id = u.tenant_id
       GROUP BY t.id, t.name, t.slug
       ORDER BY user_count DESC
       LIMIT 10`
    );

    res.json({
      statusCounts,
      planCounts,
      recentRegistrations,
      topTenants
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({ message: 'Failed to get tenant statistics' });
  }
});

module.exports = router;

