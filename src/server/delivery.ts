/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Phase 2: Real Publishing Bridge, Background Scheduler,
 * UTM Short-Link Redirector (/r/:slug) & Live Conversion Pixel Collector (/api/events)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { loadWorkspace, saveWorkspace } from './storage.ts';

const DATA_ROOT = path.resolve(process.cwd(), '.adnetiks-data');
const DELIVERY_FILE = path.join(DATA_ROOT, 'delivery.json');

export interface PublishConfig {
  mode: 'dry_run' | 'webhook' | 'postiz';
  webhookUrl: string;
  webhookSecret: string;
  postizBaseUrl: string;
  postizApiKey: string;
  autoDispatchEnabled: boolean;
  publicBaseUrl: string;
}

export interface DeliveryLogEntry {
  id: string;
  postId: string;
  campaignId: string;
  platform: string;
  mode: 'dry_run' | 'webhook' | 'postiz';
  status: 'published' | 'failed' | 'dry_run';
  httpStatus?: number;
  responseSnippet: string;
  trackingUrl?: string;
  dispatchedAt: string;
}

export interface UtmTrackingLink {
  slug: string;
  shortUrl: string;
  destinationUrl: string;
  campaignId: string;
  postId?: string;
  platform: string;
  variantLabel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  clicks: number;
  createdAt: string;
  lastClickedAt?: string;
}

export interface ConversionEventRecord {
  id: string;
  eventName: string;
  campaignId: string;
  postId?: string;
  platform?: string;
  variantLabel?: string;
  slug?: string;
  value?: number;
  url?: string;
  source: 'pixel' | 'utm_click' | 'webhook' | 'studio_test';
  timestamp: string;
}

export interface DeliveryStore {
  config: PublishConfig;
  logs: DeliveryLogEntry[];
  utmLinks: UtmTrackingLink[];
  events: ConversionEventRecord[];
  lastSchedulerTick?: string;
}

const DEFAULT_CONFIG: PublishConfig = {
  mode: 'dry_run',
  webhookUrl: process.env.ADNETIKS_PUBLISH_WEBHOOK_URL || '',
  webhookSecret: process.env.ADNETIKS_WEBHOOK_SECRET || '',
  postizBaseUrl: process.env.POSTIZ_API_URL || 'http://localhost:5000/api/v1',
  postizApiKey: process.env.POSTIZ_API_KEY || '',
  autoDispatchEnabled: false,
  publicBaseUrl: process.env.ADNETIKS_PUBLIC_URL || 'http://localhost:3000',
};

function ensureRoot() {
  if (!fs.existsSync(DATA_ROOT)) fs.mkdirSync(DATA_ROOT, { recursive: true });
}

export function loadDeliveryStore(): DeliveryStore {
  ensureRoot();
  if (!fs.existsSync(DELIVERY_FILE)) {
    return {
      config: { ...DEFAULT_CONFIG },
      logs: [],
      utmLinks: [],
      events: [],
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DELIVERY_FILE, 'utf-8')) as Partial<DeliveryStore>;
    return {
      config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      utmLinks: Array.isArray(parsed.utmLinks) ? parsed.utmLinks : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      lastSchedulerTick: parsed.lastSchedulerTick,
    };
  } catch {
    return {
      config: { ...DEFAULT_CONFIG },
      logs: [],
      utmLinks: [],
      events: [],
    };
  }
}

