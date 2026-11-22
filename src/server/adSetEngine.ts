/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS High-End Multi-Source Ad Set Engine
 * Builds a complete, editable 4-ad high-converting campaign set from ANY combination of:
 *   - Website URL (read quietly in background — never slapped as raw screenshot onto ads)
 *   - Social Media Profile URL or pasted LinkedIn / Instagram / X / TikTok bio & posts
 *   - Uploaded Personal Likeness / Founder Headshot / Product Photo
 *   - Plain-English Offer / Campaign Brief
 * Uses live Gemini/OpenAI/Anthropic AI copywriting + Gemini/OpenAI commercial photography
 * (with multimodal likeness reference) when API keys are connected, and renders agency-grade
 * editorial PNG ad creatives in the brand's exact colors when running in zero-cost local mode.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { generateText, getActiveImageProvider, getLLMConfig } from './llmProvider.ts';
import { runFullWebsiteBrandScan } from './brandScanner.ts';
import { scrapeUrlContext } from './ingest.ts';
import { saveDataUrlMedia } from './storage.ts';
import { generateBrandAdCreative, type AdCreativeStyle } from './adCreativeEngine.ts';
import { recordUsageEvent } from './usageLedger.ts';
import {
  auditAdForSlop,
  refineAdCopyByDirective,
  getDirectivePhotoDirection,
  IMPECCABLE_PHOTO_GUARDRAILS,
  type ImpeccableDirective,
  type ImpeccableCraftAudit,
} from './impeccableAdEngine.ts';

const MEDIA_DIR = path.resolve(process.cwd(), '.adnetiks-data', 'media');

export interface AdSetItem {
  id: string;
  slotLabel: string;
  angleTag: string;
  platform: 'meta' | 'linkedin' | 'instagram' | 'tiktok';
  aspectRatio: '1:1' | '4:3' | '16:9' | '9:16';
  creativeStyle: AdCreativeStyle;
  headline: string;
  primaryText: string;
  ctaText: string;
  destinationUrl: string;
  visualPrompt: string;
  imageUrl: string;
  visualSource: 'gemini_ai_photo' | 'openai_ai_photo' | 'adnetiks_editorial_studio' | 'user_uploaded';
  impeccableDirective?: ImpeccableDirective;
  craftAudit?: ImpeccableCraftAudit;
  oldWayPoints?: string[];
  newWayPoints?: string[];
}

export interface GenerateAdSetPayload {
  brandName: string;
  websiteUrl?: string;
  socialProfileUrl?: string;
  socialBioText?: string;
  offerBrief?: string;
  likenessImageDataUrl?: string;
  likenessImageUrl?: string;
  impeccableDirective?: ImpeccableDirective;
  brandColors?: {
    primary: string;
    secondary: string;
    background: string;
    swatches: string[];
  };
  brandFonts?: string[];
  targetAudience?: {
    name: string;
    roleTitle: string;
    painPoints?: string[];
  };
}

