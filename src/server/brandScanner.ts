/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Smart CDP Website Brand DNA & Visual Screenshot Scanner
 * Drives headless Chrome/Edge via Chrome DevTools Protocol (native Node WebSocket):
 * - Waits intelligently for SPA hydration, async fetches, and splash/booting loaders to clear
 * - Extracts LIVE rendered headings, body copy, computed CSS fonts & button accent colors
 * - Captures crisp Desktop (1440x900) & Mobile (430x932) screenshots into `.adnetiks-data/media/`
 */

import fs from 'fs';
import os from 'os';
import net from 'net';
import path from 'path';
import crypto from 'crypto';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { scrapeUrlContext, analyzeImageVisual } from './ingest.ts';

const execFileAsync = promisify(execFile);
const MEDIA_DIR = path.resolve(process.cwd(), '.adnetiks-data', 'media');

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function validatePublicUrl(raw: string): URL | null {
  try {
    const trimmed = raw.trim();
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (PRIVATE_HOST_PATTERNS.some((re) => re.test(u.hostname))) return null;
    return u;
  } catch {
    return null;
  }
}

function findBrowserExecutable(): string | null {
  const candidates = [
    process.env.ADNETIKS_CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 9222;
      srv.close(() => resolve(port));
    });
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CdpCaptureResult {
  desktopOk: boolean;
  mobileOk: boolean;
  renderedTitle?: string;
  renderedHeadings: string[];
  renderedBodyExcerpt?: string;
  computedFonts: string[];
  computedAccentColors: string[];
  faviconUrl?: string;
}

/**
 * Connects to headless Chrome via CDP, waits for SPA boot/splash loaders to finish,
 * extracts live rendered DOM text/fonts/accent colors, and captures Desktop + Mobile PNGs.
 */
