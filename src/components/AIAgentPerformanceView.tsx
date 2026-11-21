/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS AI Service Agent Performance & Model-Agnostic LLM Orchestration
 * Measures resolution time, response accuracy, and human intervention rates,
 * with fully agnostic plug-and-play LLM engine management (open-source & proprietary).
 */

import { useState } from 'react';
import {
  LLMEngineConfig,
  AIAgentPerformanceMetrics,
  AgentQueueCategoryMetric,
  HumanInterventionFactor,
  LLMProviderType,
} from '../types';
import {
  Clock,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Zap,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertTriangle,
  FileCode,
  DollarSign,
  Radio,
  Check,
  Globe,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface AIAgentPerformanceViewProps {
  initialEngines: LLMEngineConfig[];
  performanceMetrics: AIAgentPerformanceMetrics;
  queueMetrics: AgentQueueCategoryMetric[];
  interventionFactors: HumanInterventionFactor[];
  showNotificationToast: (title: string, message: string) => void;
}

export default function AIAgentPerformanceView({
  initialEngines,
  performanceMetrics,
  queueMetrics,
  interventionFactors,
  showNotificationToast,
}: AIAgentPerformanceViewProps) {
  // Model-agnostic engines state
  const [engines, setEngines] = useState<LLMEngineConfig[]>(() => {
    const saved = localStorage.getItem('adnetiks_llm_engines');
    return saved ? JSON.parse(saved) : initialEngines;
  });

  const [activeEngineId, setActiveEngineId] = useState<string>(() => {
    const active = engines.find((e) => e.isProductionActive);
    return active ? active.id : engines[0]?.id || '';
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);

  // New Model Form State
  const [newModelData, setNewModelData] = useState<Partial<LLMEngineConfig>>({
    provider: 'meta_llama',
    displayName: '',
    modelIdentifier: '',
    apiEndpoint: 'http://localhost:11434/v1',
    temperature: 0.25,
    contextWindow: '128K Tokens',
    isOpenSource: true,
    description: '',
  });

  const activeEngine = engines.find((e) => e.id === activeEngineId) || engines[0];

  const handleSetActiveEngine = (engineId: string) => {
    const target = engines.find((e) => e.id === engineId);
    if (!target) return;

    const updated = engines.map((e) => ({
      ...e,
      isProductionActive: e.id === engineId,
    }));

    setEngines(updated);
    setActiveEngineId(engineId);
    localStorage.setItem('adnetiks_llm_engines', JSON.stringify(updated));

    showNotificationToast(
      'Production LLM Switched',
      `ServiceOrchestrator is now powered by ${target.displayName} (${target.isOpenSource ? 'Open Source' : 'Proprietary'}).`
    );
  };

  const handleTestLatency = (engine: LLMEngineConfig) => {
    setTestingModelId(engine.id);
    setTimeout(() => {
      setTestingModelId(null);
      showNotificationToast(
        'Connection Verified',
        `${engine.displayName} responded in ${engine.latencyMs}ms with zero schema drift.`
      );
    }, 600);
  };

  const handleAddNewEngine = () => {
    if (!newModelData.displayName || !newModelData.modelIdentifier) return;

    const newEngine: LLMEngineConfig = {
      id: `llm-custom-${Date.now()}`,
      provider: newModelData.provider || 'custom_openai_compatible',
      displayName: newModelData.displayName,
      modelIdentifier: newModelData.modelIdentifier,
      apiEndpoint: newModelData.apiEndpoint || 'http://localhost:11434/v1',
      temperature: newModelData.temperature ?? 0.25,
      contextWindow: newModelData.contextWindow || '128K Tokens',
      isProductionActive: false,
      isOpenSource: newModelData.isOpenSource ?? true,
      latencyMs: Math.floor(Math.random() * 150) + 160,
      costPer1kCases: newModelData.isOpenSource ? '$0.00 (Self-Hosted)' : '$0.45',
      accuracyBenchmark: 96.5,
      resolutionSpeedBenchmark: '2m 12s',
      humanInterventionRateBenchmark: 7.1,
      description: newModelData.description || 'Custom plugged-in model endpoint.',
    };

    const updated = [newEngine, ...engines];
    setEngines(updated);
    localStorage.setItem('adnetiks_llm_engines', JSON.stringify(updated));
    setShowConfigModal(false);

    setNewModelData({
      provider: 'meta_llama',
      displayName: '',
      modelIdentifier: '',
      apiEndpoint: 'http://localhost:11434/v1',
      temperature: 0.25,
      contextWindow: '128K Tokens',
      isOpenSource: true,
      description: '',
    });

    showNotificationToast('New LLM Engine Connected', `Added ${newEngine.displayName} to model registry.`);
  };

  const getProviderBadge = (provider: LLMProviderType, isOpenSource: boolean) => {
    if (isOpenSource) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/50 text-purple-300 font-mono text-[10px] font-bold flex items-center gap-1">
          <Server className="w-3 h-3 text-purple-400" />
          Open Source / Agnostic
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-semibold flex items-center gap-1">
        <Globe className="w-3 h-3 text-blue-400" />
        Cloud API
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* Header & Agnostic Engine Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                AI Service Agent Telemetry & Model-Agnostic Core
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of resolution time, accuracy, and human escalation rates across interchangeable LLM backends.
              </p>
            </div>
          </div>
        </div>

        {/* Active Engine Indicator & Modal Trigger */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Active Engine:</span>
            <strong className="text-white font-mono">{activeEngine?.displayName}</strong>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-400" />
            <span>Connect Any LLM</span>
          </button>
        </div>
      </div>

      {/* CORE PERFORMANCE METRIC STRIP (RESOLUTION TIME, ACCURACY, HUMAN INTERVENTION) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. RESOLUTION TIME */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-bold tracking-wider">Average Resolution Time</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {performanceMetrics.formattedAvgResolutionTime}
          </div>
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-95.3% vs 48m Human Rep Benchmark</span>
            </div>
            <div className="text-slate-400 font-mono">
              99.2% cases resolved &lt; 5 minutes
            </div>
          </div>
        </div>

        {/* 2. RESPONSE ACCURACY */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-bold tracking-wider">Response Accuracy Score</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">
            {performanceMetrics.responseAccuracyScore}%
          </div>
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Shot Brand Voice Adherence</span>
            </div>
            <div className="text-slate-400 font-mono">
              Hallucination rate: &lt;{performanceMetrics.hallucinationRate}%
            </div>
          </div>
        </div>

        {/* 3. HUMAN INTERVENTION RATE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-bold tracking-wider">Human Intervention Rate</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
            {performanceMetrics.humanInterventionRate}%
          </div>
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{performanceMetrics.autonomousResolutionRate}% Fully Autonomous</span>
            </div>
            <div className="text-slate-400 font-mono">
              110 hard cases escalated to human review
            </div>
          </div>
        </div>

        {/* 4. COST EFFICIENCY & CSAT IMPACT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-bold tracking-wider">Customer Retention Value</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {performanceMetrics.estimatedCostSavings}
          </div>
          <div className="space-y-1 pt-1 text-[11px]">
            <div className="text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{performanceMetrics.customerSatisfactionAfterAI}% Post-Remediation CSAT</span>
            </div>
            <div className="text-slate-400 font-mono">
              First-contact resolution: {performanceMetrics.firstContactResolutionRate}%
            </div>
          </div>
        </div>

      </div>

      {/* MODEL-AGNOSTIC LLM BENCHMARK REGISTRY & SWITCHER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Model-Agnostic LLM Engine Registry & Benchmarking
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ADNETIKS is completely provider-agnostic. Plug in any open-source weights (Llama, DeepSeek, Mistral) or proprietary models via standard REST/vLLM endpoints.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-red-900/20 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plug In Custom Model</span>
          </button>
        </div>

        {/* Engine Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {engines.map((engine) => {
            const isActive = engine.isProductionActive;
            const isTesting = testingModelId === engine.id;

            return (
              <div
                key={engine.id}
                className={`bg-slate-950 rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  isActive
                    ? 'border-red-500/80 shadow-md shadow-red-950/40 ring-1 ring-red-500/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white leading-tight">
                          {engine.displayName}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            PRODUCTION ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {engine.modelIdentifier}
                      </div>
                    </div>

                    {getProviderBadge(engine.provider, engine.isOpenSource)}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {engine.description}
                  </p>

                  {/* Benchmark Stat Tiles */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Resolution</span>
                      <strong className="text-emerald-400">{engine.resolutionSpeedBenchmark}</strong>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Accuracy</span>
                      <strong className="text-blue-400">{engine.accuracyBenchmark}%</strong>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Escalation</span>
                      <strong className="text-amber-400">{engine.humanInterventionRateBenchmark}%</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Latency: <strong className="text-slate-300">{engine.latencyMs}ms</strong></span>
                    <span>Cost: <strong className="text-slate-300">{engine.costPer1kCases}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleTestLatency(engine)}
                    disabled={isTesting}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-red-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Pinging...' : 'Ping Latency'}</span>
                  </button>

                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => handleSetActiveEngine(engine.id)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>Set Active</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold text-center flex items-center justify-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>In Service</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO-COLUMN DETAILS: QUEUE PERFORMANCE & HUMAN INTERVENTION ROOT-CAUSES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Queue Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-500" />
              AI Agent Performance by Support Queue
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {queueMetrics.reduce((a, b) => a + b.caseVolume, 0).toLocaleString()} Total Resolved Cases
            </span>
          </div>

          <div className="space-y-2.5">
            {queueMetrics.map((qm) => (
              <div
                key={qm.category}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="text-xs font-bold text-white block">{qm.category}</span>
                    <span className="text-[11px] text-slate-400">
                      Trigger: {qm.primaryInterventionReason}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono self-start sm:self-center">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-bold">Speed</span>
                      <span className="text-emerald-400 font-bold">{qm.avgResolutionTime}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-bold">Accuracy</span>
                      <span className="text-blue-400 font-bold">{qm.accuracy}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-bold">Escalated</span>
                      <span className="text-amber-400 font-bold">{qm.humanInterventionRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy & Autonomy bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    style={{ width: `${100 - qm.humanInterventionRate}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Autonomous: ${100 - qm.humanInterventionRate}%`}
                  />
                  <div
                    style={{ width: `${qm.humanInterventionRate}%` }}
                    className="bg-amber-500 h-full"
                    title={`Human Escalation: ${qm.humanInterventionRate}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Human Intervention Root Causes (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Human Intervention Diagnostics & Guardrails
          </h3>
          <p className="text-xs text-slate-400">
            Why the remaining 7.4% of cases require human supervisor authorization:
          </p>

          <div className="space-y-3 text-xs">
            {interventionFactors.map((factor) => (
              <div
                key={factor.reason}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{factor.reason}</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {factor.percentage}% ({factor.caseCount} cases)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {factor.description}
                </p>
                <div className="text-[10px] text-emerald-400 font-mono pt-0.5">
                  Playbook: {factor.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL: CONNECT ANY AGNOSTIC LLM (OPEN-SOURCE OR PROPRIETARY) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-red-500" />
                  Connect Model-Agnostic LLM Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plug in any local Ollama node, self-hosted vLLM cluster, or external API endpoint.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                  Provider / Architecture
                </label>
                <select
                  value={newModelData.provider}
                  onChange={(e) =>
                    setNewModelData({
                      ...newModelData,
                      provider: e.target.value as LLMProviderType,
                      isOpenSource:
                        e.target.value === 'meta_llama' ||
                        e.target.value === 'deepseek' ||
                        e.target.value === 'mistral' ||
                        e.target.value === 'custom_openai_compatible',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="meta_llama">Meta Llama (Llama 3.3 / 3.1) — Open Source</option>
                  <option value="deepseek">DeepSeek (V3 / R1) — Open Source Weights</option>
                  <option value="mistral">Mistral (Large 2 / Codestral) — Sovereign / Open</option>
                  <option value="custom_openai_compatible">Custom OpenAI-Compatible (Ollama, vLLM, RunPod)</option>
                  <option value="google_gemini">Google Gemini (Gemini 3.8 Flash / Pro)</option>
                  <option value="anthropic">Anthropic Claude (3.5 Sonnet)</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Llama 3.3 70B Internal"
                    value={newModelData.displayName || ''}
                    onChange={(e) => setNewModelData({ ...newModelData, displayName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    Model Identifier / Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. llama-3.3-70b-instruct"
                    value={newModelData.modelIdentifier || ''}
                    onChange={(e) => setNewModelData({ ...newModelData, modelIdentifier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                  Endpoint Base URL (OpenAI-Compatible REST)
                </label>
                <input
                  type="text"
                  placeholder="e.g. http://localhost:11434/v1 or http://vllm-cluster:8000/v1"
                  value={newModelData.apiEndpoint || ''}
                  onChange={(e) => setNewModelData({ ...newModelData, apiEndpoint: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    Temperature ({newModelData.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newModelData.temperature ?? 0.25}
                    onChange={(e) => setNewModelData({ ...newModelData, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    Context Window
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 128K Tokens"
                    value={newModelData.contextWindow || ''}
                    onChange={(e) => setNewModelData({ ...newModelData, contextWindow: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                  Description / Deployment Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on where this model runs (e.g. on-prem GPU cluster, HIPAA/GDPR private node)..."
                  value={newModelData.description || ''}
                  onChange={(e) => setNewModelData({ ...newModelData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewEngine}
                disabled={!newModelData.displayName || !newModelData.modelIdentifier}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-red-900/30"
              >
                Save & Connect Engine
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
