/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Server-Side AI API Engine
 * Text generation is provider-agnostic via llmProvider.ts (Gemini, OpenAI, Anthropic, OpenAI-compatible).
 * Image generation currently uses Gemini; swap to DALL-E 3 or Stability AI by updating handleGenerateImage.
 */

import { GoogleGenAI } from '@google/genai';
import { generateText } from './llmProvider.ts';
import { extractFirstUrl, scrapeUrlContext } from './ingest.ts';
import { buildActiveMemoryPromptBlock } from './memory.ts';
import { recordUsageEvent } from './usageLedger.ts';
import { generateBrandAdCreative, type AdCreativeStyle } from './adCreativeEngine.ts';
import { saveDataUrlMedia } from './storage.ts';

async function enrichSourceIfUrl(sourceInput: string, sourceType?: string) {
  const url = extractFirstUrl(sourceInput || '');
  if (!url || (sourceType && sourceType !== 'url' && !sourceInput.trim().startsWith('http'))) {
    return { enrichedInput: sourceInput, scraped: null };
  }
  const scraped = await scrapeUrlContext(url);
  if (scraped.ok && scraped.summaryText) {
    return {
      enrichedInput: `${sourceInput}\n\n--- LIVE SCRAPED WEBPAGE CONTEXT ---\n${scraped.summaryText}`,
      scraped,
    };
  }
  return { enrichedInput: sourceInput, scraped };
}

// Gemini client used exclusively for image generation
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export interface GenerateContentPayload {
  brandProfile: {
    name: string;
    archetype: string;
    voiceAttributes: string[];
    bannedWords: string[];
    tagline?: string;
    websiteUrl?: string;
    brandColors?: {
      primary: string;
      secondary: string;
      background: string;
      swatches: string[];
    };
  };
  customerAvatar: {
    name: string;
    roleTitle: string;
    painPoints: string[];
    emotionalTriggers: string[];
    preferredPlatforms: string[];
  };
  sourceType: 'url' | 'social_repurpose' | 'brief';
  sourceInput: string;
  campaignGoal?: string;
  platforms: string[];
}

export async function handleGenerateContent(payload: GenerateContentPayload) {
  const { enrichedInput, scraped } = await enrichSourceIfUrl(payload.sourceInput, payload.sourceType);
  const { promptBlock: memoryPromptBlock, activeCount: appliedMemoryCount } = buildActiveMemoryPromptBlock();
  const systemInstruction = `You are ADNETIKS AI, an elite brand strategist and multi-platform social media growth director.
Brand Profile:
- Brand Name: ${payload.brandProfile.name}
- Brand Archetype: ${payload.brandProfile.archetype}
- Voice Attributes: ${payload.brandProfile.voiceAttributes.join(', ')}
- Strictly Prohibited Words (Do NOT use): ${payload.brandProfile.bannedWords.join(', ')}

Target Customer Avatar:
- Name: ${payload.customerAvatar.name} (${payload.customerAvatar.roleTitle})
- Key Pain Points: ${payload.customerAvatar.painPoints.join('; ')}
- Emotional Triggers: ${payload.customerAvatar.emotionalTriggers.join('; ')}

Task:
Synthesize social campaign copy from the provided source input (${payload.sourceType}):
"${enrichedInput.slice(0, 2200)}"
Campaign Goal: ${payload.campaignGoal || 'High organic engagement and qualified inbound leads'}${memoryPromptBlock}

Generate a structured response for these platforms: ${payload.platforms.join(', ')}.
For each platform, create:
1. Variant A (Hard Data, Direct Value, Action-Oriented)
2. Variant B (Provocative Question, Story Hook, Emotional Resonance)
Also generate:
- Receptivity score (0-100)
- Receptivity rationale explaining why ${payload.customerAvatar.name} connects to this angle
- Recommended hashtags
- Visual asset prompt description

Return STRICTLY valid JSON conforming to this schema:
{
  "receptivity": {
    "score": 92,
    "level": "High",
    "rationale": "Directly tackles Tyler's bottleneck regarding CAC and inconsistent organic cadence.",
    "suggestedHookAngle": "Focus on engineering time saved and predictable revenue."
  },
  "visualPrompt": "Modern high-tech data visualization interface, dark mode with neon red accents, 4:3 ratio",
  "variants": [
    {
      "platform": "linkedin",
      "variantA": {
        "hookAngle": "Data-Driven Teardown",
        "content": "Full post copy...",
        "hashtags": ["#Growth", "#B2B"]
      },
      "variantB": {
        "hookAngle": "Contrarian Narrative",
        "content": "Full post copy...",
        "hashtags": ["#Leadership", "#Brand"]
      }
    }
  ]
}`;

  const userPrompt = `Generate multi-platform campaign variants and audience receptivity analysis based on the instructions.`;

  try {
    const responseText = await generateText(userPrompt, systemInstruction);
    if (responseText) {
      const parsed = JSON.parse(responseText);
      return { ...parsed, scraped, appliedMemoryCount };
    }
  } catch (error) {
    console.warn('LLM API call failed or encountered error, falling back to heuristic engine:', error);
  }

  // Resilient High-Fidelity Heuristic Generation grounded in real scraped webpage title/description
  recordUsageEvent({
    operation: 'generate_content',
    provider: 'heuristic',
    model: 'local-brand-engine',
    overrideCostUsd: 0,
    meta: `${payload.brandProfile.name} (${payload.platforms.length} channels)`,
  });
  const groundedPayload: GenerateContentPayload = scraped?.ok
    ? {
        ...payload,
        sourceInput: `${scraped.title}${scraped.description ? ` — ${scraped.description}` : ''}`,
      }
    : payload;
  return { ...generateHeuristicContent(groundedPayload), scraped, appliedMemoryCount };
}

