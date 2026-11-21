/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Persistent Workspace Storage & Media Vault
 * Stores workspace state (brand, avatars, campaigns, posts, split tests, attached videos)
 * in `.adnetiks-data/workspace.json` and binary media (images/videos) in `.adnetiks-data/media/`.
 * Designed with a clean repository interface so Postgres / S3 / R2 can drop in later.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_ROOT = path.resolve(process.cwd(), '.adnetiks-data');
const WORKSPACE_FILE = path.join(DATA_ROOT, 'workspace.json');
const MEDIA_DIR = path.join(DATA_ROOT, 'media');

function ensureDirs() {
  if (!fs.existsSync(DATA_ROOT)) {
    fs.mkdirSync(DATA_ROOT, { recursive: true });
  }
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
}

export interface PersistedWorkspace {
  updatedAt: string;
  brandProfile?: any;
  avatars?: any[];
  campaigns?: any[];
  posts?: any[];
  splitTests?: any[];
  attachedCampaignVideo?: any | null;
  brandConfigured?: boolean;
}

export function loadWorkspace(): PersistedWorkspace | null {
  ensureDirs();
  if (!fs.existsSync(WORKSPACE_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(WORKSPACE_FILE, 'utf-8');
    return JSON.parse(raw) as PersistedWorkspace;
  } catch (err) {
    console.warn('[storage] Failed to read workspace.json:', err);
    return null;
  }
}

export function saveWorkspace(partial: Partial<PersistedWorkspace>): PersistedWorkspace {
  ensureDirs();
  const existing = loadWorkspace() || ({} as PersistedWorkspace);
  const merged: PersistedWorkspace = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  const tmpFile = `${WORKSPACE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(merged, null, 2), 'utf-8');
  fs.renameSync(tmpFile, WORKSPACE_FILE);
  return merged;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

const EXT_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

export interface SavedMediaAsset {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

/**
 * Saves a base64 data URL (e.g. `data:video/webm;base64,...` or `data:image/png;base64,...`)
 * permanently into `.adnetiks-data/media/` and returns a stable `/api/media/<filename>` URL.
 */
export function saveDataUrlMedia(dataUrl: string, originalName?: string): SavedMediaAsset {
  ensureDirs();
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 data URL');
  }
  const rawMime = match[1].toLowerCase().split(';')[0].trim();
  const base64Body = match[2];
  const ext = MIME_TO_EXT[rawMime] || (originalName?.split('.').pop()?.toLowerCase() || 'bin');
  const safeBase = (originalName || 'asset')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 32);
  const id = crypto.randomBytes(5).toString('hex');
  const filename = `${safeBase || 'asset'}_${Date.now()}_${id}.${ext}`;
  const fullPath = path.join(MEDIA_DIR, filename);

  const buffer = Buffer.from(base64Body, 'base64');
  // Limit individual uploads to 80MB for local safety
  if (buffer.length > 80 * 1024 * 1024) {
    throw new Error('Media file exceeds 80MB limit');
  }
  fs.writeFileSync(fullPath, buffer);

  return {
    filename,
    url: `/api/media/${filename}`,
    mimeType: rawMime,
    sizeBytes: buffer.length,
    createdAt: new Date().toISOString(),
  };
}

export function resolveMediaFile(filename: string): { fullPath: string; mimeType: string; sizeBytes: number } | null {
  ensureDirs();
  const clean = path.basename(filename);
  if (!clean || clean !== filename) return null;
  const fullPath = path.join(MEDIA_DIR, clean);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  const ext = path.extname(clean).toLowerCase();
  return {
    fullPath,
    mimeType: EXT_TO_MIME[ext] || 'application/octet-stream',
    sizeBytes: stat.size,
  };
}

export function listMediaFiles(): SavedMediaAsset[] {
  ensureDirs();
  try {
    return fs
      .readdirSync(MEDIA_DIR)
      .map((name) => {
        const fullPath = path.join(MEDIA_DIR, name);
        const stat = fs.statSync(fullPath);
        const ext = path.extname(name).toLowerCase();
        return {
          filename: name,
          url: `/api/media/${name}`,
          mimeType: EXT_TO_MIME[ext] || 'application/octet-stream',
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}
