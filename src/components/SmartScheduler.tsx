/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Smart AI Scheduler & Automated Multi-Channel Queue Dispatcher
 */

import { useState } from 'react';
import { PostVariant, PostStatus, SocialPlatform, UserRole } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Globe,
  Layers,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';

interface SmartSchedulerProps {
  posts: PostVariant[];
  setPosts: (posts: PostVariant[]) => void;
  userRole: UserRole;
  showNotificationToast: (title: string, message: string) => void;
}

export default function SmartScheduler({
  posts,
  setPosts,
  userRole,
  showNotificationToast,
}: SmartSchedulerProps) {
  const [viewMode, setViewMode] = useState<'queue' | 'calendar'>('queue');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);

  // Status Badge Styling & Labels
  const statusStyles: Record<PostStatus, { label: string; color: string; border: string }> = {
    draft: { label: 'Draft', color: 'text-slate-400 bg-slate-900', border: 'border-slate-800' },
    in_review: { label: 'In Review', color: 'text-amber-400 bg-amber-950/40', border: 'border-amber-800/50' },
    approved: { label: 'Approved', color: 'text-blue-400 bg-blue-950/40', border: 'border-blue-800/50' },
    scheduled: { label: 'Scheduled', color: 'text-purple-400 bg-purple-950/40', border: 'border-purple-800/50' },
    published: { label: 'Published', color: 'text-emerald-400 bg-emerald-950/40', border: 'border-emerald-800/50' },
    failed: { label: 'Failed', color: 'text-red-400 bg-red-950/40', border: 'border-red-800/50' },
  };

  const filteredPosts = posts.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || p.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  // AI Peak Hour Re-allocation
  const handleAutoOptimizeSlots = () => {
    const optimalSlots = ['08:30:00Z', '12:15:00Z', '17:45:00Z', '19:30:00Z'];
    const updated = posts.map((p, idx) => {
      if (p.status === 'draft' || p.status === 'approved' || p.status === 'scheduled') {
        const slot = optimalSlots[idx % optimalSlots.length];
        const dateStr = new Date(Date.now() + (idx + 1) * 43200000).toISOString().split('T')[0];
        return {
          ...p,
          scheduledTime: `${dateStr}T${slot}`,
          status: p.status === 'draft' ? 'scheduled' : p.status,
        };
      }
      return p;
    });

    setPosts(updated);
    showNotificationToast(
      'AI Peak-Hour Optimization Complete',
      'All posts calibrated to peak avatar engagement hours (08:30, 12:15, 17:45).'
    );
  };

  // Approval Gate Handler
  const handleUpdateStatus = (postId: string, newStatus: PostStatus) => {
    const updated = posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p));
    setPosts(updated);

    if (newStatus === 'approved') {
      showNotificationToast('Post Approved', 'Schedule locked and armed for automated publishing.');
    } else if (newStatus === 'scheduled') {
      showNotificationToast('Post Scheduled', 'Post queued into live distribution pipeline.');
    }
  };

  // Simulate Live Dispatch Execution
  const handleSimulateLiveDispatch = () => {
    if (isSimulatingDispatch) return;
    setIsSimulatingDispatch(true);
    setDispatchProgress(10);

    const interval = setInterval(() => {
      setDispatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulatingDispatch(false);

          // Update scheduled posts to published
          const updated = posts.map((p) => {
            if (p.status === 'scheduled' || p.status === 'approved') {
              return {
                ...p,
                status: 'published' as PostStatus,
                metrics: {
                  ...p.metrics,
                  impressions: Math.floor(Math.random() * 4000) + 1200,
                  clicks: Math.floor(Math.random() * 250) + 60,
                  likes: Math.floor(Math.random() * 180) + 40,
                },
              };
            }
            return p;
          });
          setPosts(updated);

          showNotificationToast(
            'Live Dispatch Simulation Complete',
            'All queued posts dispatched through platform webhooks (HTTP 200 OK).'
          );
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Group by day for calendar view
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-red-500" />
            Smart AI Scheduler & Automated Delivery Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Orchestrate multi-channel publishing cadence, manage client approvals, and execute automated dispatch.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          
          {/* Auto-Optimize Slots */}
          <button
            onClick={handleAutoOptimizeSlots}
            disabled={userRole === 'analyst'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            title="Automatically assign posts to peak avatar engagement times"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Peak-Hour Optimizer</span>
            <span className="sm:hidden">Optimize</span>
          </button>

          {/* Simulate Live Dispatch */}
          <button
            onClick={handleSimulateLiveDispatch}
            disabled={isSimulatingDispatch || userRole === 'analyst'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Simulate automated webhook dispatch across social networks"
          >
            {isSimulatingDispatch ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching ({dispatchProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Live Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Dispatch Progress Banner (when active) */}
      {isSimulatingDispatch && (
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-4 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Automated Multi-Channel Dispatch in Progress
            </span>
            <span className="font-mono font-bold text-red-400">{dispatchProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-red-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${dispatchProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Payload: JSON over HTTPS Webhooks</span>
            <span>Target Gateways: LinkedIn API, X v2 API, Instagram Graph API</span>
          </div>
        </div>
      )}

      {/* View Mode & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        
        {/* View Switcher: Queue vs Calendar */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('queue')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'queue' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Queue Timeline ({filteredPosts.length})
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
            Weekly Calendar
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All ({posts.length})</option>
              <option value="draft">Drafts</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Platform:</span>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer capitalize"
            >
              <option value="all">All Channels</option>
              <option value="linkedin">LinkedIn</option>
              <option value="x">X / Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="threads">Threads</option>
            </select>
          </div>

        </div>

      </div>

      {/* VIEW 1: QUEUE TIMELINE VIEW */}
      {viewMode === 'queue' && (
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">No posts matching active filter</p>
              <p className="text-xs text-slate-500">Generate new posts in the Creative Studio or clear filters.</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const statusCfg = statusStyles[post.status];
              const dateDisplay = post.scheduledTime
                ? new Date(post.scheduledTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Unscheduled';

              return (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-slate-700 transition-all"
                >
                  {/* Left: Platform & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <AdnetiksLogo size={22} />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white capitalize">{post.platform}</span>
                        <span className="text-[11px] font-semibold text-slate-400">· {post.variantLabel}</span>
                        <span className="text-[11px] text-slate-500">· {post.hookAngle}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.color} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateDisplay}
                        </span>
                        {post.status === 'published' && (
                          <span>
                            {post.metrics.impressions.toLocaleString()} views · {post.metrics.clicks} clicks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & RBAC Gate */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80 w-full md:w-auto justify-end">
                    
                    {/* Role-Based Approval Gates */}
                    {post.status === 'in_review' && (userRole === 'admin' || userRole === 'approver') && (
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Schedule</span>
                      </button>
                    )}

                    {post.status === 'draft' && (
                      <button
                        onClick={() => handleUpdateStatus(post.id, userRole === 'creator' ? 'in_review' : 'scheduled')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                      >
                        <span>{userRole === 'creator' ? 'Submit for Review' : 'Queue to Schedule'}</span>
                      </button>
                    )}

                    {post.status === 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'scheduled')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        <span>Lock into Queue</span>
                      </button>
                    )}

                    {post.status === 'published' && (
                      <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                      </span>
                    )}

                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: WEEKLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Week of November 2, 2026 — Multi-Channel Delivery Matrix
            </span>
            <span className="text-xs text-slate-400 font-mono">Synced to Active Avatar Slots</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {daysOfWeek.map((day, dIdx) => {
              const dayPosts = posts.filter((_, idx) => idx % 7 === dIdx);

              return (
                <div key={day} className="bg-slate-950 rounded-xl border border-slate-800/80 p-3 flex flex-col space-y-2 min-h-[180px]">
                  <div className="border-b border-slate-800/80 pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{day.slice(0, 3)}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Nov {2 + dIdx}</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {dayPosts.map((p) => {
                      const statusCfg = statusStyles[p.status];
                      return (
                        <div
                          key={p.id}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold uppercase text-red-400">{p.platform}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${statusCfg.color} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                            {p.content}
                          </p>
                        </div>
                      );
                    })}

                    {dayPosts.length === 0 && (
                      <div className="text-[11px] text-slate-600 italic text-center pt-8">
                        No posts scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
