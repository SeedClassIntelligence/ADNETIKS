/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Resources, High-Converting Template Library, Playbooks & Brand Kit
 */

import { useState } from 'react';
import {
  CAMPAIGN_TEMPLATES,
  CampaignTemplate,
  TemplateCategory,
} from '../data/campaignTemplates';
import { AUTOMATION_TEMPLATES } from '../data/automationTemplates';
import { BrandProfile } from '../types';
import WorkflowAutomationsView from './WorkflowAutomationsView';
import {
  BookOpen,
  Sparkles,
  Search,
  Compass,
  Download,
  Copy,
  ArrowRight,
  Video,
  FileText,
  Crosshair,
  LayoutList,
  CheckCircle2,
  Zap,
  Image as ImageIcon,
  Code2,
  Workflow,
} from 'lucide-react';

interface ResourcesPageProps {
  brandProfile: BrandProfile;
  onUseTemplate: (template: CampaignTemplate) => void;
  onStartSectionTour: (sectionKey: string) => void;
  showNotificationToast: (title: string, message: string) => void;
}

const HOOK_PLAYBOOKS = [
  {
    name: 'The 2-Second Pattern Interrupt (Reels / TikTok)',
    category: 'Short Video',
    formula: '"Stop [common wasted effort]. Here is what actually drove [specific outcome] in [timeframe]."',
    example: '"Stop posting generic release flyers nobody clicks. Here is the 15-second studio hook that tripled our pre-saves in 48 hours."',
  },
  {
    name: 'Hard Metric Teardown (LinkedIn / X)',
    category: 'High-CTR Copy',
    formula: '"We tested [N] [campaigns/drops] over [timeframe]. The winner beat the control by [X]%. Here are the 3 exact levers:"',
    example: '"We tested 14 drop hooks over 30 days. Raw studio takes beat polished promo graphics by 3.4x CTR. Here is why:"',
  },
  {
    name: 'Anti-Fluff Contrarian Hook (Sponsored Ads)',
    category: 'Paid / Sponsored',
    formula: '"Most [target audience] think they need [expensive myth]. They actually need [simple core truth]."',
    example: '"Most artists think they need a $10K ad agency. They actually need 1 tight 9:16 hook aimed at their real city fans."',
  },
  {
    name: 'Scarcity + Proof Drop (Merch / Presale)',
    category: 'E-Commerce / Drops',
    formula: '"[Exact material/spec]. Only [N] numbered units. Closes [exact deadline] — never restocked."',
    example: '"480gsm heavyweight cotton. 250 numbered pieces. Early fan window closes Sunday 11:59 PM sharp."',
  },
];

const BRAND_KIT_FILES = [
  {
    label: 'Official Pure Symbol Icon (SVG)',
    desc: 'Infinite vector scale · Transparent background',
    preview: '/brand/adnetiks-icon.svg',
    href: '/brand/adnetiks-icon.svg',
    download: 'adnetiks-icon.svg',
  },
  {
    label: 'Pure Symbol Icon (1024×1024 PNG)',
    desc: 'Print & Retina RGBA · Transparent background',
    preview: '/brand/adnetiks-icon-1024.png',
    href: '/brand/adnetiks-icon-1024.png',
    download: 'adnetiks-icon-1024.png',
  },
  {
    label: 'Obsidian App Icon Badge (1024×1024 PNG)',
    desc: 'App Store, iOS, PWA & profile avatar ready',
    preview: '/brand/adnetiks-icon-dark-1024.png',
    href: '/brand/adnetiks-icon-dark-1024.png',
    download: 'adnetiks-icon-dark-1024.png',
  },
  {
    label: 'Horizontal Lockup — White Text (PNG)',
    desc: '1840×440 RGBA · For dark decks & headers',
    preview: '/brand/adnetiks-logo-horizontal-white.png',
    href: '/brand/adnetiks-logo-horizontal-white.png',
    download: 'adnetiks-logo-horizontal-white.png',
    darkPreview: true,
  },
  {
    label: 'Horizontal Lockup — Dark Text (PNG)',
    desc: '1840×440 RGBA · For light docs & press kits',
    preview: '/brand/adnetiks-logo-horizontal-dark.png',
    href: '/brand/adnetiks-logo-horizontal-dark.png',
    download: 'adnetiks-logo-horizontal-dark.png',
    lightPreview: true,
  },
  {
    label: 'Multi-Size Favicon (.ico)',
    desc: '16px–256px packed ICO for any website',
    preview: '/brand/adnetiks-icon-192.png',
    href: '/brand/adnetiks-favicon.ico',
    download: 'adnetiks-favicon.ico',
  },
];

