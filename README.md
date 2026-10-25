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


## 3. Technology Stack 

- **Frontend:**
  - **React 19**
  - **Pure Vanilla CSS** 
  - **Native Fetch API** 
  - **Custom React SVG Icons** 
  - **React Router DOM v7**
- **Backend:**
  - **Node.js**
  - **Express.js** (REST API)
  - **MongoDB** & **Mongoose** (Validated Schema & Indexes)
  - **CORS** & **dotenv**

---

## 4. Core Readiness Business Logic

1. **Overdue**: Obligation due date has passed and status is not Completed.
2. **Missing Evidence**: `evidenceRequired: true` and no supporting evidence links are attached.
3. **Due Soon**: Incomplete and due within the next 7 days.
4. **Ready for Review**: Completed and all required evidence attached.
5. **Readiness Gap**: Overdue OR missing required evidence.  
   *Critical Rule:* Marking an item `Completed` with `evidenceRequired: true` without evidence **remains flagged as Missing Evidence and as an active Readiness Gap**.


   ## Project Reflection

### 1. What problem does your tool solve, and who is the user?

EvidenceLoop helps teams identify what is preventing them from being audit-ready and determine what needs attention first. Instead of tracking obligations, deadlines, and supporting evidence across scattered spreadsheets and documents, users can manage them in one workspace, identify evidence gaps, and prioritize overdue or incomplete obligations.

It is designed for compliance teams and internal auditors. Auditors manage obligations and evidence, while Viewers monitor compliance progress without making changes.

### 2. What were the two or three most important product decisions you made, and why?

I connected obligations, evidence, deadlines, and readiness indicators in one workflow so users can quickly identify compliance gaps instead of manually reviewing multiple documents.

I also introduced Auditor and Viewer roles, along with email OTP verification, to support role-based access and add another layer of protection to authentication.

Finally, I focused on building a reliable core workflow for a single organization before expanding into a more complex enterprise platform. This helped keep the initial scope focused on solving the main problem effectively.

### 3. What did you cut from scope, and what would you build next if you had more time?

I prioritized obligation tracking, evidence management, readiness dashboards, and authentication over advanced integrations, automated evidence collection, and complex approval workflows.

Next, I would introduce multi-organization workspaces with strict backend-enforced data isolation, deadline reminders, detailed audit trails, downloadable reports, and more automated tests. I would also allow users to register as Viewers, while Auditor access would require approval from an authorized workspace administrator or a trusted invitation. Every protected API endpoint would verify the user's actual stored role rather than trusting permissions submitted by the frontend.

### 4. What broke or surprised you during development, and how did you handle it?

I learned that an application working locally does not always behave the same way after deployment. I encountered issues with direct page refreshes and routing on Vercel, database connections in a serverless environment, and email delivery.

I addressed these challenges by improving routing configuration, adapting server startup for serverless deployment, adding database health checks, and improving email error handling.

This experience taught me that building a reliable product involves more than implementing features. It also requires handling failures, protecting data, and ensuring consistent behavior in production.
