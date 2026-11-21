/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Studio Dock & Navigation Rail
 * Custom creative suite navigation for creators, artists, and brand builders.
 */

import { useState } from 'react';
import AdnetiksLogo from './AdnetiksLogo';
import { UserRole } from '../types';
import {
  Home,
  Sparkles,
  Video,
  Calendar,
  BarChart2,
  MessageCircle,
  Sliders,
  GitBranch,
  Plug,
  Plus,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  onNewCampaignClick: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentRole,
  onNewCampaignClick,
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const navSections = [
    {
      group: 'CREATE',
      items: [
        { id: 'home', label: 'Command Hub', icon: Home, badge: 'Live' },
        { id: 'studio', label: 'Create Studio', icon: Sparkles, highlight: true },
        { id: 'video_studio', label: 'Adnetiks Video', icon: Video },
      ],
    },
    {
      group: 'DELIVERY',
      items: [
        { id: 'scheduler', label: 'Smart Queue', icon: Calendar },
        { id: 'split_lab', label: 'A/B Testing Lab', icon: GitBranch },
        { id: 'service_agents', label: 'Fan & DM Engage', icon: MessageCircle },
      ],
    },
    {
      group: 'STRATEGY',
      items: [
        { id: 'brand_avatar', label: 'Brand & Avatars', icon: Sliders },
        { id: 'analytics', label: 'Growth Analytics', icon: BarChart2 },
        { id: 'integrations', label: 'Platform Connect', icon: Plug },
      ],
    },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col justify-between border-r border-[#1F1F2A] bg-[#0A0A0C]/95 backdrop-blur-xl transition-all duration-300 select-none ${
        isHovered ? 'w-60 shadow-2xl shadow-red-950/20' : 'w-16'
      }`}
    >
      {/* Top Header / Brand Mark */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center px-3.5 border-b border-[#1F1F2A]/80">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 group focus:outline-none w-full"
            title="ADNETIKS Command Hub"
          >
            <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
              <AdnetiksLogo size={32} />
            </div>
            <div
              className={`overflow-hidden transition-all duration-200 flex flex-col text-left ${
                isHovered ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'
              }`}
            >
              <span className="text-xs font-black tracking-widest uppercase text-white font-display leading-tight">
                ADNETIKS
              </span>
              <span className="text-[9px] tracking-wider uppercase text-red-500 font-semibold">
                Autonomous Studio
              </span>
            </div>
          </button>
        </div>

        {/* Quick Create Button */}
        <div className="p-2 border-b border-[#1F1F2A]/60">
          <button
            onClick={onNewCampaignClick}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-red-900/30 active:scale-98"
            title="Create New Campaign Asset"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-200 text-xs ${
                isHovered ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 hidden'
              }`}
            >
              New Asset
            </span>
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="p-2 space-y-4 overflow-y-auto scrollbar-none mt-1">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {isHovered && (
                <div className="px-2.5 py-1 text-[9px] font-bold tracking-widest text-[#52526B] uppercase font-display">
                  {sec.group}
                </div>
              )}
              {sec.items.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative group ${
                      isActive
                        ? 'bg-[#18181F] text-white border border-[#2A2A38] shadow-sm'
                        : 'text-[#8B8BA8] hover:text-white hover:bg-[#111116]'
                    }`}
                    title={item.label}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-red-600 rounded-r-full shadow-sm shadow-red-500" />
                    )}

                    <div
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'text-red-500'
                          : 'text-[#8B8BA8] group-hover:text-red-400'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <span
                      className={`overflow-hidden whitespace-nowrap text-left transition-all duration-200 ${
                        isHovered ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Small Badge if expanded */}
                    {isHovered && item.badge && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 font-bold uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Profile / Mode Indicator */}
      <div className="p-2 border-t border-[#1F1F2A]/80">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#111116] border border-[#1F1F2A] transition-all ${
            isHovered ? 'justify-start' : 'justify-center'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center shrink-0 text-red-400 font-bold text-xs">
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