export default function ResourcesPage({
  brandProfile,
  onUseTemplate,
  onStartSectionTour,
  showNotificationToast,
}: ResourcesPageProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'automations' | 'tours' | 'playbooks' | 'brand_kit'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TemplateCategory>('all');

  const filteredTemplates = CAMPAIGN_TEMPLATES.filter((t) => {
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.categoryLabel.toLowerCase().includes(q) ||
      t.variantA.hookAngle.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const formatIcon = (fmt: CampaignTemplate['recommendedFormat']) => {
    if (fmt === 'short_video') return <Video className="w-3.5 h-3.5 text-cyan-400" />;
    if (fmt === 'sponsored_ad') return <Crosshair className="w-3.5 h-3.5 text-amber-400" />;
    if (fmt === 'carousel') return <LayoutList className="w-3.5 h-3.5 text-purple-400" />;
    return <FileText className="w-3.5 h-3.5 text-red-400" />;
  };

  const formatLabel = (fmt: CampaignTemplate['recommendedFormat']) => {
    if (fmt === 'short_video') return '9:16 Video Reel';
    if (fmt === 'sponsored_ad') return 'Sponsored Ad';
    if (fmt === 'carousel') return '4-Slide Carousel';
    return 'Social Post';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Section Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1F1F2A] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-500" />
            Resources, High-Converting Templates &amp; Playbooks
          </h1>
          <p className="text-xs sm:text-sm text-[#8B8BA8] mt-1">
            Launch proven campaigns in 1 click, run interactive section tours, copy battle-tested hook formulas, and download official brand assets.
          </p>
        </div>

        <div
          data-tour="resources-tabs"
          className="flex flex-wrap items-center gap-1 bg-[#111116] p-1 rounded-xl border border-[#1F1F2A] self-start lg:self-auto"
        >
          {[
            { id: 'templates' as const, label: `Templates (${CAMPAIGN_TEMPLATES.length})`, icon: Sparkles },
            { id: 'automations' as const, label: `Automations (${AUTOMATION_TEMPLATES.length})`, icon: Workflow },
            { id: 'tours' as const, label: 'Guided Tours', icon: Compass },
            { id: 'playbooks' as const, label: 'Hook Playbooks', icon: Code2 },
            { id: 'brand_kit' as const, label: 'Brand Kit', icon: ImageIcon },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#8B8BA8] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 2: WORKFLOW AUTOMATIONS LIBRARY (n8n & Activepieces) */}
      {activeTab === 'automations' && (
        <WorkflowAutomationsView
          brandProfile={brandProfile}
          showNotificationToast={showNotificationToast}
        />
      )}

      {/* TAB 1: HIGH-CONVERTING CAMPAIGN TEMPLATES LIBRARY */}
      {activeTab === 'templates' && (
        <div className="space-y-5">
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: 'All Blueprints' },
                { id: 'artist_music' as const, label: 'Artist / Music' },
                { id: 'creator_media' as const, label: 'Creator / Media' },
                { id: 'ecommerce_merch' as const, label: 'E-Commerce / Merch' },
                { id: 'tech_startup' as const, label: 'Tech / Startup' },
                { id: 'agency_events' as const, label: 'Agency / Service' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-[#18181F] border-red-500/70 text-white'
                      : 'bg-[#111116] border-[#1F1F2A] text-[#8B8BA8] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-[#52526B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full bg-[#111116] border border-[#2A2A38] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#52526B] focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-[#111116] border border-[#1F1F2A] hover:border-red-500/60 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60">
                      {tmpl.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 bg-[#0A0A0C] border border-[#1F1F2A] px-2 py-0.5 rounded flex items-center gap-1">
                      {formatIcon(tmpl.recommendedFormat)}
                      {formatLabel(tmpl.recommendedFormat)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-white group-hover:text-red-400 transition-colors">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-[#8B8BA8] mt-1 leading-relaxed">{tmpl.summary}</p>
                  </div>

                  {/* Preview of Pre-Loaded Assets */}
                  <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                      <span>✓ A/B Hooks + 3-Beat Video + 4 Slides</span>
                      <span>Pixel: {tmpl.pixelEvent}</span>
                    </div>
                    <p className="text-slate-300 line-clamp-2 italic">
                      &quot;{tmpl.variantA.content.split('\n')[0]}&quot;
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1F1F2A] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {tmpl.recommendedPlatforms.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#18181F] text-slate-300 border border-[#2A2A38]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onUseTemplate(tmpl)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/30 transition-all shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Populate Builder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE SECTION GUIDED TOURS */}
      {activeTab === 'tours' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              key: 'home',
              step: 'HOME',
              title: 'Overview & 4-Stage Loop',
              desc: 'Learn how Brand Brain, saved Campaign Projects, Delivery, and Analytics connect in one loop.',
            },
            {
              key: 'brand_avatar',
              step: 'STEP 01',
              title: 'Brand Brain & Audience Demographics',
              desc: 'Calibrate your real brand category, voice guardrails, target demographics, and Closed-Loop Memory.',
            },
            {
              key: 'studio',
              step: 'STEP 02',
              title: 'Campaign Studio & AI Video Director',
              desc: 'Scrape live URLs, analyze flyers with vision, load templates, render 720×1280 9:16 videos, and plug them in.',
            },
            {
              key: 'distribution',
              step: 'STEP 03',
              title: 'Distribution Bridge & A/B Hook Lab',
              desc: 'Configure Postiz or signed n8n webhooks, toggle the 30s cron worker, and declare A/B winners.',
            },
            {
              key: 'signals',
              step: 'STEP 04',
              title: 'Analytics, Live Attribution & Inbox',
              desc: 'Inspect real /r/ UTM clicks, pixel conversions, engagement heatmaps, and sync signals into Brand Memory.',
            },
            {
              key: 'integrations',
              step: 'PLUG-INS',
              title: 'Agnostic AI Engines & Connectors',
              desc: 'Hot-swap Gemini, Claude, OpenAI, local Ollama, Postiz, PostHog, and Umami with zero lock-in.',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="p-5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-red-500/60 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/60">
                  {item.step}
                </span>
                <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                <p className="text-xs text-[#8B8BA8] leading-relaxed">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onStartSectionTour(item.key)}
                className="w-full py-2 rounded-xl bg-[#18181F] hover:bg-red-600 text-white text-xs font-bold border border-[#2A2A38] hover:border-red-500 flex items-center justify-center gap-1.5 transition-all"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Launch Interactive Tour</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: HIGH-CONVERTING HOOK PLAYBOOKS & SELF-HOST SETUP */}
      {activeTab === 'playbooks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOOK_PLAYBOOKS.map((pb) => (
              <div
                key={pb.name}
                className="p-5 rounded-2xl bg-[#111116] border border-[#1F1F2A] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                    {pb.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(pb.formula);
                      showNotificationToast('Formula Copied', pb.name);
                    }}
                    className="text-[11px] text-[#8B8BA8] hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Formula
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white">{pb.name}</h3>
                <div className="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] text-xs font-mono text-cyan-200">
                  {pb.formula}
                </div>
                <p className="text-xs text-[#8B8BA8] italic">Example: {pb.example}</p>
              </div>
            ))}
          </div>

          {/* Quick-Start Implementation Guide */}
          <div className="p-5 rounded-2xl bg-[#111116] border border-emerald-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Closed-Loop Quickstart Checklist</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] space-y-1">
                <div className="font-bold text-white">1. First-Party Pixel Install</div>
                <p className="text-[11px] text-[#8B8BA8]">
                  Paste the <code className="text-cyan-300">/api/pixel.js</code> script from Campaign Launchpad onto your landing page or Shopify theme to capture real conversions.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] space-y-1">
                <div className="font-bold text-white">2. Connect Postiz or n8n Webhook</div>
                <p className="text-[11px] text-[#8B8BA8]">
                  Open <strong>03 Distribution → Bridge</strong> to paste your n8n/Make webhook URL or self-hosted Postiz API key and flip <strong>Cron: ON</strong>.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F2A] space-y-1">
                <div className="font-bold text-white">3. Sync Winners Into Brand Brain</div>
                <p className="text-[11px] text-[#8B8BA8]">
                  After every launch, hit <strong>Sync Signals → Brand Brain</strong> in <strong>04 Analytics</strong> so winning hooks automatically upgrade your next campaign.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL ADNETIKS BRAND KIT & EXPORTS */}
      {activeTab === 'brand_kit' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRAND_KIT_FILES.map((asset) => (
            <div
              key={asset.download}
              className="rounded-2xl bg-[#111116] border border-[#1F1F2A] overflow-hidden flex flex-col justify-between"
            >
              <div
                className={`h-36 flex items-center justify-center p-5 border-b border-[#1F1F2A] ${
                  asset.lightPreview ? 'bg-slate-100' : 'bg-[#0A0A0C]'
                }`}
              >
                <img
                  src={asset.preview}
                  alt={asset.label}
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{asset.label}</div>
                  <div className="text-[11px] text-[#8B8BA8] truncate">{asset.desc}</div>
                </div>
                <a
                  href={asset.href}
                  download={asset.download}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
