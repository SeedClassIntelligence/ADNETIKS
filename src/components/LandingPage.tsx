/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Public Product Landing Page
 * Plain-English explanation of what ADNETIKS does, interactive 1-click URL launch bar,
 * 4-step workflow breakdown, Old Way vs ADNETIKS comparison, use-case switcher, and Cloud vs Self-Hosted tiers.
 */

import { useState } from 'react';
import AdnetiksLogo from './AdnetiksLogo';
import {
  Zap,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Palette,
  Video,
  Calendar,
  BarChart3,
  ShieldCheck,
  Server,
  Cloud,
  Cpu,
  Layers,
  MousePointerClick,
  Play,
  Briefcase,
  ShoppingBag,
  Music,
  Rocket,
} from 'lucide-react';

interface LandingPageProps {
  onEnterStudio: (initialTab?: string) => void;
  onLaunchWithUrl: (url: string) => void;
}

type UseCaseKey = 'saas' | 'agency' | 'ecommerce' | 'creator';

const USE_CASES: Record<
  UseCaseKey,
  {
    label: string;
    icon: any;
    headline: string;
    summary: string;
    bullets: string[];
    sampleHook: string;
    sampleMetric: string;
  }
> = {
  saas: {
    label: 'Businesses & SaaS',
    icon: Rocket,
    headline: 'Turn your homepage, comparison & pricing pages into daily pipeline.',
    summary:
      'Instead of writing generic updates nobody reads, ADNETIKS scans your actual product pages and builds persuasive comparison ads, LinkedIn teardowns, and X threads that speak directly to buyer objections.',
    bullets: [
      'Pulls real positioning from your Comparison, Features & Pricing pages',
      'Generates "Old Way vs. New Way" visual ad cards in your exact brand palette',
      'Tracks real UTM clicks & conversion pixel events back to each hook',
    ],
    sampleHook: '"The Consumer Is Not a Lead. Compare documented offers privately — you choose who calls."',
    sampleMetric: '3.4× higher CTR vs. generic company announcements',
  },
  agency: {
    label: 'Agencies & Consultants',
    icon: Briefcase,
    headline: 'Onboard a new client in 60 seconds instead of 2 weeks.',
    summary:
      'Paste a prospect’s website URL during a discovery call and instantly show them a full multi-platform campaign, target buyer personas, and custom ad creatives branded to their exact colors.',
    bullets: [
      'Manage multiple client workspaces and brand voices from one dashboard',
      'Built-in Live AI Cost & Profit Margin Tracker shows exact cost per client (~$2.88/mo)',
      '1-click Stakeholder Reports & approval workflows for client sign-off',
    ],
    sampleHook: 'Walk into every pitch with a ready-to-launch 8-post client campaign already built.',
    sampleMetric: '94%+ gross SaaS / retainer margin per client workspace',
  },
  ecommerce: {
    label: 'E-Commerce & Product Drops',
    icon: ShoppingBag,
    headline: 'Launch every product drop with synchronized ads, carousels & 9:16 Reels.',
    summary:
      'Drop in your store URL or product photography and let ADNETIKS generate urgency-driven IG carousels, TikTok scripts, and paid social ad creatives sized cleanly for every feed.',
    bullets: [
      'Auto-generates 1:1, 4:3, 16:9, and 9:16 vertical creatives with clean text density',
      '12 high-converting campaign templates (Flash Drops, Social Proof, Founder Story)',
      'Auto-schedules countdown posts to peak shopping hours',
    ],
    sampleHook: '"Built to outlast fast trends. Limited capsule drops Friday at 12 PM."',
    sampleMetric: 'Zero design bottleneck — full drop campaign ready in minutes',
  },
  creator: {
    label: 'Artists & Creators',
    icon: Music,
    headline: 'Promote releases, tours, and content without burning out on social media.',
    summary:
      'Focus on making your art while ADNETIKS turns one release link, flyer, or short clip into a week of platform-native posts, 9:16 vertical videos, and fan-ready hooks.',
    bullets: [
      'Adapts tone to your authentic voice — never sounds like corporate AI slop',
      'Built-in 9:16 HD Video Studio with kinetic captions and brand styling',
      'Unified Fan & DM Inbox to reply faster without switching 5 apps',
    ],
    sampleHook: '"Stop making art for the algorithm. Build directly for the fans who stay until the lights come on."',
    sampleMetric: '10+ hours saved every week across IG, TikTok, X & Threads',
  },
};

