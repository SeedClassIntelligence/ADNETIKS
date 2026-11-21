/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Interactive Section Guided Tour & Spotlight Tooltip Engine
 * Highlights real UI elements via `[data-tour="..."]` anchors and guides users
 * step-by-step through each pillar of the ADNETIKS closed-loop workflow.
 */

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector?: string;
  title: string;
  body: string;
  tip?: string;
  tab: string;
}

export const SECTION_TOURS: Record<string, { label: string; steps: TourStep[] }> = {
  home: {
    label: 'Overview Walkthrough',
    steps: [
      {
        id: 'home-flow',
        targetSelector: '[data-tour="workflow-strip"]',
        title: 'Your 4-Stage Campaign Operating Loop',
        body: 'ADNETIKS runs in order: 01 Define your Brand & Audience → 02 Build Campaigns (Ads, Posts, Videos) → 03 Schedule & A/B Test → 04 Track Real Analytics & Learn.',
        tip: 'Click any of the 4 cards to jump straight into that pillar.',
        tab: 'home',
      },
      {
        id: 'home-projects',
        targetSelector: '[data-tour="saved-campaigns"]',
        title: 'Multi-Project Campaign Workspace',
        body: 'Every campaign you create is saved permanently to your server workspace (.adnetiks-data/workspace.json). Click any project card to reopen it in Campaign Studio.',
        tip: 'Use "+ New Campaign" in the top bar anytime to spin up a fresh launch.',
        tab: 'home',
      },
      {
        id: 'home-demographics',
        targetSelector: '[data-tour="audience-demographics"]',
        title: 'Target Demographics & Brand Brain',
        body: 'Click any target demographic persona to launch a campaign calibrated specifically to their age range, region, platforms, and buying triggers.',
        tip: 'Click "Recalibrate Brand" anytime to swap industries or refresh your audience.',
        tab: 'home',
      },
    ],
  },
  brand_avatar: {
    label: '01 · Brand & Audience Tour',
    steps: [
      {
        id: 'brand-tabs',
        targetSelector: '[data-tour="brand-section-tabs"]',
        title: 'Calibrate Who You Are & Who You Serve',
        body: 'Start in Quick Brand Setup to replace default templates with your real brand, voice, and 3 AI-synthesized audience demographics in under 30 seconds.',
        tip: 'Every campaign, video script, and ad preview automatically inherits this Brand Brain.',
        tab: 'brand_avatar',
      },
      {
        id: 'brand-memory',
        targetSelector: '[data-tour="brand-memory-tab"]',
        title: 'Closed-Loop Learned Memory',
        body: 'When A/B tests win or live UTM/pixel conversions come in, ADNETIKS distills those proven patterns here and injects them automatically into future campaigns.',
        tip: 'You can also teach the Brand Brain manual rules that always apply to your voice.',
        tab: 'brand_avatar',
      },
    ],
  },
  studio: {
    label: '02 · Campaign Studio Tour',
    steps: [
      {
        id: 'studio-projects',
        targetSelector: '[data-tour="campaign-projects-bar"]',
        title: 'Switch Projects & Load High-Converting Templates',
        body: 'Switch between saved campaign projects here, rename the active project inline, or open the 12-blueprint High-Converting Template Library to populate an entire campaign in 1 click.',
        tip: 'Click "Templates (12)" in the header to instantly populate copy, ads, video beats & carousels.',
        tab: 'studio',
      },
      {
        id: 'studio-ai-dock',
        targetSelector: '[data-tour="campaign-ai-dock"]',
        title: 'Agnostic AI Engine & Brand Memory',
        body: 'Hot-swap your backend AI model anytime (Gemini, Claude, OpenAI, or local Ollama/OpenRouter) without restarting. The purple pill shows how many proven Brand Memory rules are active.',
        tip: 'Click "Edit Hero Video" to open the 9:16 AI Video Director, Webcam/Phone Recorder, or Clip Uploader.',
        tab: 'studio',
      },
      {
        id: 'studio-stepper',
        targetSelector: '[data-tour="campaign-left-stepper"]',
        title: 'Focused 3-Step Builder (Offer → Audience → Launch)',
        body: 'Step 1 ingests a live URL (real page scraper), dropped flyer/screenshot (multimodal vision), or brief. Step 2 calibrates target demographics & geo. Step 3 mints real /r/ UTM tracking links and schedules.',
        tip: 'Pasting a real URL and clicking "Fetch Live" scrapes the actual page copy & artwork.',
        tab: 'studio',
      },
      {
        id: 'studio-preview',
        targetSelector: '[data-tour="campaign-live-preview"]',
        title: 'Live Upfront Creative Preview & Format Studio',
        body: 'Watch your Social Post, Sponsored Ad, 9:16 AI/Recorded Video Reel, or 4-Slide Carousel update live right beside your controls — and render real downloadable 720×1280 .webm videos.',
        tip: 'Click "Plug This Video Into Active Campaign" inside Video Reel to attach your video to scheduled posts.',
        tab: 'studio',
      },
    ],
  },
  distribution: {
    label: '03 · Distribution Tour',
    steps: [
      {
        id: 'dist-tabs',
        targetSelector: '[data-tour="distribution-tabs"]',
        title: 'Calendar Queue + A/B Hook Lab Unified',
        body: 'Switch seamlessly between your scheduled multi-platform delivery queue and your live Variant A vs. Variant B split-test experiments.',
        tip: 'Declaring a winner in A/B Hook Lab automatically saves that winning hook into Brand Memory.',
        tab: 'distribution',
      },
      {
        id: 'dist-bridge',
        targetSelector: '[data-tour="delivery-bridge-controls"]',
        title: 'Real Publishing Bridge & 30s Background Cron',
        body: 'Configure Postiz API or signed n8n/Zapier webhooks to publish live, toggle the 30-second server-side background scheduler, or test in Dry-Run Sandbox with minted /r/ UTM links.',
        tip: 'Every dispatch is logged permanently in the Real Dispatch Audit Log below.',
        tab: 'distribution',
      },
    ],
  },
  signals: {
    label: '04 · Analytics & Inbox Tour',
    steps: [
      {
        id: 'sig-telemetry',
        targetSelector: '[data-tour="live-telemetry-card"]',
        title: 'Live First-Party Attribution Telemetry',
        body: 'Tracks real clicks on your minted /r/ short links, real pixel conversions from /api/pixel.js, real dispatches, and live Variant A vs. B performance.',
        tip: 'Click "Sync Signals → Brand Brain" to distill live winners back into your Brand Memory.',
        tab: 'signals',
      },
      {
        id: 'sig-tabs',
        targetSelector: '[data-tour="signals-tabs"]',
        title: 'Analytics & Trends + Fan/DM Inbox',
        body: 'Inspect the 7-day × 24-hour engagement heatmap, deploy rising social trends into Campaigns, or switch to Fan & DM Inbox to resolve mentions in your brand voice.',
        tip: 'Use "Export Stakeholder Report" anytime for executive summaries.',
        tab: 'signals',
      },
    ],
  },
  resources: {
    label: 'Resources & Template Library Tour',
    steps: [
      {
        id: 'res-main',
        targetSelector: '[data-tour="resources-tabs"]',
        title: 'Templates, Playbooks, Tours & Brand Assets',
        body: 'Browse 12 high-converting campaign templates, launch any section tour, copy proven 3-second hook formulas, or download your official ADNETIKS SVG/PNG/ICO brand kit.',
        tip: 'Every template populates Campaign Builder in 1 click.',
        tab: 'resources',
      },
    ],
  },
  integrations: {
    label: 'AI Engines & Connectors Tour',
    steps: [
      {
        id: 'int-main',
        title: 'BE-Agnostic Open Infrastructure',
        body: 'Plug in Postiz for multi-platform publishing, PostHog or Umami for analytics, n8n/Activepieces for automation, and Ollama, vLLM, Gemini, Claude, or OpenAI for AI synthesis.',
        tip: 'Zero vendor lock-in — swap any model or publishing gateway at runtime.',
        tab: 'integrations',
      },
    ],
  },
};

