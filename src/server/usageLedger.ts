/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Live AI Cost, Token Usage & Infrastructure Economics Ledger
 * Logs every real LLM call, image generation, vision pass, and Chrome CDP Brand Scan
 * to `.adnetiks-data/usage.json` with accurate per-1M-token USD cost calculation.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_ROOT = path.resolve(process.cwd(), '.adnetiks-data');
const USAGE_FILE = path.join(DATA_ROOT, 'usage.json');

export type UsageOperation =
  | 'generate_content'
  | 'discover_avatars'
  | 'generate_ai_video'
  | 'generate_image'
  | 'vision_analyze'
  | 'brand_scan'
  | 'llm_text';

export interface UsageEntry {
  id: string;
  operation: UsageOperation;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  isLocalFree: boolean;
  meta?: string;
  timestamp: string;
}

interface UsageStore {
  entries: UsageEntry[];
}

// Per-1M-token USD pricing table (Input / Output)
const MODEL_PRICING_PER_1M: Array<{ match: RegExp; input: number; output: number }> = [
  { match: /llama|qwen|mistral|deepseek|ollama|local|heuristic|cdp/i, input: 0, output: 0 },
  { match: /gemini-2\.0-flash|gemini-2\.5-flash|gemini-1\.5-flash|gemini-3/i, input: 0.1, output: 0.4 },
  { match: /gemini.*pro/i, input: 1.25, output: 10.0 },
  { match: /gpt-4o-mini/i, input: 0.15, output: 0.6 },
  { match: /gpt-4o|gpt-4\.1|o3|o1/i, input: 2.5, output: 10.0 },
  { match: /claude.*haiku/i, input: 0.8, output: 4.0 },
  { match: /claude.*sonnet/i, input: 3.0, output: 15.0 },
  { match: /claude.*opus/i, input: 15.0, output: 75.0 },
];

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function calculateTokenCostUsd(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  if (provider === 'local' || provider === 'heuristic' || provider === 'cdp_chrome') return 0;
  const key = `${provider} ${model}`;
  const matched = MODEL_PRICING_PER_1M.find((p) => p.match.test(key));
  const rate = matched || { input: 0.25, output: 1.0 };
  const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
  return Number(cost.toFixed(6));
}

function ensureRoot() {
  if (!fs.existsSync(DATA_ROOT)) fs.mkdirSync(DATA_ROOT, { recursive: true });
}

function loadStore(): UsageStore {
  ensureRoot();
  if (!fs.existsSync(USAGE_FILE)) return { entries: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8')) as Partial<UsageStore>;
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch {
    return { entries: [] };
  }
}

function saveStore(store: UsageStore) {
  ensureRoot();
  const tmp = `${USAGE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmp, USAGE_FILE);
}

export function recordUsageEvent(input: {
  operation: UsageOperation;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  overrideCostUsd?: number;
  meta?: string;
}): UsageEntry {
  const store = loadStore();
  const inTok = Math.max(0, Math.round(input.inputTokens || 0));
  const outTok = Math.max(0, Math.round(input.outputTokens || 0));
  const cost =
    typeof input.overrideCostUsd === 'number'
      ? Number(input.overrideCostUsd.toFixed(6))
      : calculateTokenCostUsd(input.provider, input.model, inTok, outTok);

  const entry: UsageEntry = {
    id: `usg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    operation: input.operation,
    provider: input.provider,
    model: input.model,
    inputTokens: inTok,
    outputTokens: outTok,
    estimatedCostUsd: cost,
    isLocalFree: cost === 0,
    meta: input.meta,
    timestamp: new Date().toISOString(),
  };

  store.entries = [entry, ...store.entries].slice(0, 1000);
  saveStore(store);
  return entry;
}

export function clearUsageLedger(): void {
  saveStore({ entries: [] });
}

export function getUsageSummary() {
  const { entries } = loadStore();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let freeLocalOps = 0;
  let brandScansCount = 0;
  let imagesGeneratedCount = 0;

  const byProvider: Record<string, { calls: number; tokens: number; costUsd: number }> = {};
  const byOperation: Record<string, { calls: number; tokens: number; costUsd: number }> = {};

  for (const e of entries) {
    const toks = e.inputTokens + e.outputTokens;
    totalInputTokens += e.inputTokens;
    totalOutputTokens += e.outputTokens;
    totalCostUsd += e.estimatedCostUsd;
    if (e.isLocalFree) freeLocalOps += 1;
    if (e.operation === 'brand_scan') brandScansCount += 1;
    if (e.operation === 'generate_image') imagesGeneratedCount += 1;

    if (!byProvider[e.provider]) byProvider[e.provider] = { calls: 0, tokens: 0, costUsd: 0 };
    byProvider[e.provider].calls += 1;
    byProvider[e.provider].tokens += toks;
    byProvider[e.provider].costUsd = Number((byProvider[e.provider].costUsd + e.estimatedCostUsd).toFixed(6));

    if (!byOperation[e.operation]) byOperation[e.operation] = { calls: 0, tokens: 0, costUsd: 0 };
    byOperation[e.operation].calls += 1;
    byOperation[e.operation].tokens += toks;
    byOperation[e.operation].costUsd = Number((byOperation[e.operation].costUsd + e.estimatedCostUsd).toFixed(6));
  }

  return {
    totalCalls: entries.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    freeLocalOps,
    brandScansCount,
    imagesGeneratedCount,
    byProvider,
    byOperation,
    recentEntries: entries.slice(0, 30),
  };
}
