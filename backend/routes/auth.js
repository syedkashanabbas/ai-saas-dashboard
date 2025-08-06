const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validateRegister, validateRefreshToken } = require('../middleware/validation');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with role and tenant information
    const [users] = await db.execute(
      `SELECT u.*, r.name as role_name, r.permissions, t.name as tenant_name, t.slug as tenant_slug
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    // Update last login
    await db.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        permissions: user.permissions ? JSON.parse(user.permissions) : {}
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Register (only for Super Admin to create new users)
router.post('/register', authenticateToken, validateRegister, async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleId, tenantId } = req.body;

    // Check if user has permission to create users
    if (req.user.role_name !== 'Super Admin' && 
        (!req.user.permissions.users || !req.user.permissions.users.includes('create'))) {
      return res.status(403).json({ message: 'Insufficient permissions to create users' });
    }

    // Check if email already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Validate role exists
    const [roles] = await db.execute(
      'SELECT id FROM roles WHERE id = ?',
      [roleId]
    );

    if (roles.length === 0) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    // Validate tenant exists (if provided)
    if (tenantId) {
      const [tenants] = await db.execute(
        'SELECT id FROM tenants WHERE id = ?',
        [tenantId]
      );

      if (tenants.length === 0) {
        return res.status(400).json({ message: 'Invalid tenant ID' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      `INSERT INTO users (tenant_id, role_id, email, password, first_name, last_name, status, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, 'active', TRUE)`,
      [tenantId || null, roleId, email, hashedPassword, firstName, lastName]
    );

    // Get created user with role and tenant info
    const [newUsers] = await db.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at,
              r.name as role_name, t.name as tenant_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUsers[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Refresh token
router.post('/refresh', validateRefreshToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database and is not expired
    const [tokens] = await db.execute(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()',
      [refreshToken, decoded.userId]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    res.json({
      message: 'Token refreshed successfully',
      accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await db.execute(
        'DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?',
        [refreshToken, req.user.id]
      );
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current user password
    const [users] = await db.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    // Invalidate all refresh tokens for this user
    await db.execute(
      'DELETE FROM refresh_tokens WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;