export function normalizeTourSection(activeTab: string): string {
  if (activeTab === 'scheduler' || activeTab === 'split_lab') return 'distribution';
  if (activeTab === 'analytics' || activeTab === 'service_agents') return 'signals';
  if (activeTab === 'video_studio') return 'studio';
  return SECTION_TOURS[activeTab] ? activeTab : 'home';
}

interface GuidedTourOverlayProps {
  isOpen: boolean;
  sectionKey: string;
  onClose: () => void;
  onNavigateSection: (tab: string) => void;
}

export default function GuidedTourOverlay({
  isOpen,
  sectionKey,
  onClose,
  onNavigateSection,
}: GuidedTourOverlayProps) {
  const tour = SECTION_TOURS[sectionKey] || SECTION_TOURS.home;
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setStepIndex(0);
  }, [sectionKey, isOpen]);

  const currentStep = tour.steps[stepIndex] || tour.steps[0];

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setHighlightRect(null);
      return;
    }

    const updateSpotlight = () => {
      if (!currentStep.targetSelector) {
        setHighlightRect(null);
        return;
      }
      const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setHighlightRect(rect);
        }, 220);
      } else {
        setHighlightRect(null);
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [isOpen, currentStep]);

  if (!isOpen || !currentStep) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= tour.steps.length - 1;

  // Position tooltip neatly below or above the spotlighted element (fallback bottom-right)
  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 70,
  };
  if (highlightRect && typeof window !== 'undefined') {
    const spaceBelow = window.innerHeight - highlightRect.bottom;
    const cardWidth = 370;
    const left = Math.min(
      Math.max(16, highlightRect.left),
      Math.max(16, window.innerWidth - cardWidth - 20)
    );
    if (spaceBelow > 260) {
      cardStyle = {
        position: 'fixed',
        top: `${Math.max(16, Math.min(window.innerHeight - 360, highlightRect.bottom + 14))}px`,
        left: `${left}px`,
        zIndex: 70,
      };
    } else if (highlightRect.top > 260) {
      cardStyle = {
        position: 'fixed',
        bottom: `${Math.max(16, Math.min(window.innerHeight - 360, window.innerHeight - highlightRect.top + 14))}px`,
        left: `${left}px`,
        zIndex: 70,
      };
    }
  }

  const allSectionLinks = [
    { key: 'home', label: 'Overview' },
    { key: 'brand_avatar', label: '01 Brand' },
    { key: 'studio', label: '02 Campaigns' },
    { key: 'distribution', label: '03 Delivery' },
    { key: 'signals', label: '04 Analytics' },
    { key: 'resources', label: 'Resources' },
  ];

  return (
    <div className="fixed inset-0 z-60 pointer-events-none">
      {/* Subtle Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px] pointer-events-auto transition-opacity"
      />

      {/* Glowing Spotlight Ring Around Target Element */}
      {highlightRect && (
        <div
          style={{
            position: 'fixed',
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            zIndex: 65,
          }}
          className="rounded-2xl border-2 border-red-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.45),0_0_28px_rgba(232,25,44,0.65)] pointer-events-none transition-all duration-300"
        />
      )}

      {/* Floating Tooltip Popover Card */}
      <div
        style={cardStyle}
        className="w-[350px] sm:w-[375px] max-w-[calc(100vw-32px)] bg-[#111116] border border-red-500/60 rounded-2xl shadow-2xl p-4 space-y-3 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#1F1F2A] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
                {tour.label}
              </div>
              <div className="text-[10px] text-[#8B8BA8] font-mono">
                Step {stepIndex + 1} of {tour.steps.length}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#8B8BA8] hover:text-white hover:bg-[#18181F]"
            aria-label="Close guided tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-extrabold text-white leading-snug">{currentStep.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{currentStep.body}</p>
          {currentStep.tip && (
            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-[11px] text-cyan-200 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{currentStep.tip}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1F1F2A]">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="px-2.5 py-1.5 rounded-lg bg-[#18181F] hover:bg-[#22222E] disabled:opacity-35 text-xs font-semibold text-slate-300 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1">
            {tour.steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stepIndex ? 'w-5 bg-red-500' : 'w-1.5 bg-[#2A2A38]'
                }`}
              />
            ))}
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(tour.steps.length - 1, i + 1))}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Got It</span>
            </button>
          )}
        </div>

        {/* Quick Jump to Other Section Tours */}
        <div className="pt-2 border-t border-[#1F1F2A]/70 space-y-1.5">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#52526B]">
            Tour Another Section:
          </div>
          <div className="flex flex-wrap gap-1">
            {allSectionLinks.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => onNavigateSection(sec.key)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors ${
                  sectionKey === sec.key
                    ? 'bg-red-950/60 border-red-600/70 text-red-300'
                    : 'bg-[#0A0A0C] border-[#1F1F2A] text-[#8B8BA8] hover:text-white'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight inline hover tooltip badge for explaining controls anywhere in the UI.
 */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group/tip align-middle">
      <HelpCircle className="w-3.5 h-3.5 text-[#52526B] hover:text-cyan-400 cursor-help transition-colors" />
      <span className="pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-xl bg-[#111116] border border-[#2A2A38] text-[11px] text-slate-200 font-normal leading-snug shadow-2xl z-50 text-left">
        {text}
      </span>
    </span>
  );
}
