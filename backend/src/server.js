require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const eventsRouter = require('./routes/events');
const sourcesRouter = require('./routes/sources');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // max 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health', // Never rate-limit health checks
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many write requests, please slow down.' },
});

app.use(limiter);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── CORS Configuration ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Root Route (Render health check) ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'UMS Calendar API',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    docs: '/health',
  });
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'UMS Calendar API',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/events', eventsRouter);
app.use('/api/sources', sourcesRouter);

// ─── Admin Auth Middleware ────────────────────────────────────────────────────
app.use('/api/admin/*', writeLimiter, (req, res, next) => {
  const token = req.headers['x-admin-token'];
  const validTokens = [
    process.env.ADMIN_PASSWORD,
    process.env.ADMIN_API_KEY,
  ].filter(Boolean);

  if (!token || !validTokens.includes(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Don't leak stack traces in production
  const isDev = NODE_ENV !== 'production';
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 UMS Calendar API (${NODE_ENV})`);
  console.log(`   Port:      ${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Events:    http://localhost:${PORT}/api/events`);
  console.log(`   Origins:   ${allowedOrigins.join(', ')}\n`);

  if (!process.env.SUPABASE_URL) {
    console.warn('⚠️  SUPABASE_URL is not set — database calls will fail!');
  }
  if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_API_KEY) {
    console.warn('⚠️  No ADMIN_PASSWORD or ADMIN_API_KEY set — admin routes unprotected!');
  }
});

module.exports = app;
