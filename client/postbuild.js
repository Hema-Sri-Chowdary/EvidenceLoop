import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  // 1. Create 404.html fallback for any unspecified routes
  fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));

  // 2. Pre-generate physical route folders for instant 200 OK on direct URL visits & page refresh
  const routes = ['login', 'mfa', 'dashboard', 'forgot-password', 'obligations', 'profile'];
  for (const route of routes) {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'));
  }
  console.log('[Postbuild] Successfully generated physical SPA routes and 404.html fallback in dist/');
}