async function captureViaSmartCdp(
  browserPath: string,
  targetUrl: string,
  desktopOutFile: string,
  mobileOutFile: string
): Promise<CdpCaptureResult> {
  const port = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adnetiks-cdp-'));

  const proc = spawn(
    browserPath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let ws: WebSocket | null = null;

  try {
    // 1. Wait for Chrome CDP endpoint to come online
    let pageWsUrl: string | null = null;
    for (let i = 0; i < 30; i++) {
      try {
        const listRes = await fetch(`http://127.0.0.1:${port}/json/list`, {
          signal: AbortSignal.timeout(1000),
        });
        if (listRes.ok) {
          const pages = (await listRes.json()) as any[];
          const pageTarget = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
          if (pageTarget) {
            pageWsUrl = pageTarget.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {
        // retry
      }
      await sleep(200);
    }

    if (!pageWsUrl) {
      throw new Error('CDP endpoint did not start in time');
    }

    // 2. Open native WebSocket to CDP
    ws = new WebSocket(pageWsUrl);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('CDP WS open timeout')), 5000);
      ws!.addEventListener('open', () => {
        clearTimeout(t);
        resolve();
      });
      ws!.addEventListener('error', (err) => {
        clearTimeout(t);
        reject(err);
      });
    });

    let msgId = 1;
    const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

    ws.addEventListener('message', (ev: any) => {
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
        if (msg.id && pending.has(msg.id)) {
          const handler = pending.get(msg.id)!;
          pending.delete(msg.id);
          if (msg.error) handler.reject(new Error(msg.error.message || 'CDP error'));
          else handler.resolve(msg.result);
        }
      } catch {
        // ignore
      }
    });

    const sendCdp = (method: string, params: Record<string, any> = {}, timeoutMs = 15000): Promise<any> => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, timeoutMs);
        pending.set(id, {
          resolve: (v) => {
            clearTimeout(timer);
            resolve(v);
          },
          reject: (e) => {
            clearTimeout(timer);
            reject(e);
          },
        });
        ws!.send(JSON.stringify({ id, method, params }));
      });
    };

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 3. Navigate to target URL
    await sendCdp('Page.navigate', { url: targetUrl });

    // 4. Smart Hydration & Splash-Loader Wait Loop (up to 15 seconds)
    const readinessExpr = `(() => {
      const text = (document.body && document.body.innerText ? document.body.innerText : '').trim();
      const lower = text.toLowerCase();
      const hasLoaderPhrase =
        text.length < 480 &&
        /(booting|loading\\.{2,3}|initializing|starting engine|please wait|just a moment)/i.test(lower);
      const headingsCount = document.querySelectorAll('h1, h2').length;
      const ready = document.readyState === 'complete' && !hasLoaderPhrase && (text.length >= 260 || headingsCount >= 1);
      return { ready, textLen: text.length, headingsCount, hasLoaderPhrase, readyState: document.readyState };
    })()`;

    let stableHits = 0;
    let lastTextLen = 0;
    const waitDeadline = Date.now() + 15000;

    while (Date.now() < waitDeadline) {
      await sleep(500);
      try {
        const evalRes = await sendCdp('Runtime.evaluate', {
          expression: readinessExpr,
          returnByValue: true,
        });
        const val = evalRes?.result?.value;
        if (val?.ready) {
          if (Math.abs(val.textLen - lastTextLen) < 25) {
            stableHits += 1;
          } else {
            stableHits = 0;
          }
          lastTextLen = val.textLen;
          if (stableHits >= 2) break; // DOM settled cleanly for ~1s!
        }
      } catch {
        // still navigating
      }
    }

    // Extra settle delay for web fonts & fade-in CSS animations
    await sleep(900);

    // 5. Extract LIVE rendered DOM text, headings, fonts & button accent colors
    const domExtractExpr = `(() => {
      const rgbToHex = (rgbStr) => {
        const m = (rgbStr || '').match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/i);
        if (!m) return null;
        if (m[4] !== undefined && parseFloat(m[4]) < 0.25) return null;
        const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
        // Skip pure white/black/grays when collecting accents
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max - min < 28) return null;
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      };

      const headings = Array.from(document.querySelectorAll('h1, h2'))
        .map(el => (el.innerText || '').replace(/\\s+/g, ' ').trim())
        .filter(t => t.length >= 4 && t.length <= 160)
        .slice(0, 6);

      const fonts = [];
      const ignoreFonts = new Set(['sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'arial', 'helvetica', '-apple-system', 'blinkmacsystemfont', 'segoe ui']);
      for (const sel of ['h1', 'h2', 'body', 'button']) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const ff = getComputedStyle(el).fontFamily || '';
        for (const part of ff.split(',')) {
          const clean = part.replace(/['"]/g, '').trim();
          if (clean && !ignoreFonts.has(clean.toLowerCase()) && !fonts.includes(clean)) {
            fonts.push(clean);
          }
          if (fonts.length >= 3) break;
        }
      }

      const accents = [];
      const els = document.querySelectorAll('a, button, [class*="btn"], [class*="primary"], [class*="accent"], header *');
      for (const el of Array.from(els).slice(0, 120)) {
        const cs = getComputedStyle(el);
        for (const prop of [cs.backgroundColor, cs.color, cs.borderColor]) {
          const hx = rgbToHex(prop);
          if (hx && !accents.includes(hx)) accents.push(hx);
          if (accents.length >= 6) break;
        }
        if (accents.length >= 6) break;
      }

      const iconEl = document.querySelector('link[rel*="apple-touch-icon"], link[rel*="icon"]');
      const faviconUrl = iconEl ? iconEl.href : '';

      return {
        title: document.title || '',
        headings,
        bodyExcerpt: ((document.body && document.body.innerText) || '').replace(/\\s+/g, ' ').trim().slice(0, 1500),
        fonts,
        accents,
        faviconUrl
      };
    })()`;

    let renderedTitle = '';
    let renderedHeadings: string[] = [];
    let renderedBodyExcerpt = '';
    let computedFonts: string[] = [];
    let computedAccentColors: string[] = [];
    let faviconUrl: string | undefined;

    try {
      const domRes = await sendCdp('Runtime.evaluate', {
        expression: domExtractExpr,
        returnByValue: true,
      });
      const v = domRes?.result?.value;
      if (v) {
        renderedTitle = v.title || '';
        renderedHeadings = Array.isArray(v.headings) ? v.headings : [];
        renderedBodyExcerpt = v.bodyExcerpt || '';
        computedFonts = Array.isArray(v.fonts) ? v.fonts : [];
        computedAccentColors = Array.isArray(v.accents) ? v.accents : [];
        if (v.faviconUrl) faviconUrl = v.faviconUrl;
      }
    } catch {
      // keep defaults
    }

    // 6. Capture Crisp Desktop (1440x900) Screenshot
    let desktopOk = false;
    try {
      const deskCap = await sendCdp('Page.captureScreenshot', { format: 'png' });
      if (deskCap?.data) {
        fs.writeFileSync(desktopOutFile, Buffer.from(deskCap.data, 'base64'));
        desktopOk = fs.statSync(desktopOutFile).size > 2000;
      }
    } catch {
      desktopOk = false;
    }

    // 7. Resize to Mobile (430x932), let responsive layout reflow, & capture Mobile Screenshot
    let mobileOk = false;
    try {
      await sendCdp('Emulation.setDeviceMetricsOverride', {
        width: 430,
        height: 932,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await sleep(750);
      const mobCap = await sendCdp('Page.captureScreenshot', { format: 'png' });
      if (mobCap?.data) {
        fs.writeFileSync(mobileOutFile, Buffer.from(mobCap.data, 'base64'));
        mobileOk = fs.statSync(mobileOutFile).size > 2000;
      }
    } catch {
      mobileOk = false;
    }

    return {
      desktopOk,
      mobileOk,
      renderedTitle,
      renderedHeadings,
      renderedBodyExcerpt,
      computedFonts,
      computedAccentColors,
      faviconUrl,
    };
  } finally {
    try {
      ws?.close();
    } catch {}
    try {
      proc.kill('SIGKILL');
    } catch {}
    // Best-effort cleanup of temp Chrome profile
    setTimeout(() => {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {}
    }, 1000);
  }
}

