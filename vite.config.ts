import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { ensureSchedulerRunning, handleAdnetiksRequest } from './src/server/router.ts';

// Custom Vite plugin to mount the shared ADNETIKS API & Attribution router in dev
function apiServerPlugin(): Plugin {
  return {
    name: 'adnetiks-api-server',
    configureServer(server) {
      ensureSchedulerRunning();
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleAdnetiksRequest(req, res);
          if (!handled) next();
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
