/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Unified Video, Open-Source Voice (Kokoro Apache-2.0), Music & Creative Director Engine
 * 100% commercially permissive (Apache-2.0 / MIT compatible):
 *   - 6-Stage Video Production Pipelines (Launch Reel, Old Way vs New Way, Animated Explainer, UGC Story)
 *   - BE-Agnostic Open-Source Voiceover Bridge (Kokoro-FastAPI default at $0.00, Chatterbox, Qwen3-TTS, OpenAI TTS)
 *   - Automated Video Quality Gates (speaking pace, safe zones, anti-slop craft audit, audio check)
 *   - Parallax-style Creative Director Agent Chat that edits scenes, pacing, aesthetics & audio on command
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateText, getLLMConfig } from './llmProvider.ts';
import { auditAdForSlop, refineAdCopyByDirective, type ImpeccableDirective } from './impeccableAdEngine.ts';
import { recordUsageEvent, assertWithinDailyBudget } from './usageLedger.ts';

const DATA_ROOT = path.resolve(process.cwd(), '.adnetiks-data');
const MEDIA_DIR = path.join(DATA_ROOT, 'media');
const VOICE_CONFIG_FILE = path.join(DATA_ROOT, 'voice-config.json');

export type VideoPipelineTemplate = 'product_launch' | 'old_vs_new' | 'explainer' | 'ugc_story';
export type MusicBedStyle = 'ambient_synth' | 'editorial_pulse' | 'launch_momentum' | 'none';

export interface VideoSceneBlock {
  id: string;
  label: string;
  durationSec: number;
  spokenScript: string;
  kineticCaption: string;
  visualDirection: string;
  mediaUrl?: string;
}

export interface VideoQualityGateReport {
  overallPass: boolean;
  score: number;
  totalDurationSec: number;
  totalWords: number;
  wordsPerSecond: number;
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
}

export interface VoicePreset {
  id: string;
  label: string;
  style: string;
  gender: 'female' | 'male';
  accent: string;
  openaiFallback: 'alloy' | 'nova' | 'onyx' | 'shimmer' | 'echo' | 'fable';
}

export const KOKORO_VOICE_PRESETS: VoicePreset[] = [
  { id: 'af_bella', label: 'Bella · Warm Confident', style: 'Commercial Lead', gender: 'female', accent: 'US', openaiFallback: 'nova' },
  { id: 'am_michael', label: 'Michael · Authoritative Founder', style: 'B2B / Documentary', gender: 'male', accent: 'US', openaiFallback: 'onyx' },
  { id: 'af_sarah', label: 'Sarah · Crisp Editorial', style: 'Product Explainer', gender: 'female', accent: 'US', openaiFallback: 'alloy' },
  { id: 'am_adam', label: 'Adam · Direct & Bold', style: 'High-CTR Hook', gender: 'male', accent: 'US', openaiFallback: 'echo' },
  { id: 'bf_emma', label: 'Emma · Luxury British', style: 'Editorial / Quiet', gender: 'female', accent: 'UK', openaiFallback: 'shimmer' },
  { id: 'bm_george', label: 'George · Executive British', style: 'Authority / Finance', gender: 'male', accent: 'UK', openaiFallback: 'fable' },
];

export interface TtsConfig {
  provider: 'kokoro_local' | 'openai_compatible' | 'openai' | 'browser_free';
  baseUrl: string;
  apiKey?: string;
  defaultVoice: string;
}

function ensureDirs() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

