/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Brand Ad Creative Engine
 * Generates clean, low-text-density (<18% text area), high-converting commercial ad creatives
 * styled in the brand's exact extracted hex palette, fonts, and real website claims.
 * Renders real PNG assets via local headless Chrome/Edge (or crisp SVG fallback) into `.adnetiks-data/media/`.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { recordUsageEvent } from './usageLedger.ts';

const execFileAsync = promisify(execFile);
const MEDIA_DIR = path.resolve(process.cwd(), '.adnetiks-data', 'media');

export type AdCreativeStyle = 'editorial_hook' | 'old_vs_new' | 'proof_spotlight' | 'social_story';

export interface BrandAdCreativeOptions {
  brandName: string;
  domain?: string;
  tagline?: string;
  headline: string;
  subheadline?: string;
  ctaText?: string;
  eyebrow?: string;
  style?: AdCreativeStyle;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16' | '3:4';
  palette?: {
    primary?: string;
    secondary?: string;
    background?: string;
    swatches?: string[];
  };
  fonts?: string[];
  oldWayPoints?: string[];
  newWayPoints?: string[];
  subjectImageUrl?: string;
}

export interface BrandAdCreativeResult {
  imageUrl: string;
  fileName: string;
  width: number;
  height: number;
  style: AdCreativeStyle;
  format: 'png' | 'svg';
}

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
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

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHex(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  const clean = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean) || /^#[0-9a-fA-F]{3}$/.test(clean)) return clean;
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62;
}

function getDimensions(aspectRatio: BrandAdCreativeOptions['aspectRatio']): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1200, height: 675 };
    case '4:3':
      return { width: 1200, height: 900 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '3:4':
      return { width: 1080, height: 1440 };
    case '1:1':
    default:
      return { width: 1080, height: 1080 };
  }
}

function trimWords(text: string, maxChars: number): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars - 1).replace(/\s+\S*$/, '') + '…';
}

