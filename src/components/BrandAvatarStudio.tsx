/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Brand Identity & Customer Avatar Intelligence Studio
 */

import { useState, useEffect } from 'react';
import { BrandProfile, CustomerAvatar, BrandArchetype, SocialPlatform } from '../types';
import BrandSetupWizard from './BrandSetupWizard';
import {
  Sparkles,
  Sliders,
  Users,
  Target,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Wand2,
  BrainCircuit,
  RefreshCw,
} from 'lucide-react';

interface BrandAvatarStudioProps {
  brandProfile: BrandProfile;
  setBrandProfile: (profile: BrandProfile) => void;
  avatars: CustomerAvatar[];
  setAvatars: (avatars: CustomerAvatar[]) => void;
  onSelectAvatarForCampaign?: (avatar: CustomerAvatar) => void;
  onCompleteBrandSetup?: (
    updatedBrand: BrandProfile,
    discoveredAvatars: CustomerAvatar[],
    goToCampaigns?: boolean
  ) => void;
  showNotificationToast?: (title: string, message: string) => void;
  userRole: string;
}

export default function BrandAvatarStudio({
  brandProfile,
  setBrandProfile,
  avatars,
  setAvatars,
  onSelectAvatarForCampaign,
  onCompleteBrandSetup,
  showNotificationToast,
  userRole,
}: BrandAvatarStudioProps) {
  const [activeSection, setActiveSection] = useState<'setup' | 'brand' | 'avatars' | 'memory' | 'receptivity'>(() => {
    const configured = typeof window !== 'undefined' && localStorage.getItem('adnetiks_brand_configured') === 'true';
    return configured ? 'avatars' : 'setup';
  });

  // Phase 3 Closed-Loop Brand Brain Memory State
  const [learnedPatterns, setLearnedPatterns] = useState<
    Array<{
      id: string;
      brandName: string;
      source: 'ab_winner' | 'live_telemetry' | 'manual_insight';
      platform: string;
      winningVariant?: string;
      hookAngle: string;
      takeaway: string;
      evidenceMetric: string;
      confidence: number;
      active: boolean;
      createdAt: string;
    }>
  >([]);
  const [isSyncingMemory, setIsSyncingMemory] = useState(false);
  const [manualRuleText, setManualRuleText] = useState('');
  const [manualRulePlatform, setManualRulePlatform] = useState('multi-channel');

  const loadBrandMemory = () => {
    fetch('/api/memory')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.patterns)) setLearnedPatterns(d.patterns);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadBrandMemory();
  }, []);

  const handleSynthesizeMemory = async () => {
    setIsSyncingMemory(true);
    try {
      const res = await fetch('/api/memory/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brandProfile.name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.patterns)) setLearnedPatterns(data.patterns);
        if (showNotificationToast) {
          showNotificationToast(
            'Brand Brain Synced',
            `Synthesized ${data.newlyLearned?.length || 0} winning pattern(s) from live attribution & A/B tests.`
          );
        }
      }
    } finally {
      setIsSyncingMemory(false);
    }
  };

  const handleAddManualMemoryRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRuleText.trim()) return;
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandName: brandProfile.name,
        source: 'manual_insight',
        platform: manualRulePlatform,
        hookAngle: 'Creator-Verified Rule',
        takeaway: manualRuleText.trim(),
        evidenceMetric: 'Owner Brand Rule',
        confidence: 100,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.patterns)) setLearnedPatterns(data.patterns);
      setManualRuleText('');
      if (showNotificationToast) {
        showNotificationToast('Brand Rule Learned', 'Saved to Closed-Loop Memory and active for all future campaigns.');
      }
    }
  };

  const handleToggleMemoryRule = async (id: string, active: boolean) => {
    const res = await fetch(`/api/memory/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.patterns)) setLearnedPatterns(data.patterns);
    }
  };

  const handleDeleteMemoryRule = async (id: string) => {
    const res = await fetch(`/api/memory/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.patterns)) setLearnedPatterns(data.patterns);
    }
  };
  const [newAttribute, setNewAttribute] = useState('');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [newPillar, setNewPillar] = useState('');
  
  // Avatar Creation Modal
  const [showAddAvatar, setShowAddAvatar] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarRole, setNewAvatarRole] = useState('');
  const [newAvatarAge, setNewAvatarAge] = useState('30–45');
  const [newAvatarSeniority, setNewAvatarSeniority] = useState('Director / VP');
  const [newAvatarPain, setNewAvatarPain] = useState('');
  const [newAvatarTrigger, setNewAvatarTrigger] = useState('');

  // Receptivity Calculator State
  const [testPitch, setTestPitch] = useState(
    'Autonomous social media scheduling engine that automatically tests A/B split hooks and delivers 3.4x higher organic pipeline.'
  );

  const archetypes: { type: BrandArchetype; tag: string; desc: string }[] = [
    { type: 'The Catalyst', tag: 'High Velocity & Action', desc: 'Accelerates transformation, breaks traditional inertia, and demands tangible results.' },
    { type: 'The Innovator', tag: 'Pioneering & Creative', desc: 'Disrupts conventions with visionary engineering and groundbreaking methods.' },
    { type: 'The Strategist', tag: 'Methodical & Data-Driven', desc: 'Focuses on structural advantage, systems thinking, and quantified ROI.' },
    { type: 'The Visionary', tag: 'Inspiring & Future-Focused', desc: 'Articulates the long-term paradigm shift and rallies industry belief.' },
    { type: 'The Challenger', tag: 'Contrarian & Provocative', desc: 'Unflinchingly calls out widespread industry inefficiencies and sacred cows.' },
    { type: 'The Sage', tag: 'Authoritative & Educating', desc: 'Acts as the definitive source of truth, deep research, and proven wisdom.' },
  ];

  const handleAddAttribute = () => {
    if (!newAttribute.trim()) return;
    setBrandProfile({
      ...brandProfile,
      voiceAttributes: [...brandProfile.voiceAttributes, newAttribute.trim()],
    });
    setNewAttribute('');
  };

  const handleRemoveAttribute = (idx: number) => {
    const updated = [...brandProfile.voiceAttributes];
    updated.splice(idx, 1);
    setBrandProfile({ ...brandProfile, voiceAttributes: updated });
  };

  const handleAddBannedWord = () => {
    if (!newBannedWord.trim()) return;
    setBrandProfile({
      ...brandProfile,
      bannedWords: [...brandProfile.bannedWords, newBannedWord.trim()],
    });
    setNewBannedWord('');
  };

  const handleRemoveBannedWord = (idx: number) => {
    const updated = [...brandProfile.bannedWords];
    updated.splice(idx, 1);
    setBrandProfile({ ...brandProfile, bannedWords: updated });
  };

  const handleAddPillar = () => {
    if (!newPillar.trim()) return;
    setBrandProfile({
      ...brandProfile,
      valuePillars: [...brandProfile.valuePillars, newPillar.trim()],
    });
    setNewPillar('');
  };

  const handleRemovePillar = (idx: number) => {
    const updated = [...brandProfile.valuePillars];
    updated.splice(idx, 1);
    setBrandProfile({ ...brandProfile, valuePillars: updated });
  };

  const handleCreateAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvatarName || !newAvatarRole) return;

    const created: CustomerAvatar = {
      id: `avatar-${Date.now()}`,
      name: newAvatarName,
      roleTitle: newAvatarRole,
      avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
      demographics: {
        ageRange: newAvatarAge,
        seniority: newAvatarSeniority,
        companySize: '50–500 employees',
        budgetAuthority: '$100k+/year',
      },
      painPoints: newAvatarPain ? [newAvatarPain] : ['Unpredictable acquisition channels', 'Manual reporting drag'],
      emotionalTriggers: newAvatarTrigger ? [newAvatarTrigger] : ['Executive clarity', 'Speed to outcome'],
      contentAffinities: ['Tactical teardowns', 'Actionable frameworks', 'Split-test benchmarks'],
      preferredPlatforms: ['linkedin', 'x'],
      peakEngagementHours: ['08:30', '13:00', '18:00'],
      receptivityKeywords: ['Velocity', 'Pipeline', 'ROI', 'Efficiency', 'Systems'],
    };

    setAvatars([...avatars, created]);
    setShowAddAvatar(false);
    setNewAvatarName('');
    setNewAvatarRole('');
    setNewAvatarPain('');
    setNewAvatarTrigger('');
  };

  // Compute dynamic receptivity scores for the test pitch
  const calculatePitchReceptivity = (avatar: CustomerAvatar) => {
    const lowerPitch = testPitch.toLowerCase();
    let score = 55;
    avatar.receptivityKeywords.forEach((kw) => {
      if (lowerPitch.includes(kw.toLowerCase())) score += 8;
    });
    avatar.painPoints.forEach((pain) => {
      const words = pain.toLowerCase().split(' ');
      words.forEach((w) => {
        if (w.length > 4 && lowerPitch.includes(w)) score += 5;
      });
    });
    score = Math.min(98, Math.max(35, score));
    const tier = score >= 85 ? 'High' : score >= 65 ? 'Moderate' : 'Low';
    return { score, tier };
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-500" />
            Brand Brain &amp; Audience Demographics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Step 1 of your workflow: calibrate who you are and who you&apos;re talking to before crafting any campaign message.
          </p>
        </div>

        {/* Section Tabs */}
        <div data-tour="brand-section-tabs" className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => setActiveSection('setup')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSection === 'setup' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Quick Brand Setup
          </button>
          <button
            onClick={() => setActiveSection('brand')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSection === 'brand' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            Brand Voice
          </button>
          <button
            onClick={() => setActiveSection('avatars')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSection === 'avatars' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Demographics ({avatars.length})
          </button>
          <button
            data-tour="brand-memory-tab"
            onClick={() => {
              setActiveSection('memory');
              loadBrandMemory();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSection === 'memory' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-300" />
            Learned Memory ({learnedPatterns.filter((p) => p.active).length})
          </button>
          <button
            onClick={() => setActiveSection('receptivity')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSection === 'receptivity' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Message Test
          </button>
        </div>
      </div>

      {/* SECTION 0: Guided Brand & Audience Demographic Calibration */}
      {activeSection === 'setup' && (
        <BrandSetupWizard
          brandProfile={brandProfile}
          onCompleteSetup={(updatedBrand, discoveredAvatars, goToCampaigns) => {
            if (onCompleteBrandSetup) {
              onCompleteBrandSetup(updatedBrand, discoveredAvatars, goToCampaigns);
            } else {
              setBrandProfile(updatedBrand);
              if (discoveredAvatars.length > 0) setAvatars(discoveredAvatars);
            }
            if (!goToCampaigns) {
              setActiveSection('avatars');
            }
          }}
          showNotificationToast={showNotificationToast || (() => {})}
        />
      )}

      {/* SECTION: Closed-Loop Brand Brain Memory */}
      {activeSection === 'memory' && (
        <div className="space-y-5">
          <div className="bg-[#111116] border border-purple-700/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-purple-300 bg-purple-950/60 border border-purple-700/60 px-2 py-0.5 rounded-full">
                <BrainCircuit className="w-3 h-3" />
                Closed-Loop Self-Optimizing Memory
              </div>
              <h2 className="text-base font-extrabold text-white">
                Winning Patterns Automatically Injected Into Future Campaigns
              </h2>
              <p className="text-xs text-[#8B8BA8] max-w-2xl">
                Every A/B split-test winner and live first-party conversion signal gets distilled here and automatically injected into Campaign Studio copy, audience targeting, and AI Video scripts.
              </p>
            </div>
            <button
              type="button"
              disabled={isSyncingMemory}
              onClick={handleSynthesizeMemory}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shrink-0 shadow-lg transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMemory ? 'animate-spin' : ''}`} />
              <span>{isSyncingMemory ? 'Synthesizing...' : 'Sync Signals → Brand Brain'}</span>
            </button>
          </div>

          {/* Add Custom Brand Learning Rule */}
          <form
            onSubmit={handleAddManualMemoryRule}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-2.5"
          >
            <select
              value={manualRulePlatform}
              onChange={(e) => setManualRulePlatform(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="multi-channel">All Channels</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="x">X / Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <input
              type="text"
              value={manualRuleText}
              onChange={(e) => setManualRuleText(e.target.value)}
              placeholder="Add a proven rule (e.g. 'Raw studio clips outperform polished promo graphics 3x with our core fans')"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Teach Brand Brain</span>
            </button>
          </form>

          {/* Learned Patterns List */}
          {learnedPatterns.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#111116] border border-dashed border-[#2A2A38] text-center space-y-2">
              <BrainCircuit className="w-8 h-8 text-purple-400 mx-auto opacity-70" />
              <div className="text-sm font-bold text-white">No Learned Patterns Stored Yet</div>
              <p className="text-xs text-[#8B8BA8] max-w-md mx-auto">
                Click <strong>Sync Signals → Brand Brain</strong> above to distill live conversion telemetry &amp; A/B test winners, or add a proven rule manually.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {learnedPatterns.map((pat) => (
                <div
                  key={pat.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    pat.active
                      ? 'bg-[#111116] border-purple-700/50'
                      : 'bg-[#0A0A0C] border-[#1F1F2A] opacity-60'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60">
                        {pat.source.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                        {pat.platform}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        {pat.evidenceMetric}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{pat.hookAngle}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{pat.takeaway}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleMemoryRule(pat.id, !pat.active)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        pat.active
                          ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pat.active ? 'Active in Prompts ✓' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMemoryRule(pat.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete memory rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: Brand Voice & Rules */}
      {activeSection === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Archetype & Overview */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Brand Archetype Selection */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Brand Archetype</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Defines the underlying subconscious personality of all created copy.</p>
                </div>
                <span className="text-xs font-bold text-red-400 bg-red-950/70 border border-red-800/50 px-2.5 py-1 rounded-md">
                  Active: {brandProfile.archetype}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {archetypes.map((arch) => {
                  const isSelected = brandProfile.archetype === arch.type;
                  return (
                    <button
                      key={arch.type}
                      type="button"
                      disabled={userRole === 'analyst'}
                      onClick={() => setBrandProfile({ ...brandProfile, archetype: arch.type })}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-red-500 bg-red-950/20 text-white ring-1 ring-red-500/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{arch.type}</span>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="text-[11px] text-red-400 font-medium mb-1.5">{arch.tag}</div>
                      <div className="text-[11px] leading-relaxed text-slate-400">{arch.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Tone Dials */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Tone of Voice Calibration</h2>
                <p className="text-xs text-slate-400 mt-0.5">Dial in the algorithmic boundaries for sentence complexity, energy, and assertiveness.</p>
              </div>

              {/* Dial 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Accessible & Clear (0)</span>
                  <span className="font-mono text-red-400 font-bold">{brandProfile.toneDials.technicalVsAccessible}%</span>
                  <span className="text-slate-400">Technical & Specialized (100)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={userRole === 'analyst'}
                  value={brandProfile.toneDials.technicalVsAccessible}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      toneDials: { ...brandProfile.toneDials, technicalVsAccessible: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-red-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Dial 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Calm & Understated (0)</span>
                  <span className="font-mono text-red-400 font-bold">{brandProfile.toneDials.energeticVsReserved}%</span>
                  <span className="text-slate-400">High-Energy & Urgent (100)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={userRole === 'analyst'}
                  value={brandProfile.toneDials.energeticVsReserved}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      toneDials: { ...brandProfile.toneDials, energeticVsReserved: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-red-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Dial 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Collaborative & Soft (0)</span>
                  <span className="font-mono text-red-400 font-bold">{brandProfile.toneDials.boldVsUnderstated}%</span>
                  <span className="text-slate-400">Bold & Direct (100)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={userRole === 'analyst'}
                  value={brandProfile.toneDials.boldVsUnderstated}
                  onChange={(e) =>
                    setBrandProfile({
                      ...brandProfile,
                      toneDials: { ...brandProfile.toneDials, boldVsUnderstated: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-red-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Guardrails & Prohibited Words */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Voice Attributes */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Core Voice Pillars</h2>
                <p className="text-xs text-slate-400 mt-0.5">Mandatory tonality traits injected into every campaign brief.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {brandProfile.voiceAttributes.map((attr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-200"
                  >
                    <span>{attr}</span>
                    {userRole !== 'analyst' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(idx)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {userRole !== 'analyst' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAttribute()}
                    placeholder="Add attribute (e.g. Unflinching, Punchy)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Prohibited Buzzwords Guardrail */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Prohibited Buzzword Filter
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">AI generator strictly bans these generic marketing clichés.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {brandProfile.bannedWords.map((word, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/40 border border-red-900/40 rounded-lg text-xs text-red-300 font-mono"
                  >
                    <span>✕ {word}</span>
                    {userRole !== 'analyst' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBannedWord(idx)}
                        className="text-red-400 hover:text-red-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {userRole !== 'analyst' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newBannedWord}
                    onChange={(e) => setNewBannedWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBannedWord()}
                    placeholder="Add banned cliché (e.g. Game-changer)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBannedWord}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Value Pillars */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Core Value Propositions</h2>
              <ul className="space-y-2 text-xs text-slate-300">
                {brandProfile.valuePillars.map((pillar, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-red-500 font-bold shrink-0">0{idx + 1}.</span>
                    <span className="flex-1">{pillar}</span>
                    {userRole !== 'analyst' && (
                      <button
                        type="button"
                        onClick={() => handleRemovePillar(idx)}
                        className="text-slate-500 hover:text-red-400 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {userRole !== 'analyst' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newPillar}
                    onChange={(e) => setNewPillar(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPillar()}
                    placeholder="Add strategic value pillar..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPillar}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* SECTION 2: Customer Avatars */}
      {activeSection === 'avatars' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Active Customer Avatars</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target audiences calibrated with psychological pain points, emotional triggers, and peak browsing times.
              </p>
            </div>
            {userRole !== 'analyst' && (
              <button
                onClick={() => setShowAddAvatar(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Customer Avatar</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all"
              >
                <div className="space-y-4">
                  
                  {/* Avatar Profile Header */}
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar.avatarImageUrl}
                      alt={avatar.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{avatar.name}</h3>
                      <p className="text-xs text-red-400 font-medium">{avatar.roleTitle}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{avatar.demographics.seniority}</span>
                        <span>·</span>
                        <span>{avatar.demographics.ageRange}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Primary Weekly Friction</div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {avatar.painPoints.map((pain, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-500 shrink-0">▸</span>
                          <span className="leading-snug">{pain}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Emotional Triggers */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Emotional Buying Triggers</div>
                    <div className="flex flex-wrap gap-1.5">
                      {avatar.emotionalTriggers.map((trig, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-md"
                        >
                          {trig}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Channel Affinity & Peak Hours */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Top Channels</span>
                      <span className="font-semibold text-slate-200 uppercase tracking-wide">
                        {avatar.preferredPlatforms.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Peak Active Slots</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {avatar.peakEngagementHours.join(' · ')}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Target Avatar Action */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Authority: {avatar.demographics.budgetAuthority}
                  </span>
                  {onSelectAvatarForCampaign && (
                    <button
                      onClick={() => onSelectAvatarForCampaign(avatar)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      <span>Create for {avatar.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Add Avatar Modal */}
          {showAddAvatar && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    Configure New Customer Avatar
                  </h3>
                  <button
                    onClick={() => setShowAddAvatar(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAvatar} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Avatar Full Name</label>
                      <input
                        type="text"
                        required
                        value={newAvatarName}
                        onChange={(e) => setNewAvatarName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Role & Title</label>
                      <input
                        type="text"
                        required
                        value={newAvatarRole}
                        onChange={(e) => setNewAvatarRole(e.target.value)}
                        placeholder="e.g. VP of Demand Gen"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Age Bracket</label>
                      <input
                        type="text"
                        value={newAvatarAge}
                        onChange={(e) => setNewAvatarAge(e.target.value)}
                        placeholder="e.g. 30–45"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Seniority</label>
                      <input
                        type="text"
                        value={newAvatarSeniority}
                        onChange={(e) => setNewAvatarSeniority(e.target.value)}
                        placeholder="e.g. C-Suite / Executive"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Biggest Operational Pain Point</label>
                    <textarea
                      rows={2}
                      value={newAvatarPain}
                      onChange={(e) => setNewAvatarPain(e.target.value)}
                      placeholder="e.g. Stagnant social pipeline; agency takes 2 weeks to turn around copy..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Primary Emotional Trigger</label>
                    <input
                      type="text"
                      value={newAvatarTrigger}
                      onChange={(e) => setNewAvatarTrigger(e.target.value)}
                      placeholder="e.g. Showing clear board ROI and predictable inbound leads"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddAvatar(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Save Customer Avatar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SECTION 3: Receptivity Matcher Calculator */}
      {activeSection === 'receptivity' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Live Campaign Receptivity Matcher
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your campaign pitch, value proposition, or hook concept below. ADNETIKS evaluates psychological alignment against each customer avatar in real time.
              </p>
            </div>

            <div>
              <textarea
                rows={3}
                value={testPitch}
                onChange={(e) => setTestPitch(e.target.value)}
                placeholder="Type any campaign angle, value proposition, or product announcement to test audience receptivity..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Quick Pitch Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">Test Presets:</span>
              <button
                type="button"
                onClick={() =>
                  setTestPitch(
                    'Cut CAC by 42% using autonomous A/B hook testing directly mapped to engineering founder bottlenecks.'
                  )
                }
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px]"
              >
                CAC & Founder Efficiency
              </button>
              <button
                type="button"
                onClick={() =>
                  setTestPitch(
                    'Eliminate brand voice dilution and streamline multi-tier stakeholder approvals across all social channels.'
                  )
                }
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px]"
              >
                Brand Governance & Approvals
              </button>
              <button
                type="button"
                onClick={() =>
                  setTestPitch(
                    'High-velocity TikTok and Instagram hook testing framework to beat creative ad fatigue in under 48 hours.'
                  )
                }
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px]"
              >
                Ad Fatigue & Split Hooks
              </button>
            </div>
          </div>

          {/* Receptivity Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {avatars.map((avatar) => {
              const { score, tier } = calculatePitchReceptivity(avatar);
              const tierBadge =
                tier === 'High'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                  : tier === 'Moderate'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                  : 'text-slate-400 bg-slate-950/60 border-slate-800';

              return (
                <div
                  key={avatar.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={avatar.avatarImageUrl}
                        alt={avatar.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-800"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{avatar.name}</div>
                        <div className="text-[11px] text-slate-400">{avatar.roleTitle}</div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${tierBadge}`}>
                      {tier} ({score}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Audience Resonance Match</span>
                      <span className="font-mono font-bold text-slate-200">{score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          tier === 'High' ? 'bg-emerald-500' : tier === 'Moderate' ? 'bg-amber-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* Diagnostic Rationale */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-slate-300">Why {avatar.name.split(' ')[0]} Connects:</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {tier === 'High'
                        ? `The hook directly targets ${avatar.name.split(' ')[0]}'s core priorities regarding ${avatar.painPoints[0].toLowerCase()}. High conversion probability.`
                        : tier === 'Moderate'
                        ? `Relevant conceptually, but requires clearer emphasis on ${avatar.emotionalTriggers[0].toLowerCase()} to trigger action.`
                        : `Low alignment with current responsibilities. Consider reframing toward ${avatar.contentAffinities[0]}.`}
                    </p>
                  </div>

                  {/* Recommended Hook Direction */}
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-red-400">Recommended Hook Angle:</span>
                    <p className="text-slate-300 text-[11px] italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                      &quot;{tier === 'High' ? 'Open with hard metrics on efficiency & pipeline.' : 'Address operational friction before introducing the solution.'}&quot;
                    </p>
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
