/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS LLM Provider Abstraction Layer
 * Supports Gemini, OpenAI, Anthropic Claude, and any OpenAI-compatible endpoint.
 */

import { GoogleGenAI } from '@google/genai';
import { recordUsageEvent, estimateTokens } from './usageLedger.ts';

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'openai_compatible';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string; // for OpenAI-compatible endpoints (Ollama, Groq, Together AI, etc.)
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  openai_compatible: 'gpt-4o-mini',
};

let runtimeConfigOverride: Partial<LLMConfig> = {};

export function setRuntimeLLMConfig(override: Partial<LLMConfig>) {
  runtimeConfigOverride = { ...runtimeConfigOverride, ...override };
}

/**
 * Reads LLM configuration from environment variables merged with any runtime overrides.
 */
export function getLLMConfig(): LLMConfig {
  const provider = (runtimeConfigOverride.provider || process.env.ADNETIKS_LLM_PROVIDER || 'gemini') as LLMProvider;
  const model = runtimeConfigOverride.model || process.env.ADNETIKS_LLM_MODEL || DEFAULT_MODELS[provider] || DEFAULT_MODELS.gemini;

  const apiKeyMap: Record<LLMProvider, string | undefined> = {
    gemini: runtimeConfigOverride.apiKey || process.env.GEMINI_API_KEY,
    openai: runtimeConfigOverride.apiKey || process.env.OPENAI_API_KEY,
    anthropic: runtimeConfigOverride.apiKey || process.env.ANTHROPIC_API_KEY,
    openai_compatible: runtimeConfigOverride.apiKey || process.env.OPENAI_API_KEY || process.env.ADNETIKS_API_KEY,
  };

  return {
    provider,
    model,
    apiKey: apiKeyMap[provider],
    baseUrl: runtimeConfigOverride.baseUrl || process.env.ADNETIKS_API_BASE_URL,
  };
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

async function generateWithGemini(prompt: string, systemPrompt: string, config: LLMConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
    },
  });

  return response.text ?? '';
}

async function generateWithOpenAI(prompt: string, systemPrompt: string, config: LLMConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const baseUrl = config.baseUrl || 'https://api.openai.com';
  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? '';
}

async function generateWithAnthropic(prompt: string, systemPrompt: string, config: LLMConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content?.[0]?.text ?? '';
}

async function generateWithOpenAICompatible(prompt: string, systemPrompt: string, config: LLMConfig): Promise<string> {
  if (!config.baseUrl) {
    throw new Error('ADNETIKS_API_BASE_URL is not set for openai_compatible provider');
  }

  // Re-use OpenAI implementation — same protocol, custom base URL
  return generateWithOpenAI(prompt, systemPrompt, config);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Core text generation — single interface regardless of provider.
 * Merges the resolved environment config with any per-call overrides.
 */
export async function generateText(
  prompt: string,
  systemPrompt: string,
  configOverride?: Partial<LLMConfig>,
): Promise<string> {
  const resolved: LLMConfig = { ...getLLMConfig(), ...configOverride };

  let output = '';
  switch (resolved.provider) {
    case 'gemini':
      output = await generateWithGemini(prompt, systemPrompt, resolved);
      break;
    case 'openai':
      output = await generateWithOpenAI(prompt, systemPrompt, resolved);
      break;
    case 'anthropic':
      output = await generateWithAnthropic(prompt, systemPrompt, resolved);
      break;
    case 'openai_compatible':
      output = await generateWithOpenAICompatible(prompt, systemPrompt, resolved);
      break;
    default: {
      // TypeScript exhaustiveness guard
      const _exhaustive: never = resolved.provider;
      throw new Error(`Unknown LLM provider: ${String(_exhaustive)}`);
    }
  }

  recordUsageEvent({
    operation: 'llm_text',
    provider: resolved.provider,
    model: resolved.model,
    inputTokens: estimateTokens(`${systemPrompt}\n${prompt}`),
    outputTokens: estimateTokens(output),
    meta: 'Live LLM synthesis',
  });

  return output;
}
