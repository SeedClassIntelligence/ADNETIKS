/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS 1-Click Website-to-Campaign Onboarding Modal
 * Paste any website URL -> automatically scans all key pages, extracts colors/fonts/screenshots,
 * builds Brand Profile, discovers Target Customer Avatars, and generates a ready-to-launch campaign.
 */

import { useState, useEffect } from 'react';
import { BrandProfile, Campaign, CustomerAvatar, PostVariant } from '../types';
import {
  Zap,
  Globe,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Users,
  Palette,
  Layers,
  AlertCircle,
} from 'lucide-react';

export interface OneClickOnboardResultPayload {
  brandProfile: BrandProfile;
  avatars: CustomerAvatar[];
  campaign: Campaign;
  generatedPosts: PostVariant[];
  scannedPagesCount: number;
  scan?: any;
}

interface OneClickOnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  onApplyOnboardResult: (
    result: OneClickOnboardResultPayload,
    destination: 'studio' | 'brand_avatar' | 'scheduler'
  ) => void;
  showNotificationToast: (title: string, message: string) => void;
}

const PROGRESS_STEPS = [
  {
    title: 'Scanning your whole website',
    desc: 'Opening homepage, pricing, compare & about pages to capture screenshots, colors & fonts',
  },
  {
    title: 'Building your Brand Voice',
    desc: 'Detecting your industry, core value pillars, and brand personality automatically',
  },
  {
    title: 'Finding your ideal customers',
    desc: 'Mapping high-converting buyer personas directly from your real website copy',
  },
  {
    title: 'Drafting your first campaign',
    desc: 'Creating ready-to-publish LinkedIn, X, Instagram & TikTok posts with A/B hooks',
  },
];