export default function LandingPage({ onEnterStudio, onLaunchWithUrl }: LandingPageProps) {
  const [heroUrl, setHeroUrl] = useState('');
  const [activeUseCase, setActiveUseCase] = useState<UseCaseKey>('saas');

  const currentUseCase = USE_CASES[activeUseCase];
  const UseCaseIcon = currentUseCase.icon;

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroUrl.trim();
    if (clean) {
      onLaunchWithUrl(clean);
    } else {
      onEnterStudio('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-[#E5E5F0] selection:bg-red-600/40 selection:text-white overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-red-600/12 blur-[140px]" />
        <div className="absolute top-[38%] -right-40 w-[560px] h-[560px] rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute bottom-0 -left-40 w-[520px] h-[520px] rounded-full bg-cyan-600/8 blur-[140px]" />
      </div>

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#08080B]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AdnetiksLogo size={30} />
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              ADNETIKS
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-red-950/70 border border-red-800/50 text-[10px] font-mono font-bold text-red-300 uppercase">
              Campaign OS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#A0A0BC]">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#why-adnetiks" className="hover:text-white transition-colors">
              Old Way vs. ADNETIKS
            </a>
            <a href="#use-cases" className="hover:text-white transition-colors">
              Who It’s For
            </a>
            <a href="#hosting-pricing" className="hover:text-white transition-colors">
              Cloud &amp; Self-Host
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onEnterStudio('home')}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              Open Dashboard
            </button>
            <button
              type="button"
              onClick={() => onLaunchWithUrl('')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Try 1-Click Launch</span>
              <span className="sm:hidden">Start</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Brand Intelligence · Ad Creative Studio · 24/7 Auto-Delivery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.06]">
              Paste Your Website.{' '}
              <span className="bg-gradient-to-r from-red-400 via-rose-400 to-emerald-400 bg-clip-text text-transparent">
                Launch a Full Ad &amp; Social Campaign
              </span>{' '}
              in 60 Seconds.
            </h1>

            <p className="text-base sm:text-lg text-[#A2A2BE] max-w-2xl mx-auto leading-relaxed">
              ADNETIKS reads your entire website — homepage, pricing, comparison, and about pages — learns your brand colors and message, maps your ideal buyers, designs clean ad creatives &amp; 9:16 videos, and schedules them across every social platform automatically.
            </p>

            {/* Interactive 1-Click Hero Launcher */}
            <form
              onSubmit={handleHeroSubmit}
              className="max-w-2xl mx-auto pt-2"
            >
              <div className="p-2 rounded-2xl bg-[#111118] border border-[#2A2A3B] shadow-2xl shadow-black/60 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#09090D] border border-white/5">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    value={heroUrl}
                    onChange={(e) => setHeroUrl(e.target.value)}
                    placeholder="Paste your website URL (e.g. https://yourcompany.com)"
                    className="w-full bg-transparent text-sm text-white placeholder-[#5B5B78] focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition-all shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Build My Campaign</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#8B8BA8]">
                <span>Want to see it work live?</span>
                <button
                  type="button"
                  onClick={() => onLaunchWithUrl('https://openpolici.com')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Demo on openpolici.com →
                </button>
                <span className="text-[#45455B]">·</span>
                <button
                  type="button"
                  onClick={() => onEnterStudio('home')}
                  className="text-slate-300 hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Or jump straight into the Dashboard
                </button>
              </div>
            </form>

            {/* Capability Strip */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-[#8E8EA8]">
              {[
                'Multi-Page Website Scanner',
                'Brand-Styled Ad Graphics (No Stock Fluff)',
                '9:16 HD Video Exporter',
                'A/B Hook Testing + Click Tracking',
                'Bring Any AI Key or Run Free Local AI',
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Product Architecture Showcase (What Happens After You Paste Your URL) */}
          <div className="mt-14 rounded-3xl border border-white/10 bg-gradient-to-b from-[#13131B] to-[#0B0B10] p-5 sm:p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-white/8">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-[#8B8BA8]">
                  adnetiks.studio — End-to-End Campaign Pipeline
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[11px] font-mono text-emerald-300 font-bold">
                1 URL IN → COMPLETE CAMPAIGN OUT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Deep Brand Read */}
              <div className="p-5 rounded-2xl bg-[#0D0D13] border border-[#222232] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
                    1 · READS YOUR SITE
                  </span>
                  <Palette className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-sm font-extrabold text-white">Extracts Real Brand DNA</div>
                <p className="text-xs text-[#9494B2] leading-relaxed">
                  Crawls your homepage, comparison, pricing &amp; about pages to capture your real value claims, hex colors, and typography.
                </p>
                <div className="pt-2 flex items-center gap-1.5">
                  {['#047857', '#B45309', '#4AAF92', '#273C49', '#0C2230'].map((hex) => (
                    <span
                      key={hex}
                      className="w-6 h-6 rounded-lg border border-white/15"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                  <span className="text-[10px] font-mono text-[#7D7D98] ml-1">Auto Palette</span>
                </div>
              </div>

              {/* Card 2: Ad Creative + Persuasive Copy */}
              <div className="p-5 rounded-2xl bg-[#0D0D13] border border-emerald-700/40 space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                    2 · BUILDS REAL ADS
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-sm font-extrabold text-white">Persuasive Copy &amp; Clean Graphics</div>
                <p className="text-xs text-[#9494B2] leading-relaxed">
                  Drafts sales-focused posts for LinkedIn, X, IG &amp; TikTok plus clean, low-text-density <strong className="text-white">Old Way vs. New Way</strong> ad creatives and 9:16 videos.
                </p>
                <div className="p-2.5 rounded-xl bg-[#080B10] border border-emerald-800/40 text-[11px] font-mono text-emerald-200 flex items-center justify-between">
                  <span>✓ Algorithm-Safe Ad PNG</span>
                  <span className="text-emerald-400 font-bold">1080×1080</span>
                </div>
              </div>

              {/* Card 3: Auto-Publish & Learn */}
              <div className="p-5 rounded-2xl bg-[#0D0D13] border border-[#222232] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-800/50">
                    3 · DELIVERS &amp; TRACKS
                  </span>
                  <BarChart3 className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-sm font-extrabold text-white">24/7 Queue &amp; Real Attribution</div>
                <p className="text-xs text-[#9494B2] leading-relaxed">
                  Schedules posts to peak windows, runs A/B hook split tests, tracks real UTM clicks &amp; conversions, and feeds winning patterns back into your Brand Brain.
                </p>
                <div className="p-2.5 rounded-xl bg-[#080B10] border border-white/8 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>Live Cost Ledger</span>
                  <span className="text-emerald-400 font-bold">~$2.88 / brand</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: OLD WAY VS ADNETIKS WAY */}
        <section id="why-adnetiks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
              Why Teams Switch
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Stop Juggling 6 Disconnected Marketing Tools
            </h2>
            <p className="text-sm text-[#9494B2]">
              Most businesses pay for a copy tool, a design app, a video editor, a scheduler, and an analytics tool — and still end up posting generic content that doesn’t sell.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#101016] border border-red-900/35 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-xs font-mono font-bold text-red-300 uppercase">
                The Old Way
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Slow, Expensive &amp; Off-Brand
              </h3>
              <ul className="space-y-3.5 text-sm text-[#A5A5C0]">
                {[
                  'Spending 8+ hours a week copying website info into ChatGPT and tweaking generic prompts',
                  'Designing ads from scratch in Canva or paying agencies $2,500–$5,000/month',
                  'Posting random stock photos or cluttered screenshots that social algorithms bury',
                  'Zero connection between which ad hook people clicked and what you write next week',
                  'Locked into one expensive AI vendor with surprise monthly token bills',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ADNETIKS Way */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-[#101318] to-[#0C0C12] border border-emerald-600/45 space-y-5 shadow-xl shadow-emerald-950/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-xs font-mono font-bold text-emerald-300 uppercase">
                The ADNETIKS Way
              </div>
              <h3 className="text-xl font-extrabold text-white">
                One Unified Campaign Operating System
              </h3>
              <ul className="space-y-3.5 text-sm text-slate-200">
                {[
                  'Paste your website URL once — ADNETIKS crawls all key pages and learns your real business',
                  'Automatically designs crisp, low-text-density ad creatives & 9:16 videos in your exact brand colors',
                  'Writes persuasive, direct-response copy tailored to your target buyer on LinkedIn, X, IG & TikTok',
                  'Built-in 24/7 scheduler, A/B Hook Lab, UTM link tracker & self-improving Brand Memory',
                  'AI-agnostic: plug in Gemini, OpenAI, Claude, or run free local Ollama with live cost tracking',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS (4 PILLARS) */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              Inside The Dashboard
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Four Simple Steps From Website to Revenue
            </h2>
            <p className="text-sm text-[#9494B2]">
              Every part of the ADNETIKS workspace connects together in one clean loop — no steep learning curve, plus interactive Guided Tours on every screen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                title: 'Brand & Audience',
                icon: Globe,
                color: 'text-red-400',
                bg: 'bg-red-950/40 border-red-800/50',
                desc: 'Scans your whole website (home, compare, pricing, about), extracts colors & fonts, and maps your highest-converting customer personas.',
              },
              {
                step: '02',
                title: 'Campaign & Video Studio',
                icon: Video,
                color: 'text-cyan-400',
                bg: 'bg-cyan-950/40 border-cyan-800/50',
                desc: 'Generates persuasive posts, clean Brand Ad Creatives, 12 proven campaign templates, carousel decks, and playable 9:16 HD videos.',
              },
              {
                step: '03',
                title: 'Automated Distribution',
                icon: Calendar,
                color: 'text-emerald-400',
                bg: 'bg-emerald-950/40 border-emerald-800/50',
                desc: 'Queues posts into peak engagement windows, runs live A/B hook split tests, and dispatches via Postiz or signed webhooks 24/7.',
              },
              {
                step: '04',
                title: 'Analytics, Inbox & Cost',
                icon: MousePointerClick,
                color: 'text-amber-400',
                bg: 'bg-amber-950/40 border-amber-800/50',
                desc: 'Tracks real UTM clicks, conversion pixel events, fan replies, and exact AI token spend — feeding winners back into your Brand Brain.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-6 rounded-2xl bg-[#101017] border border-[#222230] hover:border-[#343448] transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${item.bg} ${item.color}`}>
                        STEP {item.step}
                      </span>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                    <p className="text-xs text-[#9696B4] leading-relaxed">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onEnterStudio(
                        item.step === '01'
                          ? 'brand_avatar'
                          : item.step === '02'
                          ? 'studio'
                          : item.step === '03'
                          ? 'distribution'
                          : 'signals'
                      )
                    }
                    className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 pt-2 cursor-pointer"
                  >
                    <span>Explore Step {item.step}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: INTERACTIVE USE-CASE SWITCHER */}
        <section id="use-cases" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Built For Your Industry
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Adapts Automatically to What You Actually Sell
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {(Object.keys(USE_CASES) as UseCaseKey[]).map((key) => {
              const uc = USE_CASES[key];
              const Icon = uc.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveUseCase(key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    activeUseCase === key
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/30'
                      : 'bg-[#111118] border-[#252536] text-[#9E9EBA] hover:text-white hover:border-[#3A3A50]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{uc.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl bg-[#101017] border border-[#242435] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase">
                <UseCaseIcon className="w-4 h-4" />
                <span>{currentUseCase.label}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {currentUseCase.headline}
              </h3>
              <p className="text-sm text-[#9E9EBA] leading-relaxed">{currentUseCase.summary}</p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                {currentUseCase.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#161622] to-[#0B0B10] border border-[#2C2C40] space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Example ADNETIKS Campaign Output
              </div>
              <blockquote className="text-sm sm:text-base font-bold text-white leading-snug border-l-2 border-red-500 pl-3.5">
                {currentUseCase.sampleHook}
              </blockquote>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{currentUseCase.sampleMetric}</span>
              </div>
              <button
                type="button"
                onClick={() => onLaunchWithUrl('')}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-200 text-[#0A0A0C] text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Generate One For My Website</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: HOSTED CLOUD VS SELF-HOSTED + TRANSPARENT PRICING */}
        <section id="hosting-pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Flexible Deployment &amp; Economics
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Run in the Cloud — or Host Privately on Your Own Server
            </h2>
            <p className="text-sm text-[#9494B2]">
              No vendor lock-in. ADNETIKS includes a built-in Live AI Cost &amp; Unit Economics Calculator so you always see your real token spend and margins down to the penny.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Starter Cloud */}
            <div className="p-7 rounded-3xl bg-[#101017] border border-[#242435] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-cyan-400">Starter Cloud</span>
                  <Cloud className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white font-mono">
                    $49<span className="text-sm font-normal text-[#8B8BA8]"> / mo</span>
                  </div>
                  <p className="text-xs text-[#9494B2] mt-1">
                    For founders, solo brands &amp; creators who want 60-second setup and 24/7 cloud posting.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/8">
                  {[
                    '1 Brand Workspace + Deep Multi-Page Website Scanner',
                    'Unlimited On-Brand Ad Creatives & 9:16 Video Exports',
                    '12 High-Converting Campaign Templates',
                    '24/7 Cloud Scheduler + UTM Click Attribution',
                    'Zero API keys required (AI included)',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onLaunchWithUrl('')}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Start With Your Website
              </button>
            </div>

            {/* Growth Agency (Highlighted) */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-red-950/35 via-[#131119] to-[#0D0D14] border-2 border-red-600/70 flex flex-col justify-between gap-6 shadow-2xl shadow-red-950/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-red-600 text-[10px] font-mono font-extrabold text-white uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-red-400">Growth &amp; Agency</span>
                  <Layers className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white font-mono">
                    $149<span className="text-sm font-normal text-[#8B8BA8]"> / mo</span>
                  </div>
                  <p className="text-xs text-[#A8A8C4] mt-1">
                    For marketing teams and agencies managing multiple brands, A/B tests &amp; client reporting.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-white/10">
                  {[
                    'Up to 10 Active Brand Workspaces & Unlimited Campaigns',
                    'Closed-Loop Brand Brain Memory (Auto-Learns Winners)',
                    'A/B Hook Split-Testing Lab + First-Party Conversion Pixel',
                    'Live AI Cost Ledger & Unit Economics Margin Calculator',
                    'Plug in Gemini, OpenAI, Claude, or Custom AI Endpoints',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onEnterStudio('home')}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-900/40 transition-all cursor-pointer"
              >
                Launch Interactive Dashboard →
              </button>
            </div>

            {/* Private Self-Hosted */}
            <div className="p-7 rounded-3xl bg-[#101017] border border-[#242435] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-400">Private Self-Hosted</span>
                  <Server className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white font-mono">
                    1-Click<span className="text-sm font-normal text-[#8B8BA8]"> Docker</span>
                  </div>
                  <p className="text-xs text-[#9494B2] mt-1">
                    For privacy-strict enterprises or teams who want full ownership on their own infrastructure.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/8">
                  {[
                    '1-Command Docker Stack (App + Headless Chrome + Storage)',
                    'Optional Offline Free Local AI Mode (Ollama Built-In)',
                    '1-Click Cloud Blueprints for Render & Railway included',
                    '100% data ownership — brand assets never leave your server',
                    'Zero per-seat markup — pay only raw AI/hosting costs',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onEnterStudio('integrations')}
                className="w-full py-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 text-xs font-bold text-emerald-300 transition-all cursor-pointer"
              >
                Explore AI &amp; Hosting Setup
              </button>
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-3xl bg-gradient-to-r from-red-950/60 via-[#15121B] to-emerald-950/40 border border-white/10 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 text-xs font-bold text-white">
              <Play className="w-3.5 h-3.5 text-red-400" />
              <span>Ready in under 60 seconds</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight max-w-2xl mx-auto">
              See What ADNETIKS Builds For Your Website Right Now
            </h2>
            <p className="text-sm sm:text-base text-[#A5A5C2] max-w-xl mx-auto">
              Paste your link, watch ADNETIKS read your entire site, and get custom ad creatives and persuasive posts you can publish today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onLaunchWithUrl('')}
                className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-red-900/40 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Try 1-Click Website Launch</span>
              </button>
              <button
                type="button"
                onClick={() => onEnterStudio('home')}
                className="px-6 py-3.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-white text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Open Full Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/8 bg-[#060608] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7D7D98]">
          <div className="flex items-center gap-2.5">
            <AdnetiksLogo size={22} />
            <span className="font-bold text-white">ADNETIKS</span>
            <span>·</span>
            <span>AI Brand Intelligence, Ad Creative &amp; Automated Delivery Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onEnterStudio('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onEnterStudio('resources')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Templates &amp; Docs
            </button>
            <button
              type="button"
              onClick={() => onEnterStudio('signals')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cost Calculator
            </button>
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              BE-Agnostic Core
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
