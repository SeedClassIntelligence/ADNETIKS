/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS TikTok Creative Studio & Ad Attribution Center
 * Inspires TikTok-native video ads with trending sounds, 3-beat storyboarding, interactive 9:16 simulator, and ROAS pixel metrics.
 */

import { useState, useEffect } from 'react';
import {
  TrendingSound,
  TikTokVideoTemplate,
  TikTokAdCampaignMetrics,
  TikTokStoryboardBeat,
  UserRole,
} from '../types';
import {
  Video,
  Music,
  Hash,
  Play,
  Pause,
  Sparkles,
  BarChart3,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Disc,
  DollarSign,
  ArrowRight,
  Layers,
  Copy,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';

interface TikTokCreativeStudioProps {
  trendingSounds: TrendingSound[];
  templates: TikTokVideoTemplate[];
  adMetrics: TikTokAdCampaignMetrics;
  onSendScriptToQueue: (scriptTitle: string, scriptContent: string) => void;
  userRole: UserRole;
  showNotificationToast: (title: string, message: string) => void;
}

export default function TikTokCreativeStudio({
  trendingSounds,
  templates,
  adMetrics,
  onSendScriptToQueue,
  userRole,
  showNotificationToast,
}: TikTokCreativeStudioProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [selectedSoundId, setSelectedSoundId] = useState<string>(trendingSounds[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const activeSound = trendingSounds.find((s) => s.id === selectedSoundId) || trendingSounds[0];

  // Simulated 9:16 video playback ticker through beats (Beat 1: 3s, Beat 2: 9s, Beat 3: 3s)
  useEffect(() => {
    let timer: any;
    if (isPlaying && activeTemplate) {
      timer = setInterval(() => {
        setCurrentBeatIndex((prev) => (prev + 1) % activeTemplate.beats.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeTemplate]);

  const activeBeat = activeTemplate?.beats[currentBeatIndex] || activeTemplate?.beats[0];

  const handleExportScript = () => {
    if (!activeTemplate) return;
    const fullScript = activeTemplate.beats
      .map((b) => `[${b.timing}] ${b.beatTitle}\nVisual: ${b.visualDirection}\nAudio: "${b.spokenAudio}"\nOverlay: ${b.onScreenText}`)
      .join('\n\n');

    onSendScriptToQueue(activeTemplate.title, fullScript);
    showNotificationToast(
      'TikTok Script Exported to Queue',
      `Locked 3-beat video script for "${activeTemplate.title}" into campaign scheduler.`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ADNETIKS Video Studio & Ad Attribution Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build high-converting native short-form video ads with trending commercial audio, 3-beat storyboarding, and multi-network ROAS tracking.
          </p>
        </div>

        {/* Ad ROAS Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 px-3.5 rounded-2xl self-start sm:self-auto">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Attributed ROAS</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{adMetrics.roas}x Return</span>
          </div>
        </div>
      </div>

      {/* TOP STRIP: TRENDING SOUNDS & HASHTAG RADAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              ADNETIKS Audio Radar — Trending Commercial Audio & Viral Sounds
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Commercial Music Library (Royalty-Cleared for Brand Ads)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trendingSounds.map((sound) => {
            const isSelected = sound.id === selectedSoundId;
            return (
              <div
                key={sound.id}
                onClick={() => setSelectedSoundId(sound.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500/80 ring-1 ring-cyan-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-800/60 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{sound.title}</div>
                      <div className="text-[10px] text-slate-400">{sound.artist}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                    {sound.momentumScore}% Viral
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                  {sound.recommendedVibe}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  <span>{sound.usageCount}</span>
                  <span>BPM: {sound.bpm} · {sound.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN: 9:16 NATIVE SIMULATOR & STORYBOARD EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive 9:16 Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="w-full max-w-[320px] bg-slate-950 rounded-[40px] border-4 border-slate-800 shadow-2xl p-2 relative overflow-hidden ring-1 ring-slate-700">
            
            {/* Phone Speaker Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-slate-950 block" />
            </div>

            {/* Video Viewport (9:16 Ratio) */}
            <div className="relative aspect-[9/16] rounded-[32px] overflow-hidden bg-slate-900 flex flex-col justify-between p-4">
              
              {/* Background Video Simulator Image */}
              <img
                src={activeTemplate.previewImageUrl}
                alt="Video Preview"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105 filter brightness-95' : 'scale-100 filter brightness-85'
                }`}
              />

              {/* Scrim Overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Top Bar inside Phone */}
              <div className="relative z-20 flex items-center justify-between text-white text-xs pt-4 font-semibold">
                <span className="opacity-80">Following</span>
                <span className="border-b-2 border-white pb-0.5">For You</span>
                <span className="opacity-80">Search</span>
              </div>

              {/* Central Play/Pause Trigger */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 z-20 flex items-center justify-center m-auto w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm text-white hover:scale-110 transition-transform"
                title={isPlaying ? 'Pause simulation' : 'Play video simulation'}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              {/* On-Screen Timed Text Overlay (Active Beat) */}
              <div className="relative z-20 my-auto text-center px-2">
                <div className="inline-block bg-black/70 backdrop-blur-md text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-white/20 shadow-xl animate-in zoom-in-95 duration-200">
                  {activeBeat.onScreenText}
                </div>
              </div>

              {/* Bottom & Side UI Overlays */}
              <div className="relative z-20 flex items-end justify-between gap-3 text-white">
                
                {/* Left Side: Caption & Audio Info */}
                <div className="space-y-1.5 flex-1 min-w-0 pb-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AdnetiksLogo size={16} />
                    <span>adnetiks_ads</span>
                    <span className="text-[10px] text-cyan-400 font-normal">· Sponsored</span>
                  </div>

                  <p className="text-[11px] text-slate-200 leading-snug line-clamp-2">
                    {activeBeat.spokenAudio}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono truncate">
                    <Music className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{activeSound.title} — {activeSound.artist}</span>
                  </div>
                </div>

                {/* Right Side: Native Reaction Buttons */}
                <div className="flex flex-col items-center gap-3 shrink-0 text-center text-[10px]">
                  <div className="w-8 h-8 rounded-full border border-white overflow-hidden mb-1">
                    <img src="/src/assets/images/avatar_tech_founder_1793456642984.jpg" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <Heart className="w-5 h-5 text-red-500 fill-current mx-auto" />
                    <span>84.2K</span>
                  </div>
                  <div>
                    <MessageCircle className="w-5 h-5 mx-auto" />
                    <span>1,420</span>
                  </div>
                  <div>
                    <Bookmark className="w-5 h-5 mx-auto text-amber-400 fill-current" />
                    <span>12.8K</span>
                  </div>
                  <div>
                    <Share2 className="w-5 h-5 mx-auto" />
                    <span>Share</span>
                  </div>
                  <div className={`w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                    <Disc className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

              </div>

            </div>

          </div>

          <div className="text-center text-xs text-slate-500 mt-3 font-mono">
            Beat {currentBeatIndex + 1} of 3 ({activeBeat.timing}) · Click center to toggle preview
          </div>

        </div>

        {/* Right Column: 3-Beat Storyboarder & Ad Pixel Center (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Template Selection Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Customizable Ready-to-Use Video Templates
              </span>
              <span className="text-xs text-cyan-400 font-mono">100% Native Structure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setCurrentBeatIndex(0);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500/80 ring-1 ring-cyan-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block font-mono">
                      {tpl.category}
                    </span>
                    <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                      {tpl.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Beat Script Storyboard Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  3-Beat Storyboard: {activeTemplate.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Engineered for maximum 3-second hook retention and conversion velocity.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportScript}
                disabled={userRole === 'analyst'}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Export to Queue</span>
              </button>
            </div>

            <div className="space-y-3">
              {activeTemplate.beats.map((beat, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentBeatIndex(idx)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                    currentBeatIndex === idx
                      ? 'bg-slate-950 border-cyan-500/80 ring-1 ring-cyan-500/40 text-white'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-cyan-400">{beat.beatTitle}</span>
                    <span className="text-[11px] text-slate-500 font-bold">{beat.timing}</span>
                  </div>

                  <div className="text-slate-200 font-semibold text-xs">
                    Audio Script: <span className="text-slate-100 italic">&quot;{beat.spokenAudio}&quot;</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Visual Direction: {beat.visualDirection}</span>
                    <span className="text-amber-400 font-mono font-medium">Text: {beat.onScreenText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TIKTOK PIXEL & ROAS ATTRIBUTION CENTER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  TikTok Ad Manager & Pixel Attribution Center
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Web attribution tracking Return on Ad Spend (ROAS) and full-funnel conversion drop-offs.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded">
                TikTok Pixel Active
              </span>
            </div>

            {/* Attribution KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Ad Spend</span>
                <span className="text-sm font-bold text-white font-mono tabular-nums">
                  ${adMetrics.budgetSpend.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Attributed Revenue</span>
                <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                  ${adMetrics.attributedRevenue.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">ROAS</span>
                <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                  {adMetrics.roas}x
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Cost Per Lead (CPA)</span>
                <span className="text-sm font-bold text-white font-mono tabular-nums">
                  ${adMetrics.cpa.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Conversion Funnel Bar */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Impressions: 184K</span>
                <span>6s Views: 42K</span>
                <span>Clicks: 8.4K</span>
                <span>Add to Cart: 1.2K</span>
                <span className="text-emerald-400 font-bold">Purchases: 658</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                <div className="bg-cyan-500 h-full" style={{ width: '100%' }} />
                <div className="bg-blue-500 h-full" style={{ width: '45%' }} />
                <div className="bg-purple-500 h-full" style={{ width: '22%' }} />
                <div className="bg-emerald-500 h-full" style={{ width: '8%' }} />
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