function extractWebsiteInsights(payload: GenerateContentPayload) {
  const raw = payload.sourceInput || '';
  const brandName = payload.brandProfile.name || 'Our Brand';

  // Extract domain/URL if present in sourceInput or brandProfile
  const urlMatch = raw.match(/https?:\/\/[^\s)"']+/i);
  const websiteUrl = payload.brandProfile.websiteUrl || urlMatch?.[0] || '';
  let domain = '';
  try {
    if (websiteUrl) domain = new URL(websiteUrl).hostname.replace(/^www\./i, '');
  } catch {
    domain = '';
  }

  // Parse structured multi-page Brand Dossier blocks ([PAGE: Label (/path)], Headings: ..., Key Copy: ...)
  const pages: Array<{ label: string; headings: string[]; copy: string }> = [];
  const pageRegex = /\[PAGE:\s*([^\]]+)\]\s*[\r\n]+Headings:\s*([^\r\n]*)[\r\n]+Key Copy:\s*([^\r\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = pageRegex.exec(raw)) !== null) {
    const label = m[1].replace(/\s*\([^)]*\)\s*$/, '').trim();
    const headings = m[2]
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length >= 6 && s.toLowerCase() !== brandName.toLowerCase());
    const copy = m[3].trim();
    pages.push({ label, headings, copy });
  }

  // Gather crisp headings & real sentences from the website
  const allHeadings = pages.flatMap((p) => p.headings);
  const allCopySentences = pages
    .map((p) => p.copy)
    .join(' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 24 && s.length <= 185 && !/^(home|sign in|create account|log in|menu|skip to)/i.test(s));

  // Fall back cleanly if raw input was a brief or simple scraped title/desc
  const cleanFirstLine = raw
    .replace(/^Full-Site Multi-Page Brand Dossier \([^)]+\):\s*/i, '')
    .replace(/https?:\/\/\S+/gi, '')
    .split('\n')[0]
    .replace(/\(\s*\)/g, '')
    .trim();

  const heroHook =
    allHeadings.find((h) => h.length >= 12 && h.length <= 90) ||
    (payload.brandProfile.tagline && payload.brandProfile.tagline.length >= 12 ? payload.brandProfile.tagline : '') ||
    (cleanFirstLine.length >= 12 ? cleanFirstLine.slice(0, 85) : `${brandName} — A Smarter Way Forward`);

  const corePromise =
    allCopySentences[0] ||
    payload.brandProfile.tagline ||
    `${brandName} gives you transparent, side-by-side clarity without the guesswork or sales pressure.`;

  const secondaryProof =
    allCopySentences.find((s) => s !== corePromise && s.length >= 28) ||
    allHeadings.find((h) => h !== heroHook && h.length >= 14) ||
    `See real, verifiable differences before you ever commit.`;

  const comparePage = pages.find((p) => /compar|pricing|plan|diff/i.test(p.label));
  const providerPage = pages.find((p) => /provider|carrier|partner|business|pro|enterprise/i.test(p.label));
  const aboutPage = pages.find((p) => /about|mission|why|how/i.test(p.label));

  const fullTextLower = `${brandName} ${raw} ${payload.brandProfile.tagline || ''} ${payload.campaignGoal || ''}`.toLowerCase();
  const isInsuranceOrCompare = /\b(insurance|polici|policy|carrier|coverage|quote|broker|lead|compare|fintech|loan|mortgage)\b/i.test(fullTextLower);
  const isMusic = /\b(music|track|song|album|tour|concert|spotify|vinyl|record label)\b/i.test(fullTextLower);
  const isArt = /\b(artwork|artist|painting|gallery|sculpture|print drop|visual art)\b/i.test(fullTextLower);
  const isEcommerce = /\b(shop|store|cart|checkout|apparel|merch|shipping|streetwear|capsule)\b/i.test(fullTextLower);

  const brandTag = `#${brandName.replace(/[^a-zA-Z0-9]/g, '') || 'Brand'}`;

  let oldWayPoints = [
    'Opaque pricing & vague marketing promises',
    'High-pressure sales calls before you even see the facts',
    'Hours wasted comparing scattered tabs & fine print',
  ];
  let newWayPoints = [
    heroHook.slice(0, 56),
    corePromise.slice(0, 62),
    `Verify everything on ${domain || brandName} on your terms`,
  ];

  if (isInsuranceOrCompare) {
    oldWayPoints = [
      'Your phone sold as a "lead" to 10+ aggressive brokers',
      'Confusing quotes hiding deductibles & coverage gaps',
      'Endless spam calls before you even see real numbers',
    ];
    newWayPoints = [
      'Compare documented offers 100% privately',
      'Review factual coverage & price differences side-by-side',
      'YOU choose which provider is allowed to contact you',
    ];
  }

  return {
    brandName,
    domain,
    websiteUrl,
    heroHook,
    corePromise,
    secondaryProof,
    pages,
    comparePage,
    providerPage,
    aboutPage,
    isInsuranceOrCompare,
    isMusic,
    isArt,
    isEcommerce,
    brandTag,
    oldWayPoints,
    newWayPoints,
  };
}

