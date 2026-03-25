import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { authRouter, passport } from './routes/authRoutes.js';
import pool from './db.js';

import userRoutes from './routes/userRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.JWT_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 5 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(authRouter);

// Health checks
app.get('/', (_req: Request, res: Response) => res.send('API is running...'));
app.get('/api/message', (_req: Request, res: Response) => res.json({ message: 'Hello from backend 🚀' }));

// Tags (direct pool query — no domain owner)
app.get('/api/tags', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT unnest(enum_range(NULL::campaign_tag))::text AS tag`);
    res.json(result.rows.map((r: { tag: string }) => r.tag));
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
app.use('/api', userRoutes);
app.use('/api', campaignRoutes);
app.use('/api', donationRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', paymentRoutes);
app.use('/api', imageRoutes);
app.use('/admin', adminRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
