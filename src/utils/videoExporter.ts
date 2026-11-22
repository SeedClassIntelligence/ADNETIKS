/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Real 9:16 HD Video Compositor & Exporter
 * Composites the 3-beat AI video storyboard (artwork, Ken Burns motion, kinetic overlays,
 * live waveform bars, subtitles, brand badge, and rhythmic Web Audio synth bed) into a real
 * downloadable and server-persisted 720x1280 9:16 video file.
 */

import { AIVideoBeat } from '../types';

export interface RenderVideoOptions {
  title: string;
  brandHandle: string;
  voiceTone: string;
  musicStyle: string;
  beats: AIVideoBeat[];
  backgroundImageUrl?: string;
  waveform?: number[];
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  onProgress?: (pct: number) => void;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function loadImageSafe(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderAiVideoToBlob(opts: RenderVideoOptions): Promise<Blob> {
  const width = 720;
  const height = 1280;
  const fps = 30;
  const beatDurationMs = 3000;
  const beats = opts.beats.length > 0 ? opts.beats : [
    {
      timing: '0s - 3s',
      title: 'Beat 1',
      spokenScript: 'Built with ADNETIKS Autonomous Creative Studio.',
      visualDirection: 'Opening shot',
      kineticOverlay: opts.title.toUpperCase(),
    },
  ];
  const totalDurationMs = beats.length * beatDurationMs;
  const waveform = opts.waveform && opts.waveform.length > 0
    ? opts.waveform
    : [40, 75, 30, 90, 60, 100, 45, 80, 65, 95, 35, 85, 70, 90, 50];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const bgImage = await loadImageSafe(opts.backgroundImageUrl);

  // Set up subtle synthesized rhythmic audio track via Web Audio API
  let audioCtx: AudioContext | null = null;
  let audioStreamTrack: MediaStreamTrack | null = null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.16;
      masterGain.connect(dest);

      // Subtle low synth pulse every 0.5s
      const totalSecs = totalDurationMs / 1000;
      const baseNotes = [110, 130.81, 146.83, 164.81];
      for (let t = 0; t < totalSecs; t += 0.5) {
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = opts.musicStyle.toLowerCase().includes('lo-fi') ? 'sine' : 'triangle';
        osc.frequency.value = baseNotes[Math.floor(t * 2) % baseNotes.length];
        env.gain.setValueAtTime(0.001, audioCtx.currentTime + t);
        env.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + t + 0.04);
        env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.42);
        osc.connect(env);
        env.connect(masterGain);
        osc.start(audioCtx.currentTime + t);
        osc.stop(audioCtx.currentTime + t + 0.45);
      }
      audioStreamTrack = dest.stream.getAudioTracks()[0] || null;
    }
  } catch {
    // Silent fallback if AudioContext is restricted
  }

  const canvasStream = canvas.captureStream(fps);
  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  if (audioStreamTrack) tracks.push(audioStreamTrack);
  const combinedStream = new MediaStream(tracks);

  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const chosenMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: chosenMime,
    videoBitsPerSecond: 3_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  const pAccent = opts.brandPrimaryColor || '#E8192C';
  const sAccent = opts.brandSecondaryColor || '#06B6D4';
  const beatPalettes = [
    { top: '#1A0B12', mid: '#0A0A0C', bottom: '#120A10', accent: pAccent },
    { top: '#0A1620', mid: '#0A0A0C', bottom: '#0A121C', accent: sAccent },
    { top: '#180B24', mid: '#0A0A0C', bottom: '#120A1A', accent: pAccent },
  ];

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      if (audioCtx) audioCtx.close().catch(() => {});
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
    recorder.onerror = (err) => {
      if (audioCtx) audioCtx.close().catch(() => {});
      reject(err);
    };
  });

  recorder.start(100);
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    const drawFrame = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);
      if (opts.onProgress) opts.onProgress(Math.round(progress * 100));

      const beatIdx = Math.min(beats.length - 1, Math.floor(elapsed / beatDurationMs));
      const beatLocalProgress = (elapsed % beatDurationMs) / beatDurationMs;
      const beat = beats[beatIdx];
      const palette = beatPalettes[beatIdx % beatPalettes.length];

      // 1. Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, palette.top);
      bgGrad.addColorStop(0.5, palette.mid);
      bgGrad.addColorStop(1, palette.bottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Background artwork with Ken Burns gentle zoom
      if (bgImage) {
        ctx.save();
        ctx.globalAlpha = 0.42;
        const scale = 1.02 + progress * 0.1;
        const imgAspect = bgImage.width / bgImage.height;
        const canvasAspect = width / height;
        let drawW = width * scale;
        let drawH = height * scale;
        if (imgAspect > canvasAspect) {
          drawH = height * scale;
          drawW = drawH * imgAspect;
        } else {
          drawW = width * scale;
          drawH = drawW / imgAspect;
        }
        ctx.drawImage(bgImage, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
        ctx.restore();
      }

      // 3. Dark cinematic vignette overlay
      const vig = ctx.createLinearGradient(0, 0, 0, height);
      vig.addColorStop(0, 'rgba(0,0,0,0.72)');
      vig.addColorStop(0.35, 'rgba(0,0,0,0.18)');
      vig.addColorStop(0.7, 'rgba(0,0,0,0.35)');
      vig.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      // 4. Top progress bar across beats
      const segGap = 10;
      const segW = (width - 80 - segGap * (beats.length - 1)) / beats.length;
      for (let i = 0; i < beats.length; i++) {
        const sx = 40 + i * (segW + segGap);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        drawRoundedRect(ctx, sx, 44, segW, 6, 3);
        ctx.fill();
        const fillRatio = i < beatIdx ? 1 : i === beatIdx ? beatLocalProgress : 0;
        if (fillRatio > 0) {
          ctx.fillStyle = palette.accent;
          drawRoundedRect(ctx, sx, 44, segW * fillRatio, 6, 3);
          ctx.fill();
        }
      }

      // 5. Top Scene Pill
      ctx.save();
      drawRoundedRect(ctx, 40, 72, 340, 44, 22);
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      ctx.fill();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(66, 94, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${beat.timing}  ·  SCENE ${beatIdx + 1}/${beats.length}`, 86, 100);
      ctx.restore();

      // 6. Center Kinetic Typography Card
      ctx.save();
      ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
      const overlayLines = wrapText(ctx, beat.kineticOverlay || beat.title, width - 130);
      const lineH = 56;
      const boxH = overlayLines.length * lineH + 56;
      const boxY = height * 0.44 - boxH / 2;

      drawRoundedRect(ctx, 44, boxY, width - 88, boxH, 24);
      ctx.fillStyle = 'rgba(8, 8, 12, 0.82)';
      ctx.fill();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      overlayLines.forEach((ln, li) => {
        ctx.fillText(ln, width / 2, boxY + 56 + li * lineH);
      });
      ctx.restore();

      // 7. Pulsing Audio Waveform Visualizer
      const barCount = waveform.length;
      const barW = 12;
      const barGap = 12;
      const totalBarW = barCount * barW + (barCount - 1) * barGap;
      const startX = (width - totalBarW) / 2;
      const waveBaseY = boxY + boxH + 88;
      const phase = elapsed / 140;

      for (let i = 0; i < barCount; i++) {
        const dyn = 0.45 + 0.55 * Math.abs(Math.sin(phase + i * 0.55));
        const h = Math.max(14, (waveform[i] / 100) * 68 * dyn);
        ctx.fillStyle = palette.accent;
        drawRoundedRect(ctx, startX + i * (barW + barGap), waveBaseY - h, barW, h, 6);
        ctx.fill();
      }

      // 8. Bottom Subtitle Box + Brand Watermark
      ctx.save();
      ctx.font = 'italic 24px "Segoe UI", Arial, sans-serif';
      const subLines = wrapText(ctx, `"${beat.spokenScript}"`, width - 120).slice(0, 3);
      const subBoxH = subLines.length * 34 + 62;
      const subBoxY = height - subBoxH - 126;

      drawRoundedRect(ctx, 40, subBoxY, width - 80, subBoxH, 18);
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = palette.accent;
      ctx.font = 'bold 16px "Segoe UI", monospace';
      ctx.fillText(`🎙 ${opts.voiceTone.toUpperCase()}  ·  ♪ ${opts.musicStyle.toUpperCase()}`, 62, subBoxY + 30);

      ctx.fillStyle = '#F1F5F9';
      ctx.font = 'italic 23px "Segoe UI", Arial, sans-serif';
      subLines.forEach((ln, li) => {
        ctx.fillText(ln, 62, subBoxY + 64 + li * 34);
      });

      // Brand Footer
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.fillText(opts.brandHandle, 44, height - 64);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '18px "Segoe UI", Arial, sans-serif';
      ctx.fillText(opts.title.slice(0, 48), 44, height - 34);
      ctx.restore();

      if (elapsed < totalDurationMs) {
        requestAnimationFrame(drawFrame);
      } else {
        if (opts.onProgress) opts.onProgress(100);
        resolve();
      }
    };
    requestAnimationFrame(drawFrame);
  });

  recorder.stop();
  return recordingPromise;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function uploadMediaBlob(blob: Blob, fileName: string): Promise<{ url: string; filename: string; sizeBytes: number }> {
  const dataUrl = await blobToDataUrl(blob);
  const res = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl, fileName }),
  });
  if (!res.ok) {
    throw new Error('Failed to persist media file to server vault');
  }
  return res.json();
}

export interface ProductionSceneInput {
  id: string;
  label: string;
  durationSec: number;
  spokenScript: string;
  kineticCaption: string;
  mediaUrl?: string;
}

export interface RenderProductionVideoOptions {
  title: string;
  brandName: string;
  domain?: string;
  aspectRatio: '9:16' | '16:9';
  scenes: ProductionSceneInput[];
  voiceAudioUrl?: string;
  musicStyle: 'ambient_synth' | 'editorial_pulse' | 'launch_momentum' | 'none';
  impeccableDirective?: 'default' | 'distill' | 'bolder' | 'quieter' | 'typeset' | 'polish';
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  onProgress?: (pct: number) => void;
}

/**
 * Multi-Stage Production Video Compositor (9:16 Vertical OR 16:9 Widescreen)
 * Mixes per-scene visuals, Impeccable typography, word-by-word highlighted subtitles,
 * real Kokoro/Mic voiceover audio track, and optional WebAudio music bed into a real WebM video.
 */
export async function renderProductionVideoToBlob(opts: RenderProductionVideoOptions): Promise<Blob> {
  const isWide = opts.aspectRatio === '16:9';
  const width = isWide ? 1280 : 720;
  const height = isWide ? 720 : 1280;
  const fps = 30;
  const scenes = opts.scenes.length > 0 ? opts.scenes : [
    {
      id: 'sc-1',
      label: '01 · Hero',
      durationSec: 4,
      spokenScript: opts.title,
      kineticCaption: opts.brandName.toUpperCase(),
    },
  ];

  // Compress preview render time slightly while keeping smooth pacing (cap total at 14s max for snappy browser render)
  const rawTotalSec = scenes.reduce((s, sc) => s + Math.max(2, sc.durationSec), 0);
  const scale = rawTotalSec > 14 ? 14 / rawTotalSec : 1;
  const timedScenes = scenes.map((sc) => ({
    ...sc,
    renderMs: Math.round(Math.max(2, sc.durationSec) * scale * 1000),
  }));
  const totalDurationMs = timedScenes.reduce((s, sc) => s + sc.renderMs, 0);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const sceneImages = await Promise.all(timedScenes.map((sc) => loadImageSafe(sc.mediaUrl)));
  const primary = opts.brandPrimaryColor || '#047857';
  const secondary = opts.brandSecondaryColor || '#B45309';
  const directive = opts.impeccableDirective || 'default';

  const canvasStream = canvas.captureStream(fps);
  const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  let audioCtx: AudioContext | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      const now = audioCtx.currentTime;

      // 1. Mix real voiceover track (Kokoro MP3 or recorded Mic take) if present
      if (opts.voiceAudioUrl) {
        try {
          const resp = await fetch(opts.voiceAudioUrl);
          if (resp.ok) {
            const arrBuf = await resp.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(arrBuf);
            const src = audioCtx.createBufferSource();
            src.buffer = decoded;
            const voiceGain = audioCtx.createGain();
            voiceGain.gain.value = 1.0;
            src.connect(voiceGain);
            voiceGain.connect(dest);
            src.start(now);
          }
        } catch {
          // continue with music bed if voice track decode fails
        }
      }

      // 2. Mix selectable studio music bed
      if (opts.musicStyle !== 'none') {
        const master = audioCtx.createGain();
        master.gain.value = opts.voiceAudioUrl ? 0.08 : 0.16;
        master.connect(dest);

        const bass = audioCtx.createOscillator();
        bass.type = opts.musicStyle === 'ambient_synth' ? 'sine' : 'triangle';
        bass.frequency.setValueAtTime(opts.musicStyle === 'launch_momentum' ? 65 : 55, now);
        bass.connect(master);
        bass.start(now);
        bass.stop(now + totalDurationMs / 1000 + 0.25);

        const stepSec = opts.musicStyle === 'launch_momentum' ? 0.35 : 0.65;
        const notes =
          opts.musicStyle === 'ambient_synth'
            ? [220, 261.6, 329.6, 293.6]
            : opts.musicStyle === 'launch_momentum'
            ? [130.8, 164.8, 196.0, 261.6]
            : [196.0, 246.9, 293.6, 246.9];
        const steps = Math.floor(totalDurationMs / 1000 / stepSec);
        for (let i = 0; i < steps; i++) {
          const osc = audioCtx.createOscillator();
          const env = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(notes[i % notes.length], now + i * stepSec);
          env.gain.setValueAtTime(0.001, now + i * stepSec);
          env.gain.exponentialRampToValueAtTime(0.32, now + i * stepSec + 0.04);
          env.gain.exponentialRampToValueAtTime(0.001, now + i * stepSec + stepSec * 0.9);
          osc.connect(env);
          env.connect(master);
          osc.start(now + i * stepSec);
          osc.stop(now + i * stepSec + stepSec);
        }
      }

      dest.stream.getAudioTracks().forEach((t) => combinedTracks.push(t));
    }
  } catch {
    // proceed video-only if audio context blocked
  }

  const finalStream = new MediaStream(combinedTracks);
  const mimeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mimeType = mimeCandidates.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const recorder = new MediaRecorder(finalStream, { mimeType, videoBitsPerSecond: 3200000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      if (audioCtx) audioCtx.close().catch(() => {});
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] || 'video/webm' }));
    };
  });

  recorder.start(100);
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    const drawFrame = () => {
      const elapsed = performance.now() - startTime;
      const clamped = Math.min(elapsed, totalDurationMs);
      if (opts.onProgress) opts.onProgress(Math.min(99, Math.round((clamped / totalDurationMs) * 100)));

      // Determine active scene
      let acc = 0;
      let sceneIdx = 0;
      let sceneElapsed = 0;
      for (let i = 0; i < timedScenes.length; i++) {
        if (clamped < acc + timedScenes[i].renderMs || i === timedScenes.length - 1) {
          sceneIdx = i;
          sceneElapsed = Math.max(0, clamped - acc);
          break;
        }
        acc += timedScenes[i].renderMs;
      }

      const sc = timedScenes[sceneIdx];
      const sceneProgress = Math.min(1, sceneElapsed / Math.max(1, sc.renderMs));
      const bgImg = sceneImages[sceneIdx];

      // Background canvas
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (directive === 'quieter') {
        bgGrad.addColorStop(0, '#101114');
        bgGrad.addColorStop(1, '#08090B');
      } else {
        bgGrad.addColorStop(0, '#0B121C');
        bgGrad.addColorStop(1, '#06070A');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric accent glow (suppressed in quieter/distill)
      if (directive !== 'quieter' && directive !== 'distill') {
        const rad = ctx.createRadialGradient(width * 0.85, height * 0.15, 20, width * 0.85, height * 0.15, width * 0.65);
        rad.addColorStop(0, `${primary}55`);
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, width, height);
      }

      // Per-scene uploaded/generated visual with gentle Ken Burns motion
      if (bgImg) {
        const z = 1.02 + sceneProgress * 0.06;
        const imgAspect = bgImg.width / Math.max(1, bgImg.height);
        const targetAspect = width / height;
        let dw = width * z;
        let dh = height * z;
        if (imgAspect > targetAspect) {
          dh = height * z;
          dw = dh * imgAspect;
        } else {
          dw = width * z;
          dh = dw / imgAspect;
        }
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.drawImage(bgImg, (width - dw) / 2, (height - dh) / 2, dw, dh);
        ctx.restore();
      }

      // Impeccable Bolder accent bar or Quieter inset frame
      if (directive === 'bolder') {
        ctx.fillStyle = primary;
        ctx.fillRect(0, 0, 18, height);
      } else if (directive === 'quieter') {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 28, width - 56, height - 56);
      }

      // Top Progress Bar
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(48, 44, width - 96, 5);
      ctx.fillStyle = primary;
      ctx.fillRect(48, 44, (width - 96) * (clamped / Math.max(1, totalDurationMs)), 5);

      // Brand Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = directive === 'typeset' ? '600 22px Georgia, serif' : '800 22px "Segoe UI", Arial, sans-serif';
      ctx.fillText(opts.brandName, 48, 92);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '600 16px monospace';
      ctx.fillText(`0${sceneIdx + 1} / 0${timedScenes.length}`, width - 120, 92);

      // Kinetic Caption Display (Safe Zone Center)
      const capFont =
        directive === 'typeset'
          ? `bold ${isWide ? 60 : 54}px Georgia, serif`
          : `900 ${directive === 'bolder' ? (isWide ? 68 : 60) : isWide ? 56 : 50}px "Segoe UI", Arial, sans-serif`;
      ctx.font = capFont;
      const capLines = wrapText(ctx, sc.kineticCaption, width - 120);
      const lineH = isWide ? 74 : 66;
      const centerY = isWide ? height * 0.44 : height * 0.43;
      const startY = centerY - ((capLines.length - 1) * lineH) / 2;

      ctx.textAlign = 'left';
      capLines.forEach((ln, li) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(ln, 56, startY + li * lineH);
      });

      // Accent rule under headline
      ctx.fillStyle = primary;
      ctx.fillRect(56, startY + capLines.length * lineH - 22, 88, 6);

      // Word-by-Word Highlighted Spoken Subtitle Box (Safe Zone above bottom)
      const words = sc.spokenScript.split(/\s+/).filter(Boolean);
      const activeWordIdx = Math.min(words.length - 1, Math.floor(sceneProgress * words.length));
      const subY = isWide ? height - 150 : height - 290;
      drawRoundedRect(ctx, 48, subY, width - 96, 108, 16);
      ctx.fillStyle = 'rgba(8, 10, 14, 0.82)';
      ctx.fill();
      ctx.strokeStyle = `${secondary}55`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
      const subLines = wrapText(ctx, sc.spokenScript, width - 140).slice(0, 3);
      let runningWord = 0;
      subLines.forEach((line, li) => {
        const lineWords = line.split(/\s+/);
        let cursorX = 70;
        lineWords.forEach((w) => {
          const isCurrent = runningWord === activeWordIdx;
          ctx.fillStyle = isCurrent ? '#FFFFFF' : 'rgba(226,232,240,0.68)';
          if (isCurrent) {
            const mw = ctx.measureText(w).width;
            ctx.fillStyle = primary;
            drawRoundedRect(ctx, cursorX - 4, subY + 20 + li * 30, mw + 8, 26, 6);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
          }
          ctx.fillText(w, cursorX, subY + 40 + li * 30);
          cursorX += ctx.measureText(`${w} `).width;
          runningWord += 1;
        });
      });

      // Clean Footer Domain
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '600 18px monospace';
      ctx.fillText(opts.domain || opts.brandName, 56, height - 38);

      if (elapsed < totalDurationMs) {
        requestAnimationFrame(drawFrame);
      } else {
        if (opts.onProgress) opts.onProgress(100);
        resolve();
      }
    };
    requestAnimationFrame(drawFrame);
  });

  recorder.stop();
  return recordingPromise;
}
