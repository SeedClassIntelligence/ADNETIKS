/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS High-End Multi-Source Editable Ad Set Studio
 * Ingests from Website URL (read quietly in background), Social Media Profiles (LinkedIn/IG/X/TikTok),
 * Personal Likeness / Product Photos, or plain-English pitch -> generates a 4-Ad High-Converting
 * Campaign Set where every headline, copy block, CTA, and visual is directly editable, swappable,
 * downloadable, and queueable.
 */

import { useState, useEffect, useRef } from 'react';
import { BrandProfile, CustomerAvatar, PostVariant, SocialPlatform } from '../types';
import {
  Sparkles,
  Globe,
  Share2,
  Upload,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Download,
  Send,
  Image as ImageIcon,
  Wand2,
  Edit3,
  Layers,
  X,
  UserCheck,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export type ImpeccableDirective = 'default' | 'distill' | 'bolder' | 'quieter' | 'typeset' | 'polish';

export interface ImpeccableCraftAudit {
  score: number;
  grade: 'Impeccable' | 'Strong' | 'Needs Polish' | 'AI Slop Alert';
  headlineWords: number;
  estimatedTextDensityPct: number;
  flaggedCliches: string[];
  findings: Array<{
    severity: 'P0' | 'P1' | 'P2';
    category: string;
    message: string;
  }>;
  directiveApplied: ImpeccableDirective;
}

export interface EditableAdItem {
  id: string;
  slotLabel: string;
  angleTag: string;
  platform: 'meta' | 'linkedin' | 'instagram' | 'tiktok';
  aspectRatio: '1:1' | '4:3' | '16:9' | '9:16';
  creativeStyle: 'editorial_hook' | 'old_vs_new' | 'proof_spotlight' | 'social_story';
  headline: string;
  primaryText: string;
  ctaText: string;
  destinationUrl: string;
  visualPrompt: string;
  imageUrl: string;
  visualSource: 'gemini_ai_photo' | 'openai_ai_photo' | 'adnetiks_editorial_studio' | 'user_uploaded';
  impeccableDirective?: ImpeccableDirective;
  craftAudit?: ImpeccableCraftAudit;
  oldWayPoints?: string[];
  newWayPoints?: string[];
}

interface HighEndAdSetStudioProps {
  brandProfile: BrandProfile;
  setBrandProfile?: (bp: BrandProfile) => void;
  selectedAvatar: CustomerAvatar;
  onSaveToQueue: (posts: PostVariant[]) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function HighEndAdSetStudio({
  brandProfile,
  setBrandProfile,
  selectedAvatar,
  onSaveToQueue,
  showNotificationToast,
}: HighEndAdSetStudioProps) {
  // Multi-source inputs (Website + Social + Likeness Photo + Pitch)
  const [brandNameInput, setBrandNameInput] = useState(brandProfile.name || '');
  const [websiteUrl, setWebsiteUrl] = useState(brandProfile.websiteUrl || '');
  const [socialProfileUrl, setSocialProfileUrl] = useState('');
  const [socialBioText, setSocialBioText] = useState('');
  const [offerBrief, setOfferBrief] = useState(brandProfile.tagline || '');
  const [likenessPreview, setLikenessPreview] = useState<string>('');
  const [likenessFileName, setLikenessFileName] = useState<string>('');
  const likenessInputRef = useRef<HTMLInputElement | null>(null);

  // Live AI Key Status & Inline 10-Second Key Setup
  const [aiStatus, setAiStatus] = useState<{
    provider: string;
    hasApiKey: boolean;
    hasImageKey: boolean;
    imageProvider: string | null;
  }>({ provider: 'gemini', hasApiKey: false, hasImageKey: false, imageProvider: null });
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keyProvider, setKeyProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Generated 4-Ad Editable Set State
  const [isGeneratingSet, setIsGeneratingSet] = useState(false);
  const [adSet, setAdSet] = useState<EditableAdItem[]>([]);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [activePalette, setActivePalette] = useState(brandProfile.brandColors);
  const [activeFonts, setActiveFonts] = useState(brandProfile.brandFonts);
  const [regeneratingAdId, setRegeneratingAdId] = useState<string | null>(null);
  const [editingPromptAdId, setEditingPromptAdId] = useState<string | null>(null);
  const [campaignDirective, setCampaignDirective] = useState<ImpeccableDirective>('default');
  const [expandedAuditAdId, setExpandedAuditAdId] = useState<string | null>(null);
  const [directingAdKey, setDirectingAdKey] = useState<string | null>(null);

  const fetchAiStatus = async () => {
    try {
      const res = await fetch('/api/llm-config');
      if (res.ok) {
        const d = await res.json();
        setAiStatus({
          provider: d.provider || 'gemini',
          hasApiKey: !!d.hasApiKey,
          hasImageKey: !!d.hasImageKey,
          imageProvider: d.imageProvider || null,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  useEffect(() => {
    if (brandProfile.name && !brandNameInput) setBrandNameInput(brandProfile.name);
    if (brandProfile.websiteUrl && !websiteUrl) setWebsiteUrl(brandProfile.websiteUrl);
    if (brandProfile.brandColors) setActivePalette(brandProfile.brandColors);
  }, [brandProfile.name, brandProfile.websiteUrl, brandProfile.brandColors]);

  const handleSaveInlineApiKey = async () => {
    if (!apiKeyInput.trim()) {
      showNotificationToast('API Key Needed', 'Paste your Gemini or OpenAI API key to unlock live AI photography & pro copy.');
      return;
    }
    setIsSavingKey(true);
    try {
      const res = await fetch('/api/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: keyProvider,
          model: keyProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini',
          apiKey: apiKeyInput.trim(),
        }),
      });
      if (res.ok) {
        setApiKeyInput('');
        setShowKeyPanel(false);
        await fetchAiStatus();
        showNotificationToast(
          `${keyProvider === 'gemini' ? 'Gemini' : 'OpenAI'} AI Connected`,
          'Live AI copywriting and bespoke commercial AI photography are now active across your Ad Set Studio!'
        );
      }
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleLikenessUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      showNotificationToast('Image Required', 'Please upload a JPG, PNG, or WebP headshot, likeness, or product photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setLikenessPreview(dataUrl);
      setLikenessFileName(file.name);
      showNotificationToast(
        'Likeness / Product Photo Loaded',
        `"${file.name}" will be used directly in your generated ad set visuals.`
      );
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAdSet = async () => {
    if (!brandNameInput.trim() && !websiteUrl.trim() && !socialProfileUrl.trim() && !offerBrief.trim() && !socialBioText.trim()) {
      showNotificationToast(
        'Add Any Brand Source',
        'Enter at least one source: a Website URL, Social Profile/Bio, or plain-English Offer description.'
      );
      return;
    }
    setIsGeneratingSet(true);
    try {
      const res = await fetch('/api/generate-ad-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandNameInput.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          socialProfileUrl: socialProfileUrl.trim() || undefined,
          socialBioText: socialBioText.trim() || undefined,
          offerBrief: offerBrief.trim() || undefined,
          likenessImageDataUrl: likenessPreview.startsWith('data:image/') ? likenessPreview : undefined,
          likenessImageUrl: likenessPreview.startsWith('/api/media/') ? likenessPreview : undefined,
          impeccableDirective: campaignDirective,
          brandColors: activePalette || brandProfile.brandColors,
          brandFonts: activeFonts || brandProfile.brandFonts,
          targetAudience: {
            name: selectedAvatar.name,
            roleTitle: selectedAvatar.roleTitle,
            painPoints: selectedAvatar.painPoints,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not generate ad set');
      }

      setAdSet(data.ads || []);
      setSourcesUsed(data.sourcesUsed || []);
      if (data.brandName) setBrandNameInput(data.brandName);
      if (data.palette) setActivePalette(data.palette);
      if (data.fonts) setActiveFonts(data.fonts);
      if (data.likenessUrl) setLikenessPreview(data.likenessUrl);

      if (setBrandProfile && data.brandName) {
        setBrandProfile({
          ...brandProfile,
          name: data.brandName,
          websiteUrl: data.websiteUrl || brandProfile.websiteUrl,
          brandColors: data.palette || brandProfile.brandColors,
          brandFonts: data.fonts || brandProfile.brandFonts,
        });
      }

      showNotificationToast(
        `4-Ad Campaign Set Ready (${(data.elapsedMs / 1000).toFixed(1)}s)`,
        `Built 4 editable ads for ${data.brandName} using ${data.sourcesUsed?.join(' + ')}. Click any text or image to customize.`
      );
    } catch (err: any) {
      showNotificationToast('Ad Set Error', err?.message || 'Could not generate ad set.');
    } finally {
      setIsGeneratingSet(false);
    }
  };

  const updateAdField = (adId: string, field: keyof EditableAdItem, value: any) => {
    setAdSet((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, [field]: value } : ad)));
  };

  const handleUploadCustomImageForAd = async (adId: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      try {
        const upRes = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, fileName: file.name }),
        });
        const upData = await upRes.json();
        const finalUrl = upData?.ok && upData?.url ? upData.url : dataUrl;
        setAdSet((prev) =>
          prev.map((ad) =>
            ad.id === adId ? { ...ad, imageUrl: finalUrl, visualSource: 'user_uploaded' } : ad
          )
        );
        showNotificationToast('Custom Ad Image Applied', `Uploaded "${file.name}" directly onto this ad card.`);
      } catch {
        setAdSet((prev) =>
          prev.map((ad) =>
            ad.id === adId ? { ...ad, imageUrl: dataUrl, visualSource: 'user_uploaded' } : ad
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateSingleVisual = async (
    ad: EditableAdItem,
    overrideStyle?: EditableAdItem['creativeStyle']
  ) => {
    const styleToUse = overrideStyle || ad.creativeStyle;
    setRegeneratingAdId(ad.id);
    try {
      const res = await fetch('/api/regenerate-single-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandNameInput || brandProfile.name,
          websiteUrl: ad.destinationUrl || websiteUrl,
          headline: ad.headline,
          primaryText: ad.primaryText,
          ctaText: ad.ctaText,
          angleTag: ad.angleTag,
          visualPrompt: ad.visualPrompt,
          aspectRatio: styleToUse === 'social_story' ? '9:16' : ad.aspectRatio,
          creativeStyle: styleToUse,
          palette: activePalette || brandProfile.brandColors,
          fonts: activeFonts || brandProfile.brandFonts,
          likenessImageUrl: likenessPreview || undefined,
          impeccableDirective: ad.impeccableDirective || campaignDirective,
          oldWayPoints: ad.oldWayPoints,
          newWayPoints: ad.newWayPoints,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.imageUrl) {
        setAdSet((prev) =>
          prev.map((item) =>
            item.id === ad.id
              ? {
                  ...item,
                  creativeStyle: styleToUse,
                  imageUrl: data.imageUrl,
                  visualSource: data.visualSource || 'adnetiks_editorial_studio',
                }
              : item
          )
        );
        showNotificationToast('Ad Visual Updated', `Regenerated "${ad.slotLabel}" with updated headline & style.`);
      }
    } finally {
      setRegeneratingAdId(null);
    }
  };

  const handleApplyImpeccableDirective = async (
    ad: EditableAdItem,
    directive: ImpeccableDirective
  ) => {
    const key = `${ad.id}:${directive}`;
    setDirectingAdKey(key);
    try {
      const res = await fetch('/api/impeccable-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directive,
          brandName: brandNameInput || brandProfile.name,
          websiteUrl: ad.destinationUrl || websiteUrl,
          palette: activePalette || brandProfile.brandColors,
          fonts: activeFonts || brandProfile.brandFonts,
          likenessImageUrl: likenessPreview || undefined,
          ad,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.ad) {
        setAdSet((prev) => prev.map((item) => (item.id === ad.id ? data.ad : item)));
        showNotificationToast(
          `Impeccable "${directive}" Applied`,
          `Updated visual & copy for ${ad.slotLabel} · Craft Score: ${data.craftAudit?.score ?? 95}/100 (${data.craftAudit?.grade || 'Impeccable'}).`
        );
      }
    } finally {
      setDirectingAdKey(null);
    }
  };

  const mapAdToPostVariant = (ad: EditableAdItem, index: number): PostVariant => {
    const plat: SocialPlatform =
      ad.platform === 'meta' ? 'facebook' : (ad.platform as SocialPlatform);
    return {
      id: `adset-post-${Date.now()}-${index}`,
      campaignId: `adset-${brandNameInput.toLowerCase().replace(/\W+/g, '-')}`,
      variantLabel: index % 2 === 0 ? 'Variant A' : 'Variant B',
      hookAngle: `${ad.slotLabel}: ${ad.headline}`,
      content: `${ad.headline}\n\n${ad.primaryText}\n\n→ ${ad.ctaText}: ${ad.destinationUrl}`,
      hashtags: [`#${(brandNameInput || 'Brand').replace(/\W+/g, '')}`, '#AdCampaign'],
      platform: plat,
      mediaUrl: ad.imageUrl,
      mediaType: 'image',
      scheduledTime: new Date(Date.now() + (index + 1) * 8 * 3600 * 1000).toISOString(),
      status: 'approved',
      metrics: { impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, conversionRate: 0 },
    };
  };

  const handleQueueAds = (adsToQueue: EditableAdItem[]) => {
    if (adsToQueue.length === 0) return;
    onSaveToQueue(adsToQueue.map((a, idx) => mapAdToPostVariant(a, idx)));
    showNotificationToast(
      `Queued ${adsToQueue.length} Ad${adsToQueue.length === 1 ? '' : 's'} to Distribution`,
      'Your edited ad visuals, headlines, and CTAs are now ready in 03 Distribution.'
    );
  };

  const handleDownloadBriefPack = () => {
    if (adSet.length === 0) return;
    const text = adSet
      .map(
        (ad, i) =>
          `=== ${ad.slotLabel} (${ad.platform.toUpperCase()} · ${ad.aspectRatio}) ===\nHeadline: ${ad.headline}\nCTA Button: ${ad.ctaText}\nDestination URL: ${ad.destinationUrl}\nPrimary Copy:\n${ad.primaryText}\nImage Asset: ${window.location.origin}${ad.imageUrl}\n`
      )
      .join('\n--------------------------------------------------\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(brandNameInput || 'adnetiks').toLowerCase().replace(/\W+/g, '-')}-ad-set-copy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotificationToast('Ad Set Copy Pack Exported', 'Downloaded all 4 edited headlines, copy blocks, CTAs & asset links.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* LIVE AI ENGINE STATUS BAR (Transparent + 10-Second Inline API Key Connection) */}
      <div
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          aiStatus.hasImageKey
            ? 'bg-emerald-950/20 border-emerald-700/45'
            : 'bg-amber-950/20 border-amber-700/45'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              aiStatus.hasImageKey
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                : 'bg-amber-900/50 text-amber-300 border border-amber-700/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white flex flex-wrap items-center gap-2">
              {aiStatus.hasImageKey ? (
                <>
                  <span>Live AI Photography &amp; Pro Copy Active ({aiStatus.imageProvider?.toUpperCase()})</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-mono">
                    LIVE AI
                  </span>
                </>
              ) : (
                <>
                  <span>Running in Free Local Editorial Studio Mode</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-mono">
                    NO AI KEY YET
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-[#A2A2BC] mt-0.5">
              {aiStatus.hasImageKey
                ? 'Generates bespoke commercial photography (using your likeness/product photo when uploaded) and custom AI direct-response copy.'
                : 'Add a Gemini or OpenAI API key (takes 10 seconds, costs ~$0.03/image) to unlock photorealistic AI ad photography & full creative AI writing — or upload your own photos right now.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyPanel(!showKeyPanel)}
          className="px-3.5 py-2 rounded-xl bg-[#14141C] hover:bg-[#1E1E2B] border border-[#2E2E42] text-xs font-bold text-white shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>{showKeyPanel ? 'Close Key Setup' : aiStatus.hasImageKey ? 'Switch AI Key' : 'Connect Gemini / OpenAI Key'}</span>
        </button>
      </div>

      {/* INLINE 10-SECOND API KEY DRAWER */}
      {showKeyPanel && (
        <div className="p-4 rounded-2xl bg-[#0E0E15] border border-cyan-700/50 space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-white">
              Connect AI Key for Real Commercial Photography &amp; Copywriting
            </span>
            <div className="flex items-center gap-1.5">
              {(['gemini', 'openai'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setKeyProvider(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    keyProvider === p
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#171722] text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'gemini' ? 'Google Gemini (Recommended)' : 'OpenAI (GPT-4o + gpt-image-1)'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={keyProvider === 'gemini' ? 'Paste AIza... Gemini API key' : 'Paste sk-... OpenAI API key'}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#08080C] border border-[#2A2A3B] text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              disabled={isSavingKey}
              onClick={handleSaveInlineApiKey}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer shrink-0"
            >
              {isSavingKey ? 'Saving...' : 'Save & Activate AI'}
            </button>
          </div>
          <p className="text-[10px] text-[#8B8BA8]">
            Stored privately on your local server in `.adnetiks-data/llm-config.json` (gitignored, never pushed to GitHub).
          </p>
        </div>
      )}

      {/* MULTI-SOURCE BRAND, SOCIAL & LIKENESS INPUT STUDIO (NO CLUTTERED WEBSITE SCREENSHOTS!) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111116] border border-[#222232] space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E1E2C] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/70 border border-red-800/60 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Layers className="w-3 h-3" />
              High-End Ad Set Studio
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              Build a Complete 4-Ad Campaign From Any Brand Source
            </h2>
            <p className="text-xs text-[#8E8EA8]">
              Pull from a website, LinkedIn / Instagram / X profile, your own headshot or product photo, or a plain-English pitch — then edit every word, CTA, and visual directly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 8 cols: Multi-source brand inputs */}
          <div className="lg:col-span-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Brand or Personal Name</label>
                <input
                  type="text"
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                  placeholder="e.g. Open Polici, Your Name, or Brand"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090D] border border-[#282838] text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Website URL <span className="text-[#6E6E8A] font-normal">(optional · read silently)</span>
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090D] border border-[#282838] text-xs text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  Social Profile URL <span className="text-[#6E6E8A] font-normal">(LinkedIn / IG / X / TikTok)</span>
                </label>
                <input
                  type="url"
                  value={socialProfileUrl}
                  onChange={(e) => setSocialProfileUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/... or instagram.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090D] border border-[#282838] text-xs text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Social Bio / Voice Sample <span className="text-[#6E6E8A] font-normal">(paste bio or top post)</span>
                </label>
                <input
                  type="text"
                  value={socialBioText}
                  onChange={(e) => setSocialBioText(e.target.value)}
                  placeholder="Paste your LinkedIn headline, IG bio, or writing vibe..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090D] border border-[#282838] text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                What Are We Selling / Promoting? <span className="text-[#6E6E8A] font-normal">(offer, audience pain point, or call to action)</span>
              </label>
              <textarea
                rows={2}
                value={offerBrief}
                onChange={(e) => setOfferBrief(e.target.value)}
                placeholder="Example: Private side-by-side insurance comparison with zero spam calls. Consumers choose which carrier may contact them."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090D] border border-[#282838] text-xs text-white placeholder-[#5B5B78] focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Impeccable Creative Direction Preset Bar */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Impeccable Art Direction <span className="text-[#6E6E8A] font-normal">(anti-slop aesthetic &amp; typography rules)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'default', label: 'Balanced Studio' },
                    { id: 'distill', label: 'Distill · Ultra-Minimal' },
                    { id: 'bolder', label: 'Bolder · Swiss Poster' },
                    { id: 'quieter', label: 'Quieter · Luxury Calm' },
                    { id: 'typeset', label: 'Typeset · Magazine' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCampaignDirective(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      campaignDirective === preset.id
                        ? 'bg-white text-[#0A0A0C] border-white font-bold'
                        : 'bg-[#0A0A0E] text-[#9A9AB6] border-[#262636] hover:text-white hover:border-[#3A3A50]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 cols: Personal Likeness / Product Photo Upload Box */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3">
            <div className="flex-1 p-4 rounded-2xl bg-[#0A0A0F] border border-dashed border-[#34344C] hover:border-emerald-500/70 transition-all flex flex-col items-center justify-center text-center gap-2.5">
              <input
                ref={likenessInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLikenessUpload(f);
                }}
              />

              {likenessPreview ? (
                <div className="w-full space-y-2">
                  <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/70 shadow-lg">
                    <img
                      src={likenessPreview}
                      alt="Uploaded likeness or product"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLikenessPreview('');
                        setLikenessFileName('');
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-red-600"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">{likenessFileName || 'Photo Active'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => likenessInputRef.current?.click()}
                    className="text-[11px] text-cyan-300 hover:text-white underline cursor-pointer"
                  >
                    Replace Photo
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-[#161622] border border-[#2B2B3F] flex items-center justify-center text-emerald-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">
                      Upload Your Photo / Likeness / Product
                    </div>
                    <p className="text-[10px] text-[#8B8BA8] mt-0.5 leading-snug">
                      Optional — uses your real face, product, or brand shot inside your generated ads.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => likenessInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#181826] hover:bg-[#232336] border border-[#303048] text-[11px] font-bold text-white cursor-pointer"
                  >
                    Choose Image
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={isGeneratingSet}
              onClick={handleGenerateAdSet}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-red-900/35 transition-all cursor-pointer"
            >
              {isGeneratingSet ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating 4-Ad Campaign Set...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 4-Ad Campaign Set</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* GENERATED 4-AD EDITABLE CAMPAIGN BOARD */}
      {adSet.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111116] border border-[#222232] px-5 py-3.5 rounded-2xl">
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold text-white flex flex-wrap items-center gap-2">
                <span>Editable 4-Ad Campaign Set ({brandNameInput || brandProfile.name})</span>
                {sourcesUsed.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[10px] font-mono text-emerald-300"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#8B8BA8]">
                Click directly on any headline, body copy, CTA button, or upload your own photo on any card to customize before publishing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadBriefPack}
                className="px-3.5 py-2 rounded-xl bg-[#181822] hover:bg-[#232333] border border-[#2E2E42] text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Ad Copy Pack</span>
              </button>
              <button
                type="button"
                onClick={() => handleQueueAds(adSet)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Queue All 4 Ads</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {adSet.map((ad) => (
              <div
                key={ad.id}
                className="rounded-2xl bg-[#101016] border border-[#242436] overflow-hidden flex flex-col shadow-xl"
              >
                {/* Ad Card Header */}
                <div className="px-4 py-3 bg-[#15151E] border-b border-[#222232] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{ad.slotLabel}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0A0A0E] border border-[#2A2A3B] text-[10px] font-mono uppercase text-cyan-300">
                      {ad.platform} · {ad.aspectRatio}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ad.craftAudit && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAuditAdId(expandedAuditAdId === ad.id ? null : ad.id)
                        }
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                          ad.craftAudit.score >= 90
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/70'
                            : ad.craftAudit.score >= 78
                            ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60'
                            : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                        }`}
                        title="Click to inspect Impeccable Slop Detector audit"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {ad.craftAudit.score}/100 · ~{ad.craftAudit.estimatedTextDensityPct}% txt
                        </span>
                      </button>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        ad.visualSource === 'gemini_ai_photo' || ad.visualSource === 'openai_ai_photo'
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                          : ad.visualSource === 'user_uploaded'
                          ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/60'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {ad.visualSource === 'gemini_ai_photo'
                        ? 'Gemini AI Photo'
                        : ad.visualSource === 'openai_ai_photo'
                        ? 'OpenAI AI Photo'
                        : ad.visualSource === 'user_uploaded'
                        ? 'Your Photo'
                        : 'Editorial PNG'}
                    </span>
                  </div>
                </div>

                {/* Collapsible Impeccable Slop Detector Audit Panel */}
                {expandedAuditAdId === ad.id && ad.craftAudit && (
                  <div className="px-4 py-3 bg-[#0C0C12] border-b border-[#1E1E2B] space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Impeccable Slop Audit: <span className="text-emerald-300">{ad.craftAudit.grade}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#8B8BA8]">
                        {ad.craftAudit.headlineWords} headline words · {ad.craftAudit.directiveApplied} mode
                      </span>
                    </div>
                    {ad.craftAudit.findings.length === 0 ? (
                      <div className="text-emerald-300/90 text-[11px]">
                        ✓ Zero AI cliché words detected · Clean headline length · Outcome-driven CTA · Algorithm-safe visual text density.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {ad.craftAudit.findings.map((f, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-amber-200/90">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-mono text-[10px] mr-1">[{f.severity}]</strong>
                              {f.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ad Creative Visual Preview (100% Unclipped) */}
                <div className="relative bg-[#070B11] border-b border-[#1E1E2B] flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden group">
                  <img
                    src={ad.imageUrl}
                    alt={ad.headline}
                    className="w-full h-auto max-h-[380px] object-contain"
                  />

                  {/* Quick Visual Swap Overlay Controls */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                    <label className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer backdrop-blur-sm">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadCustomImageForAd(ad.id, f);
                        }}
                      />
                    </label>
                    <a
                      href={ad.imageUrl}
                      download={`${(brandNameInput || 'ad').toLowerCase().replace(/\W+/g, '-')}-${ad.id}.png`}
                      className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 backdrop-blur-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PNG</span>
                    </a>
                  </div>
                </div>

                {/* 1-Click Impeccable Art Direction Bar */}
                <div className="px-4 py-2.5 bg-[#0C0C11] border-b border-[#1D1D2A] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B8BA8]">
                    Impeccable Direct:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'distill', label: 'Distill', tip: 'Strip visual & copy noise to minimal billboard' },
                        { id: 'bolder', label: 'Bolder', tip: 'Oversized Swiss poster contrast & bold copy' },
                        { id: 'quieter', label: 'Quieter', tip: 'Luxury calm editorial framing & understated tone' },
                        { id: 'typeset', label: 'Typeset', tip: 'Magazine serif/sans editorial typography' },
                        { id: 'polish', label: 'Polish', tip: 'Auto-fix AI clichés, weak CTAs & text density' },
                      ] as const
                    ).map((cmd) => {
                      const isActive = ad.impeccableDirective === cmd.id;
                      const isBusy = directingAdKey === `${ad.id}:${cmd.id}`;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          disabled={directingAdKey !== null}
                          onClick={() => handleApplyImpeccableDirective(ad, cmd.id)}
                          title={cmd.tip}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white text-[#0A0A0C]'
                              : cmd.id === 'polish'
                              ? 'bg-emerald-950/60 hover:bg-emerald-800/70 text-emerald-300 border border-emerald-700/50'
                              : 'bg-[#171722] hover:bg-[#242436] text-slate-300 hover:text-white border border-[#262638]'
                          }`}
                        >
                          {isBusy ? '...' : cmd.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Editable Ad Copy, Headline, CTA & Visual Style Controls */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-[#8B8BA8] flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-red-400" /> Editable Ad Headline
                      </label>
                      <input
                        type="text"
                        value={ad.headline}
                        onChange={(e) => updateAdField(ad.id, 'headline', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#09090D] border border-[#242434] focus:border-red-500 text-xs font-extrabold text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-[#8B8BA8]">
                        Editable Primary Ad Copy
                      </label>
                      <textarea
                        rows={4}
                        value={ad.primaryText}
                        onChange={(e) => updateAdField(ad.id, 'primaryText', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#09090D] border border-[#242434] focus:border-red-500 text-xs text-slate-200 leading-relaxed focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-[#8B8BA8]">CTA Button</label>
                        <input
                          type="text"
                          value={ad.ctaText}
                          onChange={(e) => updateAdField(ad.id, 'ctaText', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#09090D] border border-[#242434] focus:border-emerald-500 text-xs font-bold text-emerald-300 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-[#8B8BA8]">Destination URL</label>
                        <input
                          type="text"
                          value={ad.destinationUrl}
                          onChange={(e) => updateAdField(ad.id, 'destinationUrl', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#09090D] border border-[#242434] focus:border-cyan-500 text-xs text-cyan-300 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Optional Visual Art Direction Prompt Editor */}
                    {editingPromptAdId === ad.id && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-mono uppercase text-amber-300">
                          AI Visual Art Direction Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={ad.visualPrompt}
                          onChange={(e) => updateAdField(ad.id, 'visualPrompt', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#09090D] border border-amber-700/50 text-[11px] text-slate-200 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Per-Ad Style Switcher & Actions Footer */}
                  <div className="pt-3 border-t border-[#1E1E2C] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <select
                        value={ad.creativeStyle}
                        onChange={(e) =>
                          handleRegenerateSingleVisual(
                            ad,
                            e.target.value as EditableAdItem['creativeStyle']
                          )
                        }
                        className="px-2 py-1.5 rounded-lg bg-[#161622] border border-[#2C2C40] text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer"
                        title="Switch visual layout & re-render"
                      >
                        <option value="editorial_hook">Editorial Hero</option>
                        <option value="old_vs_new">Old Way vs New Way</option>
                        <option value="proof_spotlight">Proof Spotlight</option>
                        <option value="social_story">9:16 Story</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingPromptAdId(editingPromptAdId === ad.id ? null : ad.id)
                        }
                        className="px-2 py-1.5 rounded-lg bg-[#161622] hover:bg-[#222234] border border-[#2C2C40] text-[11px] font-semibold text-slate-300 cursor-pointer"
                        title="Edit visual art direction prompt"
                      >
                        Prompt
                      </button>

                      <button
                        type="button"
                        disabled={regeneratingAdId === ad.id}
                        onClick={() => handleRegenerateSingleVisual(ad)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1A1A28] hover:bg-[#26263A] border border-[#34344C] text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Wand2 className={`w-3 h-3 text-red-400 ${regeneratingAdId === ad.id ? 'animate-spin' : ''}`} />
                        <span>{regeneratingAdId === ad.id ? 'Rendering...' : 'Re-Render'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQueueAds([ad])}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send to Queue</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
