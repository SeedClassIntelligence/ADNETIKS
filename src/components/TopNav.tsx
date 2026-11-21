/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Studio Top Header
 * Follows Top Bar Contract: Brand Symbol & Context - Nav Links - Actions & RBAC
 */

import { useState } from 'react';
import AdnetiksLogo from './AdnetiksLogo';
import { UserRole } from '../types';
import {
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  User,
  Plus,
  CheckCircle2,
  Sparkles,
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
}: TopNavProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; desc: string; badgeColor: string }> = {
    admin: { label: 'Admin / Owner', desc: 'Full system control, approvals & publishing', badgeColor: 'text-red-400 bg-red-950/60 border-red-800/60' },
    creator: { label: 'Content Creator', desc: 'Drafts campaigns, generates variants', badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/60' },
    approver: { label: 'Client Approver', desc: 'Reviews copy, approves schedules', badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/60' },
    analyst: { label: 'Data Analyst', desc: 'Read-only metrics, reports & heatmaps', badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' },
  };

  const navItems = [
    { id: 'home', label: 'Command Hub' },
    { id: 'studio', label: 'Create Studio' },
    { id: 'video_studio', label: 'Video Studio' },
    { id: 'scheduler', label: 'Smart Queue' },
    { id: 'split_lab', label: 'A/B Lab' },
    { id: 'service_agents', label: 'Fan Engage' },
    { id: 'brand_avatar', label: 'Brand & Voice' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'integrations', label: 'Connect' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#1F1F2A] bg-[#0A0A0C]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-6">
        
        {/* Zone 1: Pure Brand Symbol */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 group focus:outline-none p-1 transition-transform hover:scale-105"
            title="ADNETIKS Command Hub"
          >
            <AdnetiksLogo size={30} />
            <span className="text-sm font-black tracking-wider uppercase text-white font-display hidden sm:inline">
              ADNETIKS
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-Line, Studio Style) */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#18181F] text-red-400 border border-[#2A2A38] shadow-sm shadow-red-950/20'
                    : 'text-[#8B8BA8] hover:text-white hover:bg-[#111116]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Role-Based Access Control */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Interactive Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${roleLabels[currentRole].badgeColor}`}
              title="Switch user role to test RBAC permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{roleLabels[currentRole].label}</span>
              <span className="sm:hidden capitalize">{currentRole}</span>
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#111116] border border-[#2A2A38] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-2.5 py-1.5 border-b border-[#1F1F2A] mb-1">
                  <span className="text-[10px] font-bold text-[#8B8BA8] uppercase tracking-wider font-display">
                    Role Permissions (RBAC)
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

          {/* Notifications Button with Push Counter */}
          <button
            onClick={openNotifications}
            className="relative p-2 text-[#8B8BA8] hover:text-white hover:bg-[#18181F] rounded-xl transition-colors border border-transparent hover:border-[#2A2A38]"
            title="Notification Center & Alerts"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0A0A0C]" />
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-[#8B8BA8] hover:text-white hover:bg-[#18181F] rounded-xl transition-colors border border-transparent hover:border-[#2A2A38]"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onNewCampaignClick}
            disabled={currentRole === 'analyst'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-md transition-all whitespace-nowrap ${
              currentRole === 'analyst'
                ? 'bg-[#18181F] text-[#52526B] cursor-not-allowed opacity-60'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40 active:scale-95'
            }`}
            title={currentRole === 'analyst' ? 'Analysts have view-only access' : 'Create new social campaign'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Asset</span>
          </button>

        </div>
      </div>

      {/* Mobile Nav Scroller */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none border-t border-[#1F1F2A] mt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-[#111116] text-[#8B8BA8] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
