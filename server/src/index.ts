import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import userRoutes from './modules/users/user.routes.js';
import discoveryRoutes from './modules/discovery/discovery.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import matchRoutes from './modules/match/match.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import referralRoutes from './modules/referral/referral.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';
import matchingRoutes from './modules/match/matching.routes.js';
import likesRoutes from './modules/match/likes.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

// Import services
import { setupMatchingEngines } from './db/engines.js';
import { initReferralCron } from './modules/referral/referral.service.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize background services
if (process.env.NODE_ENV !== 'test') {
  const initWithRetry = async (fn: () => Promise<void>, name: string, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await fn();
        return;
      } catch (error: any) {
        const isTimeout = error?.cause?.code === 'ETIMEDOUT' || error?.code === 'ETIMEDOUT';
        if (isTimeout && attempt < retries) {
          console.log(`[INIT] ${name} timed out (attempt ${attempt}/${retries}). Retrying in 5s...`);
          await new Promise(r => setTimeout(r, 5000));
        } else {
          console.error(`[INIT:ERROR] ${name} failed after ${attempt} attempt(s):`, error.message || error);
        }
      }
    }
  };

  // Warm up the Neon DB connection first, then init services
  import('./db/index.js').then(({ db }) => {
    import('drizzle-orm').then(({ sql }) => {
      db.execute(sql`SELECT 1`).then(() => {
        console.log('[INIT] Database connection warmed up.');
        initWithRetry(setupMatchingEngines, 'Matching Engines');
      }).catch(() => {
        console.warn('[INIT] DB warmup failed, attempting engines anyway...');
        initWithRetry(setupMatchingEngines, 'Matching Engines');
      });
    });
  });

  initReferralCron();
}

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter((url): url is string => Boolean(url)).map(url => url.replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.some(allowed => origin === allowed) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com');

      if (!isAllowed) {
        console.warn(`[CORS] Blocked origin: ${origin}`);
      }

      callback(null, isAllowed);
    },
    credentials: true,
  })
);

// ============================================
// Middleware Stack
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Don't rate limit health checks
});

if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

// ============================================
// Health & Status Routes
// ============================================
app.get('/', (req, res) => {
  res.json({
    service: 'Lustre Dating Platform API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      profile: '/api/profile',
      users: '/api/users',
      discovery: '/api/discovery',
      payments: '/api/payments',
      matches: '/api/matches',
      admin: '/api/admin',
      referrals: '/api/referrals',
      stats: '/api/stats',
      matching: '/api/matching',
      likes: '/api/likes',
      notifications: '/api/notifications',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Error Handler (must be last)
// ============================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    console.error('[TEST:ERROR]', err);
  } else {
    console.error('[ERROR]', err);
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Start Server
// ============================================
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;

  httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Lustre Dating Platform - Backend    ║
║        Running on Port ${PORT}         ║
╚════════════════════════════════════════╝
    `);
  });
}

export default app;