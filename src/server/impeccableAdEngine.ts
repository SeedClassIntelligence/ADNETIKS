/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Impeccable Creative Direction & Deterministic Ad Slop Detector
 * Inspired by Paul Bakaus's Impeccable design vocabulary (impeccable.style):
 *   - Deterministic Ad Slop Detector (0 API cost): catches AI copy clichés, weak CTAs,
 *     overlong headlines that fail Meta/LinkedIn text-to-image ratios, and generic AI visual prompts.
 *   - 1-Click Creative Direction Commands: distill | bolder | quieter | typeset | polish
 *     that actively reshape copy, visual art direction prompts, and rendered ad creatives.
 */

export type ImpeccableDirective = 'default' | 'distill' | 'bolder' | 'quieter' | 'typeset' | 'polish';

export interface SlopFinding {
  severity: 'P0' | 'P1' | 'P2';
  category: 'copy_slop' | 'text_density' | 'cta' | 'visual_direction';
  message: string;
}

export interface ImpeccableCraftAudit {
  score: number; // 0 - 100
  grade: 'Impeccable' | 'Strong' | 'Needs Polish' | 'AI Slop Alert';
  headlineWords: number;
  estimatedTextDensityPct: number;
  flaggedCliches: string[];
  findings: SlopFinding[];
  directiveApplied: ImpeccableDirective;
}