function resolveMediaDataUri(urlOrDataUri?: string): { mimeType: string; base64: string } | null {
  if (!urlOrDataUri) return null;
  if (urlOrDataUri.startsWith('data:image/')) {
    const match = urlOrDataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) return { mimeType: match[1], base64: match[2] };
  }
  if (urlOrDataUri.startsWith('/api/media/')) {
    const fname = path.basename(decodeURIComponent(urlOrDataUri.replace(/^\/api\/media\//, '')));
    const full = path.join(MEDIA_DIR, fname);
    if (fs.existsSync(full)) {
      const ext = path.extname(full).toLowerCase();
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
      return { mimeType, base64: fs.readFileSync(full).toString('base64') };
    }
  }
  return null;
}

async function generateLiveAiPhoto(
  prompt: string,
  aspectRatio: '1:1' | '4:3' | '16:9' | '9:16',
  brandName: string,
  likenessImageUrl?: string
): Promise<{ imageUrl: string; source: 'gemini_ai_photo' | 'openai_ai_photo' } | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const parts: any[] = [];
      const refImg = resolveMediaDataUri(likenessImageUrl);
      if (refImg) {
        parts.push({
          inlineData: {
            mimeType: refImg.mimeType,
            data: refImg.base64,
          },
        });
        parts.push({
          text: `Using the person or product shown in the reference image (preserving their likeness/appearance faithfully), create an ultra-high-end commercial advertising photograph: ${prompt}. Shot on medium-format camera, crisp editorial studio lighting, clean luxury composition, NO text walls, NO watermarks, NO browser screenshots.`,
        });
      } else {
        parts.push({
          text: `Ultra-high-end commercial advertising photograph: ${prompt}. Shot on medium-format camera, crisp editorial studio lighting, clean composition with natural negative space for paid social ad performance, NO dense text, NO watermarks, NO webpage screenshots.`,
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio } },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          const saved = saveDataUrlMedia(`data:${mime};base64,${part.inlineData.data}`, `${brandName}_ai_ad.png`);
          recordUsageEvent({
            operation: 'generate_image',
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite-image',
            overrideCostUsd: 0.03,
            meta: `${brandName} (${aspectRatio} AI ad photo)`,
          });
          return { imageUrl: saved.url, source: 'gemini_ai_photo' };
        }
      }
    } catch (err) {
      console.warn('Gemini AI ad photo generation failed, falling back:', err);
    }
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const size = aspectRatio === '16:9' || aspectRatio === '4:3' ? '1536x1024' : aspectRatio === '9:16' ? '1024x1536' : '1024x1024';
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: `High-end commercial advertising photograph for ${brandName}: ${prompt}. Editorial studio lighting, clean composition, NO dense text, NO watermarks.`,
          size,
        }),
        signal: AbortSignal.timeout(35000),
      });
      if (resp.ok) {
        const json: any = await resp.json();
        const b64 = json?.data?.[0]?.b64_json;
        if (b64) {
          const saved = saveDataUrlMedia(`data:image/png;base64,${b64}`, `${brandName}_openai_ad.png`);
          recordUsageEvent({
            operation: 'generate_image',
            provider: 'openai',
            model: 'gpt-image-1',
            overrideCostUsd: 0.04,
            meta: `${brandName} (${aspectRatio} OpenAI ad photo)`,
          });
          return { imageUrl: saved.url, source: 'openai_ai_photo' };
        }
      }
    } catch (err) {
      console.warn('OpenAI AI ad photo generation failed, falling back:', err);
    }
  }

  return null;
}

