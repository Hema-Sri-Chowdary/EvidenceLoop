import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import obligationRoutes from './routes/obligationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { seedMongoUsersIfEmpty } from './config/userStore.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Explicit CORS Configuration
const parseAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (process.env.CLIENT_ORIGIN) {
    process.env.CLIENT_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  return origins;
};

const allowedOrigins = parseAllowedOrigins();

export function isOriginAllowed(origin) {
  // Allow requests with no origin (mobile native apps, curl, server-to-server, same-origin)
  if (!origin) {
    return true;
  }

  // Explicit allowlist match (configured origins and standard dev ports)
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // Development: allow any localhost or 127.0.0.1 port (HTTP/HTTPS)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  // Production: allow verified Vercel preview and production subdomains (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      const corsError = new Error(`Origin ${origin} is not allowed by CORS`);
      corsError.status = 403;
      return callback(corsError);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const connected = isDbConnected();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected,
      engine: connected ? 'MongoDB / Mongoose' : 'Persistent File Storage',
      storage: connected ? 'mongodb' : 'file',
    },
    service: 'EvidenceLoop Audit Readiness API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/obligations', obligationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB & Start Server
async function startServer() {
  await connectDB();
  await seedMongoUsersIfEmpty();

  const server = app.listen(PORT, () => {
    console.log(`[EvidenceLoop API] Server running on http://localhost:${PORT}`);
    console.log(`[EvidenceLoop API] Health check at http://localhost:${PORT}/api/health`);
  });

  return server;
}

startServer();

export default app;
