/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Smart AI Scheduler & Automated Multi-Channel Queue Dispatcher
 */

import { useState, useEffect } from 'react';
import { PostVariant, PostStatus, SocialPlatform, UserRole } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Globe,
  Layers,
  Webhook,
  Settings,
  Link2,
  Copy,
  Radio,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';

interface SmartSchedulerProps {
  posts: PostVariant[];
  setPosts: (posts: PostVariant[]) => void;
  userRole: UserRole;
  showNotificationToast: (title: string, message: string) => void;
}

export default function SmartScheduler({
  posts,
  setPosts,
  userRole,
  showNotificationToast,
}: SmartSchedulerProps) {
  const [viewMode, setViewMode] = useState<'queue' | 'calendar'>('queue');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);

  // Phase 2 Real Publishing Bridge & Background Scheduler State
  const [publishConfig, setPublishConfig] = useState<{
    mode: 'dry_run' | 'webhook' | 'postiz';
    webhookUrl: string;
    postizBaseUrl: string;
    autoDispatchEnabled: boolean;
    hasPostizKey: boolean;
    hasWebhookSecret: boolean;
  }>({
    mode: 'dry_run',
    webhookUrl: '',
    postizBaseUrl: 'http://localhost:5000/api/v1',
    autoDispatchEnabled: false,
    hasPostizKey: false,
    hasWebhookSecret: false,
  });
  const [showConnectorPanel, setShowConnectorPanel] = useState(false);
  const [draftPostizKey, setDraftPostizKey] = useState('');
  const [draftWebhookSecret, setDraftWebhookSecret] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [deliveryLogs, setDeliveryLogs] = useState<
    Array<{
      id: string;
      postId: string;
      platform: string;
      mode: string;
      status: string;
      httpStatus?: number;
      responseSnippet: string;
      trackingUrl?: string;
      dispatchedAt: string;
    }>
  >([]);
  const [lastSchedulerTick, setLastSchedulerTick] = useState<string | null>(null);

  const loadDeliveryState = () => {
    fetch('/api/publish/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.config) setPublishConfig(d.config);
      })
      .catch(() => {});
    fetch('/api/publish/logs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.logs)) setDeliveryLogs(d.logs);
        if (d?.lastSchedulerTick) setLastSchedulerTick(d.lastSchedulerTick);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDeliveryState();
  }, []);

  const handleSavePublishConfig = async (override?: Partial<typeof publishConfig>) => {
    setIsSavingConfig(true);
    try {
      const merged = { ...publishConfig, ...(override || {}) };
      const payload: Record<string, any> = {
        mode: merged.mode,
        webhookUrl: merged.webhookUrl,
        postizBaseUrl: merged.postizBaseUrl,
        autoDispatchEnabled: merged.autoDispatchEnabled,
      };
      if (draftPostizKey.trim()) payload.postizApiKey = draftPostizKey.trim();
      if (draftWebhookSecret.trim()) payload.webhookSecret = draftWebhookSecret.trim();

      const res = await fetch('/api/publish/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (data.config) setPublishConfig(data.config);
      setDraftPostizKey('');
      setDraftWebhookSecret('');
      setShowConnectorPanel(false);
      showNotificationToast(
        'Delivery Bridge Saved',
        `Active mode: ${data.config.mode.toUpperCase()} · Auto-Scheduler: ${data.config.autoDispatchEnabled ? 'ON' : 'OFF'}.`
      );
    } catch {
      showNotificationToast('Config Error', 'Could not update publishing bridge configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Status Badge Styling & Labels
  const statusStyles: Record<PostStatus, { label: string; color: string; border: string }> = {
    draft: { label: 'Draft', color: 'text-slate-400 bg-slate-900', border: 'border-slate-800' },
    in_review: { label: 'In Review', color: 'text-amber-400 bg-amber-950/40', border: 'border-amber-800/50' },
    approved: { label: 'Approved', color: 'text-blue-400 bg-blue-950/40', border: 'border-blue-800/50' },
    scheduled: { label: 'Scheduled', color: 'text-purple-400 bg-purple-950/40', border: 'border-purple-800/50' },
    published: { label: 'Published', color: 'text-emerald-400 bg-emerald-950/40', border: 'border-emerald-800/50' },
    failed: { label: 'Failed', color: 'text-red-400 bg-red-950/40', border: 'border-red-800/50' },
  };

  const filteredPosts = posts.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || p.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  // AI Peak Hour Re-allocation
  const handleAutoOptimizeSlots = () => {
    const optimalSlots = ['08:30:00Z', '12:15:00Z', '17:45:00Z', '19:30:00Z'];
    const updated = posts.map((p, idx) => {
      if (p.status === 'draft' || p.status === 'approved' || p.status === 'scheduled') {
        const slot = optimalSlots[idx % optimalSlots.length];
        const dateStr = new Date(Date.now() + (idx + 1) * 43200000).toISOString().split('T')[0];
        return {
          ...p,
          scheduledTime: `${dateStr}T${slot}`,
          status: p.status === 'draft' ? 'scheduled' : p.status,
        };
      }
      return p;
    });

    setPosts(updated);
    showNotificationToast(
      'AI Peak-Hour Optimization Complete',
      'All posts calibrated to peak avatar engagement hours (08:30, 12:15, 17:45).'
    );
  };

  // Approval Gate Handler
  const handleUpdateStatus = (postId: string, newStatus: PostStatus) => {
    const updated = posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p));
    setPosts(updated);

    if (newStatus === 'approved') {
      showNotificationToast('Post Approved', 'Schedule locked and armed for automated publishing.');
    } else if (newStatus === 'scheduled') {
      showNotificationToast('Post Scheduled', 'Post queued into live distribution pipeline.');
    }
  };

  // Real Publishing Bridge Dispatch (POST /api/publish/dispatch -> Postiz / Webhook / Dry-Run Sandbox)
  const handleRealDispatch = async () => {
    if (isSimulatingDispatch) return;
    const readyPosts = posts.filter((p) => p.status === 'scheduled' || p.status === 'approved');
    if (readyPosts.length === 0) {
      showNotificationToast('No Ready Posts', 'Approve or schedule at least one post before dispatching.');
      return;
    }

    setIsSimulatingDispatch(true);
    setDispatchProgress(25);
    try {
      const res = await fetch('/api/publish/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: readyPosts.map((p) => ({
            id: p.id,
            campaignId: p.campaignId,
            platform: p.platform,
            variantLabel: p.variantLabel,
            hookAngle: p.hookAngle,
            content: p.content,
            hashtags: p.hashtags,
            mediaUrl: p.mediaUrl,
            mediaType: p.mediaType,
            destinationUrl: p.destinationUrl || 'https://adnetiks.io',
            scheduledTime: p.scheduledTime,
          })),
        }),
      });
      setDispatchProgress(85);
      if (!res.ok) throw new Error('Dispatch request failed');
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      const resultMap = new Map<string, any>(results.map((r: any) => [r.postId, r]));

      const updated = posts.map((p) => {
        const r = resultMap.get(p.id);
        if (!r) return p;
        const nextStatus: PostStatus =
          r.status === 'failed' ? 'failed' : r.status === 'published' ? 'published' : 'scheduled';
        return { ...p, status: nextStatus };
      });
      setPosts(updated);
      setDispatchProgress(100);
      loadDeliveryState();

      const liveCount = results.filter((r: any) => r.status === 'published').length;
      const dryCount = results.filter((r: any) => r.status === 'dry_run').length;
      const failCount = results.filter((r: any) => r.status === 'failed').length;
      showNotificationToast(
        liveCount > 0 ? 'Live Dispatch Executed' : 'Dry-Run Dispatch Logged',
        `${results.length} post(s) processed — ${liveCount} live published, ${dryCount} dry-run verified, ${failCount} failed.`
      );
    } catch (err: any) {
      showNotificationToast('Dispatch Error', err?.message || 'Failed to dispatch posts.');
    } finally {
      setTimeout(() => {
        setIsSimulatingDispatch(false);
        setDispatchProgress(0);
      }, 450);
    }
  };

  // Group by day for calendar view
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-red-500" />
            Smart Scheduler &amp; Real Delivery Bridge
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dispatch approved posts via Postiz API or signed n8n/Zapier webhooks, mint real UTM links, and run the 30s background cron scheduler.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => setShowConnectorPanel(!showConnectorPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-800/60 transition-colors"
            title="Configure Postiz API, Webhook URL, or Background Auto-Scheduler"
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>
              Bridge: {publishConfig.mode === 'dry_run' ? 'Dry-Run' : publishConfig.mode.toUpperCase()}
            </span>
          </button>

          <button
            onClick={() => handleSavePublishConfig({ autoDispatchEnabled: !publishConfig.autoDispatchEnabled })}
            disabled={userRole === 'analyst'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              publishConfig.autoDispatchEnabled
                ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle real server-side background scheduler (checks due posts every 30s)"
          >
            <Radio className={`w-3.5 h-3.5 ${publishConfig.autoDispatchEnabled ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Cron: {publishConfig.autoDispatchEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleAutoOptimizeSlots}
            disabled={userRole === 'analyst'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            title="Automatically assign posts to peak avatar engagement times"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Peak-Hour Optimize</span>
          </button>

          <button
            onClick={handleRealDispatch}
            disabled={isSimulatingDispatch || userRole === 'analyst'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Dispatch ready posts through your configured publishing bridge"
          >
            {isSimulatingDispatch ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching ({dispatchProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Dispatch Ready Posts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real Publishing Bridge Configuration Drawer */}
      {showConnectorPanel && (
        <div className="bg-[#111116] border border-cyan-700/50 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1F1F2A] pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Real Publishing Bridge Configuration (BE-Agnostic)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {lastSchedulerTick ? `Last Cron Tick: ${new Date(lastSchedulerTick).toLocaleTimeString()}` : 'Cron Worker Standby'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'dry_run' as const, label: 'Dry-Run Sandbox', desc: 'Verifies payload & mints real UTM tracking links locally' },
              { id: 'webhook' as const, label: 'Signed Webhook (n8n / Make / Custom)', desc: 'POSTs signed JSON + media URL to your automation URL' },
              { id: 'postiz' as const, label: 'Postiz Open-Source API', desc: 'Publishes natively to IG, TikTok, X, LinkedIn & YouTube' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPublishConfig({ ...publishConfig, mode: m.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  publishConfig.mode === m.id
                    ? 'bg-cyan-950/30 border-cyan-500 text-white'
                    : 'bg-[#0A0A0C] border-[#1F1F2A] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{m.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>

          {publishConfig.mode === 'webhook' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Webhook Endpoint URL</label>
                <input
                  type="url"
                  value={publishConfig.webhookUrl}
                  onChange={(e) => setPublishConfig({ ...publishConfig, webhookUrl: e.target.value })}
                  placeholder="https://n8n.yourdomain.com/webhook/adnetiks-publish"
                  className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  HMAC Signing Secret {publishConfig.hasWebhookSecret ? '(Configured ✓)' : '(Optional)'}
                </label>
                <input
                  type="password"
                  value={draftWebhookSecret}
                  onChange={(e) => setDraftWebhookSecret(e.target.value)}
                  placeholder="Optional X-ADNETIKS-Signature secret"
                  className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          {publishConfig.mode === 'postiz' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Postiz API Base URL</label>
                <input
                  type="url"
                  value={publishConfig.postizBaseUrl}
                  onChange={(e) => setPublishConfig({ ...publishConfig, postizBaseUrl: e.target.value })}
                  placeholder="http://localhost:5000/api/v1"
                  className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Postiz API Key {publishConfig.hasPostizKey ? '(Configured ✓)' : ''}
                </label>
                <input
                  type="password"
                  value={draftPostizKey}
                  onChange={(e) => setDraftPostizKey(e.target.value)}
                  placeholder="ptz_..."
                  className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F1F2A]">
            <button
              type="button"
              onClick={() => setShowConnectorPanel(false)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => handleSavePublishConfig()}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              {isSavingConfig ? 'Saving...' : 'Save Delivery Bridge'}
            </button>
          </div>
        </div>
      )}

      {/* Real Delivery Audit Trail & Minted UTM Tracking Links */}
      {deliveryLogs.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Real Dispatch Audit Log ({deliveryLogs.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400">Persisted in .adnetiks-data/delivery.json</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {deliveryLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                      log.status === 'published'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        : log.status === 'failed'
                        ? 'bg-red-950 text-red-300 border border-red-700/60'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                    }`}
                  >
                    {log.status} · {log.platform}
                  </span>
                  <span className="text-slate-300 truncate max-w-md">{log.responseSnippet}</span>
                </div>
                {log.trackingUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(log.trackingUrl || '');
                      showNotificationToast('UTM Link Copied', log.trackingUrl || '');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] flex items-center gap-1 shrink-0"
                    title="Copy real short UTM tracking link"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>{log.trackingUrl.replace(/^https?:\/\/[^/]+/, '')}</span>
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        
        {/* View Switcher: Queue vs Calendar */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('queue')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'queue' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Queue Timeline ({filteredPosts.length})
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
            Weekly Calendar
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All ({posts.length})</option>
              <option value="draft">Drafts</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Platform:</span>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer capitalize"
            >
              <option value="all">All Channels</option>
              <option value="linkedin">LinkedIn</option>
              <option value="x">X / Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="threads">Threads</option>
            </select>
          </div>

        </div>

      </div>

      {/* VIEW 1: QUEUE TIMELINE VIEW */}
      {viewMode === 'queue' && (
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">No posts matching active filter</p>
              <p className="text-xs text-slate-500">Generate new posts in the Creative Studio or clear filters.</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const statusCfg = statusStyles[post.status];
              const dateDisplay = post.scheduledTime
                ? new Date(post.scheduledTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Unscheduled';

              return (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-slate-700 transition-all"
                >
                  {/* Left: Platform & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <AdnetiksLogo size={22} />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white capitalize">{post.platform}</span>
                        <span className="text-[11px] font-semibold text-slate-400">· {post.variantLabel}</span>
                        <span className="text-[11px] text-slate-500">· {post.hookAngle}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.color} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateDisplay}
                        </span>
                        {post.status === 'published' && (
                          <span>
                            {post.metrics.impressions.toLocaleString()} views · {post.metrics.clicks} clicks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & RBAC Gate */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80 w-full md:w-auto justify-end">
                    
                    {/* Role-Based Approval Gates */}
                    {post.status === 'in_review' && (userRole === 'admin' || userRole === 'approver') && (
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Schedule</span>
                      </button>
                    )}

                    {post.status === 'draft' && (
                      <button
                        onClick={() => handleUpdateStatus(post.id, userRole === 'creator' ? 'in_review' : 'scheduled')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                      >
                        <span>{userRole === 'creator' ? 'Submit for Review' : 'Queue to Schedule'}</span>
                      </button>
                    )}

                    {post.status === 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'scheduled')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        <span>Lock into Queue</span>
                      </button>
                    )}

                    {post.status === 'published' && (
                      <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                      </span>
                    )}

                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: WEEKLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Week of November 2, 2026 — Multi-Channel Delivery Matrix
            </span>
            <span className="text-xs text-slate-400 font-mono">Synced to Active Avatar Slots</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {daysOfWeek.map((day, dIdx) => {
              const dayPosts = posts.filter((_, idx) => idx % 7 === dIdx);

              return (
                <div key={day} className="bg-slate-950 rounded-xl border border-slate-800/80 p-3 flex flex-col space-y-2 min-h-[180px]">
                  <div className="border-b border-slate-800/80 pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{day.slice(0, 3)}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Nov {2 + dIdx}</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {dayPosts.map((p) => {
                      const statusCfg = statusStyles[p.status];
                      return (
                        <div
                          key={p.id}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold uppercase text-red-400">{p.platform}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${statusCfg.color} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                            {p.content}
                          </p>
                        </div>
                      );
                    })}

                    {dayPosts.length === 0 && (
                      <div className="text-[11px] text-slate-600 italic text-center pt-8">
                        No posts scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
