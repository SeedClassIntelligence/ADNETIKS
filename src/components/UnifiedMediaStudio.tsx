/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Unified Video, Open-Source Voice (Kokoro Apache-2.0), Music & Creative Director Studio
 * Combines:
 *   - 6-Stage Video Production Pipelines (Launch Reel, Old Way vs New Way, Explainer, UGC Story)
 *   - Zero-Cost Open-Source Voiceover Engine (Kokoro-FastAPI Apache 2.0 + Mic Recording + Browser Preview)
 *   - Synthesized Studio Music Beds + Real 9:16 / 16:9 HD WebM Video Muxer
 *   - Automated Video Quality Gates (pacing, safe zones, Impeccable anti-slop check, audio check)
 *   - Parallax-Style Creative Director Agent Chat + Pre-Click Cost & Daily Spend Cap Guardrail
 */

import { useState, useEffect, useRef } from 'react';
import { BrandProfile, PostVariant } from '../types';
import { renderProductionVideoToBlob, uploadMediaBlob } from '../utils/videoExporter';
import {
  Film,
  Mic,
  Square,
  Music,
  Play,
  Download,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Settings2,
  Volume2,
  RefreshCw,
  Image as ImageIcon,
  FileCode2,
  DollarSign,
} from 'lucide-react';

type VideoTemplate = 'product_launch' | 'old_vs_new' | 'explainer' | 'ugc_story';
type MusicStyle = 'ambient_synth' | 'editorial_pulse' | 'launch_momentum' | 'none';
type ImpeccableDir = 'default' | 'distill' | 'bolder' | 'quieter' | 'typeset' | 'polish';

interface SceneBlock {
  id: string;
  label: string;
  durationSec: number;
  spokenScript: string;
  kineticCaption: string;
  visualDirection: string;
  mediaUrl?: string;
}

interface QualityGateReport {
  overallPass: boolean;
  score: number;
  totalDurationSec: number;
  totalWords: number;
  wordsPerSecond: number;
  checks: Array<{ id: string; label: string; passed: boolean; detail: string }>;
}

interface VoiceOption {
  id: string;
  label: string;
  style: string;
  gender: 'female' | 'male';
  accent: string;
}

interface ChatMessage {
  id: string;
  role: 'director' | 'user';
  text: string;
}

