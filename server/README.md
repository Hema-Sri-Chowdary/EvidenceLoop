# EvidenceLoop Backend API

Standalone Node.js + Express.js REST API for **EvidenceLoop — Evidence Gap Prioritizer**.

## Architecture
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose
- **Readiness Logic**: Centralized engine ([readinessService.js](file:///c:/Users/admin/Downloads/Evidence%20loop/server/src/services/readinessService.js))

## Prerequisites
- Node.js >= 18.0.0
- MongoDB 6.0+ (local daemon or MongoDB Atlas cluster connection string)

## Setup & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/evidenceloop
   CLIENT_ORIGIN=http://localhost:5173
   ```
3. Start the server:
   ```bash
   # Production mode
   npm start

   # Development auto-watch mode
   npm run dev
   ```
4. Health check responds at:
   `http://localhost:5000/api/health`

## Production Deployment (e.g., Render, Railway)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: (configured automatically by platform)
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: Your MongoDB Atlas connection URI
  - `CLIENT_ORIGIN`: Your deployed Vercel frontend URL (e.g. `https://evidenceloop.vercel.app`)
