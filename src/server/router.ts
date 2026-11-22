/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Shared Server API & Attribution Router
 * Used identically by both Vite dev middleware (`vite.config.ts`) and the standalone
 * production Node server (`src/server/productionServer.ts`) for Cloud & Self-Hosted installs.
 */

import fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import { handleGenerateContent, handleGenerateImage, handleDiscoverAvatars, handleGenerateAiVideo } from './api.ts';
import { getLLMConfig, setRuntimeLLMConfig, getActiveImageProvider } from './llmProvider.ts';
import { generateHighEndAdSet, regenerateSingleAdVisual, applyImpeccableDirectionToAd } from './adSetEngine.ts';
import { loadWorkspace, saveWorkspace, saveDataUrlMedia, resolveMediaFile, listMediaFiles } from './storage.ts';
import { scrapeUrlContext, analyzeImageVisual } from './ingest.ts';
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
} from './delivery.ts';
import {
  listLearnedPatterns,
  recordLearnedPattern,
  toggleLearnedPattern,
  deleteLearnedPattern,
  synthesizeMemoryFromSignals,
} from './memory.ts';
import { runFullWebsiteBrandScan } from './brandScanner.ts';
import { getUsageSummary, clearUsageLedger } from './usageLedger.ts';
import { runOneClickOnboarding } from './onboard.ts';
import {
  getPublicAutomationsState,
  updateAutomationConnection,
  syncPlatformWorkflows,
  deployWorkflowToPlatform,
  triggerAutomationWorkflow,
} from './automations.ts';

let schedulerStarted = false;

export function ensureSchedulerRunning() {
  if (!schedulerStarted) {
    schedulerStarted = true;
    startBackgroundScheduler();
  }
}

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

/**
 * Handles all ADNETIKS `/api/*` and `/r/:slug` routes.
 * Returns `true` if the request was handled, or `false` to pass through to Vite / static SPA serving.
 */
