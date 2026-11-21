/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Performance Analytics & Real-Time Engagement Heatmap
 */

import { useState, useEffect } from 'react';
import { PostVariant, HeatmapCell, CompetitorProfile } from '../types';
import {
  BarChart3,
  TrendingUp,
  Users,
  MousePointerClick,
  DollarSign,
  FileSpreadsheet,
  Download,
  Calendar,
  ArrowUpRight,
  Flame,
  Cpu,
  Radio,
  Link2,
  RefreshCw,
} from 'lucide-react';
import CompetitorWatch from './CompetitorWatch';
import TrendingSocialMonitor from './TrendingSocialMonitor';
import SentimentCalendarHeatmap from './SentimentCalendarHeatmap';
import AIAgentPerformanceView from './AIAgentPerformanceView';
import CostEconomicsView from './CostEconomicsView';
import {
  initialTrendingActivities,
  initialCalendarSentimentData,
  initialLLMEngines,
  initialAIAgentPerformance,
  initialQueueMetrics,
  initialInterventionFactors,
} from '../data/mockData';

interface AnalyticsDashboardProps {
  posts: PostVariant[];
  heatmapData: HeatmapCell[];
  competitors: CompetitorProfile[];
  setCompetitors: (competitors: CompetitorProfile[]) => void;
  onOpenReportModal: () => void;
  onSendToRemixStudio: (content: string) => void;
  onDeployTrendingTheme?: (theme: string, hashtags: string[]) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function AnalyticsDashboard({
  posts,
  heatmapData,
  competitors,
  setCompetitors,
  onOpenReportModal,
  onSendToRemixStudio,
  onDeployTrendingTheme,
  showNotificationToast,
}: AnalyticsDashboardProps) {
  const [activeSubView, setActiveSubView] = useState<'content_performance' | 'ai_service_agents' | 'cost_economics'>('content_performance');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Phase 2 Real First-Party Attribution Telemetry (from GET /api/events)
  const [liveTelemetry, setLiveTelemetry] = useState<{
    totalClicks: number;
    totalConversions: number;
    totalEvents: number;
    totalLinks: number;
    totalDispatches: number;
    byVariant: Record<string, { clicks: number; conversions: number }>;
    recentEvents: Array<{
      id: string;
      eventName: string;
      campaignId: string;
      platform?: string;
      variantLabel?: string;
      source: string;
      timestamp: string;
    }>;
  } | null>(null);
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);
  const [isSyncingMemory, setIsSyncingMemory] = useState(false);
  const [activeMemoryCount, setActiveMemoryCount] = useState(0);

