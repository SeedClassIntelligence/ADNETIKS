/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Workflow Automations Library & Live n8n / Activepieces Engine
 * Auto-populates real importable n8n & Activepieces workflows with the active Brand Profile,
 * pulls existing workflows from connected n8n / Activepieces servers, supports 1-click deploy,
 * and triggers live or sandboxed test runs with persistent execution logs.
 */

import { useState, useEffect } from 'react';
import { BrandProfile } from '../types';
import {
  AUTOMATION_TEMPLATES,
  AutomationCategory,
  AutomationEngine,
  AutomationTemplate,
  buildN8nWorkflowJson,
  buildActivepiecesFlowJson,
} from '../data/automationTemplates';
import {
  Workflow,
  Zap,
  Download,
  Copy,
  CheckCircle2,
  Play,
  RefreshCw,
  UploadCloud,
  Code2,
  X,
  ArrowRight,
  Settings2,
  Radio,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface SyncedWorkflow {
  id: string;
  platform: AutomationEngine;
  name: string;
  active: boolean;
  nodesCount: number;
  webhookUrl?: string;
  updatedAt?: string;
  source: 'pulled' | 'deployed_from_adnetiks';
}

interface ExecutionLog {
  id: string;
  platform: AutomationEngine;
  workflowName: string;
  mode: 'live_webhook' | 'sandbox_verified';
  status: 'success' | 'error';
  httpStatus?: number;
  latencyMs: number;
  targetUrl?: string;
  responseSnippet: string;
  timestamp: string;
}

interface AutomationsState {
  connections: {
    n8n: {
      baseUrl: string;
      webhookUrl: string;
      hasApiKey: boolean;
      connected: boolean;
      lastSyncedAt: string | null;
    };
    activepieces: {
      baseUrl: string;
      webhookUrl: string;
      projectId: string;
      hasApiKey: boolean;
      connected: boolean;
      lastSyncedAt: string | null;
    };
  };
  syncedWorkflows: SyncedWorkflow[];
  executions: ExecutionLog[];
}

interface WorkflowAutomationsViewProps {
  brandProfile: BrandProfile;
  showNotificationToast: (title: string, message: string) => void;
}

export default function WorkflowAutomationsView({
  brandProfile,
  showNotificationToast,
}: WorkflowAutomationsViewProps) {
  const [selectedEngine, setSelectedEngine] = useState<AutomationEngine>('n8n');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AutomationCategory>('all');
  const [state, setState] = useState<AutomationsState | null>(null);
  const [configPlatform, setConfigPlatform] = useState<AutomationEngine | null>(null);

  // Connection Form State
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [formProjectId, setFormProjectId] = useState('');

  // Action Loading States
  const [isSavingConn, setIsSavingConn] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<AutomationEngine | null>(null);
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  // JSON Inspector Modal
  const [inspectedTemplate, setInspectedTemplate] = useState<AutomationTemplate | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const brandContext = {
    brandName: brandProfile.name || 'ADNETIKS',
    websiteUrl: brandProfile.websiteUrl || 'https://adnetiks.io',
    primaryColor: brandProfile.brandColors?.primary || '#E8192C',
    adnetiksBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  };

  const fetchState = async () => {
    try {
      const res = await fetch('/api/automations/state');
      if (res.ok) {
        const data = await res.json();
        if (data?.ok) setState(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const openConnectionForm = (plat: AutomationEngine) => {
    if (configPlatform === plat) {
      setConfigPlatform(null);
      return;
    }
    const existing = state?.connections?.[plat];
    setFormBaseUrl(existing?.baseUrl || (plat === 'n8n' ? 'http://localhost:5678' : 'http://localhost:8080'));
    setFormWebhookUrl(existing?.webhookUrl || '');
    setFormProjectId(plat === 'activepieces' ? state?.connections?.activepieces?.projectId || '' : '');
    setFormApiKey('');
    setConfigPlatform(plat);
  };

  const handleSaveConnection = async (plat: AutomationEngine) => {
    setIsSavingConn(true);
    try {
      const res = await fetch('/api/automations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: plat,
          baseUrl: formBaseUrl,
          apiKey: formApiKey,
          webhookUrl: formWebhookUrl,
          projectId: plat === 'activepieces' ? formProjectId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setState(data);
        setFormApiKey('');
        showNotificationToast(
          `${plat === 'n8n' ? 'n8n' : 'Activepieces'} Connection Saved`,
          `Saved endpoint settings for ${formBaseUrl}. Click "Pull Workflows" to import your existing automations.`
        );
      } else {
        showNotificationToast('Save Failed', data?.error || 'Could not save connection.');
      }
    } finally {
      setIsSavingConn(false);
    }
  };

  const handleSyncWorkflows = async (plat: AutomationEngine) => {
    setSyncingPlatform(plat);
    try {
      const res = await fetch('/api/automations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: plat }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        if (data.state) setState(data.state);
        showNotificationToast(
          `Pulled ${data.count} ${plat === 'n8n' ? 'n8n' : 'Activepieces'} Workflow(s)`,
          `Your live ${plat === 'n8n' ? 'n8n' : 'Activepieces'} automations are now ready to trigger inside ADNETIKS.`
        );
      } else {
        showNotificationToast(
          `${plat === 'n8n' ? 'n8n' : 'Activepieces'} Sync Notice`,
          data?.error || 'Connect your server URL and API key first.'
        );
      }
    } finally {
      setSyncingPlatform(null);
    }
  };

  const buildJsonForEngine = (tpl: AutomationTemplate, engine: AutomationEngine) => {
    return engine === 'n8n'
      ? buildN8nWorkflowJson(tpl, brandContext)
      : buildActivepiecesFlowJson(tpl, brandContext);
  };

  const handleDownloadJson = (tpl: AutomationTemplate) => {
    const jsonObj = buildJsonForEngine(tpl, selectedEngine);
    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const brandSlug = brandContext.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 18);
    a.href = url;
    a.download = `adnetiks-${brandSlug}-${selectedEngine}-${tpl.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotificationToast(
      `${selectedEngine === 'n8n' ? 'n8n' : 'Activepieces'} Workflow Downloaded`,
      `Auto-populated for "${brandContext.brandName}". Import directly into ${selectedEngine === 'n8n' ? 'n8n' : 'Activepieces'} in 1 click.`
    );
  };

  const handleDeployTemplate = async (tpl: AutomationTemplate) => {
    setDeployingId(tpl.id);
    try {
      const workflowJson = buildJsonForEngine(tpl, selectedEngine);
      const res = await fetch('/api/automations/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedEngine,
          workflowJson,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        if (data.state) setState(data.state);
        showNotificationToast(
          `Deployed to ${selectedEngine === 'n8n' ? 'n8n' : 'Activepieces'}!`,
          `"${tpl.title}" is now live inside your ${selectedEngine === 'n8n' ? 'n8n' : 'Activepieces'} workspace.`
        );
      } else {
        if (data?.needsConnection) {
          openConnectionForm(selectedEngine);
        }
        showNotificationToast(
          data?.needsConnection ? 'Connect Server or Download JSON' : 'Deploy Notice',
          data?.error || 'Could not deploy automatically — use Download .json to import.'
        );
      }
    } finally {
      setDeployingId(null);
    }
  };

  const handleTriggerRun = async (
    workflowId: string,
    workflowName: string,
    platform: AutomationEngine,
    dataPayload: Record<string, any>,
    webhookUrl?: string
  ) => {
    setRunningId(workflowId);
    try {
      const res = await fetch('/api/automations/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          workflowName,
          webhookUrl,
          data: {
            ...dataPayload,
            brandName: brandContext.brandName,
            websiteUrl: brandContext.websiteUrl,
            primaryColor: brandContext.primaryColor,
          },
        }),
      });
      const data = await res.json();
      if (data?.state) setState(data.state);
      const ex: ExecutionLog | undefined = data?.execution;
      showNotificationToast(
        ex?.mode === 'live_webhook' ? 'Live Automation Triggered' : 'Automation Sandbox Verified',
        `${workflowName} (${ex?.latencyMs ?? 0}ms) — ${ex?.responseSnippet || 'Completed'}`
      );
    } finally {
      setRunningId(null);
    }
  };

  const filteredTemplates = AUTOMATION_TEMPLATES.filter((t) =>
    categoryFilter === 'all' ? true : t.category === categoryFilter
  );

  const categories: Array<{ id: 'all' | AutomationCategory; label: string }> = [
    { id: 'all', label: `All (${AUTOMATION_TEMPLATES.length})` },
    { id: 'lead_crm', label: 'Lead & CRM' },
    { id: 'sales_followup', label: 'Sales & Follow-Up' },
    { id: 'content_launch', label: 'Content & Launch' },
    { id: 'competitor_intel', label: 'Competitor Intel' },
    { id: 'reporting', label: 'Executive Reporting' },
  ];

  const n8nConn = state?.connections?.n8n;
  const apConn = state?.connections?.activepieces;

  return (
    <div className="space-y-6">
      {/* TOP BANNER: LIVE n8n & ACTIVEPIECES CONNECTOR BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* n8n Live Bridge Card */}
        <div className="p-5 rounded-2xl bg-[#111116] border border-[#242434] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400 font-black text-xs">
                n8n
              </div>
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>n8n Automation Engine</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      n8nConn?.connected
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {n8nConn?.connected ? 'Connected' : 'Ready to Connect'}
                  </span>
                </div>
                <div className="text-[11px] text-[#8B8BA8]">
                  Pull existing n8n workflows, 1-click deploy new ones, or download `.json`
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openConnectionForm('n8n')}
              className="px-3 py-1.5 rounded-xl bg-[#181822] hover:bg-[#232332] border border-[#2E2E42] text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{configPlatform === 'n8n' ? 'Hide Settings' : 'Connect n8n'}</span>
            </button>
            <button
              type="button"
              disabled={syncingPlatform === 'n8n'}
              onClick={() => handleSyncWorkflows('n8n')}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingPlatform === 'n8n' ? 'animate-spin' : ''}`} />
              <span>Pull Live Workflows</span>
            </button>
          </div>
        </div>

        {/* Activepieces Live Bridge Card */}
        <div className="p-5 rounded-2xl bg-[#111116] border border-[#242434] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-700/50 flex items-center justify-center text-purple-300 font-black text-xs">
                AP
              </div>
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Activepieces Flow Engine</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      apConn?.connected
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {apConn?.connected ? 'Connected' : 'Ready to Connect'}
                  </span>
                </div>
                <div className="text-[11px] text-[#8B8BA8]">
                  Pull Activepieces flows, auto-populate with your brand, or export flow templates
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openConnectionForm('activepieces')}
              className="px-3 py-1.5 rounded-xl bg-[#181822] hover:bg-[#232332] border border-[#2E2E42] text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{configPlatform === 'activepieces' ? 'Hide Settings' : 'Connect Activepieces'}</span>
            </button>
            <button
              type="button"
              disabled={syncingPlatform === 'activepieces'}
              onClick={() => handleSyncWorkflows('activepieces')}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 text-xs font-bold text-purple-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingPlatform === 'activepieces' ? 'animate-spin' : ''}`} />
              <span>Pull Live Flows</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDABLE CONNECTION FORM */}
      {configPlatform && (
        <div className="p-5 rounded-2xl bg-[#0D0D14] border border-cyan-700/50 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>
                Connect Your {configPlatform === 'n8n' ? 'n8n' : 'Activepieces'} Instance (Cloud or Self-Hosted)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConfigPlatform(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                {configPlatform === 'n8n' ? 'n8n Server URL' : 'Activepieces Server URL'}
              </label>
              <input
                type="url"
                value={formBaseUrl}
                onChange={(e) => setFormBaseUrl(e.target.value)}
                placeholder={configPlatform === 'n8n' ? 'https://n8n.yourdomain.com' : 'https://cloud.activepieces.com'}
                className="w-full px-3 py-2 rounded-xl bg-[#08080C] border border-[#2A2A38] text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                API Key {state?.connections?.[configPlatform]?.hasApiKey ? '(Saved — leave blank to keep)' : ''}
              </label>
              <input
                type="password"
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                placeholder={configPlatform === 'n8n' ? 'n8n_api_...' : 'ap_key_...'}
                className="w-full px-3 py-2 rounded-xl bg-[#08080C] border border-[#2A2A38] text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Default Webhook URL (optional)</label>
              <input
                type="url"
                value={formWebhookUrl}
                onChange={(e) => setFormWebhookUrl(e.target.value)}
                placeholder={
                  configPlatform === 'n8n'
                    ? 'https://n8n.yourdomain.com/webhook/adnetiks'
                    : 'https://cloud.activepieces.com/api/v1/webhooks/...'
                }
                className="w-full px-3 py-2 rounded-xl bg-[#08080C] border border-[#2A2A38] text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {configPlatform === 'activepieces' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Activepieces Project ID (optional)</label>
                <input
                  type="text"
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  placeholder="proj_..."
                  className="w-full px-3 py-2 rounded-xl bg-[#08080C] border border-[#2A2A38] text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSavingConn}
              onClick={() => handleSaveConnection(configPlatform)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer"
            >
              {isSavingConn ? 'Saving...' : 'Save Connection'}
            </button>
          </div>
        </div>
      )}

      {/* PULLED / DEPLOYED LIVE WORKFLOWS (if any exist) */}
      {state && state.syncedWorkflows.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#111116] border border-emerald-700/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Your Connected Live Workflows ({state.syncedWorkflows.length})</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300">Pulled &amp; Deployed via REST API</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.syncedWorkflows.map((wf) => (
              <div
                key={`${wf.platform}-${wf.id}`}
                className="p-3.5 rounded-xl bg-[#0A0A0F] border border-[#222230] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        wf.platform === 'n8n'
                          ? 'bg-amber-950/70 text-amber-300'
                          : 'bg-purple-950/70 text-purple-300'
                      }`}
                    >
                      {wf.platform}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{wf.name}</span>
                  </div>
                  <div className="text-[10px] text-[#8B8BA8] font-mono mt-1">
                    {wf.nodesCount} nodes · {wf.active ? 'Active' : 'Draft'} ·{' '}
                    {wf.source === 'deployed_from_adnetiks' ? 'Deployed by ADNETIKS' : 'Pulled from server'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={runningId === wf.id}
                  onClick={() =>
                    handleTriggerRun(
                      wf.id,
                      wf.name,
                      wf.platform,
                      { workflowId: wf.id, event: 'manual_adnetiks_trigger' },
                      wf.webhookUrl
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>{runningId === wf.id ? 'Running...' : 'Run Now'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUTO-POPULATED WORKFLOW AUTOMATIONS LIBRARY */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#111116] border border-[#222230] p-4 rounded-2xl">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Workflow className="w-4 h-4 text-red-400" />
              <span className="text-sm font-extrabold text-white">
                Auto-Populated Workflow Automations Library
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Pre-Filled For: {brandContext.brandName}
              </span>
            </div>
            <p className="text-xs text-[#8B8BA8]">
              Automate leads, CRM routing, competitor tracking, inbox booking links, and weekly ROI digests — not just social posts.
            </p>
          </div>

          {/* Target Format Engine Switcher */}
          <div className="flex items-center gap-1.5 bg-[#09090D] p-1 rounded-xl border border-[#242434] self-start">
            <button
              type="button"
              onClick={() => setSelectedEngine('n8n')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedEngine === 'n8n'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              n8n Format
            </button>
            <button
              type="button"
              onClick={() => setSelectedEngine('activepieces')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedEngine === 'activepieces'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Activepieces Format
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-[#111116] border-[#242434] text-[#9A9AB6] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-[#111116] border border-[#222230] hover:border-[#34344A] transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-950/60 border border-red-800/50 text-[10px] font-mono font-bold text-red-300 uppercase">
                    {tpl.categoryLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#09090D] border border-[#2A2A3B] text-[10px] font-mono text-cyan-300">
                    {tpl.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">{tpl.title}</h3>
                  <p className="text-xs text-[#9494B2] mt-1 leading-relaxed">{tpl.summary}</p>
                </div>

                {/* Visual 4-Step Flow Chain */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {tpl.steps.map((st, idx) => (
                    <div
                      key={st.label}
                      className="p-2 rounded-xl bg-[#0A0A0E] border border-[#1E1E2B] relative"
                    >
                      <div className="text-[9px] font-mono uppercase text-[#7E7E9A]">
                        0{idx + 1} · {st.kind}
                      </div>
                      <div className="text-[11px] font-bold text-white leading-tight mt-0.5">{st.label}</div>
                      <div className="text-[9px] text-emerald-400 truncate mt-0.5">{st.tool}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-emerald-300/90 bg-emerald-950/25 border border-emerald-800/35 rounded-xl px-3 py-2 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tpl.businessOutcome}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1E1E2C]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInspectedTemplate(tpl)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#181822] hover:bg-[#232332] border border-[#2A2A3B] text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspect JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadJson(tpl)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#181822] hover:bg-[#232332] border border-[#2A2A3B] text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download .json</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={deployingId === tpl.id}
                    onClick={() => handleDeployTemplate(tpl)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {deployingId === tpl.id
                        ? 'Deploying...'
                        : `Deploy to ${selectedEngine === 'n8n' ? 'n8n' : 'AP'}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={runningId === tpl.id}
                    onClick={() =>
                      handleTriggerRun(tpl.id, tpl.title, selectedEngine, tpl.samplePayload)
                    }
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>{runningId === tpl.id ? 'Testing...' : 'Test Run'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE AUTOMATION EXECUTION LOG */}
      <div className="p-5 rounded-2xl bg-[#111116] border border-[#222230] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Live Automation Execution Log ({state?.executions?.length || 0})</span>
          </div>
          <span className="text-[10px] font-mono text-[#7E7E9A]">Persisted in .adnetiks-data/automations.json</span>
        </div>

        {!state || state.executions.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#0A0A0E] border border-[#1E1E2B] text-xs text-[#8B8BA8] text-center">
            Click <strong>Test Run</strong> on any automation above to verify your brand-populated payload and record a live execution here.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {state.executions.slice(0, 12).map((ex) => (
              <div
                key={ex.id}
                className="px-3 py-2 rounded-xl bg-[#0A0A0E] border border-[#1E1E2B] flex flex-wrap items-center justify-between gap-2 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                      ex.platform === 'n8n'
                        ? 'bg-amber-950/70 text-amber-300'
                        : 'bg-purple-950/70 text-purple-300'
                    }`}
                  >
                    {ex.platform}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                      ex.status === 'success'
                        ? 'bg-emerald-950/70 text-emerald-300'
                        : 'bg-red-950/70 text-red-300'
                    }`}
                  >
                    {ex.mode === 'live_webhook' ? `LIVE ${ex.httpStatus || ''}` : 'SANDBOX OK'}
                  </span>
                  <span className="font-bold text-white truncate max-w-[240px]">{ex.workflowName}</span>
                  <span className="text-[#8B8BA8] truncate hidden md:inline max-w-md">{ex.responseSnippet}</span>
                </div>
                <span className="text-[10px] font-mono text-[#7E7E9A] shrink-0">
                  {ex.latencyMs}ms · {new Date(ex.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSON INSPECTOR MODAL */}
      {inspectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0E0E14] border border-[#2A2A3B] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-[#1F1F2D] flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  Auto-Populated {selectedEngine === 'n8n' ? 'n8n Workflow' : 'Activepieces Flow'} JSON ·{' '}
                  {brandContext.brandName}
                </div>
                <div className="text-sm font-extrabold text-white">{inspectedTemplate.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedTemplate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C1C28]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#08080C]">
              <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(buildJsonForEngine(inspectedTemplate, selectedEngine), null, 2)}
              </pre>
            </div>

            <div className="px-5 py-3.5 border-t border-[#1F1F2D] flex flex-wrap items-center justify-between gap-2 bg-[#111118]">
              <span className="text-[11px] text-[#8B8BA8]">{inspectedTemplate.externalDestinationHint}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(JSON.stringify(buildJsonForEngine(inspectedTemplate, selectedEngine), null, 2))
                      .catch(() => {});
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1D1D2A] hover:bg-[#28283A] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadJson(inspectedTemplate)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
