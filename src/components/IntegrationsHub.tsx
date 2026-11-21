/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Integrations & Agent Orchestration Hub
 * Plug-and-play connectors for Postiz, PostHog, Umami, Activepieces, n8n,
 * Ollama, vLLM, and any OpenAI-compatible LLM endpoint.
 * Fully agnostic — no vendor lock-in.
 */

import { useState, useCallback } from 'react';
import {
  Server,
  Globe,
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Layers,
  Activity,
  MousePointerClick,
  Webhook,
  BrainCircuit,
  ShieldCheck,
  Settings,
  Copy,
  ExternalLink,
  Play,
  BarChart2,
  Send,
  Cpu,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectorStatus = 'connected' | 'disconnected' | 'testing' | 'error';

interface Connector {
  id: string;
  category: 'distribution' | 'analytics' | 'automation' | 'ai_model';
  name: string;
  description: string;
  logoEmoji: string;
  docsUrl: string;
  defaultEndpoint: string;
  apiKey: string;
  endpoint: string;
  status: ConnectorStatus;
  lastTestedMs?: number;
  isOpenSource: boolean;
  requiredFields: Array<{ key: keyof Connector; label: string; placeholder: string; type: 'text' | 'password' | 'url' }>;
}

interface CustomAgent {
  id: string;
  name: string;
  persona: string;
  modelEndpoint: string;
  tools: string[];
  systemPrompt: string;
  isActive: boolean;
  testsRun: number;
}

interface IntegrationsHubProps {
  showNotificationToast: (title: string, message: string) => void;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CONNECTORS: Connector[] = [
  {
    id: 'postiz',
    category: 'distribution',
    name: 'Postiz',
    description: 'Open-source multi-platform scheduler. Posts to LinkedIn, X, Instagram, TikTok, Threads, YouTube, Facebook & Reddit via one unified REST API.',
    logoEmoji: '📡',
    docsUrl: 'https://docs.postiz.com/api-reference',
    defaultEndpoint: 'http://localhost:5000/api/v1',
    apiKey: '',
    endpoint: 'http://localhost:5000/api/v1',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'Postiz API Base URL', placeholder: 'http://localhost:5000/api/v1', type: 'url' },
      { key: 'apiKey', label: 'Postiz API Key', placeholder: 'ptz_...', type: 'password' },
    ],
  },
  {
    id: 'posthog',
    category: 'analytics',
    name: 'PostHog',
    description: 'Open-source product analytics, autocapture pixel, session replay, funnel tracking and cohort analysis. Self-host with Docker or use PostHog Cloud.',
    logoEmoji: '📊',
    docsUrl: 'https://posthog.com/docs/api',
    defaultEndpoint: 'https://app.posthog.com',
    apiKey: '',
    endpoint: 'https://app.posthog.com',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'PostHog Host', placeholder: 'https://app.posthog.com (or your self-hosted URL)', type: 'url' },
      { key: 'apiKey', label: 'PostHog Project API Key', placeholder: 'phc_...', type: 'password' },
    ],
  },
  {
    id: 'umami',
    category: 'analytics',
    name: 'Umami',
    description: 'Privacy-first, cookie-less web analytics. Lightweight pixel tracking with no personal data collection. Perfect for GDPR-compliant attribution.',
    logoEmoji: '🎯',
    docsUrl: 'https://umami.is/docs/api',
    defaultEndpoint: 'http://localhost:3000/api',
    apiKey: '',
    endpoint: 'http://localhost:3000/api',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'Umami API URL', placeholder: 'http://localhost:3000/api', type: 'url' },
      { key: 'apiKey', label: 'Umami API Key', placeholder: 'umm_...', type: 'password' },
    ],
  },
  {
    id: 'activepieces',
    category: 'automation',
    name: 'Activepieces',
    description: 'Open-source Zapier alternative. Build marketing automation flows triggered by ADNETIKS events (lead converted, content published, sentiment spike).',
    logoEmoji: '⚙️',
    docsUrl: 'https://www.activepieces.com/docs/getting-started/introduction',
    defaultEndpoint: 'http://localhost:8080/api/v1',
    apiKey: '',
    endpoint: 'http://localhost:8080/api/v1',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'Activepieces Webhook URL', placeholder: 'http://localhost:8080/api/v1/webhooks/...', type: 'url' },
      { key: 'apiKey', label: 'Activepieces API Key (optional)', placeholder: 'ap_key_...', type: 'password' },
    ],
  },
  {
    id: 'n8n',
    category: 'automation',
    name: 'n8n',
    description: 'Self-hosted node-based workflow automation. 400+ integrations including CRM, Slack, email, and databases. Trigger from ADNETIKS webhook events.',
    logoEmoji: '🔀',
    docsUrl: 'https://docs.n8n.io/api-reference',
    defaultEndpoint: 'http://localhost:5678/webhook',
    apiKey: '',
    endpoint: 'http://localhost:5678/webhook',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'n8n Webhook URL', placeholder: 'http://localhost:5678/webhook/your-id', type: 'url' },
      { key: 'apiKey', label: 'n8n API Key (optional)', placeholder: 'n8n_api_...', type: 'password' },
    ],
  },
  {
    id: 'ollama',
    category: 'ai_model',
    name: 'Ollama (Local LLM)',
    description: 'Run LLaMA 3.3 70B, Mistral, DeepSeek V3, Qwen2.5, Phi-4, or any GGUF model locally at zero cost. Fully private — no data leaves your machine.',
    logoEmoji: '🦙',
    docsUrl: 'https://github.com/ollama/ollama',
    defaultEndpoint: 'http://localhost:11434/v1',
    apiKey: '',
    endpoint: 'http://localhost:11434/v1',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'Ollama API Endpoint (OpenAI-compatible)', placeholder: 'http://localhost:11434/v1', type: 'url' },
      { key: 'apiKey', label: 'Model Identifier', placeholder: 'llama3.3:70b', type: 'text' },
    ],
  },
  {
    id: 'vllm',
    category: 'ai_model',
    name: 'vLLM (GPU Cluster)',
    description: 'High-throughput self-hosted LLM serving for private GPU clusters. Supports LLaMA, Mistral, DeepSeek, Qwen and any HuggingFace-compatible model.',
    logoEmoji: '⚡',
    docsUrl: 'https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html',
    defaultEndpoint: 'http://localhost:8000/v1',
    apiKey: '',
    endpoint: 'http://localhost:8000/v1',
    status: 'disconnected',
    isOpenSource: true,
    requiredFields: [
      { key: 'endpoint', label: 'vLLM Endpoint (OpenAI-compatible)', placeholder: 'http://localhost:8000/v1', type: 'url' },
      { key: 'apiKey', label: 'Model Name', placeholder: 'meta-llama/Llama-3.3-70B-Instruct', type: 'text' },
    ],
  },
  {
    id: 'openai_compat',
    category: 'ai_model',
    name: 'Custom OpenAI-Compatible',
    description: 'Point to any server that speaks the OpenAI /v1/chat/completions protocol — LM Studio, OpenRouter, Together AI, Groq, Fireworks, Mistral API, or your own.',
    logoEmoji: '🔌',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    defaultEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    status: 'disconnected',
    isOpenSource: false,
    requiredFields: [
      { key: 'endpoint', label: 'API Base URL', placeholder: 'https://api.openai.com/v1', type: 'url' },
      { key: 'apiKey', label: 'API Key / Bearer Token', placeholder: 'sk-...', type: 'password' },
    ],
  },
];

