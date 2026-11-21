/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Standalone Production Server
 * Serves the compiled React SPA (`dist/`) + all `/api/*` endpoints + `/r/:slug` UTM redirector
 * + 30-second background publishing scheduler in a single lightweight Node process.
 * Works identically on Hosted Cloud (Render, Railway, Fly, VPS) and Self-Hosted Docker/Desktop.
 */

import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { ensureSchedulerRunning, handleAdnetiksRequest } from './router.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStaticFile(reqUrl: string, res: http.ServerResponse) {
  if (!fs.existsSync(DIST_DIR)) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('ADNETIKS production bundle not found. Run "npm run build" first.');
    return;
  }

  const cleanPath = decodeURIComponent((reqUrl || '/').split('?')[0]);
  const safeRelative = path.normalize(cleanPath).replace(/^(\.\.(\/|\\|$))+/, '');
  let targetFile = path.join(DIST_DIR, safeRelative === '/' || safeRelative === '\\' ? 'index.html' : safeRelative);

  if (!targetFile.startsWith(DIST_DIR) || !fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
    // SPA fallback to index.html for client-side routes
    targetFile = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  if (cleanPath.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-cache');
  }
  fs.createReadStream(targetFile).pipe(res);
}

ensureSchedulerRunning();

const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleAdnetiksRequest(req, res);
    if (handled) return;
    serveStaticFile(req.url || '/', res);
  } catch (err: any) {
    console.error('[ADNETIKS Server Error]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Internal Server Error' }));
    }
  }
});

server.listen(PORT, HOST, () => {
  const mode = process.env.ADNETIKS_DEPLOY_MODE || 'production';
  console.log(`\n🚀 ADNETIKS Production Server running at http://${HOST}:${PORT}`);
  console.log(`   Mode: ${mode} | Static UI: ${DIST_DIR}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health\n`);
});

const shutdown = () => {
  console.log('\nShutting down ADNETIKS server cleanly...');
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
