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
