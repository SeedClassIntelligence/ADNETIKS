/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Live AI Cost, Token Usage & Unit Economics Calculator
 * Combines real server-tracked usage from `.adnetiks-data/usage.json` with an interactive
 * monthly TCO & SaaS margin calculator across LLM tiers, hosting stacks, and social APIs.
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Cpu,
  Server,
  RefreshCw,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Camera,
  Sparkles,
} from 'lucide-react';

interface UsageEntry {
  id: string;
  operation: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  isLocalFree: boolean;
  meta?: string;
  timestamp: string;
}

interface UsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  freeLocalOps: number;
  brandScansCount: number;
  imagesGeneratedCount: number;
  recentEntries: UsageEntry[];
}

interface CostEconomicsViewProps {
  showNotificationToast: (title: string, message: string) => void;
}

export default function CostEconomicsView({ showNotificationToast }: CostEconomicsViewProps) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Interactive Monthly Unit-Economics Simulator State
  const [activeBrands, setActiveBrands] = useState(10);
  const [campaignsPerBrand, setCampaignsPerBrand] = useState(20);
  const [imagesPerBrand, setImagesPerBrand] = useState(10);
  const [genVideosPerBrand, setGenVideosPerBrand] = useState(0);
  const [llmTier, setLlmTier] = useState<'local' | 'flash' | 'pro'>('flash');
  const [infraTier, setInfraTier] = useState<'local' | 'vps' | 'cloud'>('vps');
  const [xApiTier, setXApiTier] = useState<'free' | 'basic'>('free');
  const [targetSeatPrice, setTargetSeatPrice] = useState(49);

  const fetchUsage = () => {
    setIsLoading(true);
    fetch('/api/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setUsage(d);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleResetLedger = async () => {
    const res = await fetch('/api/usage', { method: 'DELETE' });
    if (res.ok) {
      const d = await res.json();
      setUsage(d);
      showNotificationToast('Usage Ledger Reset', 'Started a fresh AI cost & token tracking cycle.');
    }
  };

  // Real-time Unit Economics Calculation
  const costPerCampaign = llmTier === 'local' ? 0 : llmTier === 'flash' ? 0.004 : 0.06;
  const infraMonthly = infraTier === 'local' ? 0 : infraTier === 'vps' ? 25 : 90;
  const xMonthly = xApiTier === 'free' ? 0 : 200;

  const variablePerBrand =
    campaignsPerBrand * costPerCampaign +
    imagesPerBrand * 0.03 +
    genVideosPerBrand * 0.6;
  const totalVariableMonthly = variablePerBrand * activeBrands;
  const totalFixedMonthly = infraMonthly + xMonthly;
  const totalMonthlyCogs = totalFixedMonthly + totalVariableMonthly;
  const costPerBrandMonthly = activeBrands > 0 ? totalMonthlyCogs / activeBrands : 0;
  const monthlyRevenue = activeBrands * targetSeatPrice;
  const grossMarginPct =
    monthlyRevenue > 0 ? Math.max(-999, ((monthlyRevenue - totalMonthlyCogs) / monthlyRevenue) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* LIVE SERVER USAGE LEDGER KPIs */}
      <div className="bg-[#111116] border border-[#1F1F2A] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Live Server Cost &amp; Token Usage Ledger
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/60">
              LIVE DISK LEDGER
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsage}
              className="px-2.5 py-1 rounded-lg bg-[#18181F] hover:bg-[#22222E] border border-[#2A2A38] text-[11px] font-semibold text-slate-300 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleResetLedger}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-700/60 text-[11px] font-semibold text-slate-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Reset Cycle</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono uppercase text-slate-400">Real Spend This Cycle</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              ${(usage?.totalCostUsd ?? 0).toFixed(4)}
            </div>
            <div className="text-[10px] text-slate-500">{usage?.totalCalls ?? 0} tracked server ops</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono uppercase text-slate-400">Tokens Processed</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {(usage?.totalTokens ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">
              {(usage?.totalInputTokens ?? 0).toLocaleString()} in · {(usage?.totalOutputTokens ?? 0).toLocaleString()} out
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" /> Free Local CDP Scans
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
              {usage?.brandScansCount ?? 0}
            </div>
            <div className="text-[10px] text-slate-500">$0.00 API cost (local Chrome)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
            <div className="text-[10px] font-mono uppercase text-slate-400">Zero-Cost Operations</div>
            <div className="text-2xl font-extrabold text-purple-400 font-mono mt-1">
              {usage?.freeLocalOps ?? 0}
            </div>
            <div className="text-[10px] text-slate-500">Local scans, renders &amp; heuristics</div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE MONTHLY UNIT-ECONOMICS & MARGIN CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 bg-[#111116] border border-[#1F1F2A] rounded-2xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Interactive Monthly Cost &amp; Margin Calculator
            </h3>
            <p className="text-xs text-[#8B8BA8] mt-0.5">
              Model your exact monthly infrastructure, AI token, media, and social API costs across any scale.
            </p>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Active Brands / Workspaces</span>
                <span className="font-mono font-bold text-white">{activeBrands}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={activeBrands}
                onChange={(e) => setActiveBrands(Number(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Campaigns / Brand / Mo</span>
                <span className="font-mono font-bold text-white">{campaignsPerBrand}</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={campaignsPerBrand}
                onChange={(e) => setCampaignsPerBrand(Number(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Custom AI Images / Brand / Mo</span>
                <span className="font-mono font-bold text-cyan-300">{imagesPerBrand} ($0.03 ea)</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={imagesPerBrand}
                onChange={(e) => setImagesPerBrand(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Paid Gen-Video Clips / Brand</span>
                <span className="font-mono font-bold text-amber-300">{genVideosPerBrand} ($0.60 ea)</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={genVideosPerBrand}
                onChange={(e) => setGenVideosPerBrand(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Stack Toggles */}
          <div className="space-y-3 pt-2 border-t border-[#1F1F2A]">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8BA8] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Model Tier
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'local' as const, label: 'Ollama Local', sub: '$0.00 / camp' },
                  { id: 'flash' as const, label: 'Flash / 4o-mini', sub: '$0.004 / camp' },
                  { id: 'pro' as const, label: 'Sonnet / GPT-4o', sub: '$0.06 / camp' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLlmTier(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      llmTier === opt.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-[#0A0A0C] border-[#1F1F2A] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[10px] font-mono text-cyan-300">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8BA8] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-400" /> Hosting Stack
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {[
                    { id: 'local' as const, label: 'Local ($0)' },
                    { id: 'vps' as const, label: 'VPS ($25)' },
                    { id: 'cloud' as const, label: 'Cloud ($90)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setInfraTier(opt.id)}
                      className={`py-2 px-2 rounded-lg border font-bold transition-all ${
                        infraTier === opt.id
                          ? 'bg-purple-950/40 border-purple-500 text-white'
                          : 'bg-[#0A0A0C] border-[#1F1F2A] text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8BA8]">
                  X (Twitter) API Tier
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setXApiTier('free')}
                    className={`py-2 px-2 rounded-lg border font-bold transition-all ${
                      xApiTier === 'free'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-[#0A0A0C] border-[#1F1F2A] text-slate-400 hover:text-white'
                    }`}
                  >
                    Write-Only ($0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setXApiTier('basic')}
                    className={`py-2 px-2 rounded-lg border font-bold transition-all ${
                      xApiTier === 'basic'
                        ? 'bg-amber-950/40 border-amber-500 text-white'
                        : 'bg-[#0A0A0C] border-[#1F1F2A] text-slate-400 hover:text-white'
                    }`}
                  >
                    Basic Read ($200)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Unit Economics Output (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#141016] via-[#111116] to-[#0D0D11] border border-emerald-700/40 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Projected Monthly Economics
              </span>
              <span className="text-[10px] font-mono text-slate-400">IG · TikTok · LI · YT = $0 API</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Total Monthly COGS</div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  ${totalMonthlyCogs.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  ${totalFixedMonthly} fixed + ${totalVariableMonthly.toFixed(2)} AI
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-emerald-700/50">
                <div className="text-[10px] font-mono text-emerald-300 uppercase">Cost / Brand / Mo</div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                  ${costPerBrandMonthly.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">All-in per workspace</div>
              </div>
            </div>

            {/* Pricing / Margin Simulator */}
            <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">If Priced Per Seat / Brand:</span>
                <div className="flex items-center gap-1">
                  {[29, 49, 99, 199].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTargetSeatPrice(p)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                        targetSeatPrice === p
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-[#111116] border-[#2A2A38] text-slate-400'
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1F1F2A]">
                <span className="text-slate-400">
                  Est. MRR ({activeBrands} × ${targetSeatPrice}): <strong className="text-white">${monthlyRevenue.toLocaleString()}</strong>
                </span>
                <span
                  className={`font-mono font-extrabold ${
                    grossMarginPct >= 75 ? 'text-emerald-400' : grossMarginPct >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {grossMarginPct.toFixed(1)}% Margin
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-[11px] text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your built-in Chrome CDP Brand Scanner &amp; 720×1280 9:16 Video Compositor cost <strong>$0.00 in external API fees</strong>, protecting margins even at high volume.
            </span>
          </div>
        </div>
      </div>

      {/* RECENT REAL API & OPERATION COST LOG */}
      <div className="bg-[#111116] border border-[#1F1F2A] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Recent Server Operations &amp; Token Spend ({usage?.recentEntries?.length ?? 0})
          </span>
          <span className="text-[10px] font-mono text-slate-500">Persisted in .adnetiks-data/usage.json</span>
        </div>

        {!usage || usage.recentEntries.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#0A0A0C] border border-dashed border-[#2A2A38] text-center text-xs text-slate-400">
            Run a Brand Scan or synthesize a campaign in <strong>02. Campaigns</strong> to see live token counts &amp; exact USD spend logged here.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {usage.recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] flex flex-wrap items-center justify-between gap-2 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] font-bold text-cyan-300 uppercase">
                    {entry.operation}
                  </span>
                  <span className="text-white font-semibold truncate">
                    {entry.provider} · {entry.model}
                  </span>
                  {entry.meta && <span className="text-slate-400 truncate max-w-xs">({entry.meta})</span>}
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                  <span className="text-slate-400">
                    {(entry.inputTokens + entry.outputTokens).toLocaleString()} tok
                  </span>
                  <span className={entry.estimatedCostUsd === 0 ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                    ${entry.estimatedCostUsd.toFixed(5)}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