export default function OneClickOnboardModal({
  isOpen,
  onClose,
  initialUrl = '',
  onApplyOnboardResult,
  showNotificationToast,
}: OneClickOnboardModalProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    elapsedMs: number;
    scan: any;
    brandProfile: BrandProfile;
    avatars: CustomerAvatar[];
    campaign: Campaign;
    generatedPosts: PostVariant[];
    receptivity?: { score: number; level: string; rationale: string };
  } | null>(null);

  useEffect(() => {
    if (initialUrl) setUrlInput(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (!isRunning) return;
    setActiveStep(0);
    const timers = [
      setTimeout(() => setActiveStep(1), 4500),
      setTimeout(() => setActiveStep(2), 9500),
      setTimeout(() => setActiveStep(3), 13500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isRunning]);

  if (!isOpen) return null;

  const handleRunOneClick = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl ?? urlInput).trim();
    if (!targetUrl) {
      setErrorMsg('Please paste a website URL first (for example https://openpolici.com).');
      return;
    }
    setErrorMsg(null);
    setResult(null);
    setIsRunning(true);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not complete 1-click setup for that URL.');
      }
      setActiveStep(4);
      setResult(data);
      showNotificationToast(
        '1-Click Brand & Campaign Ready',
        `Scanned ${data.scan?.crawledPages?.length || 1} page(s) for ${data.brandProfile?.name} and drafted ${data.generatedPosts?.length || 0} posts.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || '1-Click setup failed. Double-check the URL and try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyAndGo = (destination: 'studio' | 'brand_avatar' | 'scheduler') => {
    if (!result) return;
    localStorage.setItem('adnetiks_brand_configured', 'true');
    onApplyOnboardResult(
      {
        brandProfile: result.brandProfile,
        avatars: result.avatars,
        campaign: result.campaign,
        generatedPosts: result.generatedPosts,
        scannedPagesCount: result.scan?.crawledPages?.length || 1,
        scan: result.scan,
      },
      destination
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0E0E13] border border-[#2A2A38] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Accent Glow */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-cyan-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#1F1F2A]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/70 border border-red-800/60 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              1-Click Instant Setup
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Paste Your Website — Launch Everything in One Click
            </h2>
            <p className="text-xs text-[#8B8BA8]">
              No forms, no API keys, no manual setup. ADNETIKS reads your site, grabs your real colors &amp; screenshots, maps your customers, and writes your first campaign automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8B8BA8] hover:text-white hover:bg-[#1B1B24] transition-colors"
            aria-label="Close 1-click setup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Input Bar */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Your Website URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRunning) handleRunOneClick();
                }}
                disabled={isRunning}
                placeholder="https://yourcompany.com"
                className="flex-1 px-4 py-3 rounded-xl bg-[#09090D] border border-[#2A2A38] focus:border-red-500 text-sm text-white placeholder-[#52526B] focus:outline-none font-mono"
              />
              <button
                type="button"
                disabled={isRunning}
                onClick={() => handleRunOneClick()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all shrink-0 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Building...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>1-Click Launch</span>
                  </>
                )}
              </button>
            </div>

            {!isRunning && !result && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8B8BA8]">
                <span>Try instant demo:</span>
                {['https://openpolici.com', 'https://stripe.com', 'https://linear.app'].map((demoUrl) => (
                  <button
                    key={demoUrl}
                    type="button"
                    onClick={() => {
                      setUrlInput(demoUrl);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#16161F] hover:bg-[#222230] border border-[#2A2A38] text-cyan-300 font-mono text-[10px] transition-colors"
                  >
                    {demoUrl.replace(/^https?:\/\//, '')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live 4-Step Progress Indicator */}
          {isRunning && (
            <div className="p-4 rounded-2xl bg-[#12121A] border border-[#252534] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  Building your brand &amp; first campaign automatically...
                </span>
                <span className="text-[11px] font-mono text-cyan-300">~15–25s</span>
              </div>
              <div className="space-y-2">
                {PROGRESS_STEPS.map((st, idx) => {
                  const done = idx < activeStep;
                  const current = idx === activeStep;
                  return (
                    <div
                      key={st.title}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                        done
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : current
                          ? 'bg-cyan-950/25 border-cyan-700/50'
                          : 'bg-[#0B0B10] border-[#1D1D28] opacity-55'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : current ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#3A3A4E] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">{st.title}</div>
                        <div className="text-[11px] text-[#8B8BA8]">{st.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ready Summary Result */}
          {result && !isRunning && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-700/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-sm font-extrabold text-white">
                        {result.brandProfile.name} is Ready to Launch!
                      </div>
                      <div className="text-[11px] text-emerald-300">
                        Built automatically in {(result.elapsedMs / 1000).toFixed(1)}s · Zero manual typing required
                      </div>
                    </div>
                  </div>
                  {result.receptivity?.score && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-200 text-[11px] font-mono font-bold">
                      {result.receptivity.score}% Audience Fit
                    </span>
                  )}
                </div>

                {/* Screenshot + Brand DNA Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                  {result.scan?.desktopScreenshotUrl && (
                    <div className="sm:col-span-5 rounded-xl overflow-hidden border border-[#2A2A38] bg-black aspect-video">
                      <img
                        src={result.scan.desktopScreenshotUrl}
                        alt={result.brandProfile.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-7 space-y-2">
                    <div className="text-xs text-slate-300 line-clamp-2">{result.brandProfile.tagline}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#161620] border border-[#2A2A38] text-[10px] font-bold text-slate-200">
                        {result.brandProfile.targetIndustry}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#161620] border border-[#2A2A38] text-[10px] font-bold text-cyan-300">
                        {result.scan?.crawledPages?.length || 1} site pages scanned
                      </span>
                    </div>
                    {result.brandProfile.brandColors?.swatches && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <Palette className="w-3.5 h-3.5 text-[#8B8BA8]" />
                        {result.brandProfile.brandColors.swatches.slice(0, 5).map((hex) => (
                          <span
                            key={hex}
                            title={hex}
                            className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                        <span className="text-[10px] font-mono text-[#8B8BA8] ml-1">
                          {result.brandProfile.brandFonts?.[0] || 'Brand Theme'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Stat Pills */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#0A0A0E] border border-[#222230]">
                    <div className="text-[10px] text-[#8B8BA8] flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400" /> Customers Mapped
                    </div>
                    <div className="text-base font-extrabold text-white font-mono mt-0.5">
                      {result.avatars.length} Persona{result.avatars.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0A0A0E] border border-[#222230]">
                    <div className="text-[10px] text-[#8B8BA8] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-red-400" /> Posts Drafted
                    </div>
                    <div className="text-base font-extrabold text-white font-mono mt-0.5">
                      {result.generatedPosts.length} Ready
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0A0A0E] border border-[#222230]">
                    <div className="text-[10px] text-[#8B8BA8]">Setup Cost</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">$0.00</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyAndGo('brand_avatar')}
                  className="px-4 py-2.5 rounded-xl bg-[#181822] hover:bg-[#222230] border border-[#2E2E40] text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  Review Brand &amp; Customers
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAndGo('scheduler')}
                  className="px-4 py-2.5 rounded-xl bg-[#181822] hover:bg-[#222230] border border-cyan-800/60 text-xs font-bold text-cyan-300 transition-colors cursor-pointer"
                >
                  View {result.generatedPosts.length} Queued Posts
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAndGo('studio')}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
                >
                  <span>Open My New Campaign</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
