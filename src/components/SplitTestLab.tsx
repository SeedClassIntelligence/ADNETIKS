/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS A/B Split Testing Laboratory & Experimentation Center
 */

import { useState } from 'react';
import { SplitTestExperiment, PostVariant, UserRole } from '../types';
import {
  Split,
  Trophy,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Flame,
} from 'lucide-react';

interface SplitTestLabProps {
  splitTests: SplitTestExperiment[];
  onDeclareWinner: (experimentId: string, winnerKey: 'Variant A' | 'Variant B') => void;
  userRole: UserRole;
  showNotificationToast: (title: string, message: string) => void;
}

export default function SplitTestLab({
  splitTests,
  onDeclareWinner,
  userRole,
  showNotificationToast,
}: SplitTestLabProps) {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>(
    splitTests[0]?.id || ''
  );

  const activeExperiment =
    splitTests.find((t) => t.id === selectedExperimentId) || splitTests[0];

  const handlePromoteWinner = (winnerKey: 'Variant A' | 'Variant B') => {
    if (!activeExperiment) return;
    onDeclareWinner(activeExperiment.id, winnerKey);
    showNotificationToast(
      'Winning Variant Promoted',
      `${winnerKey} has been declared winner and locked into active campaign delivery.`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Split className="w-6 h-6 text-blue-500" />
            A/B Split-Testing Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Validate creative hooks, messaging angles, and audience resonance with statistical rigor.
          </p>
        </div>

        {/* Experiment Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          {splitTests.map((test) => {
            const isSelected = test.id === selectedExperimentId;
            return (
              <button
                key={test.id}
                onClick={() => setSelectedExperimentId(test.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="uppercase text-[10px] font-mono text-red-400">[{test.platform}]</span>
                <span className="truncate max-w-[140px]">{test.title.split(':')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeExperiment && (
        <div className="space-y-6">
          
          {/* Executive Overview Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
                    {activeExperiment.platform.toUpperCase()} EXPERIMENT
                  </span>
                  <span className="text-xs text-slate-400">
                    Status: <strong className="text-slate-200 capitalize">{activeExperiment.status}</strong>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">Started: {activeExperiment.startDate}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1.5">{activeExperiment.title}</h2>
              </div>

              {/* Statistical Confidence & Lift Badge */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Statistical Confidence</span>
                  <span className="font-mono text-emerald-400 text-base font-bold">
                    {activeExperiment.confidenceScore}%
                  </span>
                </div>

                {activeExperiment.liftPercentage && (
                  <div className="bg-emerald-950/50 border border-emerald-800/60 p-2.5 rounded-xl text-right">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">CTR Lift</span>
                    <span className="font-mono text-emerald-400 text-base font-bold flex items-center justify-end gap-0.5">
                      <TrendingUp className="w-4 h-4" />
                      +{activeExperiment.liftPercentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hypothesis */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 font-semibold mr-1">Core Hypothesis:</strong>
                <span className="text-slate-400">{activeExperiment.hypothesis}</span>
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE VARIANT COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* VARIANT A */}
            <VariantCard
              variant={activeExperiment.variantA}
              isWinner={activeExperiment.winningVariantKey === 'Variant A'}
              onPromote={() => handlePromoteWinner('Variant A')}
              canPromote={userRole === 'admin' || userRole === 'approver'}
              accentColor="red"
            />

            {/* VARIANT B */}
            <VariantCard
              variant={activeExperiment.variantB}
              isWinner={activeExperiment.winningVariantKey === 'Variant B'}
              onPromote={() => handlePromoteWinner('Variant B')}
              canPromote={userRole === 'admin' || userRole === 'approver'}
              accentColor="blue"
            />

          </div>

          {/* Comparative Metrics Analysis Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-500" />
              Granular Metric Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3 text-red-400 font-bold">Variant A ({activeExperiment.variantA.hookAngle})</th>
                    <th className="py-2.5 px-3 text-blue-400 font-bold">Variant B ({activeExperiment.variantB.hookAngle})</th>
                    <th className="py-2.5 px-3 text-right">Variance Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-semibold">Impressions</td>
                    <td className="py-2.5 px-3 text-slate-200 tabular-nums">
                      {activeExperiment.variantA.metrics.impressions.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 tabular-nums">
                      {activeExperiment.variantB.metrics.impressions.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      +{(activeExperiment.variantA.metrics.impressions - activeExperiment.variantB.metrics.impressions).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-semibold">Total Clicks</td>
                    <td className="py-2.5 px-3 text-slate-200 tabular-nums">
                      {activeExperiment.variantA.metrics.clicks.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 tabular-nums">
                      {activeExperiment.variantB.metrics.clicks.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      +{(activeExperiment.variantA.metrics.clicks - activeExperiment.variantB.metrics.clicks).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-semibold">Click-Through Rate (CTR)</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold tabular-nums">
                      {activeExperiment.variantA.metrics.ctr}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                      {activeExperiment.variantB.metrics.ctr}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      +{(activeExperiment.variantA.metrics.ctr - activeExperiment.variantB.metrics.ctr).toFixed(2)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-semibold">Conversion Rate</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold tabular-nums">
                      {activeExperiment.variantA.metrics.conversionRate}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                      {activeExperiment.variantB.metrics.conversionRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      +{(activeExperiment.variantA.metrics.conversionRate - activeExperiment.variantB.metrics.conversionRate).toFixed(2)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-semibold">Social Shares / Reposts</td>
                    <td className="py-2.5 px-3 text-slate-200 tabular-nums">
                      {activeExperiment.variantA.metrics.shares.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 tabular-nums">
                      {activeExperiment.variantB.metrics.shares.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      +{(activeExperiment.variantA.metrics.shares - activeExperiment.variantB.metrics.shares).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

interface VariantCardProps {
  variant: PostVariant;
  isWinner: boolean;
  onPromote: () => void;
  canPromote: boolean;
  accentColor: 'red' | 'blue';
}

function VariantCard({ variant, isWinner, onPromote, canPromote, accentColor }: VariantCardProps) {
  return (
    <div
      className={`bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
        isWinner
          ? 'border-emerald-500/80 bg-emerald-950/10 ring-1 ring-emerald-500/40 shadow-xl'
          : 'border-slate-800'
      }`}
    >
      {/* Winner Ribbon */}
      {isWinner && (
        <div className="absolute -top-3 right-5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Statistically Significant Winner
        </div>
      )}

      <div className="space-y-4">
        
        {/* Variant Title & Hook */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                accentColor === 'red' ? 'text-red-400' : 'text-blue-400'
              }`}
            >
              {variant.variantLabel}
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">{variant.hookAngle}</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Status: {variant.status}</span>
        </div>

        {/* Content Snippet */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
          {variant.content}
        </div>

        {/* Key KPI Numbers Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Impressions</span>
            <span className="font-mono text-slate-100 font-bold text-sm tabular-nums">
              {variant.metrics.impressions.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">CTR</span>
            <span className={`font-mono font-bold text-sm tabular-nums ${isWinner ? 'text-emerald-400' : 'text-slate-100'}`}>
              {variant.metrics.ctr}%
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Conv. Rate</span>
            <span className={`font-mono font-bold text-sm tabular-nums ${isWinner ? 'text-emerald-400' : 'text-slate-100'}`}>
              {variant.metrics.conversionRate}%
            </span>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 font-mono">
          Clicks: <strong className="text-slate-200">{variant.metrics.clicks}</strong> · Shares: <strong className="text-slate-200">{variant.metrics.shares}</strong>
        </div>

        {!isWinner && canPromote && (
          <button
            type="button"
            onClick={onPromote}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Promote as Winner</span>
          </button>
        )}
      </div>

    </div>
  );
}
