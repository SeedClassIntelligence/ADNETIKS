/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Video Studio & Short-Form Video Engine
 * Native 9:16 video creator with desktop webcam & phone camera recording,
 * video file upload, trending commercial audio, and 3-beat teleprompter storyboarding.
 */

import { useState, useEffect, useRef } from 'react';
import {
  TrendingSound,
  TikTokVideoTemplate,
  TikTokAdCampaignMetrics,
  TikTokStoryboardBeat,
  UserRole,
  CampaignVideoAsset,
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
  Camera,
  Upload,
  RefreshCw,
  Square,
  Circle,
  Volume2,
  Download,
  CheckCircle2,
  Smartphone,
  Monitor,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';

interface AdnetiksVideoStudioProps {
  trendingSounds: TrendingSound[];
  templates: TikTokVideoTemplate[];
  adMetrics: TikTokAdCampaignMetrics;
  onSendScriptToQueue: (scriptTitle: string, scriptContent: string) => void;
  onPlugIntoCampaign?: (video: CampaignVideoAsset) => void;
  userRole: UserRole;
  showNotificationToast: (title: string, message: string) => void;
}

export default function AdnetiksVideoStudio({
  trendingSounds,
  templates,
  adMetrics,
  onSendScriptToQueue,
  onPlugIntoCampaign,
  userRole,
  showNotificationToast,
}: AdnetiksVideoStudioProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [selectedSoundId, setSelectedSoundId] = useState<string>(trendingSounds[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);

  // Video Source Mode: Storyboard Template vs Live Camera vs File Upload
  const [videoMode, setVideoMode] = useState<'template' | 'camera' | 'upload'>('template');
  
  // Camera & Recording State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const activeSound = trendingSounds.find((s) => s.id === selectedSoundId) || trendingSounds[0];

  // Storyboard Beat Ticker
  useEffect(() => {
    let timer: any;
    if (isPlaying && activeTemplate && videoMode === 'template') {
      timer = setInterval(() => {
        setCurrentBeatIndex((prev) => (prev + 1) % activeTemplate.beats.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeTemplate, videoMode]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Camera Management
  const startCamera = async (overrideFacing?: 'user' | 'environment') => {
    stopCamera();
    const mode = overrideFacing || facingMode;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          aspectRatio: 9 / 16,
        },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      showNotificationToast('Camera Connected', `Active camera: ${mode === 'user' ? 'Front / Webcam' : 'Rear Camera'}`);
    } catch (err: any) {
      console.error('Camera access error:', err);
      showNotificationToast('Camera Permission Needed', 'Please allow camera and microphone access to record video.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (isCameraActive) {
      startCamera(next);
    }
  };

  // Recording Controls
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }

    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          triggerActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerActualRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        setRecordingSeconds(0);
        showNotificationToast('Video Recorded', 'Recorded video is ready for preview and queue dispatch.');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e: any) {
      console.error('MediaRecorder start error:', e);
      showNotificationToast('Recording Error', e.message || 'Could not start recording');
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Video File Upload
  const handleVideoUpload = (file: File) => {
    if (!file || !file.type.startsWith('video/')) {
      showNotificationToast('Invalid File', 'Please upload a video file (MP4, MOV, WebM).');
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setVideoMode('upload');
    showNotificationToast('Video Ingested', `Loaded "${file.name}" into 9:16 simulator.`);
  };

  const activeBeat = activeTemplate?.beats[currentBeatIndex] || activeTemplate?.beats[0];

  const handleExportScript = () => {
    if (!activeTemplate) return;
    const fullScript = activeTemplate.beats
      .map((b) => `[${b.timing}] ${b.beatTitle}\nVisual: ${b.visualDirection}\nAudio: "${b.spokenAudio}"\nOverlay: ${b.onScreenText}`)
      .join('\n\n');

    onSendScriptToQueue(activeTemplate.title, fullScript);
    showNotificationToast(
      'Video Script Exported to Queue',
      `Locked 3-beat video script for "${activeTemplate.title}" into campaign scheduler.`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F2A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-red-500" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              ADNETIKS Video Studio &amp; Camera Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8B8BA8] mt-1">
            Build high-converting 9:16 video ads with live desktop/phone camera recording, video upload, teleprompter overlays, and trending commercial audio.
          </p>
        </div>

        {/* Video Source Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111116] border border-[#1F1F2A] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => {
              setVideoMode('template');
              stopCamera();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              videoMode === 'template' ? 'bg-[#18181F] text-white border border-[#2A2A38] shadow-sm' : 'text-[#8B8BA8] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Storyboard Demo
          </button>
          <button
            onClick={() => {
              setVideoMode('camera');
              startCamera();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              videoMode === 'camera' ? 'bg-red-950/80 text-white border border-red-700/80 shadow-sm shadow-red-900/30' : 'text-[#8B8BA8] hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-red-400" />
            Camera / Webcam
          </button>
          <label
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              videoMode === 'upload' ? 'bg-[#18181F] text-white border border-[#2A2A38]' : 'text-[#8B8BA8] hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Upload Video
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleVideoUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* TOP STRIP: TRENDING SOUNDS & COMMERCIAL AUDIO RADAR */}
      <div className="bg-[#111116] border border-[#1F1F2A] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F1F2A] pb-2.5">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-display">
              Commercial Audio Radar — Royalty-Cleared Sounds
            </h2>
          </div>
          <span className="text-[11px] text-[#8B8BA8] font-mono">
            Directly clearable for brand ads &amp; creator posts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {trendingSounds.map((sound) => {
            const isSelected = sound.id === selectedSoundId;
            return (
              <div
                key={sound.id}
                onClick={() => setSelectedSoundId(sound.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                  isSelected
                    ? 'bg-[#18181F] border-cyan-500/80 ring-1 ring-cyan-500/40 text-white'
                    : 'bg-[#0D0D11] border-[#1F1F2A] text-[#8B8BA8] hover:border-[#2A2A38]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-white truncate max-w-[180px]">
                    {sound.title}
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    {sound.momentumScore}% Spike
                  </span>
                </div>
                <div className="text-[11px] text-[#8B8BA8] truncate">{sound.artist}</div>
                <div className="flex items-center justify-between text-[10px] text-[#52526B] font-mono pt-1 border-t border-[#1F1F2A]">
                  <span>{sound.duration} · {sound.bpm} BPM</span>
                  <span className="text-slate-300">{sound.recommendedVibe}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN: 9:16 PHONE SIMULATOR & STORYBOARD / CAMERA EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive 9:16 Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="w-full max-w-[320px] bg-[#0A0A0C] rounded-[44px] border-4 border-[#1F1F2A] shadow-2xl p-2.5 relative overflow-hidden ring-1 ring-[#2A2A38]">
            
            {/* Phone Speaker Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#111116] rounded-full z-30 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-[#0A0A0C] block" />
            </div>

            {/* Video Viewport (9:16 Ratio) */}
            <div className="relative aspect-[9/16] rounded-[34px] overflow-hidden bg-black flex flex-col justify-between p-4">
              
              {/* SOURCE 1: Camera Feed */}
              {videoMode === 'camera' && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {!isCameraActive && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-20 space-y-2">
                      <Camera className="w-10 h-10 text-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-white">Camera Standby</span>
                      <button
                        onClick={() => startCamera()}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* SOURCE 2: Uploaded or Recorded Video File */}
              {videoMode === 'upload' && uploadedVideoUrl && (
                <video
                  src={uploadedVideoUrl}
                  controls
                  loop
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* SOURCE 3: Storyboard Template Background Image */}
              {videoMode === 'template' && (
                <img
                  src={activeTemplate.previewImageUrl}
                  alt="Video Preview"
                  referrerPolicy="no-referrer"
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                    isPlaying ? 'scale-105 filter brightness-95' : 'scale-100 filter brightness-85'
                  }`}
                />
              )}

              {/* Recorded Video Playback Preview */}
              {recordedVideoUrl && videoMode === 'camera' && !isRecording && (
                <div className="absolute inset-0 bg-black z-10">
                  <video
                    src={recordedVideoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Scrim Overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-10" />

              {/* Top Bar inside Phone */}
              <div className="relative z-20 flex items-center justify-between text-white text-xs pt-4 font-semibold">
                <span className="opacity-80">Following</span>
                <span className="border-b-2 border-red-500 pb-0.5 text-red-400">For You</span>
                <span className="opacity-80">Search</span>
              </div>

              {/* Recording Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <span className="text-6xl font-black text-red-500 animate-ping font-display">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Central Play/Pause Trigger for Template */}
              {videoMode === 'template' && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 z-20 flex items-center justify-center m-auto w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm text-white hover:scale-110 transition-transform"
                  title={isPlaying ? 'Pause simulation' : 'Play video simulation'}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
              )}

              {/* TELEPROMPTER / ON-SCREEN TIMED TEXT (Active Beat) */}
              <div className="relative z-20 my-auto text-center px-2">
                <div className="inline-block bg-black/80 backdrop-blur-md text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-white/20 shadow-xl animate-in zoom-in-95 duration-200">
                  {activeBeat.onScreenText}
                </div>
                {/* Spoken Teleprompter cue */}
                <p className="text-[11px] text-amber-300 font-medium bg-black/60 rounded-md p-1.5 mt-2 border border-amber-500/30">
                  🗣️ Teleprompter: &quot;{activeBeat.spokenAudio}&quot;
                </p>
              </div>

              {/* Bottom UI Overlays */}
              <div className="relative z-20 flex items-end justify-between gap-3 text-white">
                <div className="space-y-1.5 flex-1 min-w-0 pb-1">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <AdnetiksLogo size={16} />
                    <span>adnetiks_studio</span>
                    <span className="text-[10px] text-red-400 font-normal">· Creator</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono truncate">
                    <Music className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{activeSound.title} — {activeSound.artist}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2.5 shrink-0 text-center text-[10px]">
                  <div className="w-7 h-7 rounded-full border border-white overflow-hidden">
                    <img src="/src/assets/images/avatar_tech_founder_1793456642984.jpg" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                  <MessageCircle className="w-5 h-5" />
                  <Share2 className="w-5 h-5" />
                </div>
              </div>

            </div>
          </div>

          {/* Camera Controls Panel when in Camera Mode */}
          {videoMode === 'camera' && (
            <div className="w-full max-w-[320px] mt-3 p-3 rounded-2xl bg-[#111116] border border-[#1F1F2A] flex items-center justify-between gap-2">
              <button
                onClick={toggleCameraFacing}
                className="p-2 rounded-xl bg-[#18181F] text-[#8B8BA8] hover:text-white border border-[#2A2A38]"
                title="Flip Camera (Front/Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-950/40"
                >
                  <Circle className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                  Record Beat
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs flex items-center justify-center gap-2 border border-red-500/40"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-red-500" />
                  Stop ({recordingSeconds}s)
                </button>
              )}

              {recordedVideoUrl && (
                <a
                  href={recordedVideoUrl}
                  download="adnetiks-video-recording.webm"
                  className="p-2 rounded-xl bg-[#18181F] text-emerald-400 hover:text-white border border-[#2A2A38]"
                  title="Download Recording"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

        </div>

        {/* Right Column: 3-Beat Storyboard Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Template Selector Bar */}
          <div className="p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
                Short-Form Video Frameworks
              </span>
              <span className="text-xs text-red-400 font-mono">3-Beat Retention Arc</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setCurrentBeatIndex(0);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all space-y-1 ${
                      isSelected
                        ? 'bg-[#18181F] border-red-500/80 ring-1 ring-red-500/40 text-white'
                        : 'bg-[#0D0D11] border-[#1F1F2A] text-[#8B8BA8] hover:border-[#2A2A38]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-red-400 truncate">
                      {tmpl.category}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">
                      {tmpl.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Beat Cards */}
          <div className="space-y-3">
            {activeTemplate.beats.map((beat, idx) => {
              const isActive = idx === currentBeatIndex;
              return (
                <div
                  key={beat.beatNumber}
                  onClick={() => setCurrentBeatIndex(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isActive
                      ? 'bg-[#18181F] border-red-500/80 shadow-md ring-1 ring-red-500/40'
                      : 'bg-[#111116] border-[#1F1F2A] hover:border-[#2A2A38]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-red-600 text-white' : 'bg-[#18181F] text-[#8B8BA8]'
                      }`}>
                        {beat.beatNumber}
                      </span>
                      <h3 className="text-xs font-bold text-white font-display">
                        {beat.beatTitle}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold bg-[#0D0D11] px-2 py-0.5 rounded-md border border-[#1F1F2A]">
                      {beat.timing}
                    </span>
                  </div>

                  <p className="text-xs text-white bg-[#0D0D11] p-2.5 rounded-xl border border-[#1F1F2A] italic">
                    🗣️ Spoken: &quot;{beat.spokenAudio}&quot;
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#8B8BA8] pt-1">
                    <span>🎬 Visual: {beat.visualDirection}</span>
                    <span className="text-amber-400 font-medium">Text: {beat.onScreenText}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="p-4 rounded-2xl bg-[#111116] border border-[#1F1F2A] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#8B8BA8]">
              Plug this video directly into your active Campaign Builder or lock into Smart Queue.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onPlugIntoCampaign && (
                <button
                  onClick={() => {
                    const source: CampaignVideoAsset['source'] =
                      videoMode === 'camera' && recordedVideoUrl
                        ? 'recorded'
                        : videoMode === 'upload' && uploadedVideoUrl
                        ? 'uploaded'
                        : 'ai_generated';
                    onPlugIntoCampaign({
                      id: `vid-${Date.now()}`,
                      title: activeTemplate.title,
                      hookAngle: activeTemplate.category,
                      source,
                      aspectRatio: '9:16',
                      videoUrl:
                        source === 'recorded'
                          ? recordedVideoUrl || undefined
                          : source === 'uploaded'
                          ? uploadedVideoUrl || undefined
                          : undefined,
                      voiceTone: 'Creator Direct',
                      backgroundTrack: activeSound?.title || 'Trending Commercial Audio',
                      beats: activeTemplate.beats.map((b) => ({
                        timing: b.timing,
                        title: b.beatTitle,
                        spokenScript: b.spokenAudio,
                        visualDirection: b.visualDirection,
                        kineticOverlay: b.onScreenText,
                      })),
                      attachedAt: new Date().toISOString(),
                    });
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-950/40 flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Plug Into Campaign Builder</span>
                </button>
              )}
              <button
                onClick={handleExportScript}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Export Script to Queue</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
