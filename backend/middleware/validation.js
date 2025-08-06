const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('Valid role ID is required'),
  body('tenantId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid tenant ID is required'),
  handleValidationErrors
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors
];

// User validation rules
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid role ID is required'),
  handleValidationErrors
];

const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  handleValidationErrors
];

// Tenant validation rules
const validateTenant = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Tenant name must be between 2 and 255 characters'),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('subscriptionPlan')
    .optional()
    .isIn(['free', 'basic', 'premium', 'enterprise'])
    .withMessage('Valid subscription plan is required'),
  handleValidationErrors
];

const validateTenantId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid tenant ID is required'),
  handleValidationErrors
];

// Notification validation rules
const validateNotification = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message is required and must be less than 1000 characters'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'error'])
    .withMessage('Valid notification type is required'),
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('tenantId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid tenant ID is required'),
  handleValidationErrors
];

const validateNotificationId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid notification ID is required'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateRefreshToken,
  validateUserUpdate,
  validateUserId,
  validateTenant,
  validateTenantId,
  validateNotification,
  validateNotificationId,
  validatePagination
};