function generateHeuristicContent(payload: GenerateContentPayload) {
  const avatarName = payload.customerAvatar.name;
  const brandName = payload.brandProfile.name;
  const ins = extractWebsiteInsights(payload);
  const ctaLink = ins.domain ? ins.domain : brandName;

  const variants = payload.platforms.map((platform) => {
    let varAContent = '';
    let varBContent = '';
    let hashtags: string[] = [];

    if (ins.isMusic) {
      if (platform === 'instagram' || platform === 'tiktok') {
        varAContent = `New drop alert 🔊 ${ins.heroHook}\n\n${ins.corePromise}\n\nLink in bio to listen now and drop your favorite track below! ⚡`;
        varBContent = `Most artists release music and hope the algorithm finds the right ears.\n\nWe built ${brandName} for listeners who actually feel every record.\n\nTurn this up in your headphones today. 🖤`;
        hashtags = [ins.brandTag, '#NewMusic', '#NowStreaming', '#IndieMusic'];
      } else {
        varAContent = `${ins.heroHook}\n\n${ins.corePromise}\n\nStream the full release now → ${ctaLink}`;
        varBContent = `Artistic independence means owning your sound and speaking directly to your real fans.\n\n${ins.secondaryProof}\n\nListen now at ${ctaLink}.`;
        hashtags = [ins.brandTag, '#NewRelease', '#IndependentArtist'];
      }
    } else if (ins.isInsuranceOrCompare) {
      const compareLine = ins.comparePage?.headings?.[0]
        ? `Side-by-side ${ins.comparePage.label}: ${ins.comparePage.headings[0]}`
        : `Side-by-side factual coverage & price comparison with zero guesswork`;
      const providerLine = ins.providerPage
        ? `Even ${ins.providerPage.label} win — because every buyer who reaches out actually chose them.`
        : `You stay anonymous until you pick the exact provider you want to talk to.`;

      if (platform === 'linkedin') {
        varAContent = `${ins.heroHook}\n\nLook at how broken shopping for coverage has become: you enter your phone number to see one quote, and within 60 seconds your details are sold to a dozen call centers.\n\n${brandName} flips the entire model:\n→ ${ins.corePromise}\n→ ${compareLine}\n→ ${providerLine}\n\nNo lead brokers. No spam calls. Just documented facts so you make the smartest financial decision on your terms.\n\nCompare privately in under 2 minutes → ${ctaLink}`;
        varBContent = `Why do "free quote" websites ask for your phone number before showing you a single real policy?\n\nBecause on those sites, you aren't the customer — you're the lead being sold.\n\nAt ${brandName}, we built the opposite:\n✓ 100% private side-by-side policy comparison\n✓ Verified coverage & price differences in plain English\n✓ Zero unwanted calls — you decide who may contact you\n\n${ins.heroHook}\n\nSee the difference yourself at ${ctaLink}.`;
        hashtags = [ins.brandTag, '#ConsumerFirst', '#InsuranceTransparency', '#SmartComparison', '#NoSpam'];
      } else if (platform === 'x' || platform === 'threads') {
        varAContent = `${ins.heroHook}\n\nStop giving your phone number to "quote" sites that sell it to 15 brokers.\n\nOn ${brandName}:\n• Compare documented offers privately\n• See real coverage & price gaps side-by-side\n• YOU choose who gets to contact you\n\nTry it free → ${ctaLink}`;
        varBContent = `Unpopular truth about online insurance quotes:\n\nIf you have to surrender your phone number before seeing real numbers, you are the product.\n\n${brandName} lets you compare factual policies privately — zero spam calls, total control.\n\nCheck it out → ${ctaLink}`;
        hashtags = [ins.brandTag, '#NoSpamQuotes', '#ConsumerPrivacy'];
      } else if (platform === 'instagram') {
        varAContent = `${ins.heroHook} 🛡️\n\nTired of getting 20 spam calls just for asking what a policy costs?\n\nWith ${brandName}, you compare documented coverage and prices privately — and ONLY the provider you pick can contact you.\n\nTap the link in bio to compare privately at ${ctaLink} ✨`;
        varBContent = `Old way: Fill out 1 form → get spammed for 3 weeks. ❌\n\nThe ${brandName} way:\n✅ Compare real coverage & prices side-by-side\n✅ Keep your info private\n✅ Choose who contacts you\n\nSave this before your next renewal! Link in bio → ${ctaLink}`;
        hashtags = [ins.brandTag, '#SmartMoney', '#InsuranceTips', '#ConsumerRights'];
      } else {
        varAContent = `POV: You needed to compare insurance without your phone blowing up for 2 weeks straight. 🛡️\n\n"${ins.heroHook}" — ${brandName} lets you compare real documented offers privately and pick who calls you.\n\nCheck ${ctaLink} before you renew!`;
        varBContent = `Never type your phone number into a random quote site again. 🛑\n\nHere's how ${brandName} lets you compare factual coverage & prices privately with ZERO spam calls → ${ctaLink}`;
        hashtags = [ins.brandTag, '#MoneyTok', '#AdultingTips', '#NoSpam'];
      }
    } else {
      const pageBullets =
        ins.pages.length >= 2
          ? ins.pages
              .slice(0, 3)
              .map((p) => `→ ${p.label}: ${p.headings[0] || p.copy.slice(0, 75)}`)
              .join('\n')
          : `→ ${ins.corePromise}\n→ ${ins.secondaryProof}\n→ Built directly around what ${avatarName} actually needs`;

      if (platform === 'linkedin') {
        varAContent = `${ins.heroHook}\n\n${ins.corePromise}\n\nHere is what sets ${brandName} apart:\n${pageBullets}\n\nStop settling for bloated alternatives that waste your time and budget. See how ${brandName} works in real life → ${ctaLink}`;
        varBContent = `Most options in this space promise the world and bury the truth in fine print.\n\nWe built ${brandName} to fix that:\n${ins.corePromise}\n\n${ins.secondaryProof}\n\nReady to see the difference for yourself? Visit ${ctaLink}.`;
        hashtags = [ins.brandTag, '#Growth', '#ProductClarity', '#BetterWay'];
      } else if (platform === 'x' || platform === 'threads') {
        varAContent = `${ins.heroHook}\n\n${ins.corePromise}\n\nNo fluff. No hidden catch. Just real results.\n\nExplore ${brandName} → ${ctaLink}`;
        varBContent = `Why do so many people still put up with the slow, outdated way?\n\n${brandName} gives you ${ins.corePromise.charAt(0).toLowerCase() + ins.corePromise.slice(1)}\n\nSee it live → ${ctaLink}`;
        hashtags = [ins.brandTag, '#BuiltBetter', '#Launch'];
      } else if (platform === 'instagram') {
        varAContent = `${ins.heroHook} ⚡\n\n${ins.corePromise}\n\n${ins.secondaryProof}\n\nTap the link in bio to see ${brandName} in action → ${ctaLink}`;
        varBContent = `Stop guessing. Start comparing real outcomes. ✨\n\n${brandName} was built so you get clarity in minutes instead of weeks.\n\nLink in bio → ${ctaLink}`;
        hashtags = [ins.brandTag, '#ModernBrand', '#SmartChoice'];
      } else {
        varAContent = `Wait until you see how ${brandName} simplifies this. 👀\n\n${ins.heroHook} — ${ins.corePromise}\n\nLink in bio (${ctaLink})!`;
        varBContent = `Stop wasting hours doing this the old way. 🛑\n\n${brandName}: ${ins.heroHook}.\n\nCheck ${ctaLink} to try it yourself.`;
        hashtags = [ins.brandTag, '#MustKnow', '#GameChanger'];
      }
    }

    return {
      platform,
      variantA: {
        hookAngle: ins.isInsuranceOrCompare
          ? 'Direct Privacy & Comparison Offer'
          : ins.isMusic
          ? 'Direct Release Drop Hook'
          : 'Direct Value Proposition & Offer',
        content: varAContent,
        hashtags,
      },
      variantB: {
        hookAngle: ins.isInsuranceOrCompare
          ? 'Problem–Agitate–Solve (Stop Lead Spam)'
          : 'Contrarian Old-Way vs. New-Way Hook',
        content: varBContent,
        hashtags: hashtags.slice(0, 4),
      },
    };
  });

  return {
    receptivity: {
      score: 95,
      level: 'High',
      rationale: `Direct-response ad copy grounded directly in ${brandName}'s crawled website claims ("${ins.heroHook.slice(0, 60)}") and tailored to ${avatarName}.`,
      suggestedHookAngle: ins.heroHook,
    },
    adHeadline: ins.heroHook.slice(0, 72),
    oldWayPoints: ins.oldWayPoints,
    newWayPoints: ins.newWayPoints,
    visualPrompt: `Clean modern commercial ad visual for ${brandName} conveying "${ins.heroHook}" using ${payload.brandProfile.brandColors?.primary || '#047857'} brand accents, crisp focal composition, minimal text (<15% area), high contrast editorial lighting`,
    sourceSnippet: ins.heroHook,
    variants,
  };
}

