/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Smart Multi-Page CDP Website Brand DNA & Deep Site Crawler
 * Drives headless Chrome/Edge via Chrome DevTools Protocol (native Node WebSocket):
 * - Waits intelligently for SPA hydration, async fetches, and splash/booting loaders to clear
 * - Crawls BOTH classic <a href> internal pages AND React SPA <nav>/<header> button views (up to 5 pages)
 * - Captures permanent Desktop (1440x900) screenshots for every crawled page + Mobile (430x932) hero capture
 * - Extracts full-site Brand Dossier (headings, copy, computed CSS fonts & exact brand hex palette)
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

export interface CrawledPageInsight {
  label: string;
  path: string;
  title: string;
  headings: string[];
  excerpt: string;
  screenshotUrl?: string;
}

interface CdpCaptureResult {
  desktopOk: boolean;
  mobileOk: boolean;
  renderedTitle?: string;
  renderedHeadings: string[];
  renderedBodyExcerpt?: string;
  computedFonts: string[];
  computedAccentColors: string[];
  faviconUrl?: string;
  crawledPages: CrawledPageInsight[];
}

/**
 * Connects to headless Chrome via CDP, waits for SPA hydration, captures Homepage Desktop + Mobile,
 * AND crawls up to 4 top internal brand/product/comparison/about pages (both <a href> and SPA buttons).
 */
