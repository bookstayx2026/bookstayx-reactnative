const errorCodes = {
  PROPERTY_NOT_FOUND: { status: 404, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' },
  UNIT_NOT_FOUND: { status: 404, code: 'UNIT_NOT_FOUND', message: 'Unit not found' },
  VILLA_NOT_FOUND: { status: 404, code: 'VILLA_NOT_FOUND', message: 'Villa not found' },
  CAMPING_NOT_FOUND: { status: 404, code: 'CAMPING_NOT_FOUND', message: 'Camping property not found' },
  INVALID_CATEGORY: { status: 400, code: 'INVALID_CATEGORY', message: 'Invalid property category' },
  INVALID_DATE: { status: 400, code: 'INVALID_DATE', message: 'Invalid date format' },
  INVALID_PRICE: { status: 400, code: 'INVALID_PRICE', message: 'Invalid price format' },
  MISSING_REQUIRED_FIELD: { status: 400, code: 'MISSING_REQUIRED_FIELD', message: 'Required field is missing' },
  UNAUTHORIZED: { status: 401, code: 'UNAUTHORIZED', message: 'Authentication required' },
  FORBIDDEN: { status: 403, code: 'FORBIDDEN', message: 'Access denied' },
  CORS_ORIGIN_DENIED: { status: 403, code: 'CORS_ORIGIN_DENIED', message: 'Origin is not allowed by CORS' },
  DATABASE_ERROR: { status: 500, code: 'DATABASE_ERROR', message: 'Database operation failed' },
  DATABASE_UNAVAILABLE: { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database service is temporarily unavailable' },
  INTERNAL_ERROR: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' }
};

class AppError extends Error {
  constructor(errorCode, details = null) {
    super(errorCode.message);
    this.status = errorCode.status;
    this.code = errorCode.code;
    this.details = details;
    this.isOperational = true;
  }
}

const createError = (errorCode, details = null) => {
  return new AppError(errorCode, details);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== 'string') return '';
  return message.replace(/(:\/\/[^:]+):([^@]+)@/g, '$1:***@');
};

const isDatabaseError = (err) => {
  if (!err) return false;
  if (err.name === 'DatabaseError') return true;
  if (typeof err.code === 'string') {
    if (/^(08|28|3D|57)/i.test(err.code)) return true;
    if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'].includes(err.code)) return true;
  }
  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('connection terminated') ||
      msg.includes('password authentication failed') ||
      msg.includes('tenant or user not found') ||
      msg.includes('connection timeout') ||
      msg.includes('client has already been connected') ||
      msg.includes('pool error')
    );
  }
  return false;
};

const categorizeError = (err) => {
  if (!err) return 'UNKNOWN';
  if (err.status === 401 || err.code === 'UNAUTHORIZED') return 'AUTHENTICATION';
  if (err.status === 403 || err.code === 'FORBIDDEN' || err.code === 'CORS_ORIGIN_DENIED') return 'AUTHORIZATION';
  if (err.status === 404 || err.code?.includes('NOT_FOUND')) return 'NOT_FOUND';
  if (err.status === 400 || err.code?.includes('INVALID') || err.code?.includes('MISSING')) return 'VALIDATION';
  if (err.status === 429 || err.code?.includes('LIMIT')) return 'RATE_LIMIT';
  if (isDatabaseError(err)) return 'DATABASE';
  return 'INTERNAL_SERVER_ERROR';
};

const errorMiddleware = (err, req, res, next) => {
  const isInvalidJson = err instanceof SyntaxError && err.type === 'entity.parse.failed';
  const isPayloadTooLarge = err.type === 'entity.too.large' || err.status === 413;
  if (isInvalidJson || isPayloadTooLarge) {
    return res.status(isPayloadTooLarge ? 413 : 400).json({
      success: false,
      error: {
        code: isPayloadTooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON',
        message: isPayloadTooLarge ? 'Request payload is too large' : 'Request body must contain valid JSON'
      }
    });
  }

  const category = categorizeError(err);
  const isDbErr = isDatabaseError(err);
  const status = err.isOperational ? err.status : (isDbErr ? 503 : 500);

  // Safe diagnostic log — strictly records request path, status, and error category
  // Absolutely NO passwords, OTPs, tokens, or personal data are logged
  console.error(
    `[DIAGNOSTIC] ${req.requestId || '-'} ${req.method} ${req.path} -> status: ${status}, category: ${category}, code: ${err.code || 'UNKNOWN'}`
  );

  if (err.isOperational) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        category,
        message: err.message,
        details: err.details,
        requestId: req.requestId,
      }
    });
  }

  if (isDbErr) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        category: 'DATABASE',
        message: 'The booking and authentication service is temporarily unavailable. Please try again shortly.',
        requestId: req.requestId,
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      category: 'INTERNAL_SERVER_ERROR',
      message: 'A server error occurred. Please try again shortly.',
      requestId: req.requestId,
    }
  });
};

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, errorCode, details = null) => {
  return res.status(errorCode.status).json({
    success: false,
    error: {
      code: errorCode.code,
      message: errorCode.message,
      details
    }
  });
};

module.exports = {
  errorCodes,
  AppError,
  createError,
  asyncHandler,
  errorMiddleware,
  sendSuccess,
  sendError,
  isDatabaseError,
  categorizeError,
  sanitizeErrorMessage,
};
