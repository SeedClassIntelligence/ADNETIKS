/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Unified 4-Pillar Navigation Rail
 * Single source of truth for platform navigation:
 * Overview -> 1. Brand & Audience -> 2. Campaigns -> 3. Distribution -> 4. Signals -> AI & Connect
 */

import { useState } from 'react';
import AdnetiksLogo from './AdnetiksLogo';
import { UserRole } from '../types';
import {
  Home,
  Sparkles,
  Calendar,
  BarChart2,
  Users,
  Plug,
  Plus,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  onNewCampaignClick: () => void;
  brandName?: string;
  scheduledCount?: number;
  campaignCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentRole,
  onNewCampaignClick,
  brandName = 'ADNETIKS',
  scheduledCount = 0,
  campaignCount = 0,
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const primaryPillars = [
    {
      id: 'home',
      label: 'Overview',
      sublabel: 'Workspace home',
      icon: Home,
      step: null as string | null,
      badge: undefined as string | undefined,
    },
    {
      id: 'brand_avatar',
      label: 'Brand & Audience',
      sublabel: 'Voice & demographics',
      icon: Users,
      step: '01',
      badge: undefined as string | undefined,
    },
    {
      id: 'studio',
      label: 'Campaigns',
      sublabel: 'Ads, posts & AI video',
      icon: Sparkles,
      step: '02',
      badge: campaignCount > 0 ? `${campaignCount}` : undefined,
    },
    {
      id: 'distribution',
      label: 'Distribution',
      sublabel: 'Calendar & A/B tests',
      icon: Calendar,
      step: '03',
      badge: scheduledCount > 0 ? `${scheduledCount}` : undefined,
    },
    {
      id: 'signals',
      label: 'Analytics & Inbox',
      sublabel: 'Metrics, trends & DMs',
      icon: BarChart2,
      step: '04',
      badge: undefined as string | undefined,
    },
  ];

  const isPillarActive = (id: string) => {
    if (id === 'distribution') {
      return activeTab === 'distribution' || activeTab === 'scheduler' || activeTab === 'split_lab';
    }
    if (id === 'signals') {
      return activeTab === 'signals' || activeTab === 'analytics' || activeTab === 'service_agents';
    }
    if (id === 'studio') {
      return activeTab === 'studio' || activeTab === 'video_studio';
    }
    return activeTab === id;
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col justify-between border-r border-[#1F1F2A] bg-[#0A0A0C]/95 backdrop-blur-xl transition-all duration-300 select-none ${
        isHovered ? 'w-64 shadow-2xl shadow-red-950/20' : 'w-16'
      }`}
    >
      {/* Top Header / Brand Mark */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center px-3.5 border-b border-[#1F1F2A]/80">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 group focus:outline-none w-full"
            title="ADNETIKS Overview"
          >
            <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
              <AdnetiksLogo size={32} />
            </div>
            <div
              className={`overflow-hidden transition-all duration-200 flex flex-col text-left ${
                isHovered ? 'opacity-100 max-w-[175px]' : 'opacity-0 max-w-0'
              }`}
            >
              <span className="text-xs font-black tracking-widest uppercase text-white font-display leading-tight truncate">
                ADNETIKS
              </span>
              <span className="text-[9px] tracking-wider uppercase text-red-400 font-semibold truncate">
                {brandName} Workspace
              </span>
            </div>
          </button>
        </div>

        {/* Primary CTA: New Campaign */}
        <div className="p-2 border-b border-[#1F1F2A]/60">
          <button
            onClick={onNewCampaignClick}
            disabled={currentRole === 'analyst'}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs transition-all duration-200 shadow-md ${
              currentRole === 'analyst'
                ? 'bg-[#18181F] text-[#52526B] cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/30 active:scale-98'
            }`}
            title="Start a New Campaign"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-200 text-xs ${
                isHovered ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 hidden'
              }`}
            >
              New Campaign
            </span>
          </button>
        </div>

        {/* 4-Pillar Sequential Workflow Rail */}
        <nav className="p-2 space-y-1.5 overflow-y-auto scrollbar-none mt-2">
          {isHovered && (
            <div className="px-2.5 pb-1 text-[9px] font-bold tracking-widest text-[#52526B] uppercase font-display">
              Campaign Workflow
            </div>
          )}

          {primaryPillars.map((item) => {
            const active = isPillarActive(item.id);
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative group ${
                  active
                    ? 'bg-[#18181F] text-white border border-[#2A2A38] shadow-sm'
                    : 'text-[#8B8BA8] hover:text-white hover:bg-[#111116]'
                }`}
                title={`${item.step ? `${item.step}. ` : ''}${item.label}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-r-full shadow-sm shadow-red-500" />
                )}

                <div
                  className={`shrink-0 transition-colors ${
                    active ? 'text-red-500' : 'text-[#8B8BA8] group-hover:text-red-400'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                <div
                  className={`overflow-hidden whitespace-nowrap text-left transition-all duration-200 flex-1 min-w-0 ${
                    isHovered ? 'opacity-100 max-w-[165px]' : 'opacity-0 max-w-0'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {item.step && (
                      <span className="text-[9px] font-mono text-red-400/90 font-bold">
                        {item.step}
                      </span>
                    )}
                    <span className="font-semibold truncate">{item.label}</span>
                  </div>
                  <div className="text-[10px] text-[#52526B] truncate">{item.sublabel}</div>
                </div>

                {isHovered && item.badge && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-red-950/70 text-red-300 border border-red-800/60 font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility: AI Engine & Connectors + Role Status */}
      <div className="p-2 border-t border-[#1F1F2A]/80 space-y-1.5">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-medium transition-all relative group ${
            activeTab === 'integrations'
              ? 'bg-[#18181F] text-white border border-cyan-500/50'
              : 'text-[#8B8BA8] hover:text-white hover:bg-[#111116]'
          }`}
          title="AI Engines & Social Connectors"
        >
          <Plug
            className={`w-4 h-4 shrink-0 ${
              activeTab === 'integrations' ? 'text-cyan-400' : 'text-[#8B8BA8] group-hover:text-cyan-400'
            }`}
          />
          <span
            className={`overflow-hidden whitespace-nowrap text-left transition-all duration-200 ${
              isHovered ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'
            }`}
          >
            AI &amp; Connectors
          </span>
        </button>

        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#111116] border border-[#1F1F2A] transition-all ${
            isHovered ? 'justify-start' : 'justify-center'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center shrink-0 text-red-400">
            <Zap className="w-3.5 h-3.5 text-red-400" />
          </div>
          {isHovered && (
            <div className="overflow-hidden flex flex-col text-left min-w-0">
              <span className="text-[11px] font-bold text-white truncate capitalize">
                {currentRole} Mode
              </span>
              <span className="text-[9px] text-[#8B8BA8] truncate">
                BE-Agnostic Core
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
