/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Real URL Ingestion & Multimodal Screenshot Vision Analyzer
 * Fetches live webpage metadata, copy, headings & OpenGraph visuals (with SSRF guards),
 * and analyzes uploaded screenshots/flyers/artwork via active multimodal LLM providers.
 */

import { GoogleGenAI } from '@google/genai';
import { getLLMConfig } from './llmProvider.ts';

export interface ScrapedUrlContext {
  ok: boolean;
  url: string;
  domain: string;
  siteType: 'music' | 'video' | 'code' | 'ecommerce' | 'social' | 'web';
  title: string;
  description: string;
  ogImage?: string;
  headings: string[];
  bodyExcerpt: string;
  summaryText: string;
  error?: string;
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

function isSafePublicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (PRIVATE_HOST_PATTERNS.some((re) => re.test(u.hostname))) return null;
    return u;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html: string, attrName: string, attrValue: string): string {
  const re1 = new RegExp(
    `<meta[^>]*${attrName}=["']${attrValue}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${attrValue}["'][^>]*>`,
    'i'
  );
  const match = html.match(re1) || html.match(re2);
  return match ? decodeHtmlEntities(match[1]) : '';
}

function detectSiteType(hostname: string): ScrapedUrlContext['siteType'] {
  if (/spotify|soundcloud|bandcamp|apple\.com\/.*music|tidal/i.test(hostname)) return 'music';
  if (/youtube|youtu\.be|vimeo|tiktok|twitch/i.test(hostname)) return 'video';
  if (/github|gitlab|huggingface|npmjs|vercel/i.test(hostname)) return 'code';
  if (/shopify|etsy|amazon|gumroad|bigcartel|shop/i.test(hostname)) return 'ecommerce';
  if (/instagram|x\.com|twitter|linkedin|threads/i.test(hostname)) return 'social';
  return 'web';
}

export function extractFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[),.;]+$/, '') : null;
}

/**
 * Fetches a live public webpage and extracts real title, description, og:image,
 * key headings, and visible body text for grounded AI campaign synthesis.
 */
export async function scrapeUrlContext(rawUrl: string): Promise<ScrapedUrlContext> {
  const parsed = isSafePublicUrl(rawUrl);
  if (!parsed) {
    return {
      ok: false,
      url: rawUrl,
      domain: '',
      siteType: 'web',
      title: '',
      description: '',
      headings: [],
      bodyExcerpt: '',
      summaryText: rawUrl,
      error: 'URL must be a valid public http(s) address.',
    };
  }

  const domain = parsed.hostname.replace(/^www\./, '');
  const siteType = detectSiteType(domain);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ADNETIKS-IngestBot/1.0; +https://github.com/SeedClassIntelligence/ADNETIKS)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = (await res.text()).slice(0, 350_000);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const ogTitle = extractMeta(html, 'property', 'og:title') || extractMeta(html, 'name', 'twitter:title');
    const title = ogTitle || (titleMatch ? decodeHtmlEntities(titleMatch[1]) : domain);

    const description =
      extractMeta(html, 'property', 'og:description') ||
      extractMeta(html, 'name', 'description') ||
      extractMeta(html, 'name', 'twitter:description');

    let ogImage = extractMeta(html, 'property', 'og:image') || extractMeta(html, 'name', 'twitter:image');
    if (ogImage && ogImage.startsWith('/')) {
      ogImage = `${parsed.origin}${ogImage}`;
    }

    const headings: string[] = [];
    const hRegex = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi;
    let hm: RegExpExecArray | null;
    while ((hm = hRegex.exec(html)) !== null && headings.length < 6) {
      const cleaned = decodeHtmlEntities(hm[1].replace(/<[^>]+>/g, ' '));
      if (cleaned.length >= 4 && cleaned.length <= 160 && !headings.includes(cleaned)) {
        headings.push(cleaned);
      }
    }

    const strippedBody = decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    ).slice(0, 1200);

    const parts = [
      `Live Webpage Scraped: ${parsed.toString()} (${siteType.toUpperCase()} · ${domain})`,
      title ? `Page Title: ${title}` : '',
      description ? `Meta Description: ${description}` : '',
      headings.length > 0 ? `Key Headings: ${headings.join(' | ')}` : '',
      strippedBody ? `Page Copy Excerpt: ${strippedBody.slice(0, 800)}` : '',
    ].filter(Boolean);

    return {
      ok: true,
      url: parsed.toString(),
      domain,
      siteType,
      title,
      description,
      ogImage: ogImage || undefined,
      headings,
      bodyExcerpt: strippedBody,
      summaryText: parts.join('\n'),
    };
  } catch (err: any) {
    return {
      ok: false,
      url: parsed.toString(),
      domain,
      siteType,
      title: domain,
      description: '',
      headings: [],
      bodyExcerpt: '',
      summaryText: `URL: ${parsed.toString()} (${domain})`,
      error: err?.message || 'Could not fetch URL live',
    };
  }
}

