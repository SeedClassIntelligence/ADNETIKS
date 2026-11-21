/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Visual Sentiment Calendar Heatmap & Peak Window Analyzer
 * Overlays brand sentiment spikes onto a calendar view, identifying specific time windows
 * where customer satisfaction or complaints peaked, with root driver diagnostics.
 */

import { useState } from 'react';
import { CalendarSentimentDay, CalendarSentimentStatus } from '../types';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ThumbsUp,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  MessageSquare,
  Activity,
  Repeat2,
} from 'lucide-react';

interface SentimentCalendarHeatmapProps {
  sentimentData: CalendarSentimentDay[];
  onSelectDayForDeepDive?: (day: CalendarSentimentDay) => void;
  onSendToRemixStudio?: (content: string) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function SentimentCalendarHeatmap({
  sentimentData,
  onSelectDayForDeepDive,
  onSendToRemixStudio,
  showNotificationToast,
}: SentimentCalendarHeatmapProps) {
  // Filter mode for calendar
  const [filterMode, setFilterMode] = useState<'all' | 'satisfaction_peaks' | 'complaint_spikes' | 'friction'>('all');

  // Currently selected day for deep-dive inspection (default to Oct 28 complaint spike or Oct 14 satisfaction peak)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-28');

  // Days of week header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Oct 1, 2026 was a Thursday (index 4: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4)
  const startingEmptyCells = 4;

  const activeDay = sentimentData.find((d) => d.date === selectedDate) || sentimentData[0];

  // Summary computations
  const totalVolume = sentimentData.reduce((acc, d) => acc + d.totalMentions, 0);
  const avgCsat = Math.round(
    sentimentData.reduce((acc, d) => acc + d.csatScore, 0) / (sentimentData.length || 1)
  );
  const peakSatisfactionDays = sentimentData.filter((d) => d.sentimentStatus === 'peak_satisfaction');
  const complaintSpikeDays = sentimentData.filter((d) => d.sentimentStatus === 'complaint_spike');
  const frictionDays = sentimentData.filter((d) => d.sentimentStatus === 'friction_peak');

  // Filter logic
  const isDayHighlighted = (day: CalendarSentimentDay) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'satisfaction_peaks') return day.sentimentStatus === 'peak_satisfaction';
    if (filterMode === 'complaint_spikes') return day.sentimentStatus === 'complaint_spike';
    if (filterMode === 'friction') return day.sentimentStatus === 'friction_peak';
    return true;
  };

  const getCellStyling = (day: CalendarSentimentDay, isSelected: boolean) => {
    const isDimmed = !isDayHighlighted(day);

    let base = 'transition-all cursor-pointer p-2 rounded-xl flex flex-col justify-between min-h-[76px] sm:min-h-[88px] relative group ';

    if (isDimmed) {
      base += 'opacity-25 grayscale hover:opacity-75 ';
    }

    if (isSelected) {
      base += 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-[1.02] z-10 shadow-lg ';
    }

    switch (day.sentimentStatus) {
      case 'peak_satisfaction':
        return (
          base +
          'bg-emerald-950/70 border border-emerald-500/70 hover:border-emerald-400 hover:bg-emerald-950/90 shadow-md shadow-emerald-950/30'
        );
      case 'net_positive':
        return (
          base +
          'bg-emerald-950/25 border border-emerald-800/40 hover:border-emerald-700 hover:bg-emerald-950/40'
        );
      case 'neutral':
        return (
          base +
          'bg-slate-950 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
        );
      case 'friction_peak':
        return (
          base +
          'bg-amber-950/50 border border-amber-500/60 hover:border-amber-400 hover:bg-amber-950/80 shadow-md shadow-amber-950/30'
        );
      case 'complaint_spike':
        return (
          base +
          'bg-red-950/80 border-2 border-red-500 hover:border-red-400 hover:bg-red-950 shadow-lg shadow-red-900/40'
        );
      default:
        return base + 'bg-slate-950 border border-slate-800';
    }
  };

  const getStatusBadge = (status: CalendarSentimentStatus) => {
    switch (status) {
      case 'peak_satisfaction':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-900/80 border border-emerald-400 text-emerald-200 text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-300" /> Peak Satisfaction
          </span>
        );
      case 'net_positive':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-semibold">
            Net Positive
          </span>
        );
      case 'neutral':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
            Baseline / Neutral
          </span>
        );
      case 'friction_peak':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-500/70 text-amber-300 text-[10px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Friction Warning
          </span>
        );
      case 'complaint_spike':
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-900 border border-red-400 text-red-200 text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-red-300" /> Critical Complaint Spike
          </span>
        );
    }
  };

  const handleDayClick = (day: CalendarSentimentDay) => {
    setSelectedDate(day.date);
    if (onSelectDayForDeepDive) {
      onSelectDayForDeepDive(day);
    }
    showNotificationToast(
      `Sentiment Window Inspected: ${day.date}`,
      `Peak Window: ${day.peakTimeWindow} · CSAT: ${day.csatScore}% (${day.sentimentStatus.replace(/_/g, ' ')})`
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Brand Sentiment Calendar Heatmap & Peak Spikes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Overlays daily satisfaction surges and customer complaint spikes onto a 31-day calendar view with hourly peak window tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Mode Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            All Days ({sentimentData.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('satisfaction_peaks')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterMode === 'satisfaction_peaks'
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500'
                : 'text-emerald-400 hover:bg-emerald-950/50 bg-slate-950/60 border border-emerald-900/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Satisfaction Peaks ({peakSatisfactionDays.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('complaint_spikes')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterMode === 'complaint_spikes'
                ? 'bg-red-900/80 text-red-200 border border-red-500'
                : 'text-red-400 hover:bg-red-950/50 bg-slate-950/60 border border-red-900/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Complaint Spikes ({complaintSpikeDays.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('friction')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterMode === 'friction'
                ? 'bg-amber-900/80 text-amber-200 border border-amber-500'
                : 'text-amber-400 hover:bg-amber-950/50 bg-slate-950/60 border border-amber-900/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Friction ({frictionDays.length})</span>
          </button>
        </div>
      </div>

      {/* Month Metrics Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">October 2026 Avg CSAT</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{avgCsat}%</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14% vs Sept
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">31-day weighted satisfaction</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Highest Satisfaction Peak</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-emerald-300">Oct 14 (98%)</span>
          </div>
          <span className="text-[10px] text-emerald-400 block font-mono">14:00 - 17:30 UTC · Avatar 2.0</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Most Severe Complaint Spike</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-red-400">Oct 28 (41%)</span>
          </div>
          <span className="text-[10px] text-red-400 block font-mono">08:30 - 11:15 UTC · Webhook Lag</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Monitored Discussions</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-white">{totalVolume.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Cross-channel social listen nodes</span>
        </div>
      </div>

      {/* CALENDAR HEATMAP MATRIX */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">October 2026</span>
            <span className="text-[11px] font-mono text-slate-500">(31 Days Active Tracking)</span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-950/80 border border-emerald-500/80" />
              <span>Satisfaction Peak (&ge;92%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
              <span>Baseline (75-91%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-950/60 border border-amber-500/70" />
              <span>Friction (50-74%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-950 border-2 border-red-500 animate-pulse" />
              <span>Complaint Spike (&lt;50%)</span>
            </div>
          </div>
        </div>

        {/* 7-COLUMN CALENDAR GRID */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Day of Week Headers */}
          {weekDays.map((wd) => (
            <div key={wd} className="text-center text-[11px] font-mono font-bold text-slate-500 py-1">
              {wd}
            </div>
          ))}

          {/* Starting Empty Cells for October 2026 (starts on Thursday, 4 blanks) */}
          {Array.from({ length: startingEmptyCells }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="bg-slate-950/30 border border-slate-850/40 rounded-xl min-h-[76px] sm:min-h-[88px] opacity-20"
            />
          ))}

          {/* 31 Calendar Days */}
          {sentimentData.map((day) => {
            const isSelected = day.date === selectedDate;
            return (
              <div
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={getCellStyling(day, isSelected)}
              >
                {/* Day Top: Day Number & Spike Pin */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-bold font-mono ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}>
                    {day.dayNumber}
                  </span>

                  {day.sentimentStatus === 'peak_satisfaction' && (
                    <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-300" title="Peak Satisfaction Surge">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                  {day.sentimentStatus === 'complaint_spike' && (
                    <span className="p-0.5 rounded bg-red-600 text-white animate-bounce" title="Critical Complaint Spike">
                      <ShieldAlert className="w-3 h-3" />
                    </span>
                  )}
                  {day.sentimentStatus === 'friction_peak' && (
                    <span className="p-0.5 rounded bg-amber-500/20 text-amber-300" title="Friction Warning">
                      <AlertTriangle className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Day Center: CSAT Score */}
                <div className="my-1">
                  <div className={`text-xs sm:text-sm font-mono font-bold ${
                    day.sentimentStatus === 'complaint_spike'
                      ? 'text-red-300'
                      : day.sentimentStatus === 'friction_peak'
                      ? 'text-amber-300'
                      : day.sentimentStatus === 'peak_satisfaction'
                      ? 'text-emerald-300'
                      : 'text-slate-400'
                  }`}>
                    {day.csatScore}%
                  </div>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    {day.totalMentions} cases
                  </span>
                </div>

                {/* Day Bottom: Mini indicator bar */}
                <div className="w-full bg-slate-900/60 rounded-full h-1 overflow-hidden flex">
                  <div
                    style={{ width: `${(day.positiveMentions / day.totalMentions) * 100}%` }}
                    className="bg-emerald-500 h-full"
                  />
                  <div
                    style={{ width: `${(day.neutralMentions / day.totalMentions) * 100}%` }}
                    className="bg-slate-600 h-full"
                  />
                  <div
                    style={{ width: `${(day.negativeMentions / day.totalMentions) * 100}%` }}
                    className="bg-red-500 h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY DEEP DIVE: IDENTIFIED PEAK WINDOW & ROOT CAUSE DIAGNOSTICS */}
      {activeDay && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                activeDay.sentimentStatus === 'complaint_spike'
                  ? 'bg-red-950 border-red-500/70 text-red-400'
                  : activeDay.sentimentStatus === 'peak_satisfaction'
                  ? 'bg-emerald-950 border-emerald-500/70 text-emerald-400'
                  : activeDay.sentimentStatus === 'friction_peak'
                  ? 'bg-amber-950 border-amber-500/70 text-amber-400'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {new Date(activeDay.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {getStatusBadge(activeDay.sentimentStatus)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>Trigger: <strong className="text-slate-200">{activeDay.triggerEvent}</strong></span>
                </div>
              </div>
            </div>

            {/* Peak Window Badge */}
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Identified Peak Window:</span>
              <span className={`text-xs font-mono font-bold ${
                activeDay.sentimentStatus === 'complaint_spike' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {activeDay.peakTimeWindow}
              </span>
            </div>
          </div>

          {/* Metric Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">CSAT Rating</span>
              <span className={`text-base font-mono font-bold ${
                activeDay.csatScore >= 90 ? 'text-emerald-400' : activeDay.csatScore < 50 ? 'text-red-400' : 'text-slate-200'
              }`}>
                {activeDay.csatScore}%
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Praise Mentions</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {activeDay.positiveMentions} ({Math.round((activeDay.positiveMentions / activeDay.totalMentions) * 100)}%)
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Complaint Mentions</span>
              <span className={`text-base font-mono font-bold ${
                activeDay.negativeMentions > 10 ? 'text-red-400 font-bold' : 'text-slate-400'
              }`}>
                {activeDay.negativeMentions} ({Math.round((activeDay.negativeMentions / activeDay.totalMentions) * 100)}%)
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Neutral / Inquiries</span>
              <span className="text-base font-mono font-bold text-slate-300">
                {activeDay.neutralMentions} cases
              </span>
            </div>
          </div>

          {/* Root Driver Summary & Customer Voice Snippet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Root Cause & Spike Driver Analysis:
              </span>
              <p className="text-slate-200 leading-relaxed font-sans">
                {activeDay.driverSummary}
              </p>
              {activeDay.recommendedPlaybook && (
                <div className="pt-2 text-[11px] text-emerald-400 font-mono">
                  Playbook: {activeDay.recommendedPlaybook}
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-red-400" />
                Customer Voice Snippet During Peak Window:
              </span>
              <p className="text-slate-300 italic leading-relaxed font-sans border-l-2 border-red-500/50 pl-2">
                &quot;{activeDay.topCustomerQuote}&quot;
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Captured during window: {activeDay.peakTimeWindow}
                </span>

                {onSendToRemixStudio && (activeDay.sentimentStatus === 'peak_satisfaction' || activeDay.csatScore >= 85) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendToRemixStudio(`Customer Praise Quote (${activeDay.date}): "${activeDay.topCustomerQuote}"`);
                      showNotificationToast(
                        'Praise Quote Exported',
                        'Customer testimonial transferred to Content Studio for campaign creation.'
                      );
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold transition-all active:scale-95"
                  >
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span>Convert to Social Campaign</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
