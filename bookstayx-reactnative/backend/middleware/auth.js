const { verifyToken } = require('../utils/jwt');

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Access denied.',
      });
    }

    // Reject short-lived temp tokens used only for TOTP verification
    if (decoded.purpose === 'totp') {
      return res.status(401).json({
        success: false,
        message: 'Complete 2FA verification to access this resource.',
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'admin',
      mobile: decoded.mobile || null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = authMiddleware;
