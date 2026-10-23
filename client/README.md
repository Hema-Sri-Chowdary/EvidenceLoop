# EvidenceLoop Frontend

Standalone pure React + Vanilla CSS application for **EvidenceLoop — Evidence Gap Prioritizer**.

## Architecture
- **Framework**: React 19 with Vite 8
- **Styling**: Pure Vanilla CSS (zero Tailwind, zero CSS frameworks)
- **Networking**: Native Fetch API (zero Axios dependency)
- **Icons**: Custom inline React SVG components (zero icon package dependency)
- **Routing**: React Router DOM v7

## Setup & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   # Point to your standalone backend API
   VITE_API_URL=http://localhost:5000/api
   ```
3. Run locally:
   ```bash
   # Development server (runs on port 5173)
   npm run dev

   # Run automated unit test suite
   npm test

   # Compile production bundle (dist/)
   npm run build

   # Preview production bundle locally
   npm run preview
   ```

## Production Deployment (e.g., Vercel)
1. Set Root Directory to `client`.
2. Build Command: `npm run build`.
3. Output Directory: `dist`.
4. Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://evidenceloop-api.onrender.com/api`).
5. Deep SPA routing is automatically supported via [vercel.json](file:///c:/Users/admin/Downloads/Evidence%20loop/client/vercel.json).