interface ExtractedPalette {
  primary: string;
  secondary: string;
  background: string;
  textOnPrimary: string;
  swatches: string[];
}

function getContrastText(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 165 ? '#0A0A0C' : '#FFFFFF';
}

async function extractPaletteFromPng(pngPath: string): Promise<ExtractedPalette | null> {
  const pyScript = `
import sys, json, colorsys
from PIL import Image

img = Image.open(sys.argv[1]).convert('RGB')
img.thumbnail((240, 240))
quant = img.quantize(colors=16, method=Image.Quantize.MEDIANCUT).convert('RGB')
counts = quant.getcolors(240 * 240) or []
counts.sort(key=lambda x: x[0], reverse=True)

def to_hex(rgb):
    return '#{:02X}{:02X}{:02X}'.format(*rgb)

def sat_lum(rgb):
    r, g, b = [c / 255.0 for c in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return s, l

def dist(a, b):
    return ((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2) ** 0.5

bg_rgb = counts[0][1] if counts else (10, 10, 12)
distinct = []
for cnt, rgb in counts:
    if all(dist(rgb, d[1]) > 35 for d in distinct):
        distinct.append((cnt, rgb))

accents = []
for cnt, rgb in distinct:
    s, l = sat_lum(rgb)
    if s > 0.28 and 0.14 < l < 0.85:
        accents.append((cnt * (0.4 + s * 2.2), rgb))

accents.sort(key=lambda x: x[0], reverse=True)

primary_rgb = accents[0][1] if accents else (distinct[1][1] if len(distinct) > 1 else (232, 25, 44))
secondary_rgb = accents[1][1] if len(accents) > 1 else (distinct[2][1] if len(distinct) > 2 else (6, 182, 212))

pr, pg, pb = primary_rgb
yiq = (pr * 299 + pg * 587 + pb * 114) / 1000
text_on_primary = '#0A0A0C' if yiq >= 165 else '#FFFFFF'

swatches = []
for rgb in [primary_rgb, secondary_rgb, bg_rgb] + [d[1] for d in distinct]:
    hx = to_hex(rgb)
    if hx not in swatches:
        swatches.append(hx)
    if len(swatches) >= 5:
        break

print(json.dumps({
    'primary': to_hex(primary_rgb),
    'secondary': to_hex(secondary_rgb),
    'background': to_hex(bg_rgb),
    'textOnPrimary': text_on_primary,
    'swatches': swatches
}))
`;

  try {
    const { stdout } = await execFileAsync('python', ['-c', pyScript, pngPath], { timeout: 8000 });
    return JSON.parse(stdout.trim()) as ExtractedPalette;
  } catch (err) {
    console.warn('[brand-scan] Palette extraction fallback:', err);
    return null;
  }
}