export function saveDeliveryStore(store: DeliveryStore): DeliveryStore {
  ensureRoot();
  const tmp = `${DELIVERY_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmp, DELIVERY_FILE);
  return store;
}

export function updatePublishConfig(partial: Partial<PublishConfig>): PublishConfig {
  const store = loadDeliveryStore();
  store.config = {
    ...store.config,
    ...partial,
  };
  saveDeliveryStore(store);
  return store.config;
}

export function getPublicPublishConfig(): Omit<PublishConfig, 'postizApiKey' | 'webhookSecret'> & {
  hasPostizKey: boolean;
  hasWebhookSecret: boolean;
} {
  const { config } = loadDeliveryStore();
  return {
    mode: config.mode,
    webhookUrl: config.webhookUrl,
    postizBaseUrl: config.postizBaseUrl,
    autoDispatchEnabled: config.autoDispatchEnabled,
    publicBaseUrl: config.publicBaseUrl,
    hasPostizKey: !!config.postizApiKey,
    hasWebhookSecret: !!config.webhookSecret,
  };
}

// ─── Real UTM Short-Link Builder & Redirector ────────────────────────────────

export function createUtmTrackingLink(input: {
  destinationUrl: string;
  campaignId?: string;
  postId?: string;
  platform?: string;
  variantLabel?: string;
}): UtmTrackingLink {
  const store = loadDeliveryStore();
  const cleanDest = (input.destinationUrl || 'https://adnetiks.io').trim();
  const safeDest = /^https?:\/\//i.test(cleanDest) ? cleanDest : `https://${cleanDest}`;
  const slug = crypto.randomBytes(4).toString('hex');
  const base = (store.config.publicBaseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const platform = (input.platform || 'social').toLowerCase();
  const campaignId = input.campaignId || 'camp-active';
  const variantLabel = input.variantLabel || 'Variant A';

  const link: UtmTrackingLink = {
    slug,
    shortUrl: `${base}/r/${slug}`,
    destinationUrl: safeDest,
    campaignId,
    postId: input.postId,
    platform,
    variantLabel,
    utmSource: platform,
    utmMedium: 'social',
    utmCampaign: campaignId,
    utmContent: variantLabel.toLowerCase().replace(/\s+/g, '_'),
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  store.utmLinks = [link, ...store.utmLinks].slice(0, 500);
  saveDeliveryStore(store);
  return link;
}

export function resolveAndTrackUtmRedirect(slug: string): { redirectUrl: string; link: UtmTrackingLink } | null {
  const store = loadDeliveryStore();
  const idx = store.utmLinks.findIndex((l) => l.slug === slug);
  if (idx === -1) return null;

  const link = store.utmLinks[idx];
  const now = new Date().toISOString();
  link.clicks += 1;
  link.lastClickedAt = now;
  store.utmLinks[idx] = link;

  // Record a real click event into the attribution event stream
  store.events = [
    {
      id: `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      eventName: 'LinkClick',
      campaignId: link.campaignId,
      postId: link.postId,
      platform: link.platform,
      variantLabel: link.variantLabel,
      slug: link.slug,
      url: link.destinationUrl,
      source: 'utm_click' as const,
      timestamp: now,
    },
    ...store.events,
  ].slice(0, 2000);

  saveDeliveryStore(store);

  // Append real UTM query parameters cleanly
  const target = new URL(link.destinationUrl);
  target.searchParams.set('utm_source', link.utmSource);
  target.searchParams.set('utm_medium', link.utmMedium);
  target.searchParams.set('utm_campaign', link.utmCampaign);
  target.searchParams.set('utm_content', link.utmContent);

  return { redirectUrl: target.toString(), link };
}

// ─── Real Conversion Pixel / Webhook Collector ───────────────────────────────

export function recordConversionEvent(input: {
  eventName: string;
  campaignId?: string;
  postId?: string;
  platform?: string;
  variantLabel?: string;
  slug?: string;
  value?: number;
  url?: string;
  source?: ConversionEventRecord['source'];
}): ConversionEventRecord {
  const store = loadDeliveryStore();
  const evt: ConversionEventRecord = {
    id: `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    eventName: (input.eventName || 'Lead').slice(0, 64),
    campaignId: input.campaignId || 'camp-active',
    postId: input.postId,
    platform: input.platform,
    variantLabel: input.variantLabel,
    slug: input.slug,
    value: typeof input.value === 'number' ? input.value : undefined,
    url: input.url,
    source: input.source || 'pixel',
    timestamp: new Date().toISOString(),
  };
  store.events = [evt, ...store.events].slice(0, 2000);
  saveDeliveryStore(store);
  return evt;
}

export function getAttributionSummary() {
  const store = loadDeliveryStore();
  const totalClicks = store.utmLinks.reduce((acc, l) => acc + l.clicks, 0);
  const conversions = store.events.filter((e) => e.eventName !== 'LinkClick' && e.eventName !== 'PageView');
  const pageViews = store.events.filter((e) => e.eventName === 'PageView');

  const byVariant: Record<string, { clicks: number; conversions: number }> = {};
  const byPlatform: Record<string, { clicks: number; conversions: number }> = {};

  for (const evt of store.events) {
    const vKey = evt.variantLabel || 'Unattributed';
    const pKey = (evt.platform || 'direct').toLowerCase();
    if (!byVariant[vKey]) byVariant[vKey] = { clicks: 0, conversions: 0 };
    if (!byPlatform[pKey]) byPlatform[pKey] = { clicks: 0, conversions: 0 };

    if (evt.eventName === 'LinkClick') {
      byVariant[vKey].clicks += 1;
      byPlatform[pKey].clicks += 1;
    } else if (evt.eventName !== 'PageView') {
      byVariant[vKey].conversions += 1;
      byPlatform[pKey].conversions += 1;
    }
  }

  return {
    totalClicks,
    totalPageViews: pageViews.length,
    totalConversions: conversions.length,
    totalEvents: store.events.length,
    totalLinks: store.utmLinks.length,
    totalDispatches: store.logs.length,
    publishedDispatches: store.logs.filter((l) => l.status === 'published').length,
    byVariant,
    byPlatform,
    recentEvents: store.events.slice(0, 25),
    recentLinks: store.utmLinks.slice(0, 20),
    recentLogs: store.logs.slice(0, 25),
    lastSchedulerTick: store.lastSchedulerTick || null,
  };
}

// ─── Real Publishing Bridge (Webhook / Postiz / Dry-Run) ─────────────────────

export interface DispatchPostInput {
  id: string;
  campaignId?: string;
  platform: string;
  variantLabel?: string;
  hookAngle?: string;
  content: string;
  hashtags?: string[];
  mediaUrl?: string;
  mediaType?: string;
  destinationUrl?: string;
  scheduledTime?: string;
}

export async function dispatchPostReal(post: DispatchPostInput): Promise<DeliveryLogEntry> {
  const store = loadDeliveryStore();
  const cfg = store.config;

  // Auto-mint a real UTM short tracking link if post has a destination URL
  let trackingUrl: string | undefined;
  if (post.destinationUrl) {
    const existing = store.utmLinks.find((l) => l.postId === post.id);
    if (existing) {
      trackingUrl = existing.shortUrl;
    } else {
      const minted = createUtmTrackingLink({
        destinationUrl: post.destinationUrl,
        campaignId: post.campaignId,
        postId: post.id,
        platform: post.platform,
        variantLabel: post.variantLabel,
      });
      trackingUrl = minted.shortUrl;
    }
  }

  const fullCaption = [
    post.content,
    trackingUrl ? `\n${trackingUrl}` : '',
    post.hashtags && post.hashtags.length > 0 ? `\n\n${post.hashtags.join(' ')}` : '',
  ]
    .filter(Boolean)
    .join('');

  const base = (cfg.publicBaseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const absoluteMediaUrl =
    post.mediaUrl && post.mediaUrl.startsWith('/') ? `${base}${post.mediaUrl}` : post.mediaUrl;

  const payload = {
    source: 'ADNETIKS',
    dispatchedAt: new Date().toISOString(),
    postId: post.id,
    campaignId: post.campaignId || 'camp-active',
    platform: post.platform,
    variantLabel: post.variantLabel || 'Variant A',
    hookAngle: post.hookAngle || '',
    content: fullCaption,
    rawContent: post.content,
    hashtags: post.hashtags || [],
    mediaUrl: absoluteMediaUrl,
    mediaType: post.mediaType || 'image',
    trackingUrl,
  };

  let entry: DeliveryLogEntry;

  if (cfg.mode === 'postiz' && cfg.postizBaseUrl && cfg.postizApiKey) {
    try {
      const endpoint = `${cfg.postizBaseUrl.replace(/\/$/, '')}/posts`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: cfg.postizApiKey,
        },
        body: JSON.stringify({
          type: 'now',
          date: post.scheduledTime || new Date().toISOString(),
          shortLink: false,
          posts: [
            {
              integration: { id: post.platform },
              value: [
                {
                  content: fullCaption,
                  image: absoluteMediaUrl ? [{ id: post.id, path: absoluteMediaUrl }] : [],
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });
      const text = (await res.text()).slice(0, 260);
      entry = {
        id: `del-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        postId: post.id,
        campaignId: post.campaignId || 'camp-active',
        platform: post.platform,
        mode: 'postiz',
        status: res.ok ? 'published' : 'failed',
        httpStatus: res.status,
        responseSnippet: res.ok ? `Postiz accepted (${res.status}): ${text || 'OK'}` : `Postiz error ${res.status}: ${text}`,
        trackingUrl,
        dispatchedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      entry = {
        id: `del-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        postId: post.id,
        campaignId: post.campaignId || 'camp-active',
        platform: post.platform,
        mode: 'postiz',
        status: 'failed',
        responseSnippet: `Postiz unreachable: ${err?.message || 'Network error'}`,
        trackingUrl,
        dispatchedAt: new Date().toISOString(),
      };
    }
  } else if (cfg.mode === 'webhook' && cfg.webhookUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cfg.webhookSecret) {
        const sig = crypto
          .createHmac('sha256', cfg.webhookSecret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-ADNETIKS-Signature'] = `sha256=${sig}`;
      }
      const res = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const text = (await res.text()).slice(0, 260);
      entry = {
        id: `del-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        postId: post.id,
        campaignId: post.campaignId || 'camp-active',
        platform: post.platform,
        mode: 'webhook',
        status: res.ok ? 'published' : 'failed',
        httpStatus: res.status,
        responseSnippet: res.ok ? `Webhook delivered (${res.status}): ${text || 'OK'}` : `Webhook HTTP ${res.status}: ${text}`,
        trackingUrl,
        dispatchedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      entry = {
        id: `del-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        postId: post.id,
        campaignId: post.campaignId || 'camp-active',
        platform: post.platform,
        mode: 'webhook',
        status: 'failed',
        responseSnippet: `Webhook unreachable: ${err?.message || 'Network error'}`,
        trackingUrl,
        dispatchedAt: new Date().toISOString(),
      };
    }
  } else {
    // Honest Dry-Run Sandbox mode (when no external Postiz/Webhook is configured yet)
    entry = {
      id: `del-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      postId: post.id,
      campaignId: post.campaignId || 'camp-active',
      platform: post.platform,
      mode: 'dry_run',
      status: 'dry_run',
      httpStatus: 200,
      responseSnippet: `Dry-Run Sandbox verified payload (${fullCaption.length} chars). Connect a Postiz API key or n8n/Zapier webhook URL to publish live.`,
      trackingUrl,
      dispatchedAt: new Date().toISOString(),
    };
  }

  const latest = loadDeliveryStore();
  latest.logs = [entry, ...latest.logs].slice(0, 300);
  saveDeliveryStore(latest);
  return entry;
}

// ─── Real Background Cron Worker (Checks Due Scheduled Posts Every 30s) ──────

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

export function startBackgroundScheduler() {
  if (schedulerHandle) return;
  schedulerHandle = setInterval(async () => {
    try {
      const store = loadDeliveryStore();
      store.lastSchedulerTick = new Date().toISOString();
      saveDeliveryStore(store);

      if (!store.config.autoDispatchEnabled) return;

      const ws = loadWorkspace();
      if (!ws || !Array.isArray(ws.posts) || ws.posts.length === 0) return;

      const nowMs = Date.now();
      let changed = false;

      for (const post of ws.posts) {
        if (post.status === 'scheduled' && post.scheduledTime) {
          const dueMs = Date.parse(post.scheduledTime);
          if (!Number.isNaN(dueMs) && dueMs <= nowMs) {
            const log = await dispatchPostReal(post);
            post.status = log.status === 'failed' ? 'failed' : 'published';
            changed = true;
          }
        }
      }

      if (changed) {
        saveWorkspace({ posts: ws.posts });
      }
    } catch (err) {
      console.warn('[scheduler] tick error:', err);
    }
  }, 30_000);
}

/**
 * Generates the embeddable first-party attribution pixel script served at `/api/pixel.js`.
 */
export function buildEmbeddablePixelScript(origin: string): string {
  const safeOrigin = origin.replace(/\/$/, '');
  return `/* ADNETIKS First-Party Attribution Pixel */
(function(){
  var s = document.currentScript;
  var camp = (s && s.getAttribute('data-campaign')) || 'camp-active';
  var params = new URLSearchParams(window.location.search);
  var utmSource = params.get('utm_source') || 'direct';
  var utmCampaign = params.get('utm_campaign') || camp;
  var utmContent = params.get('utm_content') || 'Variant A';
  function send(eventName, extra){
    var body = Object.assign({
      eventName: eventName,
      campaignId: utmCampaign,
      platform: utmSource,
      variantLabel: utmContent,
      url: window.location.href,
      source: 'pixel'
    }, extra || {});
    try {
      fetch('${safeOrigin}/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true
      });
    } catch(e){}
  }
  window.adnetiksTrack = send;
  send('PageView');
})();`;
}
