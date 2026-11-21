/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Workspace Overview
 * Sequential 4-Pillar Flow: Brand & Audience -> Campaigns -> Distribution -> Signals
 */

import { useState } from 'react';
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Users,
  BarChart2,
  Plus,
  CheckCircle2,
  ArrowRight,
  FolderKanban,
  Wand2,
  MapPin,
} from 'lucide-react';
import {
  BrandProfile,
  Campaign,
  PostVariant,
  SplitTestExperiment,
  CustomerAvatar,
} from '../types';
import BrandSetupWizard from './BrandSetupWizard';

interface HomeDashboardProps {
  brandProfile: BrandProfile;
  campaigns: Campaign[];
  posts: PostVariant[];
  splitTests: SplitTestExperiment[];
  avatars: CustomerAvatar[];
  onNavigateToStudio: (mode?: 'screenshot' | 'url' | 'brief') => void;
  onNavigateToTab: (tab: string) => void;
  onSelectAvatar: (avatar: CustomerAvatar) => void;
  onOpenCampaign: (campaignId: string) => void;
  onCreateCampaign: () => void;
  onCompleteBrandSetup: (
    updatedBrand: BrandProfile,
    discoveredAvatars: CustomerAvatar[],
    goToCampaigns?: boolean
  ) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function HomeDashboard({
  brandProfile,
  campaigns,
  posts,
  splitTests,
  avatars,
  onNavigateToStudio,
  onNavigateToTab,
  onSelectAvatar,
  onOpenCampaign,
  onCreateCampaign,
  onCompleteBrandSetup,
  showNotificationToast,
}: HomeDashboardProps) {
  const [isBrandConfigured, setIsBrandConfigured] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('adnetiks_brand_configured') === 'true';
  });
  const [showWizard, setShowWizard] = useState<boolean>(!isBrandConfigured);

  const scheduledCount = posts.filter((p) => p.status === 'scheduled' || p.status === 'approved').length;
  const runningTests = splitTests.filter((t) => t.status === 'running').length;

  const workflowSteps = [
    {
      num: '01',
      title: 'Brand & Audience',
      status: isBrandConfigured ? `${brandProfile.name} · ${avatars.length} Personas` : 'Calibrate Your Brand',
      done: isBrandConfigured,
      icon: Users,
      tab: 'brand_avatar',
      accent: 'text-red-400',
    },
    {
      num: '02',
      title: 'Campaigns',
      status: `${campaigns.length} Active Project${campaigns.length === 1 ? '' : 's'}`,
      done: campaigns.length > 0,
      icon: Sparkles,
      tab: 'studio',
      accent: 'text-cyan-400',
    },
    {
      num: '03',
      title: 'Distribution',
      status: `${scheduledCount} Queued · ${runningTests} A/B Live`,
      done: scheduledCount > 0,
      icon: Calendar,
      tab: 'distribution',
      accent: 'text-emerald-400',
    },
    {
      num: '04',
      title: 'Analytics & Inbox',
      status: 'Live Attribution, Heatmaps & DMs',
      done: false,
      icon: BarChart2,
      tab: 'signals',
      accent: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* 4-Step Guided Flow Strip */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {brandProfile.name} — Campaign Operating System
            </h2>
            <p className="text-xs text-[#8B8BA8]">
              Follow the 4-stage loop: define your brand &amp; demographics, build a campaign, schedule delivery, and track real signals.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowWizard(!showWizard)}
              className="px-3 py-1.5 rounded-xl bg-[#111116] hover:bg-[#18181F] border border-[#2A2A38] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-red-400" />
              <span>{showWizard ? 'Hide Brand Setup' : 'Recalibrate Brand'}</span>
            </button>
            <button
              onClick={onCreateCampaign}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Campaign</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.num}
                onClick={() => onNavigateToTab(step.tab)}
                className="group p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] hover:bg-[#15151C] transition-all text-left flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0A0A0C] border border-[#1F1F2A] text-red-400">
                      STEP {step.num}
                    </span>
                    <Icon className={`w-4 h-4 ${step.accent}`} />
                  </div>
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-[#52526B] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{step.title}</div>
                  <div className="text-[11px] text-[#8B8BA8] mt-0.5 truncate">{step.status}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* First-Run / Quick Brand & Audience Calibration Wizard */}
      {showWizard && (
        <BrandSetupWizard
          brandProfile={brandProfile}
          compact
          onCompleteSetup={(updatedBrand, discoveredAvatars, goToCampaigns) => {
            setIsBrandConfigured(true);
            setShowWizard(false);
            onCompleteBrandSetup(updatedBrand, discoveredAvatars, goToCampaigns);
          }}
          showNotificationToast={showNotificationToast}
        />
      )}

      {/* Main Workspace Grid: Saved Campaigns (Left 2 cols) + Target Audience Demographics (Right col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Campaign Projects + Upcoming Delivery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Campaigns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Your Campaigns ({campaigns.length})
                </h3>
              </div>
              <button
                onClick={onCreateCampaign}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Create Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campaigns.map((camp) => {
                const campPostsCount = posts.filter((p) => p.campaignId === camp.id).length;
                return (
                  <div
                    key={camp.id}
                    onClick={() => onOpenCampaign(camp.id)}
                    className="p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-red-500/60 transition-all cursor-pointer group flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            camp.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          {camp.status}
                        </span>
                        <span className="text-[10px] text-[#52526B] font-mono">
                          {campPostsCount} scheduled asset{campPostsCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {camp.title}
                      </h4>
                      <p className="text-[11px] text-[#8B8BA8] line-clamp-2 leading-relaxed">
                        {camp.goal}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#1F1F2A] flex items-center justify-between text-[11px]">
                      <span className="text-[#52526B] truncate max-w-[160px]">{camp.theme}</span>
                      <span className="text-red-400 font-semibold flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                        Open Studio <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Distribution Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Upcoming Distribution Queue
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('distribution')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                Open Distribution <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {posts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  onClick={() => onNavigateToTab('distribution')}
                  className="p-3.5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-[#2A2A38] transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post visual"
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#2A2A38]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#18181F] border border-[#2A2A38] flex items-center justify-center shrink-0 text-red-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {post.platform}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {post.hookAngle}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8B8BA8] line-clamp-1 mt-0.5">{post.content}</p>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 shrink-0">
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Brand Brain & Audience Demographics */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                Active Brand Brain
              </span>
              <button
                onClick={() => onNavigateToTab('brand_avatar')}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
              >
                Edit →
              </button>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">{brandProfile.name}</div>
              <div className="text-[11px] text-[#8B8BA8]">
                {brandProfile.targetIndustry} · {brandProfile.archetype}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {brandProfile.voiceAttributes.slice(0, 4).map((attr) => (
                <span
                  key={attr}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#0A0A0C] border border-[#2A2A38] text-slate-300"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Target Demographics
              </h3>
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
                  onNavigateToStudio('screenshot');
                }}
                className="p-3.5 rounded-2xl bg-[#111116] border border-[#1F1F2A] hover:border-amber-500/60 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={av.avatarImageUrl}
                      alt={av.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#2A2A38] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                        {av.name}
                      </h4>
                      <span className="text-[10px] text-[#8B8BA8] block truncate">
                        {av.roleTitle} · Ages {av.demographics?.ageRange || '24–40'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 shrink-0">
                    {av.matchScore || 95}%
                  </span>
                </div>

                {av.demographics?.geographicRegion && (
                  <div className="text-[10px] text-blue-300/90 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{av.demographics.geographicRegion}</span>
                  </div>
                )}

                <p className="text-[11px] text-[#8B8BA8] line-clamp-2 leading-relaxed">
                  {av.painPoints[0] || 'Looking for authentic, high-signal content'}
                </p>

                <div className="pt-2 border-t border-[#1F1F2A] flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                  <span>Build campaign for {av.name.split(' ')[0]} →</span>
                  <span className="uppercase text-[#52526B] font-mono">
                    {av.preferredPlatforms.slice(0, 3).join(' · ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