export function getTtsConfig(): TtsConfig {
  const defaults: TtsConfig = {
    provider: process.env.ADNETIKS_TTS_BASE_URL ? 'kokoro_local' : 'kokoro_local',
    baseUrl: process.env.ADNETIKS_TTS_BASE_URL || 'http://127.0.0.1:8880',
    apiKey: process.env.ADNETIKS_TTS_API_KEY || '',
    defaultVoice: 'af_bella',
  };
  try {
    if (fs.existsSync(VOICE_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VOICE_CONFIG_FILE, 'utf-8'));
      return { ...defaults, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaults;
}

export function saveTtsConfig(partial: Partial<TtsConfig>): TtsConfig {
  ensureDirs();
  const current = getTtsConfig();
  const next: TtsConfig = {
    ...current,
    ...partial,
    baseUrl: (partial.baseUrl ?? current.baseUrl).trim().replace(/\/+$/, ''),
    apiKey: partial.apiKey && partial.apiKey.trim() ? partial.apiKey.trim() : current.apiKey,
  };
  fs.writeFileSync(VOICE_CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function getPublicTtsConfig() {
  const cfg = getTtsConfig();
  return {
    provider: cfg.provider,
    baseUrl: cfg.baseUrl,
    defaultVoice: cfg.defaultVoice,
    hasApiKey: !!cfg.apiKey || !!process.env.OPENAI_API_KEY,
    voices: KOKORO_VOICE_PRESETS,
  };
}

/**
 * Generates real MP3 voiceover via Open-Source Kokoro-FastAPI ($0.00, Apache 2.0)
 * or any OpenAI-compatible open-source TTS engine (Chatterbox, Qwen3-TTS, Orpheus),
 * with optional OpenAI TTS fallback and instant free browser-speech fallback.
 */
export async function synthesizeVoiceover(payload: {
  text: string;
  voiceId?: string;
  speed?: number;
  brandName?: string;
}) {
  ensureDirs();
  const text = (payload.text || '').trim();
  if (!text) return { ok: false, error: 'Spoken script is empty.' };

  const cfg = getTtsConfig();
  const voice = KOKORO_VOICE_PRESETS.find((v) => v.id === payload.voiceId) || KOKORO_VOICE_PRESETS[0];
  const speed = Math.max(0.75, Math.min(1.35, Number(payload.speed) || 1.0));

  // 1. Try Open-Source Kokoro-FastAPI / Custom Local OpenAI-Compatible TTS ($0.00!)
  if (cfg.provider !== 'browser_free' && cfg.baseUrl && cfg.provider !== 'openai') {
    try {
      const resp = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: voice.id,
          response_format: 'mp3',
          speed,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        if (buf.length > 800) {
          const fname = `voice_kokoro_${voice.id}_${Date.now()}_${crypto.randomBytes(2).toString('hex')}.mp3`;
          fs.writeFileSync(path.join(MEDIA_DIR, fname), buf);
          recordUsageEvent({
            operation: 'tts_voice',
            provider: 'kokoro_open_source',
            model: `kokoro-82m (${voice.id})`,
            overrideCostUsd: 0,
            meta: `${payload.brandName || 'Video'} (${text.split(/\s+/).length} words · $0.00)`,
          });
          return {
            ok: true,
            mode: 'kokoro_mp3',
            provider: 'Kokoro-82M (Open-Source · $0.00)',
            voiceLabel: voice.label,
            audioUrl: `/api/media/${fname}`,
            sizeBytes: buf.length,
            estimatedCostUsd: 0,
          };
        }
      }
    } catch {
      // Kokoro sidecar not running locally — try optional OpenAI TTS or graceful browser fallback
    }
  }

  // 2. Optional OpenAI TTS if explicitly configured + OPENAI_API_KEY is present + within daily budget
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && cfg.provider === 'openai') {
    const estCost = Number(((text.length / 1_000_000) * 15).toFixed(5));
    const budget = assertWithinDailyBudget(estCost);
    if (!budget.allowed) {
      return {
        ok: false,
        budgetExceeded: true,
        error: `Daily AI spend cap ($${budget.dailyBudgetUsd.toFixed(2)}) reached. Switch to free local Kokoro TTS or raise your cap in Cost & Unit Economics.`,
      };
    }
    try {
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice.openaiFallback,
          response_format: 'mp3',
          speed,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        const fname = `voice_openai_${voice.openaiFallback}_${Date.now()}.mp3`;
        fs.writeFileSync(path.join(MEDIA_DIR, fname), buf);
        recordUsageEvent({
          operation: 'tts_voice',
          provider: 'openai',
          model: 'tts-1',
          overrideCostUsd: estCost,
          meta: `${payload.brandName || 'Video'} (${text.length} chars)`,
        });
        return {
          ok: true,
          mode: 'openai_mp3',
          provider: 'OpenAI TTS',
          voiceLabel: voice.label,
          audioUrl: `/api/media/${fname}`,
          sizeBytes: buf.length,
          estimatedCostUsd: estCost,
        };
      }
    } catch {
      // fall through to browser speech
    }
  }

  // 3. Instant Zero-Cost Built-In Browser Neural Voice + Mic Fallback (works immediately with zero setup!)
  recordUsageEvent({
    operation: 'tts_voice',
    provider: 'local_voice_studio',
    model: 'browser-neural-tts',
    overrideCostUsd: 0,
    meta: `${payload.brandName || 'Video'} (Instant local preview · start Kokoro Docker for MP3 export)`,
  });

  return {
    ok: true,
    mode: 'browser_speech_ready',
    provider: 'Instant Local Voice (Start Kokoro Docker for MP3 track)',
    voiceLabel: voice.label,
    estimatedCostUsd: 0,
    hint: `Kokoro server not detected at ${cfg.baseUrl}. You can preview narration right now in your browser, record your own voiceover with 1 click, or run "docker compose --profile voice up -d" for $0 studio MP3s.`,
  };
}

export function evaluateVideoQualityGates(
  scenes: VideoSceneBlock[],
  hasAudioTrack: boolean,
  aspectRatio: '9:16' | '16:9',
  impeccableDirective: ImpeccableDirective = 'default'
): VideoQualityGateReport {
  const totalDurationSec = scenes.reduce((sum, s) => sum + Math.max(2, Number(s.durationSec) || 4), 0);
  const fullScript = scenes.map((s) => s.spokenScript).join(' ').trim();
  const totalWords = fullScript.split(/\s+/).filter(Boolean).length;
  const wordsPerSecond = Number((totalWords / Math.max(1, totalDurationSec)).toFixed(2));
  const maxCaptionChars = Math.max(0, ...scenes.map((s) => (s.kineticCaption || '').length));

  const slopAudit = auditAdForSlop({
    headline: scenes[0]?.kineticCaption || 'Hook',
    primaryText: fullScript,
    ctaText: scenes[scenes.length - 1]?.kineticCaption || 'Get Started',
    impeccableDirective,
  });

  const pacePass = wordsPerSecond >= 1.5 && wordsPerSecond <= 3.6;
  const safeZonePass = maxCaptionChars <= 52;
  const durationPass = totalDurationSec >= 10 && totalDurationSec <= 45;
  const slopPass = slopAudit.score >= 82;

  const checks = [
    {
      id: 'pace',
      label: 'Narration Pacing',
      passed: pacePass,
      detail: `${wordsPerSecond} words/sec (${totalWords} words in ${totalDurationSec}s · ideal 1.8–3.3 w/s)`,
    },
    {
      id: 'safe_zone',
      label: `${aspectRatio} Safe-Zone Captions`,
      passed: safeZonePass,
      detail: safeZonePass
        ? `Max caption ${maxCaptionChars} chars — clears TikTok / Reels / Shorts UI overlays`
        : `Caption too long (${maxCaptionChars} chars) — shorten under 52 chars for mobile legibility`,
    },
    {
      id: 'impeccable',
      label: 'Impeccable Anti-Slop Script',
      passed: slopPass,
      detail: `${slopAudit.score}/100 (${slopAudit.grade}) · ${slopAudit.flaggedCliches.length === 0 ? 'Zero AI clichés' : `Clichés: ${slopAudit.flaggedCliches.join(', ')}`}`,
    },
    {
      id: 'audio',
      label: 'Voiceover / Audio Track',
      passed: hasAudioTrack,
      detail: hasAudioTrack
        ? 'Real voiceover / music bed ready to mux into final HD export'
        : 'Click "Generate Kokoro Voiceover" or "Record Mic" to add spoken narration (music bed still included)',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    overallPass: pacePass && safeZonePass && durationPass && slopPass,
    score,
    totalDurationSec,
    totalWords,
    wordsPerSecond,
    checks,
  };
}

export async function generateVideoProductionPlan(payload: {
  brandName: string;
  tagline?: string;
  websiteUrl?: string;
  offerBrief?: string;
  template: VideoPipelineTemplate;
  aspectRatio?: '9:16' | '16:9';
  impeccableDirective?: ImpeccableDirective;
}) {
  const brand = (payload.brandName || 'Your Brand').trim();
  const domain = (payload.websiteUrl || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || brand;
  const brief = `${payload.offerBrief || ''} ${payload.tagline || ''}`.trim();
  const isInsurance = /\b(insurance|polici|policy|carrier|quote|coverage|lead|compare)\b/i.test(`${brand} ${brief}`);
  const aspectRatio = payload.aspectRatio || (payload.template === 'explainer' ? '16:9' : '9:16');
  const directive = payload.impeccableDirective || 'default';

  let scenes: VideoSceneBlock[] | null = null;
  const llm = getLLMConfig();
  if (llm.apiKey || llm.provider === 'openai_compatible') {
    try {
      const raw = await generateText(
        `Create a 4-scene ${payload.template} video ad storyboard for ${brand} (${domain}). Offer: ${brief || brand}. Directive: ${directive}.`,
        `You are a performance video director. Return STRICT JSON with 4 timed scenes (total 15-24 seconds, ~2.5 words/sec, captions under 42 chars, zero AI clichés):\n{"title":"...","scenes":[{"id":"sc-1","label":"01 · Hook","durationSec":4,"spokenScript":"...","kineticCaption":"...","visualDirection":"..."}]}`
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.scenes) && parsed.scenes.length >= 3) {
          scenes = parsed.scenes.slice(0, 4).map((s: any, idx: number) => ({
            id: s.id || `sc-${idx + 1}`,
            label: s.label || `0${idx + 1} · Scene`,
            durationSec: Math.max(3, Math.min(8, Number(s.durationSec) || 4)),
            spokenScript: String(s.spokenScript || ''),
            kineticCaption: String(s.kineticCaption || '').slice(0, 48),
            visualDirection: String(s.visualDirection || ''),
          }));
        }
      }
    } catch {
      // use grounded template generator below
    }
  }

  if (!scenes) {
    if (isInsurance) {
      if (payload.template === 'old_vs_new') {
        scenes = [
          {
            id: 'sc-1',
            label: '01 · Pattern Interrupt Hook',
            durationSec: 4,
            spokenScript: `Why do quote websites ask for your phone number before showing a single real price?`,
            kineticCaption: 'STOP BEING SOLD AS A LEAD',
            visualDirection: 'Stark editorial title card with high-contrast emerald accent line.',
          },
          {
            id: 'sc-2',
            label: '02 · The Old Way (Pain)',
            durationSec: 5,
            spokenScript: `Because on most sites, you are the lead — sold to twelve brokers before dinner.`,
            kineticCaption: 'OLD WAY: 12 SPAM CALLS',
            visualDirection: 'Muted dark split card calling out broker spam and hidden fine print.',
          },
          {
            id: 'sc-3',
            label: '03 · The New Way (Mechanism)',
            durationSec: 5,
            spokenScript: `${brand} lets you compare documented coverage and prices privately — with zero pressure.`,
            kineticCaption: `${brand.toUpperCase()}: 100% PRIVATE`,
            visualDirection: 'Clean brand-colored comparison spotlight showing transparent coverage clarity.',
          },
          {
            id: 'sc-4',
            label: '04 · Direct CTA Closer',
            durationSec: 4,
            spokenScript: `You choose which provider may contact you. Compare free in two minutes at ${domain}.`,
            kineticCaption: `COMPARE AT ${domain.toUpperCase()}`,
            visualDirection: 'Minimal CTA end-frame with brand badge and URL.',
          },
        ];
      } else {
        scenes = [
          {
            id: 'sc-1',
            label: '01 · Scroll-Stopper Hook',
            durationSec: 4,
            spokenScript: `The consumer is not a lead. It is time to change how insurance comparison works.`,
            kineticCaption: 'THE CONSUMER IS NOT A LEAD',
            visualDirection: 'High-contrast magazine editorial intro in brand emerald & deep navy.',
          },
          {
            id: 'sc-2',
            label: '02 · Core Frustration',
            durationSec: 4,
            spokenScript: `Stop handing your phone number to quote sites that sell your info to call centers.`,
            kineticCaption: 'ZERO SPAM. ZERO BROKERS.',
            visualDirection: 'Clean rhythmic kinetic caption transition over dark obsidian texture.',
          },
          {
            id: 'sc-3',
            label: '03 · Product Proof',
            durationSec: 5,
            spokenScript: `With ${brand}, review factual coverage and price differences side by side — completely privately.`,
            kineticCaption: 'FACTUAL SIDE-BY-SIDE CLARITY',
            visualDirection: 'Focused value showcase card highlighting private comparison and control.',
          },
          {
            id: 'sc-4',
            label: '04 · Clear Call to Action',
            durationSec: 4,
            spokenScript: `Only the provider you choose can reach out. Try ${brand} free at ${domain}.`,
            kineticCaption: `START FREE · ${domain.toUpperCase()}`,
            visualDirection: 'Crisp closing frame with solid brand CTA button.',
          },
        ];
      }
    } else {
      const claim = (brief || `${brand} gives you faster, clearer results without the noise`).split(/[.!\n]/)[0].trim();
      scenes = [
        {
          id: 'sc-1',
          label: '01 · Hook',
          durationSec: 4,
          spokenScript: `Stop settling for slow, outdated options that waste your time every week.`,
          kineticCaption: `MEET ${brand.toUpperCase()}`,
          visualDirection: 'Clean opening editorial frame with bold focal headline.',
        },
        {
          id: 'sc-2',
          label: '02 · The Shift',
          durationSec: 5,
          spokenScript: `${brand} was built to fix that: ${claim}.`,
          kineticCaption: claim.slice(0, 42).toUpperCase(),
          visualDirection: 'High-contrast brand statement card with subtle motion zoom.',
        },
        {
          id: 'sc-3',
          label: '03 · Concrete Proof',
          durationSec: 5,
          spokenScript: `Clear execution, zero guesswork, and real outcomes you stay in control of from day one.`,
          kineticCaption: 'BUILT FOR REAL OUTCOMES',
          visualDirection: 'Minimalist benefit spotlight over brand palette accents.',
        },
        {
          id: 'sc-4',
          label: '04 · Direct CTA',
          durationSec: 4,
          spokenScript: `See how ${brand} works right now at ${domain}.`,
          kineticCaption: `VISIT ${domain.toUpperCase()}`,
          visualDirection: 'Closing CTA card with generous negative space.',
        },
      ];
    }
  }

  const qualityGates = evaluateVideoQualityGates(scenes, false, aspectRatio, directive);

  return {
    ok: true,
    title: `${brand} · ${
      payload.template === 'old_vs_new'
        ? 'Old Way vs. New Way Ad Video'
        : payload.template === 'explainer'
        ? 'Animated Brand Explainer'
        : payload.template === 'ugc_story'
        ? 'Founder Story Reel'
        : 'Product Launch Reel'
    }`,
    template: payload.template,
    aspectRatio,
    impeccableDirective: directive,
    scenes,
    qualityGates,
  };
}

/**
 * Parallax-Style Creative Director Agent Chat
 * Translates plain-English user instructions into concrete timeline, script, voice, music & aesthetic updates!
 */
export async function runCreativeDirectorChat(payload: {
  message: string;
  brandName: string;
  websiteUrl?: string;
  aspectRatio: '9:16' | '16:9';
  voiceId: string;
  musicStyle: MusicBedStyle;
  impeccableDirective: ImpeccableDirective;
  hasAudioTrack: boolean;
  scenes: VideoSceneBlock[];
}) {
  const msg = (payload.message || '').trim();
  const lower = msg.toLowerCase();
  let nextScenes = payload.scenes.map((s) => ({ ...s }));
  let nextAspect = payload.aspectRatio;
  let nextVoice = payload.voiceId;
  let nextMusic = payload.musicStyle;
  let nextDirective = payload.impeccableDirective;
  const actionsTaken: string[] = [];

  // 1. Detect Impeccable direction commands
  if (/\bbolder\b|\bpunchier\b|\bposter\b|\bhigh contrast\b/i.test(lower)) {
    nextDirective = 'bolder';
    actionsTaken.push('Switched visual aesthetic to Impeccable Bolder (Swiss Poster contrast)');
  } else if (/\bquieter\b|\bcalm\b|\bluxury\b|\bminimalist\b|\bsubtle\b/i.test(lower)) {
    nextDirective = 'quieter';
    actionsTaken.push('Switched visual aesthetic to Impeccable Quieter (Luxury Editorial Calm)');
  } else if (/\bdistill\b|\bshorter\b|\btrim\b|\bcut fluff\b/i.test(lower)) {
    nextDirective = 'distill';
    nextScenes = nextScenes.map((s) => ({
      ...s,
      spokenScript: s.spokenScript.split(/\s+/).slice(0, 12).join(' ').replace(/[,;:\-]+$/, '') + '.',
      kineticCaption: s.kineticCaption.split(/\s+/).slice(0, 4).join(' '),
    }));
    actionsTaken.push('Distilled all scenes down to tight, minimalist phrasing');
  } else if (/\btypeset\b|\bmagazine\b|\bserif\b|\beditorial\b/i.test(lower)) {
    nextDirective = 'typeset';
    actionsTaken.push('Switched typography to Impeccable Typeset (Editorial Serif)');
  }

  // 2. Detect Aspect Ratio changes
  if (/16:9|widescreen|youtube|landscape|horizontal/i.test(lower)) {
    nextAspect = '16:9';
    actionsTaken.push('Changed video canvas to 16:9 Widescreen (1280×720)');
  } else if (/9:16|vertical|tiktok|reels|shorts/i.test(lower)) {
    nextAspect = '9:16';
    actionsTaken.push('Changed video canvas to 9:16 Vertical (720×1280)');
  }

  // 3. Detect Voice changes
  if (/british|uk/i.test(lower)) {
    nextVoice = /male|man|deep|george/i.test(lower) ? 'bm_george' : 'bf_emma';
    actionsTaken.push(`Selected ${nextVoice === 'bm_george' ? 'George (Executive British)' : 'Emma (Luxury British)'} Kokoro voice`);
  } else if (/male|man|deep|founder|adam|michael/i.test(lower)) {
    nextVoice = /bold|adam/i.test(lower) ? 'am_adam' : 'am_michael';
    actionsTaken.push(`Selected ${nextVoice === 'am_adam' ? 'Adam (Direct & Bold)' : 'Michael (Authoritative Founder)'} Kokoro voice`);
  } else if (/female|woman|warm|bella|sarah/i.test(lower)) {
    nextVoice = /sarah|crisp/i.test(lower) ? 'af_sarah' : 'af_bella';
    actionsTaken.push(`Selected ${nextVoice === 'af_sarah' ? 'Sarah (Crisp Editorial)' : 'Bella (Warm Confident)'} Kokoro voice`);
  }

  // 4. Detect Music Bed changes
  if (/no music|mute music|voice only|silent/i.test(lower)) {
    nextMusic = 'none';
    actionsTaken.push('Muted background music (voiceover-only mix)');
  } else if (/ambient|calm|chill|soft|synth/i.test(lower)) {
    nextMusic = 'ambient_synth';
    actionsTaken.push('Set music bed to Warm Ambient Synth');
  } else if (/fast|energy|beat|hype|momentum|launch/i.test(lower)) {
    nextMusic = 'launch_momentum';
    actionsTaken.push('Set music bed to High-Energy Launch Beat');
  } else if (/pulse|minimal|editorial/i.test(lower)) {
    nextMusic = 'editorial_pulse';
    actionsTaken.push('Set music bed to Editorial Minimal Pulse');
  }

  // 5. Detect Pacing changes
  if (/faster|quicker|12 sec|speed up/i.test(lower)) {
    nextScenes = nextScenes.map((s) => ({ ...s, durationSec: Math.max(3, s.durationSec - 1) }));
    actionsTaken.push('Tightened scene durations for faster scroll-stopping pacing');
  } else if (/slower|longer|breathe|more time/i.test(lower)) {
    nextScenes = nextScenes.map((s) => ({ ...s, durationSec: Math.min(8, s.durationSec + 1) }));
    actionsTaken.push('Expanded scene durations for calmer pacing');
  }

  // 6. Live LLM Rewrite if connected & user asked for script/hook edits
  const llm = getLLMConfig();
  if ((llm.apiKey || llm.provider === 'openai_compatible') && /rewrite|hook|scene|script|focus|mention|change|make it/i.test(lower)) {
    try {
      const raw = await generateText(
        `User instruction: "${msg}"\nCurrent scenes JSON: ${JSON.stringify(nextScenes)}`,
        `You are a sharp Creative Director for ${payload.brandName}. Apply the user's edit to the scenes cleanly, keeping captions under 46 chars and avoiding AI clichés. Return ONLY JSON: {"reply":"1-sentence summary of what you changed","scenes":[...]}`
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.scenes) && parsed.scenes.length > 0) {
          nextScenes = parsed.scenes.map((s: any, idx: number) => ({
            ...(nextScenes[idx] || {}),
            ...s,
            durationSec: Math.max(3, Math.min(8, Number(s.durationSec) || 4)),
          }));
          if (parsed.reply) actionsTaken.push(String(parsed.reply));
        }
      }
    } catch {
      // keep deterministic updates
    }
  } else if (/hook/i.test(lower) && nextScenes[0]) {
    const cleaned = refineAdCopyByDirective(
      {
        headline: nextScenes[0].kineticCaption,
        primaryText: nextScenes[0].spokenScript,
        ctaText: 'Compare Now',
        visualPrompt: nextScenes[0].visualDirection,
      },
      nextDirective === 'default' ? 'bolder' : nextDirective,
      payload.brandName
    );
    nextScenes[0].kineticCaption = cleaned.headline.toUpperCase().slice(0, 44);
    nextScenes[0].spokenScript = cleaned.primaryText;
    actionsTaken.push('Tightened Scene 1 hook for stronger 2-second thumb-stop');
  }

  const qualityGates = evaluateVideoQualityGates(nextScenes, payload.hasAudioTrack, nextAspect, nextDirective);

  const reply =
    actionsTaken.length > 0
      ? `Done — ${actionsTaken.join('; ')}. Quality Gate score is now ${qualityGates.score}/100.`
      : `Got it! Updated the timeline for ${payload.brandName}. You can tell me things like "make it Bolder", "switch to 16:9 widescreen", "use a British male voice", or "distill the script shorter".`;

  return {
    ok: true,
    reply,
    aspectRatio: nextAspect,
    voiceId: nextVoice,
    musicStyle: nextMusic,
    impeccableDirective: nextDirective,
    scenes: nextScenes,
    qualityGates,
  };
}