export async function generateHighEndAdSet(payload: GenerateAdSetPayload) {
  const startedAt = Date.now();
  const sourcesUsed: string[] = [];

  // 1. Save uploaded Likeness / Product Photo permanently if provided
  let likenessUrl = payload.likenessImageUrl || '';
  if (payload.likenessImageDataUrl && payload.likenessImageDataUrl.startsWith('data:image/')) {
    const saved = saveDataUrlMedia(payload.likenessImageDataUrl, `${payload.brandName || 'brand'}_likeness.png`);
    likenessUrl = saved.url;
    sourcesUsed.push('Uploaded Likeness / Product Photo');
  } else if (likenessUrl) {
    sourcesUsed.push('Brand Likeness / Product Photo');
  }

  // 2. Quietly read Website URL in background (brand colors, fonts, multi-page messaging — NOT raw screenshots on ads!)
  let brandName = (payload.brandName || '').trim();
  let palette = payload.brandColors;
  let fonts = payload.brandFonts;
  let websiteTagline = '';
  let websiteDossier = '';
  let websiteDomain = '';
  let websiteUrl = (payload.websiteUrl || '').trim();

  if (websiteUrl) {
    try {
      const scan = await runFullWebsiteBrandScan(websiteUrl);
      if (scan.ok) {
        if (!brandName) brandName = scan.brandName || scan.domain || 'My Brand';
        palette = scan.palette || palette;
        fonts = scan.fonts || fonts;
        websiteTagline = scan.tagline || '';
        websiteDossier = scan.summaryText || '';
        websiteDomain = scan.domain || '';
        websiteUrl = scan.url || websiteUrl;
        sourcesUsed.push(`Website (${scan.crawledPages?.length || 1} pages read silently)`);
      }
    } catch {
      // keep user inputs
    }
  }

  // 3. Pull Social Media Profile URL (LinkedIn / X / IG / TikTok / YouTube) + pasted social bio/posts
  let socialContext = '';
  if (payload.socialProfileUrl && payload.socialProfileUrl.trim().startsWith('http')) {
    try {
      const scraped = await scrapeUrlContext(payload.socialProfileUrl.trim());
      if (scraped.ok) {
        socialContext += `Social Profile (${scraped.domain}): ${scraped.title} — ${scraped.description}\n${scraped.summaryText || ''}\n`;
        if (!brandName && scraped.title) brandName = scraped.title.split(/[|\-–]/)[0].trim();
        sourcesUsed.push(`Social Profile (${scraped.domain})`);
      } else {
        socialContext += `Social Profile URL: ${payload.socialProfileUrl.trim()}\n`;
        sourcesUsed.push('Social Profile URL');
      }
    } catch {
      socialContext += `Social Profile URL: ${payload.socialProfileUrl.trim()}\n`;
    }
  }
  if (payload.socialBioText && payload.socialBioText.trim()) {
    socialContext += `Creator / Brand Social Voice & Bio:\n${payload.socialBioText.trim()}\n`;
    sourcesUsed.push('Social Bio / Voice Notes');
  }
  if (payload.offerBrief && payload.offerBrief.trim()) {
    sourcesUsed.push('Direct Offer Brief');
  }

  brandName = brandName || 'Your Brand';
  const destinationUrl = websiteUrl || payload.socialProfileUrl || 'https://adnetiks.io';
  const combinedBrief = [
    `Brand Name: ${brandName}`,
    websiteTagline ? `Core Tagline: ${websiteTagline}` : '',
    payload.offerBrief ? `Primary Offer / Campaign Goal:\n${payload.offerBrief}` : '',
    socialContext ? `Social Identity & Voice:\n${socialContext}` : '',
    websiteDossier ? `Website Messaging Dossier:\n${websiteDossier.slice(0, 2200)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const llmConfig = getLLMConfig();
  const hasLlmKey = !!llmConfig.apiKey || llmConfig.provider === 'openai_compatible';
  const imageProvider = getActiveImageProvider();

  // 4. Draft 4 Distinct Direct-Response Ads (Live LLM when key exists, smart source-grounded engine otherwise)
  type DraftAd = Omit<AdSetItem, 'imageUrl' | 'visualSource'>;
  let draftedAds: DraftAd[] | null = null;

  if (hasLlmKey) {
    const systemPrompt = `You are a world-class performance marketing creative director at a top DTC & B2B ad agency (like Motion, Ridge, Stripe, or Brex).
Create a complete, high-converting 4-ad paid social campaign set grounded strictly in the real brand facts below:

${combinedBrief}

Target Audience: ${payload.targetAudience?.name || 'High-Intent Buyers'} (${payload.targetAudience?.roleTitle || 'Decision Makers'})
Pain Points: ${(payload.targetAudience?.painPoints || []).join('; ') || 'Wasted time, unclear alternatives, distrust of spammy competitors'}

Rules:
- Every single ad MUST speak directly about ${brandName}'s real product, value proposition, and audience — ZERO generic marketing clichés.
- Headlines must be crisp, thumb-stopping, 4–9 words max (for high ad rank & readability).
- Primary ad copy must use proven direct-response persuasion (hook, problem/proof, concrete benefit, clear CTA) in 2–4 punchy paragraphs.
- Each ad must have a distinct visual art direction prompt describing a CLEAN commercial photograph or editorial scene (NO webpage screenshots, NO walls of text).
- For Ad 2 (old_vs_new), include 3 crisp "oldWayPoints" and 3 crisp "newWayPoints" (max 8 words each).

Return STRICTLY valid JSON:
{
  "ads": [
    {
      "id": "ad-1",
      "slotLabel": "Ad 01 · Scroll-Stopper Hero",
      "angleTag": "Thumb-Stop Awareness",
      "platform": "meta",
      "aspectRatio": "1:1",
      "creativeStyle": "editorial_hook",
      "headline": "...",
      "primaryText": "...",
      "ctaText": "...",
      "visualPrompt": "..."
    },
    {
      "id": "ad-2",
      "slotLabel": "Ad 02 · Old Way vs. New Way",
      "angleTag": "Comparison & Objection Crusher",
      "platform": "linkedin",
      "aspectRatio": "1:1",
      "creativeStyle": "old_vs_new",
      "headline": "...",
      "primaryText": "...",
      "ctaText": "...",
      "visualPrompt": "...",
      "oldWayPoints": ["...", "...", "..."],
      "newWayPoints": ["...", "...", "..."]
    },
    {
      "id": "ad-3",
      "slotLabel": "Ad 03 · Authority & Proof",
      "angleTag": "Trust & Credibility",
      "platform": "instagram",
      "aspectRatio": "4:3",
      "creativeStyle": "proof_spotlight",
      "headline": "...",
      "primaryText": "...",
      "ctaText": "...",
      "visualPrompt": "..."
    },
    {
      "id": "ad-4",
      "slotLabel": "Ad 04 · Direct Conversion Closer",
      "angleTag": "Urgent Action CTA",
      "platform": "tiktok",
      "aspectRatio": "9:16",
      "creativeStyle": "social_story",
      "headline": "...",
      "primaryText": "...",
      "ctaText": "...",
      "visualPrompt": "..."
    }
  ]
}`;
    try {
      const raw = await generateText('Generate the 4-ad high-converting campaign set now.', systemPrompt);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.ads) && parsed.ads.length >= 4) {
          draftedAds = parsed.ads.slice(0, 4).map((a: any, idx: number) => ({
            id: `adset-${Date.now()}-${idx + 1}`,
            slotLabel: a.slotLabel || `Ad 0${idx + 1}`,
            angleTag: a.angleTag || 'Direct Response',
            platform: a.platform || (['meta', 'linkedin', 'instagram', 'tiktok'][idx] as any),
            aspectRatio: a.aspectRatio || (['1:1', '1:1', '4:3', '9:16'][idx] as any),
            creativeStyle: a.creativeStyle || (['editorial_hook', 'old_vs_new', 'proof_spotlight', 'social_story'][idx] as AdCreativeStyle),
            headline: String(a.headline || brandName).slice(0, 76),
            primaryText: String(a.primaryText || ''),
            ctaText: String(a.ctaText || 'Learn More').slice(0, 26),
            destinationUrl,
            visualPrompt: String(a.visualPrompt || `Editorial studio ad visual for ${brandName}`),
            oldWayPoints: Array.isArray(a.oldWayPoints) ? a.oldWayPoints : undefined,
            newWayPoints: Array.isArray(a.newWayPoints) ? a.newWayPoints : undefined,
          }));
        }
      }
    } catch (err) {
      console.warn('LLM Ad Set copy synthesis fallback:', err);
    }
  }

  // Grounded local direct-response fallback when no LLM API key is connected yet
  if (!draftedAds) {
    const textLower = combinedBrief.toLowerCase();
    const isInsurance = /\b(insurance|polici|policy|carrier|quote|coverage|lead|compare)\b/i.test(textLower);
    const coreClaim =
      (payload.offerBrief && payload.offerBrief.trim().split(/[.!\n]/)[0].trim()) ||
      websiteTagline ||
      (payload.socialBioText && payload.socialBioText.trim().split(/[.!\n]/)[0].trim()) ||
      `${brandName} delivers clarity and measurable results without the noise`;
    const shortDomain = websiteDomain || brandName;

    draftedAds = isInsurance
      ? [
          {
            id: `adset-${Date.now()}-1`,
            slotLabel: 'Ad 01 · Scroll-Stopper Hero',
            angleTag: 'Privacy & Control Hook',
            platform: 'meta',
            aspectRatio: '1:1',
            creativeStyle: 'editorial_hook',
            headline: 'You Are Not a Lead. Compare Privately.',
            primaryText: `Tired of typing your phone number into "free quote" websites only to get 15 spam calls before dinner?\n\n${brandName} flips the entire model. Review factual, documented coverage and price differences 100% privately — and YOU choose which provider is allowed to contact you.\n\nNo lead brokers. No pressure. Compare in 2 minutes at ${shortDomain}.`,
            ctaText: 'Compare Privately',
            destinationUrl,
            visualPrompt: `Calm confident homeowner reviewing clean policy clarity on a sleek tablet in warm architectural morning light, subtle emerald ${palette?.primary || '#047857'} accent tone, luxury editorial commercial photography`,
          },
          {
            id: `adset-${Date.now()}-2`,
            slotLabel: 'Ad 02 · Old Way vs. New Way',
            angleTag: 'Comparison & Objection Crusher',
            platform: 'linkedin',
            aspectRatio: '1:1',
            creativeStyle: 'old_vs_new',
            headline: 'Stop Being Sold to 12 Call Centers.',
            primaryText: `Most online insurance sites aren't built to help you compare — they're built to resell your phone number to the highest bidder.\n\nOn ${brandName}, every offer is documented side-by-side in plain English so you spot real deductibles, real limits, and real savings before sharing your contact info with anyone.\n\nSee the difference yourself → ${shortDomain}`,
            ctaText: 'See Real Offers',
            destinationUrl,
            visualPrompt: `Minimalist luxury studio comparison editorial graphic contrasting cluttered red noise against calm emerald clarity for ${brandName}`,
            oldWayPoints: [
              'Phone number sold to 10+ aggressive brokers',
              'Hidden deductibles & confusing fine print',
              'Non-stop spam calls before seeing real prices',
            ],
            newWayPoints: [
              'Compare documented offers 100% privately',
              'Side-by-side factual coverage & price clarity',
              'You choose which provider may contact you',
            ],
          },
          {
            id: `adset-${Date.now()}-3`,
            slotLabel: 'Ad 03 · Authority & Proof',
            angleTag: 'Trust & Consumer-First',
            platform: 'instagram',
            aspectRatio: '4:3',
            creativeStyle: 'proof_spotlight',
            headline: 'Factual Coverage. Zero Guesswork.',
            primaryText: `Before your next renewal auto-charges you more for the exact same policy, take 2 minutes to check the documented facts.\n\n${brandName} puts side-by-side coverage and real pricing in front of you privately — free for consumers, zero spam, total control.\n\nTap below to check your options at ${shortDomain}.`,
            ctaText: 'Check My Options',
            destinationUrl,
            visualPrompt: `Editorial portrait of a relaxed modern family in a sunlit architectural living room, serene trustworthy mood, warm natural film photography with deep emerald accents`,
          },
          {
            id: `adset-${Date.now()}-4`,
            slotLabel: 'Ad 04 · Direct Conversion Closer',
            angleTag: 'Urgent Renewal Action',
            platform: 'tiktok',
            aspectRatio: '9:16',
            creativeStyle: 'social_story',
            headline: 'Never Give Your Number to a Quote Site Again.',
            primaryText: `Renewal coming up? Don't hand your phone number to a lead broker.\n\nCompare documented insurance policies privately on ${brandName} and only talk to the single provider you pick.\n\nTap below to start free at ${shortDomain}.`,
            ctaText: 'Start Free Comparison',
            destinationUrl,
            visualPrompt: `Vertical 9:16 lifestyle commercial photograph of a confident young professional smiling in a bright modern kitchen holding a phone, crisp editorial lighting, clean negative space at top and bottom`,
          },
        ]
      : [
          {
            id: `adset-${Date.now()}-1`,
            slotLabel: 'Ad 01 · Scroll-Stopper Hero',
            angleTag: 'Thumb-Stop Awareness',
            platform: 'meta',
            aspectRatio: '1:1',
            creativeStyle: 'editorial_hook',
            headline: coreClaim.slice(0, 62),
            primaryText: `Most people settle for slow, outdated options because they haven't seen what ${brandName} makes possible.\n\n${coreClaim}. Built directly around real outcomes — zero fluff, zero wasted time.\n\nExplore ${brandName} today → ${shortDomain}`,
            ctaText: 'Explore Now',
            destinationUrl,
            visualPrompt: `High-end editorial commercial hero photograph representing ${brandName} (${coreClaim}), moody architectural lighting, brand color accents, luxury advertising aesthetic`,
          },
          {
            id: `adset-${Date.now()}-2`,
            slotLabel: 'Ad 02 · Old Way vs. New Way',
            angleTag: 'Comparison & Objection Crusher',
            platform: 'linkedin',
            aspectRatio: '1:1',
            creativeStyle: 'old_vs_new',
            headline: `Why Smart Teams Are Switching to ${brandName}`,
            primaryText: `Compare the old way to how ${brandName} works:\n\nInstead of juggling broken tools, vague promises, and guesswork, ${brandName} gives you transparent execution and measurable momentum from day one.\n\nSee the full breakdown at ${shortDomain}.`,
            ctaText: 'See How It Works',
            destinationUrl,
            visualPrompt: `Clean high-contrast luxury editorial product presentation for ${brandName}, crisp studio reflections`,
            oldWayPoints: [
              'Slow manual workflows & scattered tools',
              'Vague promises with zero measurable proof',
              'Wasted budget on generic one-size-fits-all',
            ],
            newWayPoints: [
              coreClaim.slice(0, 52),
              `Tailored directly by ${brandName}`,
              'Fast, transparent results you control',
            ],
          },
          {
            id: `adset-${Date.now()}-3`,
            slotLabel: 'Ad 03 · Authority & Proof',
            angleTag: 'Trust & Credibility',
            platform: 'instagram',
            aspectRatio: '4:3',
            creativeStyle: 'proof_spotlight',
            headline: `Built for Real Results — Not Hype.`,
            primaryText: `Your audience can spot generic promises in half a second.\n\n${brandName} focuses on concrete value: ${coreClaim}. Everything designed to earn trust and convert real buyers.\n\nTap below to get started at ${shortDomain}.`,
            ctaText: 'Get Started',
            destinationUrl,
            visualPrompt: `Editorial studio portrait of an authentic founder/creator in confident natural light representing ${brandName}, sharp Leica commercial look`,
          },
          {
            id: `adset-${Date.now()}-4`,
            slotLabel: 'Ad 04 · Direct Conversion Closer',
            angleTag: 'Urgent Action CTA',
            platform: 'tiktok',
            aspectRatio: '9:16',
            creativeStyle: 'social_story',
            headline: `Ready to Upgrade? Meet ${brandName}.`,
            primaryText: `Stop waiting for next quarter to fix what is costing you today.\n\nSee how ${brandName} helps you move faster with confidence — start right now at ${shortDomain}.`,
            ctaText: 'Try It Today',
            destinationUrl,
            visualPrompt: `Vertical 9:16 luxury commercial lifestyle visual for ${brandName}, dramatic clean lighting, generous breathing room for headline`,
          },
        ];
  }

  // 5. Apply Impeccable Creative Direction + Render Real Visuals + Deterministic Slop Audit for ALL 4 Ads
  const activeDirective: ImpeccableDirective = payload.impeccableDirective || 'default';
  const finalAds: AdSetItem[] = await Promise.all(
    draftedAds.map(async (rawAd, idx) => {
      const refined =
        activeDirective !== 'default'
          ? refineAdCopyByDirective(rawAd, activeDirective, brandName)
          : {
              headline: rawAd.headline,
              primaryText: rawAd.primaryText,
              ctaText: rawAd.ctaText,
              visualPrompt: `${rawAd.visualPrompt}. ${IMPECCABLE_PHOTO_GUARDRAILS}`,
            };
      const ad = { ...rawAd, ...refined, impeccableDirective: activeDirective };

      // Ad 2 (Old Way vs New Way) works best as a crisp comparison graphic card; Ads 1, 3, 4 try Live AI Photography first!
      if (imageProvider && ad.creativeStyle !== 'old_vs_new') {
        const aiPhoto = await generateLiveAiPhoto(
          ad.visualPrompt,
          ad.aspectRatio,
          brandName,
          idx === 0 || idx === 2 ? likenessUrl : undefined
        );
        if (aiPhoto) {
          return {
            ...ad,
            imageUrl: aiPhoto.imageUrl,
            visualSource: aiPhoto.source,
            craftAudit: auditAdForSlop(ad),
          };
        }
      }

      // Render crisp, algorithm-safe PNG ad creative shaped by the Impeccable directive
      const rendered = await generateBrandAdCreative({
        brandName,
        domain: websiteDomain || destinationUrl,
        tagline: websiteTagline || payload.offerBrief?.slice(0, 95),
        headline: ad.headline,
        subheadline: ad.primaryText.split('\n')[0].slice(0, 105),
        ctaText: ad.ctaText,
        eyebrow: ad.angleTag,
        style: ad.creativeStyle,
        aspectRatio: ad.aspectRatio,
        palette,
        fonts,
        oldWayPoints: ad.oldWayPoints,
        newWayPoints: ad.newWayPoints,
        subjectImageUrl: ad.creativeStyle !== 'old_vs_new' ? likenessUrl || undefined : undefined,
        impeccableDirective: activeDirective,
      });

      return {
        ...ad,
        imageUrl: rendered.imageUrl,
        visualSource: 'adnetiks_editorial_studio',
        craftAudit: auditAdForSlop(ad),
      };
    })
  );

  return {
    ok: true,
    elapsedMs: Date.now() - startedAt,
    brandName,
    websiteUrl: destinationUrl,
    palette,
    fonts,
    likenessUrl: likenessUrl || undefined,
    sourcesUsed: sourcesUsed.length > 0 ? sourcesUsed : ['Brand Profile'],
    aiMode: hasLlmKey || imageProvider ? 'live_ai' : 'local_studio',
    hasLlmKey,
    hasImageKey: !!imageProvider,
    imageProvider,
    ads: finalAds,
  };
}