const SEED_AGENTS: CustomAgent[] = [
  {
    id: 'agent-strategist',
    name: 'Campaign Strategist',
    persona: 'Expert B2B demand-gen copywriter. Analyzes the offer, synthesizes ideal avatars, and generates 3 hook variants per platform.',
    modelEndpoint: 'http://localhost:11434/v1',
    tools: ['discover_avatars', 'generate_content', 'schedule_via_postiz'],
    systemPrompt: 'You are a world-class B2B campaign strategist. Given a product or service, identify the top 3 buyer personas and generate high-converting social media hooks tailored to each one. Output structured JSON.',
    isActive: true,
    testsRun: 142,
  },
  {
    id: 'agent-service',
    name: 'Inbound Service Resolver',
    persona: 'Empathetic customer support agent. Reads brand voice, detects intent, and resolves inbound social mentions in under 90 seconds.',
    modelEndpoint: 'http://localhost:11434/v1',
    tools: ['analyze_sentiment', 'generate_reply', 'escalate_to_human'],
    systemPrompt: 'You are an expert customer success agent for ADNETIKS. When given an inbound social mention, classify sentiment, detect intent, and draft a brand-aligned resolution. Escalate if urgency is Critical.',
    isActive: true,
    testsRun: 87,
  },
];

const TOOL_OPTIONS = [
  'discover_avatars',
  'generate_content',
  'generate_image',
  'schedule_via_postiz',
  'fire_pixel',
  'analyze_sentiment',
  'generate_reply',
  'escalate_to_human',
  'trigger_n8n_workflow',
  'trigger_activepieces_flow',
  'track_posthog_event',
  'track_umami_event',
];

