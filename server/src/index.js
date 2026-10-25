import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected, isProduction } from './config/db.js';
import obligationRoutes from './routes/obligationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { seedMongoUsersIfEmpty } from './config/userStore.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

// EvidenceLoop Express Application & Security Gateway
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
  const prod = isProduction();
  const statusOk = connected || !prod;
  res.status(statusOk ? 200 : 503).json({
    status: connected ? 'ok' : prod ? 'service_unavailable' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected,
      engine: connected ? 'MongoDB Atlas / Mongoose' : prod ? 'None (Atlas Required)' : 'Local File Fallback',
      storage: connected ? 'mongodb' : prod ? 'unavailable' : 'file',
      mandatoryInProduction: true,
    },
    service: 'EvidenceLoop Audit Readiness API',
    version: '1.0.0',
  });
});

// Database connection middleware: ensures MongoDB Atlas is connected before handling requests
app.use(async (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }

  try {
    if (!isDbConnected()) {
      await connectDB();
    }

    if (isProduction() && !isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. MongoDB Atlas is mandatory in production.',
      });
    }

    next();
  } catch (err) {
    if (isProduction()) {
      return res.status(503).json({
        success: false,
        message: `Database connection unavailable: ${err.message}. MongoDB Atlas is mandatory in production.`,
      });
    }
    next();
  }
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
  try {
    const conn = await connectDB();
    if (isProduction() && !conn) {
      console.error('[FATAL] MongoDB Atlas connection failed in production. Server startup aborted.');
      process.exit(1);
    }
    await seedMongoUsersIfEmpty();
  } catch (err) {
    if (isProduction()) {
      console.error('[FATAL] MongoDB Atlas startup error in production:', err.message);
      process.exit(1);
    }
    console.warn('[Startup DB Notice]', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`[EvidenceLoop API] Server running on http://localhost:${PORT}`);
    console.log(`[EvidenceLoop API] Health check at http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\x1b[33m[EvidenceLoop Warning]\x1b[0m Port ${PORT} is already in use by another instance.`);
      console.error(`\x1b[33m[EvidenceLoop Hint]\x1b[0m Close any duplicate terminal running 'npm run dev', or stop the process on port ${PORT}.`);
    } else {
      console.error('[EvidenceLoop Server Error]', err.message);
    }
  });

  return server;
}

startServer();

export default app;