export interface GenerateImagePayload {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16' | '3:4';
  creativeStyle?: AdCreativeStyle;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  oldWayPoints?: string[];
  newWayPoints?: string[];
  preferAiPhoto?: boolean;
  brandProfile: {
    name: string;
    archetype: string;
    tagline?: string;
    websiteUrl?: string;
    brandColors?: {
      primary: string;
      secondary: string;
      background: string;
      swatches: string[];
    };
    brandFonts?: string[];
  };
  customerAvatar?: {
    name: string;
    roleTitle: string;
  };
}

export async function handleGenerateImage(payload: GenerateImagePayload) {
  const aspectRatio = payload.aspectRatio || '1:1';
  const primaryColor = payload.brandProfile.brandColors?.primary || '#047857';
  const secondaryColor = payload.brandProfile.brandColors?.secondary || '#B45309';

  // Ad-algorithm-compliant art direction prompt (low text density, high visual storytelling)
  const fullPrompt = `${payload.prompt}. Brand: ${payload.brandProfile.name} (${payload.brandProfile.tagline || payload.brandProfile.archetype}). Brand color accents: ${primaryColor} and ${secondaryColor}. Target audience: ${payload.customerAvatar?.name || 'Decision Makers'} (${payload.customerAvatar?.roleTitle || 'Consumers'}). Editorial commercial advertising visual, ultra-clean composition with clear focal subject, NO tiny text walls, NO browser screenshots, generous negative space for Meta/LinkedIn ad performance, crisp studio lighting.`;

  // 1. Try Live Gemini Image Generation if GEMINI_API_KEY is configured and user wants AI photo (or no specific graphic card requested)
  const wantGraphicCard =
    payload.creativeStyle && !payload.preferAiPhoto && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY;

  const ai = !wantGraphicCard ? getGeminiClient() : null;
  if (ai && (!payload.creativeStyle || payload.preferAiPhoto)) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
          const saved = saveDataUrlMedia(dataUrl, `${payload.brandProfile.name}_ai_ad.png`);
          recordUsageEvent({
            operation: 'generate_image',
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite-image',
            overrideCostUsd: 0.03,
            meta: `${payload.brandProfile.name} (${aspectRatio} AI photo)`,
          });
          return {
            imageUrl: saved.url,
            source: 'gemini-ai-image',
            prompt: fullPrompt,
            aspectRatio,
            success: true,
          };
        }
      }
    } catch (error: any) {
      console.warn('Gemini image generation encountered error:', error);
    }
  }

  // 2. Try Live OpenAI Image Generation (gpt-image-1 / dall-e-3) if OPENAI_API_KEY is configured
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && (!payload.creativeStyle || payload.preferAiPhoto)) {
    try {
      const size =
        aspectRatio === '16:9' || aspectRatio === '4:3'
          ? '1536x1024'
          : aspectRatio === '9:16' || aspectRatio === '3:4'
          ? '1024x1536'
          : '1024x1024';
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: fullPrompt,
          size,
        }),
      });
      if (resp.ok) {
        const json: any = await resp.json();
        const b64 = json?.data?.[0]?.b64_json;
        if (b64) {
          const saved = saveDataUrlMedia(`data:image/png;base64,${b64}`, `${payload.brandProfile.name}_openai_ad.png`);
          recordUsageEvent({
            operation: 'generate_image',
            provider: 'openai',
            model: 'gpt-image-1',
            overrideCostUsd: 0.04,
            meta: `${payload.brandProfile.name} (${aspectRatio} AI photo)`,
          });
          return {
            imageUrl: saved.url,
            source: 'openai-gpt-image-1',
            prompt: fullPrompt,
            aspectRatio,
            success: true,
          };
        }
      }
    } catch (err) {
      console.warn('OpenAI image generation encountered error:', err);
    }
  }

  // 3. ZERO FAKE STOCK PHOTOS: Render a genuine, brand-styled, low-text-density commercial ad PNG
  // tailored directly to this brand's real colors, headline, tagline, and offer!
  const cleanHeadline =
    payload.headline ||
    payload.brandProfile.tagline ||
    payload.prompt.split('.')[0].slice(0, 68) ||
    payload.brandProfile.name;

  const isInsurance = /insurance|polici|policy|carrier|quote|lead|compare/i.test(
    `${payload.brandProfile.name} ${payload.brandProfile.tagline || ''} ${payload.prompt}`
  );

  const creative = await generateBrandAdCreative({
    brandName: payload.brandProfile.name,
    domain: payload.brandProfile.websiteUrl,
    tagline: payload.brandProfile.tagline,
    headline: cleanHeadline,
    subheadline: payload.subheadline || payload.brandProfile.tagline,
    ctaText: payload.ctaText || (isInsurance ? 'Compare Privately' : 'Learn More'),
    eyebrow: payload.brandProfile.archetype || payload.brandProfile.name,
    style: payload.creativeStyle || (aspectRatio === '9:16' ? 'social_story' : 'editorial_hook'),
    aspectRatio,
    palette: payload.brandProfile.brandColors,
    fonts: payload.brandProfile.brandFonts,
    oldWayPoints:
      payload.oldWayPoints ||
      (isInsurance
        ? [
            'Phone number sold to 10+ aggressive brokers',
            'Confusing fine print & hidden coverage gaps',
            'Spam calls before seeing a single real price',
          ]
        : undefined),
    newWayPoints:
      payload.newWayPoints ||
      (isInsurance
        ? [
            'Compare documented policies 100% privately',
            'Side-by-side factual coverage & price clarity',
            'You choose which provider may contact you',
          ]
        : undefined),
  });

  return {
    imageUrl: creative.imageUrl,
    source: 'adnetiks-brand-creative-studio',
    style: creative.style,
    format: creative.format,
    width: creative.width,
    height: creative.height,
    prompt: fullPrompt,
    aspectRatio,
    aiPhotoHint:
      !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY
        ? 'Connect a Gemini or OpenAI API key in AI & Connectors to also generate bespoke AI photography.'
        : undefined,
    success: true,
  };
}

export interface DiscoverAvatarsPayload {
  sourceInput: string;
  sourceType: 'url' | 'social_repurpose' | 'brief';
  campaignGoal?: string;
  brandProfile: {
    name: string;
    archetype: string;
    voiceAttributes?: string[];
  };
}

