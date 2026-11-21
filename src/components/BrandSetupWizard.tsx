/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Brand & Audience Demographic Setup Wizard
 * Adapts the entire platform (Brand Brain, Audience Demographics, Tone & Campaigns)
 * to the user's real business, artist project, creator channel, or product.
 */

import { useState } from 'react';
import { BrandProfile, BrandArchetype, CustomerAvatar } from '../types';
import {
  Sparkles,
  Globe,
  Users,
  CheckCircle2,
  ArrowRight,
  Music,
  ShoppingBag,
  Cpu,
  Briefcase,
  Video,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface BrandSetupWizardProps {
  brandProfile: BrandProfile;
  onCompleteSetup: (
    updatedBrand: BrandProfile,
    discoveredAvatars: CustomerAvatar[],
    goToCampaigns?: boolean
  ) => void;
  showNotificationToast: (title: string, message: string) => void;
  compact?: boolean;
}

type CreatorCategory = 'artist' | 'creator' | 'ecommerce' | 'startup' | 'agency';

const CATEGORY_PRESETS: Record<
  CreatorCategory,
  {
    label: string;
    subtitle: string;
    icon: any;
    archetype: BrandArchetype;
    voiceAttributes: string[];
    valuePillars: string[];
    bannedWords: string[];
    placeholderName: string;
    placeholderOffer: string;
  }
> = {
  artist: {
    label: 'Artist / Musician',
    subtitle: 'Drops, tours, merch, fan community',
    icon: Music,
    archetype: 'The Visionary',
    voiceAttributes: ['Authentic & Unfiltered', 'Cinematic', 'Community-First', 'Bold Energy'],
    valuePillars: ['Original Sound & Story', 'Direct Fan Connection', 'Live Experience & Drops'],
    bannedWords: ['Synergy', 'B2B Pipeline', 'Enterprise ROI', 'Leverage'],
    placeholderName: 'e.g. SEEDN / Midnight Frequency',
    placeholderOffer: 'e.g. https://open.spotify.com/... or "Independent electronic/hip-hop artist dropping a new EP and limited vinyl merch"',
  },
  creator: {
    label: 'Creator / Media',
    subtitle: 'Video channels, newsletters, digital products',
    icon: Video,
    archetype: 'The Catalyst',
    voiceAttributes: ['Conversational', 'Punchy & Visual', 'High-Signal', 'Relatable'],
    valuePillars: ['Real Behind-the-Scenes Value', 'Consistent Creative Output', 'Audience Trust'],
    bannedWords: ['Corporate Synergy', 'Circle Back', 'Best-in-Class'],
    placeholderName: 'e.g. Studio North',
    placeholderOffer: 'e.g. https://youtube.com/@... or "Creator brand sharing filmmaking gear breakdowns, LUT packs, and weekly workshops"',
  },
  ecommerce: {
    label: 'Product / Merch Brand',
    subtitle: 'DTC store, apparel, physical drops',
    icon: ShoppingBag,
    archetype: 'The Challenger',
    voiceAttributes: ['Tactile & Visual', 'Confident', 'Scarcity-Driven', 'Culture-Aware'],
    valuePillars: ['Craftsmanship & Design', 'Social Proof & Unboxing', 'Limited Drop Velocity'],
    bannedWords: ['Cheap', 'Discount Bin', 'Legacy Solution'],
    placeholderName: 'e.g. Obsidian Streetwear',
    placeholderOffer: 'e.g. https://yourstore.com or "Heavyweight minimalist streetwear & limited capsule drops shipped direct"',
  },
  startup: {
    label: 'Tech / App / SaaS',
    subtitle: 'Software, AI tools, platforms',
    icon: Cpu,
    archetype: 'The Innovator',
    voiceAttributes: ['Sharp & Direct', 'Evidence-Backed', 'Zero Fluff', 'Forward-Looking'],
    valuePillars: ['Measurable Speed & Outcomes', 'Modern Architecture', 'User-First Design'],
    bannedWords: ['Revolutionary Paradigm', 'Game-Changing Synergy', 'Seamless Disruption'],
    placeholderName: 'e.g. ADNETIKS',
    placeholderOffer: 'e.g. https://github.com/... or "AI-native creative & automated campaign platform for builders and teams"',
  },
  agency: {
    label: 'Agency / Service',
    subtitle: 'Client work, local business, consulting',
    icon: Briefcase,
    archetype: 'The Strategist',
    voiceAttributes: ['Trustworthy', 'Outcome-Focused', 'Clear & Practical', 'Consultative'],
    valuePillars: ['Proven Client Results', 'Fast Turnaround', 'Transparent Process'],
    bannedWords: ['Guru', 'Secret Hack', 'Guaranteed Overnight'],
    placeholderName: 'e.g. SeedClass Studio',
    placeholderOffer: 'e.g. https://youragency.com or "Creative production & paid growth studio helping modern brands scale"',
  },
};

export default function BrandSetupWizard({
  brandProfile,
  onCompleteSetup,
  showNotificationToast,
  compact = false,
}: BrandSetupWizardProps) {
  const [category, setCategory] = useState<CreatorCategory>('artist');
  const [brandName, setBrandName] = useState(brandProfile.name === 'ADNETIKS' ? '' : brandProfile.name);
  const [tagline, setTagline] = useState(brandProfile.tagline || '');
  const [offerOrUrl, setOfferOrUrl] = useState('');
  const [targetRegion, setTargetRegion] = useState('US, UK & Global Tier-1 Cities');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const preset = CATEGORY_PRESETS[category];

  const handleSynthesizeBrandBrain = async (goToCampaigns: boolean) => {
    const cleanName = brandName.trim() || 'My Brand';
    const cleanOffer = offerOrUrl.trim() || `${cleanName} — ${preset.label}: ${preset.subtitle}`;

    setIsSynthesizing(true);
    try {
      const updatedBrand: BrandProfile = {
        ...brandProfile,
        name: cleanName,
        archetype: preset.archetype,
        tagline: tagline.trim() || `${cleanName} · ${preset.subtitle}`,
        targetIndustry: preset.label,
        voiceAttributes: preset.voiceAttributes,
        valuePillars: preset.valuePillars,
        bannedWords: preset.bannedWords,
      };

      let discovered: CustomerAvatar[] = [];
      try {
        const res = await fetch('/api/discover-avatars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceInput: `${cleanName} (${preset.label}, Region: ${targetRegion}): ${cleanOffer}`,
            sourceType: cleanOffer.startsWith('http') ? 'url' : 'brief',
            campaignGoal: `Grow loyal audience and conversions for ${cleanName}`,
            brandProfile: {
              name: updatedBrand.name,
              archetype: updatedBrand.archetype,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.prospects) && data.prospects.length > 0) {
            discovered = data.prospects.map((p: CustomerAvatar) => ({
              ...p,
              demographics: {
                ...p.demographics,
                geographicRegion: p.demographics?.geographicRegion || targetRegion,
              },
            }));
          }
        }
      } catch (err) {
        console.warn('Demographic synthesis fallback:', err);
      }

      localStorage.setItem('adnetiks_brand_configured', 'true');
      onCompleteSetup(updatedBrand, discovered, goToCampaigns);
      showNotificationToast(
        'Brand Brain & Audience Calibrated',
        `"${cleanName}" (${preset.label}) is live with ${discovered.length || 3} tailored demographic personas.`
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-red-900/50 bg-gradient-to-br from-[#141016] via-[#111116] to-[#0D0D11] shadow-2xl ${
        compact ? 'p-5 space-y-4' : 'p-6 sm:p-7 space-y-6'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/70 border border-red-800/60 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Step 1 · Brand Brain &amp; Audience Calibration
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Tell ADNETIKS Who You Are — We Map Your Audience Automatically
          </h2>
          <p className="text-xs text-[#8B8BA8] max-w-2xl">
            Replace default sample data with your real brand, voice, and target demographics. Every campaign, ad, video script, and schedule adapts to this profile.
          </p>
        </div>
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B8BA8] block">
          1. What are you building or promoting?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.keys(CATEGORY_PRESETS) as CreatorCategory[]).map((key) => {
            const item = CATEGORY_PRESETS[key];
            const Icon = item.icon;
            const active = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`p-3 rounded-xl border text-left transition-all space-y-1.5 ${
                  active
                    ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/40 text-white'
                    : 'bg-[#0A0A0C] border-[#1F1F2A] text-[#8B8BA8] hover:border-[#2A2A38] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${active ? 'text-red-400' : 'text-[#52526B]'}`} />
                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="text-xs font-bold leading-tight">{item.label}</div>
                <div className="text-[10px] text-[#8B8BA8] leading-snug">{item.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            2. Your Brand, Artist, or Business Name
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder={preset.placeholderName}
            className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#52526B] focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            Target Geography / Market
          </label>
          <input
            type="text"
            value={targetRegion}
            onChange={(e) => setTargetRegion(e.target.value)}
            placeholder="e.g. Los Angeles, NYC & London / Global English-speaking"
            className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#52526B] focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          3. Paste your Website, Spotify, Social Link, or Describe Your Offer
        </label>
        <textarea
          rows={2}
          value={offerOrUrl}
          onChange={(e) => setOfferOrUrl(e.target.value)}
          placeholder={preset.placeholderOffer}
          className="w-full bg-[#0A0A0C] border border-[#2A2A38] rounded-xl p-3 text-xs text-white placeholder-[#52526B] focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Preview of Preset Voice + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1F1F2A]">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[#8B8BA8] font-medium">Auto-Voice:</span>
          {preset.voiceAttributes.map((attr) => (
            <span
              key={attr}
              className="px-2 py-0.5 rounded-md bg-[#18181F] border border-[#2A2A38] text-slate-300 text-[10px]"
            >
              {attr}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isSynthesizing}
            onClick={() => handleSynthesizeBrandBrain(false)}
            className="px-4 py-2.5 rounded-xl bg-[#18181F] hover:bg-[#22222E] border border-[#2A2A38] text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {isSynthesizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Save Brand &amp; View Demographics</span>
          </button>

          <button
            type="button"
            disabled={isSynthesizing}
            onClick={() => handleSynthesizeBrandBrain(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/40 transition-all"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Building Brand Brain...</span>
              </>
            ) : (
              <>
                <span>Save &amp; Build Campaign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
