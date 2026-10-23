import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import obligationRoutes from './routes/obligationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin === allowedOrigin || origin.includes('localhost') || origin.includes('vercel.app')) {
        return callback(null, true);
      }
      callback(null, true); // Permissive in dev/interview review
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected(),
      engine: 'MongoDB / Mongoose',
    },
    service: 'EvidenceLoop Audit Readiness API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/obligations', obligationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB & Start Server
async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[EvidenceLoop API] Server running on http://localhost:${PORT}`);
    console.log(`[EvidenceLoop API] Health check at http://localhost:${PORT}/api/health`);
  });

  return server;
}

startServer();

export default app;