export interface VisionAnalysisResult {
  ok: boolean;
  provider: string;
  headline: string;
  extractedText: string;
  visualVibe: string;
  suggestedHook: string;
  contextSummary: string;
}

/**
 * Analyzes an uploaded screenshot, concert flyer, product photo, or artwork using
 * the active multimodal LLM provider (Gemini, OpenAI, or Anthropic).
 */
export async function analyzeImageVisual(
  dataUrl: string,
  fileName?: string,
  brandName?: string
): Promise<VisionAnalysisResult> {
  const config = getLLMConfig();
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return {
      ok: false,
      provider: 'heuristic',
      headline: fileName || 'Uploaded Visual Asset',
      extractedText: '',
      visualVibe: 'High-impact campaign visual',
      suggestedHook: 'Turn heads with this new visual drop.',
      contextSummary: `Uploaded visual asset "${fileName || 'creative.png'}" ready for multi-platform campaign distribution.`,
    };
  }

  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = `You are ADNETIKS Visual Creative Director for brand "${brandName || 'ADNETIKS'}".
Inspect this uploaded screenshot, flyer, product photo, or artwork closely.
Extract any visible text, dates, prices, product details, visual aesthetic/colors, and craft a sharp campaign hook.
Return STRICTLY valid JSON:
{
  "headline": "Short 5-10 word visual headline summarizing what is shown",
  "extractedText": "Key readable text, dates, titles, or labels seen inside the image (or empty string if none)",
  "visualVibe": "Color palette, mood, and aesthetic description (1 sentence)",
  "suggestedHook": "Punchy scroll-stopping social media hook tailored to this image",
  "contextSummary": "2-sentence campaign brief describing what this visual promotes so copywriters can write ads from it"
}`;

  try {
    let rawText: string | null = null;

    if (config.provider === 'gemini' && config.apiKey) {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const resp = await ai.models.generateContent({
        model: config.model || 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
        config: { responseMimeType: 'application/json' },
      });
      rawText = resp.text || null;
    } else if ((config.provider === 'openai' || config.provider === 'openai_compatible') && config.apiKey) {
      const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });
      if (resp.ok) {
        const json = (await resp.json()) as any;
        rawText = json.choices?.[0]?.message?.content || null;
      }
    } else if (config.provider === 'anthropic' && config.apiKey) {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-latest',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mimeType, data: base64Data },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      });
      if (resp.ok) {
        const json = (await resp.json()) as any;
        rawText = json.content?.[0]?.text || null;
      }
    }

    if (rawText) {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        ok: true,
        provider: config.provider,
        headline: parsed.headline || fileName || 'Analyzed Visual',
        extractedText: parsed.extractedText || '',
        visualVibe: parsed.visualVibe || 'Bold editorial visual',
        suggestedHook: parsed.suggestedHook || '',
        contextSummary: parsed.contextSummary || parsed.headline || '',
      };
    }
  } catch (err) {
    console.warn('[vision] Multimodal analysis fell back:', err);
  }

  // Graceful heuristic fallback when no vision API key is set
  const cleanTitle = (fileName || 'Campaign Visual')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  return {
    ok: true,
    provider: 'local_metadata',
    headline: cleanTitle || 'Uploaded Campaign Artwork',
    extractedText: '',
    visualVibe: 'Custom uploaded creative asset stored permanently in your media vault',
    suggestedHook: `First look at ${cleanTitle || 'our newest drop'} — built for the people who pay attention.`,
    contextSummary: `Visual asset "${cleanTitle || fileName}" uploaded and persisted for ${brandName || 'your brand'} campaign.`,
  };
}
