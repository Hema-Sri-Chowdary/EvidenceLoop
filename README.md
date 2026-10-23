# EvidenceLoop — Evidence Gap Prioritizer

> **Audit-readiness and evidence-gap management workspace.**  
> *"What is preventing our team from being audit-ready, and what should we fix first?"*

---

## 1. Decoupled Architecture: Frontend & Backend Separation

The project is structured into **two completely decoupled applications**:

```
evidenceloop/
├── client/                     # STANDALONE FRONTEND (React 19 + Vanilla CSS)
│   ├── src/                    # Components, pages, hooks, pure CSS
│   ├── .env                    # Points to backend API (VITE_API_URL)
│   ├── package.json            # React & Vite dependencies only
│   ├── vercel.json             # Vercel deployment configuration
│   └── vite.config.js          # Vite config
│
├── server/                     # STANDALONE BACKEND (Node.js + Express + Mongoose)
│   ├── src/                    # Controllers, models, routes, readiness engine
│   ├── .env                    # Port, Mongo URI, allowed origins
│   └── package.json            # Express & Mongoose dependencies only
│
├── package.json                # Workspace orchestration scripts
└── README.md
```

---

## 2. Independent Running Instructions

### Option A: Running from Root Workspace
- **Start Backend only**: `npm run server` (or `npm run server:dev`)
- **Start Frontend only**: `npm run client`
- **Run Frontend Tests**: `npm run client:test`
- **Build Frontend**: `npm run client:build`

---

### Option B: Running Standalone Frontend (`/client`)
1. Navigate into `client`:
   ```bash
   cd client
   npm install
   ```
2. Configure `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
   *Frontend opens at `http://localhost:5173`.*

---

### Option C: Running Standalone Backend (`/server`)
1. Navigate into `server`:
   ```bash
   cd server
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/evidenceloop
   CLIENT_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```
3. Start server:
   ```bash
   npm start
   ```
   *Backend listens at `http://localhost:5000`, health check at `http://localhost:5000/api/health`.*

---

## 3. Independent Deployment Guide

### Deploy Frontend (Vercel)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_URL` pointing to your deployed backend URL (e.g., `https://evidenceloop-api.onrender.com/api`).
- [vercel.json](file:///c:/Users/admin/Downloads/Evidence%20loop/client/vercel.json) automatically handles single-page app routing.

### Deploy Backend (Render / Railway / Fly.io)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: Automatic
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: Your MongoDB Atlas connection string
  - `CLIENT_ORIGIN`: Your deployed Vercel frontend URL (e.g., `https://evidenceloop.vercel.app`)

---

## 4. Technology Stack (Strictly Minimal)

- **Frontend:**
  - **React 19**
  - **Pure Vanilla CSS** (Handcrafted design system in `client/src/index.css`)
  - **Native Fetch API** (No Axios)
  - **Custom React SVG Icons** (No Lucide React)
  - **React Router DOM v7**
- **Backend:**
  - **Node.js**
  - **Express.js** (REST API)
  - **MongoDB** & **Mongoose** (Validated Schema & Indexes)
  - **CORS** & **dotenv**

---

## 5. Core Readiness Business Logic

1. **Overdue**: Obligation due date has passed and status is not Completed.
2. **Missing Evidence**: `evidenceRequired: true` and no supporting evidence links are attached.
3. **Due Soon**: Incomplete and due within the next 7 days.
4. **Ready for Review**: Completed and all required evidence attached.
5. **Readiness Gap**: Overdue OR missing required evidence.  
   *Critical Rule:* Marking an item `Completed` with `evidenceRequired: true` without evidence **remains flagged as Missing Evidence and as an active Readiness Gap**.