function resolveSubjectDataUri(subjectImageUrl?: string): string | null {
  if (!subjectImageUrl) return null;
  if (subjectImageUrl.startsWith('data:image/')) return subjectImageUrl;
  if (subjectImageUrl.startsWith('/api/media/')) {
    const fileName = decodeURIComponent(subjectImageUrl.replace(/^\/api\/media\//, ''));
    const full = path.join(MEDIA_DIR, path.basename(fileName));
    if (fs.existsSync(full)) {
      const ext = path.extname(full).toLowerCase();
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
      return `data:${mime};base64,${fs.readFileSync(full).toString('base64')}`;
    }
  }
  return null;
}

function buildCreativeHtml(opts: BrandAdCreativeOptions, width: number, height: number): string {
  const subjectDataUri = resolveSubjectDataUri(opts.subjectImageUrl);
  const primary = sanitizeHex(opts.palette?.primary, '#047857');
  const secondary = sanitizeHex(opts.palette?.secondary, '#B45309');
  const rawBg = sanitizeHex(opts.palette?.background, '#0C1622');
  // Keep ad creatives rich dark obsidian/navy or deep brand tint for maximum feed thumb-stop contrast
  const bg = isLightColor(rawBg) ? '#0B131E' : rawBg;
  const { r: pr, g: pg, b: pb } = hexToRgb(primary);
  const { r: sr, g: sg, b: sb } = hexToRgb(secondary);
  const ctaTextColor = isLightColor(primary) ? '#090D12' : '#FFFFFF';
  const fontStack = `'${escapeHtml(opts.fonts?.[0] || 'Inter')}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

  const brandName = escapeHtml(opts.brandName || 'Brand');
  const domain = escapeHtml((opts.domain || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, ''));
  const eyebrow = escapeHtml(trimWords(opts.eyebrow || `${opts.brandName} · Official`, 42));
  const headline = escapeHtml(trimWords(opts.headline || opts.tagline || opts.brandName, 68));
  const subheadline = escapeHtml(trimWords(opts.subheadline || opts.tagline || '', 115));
  const ctaText = escapeHtml(trimWords(opts.ctaText || 'Compare Now', 26));
  const style: AdCreativeStyle = opts.style || (opts.aspectRatio === '9:16' ? 'social_story' : 'editorial_hook');

  const oldWay = (opts.oldWayPoints && opts.oldWayPoints.length > 0
    ? opts.oldWayPoints
    : [
        'Generic pitch decks & hidden fine print',
        'Personal details resold to multiple callers',
        'Hours wasted guessing the real difference',
      ]
  ).slice(0, 3);

  const newWay = (opts.newWayPoints && opts.newWayPoints.length > 0
    ? opts.newWayPoints
    : [
        trimWords(opts.headline || 'Clear side-by-side factual comparison', 54),
        '100% private — you stay in control',
        'Zero pressure until you choose to connect',
      ]
  ).slice(0, 3);

  const isPortrait = height > width;
  const isWide = width / height > 1.45;
  const padX = isPortrait ? 88 : isWide ? 80 : 76;
  const padY = isPortrait ? 180 : isWide ? 56 : 72;

  let bodyInner = '';

  if (style === 'old_vs_new') {
    bodyInner = `
      <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;position:relative;z-index:2;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:inline-flex;align-items:center;gap:12px;padding:10px 20px;border-radius:999px;background:rgba(${pr},${pg},${pb},0.18);border:1px solid rgba(${pr},${pg},${pb},0.55);color:#E8FFF6;font-size:${isWide ? 18 : 22}px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            <span style="width:10px;height:10px;border-radius:999px;background:${primary};box-shadow:0 0 12px ${primary};"></span>
            ${brandName}
          </div>
          ${domain ? `<div style="font-size:${isWide ? 18 : 22}px;color:rgba(255,255,255,0.62);font-weight:600;letter-spacing:0.02em;">${domain}</div>` : ''}
        </div>

        <div style="margin:${isWide ? '18px 0 16px' : '28px 0'};">
          <h1 style="margin:0;font-size:${isWide ? 48 : isPortrait ? 72 : 58}px;line-height:1.06;font-weight:900;letter-spacing:-0.03em;color:#FFFFFF;">
            ${headline}
          </h1>
        </div>

        <div style="display:grid;grid-template-columns:${isPortrait ? '1fr' : '1fr 1fr'};gap:${isWide ? 24 : 28}px;flex:1;align-items:stretch;">
          <div style="background:rgba(255,255,255,0.035);border:1.5px solid rgba(248,113,113,0.28);border-radius:28px;padding:${isWide ? 26 : 36}px;display:flex;flex-direction:column;justify-content:center;gap:${isWide ? 16 : 22}px;">
            <div style="font-size:${isWide ? 17 : 20}px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#FCA5A5;">THE OLD WAY</div>
            ${oldWay
              .map(
                (pt) => `
              <div style="display:flex;align-items:flex-start;gap:14px;font-size:${isWide ? 21 : 25}px;line-height:1.3;color:rgba(255,255,255,0.72);font-weight:500;">
                <span style="color:#F87171;font-weight:900;flex-shrink:0;">✕</span>
                <span>${escapeHtml(pt)}</span>
              </div>`
              )
              .join('')}
          </div>

          <div style="background:linear-gradient(155deg, rgba(${pr},${pg},${pb},0.28), rgba(${pr},${pg},${pb},0.08));border:2px solid rgba(${pr},${pg},${pb},0.85);border-radius:28px;padding:${isWide ? 26 : 36}px;display:flex;flex-direction:column;justify-content:center;gap:${isWide ? 16 : 22}px;box-shadow:0 24px 60px rgba(${pr},${pg},${pb},0.22);">
            <div style="font-size:${isWide ? 17 : 20}px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6EE7B7;">THE ${brandName.toUpperCase()} WAY</div>
            ${newWay
              .map(
                (pt) => `
              <div style="display:flex;align-items:flex-start;gap:14px;font-size:${isWide ? 21 : 25}px;line-height:1.3;color:#FFFFFF;font-weight:700;">
                <span style="color:#34D399;font-weight:900;flex-shrink:0;">✓</span>
                <span>${escapeHtml(pt)}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:${isWide ? 22 : 34}px;">
          <div style="display:inline-flex;align-items:center;gap:14px;padding:${isWide ? '14px 30px' : '18px 36px'};border-radius:16px;background:${primary};color:${ctaTextColor};font-size:${isWide ? 22 : 26}px;font-weight:800;box-shadow:0 16px 40px rgba(${pr},${pg},${pb},0.45);">
            <span>${ctaText}</span>
            <span>→</span>
          </div>
          <div style="font-size:${isWide ? 16 : 19}px;color:rgba(255,255,255,0.55);font-weight:600;">
            Zero spam · Instant clarity
          </div>
        </div>
      </div>
    `;
  } else if (style === 'proof_spotlight') {
    bodyInner = `
      <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;position:relative;z-index:2;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:${isWide ? 22 : 26}px;font-weight:900;letter-spacing:-0.02em;color:#FFFFFF;display:flex;align-items:center;gap:12px;">
            <span style="width:16px;height:16px;border-radius:5px;background:${primary};display:inline-block;"></span>
            ${brandName}
          </div>
          <div style="padding:8px 18px;border-radius:999px;background:rgba(${sr},${sg},${sb},0.22);border:1px solid rgba(${sr},${sg},${sb},0.65);color:#FDE68A;font-size:${isWide ? 16 : 19}px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
            ${eyebrow}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:${isPortrait ? '1fr' : '1.25fr 0.75fr'};gap:36px;align-items:center;margin:auto 0;">
          <div style="display:flex;flex-direction:column;gap:22px;">
            <h1 style="margin:0;font-size:${isWide ? 54 : isPortrait ? 76 : 64}px;line-height:1.05;font-weight:900;letter-spacing:-0.03em;color:#FFFFFF;">
              ${headline}
            </h1>
            ${
              subheadline
                ? `<p style="margin:0;font-size:${isWide ? 23 : 28}px;line-height:1.38;color:rgba(255,255,255,0.78);font-weight:500;">${subheadline}</p>`
                : ''
            }
          </div>

          <div style="background:rgba(255,255,255,0.045);border:1.5px solid rgba(${pr},${pg},${pb},0.55);border-radius:30px;padding:34px;display:flex;flex-direction:column;gap:18px;backdrop-filter:blur(12px);">
            <div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg, ${primary}, ${secondary});display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#FFFFFF;box-shadow:0 12px 32px rgba(${pr},${pg},${pb},0.4);">
              ✓
            </div>
            <div style="font-size:${isWide ? 20 : 24}px;font-weight:800;color:#FFFFFF;line-height:1.25;">
              Built for Real Decisions
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${newWay
                .slice(0, 2)
                .map(
                  (pt) => `<div style="font-size:${isWide ? 17 : 20}px;color:rgba(255,255,255,0.78);display:flex;gap:10px;"><span style="color:${primary};font-weight:900;">•</span><span>${escapeHtml(pt)}</span></div>`
                )
                .join('')}
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:20px;border-top:1px solid rgba(255,255,255,0.12);">
          <div style="display:inline-flex;align-items:center;gap:12px;padding:${isWide ? '14px 28px' : '18px 34px'};border-radius:14px;background:${primary};color:${ctaTextColor};font-size:${isWide ? 21 : 25}px;font-weight:800;">
            <span>${ctaText}</span><span>→</span>
          </div>
          <div style="font-size:${isWide ? 19 : 22}px;color:rgba(255,255,255,0.68);font-weight:600;">${domain || brandName}</div>
        </div>
      </div>
    `;
  } else if (subjectDataUri) {
    // Magazine-grade Editorial Commercial Ad featuring the User's Own Likeness / Product Photo
    bodyInner = `
      <div style="position:absolute;inset:0;z-index:1;overflow:hidden;">
        <img src="${subjectDataUri}" style="width:100%;height:100%;object-fit:cover;object-position:center 22%;filter:contrast(1.06) saturate(1.06);" />
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(6,9,14,0.42) 0%, rgba(6,9,14,0.18) 38%, rgba(6,9,14,0.88) 76%, rgba(6,9,14,0.97) 100%);"></div>
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 85% 15%, rgba(${pr},${pg},${pb},0.34), transparent 52%);"></div>
      </div>
      <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;position:relative;z-index:2;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:inline-flex;align-items:center;gap:12px;padding:10px 22px;border-radius:999px;background:rgba(8,10,16,0.72);backdrop-filter:blur(10px);border:1.5px solid rgba(${pr},${pg},${pb},0.75);color:#FFFFFF;font-size:${isWide ? 18 : 22}px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">
            <span style="width:10px;height:10px;border-radius:999px;background:${primary};"></span>
            ${eyebrow}
          </div>
          ${domain ? `<div style="padding:8px 16px;border-radius:999px;background:rgba(8,10,16,0.65);font-size:${isWide ? 16 : 20}px;color:rgba(255,255,255,0.86);font-weight:700;">${domain}</div>` : ''}
        </div>

        <div style="display:flex;flex-direction:column;gap:${isWide ? 16 : 22}px;">
          <div style="width:84px;height:7px;border-radius:999px;background:linear-gradient(90deg, ${primary}, ${secondary});"></div>
          <h1 style="margin:0;font-size:${isWide ? 54 : isPortrait ? 78 : 66}px;line-height:1.04;font-weight:900;letter-spacing:-0.03em;color:#FFFFFF;text-shadow:0 10px 36px rgba(0,0,0,0.65);">
            ${headline}
          </h1>
          ${
            subheadline
              ? `<p style="margin:0;font-size:${isWide ? 22 : isPortrait ? 30 : 26}px;line-height:1.35;color:rgba(255,255,255,0.86);font-weight:500;max-width:90%;">${subheadline}</p>`
              : ''
          }
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;">
            <div style="display:inline-flex;align-items:center;gap:14px;padding:${isWide ? '15px 32px' : '20px 38px'};border-radius:16px;background:${primary};color:${ctaTextColor};font-size:${isWide ? 22 : 26}px;font-weight:900;box-shadow:0 18px 46px rgba(${pr},${pg},${pb},0.55);">
              <span>${ctaText}</span><span>→</span>
            </div>
            <div style="font-size:${isWide ? 20 : 24}px;font-weight:900;color:#FFFFFF;text-shadow:0 4px 16px rgba(0,0,0,0.6);">${brandName}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    // Editorial Bold-Statement Hook & Vertical 9:16 Social Story (ultra-clean, <16% text ratio)
    bodyInner = `
      <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;position:relative;z-index:2;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:inline-flex;align-items:center;gap:12px;padding:10px 22px;border-radius:999px;background:rgba(${pr},${pg},${pb},0.22);border:1.5px solid rgba(${pr},${pg},${pb},0.65);color:#FFFFFF;font-size:${isWide ? 18 : 22}px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">
            <span style="width:10px;height:10px;border-radius:999px;background:${primary};"></span>
            ${eyebrow}
          </div>
          ${domain ? `<div style="font-size:${isWide ? 18 : 22}px;color:rgba(255,255,255,0.65);font-weight:600;">${domain}</div>` : ''}
        </div>

        <div style="max-width:92%;margin:auto 0;display:flex;flex-direction:column;gap:${isWide ? 20 : 30}px;">
          <div style="width:96px;height:8px;border-radius:999px;background:linear-gradient(90deg, ${primary}, ${secondary});"></div>
          <h1 style="margin:0;font-size:${isWide ? 62 : isPortrait ? 88 : 74}px;line-height:1.04;font-weight:900;letter-spacing:-0.035em;color:#FFFFFF;text-shadow:0 12px 40px rgba(0,0,0,0.45);">
            ${headline}
          </h1>
          ${
            subheadline
              ? `<p style="margin:0;font-size:${isWide ? 25 : isPortrait ? 34 : 30}px;line-height:1.4;color:rgba(255,255,255,0.82);font-weight:500;max-width:88%;">${subheadline}</p>`
              : ''
          }
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
          <div style="display:inline-flex;align-items:center;gap:14px;padding:${isWide ? '16px 34px' : '22px 42px'};border-radius:18px;background:${primary};color:${ctaTextColor};font-size:${isWide ? 23 : 28}px;font-weight:900;box-shadow:0 20px 50px rgba(${pr},${pg},${pb},0.48);">
            <span>${ctaText}</span>
            <span>→</span>
          </div>
          <div style="text-align:right;">
            <div style="font-size:${isWide ? 22 : 26}px;font-weight:900;color:#FFFFFF;">${brandName}</div>
            <div style="font-size:${isWide ? 15 : 18}px;color:rgba(255,255,255,0.58);font-weight:600;">${domain || 'Official Brand Ad'}</div>
          </div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: ${fontStack};
    background: ${bg};
    color: #FFFFFF;
  }
  .canvas {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    padding: ${padY}px ${padX}px;
    background:
      radial-gradient(circle at 86% 16%, rgba(${pr},${pg},${pb},0.42) 0%, rgba(${pr},${pg},${pb},0) 48%),
      radial-gradient(circle at 14% 88%, rgba(${sr},${sg},${sb},0.28) 0%, rgba(${sr},${sg},${sb},0) 46%),
      linear-gradient(145deg, ${bg} 0%, #070B11 100%);
  }
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 64px 64px;
    pointer-events: none;
    z-index: 1;
  }
  .ring {
    position: absolute;
    right: -120px;
    bottom: -140px;
    width: ${Math.round(Math.min(width, height) * 0.56)}px;
    height: ${Math.round(Math.min(width, height) * 0.56)}px;
    border-radius: 999px;
    border: 2px solid rgba(${pr},${pg},${pb},0.28);
    pointer-events: none;
    z-index: 1;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="grid-overlay"></div>
    <div class="ring"></div>
    ${bodyInner}
  </div>
</body>
</html>`;
}

function buildFallbackSvg(opts: BrandAdCreativeOptions, width: number, height: number): string {
  const primary = sanitizeHex(opts.palette?.primary, '#047857');
  const secondary = sanitizeHex(opts.palette?.secondary, '#B45309');
  const rawBg = sanitizeHex(opts.palette?.background, '#0C1622');
  const bg = isLightColor(rawBg) ? '#0B131E' : rawBg;
  const brand = escapeHtml(opts.brandName || 'Brand');
  const headline = escapeHtml(trimWords(opts.headline || opts.tagline || brand, 48));
  const cta = escapeHtml(trimWords(opts.ctaText || 'Learn More', 22));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#070B11"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect x="72" y="72" width="12" height="44" rx="6" fill="${primary}"/>
  <text x="102" y="106" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="32" font-weight="800">${brand}</text>
  <text x="72" y="${Math.round(height * 0.48)}" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="60" font-weight="900">${headline}</text>
  <rect x="72" y="${height - 150}" width="320" height="76" rx="18" fill="${primary}"/>
  <text x="116" y="${height - 102}" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="28" font-weight="800">${cta} →</text>
  <circle cx="${width - 90}" cy="${height - 90}" r="180" fill="none" stroke="${secondary}" stroke-opacity="0.3" stroke-width="3"/>
</svg>`;
}

export async function generateBrandAdCreative(
  opts: BrandAdCreativeOptions
): Promise<BrandAdCreativeResult> {
  ensureMediaDir();
  const style: AdCreativeStyle = opts.style || (opts.aspectRatio === '9:16' ? 'social_story' : 'editorial_hook');
  const { width, height } = getDimensions(opts.aspectRatio || '1:1');
  const slug = (opts.brandName || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24);
  const stamp = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const browserPath = findBrowserExecutable();

  if (browserPath) {
    const tmpHtml = path.join(os.tmpdir(), `adnetiks_creative_${stamp}.html`);
    const fileName = `creative_${slug}_${style}_${stamp}.png`;
    const outPath = path.join(MEDIA_DIR, fileName);
    try {
      const html = buildCreativeHtml({ ...opts, style }, width, height);
      fs.writeFileSync(tmpHtml, html, 'utf-8');
      const fileUrl = `file:///${tmpHtml.replace(/\\/g, '/')}`;
      await execFileAsync(
        browserPath,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-sandbox',
          '--hide-scrollbars',
          '--force-device-scale-factor=1',
          `--window-size=${width},${height}`,
          `--screenshot=${outPath}`,
          fileUrl,
        ],
        { timeout: 15000 }
      );
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 2500) {
        recordUsageEvent({
          operation: 'generate_image',
          provider: 'adnetiks_creative_studio',
          model: `brand-ad-${style}`,
          overrideCostUsd: 0,
          meta: `${opts.brandName} (${width}x${height} ${style})`,
        });
        return {
          imageUrl: `/api/media/${fileName}`,
          fileName,
          width,
          height,
          style,
          format: 'png',
        };
      }
    } catch (err) {
      console.warn('Chrome creative render fallback to SVG:', err);
    } finally {
      try {
        if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
      } catch {
        // ignore cleanup error
      }
    }
  }

  // Instant crisp SVG fallback (works even if Chrome is unavailable)
  const svgFileName = `creative_${slug}_${style}_${stamp}.svg`;
  const svgOutPath = path.join(MEDIA_DIR, svgFileName);
  fs.writeFileSync(svgOutPath, buildFallbackSvg({ ...opts, style }, width, height), 'utf-8');
  recordUsageEvent({
    operation: 'generate_image',
    provider: 'adnetiks_creative_studio',
    model: `brand-ad-${style}-svg`,
    overrideCostUsd: 0,
    meta: `${opts.brandName} (${width}x${height} SVG)`,
  });
  return {
    imageUrl: `/api/media/${svgFileName}`,
    fileName: svgFileName,
    width,
    height,
    style,
    format: 'svg',
  };
}