export async function regenerateSingleAdVisual(payload: {
  brandName: string;
  websiteUrl?: string;
  headline: string;
  primaryText: string;
  ctaText: string;
  angleTag?: string;
  visualPrompt: string;
  aspectRatio: '1:1' | '4:3' | '16:9' | '9:16';
  creativeStyle: AdCreativeStyle;
  preferAiPhoto?: boolean;
  palette?: { primary: string; secondary: string; background: string; swatches: string[] };
  fonts?: string[];
  likenessImageUrl?: string;
  impeccableDirective?: ImpeccableDirective;
  oldWayPoints?: string[];
  newWayPoints?: string[];
}) {
  if (payload.preferAiPhoto !== false && getActiveImageProvider() && payload.creativeStyle !== 'old_vs_new') {
    const directedPrompt = `${payload.visualPrompt}. ${getDirectivePhotoDirection(payload.impeccableDirective || 'default')} ${IMPECCABLE_PHOTO_GUARDRAILS}`;
    const aiPhoto = await generateLiveAiPhoto(
      directedPrompt,
      payload.aspectRatio,
      payload.brandName,
      payload.likenessImageUrl
    );
    if (aiPhoto) {
      return { ok: true, imageUrl: aiPhoto.imageUrl, visualSource: aiPhoto.source };
    }
  }

  const rendered = await generateBrandAdCreative({
    brandName: payload.brandName,
    domain: payload.websiteUrl,
    headline: payload.headline,
    subheadline: payload.primaryText.split('\n')[0].slice(0, 105),
    ctaText: payload.ctaText,
    eyebrow: payload.angleTag || payload.brandName,
    style: payload.creativeStyle,
    aspectRatio: payload.aspectRatio,
    palette: payload.palette,
    fonts: payload.fonts,
    oldWayPoints: payload.oldWayPoints,
    newWayPoints: payload.newWayPoints,
    subjectImageUrl: payload.creativeStyle !== 'old_vs_new' ? payload.likenessImageUrl : undefined,
    impeccableDirective: payload.impeccableDirective || 'default',
  });

  return {
    ok: true,
    imageUrl: rendered.imageUrl,
    visualSource: 'adnetiks_editorial_studio' as const,
  };
}