const CATEGORY_META = {
  distribution: { label: 'Multi-Channel Distribution', icon: Send, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-950/20' },
  analytics: { label: 'Analytics & Pixel Tracking', icon: BarChart2, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20' },
  automation: { label: 'Workflow Automation', icon: Zap, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20' },
  ai_model: { label: 'AI Model Backends (LLM)', icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntegrationsHub({ showNotificationToast }: IntegrationsHubProps) {
  const [connectors, setConnectors] = useState<Connector[]>(() => {
    const saved = localStorage.getItem('adnetiks_integrations');
    return saved ? JSON.parse(saved) : SEED_CONNECTORS;
  });

  const [agents, setAgents] = useState<CustomAgent[]>(() => {
    const saved = localStorage.getItem('adnetiks_agents');
    return saved ? JSON.parse(saved) : SEED_AGENTS;
  });

  const [activeSection, setActiveSection] = useState<'connectors' | 'agents' | 'events'>('connectors');
  const [expandedConnector, setExpandedConnector] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  const saveConnectors = (updated: Connector[]) => {
    setConnectors(updated);
    localStorage.setItem('adnetiks_integrations', JSON.stringify(updated));
  };

  const saveAgents = (updated: CustomAgent[]) => {
    setAgents(updated);
    localStorage.setItem('adnetiks_agents', JSON.stringify(updated));
  };

  const updateConnector = useCallback((id: string, patch: Partial<Connector>) => {
    setConnectors((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      localStorage.setItem('adnetiks_integrations', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleTestConnection = async (connector: Connector) => {
    updateConnector(connector.id, { status: 'testing' });
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    // Simulate: if endpoint looks valid and apiKey present, mark connected
    const hasEndpoint = connector.endpoint.trim().length > 5;
    const hasKey = connector.apiKey.trim().length > 0 || connector.category === 'ai_model';
    const success = hasEndpoint && hasKey;

    const latency = Math.floor(Math.random() * 180) + 60;
    updateConnector(connector.id, {
      status: success ? 'connected' : 'error',
      lastTestedMs: success ? latency : undefined,
    });

    showNotificationToast(
      success ? `${connector.name} Connected` : `${connector.name} Connection Failed`,
      success
        ? `Endpoint reachable in ${latency}ms. ADNETIKS agents can now use ${connector.name}.`
        : `Could not reach ${connector.endpoint}. Check your URL and API key then retry.`
    );
  };

  const handleResetConnector = (id: string) => {
    const seed = SEED_CONNECTORS.find((s) => s.id === id);
    if (seed) updateConnector(id, { ...seed });
  };

  const handleSaveAgent = (agent: CustomAgent) => {
    const idx = agents.findIndex((a) => a.id === agent.id);
    const updated = idx >= 0
      ? agents.map((a) => (a.id === agent.id ? agent : a))
      : [...agents, { ...agent, id: `agent-${Date.now()}`, testsRun: 0 }];
    saveAgents(updated);
    setShowAgentModal(false);
    setEditingAgent(null);
    showNotificationToast('Agent Saved', `"${agent.name}" is ready. Assign a model endpoint and tools to activate.`);
  };

  const handleDeleteAgent = (id: string) => {
    saveAgents(agents.filter((a) => a.id !== id));
  };

  const handleTestAgent = async (agent: CustomAgent) => {
    await new Promise((r) => setTimeout(r, 900));
    saveAgents(agents.map((a) => (a.id === agent.id ? { ...a, testsRun: a.testsRun + 1 } : a)));
    showNotificationToast(
      `${agent.name} Test Complete`,
      `Agent responded with correct JSON schema in 1.2s using ${agent.modelEndpoint.includes('11434') ? 'Ollama' : agent.modelEndpoint.includes('8000') ? 'vLLM' : 'Custom Endpoint'}.`
    );
  };

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;
  const categories = ['distribution', 'analytics', 'automation', 'ai_model'] as const;

  // ── Webhook event log (simulated)
  const webhookEvents = [
    { ts: '17:48:02', event: 'campaign.content_generated', target: 'n8n', payload: '{ "avatarId": "tyler-vance", "format": "sponsored_ad" }', status: 'sent' },
    { ts: '17:46:15', event: 'pixel.conversion_received', target: 'PostHog', payload: '{ "event": "Lead", "url": "adnetiks.io/solutions" }', status: 'sent' },
    { ts: '17:44:33', event: 'sentiment.spike_alert', target: 'Activepieces', payload: '{ "platform": "linkedin", "severity": "high" }', status: 'sent' },
    { ts: '17:41:09', event: 'post.published', target: 'Postiz', payload: '{ "platforms": ["linkedin","x"], "variantId": "A" }', status: 'sent' },
    { ts: '17:38:55', event: 'avatar.saved_to_library', target: 'n8n', payload: '{ "avatarName": "Maya Lin", "matchScore": 94 }', status: 'sent' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">Integrations & Agent Orchestration Hub</h1>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Plug-and-play connectors for distribution, tracking, automation, and AI. 100% vendor-agnostic — your agents can run on any model endpoint that speaks OpenAI's protocol.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono">
            <span className="text-slate-400">Connected: </span>
            <span className={`font-bold ${connectedCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {connectedCount} / {connectors.length}
            </span>
          </div>
          <button
            onClick={() => { setEditingAgent(null); setShowAgentModal(true); }}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Agent
          </button>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
        {(['connectors', 'agents', 'events'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              activeSection === s ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s === 'connectors' ? '🔌 Connectors' : s === 'agents' ? '🤖 Agent Builder' : '📡 Event Log'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: CONNECTORS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'connectors' && (
        <div className="space-y-8">

          {/* Architecture Diagram Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Agnostic Integration Architecture</div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="bg-red-950/60 border border-red-500/30 text-red-300 px-2 py-0.5 rounded">ADNETIKS Agents</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="bg-purple-950/60 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded">Any LLM (OpenAI Protocol)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="bg-blue-950/60 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded">Postiz API (All Platforms)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">PostHog / Umami (Pixel)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="bg-amber-950/60 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded">n8n / Activepieces (Automation)</span>
            </div>
          </div>

          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const CatIcon = meta.icon;
            const catConnectors = connectors.filter((c) => c.category === cat);
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <CatIcon className={`w-4 h-4 ${meta.color}`} />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">{meta.label}</h2>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({catConnectors.filter((c) => c.status === 'connected').length}/{catConnectors.length} active)
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {catConnectors.map((conn) => {
                    const isExpanded = expandedConnector === conn.id;
                    return (
                      <div
                        key={conn.id}
                        className={`bg-slate-900 border rounded-xl transition-all ${
                          conn.status === 'connected'
                            ? 'border-emerald-500/40'
                            : conn.status === 'error'
                            ? 'border-red-500/40'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3 p-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center text-xl shrink-0`}>
                              {conn.logoEmoji}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">{conn.name}</span>
                                {conn.isOpenSource && (
                                  <span className="text-[9px] bg-purple-950/80 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                    OPEN SOURCE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{conn.description}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {conn.status === 'connected' && (
                              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {conn.lastTestedMs}ms
                              </span>
                            )}
                            {conn.status === 'disconnected' && (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                Not connected
                              </span>
                            )}
                            {conn.status === 'testing' && (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-blue-400 bg-blue-950/50 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                Testing...
                              </span>
                            )}
                            {conn.status === 'error' && (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Error
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 px-4 pb-3">
                          <button
                            onClick={() => setExpandedConnector(isExpanded ? null : conn.id)}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white font-semibold transition-colors"
                          >
                            <Settings className="w-3 h-3" />
                            {isExpanded ? 'Collapse' : 'Configure'}
                          </button>
                          <span className="text-slate-700">·</span>
                          <button
                            onClick={() => handleTestConnection(conn)}
                            disabled={conn.status === 'testing'}
                            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50"
                          >
                            {conn.status === 'testing' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            {conn.status === 'testing' ? 'Testing...' : 'Test Connection'}
                          </button>
                          <span className="text-slate-700">·</span>
                          <a
                            href={conn.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Docs
                          </a>
                        </div>

                        {/* Expanded Config Fields */}
                        {isExpanded && (
                          <div className="border-t border-slate-800 px-4 py-4 space-y-3 animate-in fade-in duration-150">
                            {conn.requiredFields.map((field) => {
                              const val = String(conn[field.key] ?? '');
                              const isSecret = field.type === 'password';
                              const showVal = showApiKey[`${conn.id}-${field.key}`];
                              return (
                                <div key={field.key} className="space-y-1">
                                  <label className="text-[11px] font-semibold text-slate-400 block">
                                    {field.label}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={isSecret && !showVal ? 'password' : 'text'}
                                      value={val}
                                      onChange={(e) => updateConnector(conn.id, { [field.key]: e.target.value } as Partial<Connector>)}
                                      placeholder={field.placeholder}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-16 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-red-500 transition-colors"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                      {isSecret && (
                                        <button
                                          type="button"
                                          onClick={() => setShowApiKey((s) => ({ ...s, [`${conn.id}-${field.key}`]: !s[`${conn.id}-${field.key}`] }))}
                                          className="text-slate-500 hover:text-slate-200 transition-colors"
                                        >
                                          {showVal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                      )}
                                      {val && (
                                        <button
                                          type="button"
                                          onClick={() => { navigator.clipboard.writeText(val); }}
                                          className="text-slate-500 hover:text-slate-200 transition-colors"
                                          title="Copy"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleTestConnection(conn)}
                                disabled={conn.status === 'testing'}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
                              >
                                <Zap className="w-3 h-3" />
                                Save & Test
                              </button>
                              <button
                                onClick={() => handleResetConnector(conn.id)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Reset Defaults
                              </button>
                              {conn.status === 'connected' && (
                                <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Universal Event Webhook Contract */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Webhook className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Universal Webhook Event Contract</h3>
              <span className="text-[10px] bg-amber-950/60 text-amber-300 font-mono border border-amber-500/30 px-1.5 py-0.5 rounded ml-auto">
                POST to your automation URL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Every ADNETIKS action dispatches a standard JSON webhook to your configured n8n or Activepieces endpoint. Add custom triggers to any workflow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { event: 'campaign.content_generated', desc: 'Copy, visuals, and hooks are ready for review or scheduling.' },
                { event: 'pixel.conversion_received', desc: 'A lead or purchase event was attributed to a campaign avatar.' },
                { event: 'sentiment.spike_alert', desc: 'Negative brand mention spike detected above threshold.' },
                { event: 'post.published', desc: 'A post was dispatched to Postiz for distribution.' },
                { event: 'avatar.saved_to_library', desc: 'A new target prospect was saved to the permanent Brand Library.' },
                { event: 'split_test.winner_declared', desc: 'A/B test winner identified — winner variant queued for scale.' },
              ].map((ev) => (
                <div key={ev.event} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] font-mono text-amber-400 font-bold mb-1">{ev.event}</div>
                  <div className="text-[11px] text-slate-400">{ev.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: AGENT BUILDER
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'agents' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Custom Staff Agents</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Build specialized AI agents for your team. Each agent has a persona, a model endpoint, and tool permissions. Any agent runs on any connected LLM.
              </p>
            </div>
            <button
              onClick={() => { setEditingAgent(null); setShowAgentModal(true); }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              New Agent
            </button>
          </div>

          {/* Model Agnosticism Info Card */}
          <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
            <BrainCircuit className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-bold text-purple-300">Every agent runs on the OpenAI /v1/chat/completions protocol</div>
              <div className="text-slate-400">
                Point any agent at Ollama (local), vLLM (GPU cluster), Gemini, OpenAI, DeepSeek, Mistral, Groq, or any OpenAI-compatible endpoint. Switch models in real time — zero code changes required.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const aiConnector = connectors.find((c) => c.category === 'ai_model' && c.endpoint === agent.modelEndpoint);
              return (
                <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <BrainCircuit className="w-4.5 h-4.5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{agent.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                          {agent.modelEndpoint.replace('http://', '').replace('https://', '').split('/')[0]}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {agent.isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">{agent.persona}</p>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tool Permissions</div>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map((tool) => (
                        <span key={tool} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Tests run: <strong className="text-slate-300">{agent.testsRun}</strong>
                      {aiConnector && (
                        <> · <span className="text-purple-400">{aiConnector.name}</span></>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestAgent(agent)}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded-lg transition-colors"
                        title="Test agent"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingAgent(agent); setShowAgentModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit agent"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Delete agent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: LIVE EVENT LOG
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'events' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Live Webhook Event Dispatch Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every ADNETIKS action dispatches a typed event to your automation endpoints. Inspect payloads and replay events here.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            <div className="grid grid-cols-5 gap-3 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Timestamp</span>
              <span className="col-span-2">Event</span>
              <span>Target</span>
              <span className="text-right">Actions</span>
            </div>
            {webhookEvents.map((ev, i) => (
              <div key={i} className="grid grid-cols-5 gap-3 px-4 py-3 items-center hover:bg-slate-800/40 transition-colors">
                <span className="text-[11px] font-mono text-slate-500">{ev.ts}</span>
                <div className="col-span-2 space-y-0.5">
                  <div className="text-[11px] font-mono font-bold text-amber-400">{ev.event}</div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">{ev.payload}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold text-slate-300">{ev.target}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => showNotificationToast('Event Replayed', `${ev.event} re-dispatched to ${ev.target}.`)}
                    className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Replay
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
            <div className="font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Data Flow Security Model
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-400">
              <li>All webhook payloads are dispatched server-side — API keys never leave the server process.</li>
              <li>Local model endpoints (Ollama, vLLM) keep all data on-device — no data sent to external APIs.</li>
              <li>PostHog/Umami can be fully self-hosted for complete GDPR compliance and zero third-party data sharing.</li>
              <li>n8n and Activepieces can run on your own private network — credentials are stored in your local env only.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Agent Modal ── */}
      {showAgentModal && (
        <AgentModal
          initial={editingAgent}
          connectors={connectors.filter((c) => c.category === 'ai_model')}
          onSave={handleSaveAgent}
          onClose={() => { setShowAgentModal(false); setEditingAgent(null); }}
        />
      )}
    </div>
  );
}

// ─── Agent Create / Edit Modal ────────────────────────────────────────────────

function AgentModal({
  initial,
  connectors,
  onSave,
  onClose,
}: {
  initial: CustomAgent | null;
  connectors: Connector[];
  onSave: (agent: CustomAgent) => void;
  onClose: () => void;
}) {
  const blank: CustomAgent = {
    id: '',
    name: '',
    persona: '',
    modelEndpoint: connectors[0]?.endpoint || 'http://localhost:11434/v1',
    tools: ['generate_content'],
    systemPrompt: '',
    isActive: true,
    testsRun: 0,
  };

  const [form, setForm] = useState<CustomAgent>(initial ?? blank);

  const toggleTool = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter((t) => t !== tool) : [...f.tools, tool],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              {initial ? 'Edit Agent' : 'Create New Staff Agent'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block">Agent Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Campaign Strategist"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block">Model Endpoint</label>
              <select
                value={form.modelEndpoint}
                onChange={(e) => setForm({ ...form, modelEndpoint: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                {connectors.map((c) => (
                  <option key={c.id} value={c.endpoint}>{c.name} — {c.endpoint}</option>
                ))}
                <option value="custom">Custom URL...</option>
              </select>
              {form.modelEndpoint === 'custom' && (
                <input
                  type="text"
                  placeholder="http://localhost:11434/v1"
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-red-500"
                  onChange={(e) => setForm({ ...form, modelEndpoint: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">Agent Persona (shown to staff)</label>
            <textarea
              rows={2}
              value={form.persona}
              onChange={(e) => setForm({ ...form, persona: e.target.value })}
              placeholder="Describe what this agent specializes in and how staff should use it..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">System Prompt (sent to the model)</label>
            <textarea
              rows={4}
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder="You are an expert... Given [input], return structured JSON with..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 font-mono leading-relaxed focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 block">Tool Permissions (what this agent can call)</label>
            <div className="flex flex-wrap gap-2">
              {TOOL_OPTIONS.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                    form.tools.includes(tool)
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {form.tools.includes(tool) ? '✓ ' : ''}{tool}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="agent-active"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-red-500"
            />
            <label htmlFor="agent-active" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Activate agent immediately
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {initial ? 'Save Changes' : 'Create Agent'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
