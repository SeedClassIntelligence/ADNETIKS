/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Competitor Watch & Market Intelligence
 */

import { useState } from 'react';
import { CompetitorProfile, SocialPlatform, CompetitorPost } from '../types';
import {
  Users,
  TrendingUp,
  Plus,
  Trash2,
  ExternalLink,
  Target,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';

interface CompetitorWatchProps {
  competitors: CompetitorProfile[];
  setCompetitors: (competitors: CompetitorProfile[]) => void;
  onSendToRemixStudio: (postContent: string) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function CompetitorWatch({
  competitors,
  setCompetitors,
  onSendToRemixStudio,
  showNotificationToast,
}: CompetitorWatchProps) {
  const [selectedCompId, setSelectedCompId] = useState<string>(competitors[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Competitor Form State
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('linkedin');
  const [newArchetype, setNewArchetype] = useState('Feature Announcer');
  const [newFollowers, setNewFollowers] = useState('24000');
  const [newEr, setNewEr] = useState('2.6');

  const activeComp = competitors.find((c) => c.id === selectedCompId) || competitors[0];

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newHandle) return;

    const created: CompetitorProfile = {
      id: `comp-${Date.now()}`,
      name: newName,
      handle: newHandle.startsWith('@') ? newHandle : `@${newHandle}`,
      platform: newPlatform,
      avatarUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
      archetype: newArchetype,
      followerCount: parseInt(newFollowers, 10) || 20000,
      avgEngagementRate: parseFloat(newEr) || 2.5,
      weeklyCadence: 7,
      shareOfVoice: 15,
      topHookAngle: 'Standard Promotional Posts',
      comparisonDeltas: {
        erDelta: parseFloat((5.14 - (parseFloat(newEr) || 2.5)).toFixed(2)),
        cadenceDelta: 11,
        growthDelta: 12.4,
      },
      recentPosts: [
        {
          id: `cp-${Date.now()}`,
          content: `Our new suite feature is now live for all users. Explore the docs to learn more.`,
          date: 'Just added',
          likes: 120,
          comments: 14,
          shares: 8,
          engagementRate: parseFloat(newEr) || 2.5,
          hookType: 'Direct Feature Broadcast',
          weaknessToExploit: 'Lacks psychological avatar hook and narrative urgency.',
        },
      ],
    };

    setCompetitors([...competitors, created]);
    setSelectedCompId(created.id);
    setShowAddModal(false);
    setNewName('');
    setNewHandle('');
    showNotificationToast('Competitor Added', `Now tracking ${created.name} (${created.handle}).`);
  };

  const handleRemoveCompetitor = (id: string) => {
    if (competitors.length <= 1) return;
    const updated = competitors.filter((c) => c.id !== id);
    setCompetitors(updated);
    setSelectedCompId(updated[0].id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Component Title & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Competitor Watch & Market Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track rival social handles, benchmark engagement metrics, and deploy counter-campaigns.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-red-400" />
          <span>Track New Competitor</span>
        </button>
      </div>

      {/* Head-to-Head Comparison Strip: ADNETIKS vs Industry Rivals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Competitor Selector & Quick Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Tracked Competitor Handles
          </span>

          <div className="space-y-2">
            {competitors.map((comp) => {
              const isSelected = comp.id === selectedCompId;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompId(comp.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-950 border-red-500/80 ring-1 ring-red-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={comp.avatarUrl}
                      alt={comp.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{comp.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {comp.handle} · <span className="uppercase">{comp.platform}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">ER</span>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {comp.avgEngagementRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Head-to-Head Performance Matrix (8 cols) */}
        {activeComp && (
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-400 font-mono tracking-wider">
                  Head-to-Head Benchmark
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  ADNETIKS vs. {activeComp.name} ({activeComp.handle})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-md font-bold">
                  +{activeComp.comparisonDeltas.erDelta}% Higher ER Lead
                </span>
                {competitors.length > 1 && (
                  <button
                    onClick={() => handleRemoveCompetitor(activeComp.id)}
                    className="p-1 text-slate-500 hover:text-red-400"
                    title="Remove competitor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Direct Metrics Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Engagement Rate</span>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-xs text-emerald-400 font-bold">5.14% (You)</span>
                  <span className="text-xs text-slate-400">{activeComp.avgEngagementRate}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '65%' }} />
                  <div className="bg-slate-600 h-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Weekly Cadence</span>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-xs text-emerald-400 font-bold">18/wk (You)</span>
                  <span className="text-xs text-slate-400">{activeComp.weeklyCadence}/wk</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '70%' }} />
                  <div className="bg-slate-600 h-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Follower Growth</span>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-xs text-emerald-400 font-bold">+24.8%</span>
                  <span className="text-xs text-slate-400">+8.2%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '75%' }} />
                  <div className="bg-slate-600 h-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Share of Voice</span>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-xs text-emerald-400 font-bold">42% (You)</span>
                  <span className="text-xs text-slate-400">{activeComp.shareOfVoice}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '60%' }} />
                  <div className="bg-slate-600 h-full" style={{ width: '40%' }} />
                </div>
              </div>

            </div>

            {/* Competitor Recent Post Teardown & Counter-Strategy */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Recent Competitor Posts & Strategic Exploitation
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Auto-Scraped Feed</span>
              </div>

              <div className="space-y-2.5">
                {activeComp.recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">Hook Type: {post.hookType}</span>
                      <span className="font-mono text-slate-500">{post.date}</span>
                    </div>

                    <p className="text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                      &quot;{post.content}&quot;
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                      <div className="text-amber-400/90">
                        <strong>Weakness to Exploit:</strong> {post.weaknessToExploit}
                      </div>

                      <button
                        onClick={() => onSendToRemixStudio(post.content)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Deploy Counter-Post</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                Track Competitor Social Handle
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompetitor} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Competitor Brand Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Growth Media"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Social Handle</label>
                  <input
                    type="text"
                    required
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="@acmegrowth"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Primary Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 capitalize"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X / Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="threads">Threads</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Followers</label>
                  <input
                    type="number"
                    value={newFollowers}
                    onChange={(e) => setNewFollowers(e.target.value)}
                    placeholder="35000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Avg Engagement Rate (%)</label>
                  <input
                    type="text"
                    value={newEr}
                    onChange={(e) => setNewEr(e.target.value)}
                    placeholder="2.8"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Start Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
