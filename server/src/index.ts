import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

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

import { setupMatchingEngines } from './db/engines.js';
import { initReferralCron } from './modules/referral/referral.service.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize DB Engines & Cron Jobs
setupMatchingEngines().catch(console.error);
initReferralCron();

// Middlewares
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
