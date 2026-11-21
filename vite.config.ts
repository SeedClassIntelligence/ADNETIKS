import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { handleGenerateContent, handleGenerateImage, handleDiscoverAvatars, handleGenerateAiVideo } from './src/server/api.ts';
import { getLLMConfig, setRuntimeLLMConfig } from './src/server/llmProvider.ts';

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