  const fetchLiveTelemetry = () => {
    setIsRefreshingTelemetry(true);
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setLiveTelemetry(d);
      })
      .catch(() => {})
      .finally(() => setIsRefreshingTelemetry(false));

    fetch('/api/memory')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m?.ok && typeof m.activeCount === 'number') setActiveMemoryCount(m.activeCount);
      })
      .catch(() => {});
  };

  const handleSyncSignalsToMemory = async () => {
    setIsSyncingMemory(true);
    try {
      const res = await fetch('/api/memory/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      setActiveMemoryCount(data.activeCount || 0);
      showNotificationToast(
        'Closed-Loop Memory Updated',
        `Distilled ${data.newlyLearned?.length || 0} proven pattern(s) from live telemetry & A/B winners (${data.activeCount} active rules injected into future campaigns).`
      );
    } catch {
      showNotificationToast('Memory Sync Error', 'Could not synthesize closed-loop patterns.');
    } finally {
      setIsSyncingMemory(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
  }, []);

  // Computed summary metrics
  const totalImpressions = posts.reduce((acc, p) => acc + (p.metrics?.impressions || 0), 68400);
  const totalClicks = posts.reduce((acc, p) => acc + (p.metrics?.clicks || 0), 3840);
  const avgCtr = (totalClicks / totalImpressions * 100).toFixed(2);
  const avgEngagementRate = '5.14';
  const estimatedSavings = '$16,400';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Platform Breakdown Data
  const platforms = [
    { name: 'LinkedIn', color: 'bg-blue-500', impressions: 34200, clicks: 1820, ctr: '5.32%', topHook: 'Hard Metric Teardown' },
    { name: 'X / Twitter', color: 'bg-slate-400', impressions: 22400, clicks: 1240, ctr: '5.53%', topHook: 'Tactical Visual Framework' },
    { name: 'Instagram', color: 'bg-pink-500', impressions: 16800, clicks: 680, ctr: '4.04%', topHook: 'Visual Carousel Teardown' },
    { name: 'TikTok', color: 'bg-red-500', impressions: 28400, clicks: 1420, ctr: '5.00%', topHook: 'POV Work Day' },
    { name: 'Threads', color: 'bg-purple-500', impressions: 9800, clicks: 420, ctr: '4.28%', topHook: 'Transparent Founder Reflection' },
  ];

  return (
    <div className="space-y-8">
      
      {/* LIVE FIRST-PARTY ATTRIBUTION & DELIVERY TELEMETRY (REAL SERVER DATA) */}
      <div data-tour="live-telemetry-card" className="bg-[#111116] border border-emerald-700/40 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Live First-Party Attribution Telemetry
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
              REAL SERVER DATA
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSyncingMemory}
              onClick={handleSyncSignalsToMemory}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md transition-all"
              title="Feed real live clicks, pixel conversions & A/B winners back into your Brand Brain"
            >
              <Cpu className={`w-3.5 h-3.5 ${isSyncingMemory ? 'animate-spin' : ''}`} />
              <span>
                {isSyncingMemory
                  ? 'Learning...'
                  : `Sync Signals → Brand Brain (${activeMemoryCount} Active)`}
              </span>
            </button>
            <button
              type="button"
              onClick={fetchLiveTelemetry}
              className="px-2.5 py-1 rounded-lg bg-[#18181F] hover:bg-[#22222E] border border-[#2A2A38] text-[11px] font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingTelemetry ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Live</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
              <Link2 className="w-3 h-3 text-cyan-400" /> Real UTM Clicks
            </div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {liveTelemetry?.totalClicks ?? 0}
            </div>
            <div className="text-[10px] text-slate-500">{liveTelemetry?.totalLinks ?? 0} active /r/ links</div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Real Pixel Conversions</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
              {liveTelemetry?.totalConversions ?? 0}
            </div>
            <div className="text-[10px] text-slate-500">{liveTelemetry?.totalEvents ?? 0} total live events</div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Real Dispatches</div>
            <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1">
              {liveTelemetry?.totalDispatches ?? 0}
            </div>
            <div className="text-[10px] text-slate-500">Logged via Delivery Bridge</div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Live A/B Attribution</div>
            <div className="text-xs font-bold text-white font-mono mt-1.5">
              A: {(liveTelemetry?.byVariant?.['Variant A']?.clicks || 0) + (liveTelemetry?.byVariant?.['Variant A']?.conversions || 0)} · B: {(liveTelemetry?.byVariant?.['Variant B']?.clicks || 0) + (liveTelemetry?.byVariant?.['Variant B']?.conversions || 0)}
            </div>
            <div className="text-[10px] text-slate-500">Clicks + conversions by hook</div>
          </div>
        </div>

        {liveTelemetry && liveTelemetry.recentEvents.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#1F1F2A]">
            <div className="text-[10px] font-mono uppercase text-slate-400">Live Event Stream</div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {liveTelemetry.recentEvents.slice(0, 5).map((ev) => (
                <div
                  key={ev.id}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0C] border border-[#1F1F2A] flex items-center justify-between gap-2 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 font-mono text-[10px] font-bold">
                      {ev.eventName}
                    </span>
                    <span className="text-slate-300 truncate">
                      {ev.platform?.toUpperCase() || 'DIRECT'} · {ev.variantLabel || 'Variant A'} ({ev.source})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Header & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" />
            Performance Analytics & Stakeholder Reporting
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time cross-channel metrics, engagement heatmaps, competitor intelligence, and executive insights.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-900/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Stakeholder Report</span>
        </button>
      </div>

      {/* SUB-VIEW NAVIGATION SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubView('content_performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubView === 'content_performance'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Content & Audience Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('ai_service_agents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubView === 'ai_service_agents'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Service Agent Telemetry & LLMs</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-[10px] text-emerald-400 font-mono font-bold">
              92.6% Auto
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('cost_economics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubView === 'cost_economics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cost & Unit Economics</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-[10px] text-emerald-300 font-mono font-bold">
              LIVE
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 px-2 font-mono hidden md:block">
          {activeSubView === 'ai_service_agents'
            ? 'Telemetry: ServiceOrchestrator Real-Time Sentry'
            : activeSubView === 'cost_economics'
            ? 'Ledger: Live Token Spend & Monthly Unit Economics'
            : 'Telemetry: Cross-Channel Social & Attribution'}
        </div>
      </div>

      {activeSubView === 'ai_service_agents' ? (
        <AIAgentPerformanceView
          initialEngines={initialLLMEngines}
          performanceMetrics={initialAIAgentPerformance}
          queueMetrics={initialQueueMetrics}
          interventionFactors={initialInterventionFactors}
          showNotificationToast={showNotificationToast}
        />
      ) : activeSubView === 'cost_economics' ? (
        <CostEconomicsView showNotificationToast={showNotificationToast} />
      ) : (
        <>
          {/* KPI METRIC STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Reach</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {totalImpressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+24.8% vs last month</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inbound Clicks</span>
            <MousePointerClick className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {totalClicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+38.2% qualified traffic</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg. CTR</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {avgCtr}%
          </div>
          <div className="text-[11px] text-slate-400">
            <span>Benchmark: 1.8%</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Engagement Rate</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {avgEngagementRate}%
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Top decile B2B</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Estimated Savings</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {estimatedSavings}
          </div>
          <div className="text-[11px] text-slate-400">
            <span>Agency equivalent cost</span>
          </div>
        </div>

      </div>

      {/* 7-DAY X 24-HOUR ENGAGEMENT HEATMAP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              7-Day × 24-Hour Audience Engagement Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies optimal peak conversion windows based on active customer avatar browsing patterns.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Low</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
              <span className="w-3 h-3 rounded bg-red-950/60" />
              <span className="w-3 h-3 rounded bg-red-800/80" />
              <span className="w-3 h-3 rounded bg-red-600" />
              <span className="w-3 h-3 rounded bg-red-400" />
            </div>
            <span>Peak</span>
          </div>
        </div>

        {/* Heatmap Matrix */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[680px] space-y-1">
            
            {/* Hour Labels */}
            <div className="grid grid-cols-25 gap-1 text-[10px] font-mono text-slate-500 pb-1">
              <span className="w-8" />
              {hours.map((h) => (
                <span key={h} className="text-center">
                  {h % 4 === 0 ? `${h}h` : ''}
                </span>
              ))}
            </div>

            {/* Day Rows */}
            {dayNames.map((dayName, dayIdx) => (
              <div key={dayName} className="grid grid-cols-25 gap-1 items-center">
                <span className="text-xs font-bold text-slate-400 w-8">{dayName}</span>
                {hours.map((hour) => {
                  const cell = heatmapData.find((c) => c.day === dayIdx && c.hour === hour);
                  const intensity = cell ? cell.intensity : 20;

                  // Color gradient by intensity
                  let bgClass = 'bg-slate-950 border-slate-850';
                  if (intensity > 85) bgClass = 'bg-red-500 shadow-sm shadow-red-500/20';
                  else if (intensity > 65) bgClass = 'bg-red-600/90';
                  else if (intensity > 45) bgClass = 'bg-red-800/70';
                  else if (intensity > 25) bgClass = 'bg-red-950/50';

                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell(cell || null)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-5 rounded cursor-pointer transition-all hover:scale-125 hover:z-10 border border-slate-850 ${bgClass}`}
                      title={`${dayName} at ${hour}:00 — Engagement Intensity: ${intensity}%`}
                    />
                  );
                })}
              </div>
            ))}

          </div>
        </div>

        {/* Hovered Cell Detail Strip */}
        <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80">
          <div>
            {hoveredCell ? (
              <span>
                Selected Slot: <strong className="text-white">{dayNames[hoveredCell.day]} at {hoveredCell.hour}:00</strong> · Activity Score: <strong className="text-red-400 font-mono">{hoveredCell.intensity}%</strong>
              </span>
            ) : (
              <span>Hover over any hour cell to inspect avatar audience concentration.</span>
            )}
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            Recommended Prime Slot: Tuesday 08:30 (94% Peak)
          </span>
        </div>

      </div>

      {/* NEW: VISUAL BRAND SENTIMENT CALENDAR HEATMAP & PEAK WINDOW ANALYZER */}
      <SentimentCalendarHeatmap
        sentimentData={initialCalendarSentimentData}
        onSendToRemixStudio={onSendToRemixStudio}
        showNotificationToast={showNotificationToast}
      />

      {/* TRENDING HASHTAGS & SOUNDS MONITOR: SPIKES & UPCOMING WEEK THEMES */}
      <TrendingSocialMonitor
        initialActivities={initialTrendingActivities}
        onDeployThemeToStudio={(theme, hashtags) => {
          if (onDeployTrendingTheme) {
            onDeployTrendingTheme(theme, hashtags);
          } else {
            onSendToRemixStudio(`Campaign Theme: ${theme}\nHashtags: ${hashtags.join(' ')}`);
          }
        }}
        showNotificationToast={showNotificationToast}
      />

      {/* NEW: COMPETITOR WATCH & MARKET INTELLIGENCE COMPONENT */}
      <CompetitorWatch
        competitors={competitors}
        setCompetitors={setCompetitors}
        onSendToRemixStudio={onSendToRemixStudio}
        showNotificationToast={showNotificationToast}
      />

      {/* CROSS-PLATFORM COMPARISON TABLE & STRATEGIC RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Platform Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Cross-Platform Channel Performance</h2>
          <div className="space-y-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">{p.name}</span>
                    <span className="text-[11px] text-slate-400">Top Hook: {p.topHook}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Impressions</span>
                    <span className="text-slate-200">{p.impressions.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">CTR</span>
                    <span className="text-emerald-400 font-bold">{p.ctr}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Next-Step Recommendations (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            AI Content Optimization Insights
          </h2>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="text-red-500">01.</span>
                Double Down on LinkedIn Metric Hooks
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Posts leading with teardown figures drove a 5.67% CTR, beating opinion posts by 57.5%.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="text-red-500">02.</span>
                Out-Cadence Tracked Competitors
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ADNETIKS holds a +2.30% engagement rate lead over Contenders Growth Labs by publishing psychological avatar hooks instead of feature release notes.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="text-red-500">03.</span>
                Incorporate Avatar Receptivity Dials
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Campaigns targeted to Tyler Vance scored 94% receptivity; keep technical energy dials set between 68%–75%.
              </p>
            </div>
          </div>
        </div>

      </div>
        </>
      )}

    </div>
  );
}