export async function handleDiscoverAvatars(payload: DiscoverAvatarsPayload) {
  const { enrichedInput } = await enrichSourceIfUrl(payload.sourceInput, payload.sourceType);
  const { promptBlock: memoryPromptBlock } = buildActiveMemoryPromptBlock();
  const systemInstruction = `You are ADNETIKS AI, an elite brand strategist, customer avatar intelligence architect, and go-to-market director.
Analyze the following ingested product, service, or campaign offer from ${payload.brandProfile.name}:
- Source Type: ${payload.sourceType}
- Source Details: "${enrichedInput.slice(0, 2400)}"
- Campaign Goal: ${payload.campaignGoal || 'Drive high-conversion organic demand and qualified buyers'}${memoryPromptBlock}

Task:
Synthesize 2 to 3 highest-converting Target Customer Avatars (greatest prospective buyers) tailored specifically to this exact product, service, or campaign offering.
For each avatar, provide realistic persona details with exact pain points that this specific product solves.

Return STRICTLY valid JSON conforming to this schema:
{
  "prospects": [
    {
      "id": "avatar-disc-1",
      "name": "Jordan Hayes",
      "roleTitle": "VP of Growth & Pipeline Marketing",
      "avatarImageUrl": "/src/assets/images/avatar_tech_founder_1793456642984.jpg",
      "demographics": {
        "ageRange": "32-46",
        "seniority": "VP / Executive",
        "companySize": "50-250 Employees (Series A-B)",
        "budgetAuthority": "$150K - $500K Annually"
      },
      "painPoints": [
        "Unpredictable pipeline from outbound cold channels",
        "Content team produces generic posts that fail to convert enterprise accounts",
        "Scaling organic distribution without tripling headcount"
      ],
      "emotionalTriggers": [
        "Desire for predictable board-level ROI",
        "Fear of missing quarterly ARR targets",
        "Pride in running an efficient, high-leverage team"
      ],
      "contentAffinities": ["B2B SaaS Growth", "Pipeline Velocity", "AI Automation"],
      "preferredPlatforms": ["linkedin", "x"],
      "peakEngagementHours": ["8:15 AM", "12:30 PM", "6:00 PM"],
      "receptivityKeywords": ["CAC", "Pipeline", "Organic Growth", "Conversion"],
      "matchScore": 96,
      "matchRationale": "This offering directly eliminates Jordan's #1 operational bottleneck by automating message-to-market resonance without manual agency overhead.",
      "suggestedHookAngle": "Focus on pipeline predictability and CAC reduction over feature vanity.",
      "isAiGenerated": true,
      "derivedFromOffer": "${payload.sourceInput.slice(0, 80).replace(/"/g, '')}"
    }
  ]
}`;

  const userPrompt = `Analyze the ingested offer and discover the greatest target customer prospect avatars.`;

  try {
    const responseText = await generateText(userPrompt, systemInstruction);
    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed.prospects && Array.isArray(parsed.prospects) && parsed.prospects.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('LLM Avatar Discovery failed or timed out, using heuristic generator:', error);
  }

  // Resilient Heuristic Prospect Discovery Engine
  recordUsageEvent({
    operation: 'discover_avatars',
    provider: 'heuristic',
    model: 'local-avatar-engine',
    overrideCostUsd: 0,
    meta: `${payload.brandProfile.name}`,
  });
  return generateHeuristicProspects(payload);
}

