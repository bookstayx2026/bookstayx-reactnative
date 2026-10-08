const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { env } = require('./src/config/env');
const { isCorsOriginAllowed } = require('./src/config/cors');
const { globalApiLimiter } = require('./middleware/rateLimiter');
const { errorMiddleware, createError, errorCodes } = require('./middleware/errorHandler');
const healthRoutes = require('./src/routes/health');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const villaRoutes = require('./routes/villa');
const campingRoutes = require('./routes/camping_Cottages');
const ownerRoutes = require('./routes/ownerRoutes');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const eticketRoutes = require('./routes/etickets');
const referralRoutes = require('./routes/referralRoutes');
const locationRoutes = require('./routes/locations');
const notificationRoutes = require('./routes/notifications');
const bookingController = require('./controllers/bookingController');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', req.requestId);
  next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, env)) {
        return callback(null, true);
      }
      return callback(createError(errorCodes.CORS_ORIGIN_DENIED));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    // Images use multipart uploads. Keeping JSON small limits memory pressure
    // from malformed or abusive requests without affecting normal API payloads.
    limit: '2mb',
    verify(req, res, buffer) {
      if (
        req.path?.startsWith('/webhook') ||
        req.path?.startsWith('/api/payments/withdrawal/webhook') ||
        req.path?.startsWith('/api/payments/razorpayx/webhook') ||
        req.path?.startsWith('/api/payments/razorpay/webhook')
      ) {
        req.rawBody = buffer;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 1000 }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(
      `${req.requestId} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`
    );
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'bookstayx-api', status: 'healthy' });
});
app.use('/api/health', healthRoutes);

app.use('/api', globalApiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/villa', villaRoutes);
app.use('/api/camping_Cottages', campingRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/etickets', eticketRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/webhook', bookingController.handleWhatsAppWebhook);
app.post('/webhook', bookingController.handleWhatsAppWebhook);

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'API endpoint not found' },
  });
});

app.use(errorMiddleware);

module.exports = app;