export async function handleAdnetiksRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  ensureSchedulerRunning();
  const url = req.url || '';
  const method = req.method || 'GET';

  // Health & Deployment Mode Check (GET /api/health)
  if (url.startsWith('/api/health') && method === 'GET') {
    const llm = getLLMConfig();
    sendJson(res, 200, {
      ok: true,
      service: 'ADNETIKS',
      mode: process.env.ADNETIKS_DEPLOY_MODE || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
      uptimeSec: Math.round(process.uptime()),
      llmProvider: llm.provider,
      hasLlmKey: !!llm.apiKey || llm.provider === 'openai_compatible',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // 1-Click Full Website -> Brand + Avatars + First Campaign Onboarding (POST /api/onboard)
  if (url.startsWith('/api/onboard') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await runOneClickOnboarding(body);
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'One-Click Onboarding Error' });
    }
    return true;
  }

  // Multi-Source High-End 4-Ad Campaign Set Generator (POST /api/generate-ad-set)
  if (url.startsWith('/api/generate-ad-set') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await generateHighEndAdSet(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Ad Set Generation Error' });
    }
    return true;
  }

  // Single Ad Visual Regenerator (POST /api/regenerate-single-ad)
  if (url.startsWith('/api/regenerate-single-ad') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await regenerateSingleAdVisual(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Single Ad Visual Error' });
    }
    return true;
  }

  // Impeccable Creative Direction & Slop-Fix Engine (POST /api/impeccable-direct)
  if (url.startsWith('/api/impeccable-direct') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await applyImpeccableDirectionToAd(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Impeccable Direction Error' });
    }
    return true;
  }

  // Avatar Discovery Route (Offer-Derived Prospects)
  if (url.startsWith('/api/discover-avatars') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await handleDiscoverAvatars(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Avatar Discovery Error' });
    }
    return true;
  }

  // Content Generation Route
  if (url.startsWith('/api/generate-content') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await handleGenerateContent(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    }
    return true;
  }

  // Image Generation Route
  if (url.startsWith('/api/generate-image') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await handleGenerateImage(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'Image Generation Error' });
    }
    return true;
  }

  // AI Video Generation Route
  if (url.startsWith('/api/generate-ai-video') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await handleGenerateAiVideo(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || 'AI Video Generation Error' });
    }
    return true;
  }

  // Agnostic LLM / Code Assistant Configuration Route
  if (url.startsWith('/api/llm-config')) {
    if (method === 'GET') {
      const config = getLLMConfig();
      sendJson(res, 200, {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl || '',
        hasApiKey: !!config.apiKey,
        hasImageKey: !!getActiveImageProvider(),
        imageProvider: getActiveImageProvider(),
      });
      return true;
    }
    if (method === 'POST') {
      try {
        const body = await readJsonBody(req);
        setRuntimeLLMConfig(body);
        const updated = getLLMConfig();
        sendJson(res, 200, {
          success: true,
          provider: updated.provider,
          model: updated.model,
          baseUrl: updated.baseUrl || '',
          hasApiKey: !!updated.apiKey,
        });
      } catch (err: any) {
        sendJson(res, 400, { error: err.message });
      }
      return true;
    }
  }

  // Real Persistent Workspace DB Route (GET / PUT / POST /api/workspace)
  if (url.startsWith('/api/workspace')) {
    if (method === 'GET') {
      const ws = loadWorkspace();
      sendJson(res, 200, { ok: true, workspace: ws });
      return true;
    }
    if (method === 'PUT' || method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const saved = saveWorkspace(body);
        sendJson(res, 200, { ok: true, updatedAt: saved.updatedAt });
      } catch (err: any) {
        sendJson(res, 400, { error: err.message || 'Workspace save error' });
      }
      return true;
    }
  }

  // Real Persistent Media Vault Upload (POST /api/media/upload)
  if (url.startsWith('/api/media/upload') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const saved = saveDataUrlMedia(body.dataUrl, body.fileName);
      sendJson(res, 200, { ok: true, ...saved });
    } catch (err: any) {
      sendJson(res, 400, { error: err.message || 'Media upload error' });
    }
    return true;
  }

  // List or Stream Stored Media Files (GET /api/media or GET /api/media/:filename)
  if (url.startsWith('/api/media') && method === 'GET') {
    const urlPath = url.split('?')[0];
    if (urlPath === '/api/media' || urlPath === '/api/media/') {
      sendJson(res, 200, { ok: true, files: listMediaFiles() });
      return true;
    }
    const filename = decodeURIComponent(urlPath.replace(/^\/api\/media\//, ''));
    const resolved = resolveMediaFile(filename);
    if (!resolved) {
      res.statusCode = 404;
      res.end('Media not found');
      return true;
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
        return true;
      }
    }
    res.statusCode = 200;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', String(resolved.sizeBytes));
    res.setHeader('Content-Type', resolved.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    fs.createReadStream(resolved.fullPath).pipe(res);
    return true;
  }

  // Full Website Brand DNA & Screenshot Scanner (POST /api/brand-scan)
  if (url.startsWith('/api/brand-scan') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const scan = await runFullWebsiteBrandScan(body.url || '');
      sendJson(res, 200, scan);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Brand scan failed' });
    }
    return true;
  }

  // Real Live URL Scraper Route (POST /api/ingest-url)
  if (url.startsWith('/api/ingest-url') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const scraped = await scrapeUrlContext(body.url || '');
      sendJson(res, 200, scraped);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'URL scrape failed' });
    }
    return true;
  }

  // Multimodal Vision Screenshot / Flyer Analyzer (POST /api/analyze-image)
  if (url.startsWith('/api/analyze-image') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const analysis = await analyzeImageVisual(body.dataUrl || '', body.fileName, body.brandName);
      sendJson(res, 200, analysis);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Vision analysis failed' });
    }
    return true;
  }

  // Phase 2: Publishing Config (GET / POST /api/publish/config)
  if (url.startsWith('/api/publish/config')) {
    if (method === 'GET') {
      sendJson(res, 200, { ok: true, config: getPublicPublishConfig() });
      return true;
    }
    if (method === 'POST') {
      try {
        const body = await readJsonBody(req);
        updatePublishConfig(body);
        sendJson(res, 200, { ok: true, config: getPublicPublishConfig() });
      } catch (err: any) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return true;
    }
  }

  // Phase 2: Real Multi-Post Publishing Dispatch (POST /api/publish/dispatch)
  if (url.startsWith('/api/publish/dispatch') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const postsToSend = Array.isArray(body.posts) ? body.posts : body.post ? [body.post] : [];
      const results = [];
      for (const p of postsToSend) {
        const entry = await dispatchPostReal(p);
        results.push(entry);
      }
      sendJson(res, 200, { ok: true, results });
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Dispatch error' });
    }
    return true;
  }

  // Phase 2: Real Delivery Logs & Attribution Summary (GET /api/publish/logs)
  if (url.startsWith('/api/publish/logs') && method === 'GET') {
    const summary = getAttributionSummary();
    sendJson(res, 200, { ok: true, logs: summary.recentLogs, lastSchedulerTick: summary.lastSchedulerTick });
    return true;
  }

  // Phase 2: Real UTM Short-Link Minting & Listing (POST /api/utm/create, GET /api/utm)
  if (url.startsWith('/api/utm/create') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const link = createUtmTrackingLink(body);
      sendJson(res, 200, { ok: true, link });
    } catch (err: any) {
      sendJson(res, 400, { ok: false, error: err.message });
    }
    return true;
  }

  if (url.startsWith('/api/utm') && method === 'GET') {
    const summary = getAttributionSummary();
    sendJson(res, 200, { ok: true, links: summary.recentLinks, totalClicks: summary.totalClicks });
    return true;
  }

  // Phase 2: Real HTTP 302 Short-Link Redirector & Click Tracker (GET /r/:slug)
  if (url.startsWith('/r/') && method === 'GET') {
    const slug = url.split('?')[0].replace(/^\/r\//, '').trim();
    const resolved = resolveAndTrackUtmRedirect(slug);
    if (!resolved) {
      res.statusCode = 404;
      res.end('ADNETIKS tracking link not found');
      return true;
    }
    res.statusCode = 302;
    res.setHeader('Location', resolved.redirectUrl);
    res.end();
    return true;
  }

  // Phase 2: Real Conversion Pixel & Telemetry Collector (GET/POST/OPTIONS /api/events)
  if (url.startsWith('/api/events')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return true;
    }
    if (method === 'GET') {
      sendJson(res, 200, { ok: true, ...getAttributionSummary() });
      return true;
    }
    if (method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const event = recordConversionEvent(body);
        sendJson(res, 200, { ok: true, event, summary: getAttributionSummary() });
      } catch (err: any) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return true;
    }
  }

  // Phase 2: Embeddable First-Party Pixel Script (GET /api/pixel.js)
  if (url.startsWith('/api/pixel.js') && method === 'GET') {
    const host = req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const js = buildEmbeddablePixelScript(`${proto}://${host}`);
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.statusCode = 200;
    res.end(js);
    return true;
  }

  // Phase 3: Closed-Loop Brand Brain Memory Engine (/api/memory)
  if (url.startsWith('/api/memory/synthesize') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = synthesizeMemoryFromSignals(body.brandName);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message });
    }
    return true;
  }

  if (url.startsWith('/api/memory')) {
    const cleanUrl = url.split('?')[0];
    const idPart = cleanUrl.replace(/^\/api\/memory\/?/, '');

    if (method === 'GET' && !idPart) {
      sendJson(res, 200, { ok: true, ...listLearnedPatterns() });
      return true;
    }

    if (method === 'POST' && !idPart) {
      try {
        const body = await readJsonBody(req);
        const pattern = recordLearnedPattern(body);
        sendJson(res, 200, { ok: true, pattern, ...listLearnedPatterns() });
      } catch (err: any) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return true;
    }

    if (method === 'PATCH' && idPart) {
      try {
        const body = await readJsonBody(req);
        const updated = toggleLearnedPattern(decodeURIComponent(idPart), body.active);
        sendJson(res, updated ? 200 : 404, { ok: !!updated, pattern: updated, ...listLearnedPatterns() });
      } catch (err: any) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return true;
    }

    if (method === 'DELETE' && idPart) {
      const removed = deleteLearnedPattern(decodeURIComponent(idPart));
      sendJson(res, removed ? 200 : 404, { ok: removed, ...listLearnedPatterns() });
      return true;
    }
  }

  // Live AI Cost & Token Usage Ledger (/api/usage)
  if (url.startsWith('/api/usage')) {
    if (method === 'GET') {
      sendJson(res, 200, { ok: true, ...getUsageSummary() });
      return true;
    }
    if (method === 'DELETE') {
      clearUsageLedger();
      sendJson(res, 200, { ok: true, ...getUsageSummary() });
      return true;
    }
  }

  // Live n8n & Activepieces Workflow Automations Hub (/api/automations/*)
  if (url.startsWith('/api/automations/state') && method === 'GET') {
    sendJson(res, 200, { ok: true, ...getPublicAutomationsState() });
    return true;
  }

  if (url.startsWith('/api/automations/config') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const state = updateAutomationConnection(body);
      sendJson(res, 200, { ok: true, ...state });
    } catch (err: any) {
      sendJson(res, 400, { ok: false, error: err.message || 'Config update failed' });
    }
    return true;
  }

  if (url.startsWith('/api/automations/sync') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await syncPlatformWorkflows(body.platform);
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Workflow sync failed' });
    }
    return true;
  }

  if (url.startsWith('/api/automations/deploy') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await deployWorkflowToPlatform(body);
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Workflow deploy failed' });
    }
    return true;
  }

  if (url.startsWith('/api/automations/trigger') && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await triggerAutomationWorkflow(body);
      sendJson(res, 200, result);
    } catch (err: any) {
      sendJson(res, 500, { ok: false, error: err.message || 'Workflow trigger failed' });
    }
    return true;
  }

  return false;
}