interface UnifiedMediaStudioProps {
  brandProfile: BrandProfile;
  onSaveToQueue: (posts: PostVariant[]) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function UnifiedMediaStudio({
  brandProfile,
  onSaveToQueue,
  showNotificationToast,
}: UnifiedMediaStudioProps) {
  const [template, setTemplate] = useState<VideoTemplate>('old_vs_new');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [impeccableDirective, setImpeccableDirective] = useState<ImpeccableDir>('bolder');
  const [projectTitle, setProjectTitle] = useState(`${brandProfile.name} · Video Ad`);
  const [scenes, setScenes] = useState<SceneBlock[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGateReport | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  // Open-Source Voiceover (Kokoro Apache-2.0) & Mic Recording State
  const [voices, setVoices] = useState<VoiceOption[]>([
    { id: 'af_bella', label: 'Bella · Warm Confident', style: 'Commercial Lead', gender: 'female', accent: 'US' },
    { id: 'am_michael', label: 'Michael · Authoritative Founder', style: 'B2B / Documentary', gender: 'male', accent: 'US' },
    { id: 'af_sarah', label: 'Sarah · Crisp Editorial', style: 'Product Explainer', gender: 'female', accent: 'US' },
    { id: 'am_adam', label: 'Adam · Direct & Bold', style: 'High-CTR Hook', gender: 'male', accent: 'US' },
    { id: 'bf_emma', label: 'Emma · Luxury British', style: 'Editorial / Quiet', gender: 'female', accent: 'UK' },
    { id: 'bm_george', label: 'George · Executive British', style: 'Authority / Finance', gender: 'male', accent: 'UK' },
  ]);
  const [selectedVoice, setSelectedVoice] = useState('af_bella');
  const [musicStyle, setMusicStyle] = useState<MusicStyle>('ambient_synth');
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string>('');
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string>('');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);

  // Kokoro / TTS Server Config Drawer
  const [showTtsConfig, setShowTtsConfig] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<'kokoro_local' | 'openai_compatible' | 'openai' | 'browser_free'>('kokoro_local');
  const [ttsBaseUrl, setTtsBaseUrl] = useState('http://127.0.0.1:8880');

  // Render State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string>('');

  // Pre-Click Daily Budget Guardrail State
  const [budgetInfo, setBudgetInfo] = useState<{ todaySpendUsd: number; dailyBudgetUsd: number }>({
    todaySpendUsd: 0,
    dailyBudgetUsd: 5,
  });

  // Parallax-Style Creative Director Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'director',
      text: `I’m your ADNETIKS Creative Director. Tell me in plain English how to shape ${brandProfile.name}’s video — e.g. "Make it Bolder", "Switch to 16:9 widescreen", "Use a British male voice", or "Distill shorter".`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const loadPlan = async (targetTemplate: VideoTemplate, targetAspect?: '9:16' | '16:9') => {
    setIsPlanning(true);
    try {
      const res = await fetch('/api/media/video-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandProfile.name,
          tagline: brandProfile.tagline,
          websiteUrl: brandProfile.websiteUrl,
          offerBrief: brandProfile.tagline,
          template: targetTemplate,
          aspectRatio: targetAspect || (targetTemplate === 'explainer' ? '16:9' : '9:16'),
          impeccableDirective,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setProjectTitle(data.title);
        setAspectRatio(data.aspectRatio);
        setScenes(data.scenes || []);
        setQualityGates(data.qualityGates || null);
      }
    } finally {
      setIsPlanning(false);
    }
  };

  useEffect(() => {
    loadPlan('old_vs_new', '9:16');
    fetch('/api/media/tts-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) {
          if (Array.isArray(d.voices) && d.voices.length > 0) setVoices(d.voices);
          if (d.defaultVoice) setSelectedVoice(d.defaultVoice);
          if (d.baseUrl) setTtsBaseUrl(d.baseUrl);
          if (d.provider) setTtsProvider(d.provider);
        }
      })
      .catch(() => {});
    fetch('/api/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u?.ok) {
          setBudgetInfo({
            todaySpendUsd: u.todaySpendUsd || 0,
            dailyBudgetUsd: typeof u.dailyBudgetUsd === 'number' ? u.dailyBudgetUsd : 5,
          });
        }
      })
      .catch(() => {});
  }, [brandProfile.name]);

  const handleSaveTtsConfig = async () => {
    const res = await fetch('/api/media/tts-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: ttsProvider,
        baseUrl: ttsBaseUrl,
        defaultVoice: selectedVoice,
      }),
    });
    if (res.ok) {
      setShowTtsConfig(false);
      showNotificationToast('Voice Engine Saved', `Open-Source TTS endpoint set to ${ttsBaseUrl} ($0.00/char).`);
    }
  };

  const handleGenerateVoiceover = async () => {
    const fullScript = scenes.map((s) => s.spokenScript).join(' ').trim();
    if (!fullScript) return;
    setIsGeneratingVoice(true);
    setVoiceStatusMsg('');
    try {
      const res = await fetch('/api/media/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullScript,
          voiceId: selectedVoice,
          brandName: brandProfile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        showNotificationToast('Voiceover Notice', data?.error || 'Could not synthesize voiceover.');
        return;
      }

      if (data.audioUrl) {
        setVoiceAudioUrl(data.audioUrl);
        setVoiceStatusMsg(`Ready: ${data.provider} · ${data.voiceLabel} ($${(data.estimatedCostUsd || 0).toFixed(2)})`);
        showNotificationToast('Voiceover Track Ready', `Generated real MP3 narration via ${data.provider}.`);
      } else if (data.mode === 'browser_speech_ready') {
        setVoiceStatusMsg(data.hint || 'Playing instant local neural voice preview.');
        // Play instant zero-cost browser speech preview so the user hears the script immediately!
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(fullScript);
          utter.rate = 1.02;
          window.speechSynthesis.speak(utter);
        }
        showNotificationToast(
          'Playing Free Local Voice Preview',
          'Start Kokoro Docker ("docker compose --profile voice up -d") or record mic to mux MP3 audio into exported video.'
        );
      }
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleToggleMicRecord = async () => {
    if (isRecordingMic) {
      micRecorderRef.current?.stop();
      setIsRecordingMic(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      micRecorderRef.current = rec;
      micChunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) micChunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(micChunksRef.current, { type: 'audio/webm' });
        try {
          const uploaded = await uploadMediaBlob(blob, `voiceover_mic_${Date.now()}.webm`);
          setVoiceAudioUrl(uploaded.url);
          setVoiceStatusMsg(`Mic Voiceover Saved (${(uploaded.sizeBytes / 1024).toFixed(0)} KB · $0.00)`);
          showNotificationToast('Voiceover Recorded', 'Your real voiceover is saved and will mux straight into your exported video!');
        } catch {
          setVoiceAudioUrl(URL.createObjectURL(blob));
        }
      };
      rec.start();
      setIsRecordingMic(true);
      showNotificationToast('Recording Voiceover', 'Read your scene scripts out loud — click Stop Mic when finished.');
    } catch {
      showNotificationToast('Microphone Blocked', 'Allow microphone permission in your browser to record voiceover.');
    }
  };

  const handleUploadSceneImage = async (sceneId: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      try {
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, fileName: file.name }),
        });
        const up = await res.json();
        const url = up?.ok && up?.url ? up.url : dataUrl;
        setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, mediaUrl: url } : s)));
      } catch {
        setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, mediaUrl: dataUrl } : s)));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRenderHdVideo = async () => {
    if (isRendering || scenes.length === 0) return;
    setIsRendering(true);
    setRenderProgress(5);
    try {
      const blob = await renderProductionVideoToBlob({
        title: projectTitle,
        brandName: brandProfile.name,
        domain: (brandProfile.websiteUrl || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, ''),
        aspectRatio,
        scenes,
        voiceAudioUrl: voiceAudioUrl || undefined,
        musicStyle,
        impeccableDirective,
        brandPrimaryColor: brandProfile.brandColors?.primary || '#047857',
        brandSecondaryColor: brandProfile.brandColors?.secondary || '#B45309',
        onProgress: (p) => setRenderProgress(p),
      });

      const localUrl = URL.createObjectURL(blob);
      setRenderedVideoUrl(localUrl);
      try {
        const uploaded = await uploadMediaBlob(
          blob,
          `adnetiks_video_${brandProfile.name.toLowerCase().replace(/\W+/g, '_')}_${Date.now()}.webm`
        );
        setRenderedVideoUrl(uploaded.url);
      } catch {
        // keep local blob URL
      }

      showNotificationToast(
        `${aspectRatio} HD Video Exported ($0.00)`,
        `Rendered "${projectTitle}" with kinetic word-level captions & audio mix — ready to download or schedule.`
      );
    } catch (err) {
      console.error('Render error:', err);
      showNotificationToast('Render Notice', 'Video render could not complete in this browser session.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleSendDirectorMessage = async (overrideMsg?: string) => {
    const text = (overrideMsg ?? chatInput).trim();
    if (!text || isChatting) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setIsChatting(true);
    try {
      const res = await fetch('/api/media/director-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          brandName: brandProfile.name,
          websiteUrl: brandProfile.websiteUrl,
          aspectRatio,
          voiceId: selectedVoice,
          musicStyle,
          impeccableDirective,
          hasAudioTrack: !!voiceAudioUrl || musicStyle !== 'none',
          scenes,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        if (data.aspectRatio) setAspectRatio(data.aspectRatio);
        if (data.voiceId) setSelectedVoice(data.voiceId);
        if (data.musicStyle) setMusicStyle(data.musicStyle);
        if (data.impeccableDirective) setImpeccableDirective(data.impeccableDirective);
        if (Array.isArray(data.scenes)) setScenes(data.scenes);
        if (data.qualityGates) setQualityGates(data.qualityGates);
        setChatMessages((prev) => [
          ...prev,
          { id: `d-${Date.now()}`, role: 'director', text: data.reply || 'Updated your video timeline.' },
        ]);
      }
    } finally {
      setIsChatting(false);
    }
  };

  const handleExportOpenMontageYaml = () => {
    const yaml = [
      `# ADNETIKS -> OpenMontage Compatible Pipeline Manifest`,
      `project: "${projectTitle.replace(/"/g, "'")}"`,
      `brand: "${brandProfile.name}"`,
      `aspect_ratio: "${aspectRatio}"`,
      `impeccable_direction: "${impeccableDirective}"`,
      `voice_engine: "kokoro"`,
      `voice_id: "${selectedVoice}"`,
      `music_bed: "${musicStyle}"`,
      `scenes:`,
      ...scenes.map(
        (s, idx) =>
          `  - index: ${idx + 1}\n    label: "${s.label}"\n    duration_sec: ${s.durationSec}\n    caption: "${s.kineticCaption.replace(/"/g, "'")}"\n    narration: "${s.spokenScript.replace(/"/g, "'")}"`
      ),
    ].join('\n');
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandProfile.name.toLowerCase().replace(/\W+/g, '-')}-openmontage-pipeline.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotificationToast('OpenMontage YAML Exported', 'Saved pipeline manifest for optional external OpenMontage Studio handoff.');
  };

  const handleQueueVideoPost = () => {
    const fullCopy = scenes.map((s) => s.spokenScript).join(' ');
    const newPost: PostVariant = {
      id: `media-video-${Date.now()}`,
      campaignId: `video-${brandProfile.name.toLowerCase().replace(/\W+/g, '-')}`,
      variantLabel: 'Variant A',
      hookAngle: projectTitle,
      content: `${scenes[0]?.kineticCaption || projectTitle}\n\n${fullCopy}\n\n${brandProfile.websiteUrl || ''}`,
      hashtags: [`#${brandProfile.name.replace(/\W+/g, '')}`, '#VideoAd', '#ShortForm'],
      platform: aspectRatio === '16:9' ? 'linkedin' : 'tiktok',
      mediaUrl: renderedVideoUrl || scenes[0]?.mediaUrl,
      mediaType: renderedVideoUrl ? 'video' : 'image',
      scheduledTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      status: 'approved',
      metrics: { impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, conversionRate: 0 },
    };
    onSaveToQueue([newPost]);
    showNotificationToast('Video Queued to 03 Distribution', `"${projectTitle}" is ready for publishing in your Calendar Queue.`);
  };

  const updateScene = (id: string, patch: Partial<SceneBlock>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* TOP BAR: PRODUCTION PIPELINES + PRE-CLICK COST & DAILY SPEND CAP */}
      <div className="p-4 rounded-2xl bg-[#111116] border border-[#222232] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'old_vs_new', label: 'Old Way vs New Way (9:16)' },
              { id: 'product_launch', label: 'Product Launch Reel (9:16)' },
              { id: 'explainer', label: 'Animated Explainer (16:9)' },
              { id: 'ugc_story', label: 'Founder Story Ad (9:16)' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={isPlanning}
              onClick={() => {
                setTemplate(p.id);
                loadPlan(p.id, p.id === 'explainer' ? '16:9' : '9:16');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                template === p.id
                  ? 'bg-white text-[#0A0A0C] border-white'
                  : 'bg-[#0A0A0E] text-[#9A9AB6] border-[#262636] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 font-bold">
            Render + Kokoro Voice: $0.00
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0A0A0E] border border-[#28283A] text-slate-300 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-400" />
            <span>
              24h Spend: ${budgetInfo.todaySpendUsd.toFixed(2)} / ${budgetInfo.dailyBudgetUsd.toFixed(2)} Cap
            </span>
          </span>
        </div>
      </div>

      {/* MAIN 2-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT (7 COLS): TIMELINE + KOKORO OPEN-SOURCE VOICEOVER + MUSIC + QUALITY GATES */}
        <div className="lg:col-span-7 space-y-5">
          {/* Scene-by-Scene Timeline Editor */}
          <div className="p-5 rounded-2xl bg-[#111116] border border-[#222232] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-extrabold text-white">
                  6-Stage Scene Timeline ({scenes.reduce((s, x) => s + x.durationSec, 0)}s · {aspectRatio})
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                {(['9:16', '16:9'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAspectRatio(r)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                      aspectRatio === r ? 'bg-red-600 text-white' : 'bg-[#0A0A0E] text-slate-400 border border-[#28283A]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleExportOpenMontageYaml}
                  className="px-2.5 py-1 rounded-lg bg-[#181824] hover:bg-[#232334] border border-[#2C2C40] text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                  title="Export OpenMontage-compatible YAML pipeline manifest"
                >
                  <FileCode2 className="w-3 h-3 text-cyan-400" />
                  <span>OpenMontage YAML</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {scenes.map((sc) => (
                <div
                  key={sc.id}
                  className="p-3.5 rounded-xl bg-[#0A0A0E] border border-[#20202E] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-cyan-300">{sc.label}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-[#8B8BA8] flex items-center gap-1">
                        <span>Sec:</span>
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={sc.durationSec}
                          onChange={(e) => updateScene(sc.id, { durationSec: Math.max(2, Number(e.target.value) || 4) })}
                          className="w-12 px-1.5 py-0.5 rounded bg-[#14141E] border border-[#2A2A3B] text-white font-mono text-[11px]"
                        />
                      </label>
                      <label className="px-2 py-0.5 rounded-md bg-[#161622] hover:bg-[#222234] border border-[#2A2A3B] text-[10px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer">
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                        <span>{sc.mediaUrl ? 'Image Set ✓' : 'Scene Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadSceneImage(sc.id, f);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={sc.kineticCaption}
                    onChange={(e) => updateScene(sc.id, { kineticCaption: e.target.value })}
                    placeholder="On-screen kinetic caption..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121A] border border-[#252536] text-xs font-extrabold text-white focus:outline-none focus:border-red-500"
                  />

                  <textarea
                    rows={2}
                    value={sc.spokenScript}
                    onChange={(e) => updateScene(sc.id, { spokenScript: e.target.value })}
                    placeholder="Spoken voiceover narration..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121A] border border-[#252536] text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Open-Source Voiceover (Kokoro Apache-2.0) & Music Console */}
          <div className="p-5 rounded-2xl bg-[#111116] border border-[#222232] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  Open-Source Voice (Kokoro · $0.00) &amp; Music Bed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTtsConfig(!showTtsConfig)}
                className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showTtsConfig ? 'Hide Kokoro Server' : 'Kokoro Server URL'}</span>
              </button>
            </div>

            {showTtsConfig && (
              <div className="p-3.5 rounded-xl bg-[#0A0A0F] border border-cyan-700/40 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={ttsProvider}
                    onChange={(e) => setTtsProvider(e.target.value as any)}
                    className="px-2.5 py-2 rounded-lg bg-[#14141E] border border-[#2A2A3B] text-white text-xs"
                  >
                    <option value="kokoro_local">Kokoro-FastAPI (Apache 2.0 · $0.00)</option>
                    <option value="openai_compatible">Chatterbox / Qwen3-TTS / Custom OpenAI TTS</option>
                    <option value="browser_free">Instant Free Browser Voice Only</option>
                    <option value="openai">OpenAI TTS (Requires OPENAI_API_KEY)</option>
                  </select>
                  <input
                    type="url"
                    value={ttsBaseUrl}
                    onChange={(e) => setTtsBaseUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8880"
                    className="px-2.5 py-2 rounded-lg bg-[#14141E] border border-[#2A2A3B] text-white font-mono text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-[#8B8BA8]">
                  <span>1-Command Docker voice sidecar: <code className="text-emerald-300">docker compose --profile voice up -d</code></span>
                  <button
                    type="button"
                    onClick={handleSaveTtsConfig}
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Kokoro Studio Voice</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0E] border border-[#28283A] text-xs text-white"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.accent} · {v.style})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>Studio Music Bed</span>
                </label>
                <select
                  value={musicStyle}
                  onChange={(e) => setMusicStyle(e.target.value as MusicStyle)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0E] border border-[#28283A] text-xs text-white"
                >
                  <option value="ambient_synth">Warm Ambient Synth ($0.00)</option>
                  <option value="editorial_pulse">Editorial Minimal Pulse ($0.00)</option>
                  <option value="launch_momentum">High-Energy Launch Beat ($0.00)</option>
                  <option value="none">Voiceover Only (No Music)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isGeneratingVoice}
                onClick={handleGenerateVoiceover}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingVoice ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Generate Kokoro Voiceover ($0.00)</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMicRecord}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                  isRecordingMic
                    ? 'bg-red-600 border-red-500 text-white animate-pulse'
                    : 'bg-[#181824] hover:bg-[#232334] border-[#2C2C40] text-slate-200'
                }`}
              >
                {isRecordingMic ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-red-400" />}
                <span>{isRecordingMic ? 'Stop Recording' : 'Record My Voice'}</span>
              </button>
            </div>

            {voiceAudioUrl && (
              <audio controls src={voiceAudioUrl} className="w-full h-9" />
            )}
            {voiceStatusMsg && (
              <p className="text-[11px] text-[#9A9AB6] leading-snug">{voiceStatusMsg}</p>
            )}
          </div>

          {/* Automated Video Quality Gates */}
          {qualityGates && (
            <div className="p-4 rounded-2xl bg-[#111116] border border-[#222232] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Automated Video Quality Gates</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[10px] font-mono font-bold text-emerald-300">
                  {qualityGates.score}/100 · {qualityGates.totalDurationSec}s
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {qualityGates.checks.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-[#0A0A0E] border border-[#1E1E2C] flex items-start gap-2 text-[11px]"
                  >
                    {c.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white">{c.label}</div>
                      <div className="text-[10px] text-[#8B8BA8]">{c.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT (5 COLS): LIVE VIDEO RENDERER + CREATIVE DIRECTOR AGENT CHAT */}
        <div className="lg:col-span-5 space-y-5">
          {/* Render & Preview Card */}
          <div className="p-5 rounded-2xl bg-[#111116] border border-[#222232] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                HD Video Output ({aspectRatio})
              </span>
              <span className="text-[10px] font-mono text-cyan-300 uppercase">
                Impeccable: {impeccableDirective}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#070A0F] border border-[#222232] min-h-[240px] flex items-center justify-center p-4">
              {renderedVideoUrl ? (
                <video
                  src={renderedVideoUrl}
                  controls
                  className="max-h-[340px] w-auto rounded-lg shadow-2xl"
                />
              ) : (
                <div className="text-center space-y-2.5 max-w-xs">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                    {brandProfile.name} · {aspectRatio} Preview
                  </div>
                  <div className="text-lg font-black text-white leading-tight">
                    {scenes[0]?.kineticCaption || projectTitle}
                  </div>
                  <p className="text-xs text-[#9494B2]">
                    {scenes[0]?.spokenScript || 'Click Render HD Video to composite all 4 scenes, word-level captions, voiceover & music.'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isRendering || scenes.length === 0}
              onClick={handleRenderHdVideo}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-red-900/35 cursor-pointer"
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Rendering HD Video ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Render {aspectRatio} HD Video ($0.00)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              {renderedVideoUrl ? (
                <a
                  href={renderedVideoUrl}
                  download={`${brandProfile.name.toLowerCase().replace(/\W+/g, '-')}-${aspectRatio.replace(':', 'x')}.webm`}
                  className="py-2 rounded-xl bg-[#181824] hover:bg-[#232334] border border-[#2E2E42] text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .webm</span>
                </a>
              ) : (
                <div className="py-2 rounded-xl bg-[#0C0C12] border border-[#1E1E2A] text-[11px] text-[#6E6E88] flex items-center justify-center">
                  Render to download
                </div>
              )}
              <button
                type="button"
                onClick={handleQueueVideoPost}
                className="py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Queue to 03</span>
              </button>
            </div>
          </div>

          {/* Parallax-Style Creative Director Agent Chat */}
          <div className="p-4 rounded-2xl bg-[#111116] border border-[#222232] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Creative Director Agent Chat</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300">Live Timeline Control</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-red-950/40 border border-red-800/40 text-white ml-6'
                      : 'bg-[#0A0A0F] border border-[#20202E] text-slate-200 mr-4'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {[
                'Make it Bolder',
                'Switch to 16:9 widescreen',
                'Distill shorter',
                'Use a British male voice',
                'Calm luxury quieter style',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendDirectorMessage(chip)}
                  className="px-2 py-1 rounded-md bg-[#171722] hover:bg-[#232334] border border-[#28283A] text-[10px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendDirectorMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tell the director how to edit scenes, voice, or style..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#0A0A0E] border border-[#28283A] text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isChatting}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
              >
                {isChatting ? '...' : 'Apply'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