async function captureViaSmartCdp(
  browserPath: string,
  targetUrl: string,
  slugSafe: string,
  token: string,
  desktopOutFile: string,
  mobileOutFile: string,
  desktopFilename: string
): Promise<CdpCaptureResult> {
  const port = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adnetiks-cdp-'));
  const origin = new URL(targetUrl).origin;

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
    // 1. Wait for Chrome CDP endpoint
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

    const waitForHydration = async (maxWaitMs = 12000) => {
      const readinessExpr = `(() => {
        const text = (document.body && document.body.innerText ? document.body.innerText : '').trim();
        const lower = text.toLowerCase();
        const hasLoaderPhrase =
          text.length < 480 &&
          /(booting|loading\\.{2,3}|initializing|starting engine|please wait|just a moment)/i.test(lower);
        const headingsCount = document.querySelectorAll('h1, h2').length;
        const ready = document.readyState === 'complete' && !hasLoaderPhrase && (text.length >= 220 || headingsCount >= 1);
        return { ready, textLen: text.length, headingsCount, hasLoaderPhrase };
      })()`;

      let stableHits = 0;
      let lastTextLen = 0;
      const deadline = Date.now() + maxWaitMs;
      while (Date.now() < deadline) {
        await sleep(450);
        try {
          const evalRes = await sendCdp('Runtime.evaluate', {
            expression: readinessExpr,
            returnByValue: true,
          });
          const val = evalRes?.result?.value;
          if (val?.ready) {
            if (Math.abs(val.textLen - lastTextLen) < 25) stableHits += 1;
            else stableHits = 0;
            lastTextLen = val.textLen;
            if (stableHits >= 2) break;
          }
        } catch {
          // navigating
        }
      }
      await sleep(750);
    };

    const extractPageContent = async (): Promise<{ title: string; headings: string[]; excerpt: string }> => {
      try {
        const res = await sendCdp('Runtime.evaluate', {
          expression: `(() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
              .map(el => (el.innerText || '').replace(/\\s+/g, ' ').trim())
              .filter(t => t.length >= 4 && t.length <= 160);
            const uniqHeadings = [];
            for (const h of headings) {
              if (!uniqHeadings.includes(h)) uniqHeadings.push(h);
              if (uniqHeadings.length >= 6) break;
            }
            const mainEl = document.querySelector('main') || document.body;
            const excerpt = ((mainEl && mainEl.innerText) || '').replace(/\\s+/g, ' ').trim().slice(0, 1200);
            return { title: document.title || '', headings: uniqHeadings, excerpt };
          })()`,
          returnByValue: true,
        });
        return res?.result?.value || { title: '', headings: [], excerpt: '' };
      } catch {
        return { title: '', headings: [], excerpt: '' };
      }
    };

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 2. Load Homepage & wait for full hydration
    await sendCdp('Page.navigate', { url: targetUrl });
    await waitForHydration(15000);

    // 3. Extract Homepage Brand DNA (fonts, accents, favicon, headings, copy)
    const domExtractExpr = `(() => {
      const rgbToHex = (rgbStr) => {
        const m = (rgbStr || '').match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/i);
        if (!m) return null;
        if (m[4] !== undefined && parseFloat(m[4]) < 0.25) return null;
        const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max - min < 28) return null;
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      };

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

      // Discover internal navigation targets (both <a href> AND SPA <nav>/<header> buttons!)
      const skipRe = /\\b(sign\\s*in|log\\s*in|login|sign\\s*up|create\\s*account|register|privacy|terms|cookie|legal|logout|cart|checkout|support|help\\s*center|status|v\\d+\\.\\d+)\\b/i;
      const priorityRe = /\\b(compar|doctrine|provider|carrier|about|feature|pricing|product|service|how\\s*it\\s*works|solution|mission|story|tour|shop|merch|music|catalog|why)/i;

      const navLinks = [];
      const seenKeys = new Set(['home']);

      const anchors = Array.from(document.querySelectorAll('header a[href], nav a[href], a[href]'));
      for (const a of anchors) {
        const label = (a.innerText || a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
        const href = a.href || '';
        if (!label || label.length < 3 || label.length > 36) continue;
        if (!href.startsWith(${JSON.stringify(origin)})) continue;
        if (href.includes('#') && href.split('#')[0] === window.location.href.split('#')[0]) continue;
        if (href.replace(/\\/$/, '') === window.location.href.replace(/\\/$/, '')) continue;
        if (skipRe.test(label) || skipRe.test(href)) continue;
        const pathKey = new URL(href).pathname.replace(/\\/$/, '').toLowerCase();
        const labelKey = label.toLowerCase();
        if (seenKeys.has(labelKey) || (pathKey && seenKeys.has(pathKey))) continue;
        seenKeys.add(labelKey);
        if (pathKey) seenKeys.add(pathKey);
        const inNav = !!a.closest('header, nav');
        const score = (inNav ? 14 : 2) + (priorityRe.test(label) || priorityRe.test(href) ? 25 : 0);
        navLinks.push({ kind: 'href', label, href, score });
      }

      const navButtons = [];
      const buttons = Array.from(document.querySelectorAll('header button, nav button'));
      for (const b of buttons) {
        const label = (b.innerText || '').replace(/\\s+/g, ' ').trim();
        if (!label || label.length < 3 || label.length > 36) continue;
        if (skipRe.test(label)) continue;
        const labelKey = label.toLowerCase();
        const slugPath = '/' + labelKey.replace(/[^a-z0-9]+/g, '-');
        if (seenKeys.has(labelKey) || seenKeys.has(slugPath)) continue;
        seenKeys.add(labelKey);
        seenKeys.add(slugPath);
        const score = 18 + (priorityRe.test(label) ? 25 : 0);
        navButtons.push({ kind: 'button', label, score });
      }

      return {
        fonts,
        accents,
        faviconUrl,
        navTargets: [...navButtons, ...navLinks].sort((a, b) => b.score - a.score).slice(0, 5)
      };
    })()`;

    const homePageContent = await extractPageContent();
    let computedFonts: string[] = [];
    let computedAccentColors: string[] = [];
    let faviconUrl: string | undefined;
    let navTargets: Array<{ kind: 'href' | 'button'; label: string; href?: string }> = [];

    try {
      const domRes = await sendCdp('Runtime.evaluate', {
        expression: domExtractExpr,
        returnByValue: true,
      });
      const v = domRes?.result?.value;
      if (v) {
        computedFonts = Array.isArray(v.fonts) ? v.fonts : [];
        computedAccentColors = Array.isArray(v.accents) ? v.accents : [];
        if (v.faviconUrl) faviconUrl = v.faviconUrl;
        if (Array.isArray(v.navTargets)) navTargets = v.navTargets;
      }
    } catch {
      // keep defaults
    }

    // 4. Capture Homepage Desktop Screenshot (1440x900)
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

    const crawledPages: CrawledPageInsight[] = [
      {
        label: 'Home',
        path: '/',
        title: homePageContent.title || 'Home',
        headings: homePageContent.headings,
        excerpt: homePageContent.excerpt,
        screenshotUrl: desktopOk ? `/api/media/${desktopFilename}` : undefined,
      },
    ];

    // 5. Multi-Page Deep Site Crawl (Up to 4 Top Internal Pages / SPA Views!)
    for (let i = 0; i < navTargets.length; i++) {
      const target = navTargets[i];
      try {
        const beforeText = (await extractPageContent()).excerpt.slice(0, 120);
        let pagePath = `/${target.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        if (target.kind === 'href' && target.href) {
          pagePath = new URL(target.href).pathname || '/';
          await sendCdp('Page.navigate', { url: target.href });
          await waitForHydration(7000);
        } else {
          // Click SPA nav button cleanly & scroll to top
          await sendCdp('Runtime.evaluate', {
            expression: `(() => {
              const btns = Array.from(document.querySelectorAll('header button, nav button'));
              const match = btns.find(b => (b.innerText || '').replace(/\\s+/g, ' ').trim().toLowerCase() === ${JSON.stringify(target.label.toLowerCase())});
              if (match) { match.click(); window.scrollTo(0, 0); return true; }
              return false;
            })()`,
            returnByValue: true,
          });
          await sleep(1400);
          await waitForHydration(5000);
          pagePath = `nav:${target.label}`;
        }

        const subContent = await extractPageContent();
        const contentSig = `${subContent.headings[0] || ''}|${subContent.excerpt.slice(0, 140)}`;
        const alreadySeen = crawledPages.some(
          (p) => `${p.headings[0] || ''}|${p.excerpt.slice(0, 140)}` === contentSig
        );
        // Skip duplicate if page content didn't actually change or duplicates an already captured page
        if (
          subContent.excerpt.length < 60 ||
          alreadySeen ||
          (subContent.excerpt.slice(0, 120) === beforeText && target.kind === 'button')
        ) {
          continue;
        }

        const pageSlug = target.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20);
        const subFilename = `scan_page_${slugSafe}_${pageSlug}_${token}.png`;
        const subPath = path.join(MEDIA_DIR, subFilename);
        let subShotOk = false;
        try {
          const subCap = await sendCdp('Page.captureScreenshot', { format: 'png' });
          if (subCap?.data) {
            fs.writeFileSync(subPath, Buffer.from(subCap.data, 'base64'));
            subShotOk = fs.statSync(subPath).size > 2000;
          }
        } catch {
          subShotOk = false;
        }

        crawledPages.push({
          label: target.label,
          path: pagePath,
          title: subContent.title || target.label,
          headings: subContent.headings,
          excerpt: subContent.excerpt,
          screenshotUrl: subShotOk ? `/api/media/${subFilename}` : undefined,
        });
      } catch {
        // Continue to next page even if one sub-page times out
      }
    }

    // 6. Navigate back to Homepage & Capture Responsive Mobile Hero (430x932)
    let mobileOk = false;
    try {
      await sendCdp('Emulation.setDeviceMetricsOverride', {
        width: 430,
        height: 932,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await sendCdp('Page.navigate', { url: targetUrl });
      await waitForHydration(8000);
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
      renderedTitle: homePageContent.title,
      renderedHeadings: homePageContent.headings,
      renderedBodyExcerpt: homePageContent.excerpt,
      computedFonts,
      computedAccentColors,
      faviconUrl,
      crawledPages,
    };
  } finally {
    try {
      ws?.close();
    } catch {}
    try {
      proc.kill('SIGKILL');
    } catch {}
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
  crawledPages: CrawledPageInsight[];
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
      crawledPages: [],
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

  const [scraped, cdp] = await Promise.all([
    scrapeUrlContext(parsed.toString()),
    browserPath
      ? captureViaSmartCdp(
          browserPath,
          parsed.toString(),
          slugSafe,
          token,
          desktopPath,
          mobilePath,
          desktopFilename
        ).catch((err) => {
          console.warn('[brand-scan] Smart CDP failed:', err);
          return {
            desktopOk: false,
            mobileOk: false,
            renderedHeadings: [],
            computedFonts: [],
            computedAccentColors: [],
            crawledPages: [],
          } as CdpCaptureResult;
        })
      : Promise.resolve({
          desktopOk: false,
          mobileOk: false,
          renderedHeadings: [],
          computedFonts: [],
          computedAccentColors: [],
          crawledPages: [],
        } as CdpCaptureResult),
  ]);

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

  const bestTitle = cdp.renderedTitle || scraped.title || domain;
  const allHeadings: string[] = [];
  for (const h of [
    ...cdp.renderedHeadings,
    ...cdp.crawledPages.flatMap((p) => p.headings),
    ...scraped.headings,
  ]) {
    if (h && !allHeadings.includes(h)) allHeadings.push(h);
    if (allHeadings.length >= 14) break;
  }

  const bestDescription = scraped.description || allHeadings[0] || (cdp.renderedBodyExcerpt || '').slice(0, 180);

  const rawBrand = bestTitle.split(/[|\-–—:·]/)[0].trim();
  const brandName =
    rawBrand.length >= 2 && rawBrand.length <= 36
      ? rawBrand
      : domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  let visualVibe = `Full-site (${cdp.crawledPages.length || 1} pages) ${scraped.siteType} brand anchored by ${palette.primary} & ${palette.secondary}`;
  let suggestedHook = allHeadings[0] || bestDescription || `Discover ${brandName} — built to stand out.`;

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

  // Assemble the Full-Site Multi-Page Brand Dossier for AI Campaign Synthesis!
  const pageDossierLines = cdp.crawledPages.map(
    (p) =>
      `[PAGE: ${p.label} (${p.path})]\nHeadings: ${p.headings.slice(0, 4).join(' | ')}\nKey Copy: ${p.excerpt.slice(0, 360)}`
  );

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
    headings: allHeadings,
    description: bestDescription,
    visualVibe,
    suggestedHook,
    crawledPages: cdp.crawledPages,
    summaryText: [
      `Full-Site Multi-Page Brand Dossier (${cdp.crawledPages.length} pages crawled): ${brandName} (${parsed.toString()})`,
      `Brand Colors: Primary ${palette.primary}, Secondary ${palette.secondary}, Background ${palette.background}`,
      `Typography: ${fonts.join(', ')}`,
      ...pageDossierLines,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}
