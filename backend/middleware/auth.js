const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const [users] = await db.execute(
      `SELECT u.*, r.name as role_name, r.permissions, t.name as tenant_name, t.slug as tenant_slug
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = {
      ...users[0],
      permissions: users[0].permissions ? JSON.parse(users[0].permissions) : {}
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Check if user has required permission
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      const userPermissions = req.user.permissions;
      
      // Super Admin has all permissions
      if (req.user.role_name === 'Super Admin') {
        return next();
      }

      // Check if user has the required permission
      if (userPermissions[resource] && userPermissions[resource].includes(action)) {
        return next();
      }

      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: `${resource}:${action}`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

// Check if user belongs to tenant (for tenant-specific operations)
const requireTenantAccess = (req, res, next) => {
  try {
    const tenantId = req.params.tenantId || req.body.tenantId;
    
    // Super Admin can access all tenants
    if (req.user.role_name === 'Super Admin') {
      return next();
    }

    // Check if user belongs to the tenant
    if (req.user.tenant_id && req.user.tenant_id.toString() === tenantId.toString()) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied to this tenant' 
    });
  } catch (error) {
    console.error('Tenant access check error:', error);
    return res.status(500).json({ message: 'Tenant access check failed' });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.execute(
      `SELECT u.*, r.name as role_name, r.permissions, t.name as tenant_name, t.slug as tenant_slug
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    );

    if (users.length > 0) {
      req.user = {
        ...users[0],
        permissions: users[0].permissions ? JSON.parse(users[0].permissions) : {}
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireTenantAccess,
  optionalAuth
};

