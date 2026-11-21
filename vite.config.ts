import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { handleGenerateContent, handleGenerateImage, handleDiscoverAvatars, handleGenerateAiVideo } from './src/server/api.ts';
import { getLLMConfig, setRuntimeLLMConfig } from './src/server/llmProvider.ts';
import { loadWorkspace, saveWorkspace, saveDataUrlMedia, resolveMediaFile, listMediaFiles } from './src/server/storage.ts';
import { scrapeUrlContext, analyzeImageVisual } from './src/server/ingest.ts';

// Custom Vite plugin to handle /api/* server endpoints directly in dev
function apiServerPlugin(): Plugin {
  return {
    name: 'adnetiks-api-server',
    configureServer(server) {
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