export interface BrandScanResult {
  ok: boolean;
  url: string;
  domain: string;
  brandName: string;
  tagline: string;
  siteType: string;
  desktopScreenshotUrl?: string;
  mobileScreenshotUrl?: string;
  ogImageUrl?: string;
  faviconUrl?: string;
  palette: ExtractedPalette;
  fonts: string[];
  headings: string[];
  description: string;
  visualVibe: string;
  suggestedHook: string;
  summaryText: string;
  error?: string;
}

export async function runFullWebsiteBrandScan(rawUrl: string): Promise<BrandScanResult> {
  const parsed = validatePublicUrl(rawUrl);
  if (!parsed) {
    return {
      ok: false,
      url: rawUrl,
      domain: '',
      brandName: '',
      tagline: '',
      siteType: 'web',
      palette: {
        primary: '#E8192C',
        secondary: '#06B6D4',
        background: '#0A0A0C',
        textOnPrimary: '#FFFFFF',
        swatches: ['#E8192C', '#06B6D4', '#0A0A0C'],
      },
      fonts: [],
      headings: [],
      description: '',
      visualVibe: '',
      suggestedHook: '',
      summaryText: rawUrl,
      error: 'Please enter a valid public http(s) website URL.',
    };
  }

  ensureMediaDir();
  const domain = parsed.hostname.replace(/^www\./, '');
  const slugSafe = domain.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24);
  const token = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const desktopFilename = `scan_desktop_${slugSafe}_${token}.png`;
  const mobileFilename = `scan_mobile_${slugSafe}_${token}.png`;
  const desktopPath = path.join(MEDIA_DIR, desktopFilename);
  const mobilePath = path.join(MEDIA_DIR, mobileFilename);

  const browserPath = findBrowserExecutable();

  // Run HTML scrape + Smart CDP Live Browser Render (waits for SPA boot/splash loaders!) in parallel
  const [scraped, cdp] = await Promise.all([
    scrapeUrlContext(parsed.toString()),
    browserPath
      ? captureViaSmartCdp(browserPath, parsed.toString(), desktopPath, mobilePath).catch((err) => {
          console.warn('[brand-scan] Smart CDP failed:', err);
          return {
            desktopOk: false,
            mobileOk: false,
            renderedHeadings: [],
            computedFonts: [],
            computedAccentColors: [],
          } as CdpCaptureResult;
        })
      : Promise.resolve({
          desktopOk: false,
          mobileOk: false,
          renderedHeadings: [],
          computedFonts: [],
          computedAccentColors: [],
        } as CdpCaptureResult),
  ]);

  // Extract visual palette from the real hydrated Desktop screenshot, enriched with computed DOM button accent colors!
  let palette: ExtractedPalette = {
    primary: cdp.computedAccentColors[0] || '#E8192C',
    secondary: cdp.computedAccentColors[1] || '#06B6D4',
    background: '#0A0A0C',
    textOnPrimary: getContrastText(cdp.computedAccentColors[0] || '#E8192C'),
    swatches:
      cdp.computedAccentColors.length > 0
        ? [...cdp.computedAccentColors, '#0A0A0C', '#FFFFFF'].slice(0, 5)
        : ['#E8192C', '#06B6D4', '#0A0A0C', '#18181F', '#F8FAFC'],
  };

  if (cdp.desktopOk) {
    const extracted = await extractPaletteFromPng(desktopPath);
    if (extracted) {
      // Prefer real CSS button/CTA accent color from live DOM as primary when detected!
      const primary = cdp.computedAccentColors[0] || extracted.primary;
      const secondary = cdp.computedAccentColors[1] || extracted.secondary;
      const mergedSwatches: string[] = [];
      for (const hx of [primary, secondary, ...cdp.computedAccentColors, ...extracted.swatches]) {
        if (hx && !mergedSwatches.includes(hx)) mergedSwatches.push(hx);
        if (mergedSwatches.length >= 5) break;
      }
      palette = {
        primary,
        secondary,
        background: extracted.background,
        textOnPrimary: getContrastText(primary),
        swatches: mergedSwatches,
      };
    }
  }

  // Merge live hydrated headings & title (works on client-side React/Next SPAs!)
  const bestTitle = cdp.renderedTitle || scraped.title || domain;
  const bestHeadings = cdp.renderedHeadings.length > 0 ? cdp.renderedHeadings : scraped.headings;
  const bestDescription = scraped.description || bestHeadings[0] || (cdp.renderedBodyExcerpt || '').slice(0, 180);

  const rawBrand = bestTitle.split(/[|\-–—:·]/)[0].trim();
  const brandName =
    rawBrand.length >= 2 && rawBrand.length <= 36
      ? rawBrand
      : domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  let visualVibe = `Live rendered ${scraped.siteType} experience anchored by ${palette.primary} & ${palette.secondary}`;
  let suggestedHook = bestHeadings[0] || bestDescription || `Discover ${brandName} — built to stand out.`;

  if (cdp.desktopOk) {
    try {
      const b64 = fs.readFileSync(desktopPath).toString('base64');
      const vision = await analyzeImageVisual(`data:image/png;base64,${b64}`, brandName, brandName);
      if (vision.provider !== 'local_metadata') {
        if (vision.visualVibe) visualVibe = vision.visualVibe;
        if (vision.suggestedHook) suggestedHook = vision.suggestedHook;
      }
    } catch {
      // keep extracted vibe
    }
  }

  const fonts = cdp.computedFonts.length > 0 ? cdp.computedFonts : ['Plus Jakarta Sans', 'Inter'];

  return {
    ok: true,
    url: parsed.toString(),
    domain,
    brandName,
    tagline: bestDescription || `${brandName} Official Experience`,
    siteType: scraped.siteType || 'web',
    desktopScreenshotUrl: cdp.desktopOk ? `/api/media/${desktopFilename}` : scraped.ogImage,
    mobileScreenshotUrl: cdp.mobileOk
      ? `/api/media/${mobileFilename}`
      : cdp.desktopOk
      ? `/api/media/${desktopFilename}`
      : scraped.ogImage,
    ogImageUrl: scraped.ogImage,
    faviconUrl: cdp.faviconUrl || `${parsed.origin}/favicon.ico`,
    palette,
    fonts,
    headings: bestHeadings,
    description: bestDescription,
    visualVibe,
    suggestedHook,
    summaryText: [
      `Brand Scanned (Live Hydrated SPA): ${brandName} (${parsed.toString()})`,
      `Brand Colors: Primary ${palette.primary}, Secondary ${palette.secondary}, Background ${palette.background}`,
      `Typography: ${fonts.join(', ')}`,
      bestHeadings.length > 0 ? `Live Headings: ${bestHeadings.join(' | ')}` : '',
      cdp.renderedBodyExcerpt ? `Live Rendered Copy: ${cdp.renderedBodyExcerpt.slice(0, 900)}` : scraped.summaryText,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
