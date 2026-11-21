/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Trending Hashtags & Sounds Monitor
 * Highlights spikes in social activity & suggests content themes for the upcoming week
 */

import { useState, useEffect } from 'react';
import { TrendingSocialActivity, SocialPlatform } from '../types';
import {
  Hash,
  Music2,
  TrendingUp,
  RefreshCw,
  Flame,
  Sparkles,
  ArrowRight,
  Radio,
  Calendar,
  Volume2,
  Filter,
  CheckCircle2,
  Activity,
  Zap,
} from 'lucide-react';

interface TrendingSocialMonitorProps {
  initialActivities: TrendingSocialActivity[];
  onDeployThemeToStudio: (theme: string, suggestedHashtags: string[]) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function TrendingSocialMonitor({
  initialActivities,
  onDeployThemeToStudio,
  showNotificationToast,
}: TrendingSocialMonitorProps) {
  const [activities, setActivities] = useState<TrendingSocialActivity[]>(initialActivities);
  const [filterType, setFilterType] = useState<'all' | 'hashtag' | 'sound'>('all');
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [autoPollActive, setAutoPollActive] = useState(true);

  // Suggested Strategic Themes for Upcoming Week derived from spikes
  const [weeklyThemes] = useState([
    {
      id: 'theme-1',
      title: 'Founder CAC Efficiency & Autonomous Delivery',
      hookAngle: 'Hard Metric Teardown & Agency Elimination',
      coreAudience: 'Tyler Vance (Technical Founder)',
      suggestedHashtags: ['#CACReduction', '#CreatorVelocity', '#B2BMarketing', '#GrowthStrategy'],
      spikingSignal: '+214% Spike in #CACReduction discussions on LinkedIn & X',
      projectedLift: '+42% CTR Lift',
      recommendedFormat: 'LinkedIn Hard Metric Post + TikTok 3-Beat Demo',
    },
    {
      id: 'theme-2',
      title: 'Brand Voice Integrity vs. AI Slop',
      hookAngle: 'Contrarian Narrative on Psychological Avatar Calibration',
      coreAudience: 'Maya Lin (Brand Strategist)',
      suggestedHashtags: ['#AvatarTargeting', '#BrandStrategy', '#MarketingLeadership'],
      spikingSignal: '+156% Spike in #AvatarTargeting on X / Twitter',
      projectedLift: '+38% Reposts',
      recommendedFormat: 'X Framework Thread + Instagram Tactical Carousel',
    },
    {
      id: 'theme-3',
      title: 'Fast-Cut High-Performance Automation Teardown',
      hookAngle: '0-3s Relatable Shock Hook with Phonk Synthwave Audio',
      coreAudience: 'Tyler Vance & Maya Lin',
      suggestedHashtags: ['#CreatorVelocity', '#TechTools', '#FounderTok'],
      spikingSignal: '+184% Momentum on Phonk Synthwave (142 BPM) on TikTok',
      projectedLift: '+65% 6s Retention',
      recommendedFormat: 'TikTok 9:16 Video Ad with Split Screen',
    },
  ]);

  // Periodic automatic fetch simulation
  useEffect(() => {
    if (!autoPollActive) return;

    const interval = setInterval(() => {
      // Simulate micro-fluctuations in velocity
      setActivities((prev) =>
        prev.map((item) => {
          const currentPct = parseInt(item.velocityChange.replace(/\D/g, '')) || 150;
          const delta = Math.floor(Math.random() * 9) - 3;
          const newPct = Math.max(80, currentPct + delta);
          return {
            ...item,
            velocityChange: `+${newPct}%`,
          };
        })
      );
      setLastUpdated('Updated just now');
    }, 25000);

    return () => clearInterval(interval);
  }, [autoPollActive]);

  // Manual refresh / live scan
  const handleFetchLatest = () => {
    setIsFetching(true);
    setTimeout(() => {
      // Inject or refresh data
      const newTrend: TrendingSocialActivity = {
        id: `trend-${Date.now()}`,
        tagOrSound: Math.random() > 0.5 ? '#AutonomousGrowth' : 'Cybernetic Pulse (128 BPM)',
        type: Math.random() > 0.5 ? 'hashtag' : 'sound',
        platform: 'linkedin',
        volume: '62.4K interactions',
        velocityChange: '+310%',
        sentiment: 'Viral',
        suggestedTheme: 'Autonomous Growth vs Manual Social Burnout',
        hookRationale: 'Breakout spike detected across marketing leadership feeds discussing autonomous social infrastructure.',
        targetAvatarName: 'Tyler Vance',
        projectedLift: '+48% Engagement',
      };

      setActivities((prev) => [newTrend, ...prev.slice(0, 5)]);
      setIsFetching(false);
      setLastUpdated('Updated just now');
      showNotificationToast(
        'Trending Activity Refreshed',
        `Discovered new breakout spike: ${newTrend.tagOrSound} (${newTrend.velocityChange} surge)`
      );
    }, 850);
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
      
      {/* Header with Live Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Trending Hashtags & Sounds Monitor
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE RADAR</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time viral velocity detection across LinkedIn, TikTok, X, and Instagram. Curates high-impact themes for upcoming campaigns.
          </p>
        </div>

        {/* Action Buttons & Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            {lastUpdated}
          </div>

          <button
            type="button"
            onClick={() => setAutoPollActive(!autoPollActive)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              autoPollActive
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle periodic auto-polling"
          >
            <Radio className={`w-3.5 h-3.5 ${autoPollActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline">{autoPollActive ? 'Auto-Sync On' : 'Paused'}</span>
          </button>

          <button
            type="button"
            disabled={isFetching}
            onClick={handleFetchLatest}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm shadow-red-900/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Scanning Feeds...' : 'Fetch Spikes'}</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS & VELOCITY SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Activity ({activities.length})
          </button>
          <button
            onClick={() => setFilterType('hashtag')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
              filterType === 'hashtag' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3 h-3 text-blue-400" />
            Hashtags
          </button>
          <button
            onClick={() => setFilterType('sound')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
              filterType === 'sound' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music2 className="w-3 h-3 text-pink-400" />
            Audio & Sounds
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2 px-2">
          <Activity className="w-3.5 h-3.5 text-red-400" />
          <span>Avg Momentum Surge: <strong className="text-emerald-400 font-mono font-bold">+184.4%</strong></span>
        </div>
      </div>

      {/* DETECTED SPIKES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition-all space-y-2.5 group flex flex-col justify-between"
          >
            <div className="space-y-2">
              {/* Type Badge & Velocity Spike */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                  {activity.type === 'hashtag' ? (
                    <span className="p-1 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400">
                      <Hash className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded bg-pink-950/60 border border-pink-800/60 text-pink-400">
                      <Music2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="truncate">{activity.tagOrSound}</span>
                </span>

                <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-400 whitespace-nowrap">
                  {activity.velocityChange}
                </span>
              </div>

              {/* Volume & Platform */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="capitalize text-slate-300 font-sans font-semibold">{activity.platform}</span>
                <span>·</span>
                <span>{activity.volume}</span>
                <span>·</span>
                <span className="text-red-400 font-bold">{activity.sentiment}</span>
              </div>

              {/* Rationale */}
              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                {activity.hookRationale}
              </p>
            </div>

            {/* Target Avatar & Projected Lift Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                Resonance: <strong className="text-slate-200">{activity.targetAvatarName}</strong>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {activity.projectedLift}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* SUGGESTED RELEVANT CONTENT THEMES FOR THE UPCOMING WEEK */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              AI-Synthesized Content Themes for the Upcoming Week
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Calibrated to Spiking Signals</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {weeklyThemes.map((theme) => (
            <div
              key={theme.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 group hover:border-red-500/50 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors leading-snug">
                    {theme.title}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-[10px] text-red-400 font-mono shrink-0">
                    {theme.projectedLift}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Hook Strategy:</strong> {theme.hookAngle}
                </p>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-850 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Signal Source:</div>
                  <div className="text-slate-300 text-[10px] leading-tight">{theme.spikingSignal}</div>
                </div>

                {/* Hashtags preview */}
                <div className="flex flex-wrap gap-1">
                  {theme.suggestedHashtags.map((h, i) => (
                    <span key={i} className="text-[10px] text-blue-400 bg-blue-950/30 px-1.5 py-0.5 rounded font-mono">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deploy CTA */}
              <button
                type="button"
                onClick={() => onDeployThemeToStudio(theme.title, theme.suggestedHashtags)}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <span>Deploy Theme to Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