function generateHeuristicProspects(payload: DiscoverAvatarsPayload) {
  const inputLower = (payload.sourceInput + ' ' + (payload.campaignGoal || '')).toLowerCase();
  const brandName = payload.brandProfile.name;
  const snippet = payload.sourceInput.replace(/^https?:\/\//, '').slice(0, 70);

  const isMusic = inputLower.includes('music') || inputLower.includes('track') || inputLower.includes('song') || inputLower.includes('album') || inputLower.includes('tour') || inputLower.includes('concert') || inputLower.includes('spotify') || inputLower.includes('sound') || inputLower.includes('band');
  const isArt = inputLower.includes('art') || inputLower.includes('paint') || inputLower.includes('visual') || inputLower.includes('design') || inputLower.includes('drop') || inputLower.includes('merch') || inputLower.includes('gallery');
  const isIntelligence = inputLower.includes('seed') || inputLower.includes('intelligence') || inputLower.includes('research') || inputLower.includes('model') || inputLower.includes('autonomous');
  const isEcommerce = inputLower.includes('shop') || inputLower.includes('d2c') || inputLower.includes('product') || inputLower.includes('cart') || inputLower.includes('retail');
  const isAgency = inputLower.includes('agency') || inputLower.includes('client') || inputLower.includes('services') || inputLower.includes('consult');

  if (isMusic) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Devon Taylor',
          roleTitle: 'Music Enthusiast & Active Concertgoer',
          avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
          demographics: {
            ageRange: '21–36',
            seniority: 'Fan Community / Core Supporter',
            companySize: 'Independent Music Culture',
            budgetAuthority: '$1,500+ Annual Music & Merch Spend',
          },
          painPoints: [
            'Missing limited vinyl releases and tour presale drops',
            'Overwhelmed by algorithmic streaming playlists with generic recommendations',
            'Craving genuine artistic connection and behind-the-scenes access',
          ],
          emotionalTriggers: [
            'Excitement of being early on an artist before they blow up',
            'Belonging to a passionate fan community with shared music taste',
            'Adrenaline of live concerts and front-row experiences',
          ],
          contentAffinities: ['New Music Drops', 'Concert Vlogs', 'Studio Production', 'Vinyl Collecting'],
          preferredPlatforms: ['instagram', 'tiktok', 'x'],
          peakEngagementHours: ['11:00 AM', '4:30 PM', '9:15 PM'],
          receptivityKeywords: ['New Track', 'Tour Dates', 'Presale', 'Exclusive Drop'],
          matchScore: 98,
          matchRationale: `Devon is intensely receptive because this release speaks directly to their sonic appetite and provides immediate streaming/ticket access.`,
          suggestedHookAngle: 'Lead with sonic immersion, unreleased teasers, and direct presale links.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
        {
          id: `avatar-disc-${Date.now()}-2`,
          name: 'Zoe Vance',
          roleTitle: 'Playlist Curator & Music Discovery Creator',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '24–38',
            seniority: 'Curator / Tastemaker',
            companySize: '50K+ Monthly Playlist Followers',
            budgetAuthority: 'Influence & Sync Recommender',
          },
          painPoints: [
            'Drowning in generic PR pitches from artists that lack unique sound signatures',
            'Finding fresh, high-replay tracks to keep playlist retention high',
            'Crediting authentic independent artists before commercial radio catches on',
          ],
          emotionalTriggers: [
            'Pride in having impeccable musical taste and breaking new talent',
            'Building cultural influence across Spotify, Apple Music, and TikTok',
          ],
          contentAffinities: ['Independent Music', 'Music Production Breakdown', 'A&R Discovery'],
          preferredPlatforms: ['tiktok', 'x', 'instagram'],
          peakEngagementHours: ['8:30 AM', '1:00 PM', '8:00 PM'],
          receptivityKeywords: ['Underground', 'Production Quality', 'Vibe', 'High Replay'],
          matchScore: 95,
          matchRationale: `Zoe values distinct production aesthetics. Highlighting the sonic originality makes this an effortless playlist addition.`,
          suggestedHookAngle: 'Focus on production craft, vocal texture, and listener replay value.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isArt) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Sora Takahashi',
          roleTitle: 'Visual Art Collector & Creative Director',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '28–46',
            seniority: 'Director / Collector',
            companySize: 'Design Studio / Independent Gallery',
            budgetAuthority: '$5,000–$25,000 Annual Art Budget',
          },
          painPoints: [
            'Saturated digital feeds full of cookie-cutter AI art lacking soul',
            'Missing limited archival print drops and original gallery pieces',
            'Desire to understand the philosophy and creative process behind the work',
          ],
          emotionalTriggers: [
            'Visual resonance with evocative, high-craft aesthetics',
            'Exclusivity of owning a physical piece or limited numbered print',
          ],
          contentAffinities: ['Contemporary Art', 'Visual Identity', 'Studio BTS', 'Typography'],
          preferredPlatforms: ['instagram', 'threads', 'x'],
          peakEngagementHours: ['9:30 AM', '2:15 PM', '8:45 PM'],
          receptivityKeywords: ['Limited Edition', 'Archival Print', 'Original Work', 'Process'],
          matchScore: 97,
          matchRationale: `Sora evaluates work on aesthetic depth and creative authenticity. Presenting the creative process and limited availability converts them rapidly.`,
          suggestedHookAngle: 'Highlight the visual narrative, craftsmanship, and drop timing.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isIntelligence) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Dr. Aris Thorne',
          roleTitle: 'Autonomous Systems & Intelligence Lead',
          avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
          demographics: {
            ageRange: '32–48',
            seniority: 'Principal / Founder',
            companySize: 'Advanced Intelligence & Systems',
            budgetAuthority: '$150K+ Compute & Tooling Budget',
          },
          painPoints: [
            'Clunky tools locked to single proprietary LLM vendors',
            'Slow execution pipelines with high latency and lack of orchestration',
            'Difficulty coordinating multi-agent workflows into clear user actions',
          ],
          emotionalTriggers: [
            'Sovereignty through model-agnostic and open-source infrastructure',
            'Speed of execution without manual repetitive orchestration',
          ],
          contentAffinities: ['Model-Agnostic LLMs', 'Autonomous Delivery', 'Agent Swarms'],
          preferredPlatforms: ['x', 'linkedin'],
          peakEngagementHours: ['7:30 AM', '12:00 PM', '6:30 PM'],
          receptivityKeywords: ['Agnostic', 'Automation', 'Performance', 'Latency'],
          matchScore: 99,
          matchRationale: `Directly solves Aris's need for vendor independence, model flexibility, and multi-channel automated delivery.`,
          suggestedHookAngle: 'Lead with BE-agnostic architecture and autonomous multi-agent orchestration.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isEcommerce) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Chloe Rivera',
          roleTitle: 'Head of E-Commerce & DTC Performance',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '28-39',
            seniority: 'Head of Department',
            companySize: '25-100 Employees (DTC / Retail)',
            budgetAuthority: '$200K+ Ad Spend Authority',
          },
          painPoints: [
            'Rising Meta & TikTok CAC squeezing contribution margins',
            'Creative fatigue requiring 10+ new video variations every week',
            'Converting social views into attributed checkout transactions',
          ],
          emotionalTriggers: [
            'Urgency to achieve 3.5x+ blended ROAS',
            'Pressure from founders to maintain profitable scaling',
            'Excitement for viral creator content that moves inventory',
          ],
          contentAffinities: ['DTC Growth', 'TikTok Ads Scaling', 'ROAS Optimization', 'Creative Strategy'],
          preferredPlatforms: ['tiktok', 'instagram'],
          peakEngagementHours: ['9:00 AM', '1:30 PM', '8:15 PM'],
          receptivityKeywords: ['ROAS', 'Contribution Margin', 'UGC', 'TikTok Ads'],
          matchScore: 97,
          matchRationale: `Chloe has immediate buying intent because this campaign directly targets rising acquisition costs with short-form creative angles.`,
          suggestedHookAngle: 'Lead with creative hook velocity and 3.4x ROAS attribution proof.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isAgency) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Siddharth Patel',
          roleTitle: 'Managing Partner & Creative Director',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '34-48',
            seniority: 'Managing Partner',
            companySize: '15-80 Team Members',
            budgetAuthority: '$100K+ Software & Stack Budget',
          },
          painPoints: [
            'Client churn caused by slow turnaround on social campaigns',
            'Junior copywriters producing off-brand, generic content',
            'Inability to scale client roster without hiring expensive headcount',
          ],
          emotionalTriggers: [
            'Pride in delivering award-winning client creative velocity',
            'Fear of losing retainer clients to nimble AI-native agencies',
          ],
          contentAffinities: ['Agency Scaling', 'Brand Strategy', 'Client Retention'],
          preferredPlatforms: ['linkedin', 'x'],
          peakEngagementHours: ['8:30 AM', '12:15 PM', '6:30 PM'],
          receptivityKeywords: ['Agency Margins', 'Client Retainers', 'Turnaround Velocity'],
          matchScore: 96,
          matchRationale: `Siddharth urgently needs this to protect agency gross margins and fulfill multi-channel deliverables in minutes.`,
          suggestedHookAngle: 'Focus on 52% reduction in content production time and client retainer retention.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  // Dynamic Custom Extractor for any URL or text
  const cleanName = snippet.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 30) || 'Target Audience';

  return {
    prospects: [
      {
        id: `avatar-disc-${Date.now()}-1`,
        name: `Morgan Lee`,
        roleTitle: `Core Community & Audience for ${cleanName}`,
        avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
        demographics: {
          ageRange: '25–45',
          seniority: 'Target Decision Maker / Fan',
          companySize: cleanName,
          budgetAuthority: 'High Direct Conversion Potential',
        },
        painPoints: [
          `Finding authentic, high-quality content related to ${cleanName}`,
          'Tired of generic marketing noise and promotional spam',
          'Needs direct proof of value and clear calls to action',
        ],
        emotionalTriggers: [
          `Genuine resonance with the ${brandName} mission`,
          'Desire for streamlined, high-impact solutions and creative quality',
        ],
        contentAffinities: ['Authentic Messaging', 'Direct Value', 'Behind The Scenes'],
        preferredPlatforms: ['linkedin', 'x', 'instagram'],
        peakEngagementHours: ['8:30 AM', '12:30 PM', '6:00 PM'],
        receptivityKeywords: ['Value', 'Community', 'Authenticity', 'Velocity'],
        matchScore: 96,
        matchRationale: `Analyzed "${snippet}" and calibrated copy to directly answer Morgan's core priorities.`,
        suggestedHookAngle: `Directly address the primary outcome of ${cleanName} with compelling hooks.`,
        isAiGenerated: true,
        derivedFromOffer: snippet,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// AI VIDEO GENERATION ENGINE & MULTI-ASSET CAMPAIGN SYNTHESIS
// ---------------------------------------------------------------------------

export interface GenerateAiVideoPayload {
  sourceInput: string;
  sourceType: string;
  campaignGoal?: string;
  brandProfile: {
    name: string;
    archetype: string;
  };
  customerAvatar?: {
    name: string;
    roleTitle: string;
    painPoints?: string[];
  };
  voiceTone?: string;
  musicStyle?: string;
}

export async function handleGenerateAiVideo(payload: GenerateAiVideoPayload) {
  const brandName = payload.brandProfile.name || 'ADNETIKS';
  const avatarName = payload.customerAvatar?.name || 'Ideal Target Prospect';
  const { enrichedInput } = await enrichSourceIfUrl(payload.sourceInput, payload.sourceType);
  const { promptBlock: memoryPromptBlock } = buildActiveMemoryPromptBlock();
  const inputSnippet = (enrichedInput || '').trim();

  const systemInstruction = `You are ADNETIKS AI Video Director, an award-winning creative director specializing in short-form 9:16 video ads for Reels, TikTok, Shorts, and X.
Brand: ${brandName} (${payload.brandProfile.archetype})
Target Persona: ${avatarName} (${payload.customerAvatar?.roleTitle || 'Decision Maker'})
Voice Tone: ${payload.voiceTone || 'Energetic Founder'}
Music Style: ${payload.musicStyle || 'Phonk Synthwave Momentum'}

Source Offer Context:
"${inputSnippet.slice(0, 1500)}"${memoryPromptBlock}

Task:
Generate a high-converting 3-beat retention arc for a 15-second viral video ad.
Format your output strictly as JSON conforming to:
{
  "title": "Short punchy video title",
  "hookAngle": "Core hook angle",
  "beats": [
    {
      "timing": "0s - 3s",
      "title": "Beat 1: The Contrarian Hook",
      "spokenScript": "Spoken teleprompter voiceover line (under 15 words)",
      "visualDirection": "Action and camera framing direction",
      "kineticOverlay": "UPPERCASE PUNCHY TEXT OVERLAY",
      "brollPrompt": "AI image/video scene generator prompt for this beat"
    },
    {
      "timing": "3s - 12s",
      "title": "Beat 2: Proof & Avatar Teardown",
      "spokenScript": "Spoken line explaining proof and transformation (under 30 words)",
      "visualDirection": "Screen motion or b-roll cut description",
      "kineticOverlay": "TRANSFORMATION DATA METRIC OVERLAY",
      "brollPrompt": "AI image/video scene generator prompt for this beat"
    },
    {
      "timing": "12s - 15s",
      "title": "Beat 3: Urgency & Call to Action",
      "spokenScript": "Direct call to action (under 12 words)",
      "visualDirection": "Closing gesture, animated arrow, and CTA button cue",
      "kineticOverlay": "TAP LINK IN BIO ⚡",
      "brollPrompt": "AI image/video scene generator prompt for this beat"
    }
  ]
}`;

  try {
    const responseText = await generateText('Synthesize a viral 3-beat short video ad.', systemInstruction);
    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed.beats && Array.isArray(parsed.beats) && parsed.beats.length === 3) {
        return {
          ...parsed,
          aspectRatio: '9:16',
          voiceTone: payload.voiceTone || 'Energetic Founder',
          backgroundTrack: payload.musicStyle || 'Phonk Synthwave Momentum',
          isAiGenerated: true,
          audioWaveform: [40, 75, 30, 90, 60, 100, 45, 80, 65, 95, 35, 85, 70, 90, 50],
          videoMotionFrames: [
            { bgGradient: 'from-red-950 via-black to-slate-950', accentColor: '#E8192C' },
            { bgGradient: 'from-cyan-950 via-black to-slate-950', accentColor: '#06B6D4' },
            { bgGradient: 'from-purple-950 via-black to-slate-950', accentColor: '#A855F7' },
          ],
        };
      }
    }
  } catch (err) {
    console.warn('AI Video LLM generation failed or timed out, using heuristic generator:', err);
  }

  // Heuristic Video Generation Engine
  recordUsageEvent({
    operation: 'generate_ai_video',
    provider: 'heuristic',
    model: 'local-video-director',
    overrideCostUsd: 0,
    meta: `${payload.brandProfile.name} (9:16 storyboard)`,
  });
  const isMusic = /music|track|album|single|artist|spotify|sound/i.test(inputSnippet);
  const isCodeOrIntel = /github|seed|intelligence|code|ai|agent|srt|repo/i.test(inputSnippet);
  const isEcommerce = /store|product|shop|checkout|sale|cart/i.test(inputSnippet);

  if (isMusic) {
    return {
      title: 'Sound Velocity: Behind The Frequency Drop',
      hookAngle: 'Raw Unfiltered Studio Moment',
      aspectRatio: '9:16',
      voiceTone: payload.voiceTone || 'Minimalist Artist',
      backgroundTrack: payload.musicStyle || 'Dark Lo-Fi Ambient',
      isAiGenerated: true,
      audioWaveform: [35, 65, 80, 45, 95, 70, 100, 85, 60, 90, 40, 85, 95, 75, 50],
      videoMotionFrames: [
        { bgGradient: 'from-purple-950 via-black to-slate-950', accentColor: '#A855F7' },
        { bgGradient: 'from-rose-950 via-black to-slate-950', accentColor: '#F43F5E' },
        { bgGradient: 'from-amber-950 via-black to-slate-950', accentColor: '#F59E0B' },
      ],
      beats: [
        {
          timing: '0s - 3s',
          title: 'Beat 1: The Sonic Hook',
          spokenScript: 'Stop listening to predictable algorithmic audio. Listen to what happened at 3 AM in the studio.',
          visualDirection: 'Extreme close-up of tape reel spinning, sudden cut to bass drop with dark studio lighting.',
          kineticOverlay: 'TURN THE SOUND UP 🎧',
          brollPrompt: 'Close-up studio condenser microphone with moody purple neon rim light and soundboard faders',
        },
        {
          timing: '3s - 12s',
          title: 'Beat 2: The Raw Creation Arc',
          spokenScript: 'We stripped out all the polished filler and built pure sonic momentum designed to loop forever.',
          visualDirection: 'Fast rhythmic cut between audio waveform spectrum, hands on synthesizer, and vinyl lathe cutter.',
          kineticOverlay: 'PURE SONIC MOMENTUM ⚡',
          brollPrompt: 'Analogue synthesizer keyboard with illuminated keys and kinetic audio frequency visualizer',
        },
        {
          timing: '12s - 15s',
          title: 'Beat 3: Stream & Pre-Save Direct',
          spokenScript: 'Stream the official release now on Spotify and Apple Music at the link in bio.',
          visualDirection: 'Album art sleeve slides into camera frame with animated vibrating sound wave icon and link arrow.',
          kineticOverlay: 'STREAM NOW ON SPOTIFY 🟢',
          brollPrompt: 'Sleek dark minimalist vinyl record sleeve with glowing neon typography and play button icon',
        },
      ],
    };
  }

  if (isCodeOrIntel) {
    return {
      title: 'Autonomous Code & Intelligence Pipeline',
      hookAngle: 'The Provenance & Velocity Advantage',
      aspectRatio: '9:16',
      voiceTone: payload.voiceTone || 'High-Velocity Technical Founder',
      backgroundTrack: payload.musicStyle || 'Phonk Synthwave Momentum',
      isAiGenerated: true,
      audioWaveform: [50, 80, 40, 90, 65, 100, 55, 85, 70, 95, 45, 90, 75, 85, 60],
      videoMotionFrames: [
        { bgGradient: 'from-cyan-950 via-black to-slate-950', accentColor: '#06B6D4' },
        { bgGradient: 'from-emerald-950 via-black to-slate-950', accentColor: '#10B981' },
        { bgGradient: 'from-red-950 via-black to-slate-950', accentColor: '#E8192C' },
      ],
      beats: [
        {
          timing: '0s - 3s',
          title: 'Beat 1: The Fatal Architecture Flaw',
          spokenScript: 'Most teams plug generic AI into their stack and wonder why their codebase falls apart.',
          visualDirection: 'Rapid terminal screen zoom with code diff highlighting red syntax errors, followed by sharp cut to camera.',
          kineticOverlay: 'WHY GENERIC AI BREAKS CODEBASES 🛑',
          brollPrompt: 'Dark modern IDE code editor with matrix code scrolling and holographic error alerts in neon red',
        },
        {
          timing: '3s - 12s',
          title: 'Beat 2: Cryptographic Provenance & Velocity',
          spokenScript: 'SeedClass Intelligence orchestrates verified code context with cryptographic trust chains and 4x execution speed.',
          visualDirection: 'Screen recording transition cut showing repository architecture benchmark graphs climbing with green checkmarks.',
          kineticOverlay: 'VERIFIED CONTEXT + 4X VELOCITY ⚡',
          brollPrompt: 'High-tech 3D data pipeline visualization with interconnected nodes glowing in emerald green and obsidian',
        },
        {
          timing: '12s - 15s',
          title: 'Beat 3: Deploy & Star the Repo',
          spokenScript: 'Clone the repository and inspect the architecture at the link below.',
          visualDirection: 'Presenter points down to GitHub clone button with glowing green terminal prompt and link overlay.',
          kineticOverlay: 'CLONE ON GITHUB 🚀',
          brollPrompt: 'Sleek terminal prompt showing git clone command and glowing GitHub contribution matrix',
        },
      ],
    };
  }

  // Default Universal Creator / Business Video
  return {
    title: 'Stop Broadcasting Generic Marketing',
    hookAngle: 'The 3.4x Conversion Breakthrough',
    aspectRatio: '9:16',
    voiceTone: payload.voiceTone || 'Energetic Founder',
    backgroundTrack: payload.musicStyle || 'Phonk Synthwave Momentum',
    isAiGenerated: true,
    audioWaveform: [45, 70, 35, 95, 60, 100, 50, 85, 65, 90, 40, 85, 70, 95, 55],
    videoMotionFrames: [
      { bgGradient: 'from-red-950 via-black to-slate-950', accentColor: '#E8192C' },
      { bgGradient: 'from-amber-950 via-black to-slate-950', accentColor: '#F59E0B' },
      { bgGradient: 'from-emerald-950 via-black to-slate-950', accentColor: '#10B981' },
    ],
    beats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: The Contrarian Hook',
        spokenScript: 'Stop posting general company announcements on social media. Nobody cares.',
        visualDirection: 'Close-up camera framing, sudden stop in hallway, sharp hand gesture at lens.',
        kineticOverlay: 'WHY YOUR POSTS GET 0 REACH 🛑',
        brollPrompt: 'Cinematic close-up of creator looking frustrated at flatlined social engagement chart on smartphone',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Proof & Avatar Teardown',
        spokenScript: `When we aligned our schedule to our customer avatar's 2 AM fires, our CTR climbed 3.4x.`,
        visualDirection: 'Screen recording cut to ADNETIKS customer avatar dashboard showing 5.4% CTR lift.',
        kineticOverlay: 'PSYCHOLOGICAL AVATAR TARGETING = 3.4x CTR 📈',
        brollPrompt: 'High-contrast studio shot of executive analyzing dynamic conversion heatmaps on modern curved monitor',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Urgency & Call to Action',
        spokenScript: 'Grab our avatar mapping framework at the link in bio before your competitors do.',
        visualDirection: 'Points downward at phone screen with animated red arrow overlay and CTA button.',
        kineticOverlay: 'TAP LINK IN BIO TO AUTOMATE ⚡',
        brollPrompt: 'Crisp smartphone screen displaying instant automated scheduling queue with one-click approve button',
      },
    ],
  };
}


