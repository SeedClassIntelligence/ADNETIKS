/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Studio Command Hub / Home Dashboard
 * Unified command center for creators, artists, and brand builders.
 */

import { useState } from 'react';
import {
  Sparkles,
  Upload,
  Link2,
  Video,
  Calendar,
  ArrowUpRight,
  GitBranch,
  MessageCircle,
  TrendingUp,
  Eye,
  CheckCircle2,
  Play,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  Campaign,
  PostVariant,
  SplitTestExperiment,
  CustomerAvatar,
  SocialPlatform,
} from '../types';

interface HomeDashboardProps {
  campaigns: Campaign[];
  posts: PostVariant[];
  splitTests: SplitTestExperiment[];
  avatars: CustomerAvatar[];
  onNavigateToStudio: (mode?: 'screenshot' | 'url' | 'brief') => void;
  onNavigateToTab: (tab: string) => void;
  onSelectAvatar: (avatar: CustomerAvatar) => void;
}

export default function HomeDashboard({
  campaigns,
  posts,
  splitTests,
  avatars,
  onNavigateToStudio,
  onNavigateToTab,
  onSelectAvatar,
}: HomeDashboardProps) {
  const scheduledCount = posts.filter((p) => p.status === 'scheduled' || p.status === 'approved').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const runningTests = splitTests.filter((t) => t.status === 'running').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner / Studio Intake */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1F1F2A] bg-gradient-to-br from-[#111116] via-[#0D0D11] to-[#14080B] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-semibold uppercase tracking-wider font-display">
              <Zap className="w-3.5 h-3.5" />
              Creative Studio Engine · BE-Agnostic
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display leading-tight">
              One Creative Studio. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-red-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                Every Asset, Video &amp; Post Coordinated.
              </span>
            </h1>
            <p className="text-sm text-[#8B8BA8] max-w-xl">
              Feed in a screenshot, artwork, song link, or brief. Adnetiks calibrates your brand voice, matches your fan personas, generates A/B variants, and schedules peak-window distribution across all channels.
            </p>
          </div>

          {/* Direct Creation Launchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => onNavigateToStudio('screenshot')}
              className="group flex items-center gap-3 p-3.5 rounded-2xl bg-[#18181F] border border-[#2A2A38] hover:border-red-500/80 hover:bg-[#1C1C26] transition-all text-left shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block font-display">Drop Screenshot / Art</span>
                <span className="text-[11px] text-[#8B8BA8]">Flyer, visual or image</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateToStudio('url')}
              className="group flex items-center gap-3 p-3.5 rounded-2xl bg-[#18181F] border border-[#2A2A38] hover:border-red-500/80 hover:bg-[#1C1C26] transition-all text-left shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block font-display">Ingest Link or URL</span>
                <span className="text-[11px] text-[#8B8BA8]">Landing page, article, offer</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab('video_studio')}
              className="group flex items-center gap-3 p-3.5 rounded-2xl bg-[#18181F] border border-[#2A2A38] hover:border-cyan-500/80 hover:bg-[#1C1C26] transition-all text-left shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block font-display">Script 3-Beat Video</span>
                <span className="text-[11px] text-[#8B8BA8]">Reels, TikTok &amp; Shorts</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab('scheduler')}
              className="group flex items-center gap-3 p-3.5 rounded-2xl bg-[#18181F] border border-[#2A2A38] hover:border-emerald-500/80 hover:bg-[#1C1C26] transition-all text-left shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block font-display">Review Smart Queue</span>
                <span className="text-[11px] text-[#8B8BA8]">{scheduledCount} posts queued</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards — Clean Editorial Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] transition-all">
          <div className="flex items-center justify-between text-[#8B8BA8] text-xs font-medium">
            <span>Ready in Queue</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display stat-num">
              {scheduledCount}
            </span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">Dispatched on Peak</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] transition-all">
          <div className="flex items-center justify-between text-[#8B8BA8] text-xs font-medium">
            <span>A/B Experiments</span>
            <GitBranch className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display stat-num">
              {runningTests} Active
            </span>
            <span className="text-xs text-red-400 font-semibold font-mono">62.4% Lift</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] transition-all">
          <div className="flex items-center justify-between text-[#8B8BA8] text-xs font-medium">
            <span>Organic Reach</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display stat-num">
              74.2K
            </span>
            <span className="text-xs text-cyan-400 font-semibold font-mono">+34% vs Last Wk</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] transition-all">
          <div className="flex items-center justify-between text-[#8B8BA8] text-xs font-medium">
            <span>Fan Resonance Match</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display stat-num">
              96%
            </span>
            <span className="text-xs text-amber-400 font-semibold font-mono">Top Persona</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Queue Preview + Target Audience Personas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Content Queue & Scheduled Deliveries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">
                Automated Content Pipeline
              </h2>
            </div>
            <button
              onClick={() => onNavigateToTab('scheduler')}
              className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
            >
              Open Full Scheduler <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {posts.slice(0, 4).map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {post.mediaUrl ? (
                    <img
                      src={post.mediaUrl}
                      alt="Post visual"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#2A2A38]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#18181F] border border-[#2A2A38] flex items-center justify-center shrink-0 text-red-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                        {post.platform}
                      </span>
                      <span className="text-xs font-semibold text-red-400 truncate">
                        {post.hookAngle}
                      </span>
                    </div>
                    <p className="text-xs text-[#8B8BA8] line-clamp-2 pr-2">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 gap-1 border-t sm:border-t-0 border-[#1F1F2A] pt-2 sm:pt-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60">
                    {post.status}
                  </span>
                  <span className="text-[11px] text-[#52526B] font-mono">
                    {post.scheduledTime ? new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Auto-Peak'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Calibrated Fan Avatars & Rapid Switcher */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">
                Audience Personas
              </h2>
            </div>
            <button
              onClick={() => onNavigateToTab('brand_avatar')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {avatars.slice(0, 3).map((av) => (
              <div
                key={av.id}
                onClick={() => {
                  onSelectAvatar(av);
                  onNavigateToStudio();
                }}
                className="p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-amber-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {av.avatarImageUrl ? (
                      <img
                        src={av.avatarImageUrl}
                        alt={av.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#2A2A38]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {av.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {av.name}
                      </h3>
                      <span className="text-[10px] text-[#8B8BA8] block truncate max-w-[150px]">
                        {av.roleTitle}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60">
                    {av.matchScore || 95}% Match
                  </span>
                </div>

                <p className="text-[11px] text-[#8B8BA8] line-clamp-2 mt-2 leading-relaxed">
                  Friction: {av.painPoints[0] || 'Inconsistent posting rhythm'}
                </p>

                <div className="mt-3 pt-2.5 border-t border-[#1F1F2A] flex items-center justify-between text-[10px] text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Create tailored post →</span>
                  <span className="uppercase text-[#52526B] font-mono">{av.preferredPlatforms.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip on Agnostic Core */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/20 to-transparent border border-red-900/30 text-xs text-[#8B8BA8] space-y-1.5">
            <span className="text-red-400 font-bold block flex items-center gap-1.5 font-display">
              <Zap className="w-3.5 h-3.5" /> BE-Agnostic LLM Engine
            </span>
            <p className="text-[11px] leading-relaxed">
              Switch seamlessly between Gemini, OpenAI GPT-4o, Anthropic Claude, or private local LLMs via Ollama/Groq in your <code className="text-slate-300">.env</code>.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