// Deterministic AI copywriting slop phrases to detect and eliminate
const AI_CLICHE_PATTERNS: Array<{ pattern: RegExp; label: string; replacement: string }> = [
  { pattern: /\bgame[- ]changer\b/gi, label: 'game-changer', replacement: 'real upgrade' },
  { pattern: /\brevolutionary\b/gi, label: 'revolutionary', replacement: 'modern' },
  { pattern: /\bunlock(?:ing)?\b/gi, label: 'unlock', replacement: 'get' },
  { pattern: /\belevate(?:s|d|ing)?\b/gi, label: 'elevate', replacement: 'improve' },
  { pattern: /\bseamless(?:ly)?\b/gi, label: 'seamless', replacement: 'smooth' },
  { pattern: /\bdelve(?:s|d|ing)?\b/gi, label: 'delve', replacement: 'look' },
  { pattern: /\bcutting[- ]edge\b/gi, label: 'cutting-edge', replacement: 'proven' },
  { pattern: /\bnext[- ]level\b/gi, label: 'next-level', replacement: 'sharper' },
  { pattern: /\bsynergy\b/gi, label: 'synergy', replacement: 'alignment' },
  { pattern: /\bunleash(?:es|ed|ing)?\b/gi, label: 'unleash', replacement: 'launch' },
  { pattern: /\btapestry\b/gi, label: 'tapestry', replacement: 'mix' },
  { pattern: /\bin today['’]s fast[- ]paced world\b/gi, label: "in today's fast-paced world", replacement: 'Today' },
  { pattern: /\btransform your\b/gi, label: 'transform your', replacement: 'upgrade your' },
  { pattern: /\bbest[- ]in[- ]class\b/gi, label: 'best-in-class', replacement: 'trusted' },
  { pattern: /\bparadigm shift\b/gi, label: 'paradigm shift', replacement: 'better approach' },
];

const WEAK_CTAS = new Set([
  'learn more',
  'click here',
  'submit',
  'check it out',
  'read more',
  'find out more',
  'explore',
]);

const VISUAL_SLOP_PATTERNS = [
  /3d isometric/i,
  /glowing neon/i,
  /cyberpunk/i,
  /holographic/i,
  /matrix code/i,
  /stock photo/i,
  /webpage screenshot/i,
  /purple[- ]to[- ]blue gradient/i,
];

export const IMPECCABLE_PHOTO_GUARDRAILS =
  'Anti-slop art direction: NO purple/cyan neon gradients, NO generic 3D floating icons, NO cheesy stock grins, NO browser screenshots, NO dense text overlays. Use authentic medium-format commercial photography, deliberate 60-30-10 color restraint, tactile natural light, and generous negative space.';

export function getDirectivePhotoDirection(directive: ImpeccableDirective): string {
  switch (directive) {
    case 'distill':
      return 'Ultra-minimalist studio composition with a single clear focal subject, 65% clean uncluttered negative space, architectural shadow, zero props or visual noise.';
    case 'bolder':
      return 'High-contrast editorial poster photography, dramatic directional chiaroscuro studio lighting, confident framing, bold color blocking, unmistakable visual authority.';
    case 'quieter':
      return 'Calm luxury editorial photography in the aesthetic of Aesop, Porsche, or Kinfolk — soft diffused window light, muted warm stone and charcoal tones, quiet sophistication, zero visual aggression.';
    case 'typeset':
      return 'Magazine-cover editorial photography composed with deliberate asymmetric negative space on one side for clean Swiss typography, crisp optical depth of field, timeless print aesthetic.';
    case 'polish':
    default:
      return 'Refined commercial advertising photography, balanced composition, authentic human or product presence, crisp natural contrast, zero AI clichés.';
  }
}

export function auditAdForSlop(ad: {
  headline: string;
  primaryText: string;
  ctaText: string;
  visualPrompt?: string;
  impeccableDirective?: ImpeccableDirective;
}): ImpeccableCraftAudit {
  const findings: SlopFinding[] = [];
  const flaggedCliches: string[] = [];
  let score = 100;

  const combinedCopy = `${ad.headline || ''} ${ad.primaryText || ''}`;
  for (const rule of AI_CLICHE_PATTERNS) {
    if (rule.pattern.test(combinedCopy)) {
      flaggedCliches.push(rule.label);
      score -= 8;
    }
  }
  if (flaggedCliches.length > 0) {
    findings.push({
      severity: flaggedCliches.length >= 2 ? 'P0' : 'P1',
      category: 'copy_slop',
      message: `AI cliché word(s) detected: ${flaggedCliches.join(', ')}. Replace with concrete, factual language.`,
    });
  }

  // Headline word count & visual text-density ratio check
  const headlineWords = (ad.headline || '').trim().split(/\s+/).filter(Boolean).length;
  if (headlineWords > 10) {
    score -= 12;
    findings.push({
      severity: 'P1',
      category: 'text_density',
      message: `Headline is ${headlineWords} words (target 4–8 words). Shorter headlines stop thumbs faster and pass Meta/LinkedIn ad text ratios.`,
    });
  } else if (headlineWords === 0) {
    score -= 20;
    findings.push({
      severity: 'P0',
      category: 'text_density',
      message: 'Missing ad headline.',
    });
  }

  // Exclamation & Emoji spam check
  const exclamations = (combinedCopy.match(/!/g) || []).length;
  if (exclamations >= 3) {
    score -= 7;
    findings.push({
      severity: 'P2',
      category: 'copy_slop',
      message: `Overuse of exclamation marks (${exclamations}). Confident brands rarely shout.`,
    });
  }

  // Paragraph rhythm check
  const primaryLen = (ad.primaryText || '').trim().length;
  const lineBreaks = (ad.primaryText || '').split(/\n+/).filter((l) => l.trim().length > 0).length;
  if (primaryLen > 240 && lineBreaks < 2) {
    score -= 8;
    findings.push({
      severity: 'P1',
      category: 'text_density',
      message: 'Primary copy is an unbroken wall of text. Break into 2–3 scannable short paragraphs.',
    });
  }

  // CTA sharpness check
  const cleanCta = (ad.ctaText || '').trim().toLowerCase();
  if (!cleanCta || WEAK_CTAS.has(cleanCta)) {
    score -= 9;
    findings.push({
      severity: 'P1',
      category: 'cta',
      message: `Generic CTA ("${ad.ctaText || 'empty'}"). Use a specific outcome CTA like "Compare Privately" or "See Real Rates".`,
    });
  }

  // Visual art direction slop check
  if (ad.visualPrompt) {
    const matchedVisualSlop = VISUAL_SLOP_PATTERNS.some((re) => re.test(ad.visualPrompt || ''));
    if (matchedVisualSlop) {
      score -= 14;
      findings.push({
        severity: 'P0',
        category: 'visual_direction',
        message: 'Visual prompt contains generic AI clichés (neon/3D isometric/stock). Switch to clean editorial photography direction.',
      });
    }
  }

  // Bonus restraint for active Impeccable directives
  const directive = ad.impeccableDirective || 'default';
  if (directive === 'distill' || directive === 'quieter' || directive === 'typeset') {
    score = Math.min(100, score + 3);
  }

  score = Math.max(25, Math.min(100, score));
  const estimatedTextDensityPct = Math.min(
    32,
    Math.max(8, Math.round(7 + headlineWords * 1.15 + (directive === 'distill' ? -3 : directive === 'quieter' ? -2 : 0)))
  );

  const grade: ImpeccableCraftAudit['grade'] =
    score >= 90 ? 'Impeccable' : score >= 78 ? 'Strong' : score >= 62 ? 'Needs Polish' : 'AI Slop Alert';

  return {
    score,
    grade,
    headlineWords,
    estimatedTextDensityPct,
    flaggedCliches,
    findings,
    directiveApplied: directive,
  };
}

/**
 * Deterministically refines ad copy, CTA, and visual art direction according to the chosen
 * Impeccable directive (used both offline and as post-processing guardrails after LLM writes).
 */
export function refineAdCopyByDirective(
  ad: {
    headline: string;
    primaryText: string;
    ctaText: string;
    visualPrompt: string;
  },
  directive: ImpeccableDirective,
  brandName: string
): { headline: string; primaryText: string; ctaText: string; visualPrompt: string } {
  let headline = (ad.headline || '').trim();
  let primaryText = (ad.primaryText || '').trim();
  let ctaText = (ad.ctaText || '').trim();
  let visualPrompt = (ad.visualPrompt || '').trim();

  // Always strip AI clichés first
  for (const rule of AI_CLICHE_PATTERNS) {
    headline = headline.replace(rule.pattern, rule.replacement);
    primaryText = primaryText.replace(rule.pattern, rule.replacement);
  }

  // Clean excessive exclamation marks
  primaryText = primaryText.replace(/!{2,}/g, '.');

  // Strip visual slop terms from art direction prompt
  visualPrompt = visualPrompt
    .replace(/3d isometric|glowing neon|cyberpunk|holographic|matrix code|stock photo|webpage screenshot/gi, 'refined editorial')
    .trim();

  // Upgrade weak CTA deterministically
  if (!ctaText || WEAK_CTAS.has(ctaText.toLowerCase())) {
    const isCompare = /compare|polici|insurance|quote|private/i.test(`${brandName} ${headline} ${primaryText}`);
    ctaText = isCompare ? 'Compare Privately' : `See ${brandName}`;
  }

  if (directive === 'distill') {
    // Cut headline to max 6 sharp words; tighten primary text to 2 punchy blocks
    const words = headline.split(/\s+/).filter(Boolean);
    if (words.length > 6) {
      headline = words.slice(0, 6).join(' ').replace(/[,;:\-]+$/, '') + '.';
    }
    const paragraphs = primaryText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length > 2) {
      primaryText = [paragraphs[0], paragraphs[paragraphs.length - 1]].join('\n\n');
    }
  } else if (directive === 'quieter') {
    // Remove ALL CAPS shouting & exclamation marks for luxury calm
    headline = headline.replace(/!+/g, '.');
    primaryText = primaryText.replace(/!+/g, '.').replace(/\b(STOP|NEVER|FREE|NOW)\b/g, (m) =>
      m.charAt(0) + m.slice(1).toLowerCase()
    );
  } else if (directive === 'bolder') {
    // Tighten headline into punchy high-contrast statement
    headline = headline.replace(/\.$/, '');
    const words = headline.split(/\s+/).filter(Boolean);
    if (words.length > 8) {
      headline = words.slice(0, 8).join(' ');
    }
  } else if (directive === 'polish' || directive === 'typeset') {
    // Ensure scannable paragraph rhythm if primaryText is one long block
    if (primaryText.length > 210 && !primaryText.includes('\n')) {
      const sentences = primaryText.split(/(?<=[.!?])\s+/);
      if (sentences.length >= 3) {
        const mid = Math.ceil(sentences.length / 2);
        primaryText = `${sentences.slice(0, mid).join(' ')}\n\n${sentences.slice(mid).join(' ')}`;
      }
    }
  }

  // Enrich visual prompt with Impeccable photography direction + anti-slop guardrails
  const basePrompt = visualPrompt.split('Anti-slop art direction:')[0].trim();
  visualPrompt = `${basePrompt}. ${getDirectivePhotoDirection(directive)} ${IMPECCABLE_PHOTO_GUARDRAILS}`.slice(0, 520);

  return { headline, primaryText, ctaText, visualPrompt };
}
