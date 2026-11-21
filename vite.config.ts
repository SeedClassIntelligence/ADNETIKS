import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { handleGenerateContent, handleGenerateImage, handleDiscoverAvatars, handleGenerateAiVideo } from './src/server/api.ts';
import { getLLMConfig, setRuntimeLLMConfig } from './src/server/llmProvider.ts';
import { loadWorkspace, saveWorkspace, saveDataUrlMedia, resolveMediaFile, listMediaFiles } from './src/server/storage.ts';
import { scrapeUrlContext, analyzeImageVisual } from './src/server/ingest.ts';
import {
  getPublicPublishConfig,
  updatePublishConfig,
  dispatchPostReal,
  createUtmTrackingLink,
  resolveAndTrackUtmRedirect,
  recordConversionEvent,
  getAttributionSummary,
  startBackgroundScheduler,
  buildEmbeddablePixelScript,
} from './src/server/delivery.ts';
import {
  listLearnedPatterns,
  recordLearnedPattern,
  toggleLearnedPattern,
  deleteLearnedPattern,
  synthesizeMemoryFromSignals,
} from './src/server/memory.ts';

// Custom Vite plugin to handle /api/* server endpoints directly in dev
function apiServerPlugin(): Plugin {
  return {
    name: 'adnetiks-api-server',
    configureServer(server) {
      startBackgroundScheduler();
      server.middlewares.use(async (req, res, next) => {
        // Avatar Discovery Route (Offer-Derived Prospects)
        if (req.url?.startsWith('/api/discover-avatars') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = await handleDiscoverAvatars(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Avatar Discovery Error' }));
            }
          });
          return;
        }

        // Content Generation Route
        if (req.url?.startsWith('/api/generate-content') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = await handleGenerateContent(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
          });
          return;
        }

        // Image Generation Route
        if (req.url?.startsWith('/api/generate-image') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = await handleGenerateImage(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Image Generation Error' }));
            }
          });
          return;
        }

        // AI Video Generation Route
        if (req.url?.startsWith('/api/generate-ai-video') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = await handleGenerateAiVideo(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'AI Video Generation Error' }));
            }
          });
          return;
        }

        // Agnostic LLM / Code Assistant Configuration Route
        if (req.url?.startsWith('/api/llm-config')) {
          if (req.method === 'GET') {
            const config = getLLMConfig();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                provider: config.provider,
                model: config.model,
                baseUrl: config.baseUrl || '',
                hasApiKey: !!config.apiKey,
              })
            );
            return;
          }
          if (req.method === 'POST') {
            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });
            req.on('end', () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                setRuntimeLLMConfig(body);
                const updated = getLLMConfig();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: true,
                    provider: updated.provider,
                    model: updated.model,
                    baseUrl: updated.baseUrl || '',
                    hasApiKey: !!updated.apiKey,
                  })
                );
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // Real Persistent Workspace DB Route (GET / PUT /api/workspace)
        if (req.url?.startsWith('/api/workspace')) {
          if (req.method === 'GET') {
            const ws = loadWorkspace();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, workspace: ws }));
            return;
          }
          if (req.method === 'PUT' || req.method === 'POST') {
            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            req.on('end', () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
                const saved = saveWorkspace(body);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, updatedAt: saved.updatedAt }));
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ error: err.message || 'Workspace save error' }));
              }
            });
            return;
          }
        }

        // Real Persistent Media Vault Upload (POST /api/media/upload)
        if (req.url?.startsWith('/api/media/upload') && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
              const saved = saveDataUrlMedia(body.dataUrl, body.fileName);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, ...saved }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message || 'Media upload error' }));
            }
          });
          return;
        }

        // List or Stream Stored Media Files (GET /api/media or GET /api/media/:filename)
        if (req.url?.startsWith('/api/media') && req.method === 'GET') {
          const urlPath = req.url.split('?')[0];
          if (urlPath === '/api/media' || urlPath === '/api/media/') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, files: listMediaFiles() }));
            return;
          }
          const filename = decodeURIComponent(urlPath.replace(/^\/api\/media\//, ''));
          const resolved = resolveMediaFile(filename);
          if (!resolved) {
            res.statusCode = 404;
            res.end('Media not found');
            return;
          }
          const rangeHeader = req.headers.range;
          if (rangeHeader) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (match) {
              const start = parseInt(match[1], 10);
              const end = match[2] ? Math.min(parseInt(match[2], 10), resolved.sizeBytes - 1) : resolved.sizeBytes - 1;
              res.statusCode = 206;
              res.setHeader('Content-Range', `bytes ${start}-${end}/${resolved.sizeBytes}`);
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Length', String(end - start + 1));
              res.setHeader('Content-Type', resolved.mimeType);
              fs.createReadStream(resolved.fullPath, { start, end }).pipe(res);
              return;
            }
          }
          res.statusCode = 200;
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Length', String(resolved.sizeBytes));
          res.setHeader('Content-Type', resolved.mimeType);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          fs.createReadStream(resolved.fullPath).pipe(res);
          return;
        }

        // Real Live URL Scraper Route (POST /api/ingest-url)
        if (req.url?.startsWith('/api/ingest-url') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const scraped = await scrapeUrlContext(body.url || '');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(scraped));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message || 'URL scrape failed' }));
            }
          });
          return;
        }

        // Multimodal Vision Screenshot / Flyer Analyzer (POST /api/analyze-image)
        if (req.url?.startsWith('/api/analyze-image') && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
              const analysis = await analyzeImageVisual(body.dataUrl || '', body.fileName, body.brandName);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(analysis));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message || 'Vision analysis failed' }));
            }
          });
          return;
        }

        // Phase 2: Publishing Config (GET / POST /api/publish/config)
        if (req.url?.startsWith('/api/publish/config')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, config: getPublicPublishConfig() }));
            return;
          }
          if (req.method === 'POST') {
            let bodyStr = '';
            req.on('data', (chunk) => (bodyStr += chunk));
            req.on('end', () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                updatePublishConfig(body);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, config: getPublicPublishConfig() }));
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }
        }

        // Phase 2: Real Multi-Post Publishing Dispatch (POST /api/publish/dispatch)
        if (req.url?.startsWith('/api/publish/dispatch') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => (bodyStr += chunk));
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const postsToSend = Array.isArray(body.posts) ? body.posts : body.post ? [body.post] : [];
              const results = [];
              for (const p of postsToSend) {
                const entry = await dispatchPostReal(p);
                results.push(entry);
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, results }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message || 'Dispatch error' }));
            }
          });
          return;
        }

        // Phase 2: Real Delivery Logs & Attribution Summary (GET /api/publish/logs)
        if (req.url?.startsWith('/api/publish/logs') && req.method === 'GET') {
          const summary = getAttributionSummary();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, logs: summary.recentLogs, lastSchedulerTick: summary.lastSchedulerTick }));
          return;
        }

        // Phase 2: Real UTM Short-Link Minting & Listing (POST /api/utm/create, GET /api/utm)
        if (req.url?.startsWith('/api/utm/create') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => (bodyStr += chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const link = createUtmTrackingLink(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, link }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/utm') && req.method === 'GET') {
          const summary = getAttributionSummary();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, links: summary.recentLinks, totalClicks: summary.totalClicks }));
          return;
        }

        // Phase 2: Real HTTP 302 Short-Link Redirector & Click Tracker (GET /r/:slug)
        if (req.url?.startsWith('/r/') && req.method === 'GET') {
          const slug = req.url.split('?')[0].replace(/^\/r\//, '').trim();
          const resolved = resolveAndTrackUtmRedirect(slug);
          if (!resolved) {
            res.statusCode = 404;
            res.end('ADNETIKS tracking link not found');
            return;
          }
          res.statusCode = 302;
          res.setHeader('Location', resolved.redirectUrl);
          res.end();
          return;
        }

        // Phase 2: Real Conversion Pixel & Telemetry Collector (GET/POST/OPTIONS /api/events)
        if (req.url?.startsWith('/api/events')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, ...getAttributionSummary() }));
            return;
          }
          if (req.method === 'POST') {
            let bodyStr = '';
            req.on('data', (chunk) => (bodyStr += chunk));
            req.on('end', () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const event = recordConversionEvent(body);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, event, summary: getAttributionSummary() }));
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }
        }

        // Phase 2: Embeddable First-Party Pixel Script (GET /api/pixel.js)
        if (req.url?.startsWith('/api/pixel.js') && req.method === 'GET') {
          const host = req.headers.host || 'localhost:3000';
          const proto = req.headers['x-forwarded-proto'] || 'http';
          const js = buildEmbeddablePixelScript(`${proto}://${host}`);
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = 200;
          res.end(js);
          return;
        }

        // Phase 3: Closed-Loop Brand Brain Memory Engine (/api/memory)
        if (req.url?.startsWith('/api/memory/synthesize') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => (bodyStr += chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = synthesizeMemoryFromSignals(body.brandName);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, ...result }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/memory')) {
          const cleanUrl = req.url.split('?')[0];
          const idPart = cleanUrl.replace(/^\/api\/memory\/?/, '');

          if (req.method === 'GET' && !idPart) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, ...listLearnedPatterns() }));
            return;
          }

          if (req.method === 'POST' && !idPart) {
            let bodyStr = '';
            req.on('data', (chunk) => (bodyStr += chunk));
            req.on('end', () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const pattern = recordLearnedPattern(body);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, pattern, ...listLearnedPatterns() }));
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }

          if (req.method === 'PATCH' && idPart) {
            let bodyStr = '';
            req.on('data', (chunk) => (bodyStr += chunk));
            req.on('end', () => {
              const body = JSON.parse(bodyStr || '{}');
              const updated = toggleLearnedPattern(decodeURIComponent(idPart), body.active);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = updated ? 200 : 404;
              res.end(JSON.stringify({ ok: !!updated, pattern: updated, ...listLearnedPatterns() }));
            });
            return;
          }

          if (req.method === 'DELETE' && idPart) {
            const removed = deleteLearnedPattern(decodeURIComponent(idPart));
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = removed ? 200 : 404;
            res.end(JSON.stringify({ ok: removed, ...listLearnedPatterns() }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
