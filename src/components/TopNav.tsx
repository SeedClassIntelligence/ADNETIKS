/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Minimal Contextual Studio Header
 * Displays active workflow pillar, active Brand Brain pill, RBAC switcher, and primary CTA.
 * Navigation lives in one place (Sidebar) — eliminating competing duplicate nav bars.
 */

import { useState } from 'react';
import { UserRole } from '../types';
import {
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  User,
  Plus,
  CheckCircle2,
  ChevronRight,
  Users,
} from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  unreadCount: number;
  openNotifications: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onNewCampaignClick: () => void;
  brandName?: string;
  brandArchetype?: string;
  activeCampaignTitle?: string;
}

export default function TopNav({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  unreadCount,
  openNotifications,
  isDark,
  toggleTheme,
  onNewCampaignClick,
  brandName = 'ADNETIKS',
  brandArchetype = 'The Catalyst',
  activeCampaignTitle,
}: TopNavProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; desc: string; badgeColor: string }> = {
    admin: { label: 'Owner', desc: 'Full control, brand calibration & publishing', badgeColor: 'text-red-400 bg-red-950/60 border-red-800/60' },
    creator: { label: 'Creator', desc: 'Drafts campaigns & generates assets', badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/60' },
    approver: { label: 'Approver', desc: 'Reviews copy & approves schedule', badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/60' },
    analyst: { label: 'Analyst', desc: 'Read-only metrics & reports', badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' },
  };

  const pillarMeta: Record<string, { step?: string; title: string; subtitle: string }> = {
    home: { title: 'Workspace Overview', subtitle: 'Brand Brain, Campaigns & Delivery at a glance' },
    brand_avatar: { step: '01', title: 'Brand & Audience', subtitle: 'Voice identity, target demographics & buyer personas' },
    studio: { step: '02', title: 'Campaign Studio', subtitle: activeCampaignTitle || 'Create display ads, posts, carousels & AI videos' },
    video_studio: { step: '02', title: 'Campaign Studio · Video', subtitle: '9:16 AI Video & Camera Production' },
    distribution: { step: '03', title: 'Distribution', subtitle: 'Smart Calendar Queue & A/B Hook Experiments' },
    scheduler: { step: '03', title: 'Distribution', subtitle: 'Smart Calendar Queue & A/B Hook Experiments' },
    split_lab: { step: '03', title: 'Distribution', subtitle: 'Smart Calendar Queue & A/B Hook Experiments' },
    signals: { step: '04', title: 'Analytics & Inbox', subtitle: 'Live attribution, growth analytics & fan replies' },
    analytics: { step: '04', title: 'Analytics & Inbox', subtitle: 'Live attribution, growth analytics & fan replies' },
    service_agents: { step: '04', title: 'Analytics & Inbox', subtitle: 'Live attribution, growth analytics & fan replies' },
    integrations: { title: 'AI Engines & Connectors', subtitle: 'Plug in any LLM, code assistant, or publishing channel' },
  };

  const currentMeta = pillarMeta[activeTab] || pillarMeta.home;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#1F1F2A] bg-[#0A0A0C]/90 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center transition-colors">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3">
        {/* Left: Active Pillar Context Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {currentMeta.step && (
              <span className="px-2 py-0.5 rounded-md bg-red-950/70 border border-red-800/60 text-red-300 text-[10px] font-mono font-bold shrink-0">
                STEP {currentMeta.step}
              </span>
            )}
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight whitespace-nowrap shrink-0">
              {currentMeta.title}
            </h1>
            <ChevronRight className="w-3.5 h-3.5 text-[#52526B] hidden xl:block shrink-0" />
            <span className="text-xs text-[#8B8BA8] truncate hidden xl:block max-w-sm">
              {currentMeta.subtitle}
            </span>
          </div>
        </div>

        {/* Right: Active Brand Pill + Role + Utilities + New Campaign CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Brand Brain Switcher Pill */}
          <button
            onClick={() => setActiveTab('brand_avatar')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111116] hover:bg-[#18181F] border border-[#2A2A38] text-xs transition-all"
            title="Edit your Brand Voice & Target Demographics"
          >
            <Users className="w-3.5 h-3.5 text-red-400" />
            <span className="font-bold text-white max-w-[120px] truncate">{brandName}</span>
            <span className="text-[10px] text-[#8B8BA8] hidden lg:inline">· {brandArchetype}</span>
          </button>

          {/* Compact Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${roleLabels[currentRole].badgeColor}`}
              title="Switch workspace role"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{roleLabels[currentRole].label}</span>
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#111116] border border-[#2A2A38] rounded-2xl shadow-2xl p-2 z-50">
                <div className="px-2.5 py-1.5 border-b border-[#1F1F2A] mb-1">
                  <span className="text-[10px] font-bold text-[#8B8BA8] uppercase tracking-wider">
                    Workspace Role
                  </span>
                </div>
                {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setCurrentRole(role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-start justify-between gap-2 ${
                      currentRole === role ? 'bg-[#18181F] text-white border border-[#2A2A38]' : 'text-[#8B8BA8] hover:bg-[#18181F] hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#52526B]" />
                        {roleLabels[role].label}
                      </div>
                      <div className="text-[11px] text-[#52526B] mt-0.5 leading-snug">
                        {roleLabels[role].desc}
                      </div>
                    </div>
                    {currentRole === role && <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            onClick={openNotifications}
            className="relative p-2 text-[#8B8BA8] hover:text-white hover:bg-[#18181F] rounded-xl transition-colors border border-transparent hover:border-[#2A2A38]"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0A0A0C]" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-[#8B8BA8] hover:text-white hover:bg-[#18181F] rounded-xl transition-colors border border-transparent hover:border-[#2A2A38]"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary CTA */}
          <button
            onClick={onNewCampaignClick}
            disabled={currentRole === 'analyst'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-md transition-all whitespace-nowrap ${
              currentRole === 'analyst'
                ? 'bg-[#18181F] text-[#52526B] cursor-not-allowed opacity-60'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40 active:scale-95'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>
    </header>
  );
}