/**
 * 1-Click Impeccable Creative Direction Command (distill | bolder | quieter | typeset | polish)
 * Reshapes the ad's copy, CTA, art direction prompt, AND re-renders its PNG visual using the
 * chosen Impeccable aesthetic while computing a fresh deterministic Craft Audit score.
 */
export async function applyImpeccableDirectionToAd(payload: {
  directive: ImpeccableDirective;
  brandName: string;
  websiteUrl?: string;
  palette?: { primary: string; secondary: string; background: string; swatches: string[] };
  fonts?: string[];
  likenessImageUrl?: string;
  ad: AdSetItem;
}) {
  const { directive, brandName, ad } = payload;
  let updatedCopy = refineAdCopyByDirective(ad, directive, brandName);

  // If live LLM key is configured, also ask the LLM to rewrite copy in that exact Impeccable tone!
  const llm = getLLMConfig();
  if (llm.apiKey || llm.provider === 'openai_compatible') {
    const directiveRules: Record<ImpeccableDirective, string> = {
      distill: 'Cut every unnecessary word. Headline max 5 razor-sharp words. Primary text max 2 crisp short sentences. Zero fluff.',
      bolder: 'Make the headline fearless, unmistakable, and high-contrast (4-7 punchy words). Confident direct-response authority.',
      quieter: 'Luxury editorial calm (Apple / Aesop / Linear). Understated confidence, zero exclamation marks, zero hype words, refined clarity.',
      typeset: 'Editorial magazine voice (Financial Times / Stripe Press). Intelligent, rhythmic cadence, crisp contrast.',
      polish: 'Remove every AI cliché word, sharpen the CTA to a concrete user outcome, break text into clean scannable lines.',
      default: 'Clean direct-response advertising clarity.',
    };
    try {
      const rewrittenRaw = await generateText(
        `Apply the Impeccable "${directive}" directive to this ad for ${brandName}:\nHeadline: ${ad.headline}\nPrimary Copy: ${ad.primaryText}\nCTA: ${ad.ctaText}\nVisual Prompt: ${ad.visualPrompt}`,
        `You are an Impeccable creative director. Rule for "${directive}": ${directiveRules[directive]}\nReturn ONLY valid JSON: {"headline":"...","primaryText":"...","ctaText":"...","visualPrompt":"..."}`
      );
      if (rewrittenRaw) {
        const parsed = JSON.parse(rewrittenRaw);
        if (parsed.headline && parsed.primaryText) {
          updatedCopy = refineAdCopyByDirective(
            {
              headline: String(parsed.headline),
              primaryText: String(parsed.primaryText),
              ctaText: String(parsed.ctaText || updatedCopy.ctaText),
              visualPrompt: String(parsed.visualPrompt || updatedCopy.visualPrompt),
            },
            directive,
            brandName
          );
        }
      }
    } catch {
      // keep deterministic Impeccable refinement
    }
  }

  // Re-render visual in the chosen Impeccable aesthetic (or live AI photo if key is active)
  // Note: When user clicks distill/bolder/quieter/typeset on a non-old_vs_new card without an image API key,
  // switch creativeStyle to editorial_hook so the Impeccable visual design system renders visibly!
  const effectiveStyle: AdCreativeStyle =
    ad.creativeStyle === 'old_vs_new' && directive === 'polish'
      ? 'old_vs_new'
      : ad.creativeStyle === 'old_vs_new'
      ? 'editorial_hook'
      : ad.creativeStyle;

  const visualResp = await regenerateSingleAdVisual({
    brandName,
    websiteUrl: payload.websiteUrl || ad.destinationUrl,
    headline: updatedCopy.headline,
    primaryText: updatedCopy.primaryText,
    ctaText: updatedCopy.ctaText,
    angleTag: ad.angleTag,
    visualPrompt: updatedCopy.visualPrompt,
    aspectRatio: ad.aspectRatio,
    creativeStyle: effectiveStyle,
    palette: payload.palette,
    fonts: payload.fonts,
    likenessImageUrl: payload.likenessImageUrl,
    impeccableDirective: directive,
    oldWayPoints: ad.oldWayPoints,
    newWayPoints: ad.newWayPoints,
  });

  const nextAd: AdSetItem = {
    ...ad,
    ...updatedCopy,
    creativeStyle: effectiveStyle,
    impeccableDirective: directive,
    imageUrl: visualResp.imageUrl,
    visualSource: visualResp.visualSource,
  };
  nextAd.craftAudit = auditAdForSlop(nextAd);

  return {
    ok: true,
    directive,
    ad: nextAd,
    craftAudit: nextAd.craftAudit,
  };
}
