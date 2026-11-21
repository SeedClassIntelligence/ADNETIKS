/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Real Website Brand DNA & Visual Screenshot Scanner
 * Visits any public URL in headless Chrome/Edge, captures permanent Desktop (1440x900)
 * & Mobile (430x932) screenshots into `.adnetiks-data/media/`, extracts authentic
 * brand hex colors, typography, favicon/logo & copy, and runs multimodal vision analysis.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
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

async function captureViewportScreenshot(
  browserPath: string,
  targetUrl: string,
  outFile: string,
  width: number,
  height: number
): Promise<boolean> {
  try {
    await execFileAsync(
      browserPath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--virtual-time-budget=4500',
        `--window-size=${width},${height}`,
        `--screenshot=${outFile}`,
        targetUrl,
      ],
      { timeout: 18000 }
    );
    return fs.existsSync(outFile) && fs.statSync(outFile).size > 2000;
  } catch (err) {
    console.warn(`[brand-scan] Screenshot capture failed (${width}x${height}):`, err);
    return false;
  }
}

interface ExtractedPalette {
  primary: string;
  secondary: string;
  background: string;
  textOnPrimary: string;
  swatches: string[];
}

async function extractPaletteFromPng(pngPath: string): Promise<ExtractedPalette | null> {
  const pyScript = `
import sys, json, colorsys
from PIL import Image

img = Image.open(sys.argv[1]).convert('RGB')
img.thumbnail((220, 220))
quant = img.quantize(colors=14, method=Image.Quantize.MEDIANCUT).convert('RGB')
counts = quant.getcolors(220 * 220) or []
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
    if all(dist(rgb, d[1]) > 38 for d in distinct):
        distinct.append((cnt, rgb))

accents = []
for cnt, rgb in distinct:
    s, l = sat_lum(rgb)
    if s > 0.28 and 0.14 < l < 0.85:
        accents.append((cnt * (0.4 + s * 2.0), rgb))

accents.sort(key=lambda x: x[0], reverse=True)

primary_rgb = accents[0][1] if accents else (distinct[1][1] if len(distinct) > 1 else (232, 25, 44))
secondary_rgb = accents[1][1] if len(accents) > 1 else (distinct[2][1] if len(distinct) > 2 else (6, 182, 212))

# Luminance check for readable text on primary
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

async function inspectHtmlBrandSignals(parsedUrl: URL): Promise<{
  themeColor?: string;
  faviconUrl?: string;
  fonts: string[];
}> {
  try {
    const res = await fetch(parsedUrl.toString(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ADNETIKS-BrandScanner/1.0)',
      },
    });
    if (!res.ok) return { fonts: [] };
    const html = (await res.text()).slice(0, 250_000);

    // Theme color meta
    const tcMatch =
      html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{3,6})["']/i) ||
      html.match(/<meta[^>]*content=["'](#[0-9a-fA-F]{3,6})["'][^>]*name=["']theme-color["']/i);
    const themeColor = tcMatch ? tcMatch[1].toUpperCase() : undefined;

    // Favicon / apple-touch-icon
    const iconMatch = html.match(
      /<link[^>]*rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*href=["']([^"']+)["']/i
    );
    let faviconUrl: string | undefined;
    if (iconMatch) {
      const rawHref = iconMatch[1];
      if (rawHref.startsWith('http')) faviconUrl = rawHref;
      else if (rawHref.startsWith('//')) faviconUrl = `${parsedUrl.protocol}${rawHref}`;
      else faviconUrl = new URL(rawHref, parsedUrl.origin).toString();
    } else {
      faviconUrl = `${parsedUrl.origin}/favicon.ico`;
    }

    // Google Fonts / CSS font-family detection
    const fonts: string[] = [];
    const gfRegex = /fonts\.googleapis\.com\/css2?\?[^"']*family=([^"'&]+)/gi;
    let gfm: RegExpExecArray | null;
    while ((gfm = gfRegex.exec(html)) !== null && fonts.length < 4) {
      const fam = decodeURIComponent(gfm[1]).split(':')[0].replace(/\+/g, ' ').trim();
      if (fam && !fonts.includes(fam)) fonts.push(fam);
    }

    if (fonts.length === 0) {
      const ffRegex = /font-family\s*:\s*['"]?([A-Za-z][A-Za-z0-9\s-]{2,28})['"]?/gi;
      let ffm: RegExpExecArray | null;
      const ignore = new Set(['inherit', 'sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'Arial', 'Helvetica']);
      while ((ffm = ffRegex.exec(html)) !== null && fonts.length < 3) {
        const fam = ffm[1].trim();
        if (fam && !ignore.has(fam) && !fonts.includes(fam)) fonts.push(fam);
      }
    }

    return { themeColor, faviconUrl, fonts };
  } catch {
    return { fonts: [] };
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

  // Run HTML scrape + HTML brand signal inspection + real headless screenshots in parallel!
  const [scraped, htmlSignals, desktopOk, mobileOk] = await Promise.all([
    scrapeUrlContext(parsed.toString()),
    inspectHtmlBrandSignals(parsed),
    browserPath
      ? captureViewportScreenshot(browserPath, parsed.toString(), desktopPath, 1440, 900)
      : Promise.resolve(false),
    browserPath
      ? captureViewportScreenshot(browserPath, parsed.toString(), mobilePath, 430, 932)
      : Promise.resolve(false),
  ]);

  // Extract authentic visual color palette from the real rendered Desktop screenshot
  let palette: ExtractedPalette = {
    primary: htmlSignals.themeColor || '#E8192C',
    secondary: '#06B6D4',
    background: '#0A0A0C',
    textOnPrimary: '#FFFFFF',
    swatches: [htmlSignals.themeColor || '#E8192C', '#06B6D4', '#0A0A0C', '#18181F', '#F8FAFC'],
  };

  if (desktopOk) {
    const extracted = await extractPaletteFromPng(desktopPath);
    if (extracted) {
      palette = extracted;
      if (htmlSignals.themeColor && !palette.swatches.includes(htmlSignals.themeColor)) {
        palette.swatches = [htmlSignals.themeColor, ...palette.swatches].slice(0, 5);
      }
    }
  }

  // Derive crisp brand name from page title or domain
  const rawBrand = (scraped.title || domain)
    .split(/[|\-–—:·]/)[0]
    .trim();
  const brandName =
    rawBrand.length >= 2 && rawBrand.length <= 36
      ? rawBrand
      : domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  // Run multimodal vision pass on the captured desktop screenshot if available
  let visualVibe = `Modern ${scraped.siteType} brand aesthetic anchored by ${palette.primary} & ${palette.secondary}`;
  let suggestedHook = scraped.headings[0] || scraped.description || `Discover ${brandName} — built to stand out.`;

  if (desktopOk) {
    try {
      const b64 = fs.readFileSync(desktopPath).toString('base64');
      const vision = await analyzeImageVisual(`data:image/png;base64,${b64}`, brandName, brandName);
      if (vision.provider !== 'local_metadata') {
        if (vision.visualVibe) visualVibe = vision.visualVibe;
        if (vision.suggestedHook) suggestedHook = vision.suggestedHook;
      }
    } catch {
      // Keep extracted vibe
    }
  }

  return {
    ok: true,
    url: parsed.toString(),
    domain,
    brandName,
    tagline: scraped.description || scraped.headings[0] || `${brandName} Official Experience`,
    siteType: scraped.siteType || 'web',
    desktopScreenshotUrl: desktopOk ? `/api/media/${desktopFilename}` : scraped.ogImage,
    mobileScreenshotUrl: mobileOk ? `/api/media/${mobileFilename}` : desktopOk ? `/api/media/${desktopFilename}` : scraped.ogImage,
    ogImageUrl: scraped.ogImage,
    faviconUrl: htmlSignals.faviconUrl,
    palette,
    fonts: htmlSignals.fonts.length > 0 ? htmlSignals.fonts : ['Plus Jakarta Sans', 'Inter'],
    headings: scraped.headings,
    description: scraped.description,
    visualVibe,
    suggestedHook,
    summaryText: [
      `Brand Scanned: ${brandName} (${parsed.toString()})`,
      `Brand Colors: Primary ${palette.primary}, Secondary ${palette.secondary}, Background ${palette.background}`,
      `Visual Vibe: ${visualVibe}`,
      scraped.summaryText,
    ].join('\n'),
  };
}
