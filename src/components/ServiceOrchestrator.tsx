/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Autonomous Service Orchestration & Social Listening
 * Discovers consumer sentiment, auto-resolves cases in brand voice,
 * triggers real-time negative sentiment spike alerts with high-influence prioritization,
 * and maintains a Smart Response library for one-click resolution.
 */

import { useState, useEffect } from 'react';
import {
  InboundSocialMention,
  SentimentType,
  CaseStatus,
  UserRole,
  SmartResponseTemplate,
  SentimentSpikeAlert,
  SmartReplySuggestion,
} from '../types';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  Send,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Repeat2,
  ThumbsUp,
  Clock,
  HelpCircle,
  BellRing,
  Crown,
  Zap,
  BookOpen,
  Edit3,
  Plus,
  Trash2,
  Save,
  Check,
  AlertOctagon,
  ChevronRight,
  SlidersHorizontal,
  BrainCircuit,
  CornerDownRight,
  CheckCheck,
} from 'lucide-react';
import AdnetiksLogo from './AdnetiksLogo';
import { initialSmartResponses, initialSentimentSpikeAlert } from '../data/mockData';

interface ServiceOrchestratorProps {
  mentions: InboundSocialMention[];
  setMentions: (mentions: InboundSocialMention[]) => void;
  onConvertUgcToPost: (mention: InboundSocialMention) => void;
  userRole: UserRole;
  showNotificationToast: (title: string, message: string) => void;
}

function computeSmartReplySuggestion(
  mention: InboundSocialMention,
  smartResponses: SmartResponseTemplate[],
  templateOverrideId?: string
): SmartReplySuggestion {
  const contentLower = mention.content.toLowerCase();

  // Intent keyword banks
  const billingKeywords = ['charged', 'charge', 'card', 'billing', 'invoice', 'refund', 'reversal', 'seat', 'subscription', 'pricing', 'corporate card'];
  const techKeywords = ['api', 'webhook', 'token', 'latency', 'delay', 'lag', 'hang', 'failed', 'error', 'render', 'pdf', 'slide', 'queue', 'dispatch', 'meta', 'graph', 'timeout'];
  const roadmapKeywords = ['sync', 'timezone', 'timezones', 'schedule', 'scheduler', 'multi-region', 'feature', 'can the', 'does it', 'roadmap', 'future', 'automated'];
  const onboardingKeywords = ['how to', 'calibrate', 'avatar', 'persona', 'guide', 'setup', 'resonance', 'dials', 'learning', 'score'];
  const praiseKeywords = ['switched', 'ctr', 'unreal', 'love', 'growth', 'game changer', 'blown away', 'incredible', 'amazing', 'huge', 'superpower'];

  const matchedBilling = billingKeywords.filter((k) => contentLower.includes(k));
  const matchedTech = techKeywords.filter((k) => contentLower.includes(k));
  const matchedRoadmap = roadmapKeywords.filter((k) => contentLower.includes(k));
  const matchedOnboarding = onboardingKeywords.filter((k) => contentLower.includes(k));
  const matchedPraise = praiseKeywords.filter((k) => contentLower.includes(k));

  let category: SmartResponseTemplate['category'] = 'Technical & API';
  let intentLabel = 'Technical Pipeline Incident';
  let intentCategory = 'Engineering Sentry';
  let triggerKeywords = matchedTech.length > 0 ? matchedTech : ['latency', 'dispatch'];
  let confidenceScore = 94;

  if (matchedBilling.length > 0 || (mention.sentiment === 'urgent_escalation' && contentLower.includes('card'))) {
    category = 'Billing & Invoicing';
    intentLabel = 'Billing Dispute & Reversal Request';
    intentCategory = 'Finance & Accounts';
    triggerKeywords = matchedBilling.length > 0 ? matchedBilling : ['charged twice', 'billing'];
    confidenceScore = 98;
  } else if (mention.sentiment === 'praise_ugc' || matchedPraise.length >= 2) {
    category = 'Praise & UGC';
    intentLabel = 'Customer Advocacy & UGC Permission';
    intentCategory = 'Community & Brand Growth';
    triggerKeywords = matchedPraise.length > 0 ? matchedPraise : ['ctr', 'organic', 'growth'];
    confidenceScore = 97;
  } else if (matchedRoadmap.length > 0 || (mention.sentiment === 'feature_inquiry' && contentLower.includes('time'))) {
    category = 'Feature Roadmap';
    intentLabel = 'Multi-Timezone Scheduler Capability';
    intentCategory = 'Product Capability';
    triggerKeywords = matchedRoadmap.length > 0 ? matchedRoadmap : ['timezone', 'schedule'];
    confidenceScore = 93;
  } else if (matchedOnboarding.length > 0 || contentLower.includes('avatar')) {
    category = 'Onboarding & Help';
    intentLabel = 'Customer Avatar Calibration Guide';
    intentCategory = 'Customer Success';
    triggerKeywords = matchedOnboarding.length > 0 ? matchedOnboarding : ['avatar', 'calibration'];
    confidenceScore = 92;
  } else if (matchedTech.length > 0) {
    category = 'Technical & API';
    intentLabel = 'API Webhook & Dispatch Latency';
    intentCategory = 'Engineering Sentry';
    triggerKeywords = matchedTech;
    confidenceScore = 95;
  }

  // Find template by override or matched category/trigger
  let matchedTemplate: SmartResponseTemplate | undefined;
  if (templateOverrideId) {
    matchedTemplate = smartResponses.find((t) => t.id === templateOverrideId);
  }
  if (!matchedTemplate) {
    matchedTemplate =
      smartResponses.find((t) => t.category === category) ||
      smartResponses.find((t) => t.sentimentTrigger === mention.sentiment) ||
      smartResponses[0];
  }

  const intensity: 'Mild' | 'Moderate' | 'Critical' =
    mention.sentiment === 'urgent_escalation' || (mention.isHighInfluence && mention.sentimentScore < 40)
      ? 'Critical'
      : mention.sentiment === 'product_friction'
      ? 'Moderate'
      : 'Mild';

  const urgency: 'Standard' | 'Elevated' | 'Priority 1' =
    mention.isHighInfluence && mention.sentiment === 'urgent_escalation'
      ? 'Priority 1'
      : mention.sentiment === 'urgent_escalation' || mention.isHighInfluence
      ? 'Elevated'
      : 'Standard';

  const personalizedPreview = matchedTemplate.templateText
    .replace(/{authorName}/g, mention.authorName)
    .replace(/{platform}/g, mention.platform.toUpperCase())
    .replace(/{authorHandle}/g, mention.authorHandle);

  const rationale = `Intent classified as "${intentLabel}" based on ${mention.sentiment.replace(/_/g, ' ')} sentiment (${mention.sentimentScore}% score) and detected tokens [${triggerKeywords.map((k) => `"${k}"`).join(', ')}]. Dynamically matched against "${matchedTemplate.title}" from the Smart Response library.`;

  return {
    matchedTemplate,
    intentCategory,
    intentLabel,
    confidenceScore,
    sentimentAnalysis: {
      detectedSentiment: mention.sentiment,
      intensity,
      urgency,
    },
    triggerKeywords,
    rationale,
    personalizedPreview,
  };
}

export default function ServiceOrchestrator({
  mentions,
  setMentions,
  onConvertUgcToPost,
  userRole,
  showNotificationToast,
}: ServiceOrchestratorProps) {
  // Navigation & Filtering
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [selectedMentionId, setSelectedMentionId] = useState<string>(mentions[0]?.id || '');
  const [activeReplyText, setActiveReplyText] = useState<string>(
    mentions[0]?.autoDraftReply || ''
  );
  const [templateOverrideId, setTemplateOverrideId] = useState<string | undefined>(undefined);

  // AUTOMATED ALERT SYSTEM STATE
  const [spikeAlert, setSpikeAlert] = useState<SentimentSpikeAlert | null>(() => {
    const saved = localStorage.getItem('adnetiks_spike_alert');
    return saved ? JSON.parse(saved) : initialSentimentSpikeAlert;
  });
  const [alertThresholdPercent, setAlertThresholdPercent] = useState<number>(20);
  const [activeEngineName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('adnetiks_llm_engines');
      if (saved) {
        const parsed = JSON.parse(saved);
        const active = parsed.find((e: any) => e.isProductionActive);
        if (active) return active.displayName;
      }
    } catch (e) {}
    return 'Google Gemini 3.8 Flash';
  });

  // SMART RESPONSE LIBRARY STATE
  const [smartResponses, setSmartResponses] = useState<SmartResponseTemplate[]>(() => {
    const saved = localStorage.getItem('adnetiks_smart_responses');
    return saved ? JSON.parse(saved) : initialSmartResponses;
  });
  const [selectedResponseCategory, setSelectedResponseCategory] = useState<string>('all');
  const [showSmartResponseDrawer, setShowSmartResponseDrawer] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmartResponseTemplate | null>(null);
  const [isAddingNewTemplate, setIsAddingNewTemplate] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState<Partial<SmartResponseTemplate>>({
    category: 'Billing & Invoicing',
    title: '',
    templateText: '',
    sentimentTrigger: 'urgent_escalation',
    brandVoiceTone: 'Empathetic & Decisive',
    averageResolutionSpeed: '< 5 mins',
  });

  // Sync to LocalStorage
  useEffect(() => {
    if (spikeAlert) {
      localStorage.setItem('adnetiks_spike_alert', JSON.stringify(spikeAlert));
    } else {
      localStorage.removeItem('adnetiks_spike_alert');
    }
  }, [spikeAlert]);

  useEffect(() => {
    localStorage.setItem('adnetiks_smart_responses', JSON.stringify(smartResponses));
  }, [smartResponses]);

  const activeMention = mentions.find((m) => m.id === selectedMentionId) || mentions[0];

  // Dynamic Smart Reply Suggestion computed for the active mention
  const smartSuggestion = activeMention
    ? computeSmartReplySuggestion(activeMention, smartResponses, templateOverrideId)
    : null;

  // Sentiment Analytics & Spike Calculations
  const totalMentions = mentions.length;
  const negativeMentions = mentions.filter(
    (m) => m.sentiment === 'urgent_escalation' || m.sentiment === 'product_friction'
  );
  const negativePercent = totalMentions > 0 ? Math.round((negativeMentions.length / totalMentions) * 100) : 0;
  const highInfluenceEscalations = mentions.filter(
    (m) => (m.sentiment === 'urgent_escalation' || m.sentiment === 'product_friction') && m.isHighInfluence
  );

  // Filter mentions
  const filteredMentions = mentions.filter((m) => {
    if (filterSentiment === 'all') return true;
    if (filterSentiment === 'high_influence') return m.isHighInfluence;
    return m.sentiment === filterSentiment;
  });

  const handleSelectMention = (mention: InboundSocialMention) => {
    setSelectedMentionId(mention.id);
    setTemplateOverrideId(undefined);
    setActiveReplyText(mention.autoDraftReply);
  };

  // Autonomous Remediation: Send reply
  const handleSendReply = () => {
    if (!activeMention) return;
    const updated = mentions.map((m) =>
      m.id === activeMention.id
        ? { ...m, status: 'auto_remediated' as CaseStatus, autoDraftReply: activeReplyText }
        : m
    );
    setMentions(updated);
    showNotificationToast(
      'Autonomous Reply Dispatched',
      `Brand agent resolved case for ${activeMention.authorName} in verified voice.`
    );
  };

  // Human Escalation Sign-Off
  const handleResolveEscalation = () => {
    if (!activeMention) return;
    const updated = mentions.map((m) =>
      m.id === activeMention.id ? { ...m, status: 'auto_remediated' as CaseStatus } : m
    );
    setMentions(updated);
    showNotificationToast(
      'Escalation Cleared',
      `Supervisor intervention complete for ${activeMention.authorName}.`
    );
  };

  // 1-Click UGC Conversion
  const handleUgcAction = () => {
    if (!activeMention) return;
    const updated = mentions.map((m) =>
      m.id === activeMention.id ? { ...m, status: 'converted_to_ugc' as CaseStatus } : m
    );
    setMentions(updated);
    onConvertUgcToPost(activeMention);
    showNotificationToast(
      'UGC Converted to Social Post',
      `Transferred ${activeMention.authorName}'s praise to the Creative Studio campaign queue.`
    );
  };

  // Simulate Negative Sentiment Spike Trigger
  const handleSimulateNegativeSpike = () => {
    const highInfluencer: InboundSocialMention = {
      id: `mention-spike-${Date.now()}`,
      authorName: 'Victoria Sterling',
      authorHandle: '@v_sterling_vc',
      authorAvatar: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
      platform: 'x',
      content: 'Critical dispatch error: @ADNETIKS queue failed to post our Q4 product announcement to 240K followers. Waiting on urgent human engineering triage.',
      timestamp: 'Just now',
      sentiment: 'urgent_escalation',
      sentimentScore: 12,
      autoDraftReply: 'Victoria, our VP of Engineering has flagged your workspace as Top Priority 1. Dedicated nodes are resolving the dispatch pipeline right now.',
      status: 'escalated_human',
      urgencyLevel: 'high',
      isUgcEligible: false,
      followerCount: 240000,
      influenceScore: 98,
      isHighInfluence: true,
    };

    const newAlert: SentimentSpikeAlert = {
      id: `alert-${Date.now()}`,
      triggeredAt: 'Just now',
      spikeType: 'high_influence_critical',
      sentimentDropPercentage: 22.4,
      affectedMentionsCount: negativeMentions.length + 1,
      highInfluenceAuthor: 'Victoria Sterling (@v_sterling_vc)',
      highInfluenceFollowers: '240K Followers (VC / Key Opinion Leader)',
      status: 'active',
      recommendedAction: 'Immediate Supervisor Review Required: High-influence account with 240K reach experiencing dispatch blockage.',
    };

    setMentions([highInfluencer, ...mentions]);
    setSpikeAlert(newAlert);
    setSelectedMentionId(highInfluencer.id);
    setActiveReplyText(highInfluencer.autoDraftReply);
    setFilterSentiment('high_influence');

    showNotificationToast(
      '🚨 CRITICAL SENTIMENT SPIKE ALERT',
      'Negative sentiment surge detected! High-influence creator (@v_sterling_vc, 240K reach) prioritized for human review.'
    );
  };

  // Dismiss / Clear Active Spike Alert
  const handleDismissSpikeAlert = () => {
    setSpikeAlert(null);
    showNotificationToast(
      'Spike Alert Marked Investigated',
      'All high-influence negative mentions have been reviewed by a human supervisor.'
    );
  };

  // SMART RESPONSE ACTIONS
  const handleApplySmartResponse = (template: SmartResponseTemplate, autoDispatch: boolean = false) => {
    if (!activeMention) return;

    // Personalize template variables
    const personalizedText = template.templateText
      .replace(/{authorName}/g, activeMention.authorName)
      .replace(/{platform}/g, activeMention.platform.toUpperCase())
      .replace(/{authorHandle}/g, activeMention.authorHandle);

    setActiveReplyText(personalizedText);

    // Increment usage
    setSmartResponses((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t))
    );

    if (autoDispatch) {
      // 1-Click Resolve Case
      const updated = mentions.map((m) =>
        m.id === activeMention.id
          ? {
              ...m,
              status: 'auto_remediated' as CaseStatus,
              autoDraftReply: personalizedText,
            }
          : m
      );
      setMentions(updated);
      showNotificationToast(
        '1-Click Case Resolved',
        `Applied "${template.title}" and dispatched verified reply to ${activeMention.authorName}.`
      );
    } else {
      showNotificationToast(
        'Smart Response Applied',
        `Inserted personalized copy for ${activeMention.authorName}. Ready for agent review.`
      );
    }
  };

  const handleSaveEditedTemplate = () => {
    if (!editingTemplate) return;
    setSmartResponses((prev) =>
      prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
    );
    setEditingTemplate(null);
    showNotificationToast('Template Refined', `Saved updates to "${editingTemplate.title}".`);
  };

  const handleCreateNewTemplate = () => {
    if (!newTemplateData.title || !newTemplateData.templateText) return;
    const newTemplate: SmartResponseTemplate = {
      id: `resp-custom-${Date.now()}`,
      category: newTemplateData.category || 'Technical & API',
      title: newTemplateData.title,
      templateText: newTemplateData.templateText,
      sentimentTrigger: newTemplateData.sentimentTrigger || 'urgent_escalation',
      usageCount: 0,
      brandVoiceTone: newTemplateData.brandVoiceTone || 'Empathetic & Decisive',
      averageResolutionSpeed: '< 5 mins',
      isAiRefined: true,
    };

    setSmartResponses([newTemplate, ...smartResponses]);
    setIsAddingNewTemplate(false);
    setNewTemplateData({
      category: 'Billing & Invoicing',
      title: '',
      templateText: '',
      sentimentTrigger: 'urgent_escalation',
      brandVoiceTone: 'Empathetic & Decisive',
      averageResolutionSpeed: '< 5 mins',
    });
    showNotificationToast('New Smart Response Created', `Added "${newTemplate.title}" to library.`);
  };

  const getSentimentBadge = (type: SentimentType, score: number) => {
    switch (type) {
      case 'praise_ugc':
        return (
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            Praise / UGC ({score}%)
          </span>
        );
      case 'feature_inquiry':
        return (
          <span className="text-[11px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Inquiry ({score}%)
          </span>
        );
      case 'product_friction':
        return (
          <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Friction ({score}%)
          </span>
        );
      case 'urgent_escalation':
        return (
          <span className="text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Hard Case ({score}%)
          </span>
        );
    }
  };

  const openCasesCount = mentions.filter((m) => m.status === 'open').length;
  const escalatedCount = mentions.filter((m) => m.status === 'escalated_human').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Autonomous Service Orchestration & Social Listening
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated sentiment spike alerts, high-influence escalation triage, and 1-click smart resolution library.
          </p>
        </div>

        {/* Real-Time Telemetry Counters & Spike Simulator */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-2 px-3 rounded-xl flex items-center gap-2" title="Model-agnostic LLM powering autonomous analysis">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-[9px] text-slate-400 block uppercase font-bold">Agnostic LLM Core</span>
              <span className="font-mono font-bold text-xs text-white">
                {activeEngineName}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2 px-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Negative Ratio</span>
            <span className={`font-mono font-bold text-sm ${negativePercent >= alertThresholdPercent ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
              {negativePercent}% ({negativeMentions.length} cases)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2 px-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">High-Influence Priority</span>
            <span className="font-mono text-amber-400 font-bold text-sm flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              {highInfluenceEscalations.length} Flagged
            </span>
          </div>

          <button
            type="button"
            onClick={handleSimulateNegativeSpike}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-red-900/20"
            title="Simulate sudden negative sentiment spike to test real-time alert"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Test Spike Alert</span>
          </button>
        </div>
      </div>

      {/* AUTOMATED ALERT SYSTEM: NEGATIVE SENTIMENT SPIKE BANNER */}
      {spikeAlert && (
        <div className="bg-red-950/50 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-600 text-white animate-bounce">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white uppercase tracking-wider">
                    Automated Alert: Negative Sentiment Spike Detected
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-900 border border-red-400 text-red-200 text-[10px] font-mono font-bold animate-pulse">
                    PRIORITY 1 ESCALATION
                  </span>
                </div>
                <p className="text-red-200/90 text-xs mt-0.5">
                  Negative sentiment spiked by <strong className="text-white">+{spikeAlert.sentimentDropPercentage}%</strong>. Influential accounts detected in discussion queue.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterSentiment('high_influence')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Triage High-Influence ({highInfluenceEscalations.length})</span>
              </button>
              <button
                type="button"
                onClick={handleDismissSpikeAlert}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Dismiss Alert
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
            <div className="bg-red-950/80 p-2.5 rounded-xl border border-red-500/30 space-y-0.5">
              <span className="text-red-400 uppercase font-mono font-bold block">Top Influencer Outcry:</span>
              <span className="text-white font-bold">{spikeAlert.highInfluenceAuthor}</span>
              <div className="text-red-300 font-mono">{spikeAlert.highInfluenceFollowers}</div>
            </div>
            <div className="bg-red-950/80 p-2.5 rounded-xl border border-red-500/30 space-y-0.5">
              <span className="text-red-400 uppercase font-mono font-bold block">Sentry Rule:</span>
              <span className="text-white">Trigger when Negative Ratio &gt; {alertThresholdPercent}% or VIP &lt; 35%</span>
              <div className="text-red-300">Audience Protection: Human review override enabled</div>
            </div>
            <div className="bg-red-950/80 p-2.5 rounded-xl border border-red-500/30 space-y-0.5">
              <span className="text-red-400 uppercase font-mono font-bold block">Recommended Action:</span>
              <span className="text-red-200">{spikeAlert.recommendedAction}</span>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Value Proposition Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Retention Multiplier:</strong> It costs more to get a customer than to keep one. Fuel brand agents resolve routine inquiries via Smart Responses while escalating high-influence friction to human supervisors.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>Smart Library: <strong className="text-slate-200">{smartResponses.length} Templates</strong></span>
          <span>·</span>
          <span>Auto-Gate: Active</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Inbound Mention Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Sentiment Filter Tabs */}
          <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto w-full">
              <button
                onClick={() => setFilterSentiment('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  filterSentiment === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({mentions.length})
              </button>
              <button
                onClick={() => setFilterSentiment('high_influence')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 whitespace-nowrap transition-colors ${
                  filterSentiment === 'high_influence'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Crown className="w-3 h-3" />
                VIP Influencers ({highInfluenceEscalations.length})
              </button>
              <button
                onClick={() => setFilterSentiment('praise_ugc')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  filterSentiment === 'praise_ugc' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                UGC Praise
              </button>
              <button
                onClick={() => setFilterSentiment('urgent_escalation')}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  filterSentiment === 'urgent_escalation' ? 'bg-slate-800 text-red-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hard Cases ({escalatedCount})
              </button>
            </div>
          </div>

          {/* Mentions List */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredMentions.map((mention) => {
              const isSelected = mention.id === selectedMentionId;
              return (
                <div
                  key={mention.id}
                  onClick={() => handleSelectMention(mention)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${
                    isSelected
                      ? 'bg-slate-950 border-red-500/80 ring-1 ring-red-500/40 text-white shadow-lg'
                      : 'bg-slate-900/90 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {/* VIP Influence Badge */}
                  {mention.isHighInfluence && (
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full w-fit">
                      <Crown className="w-3 h-3" />
                      <span>High Influence: {mention.followerCount?.toLocaleString()} followers (Score: {mention.influenceScore}/100)</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={mention.authorAvatar}
                        alt={mention.authorName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-800"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block leading-tight">
                          {mention.authorName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {mention.authorHandle} · <span className="uppercase">{mention.platform}</span>
                        </span>
                      </div>
                    </div>
                    {getSentimentBadge(mention.sentiment, mention.sentimentScore)}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    &quot;{mention.content}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {mention.timestamp}
                    </span>
                    <span className="capitalize text-slate-400 font-semibold">
                      Status: {mention.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Brand Agent Remediation & Smart Response Hub (7 cols) */}
        {activeMention && (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            
            {/* Mention Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeMention.authorAvatar}
                  alt={activeMention.authorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {activeMention.authorName}
                    </h3>
                    {activeMention.isHighInfluence && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                        <Crown className="w-3 h-3" /> VIP Influencer
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {activeMention.authorHandle} on <strong className="text-slate-300 uppercase">{activeMention.platform}</strong> · {activeMention.timestamp}
                    {activeMention.followerCount && ` · Reach: ${activeMention.followerCount.toLocaleString()} accounts`}
                  </div>
                </div>
              </div>

              {getSentimentBadge(activeMention.sentiment, activeMention.sentimentScore)}
            </div>

            {/* Inbound Customer Quote Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Inbound Discussion Snippet
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans italic">
                &quot;{activeMention.content}&quot;
              </p>
            </div>

            {/* UGC CANDIDATE CALLOUT (if Praise) */}
            {activeMention.isUgcEligible && (
              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    High-Converting User Generated Content (UGC) Detected
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    This authentic customer review can be immediately repurposed into an outbound quote campaign.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUgcAction}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Repeat2 className="w-3.5 h-3.5" />
                  <span>Convert to Campaign Post</span>
                </button>
              </div>
            )}

            {/* ESCALATION HARD CASE WARNING (if Urgent or High Influence) */}
            {(activeMention.sentiment === 'urgent_escalation' || activeMention.isHighInfluence) && (
              <div className="bg-red-950/40 border border-red-800/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Human Review Gate: High-Priority Intervention Required
                  </div>
                  <p className="text-[11px] text-red-200/80">
                    {activeMention.isHighInfluence
                      ? `Account has high social reach (${activeMention.followerCount?.toLocaleString()} followers). Verified response required.`
                      : 'Flagged for high emotional friction or billing dispute. Automated dispatch paused.'}
                  </p>
                </div>

                {(userRole === 'admin' || userRole === 'approver') && (
                  <button
                    type="button"
                    onClick={handleResolveEscalation}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    <span>Approve Supervisor Reply</span>
                  </button>
                )}
              </div>
            )}

            {/* SMART RESPONSE LIBRARY SECTION */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Smart Response Library & 1-Click Resolution
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {smartResponses.length} Available
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewTemplate(true)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Template</span>
                  </button>
                </div>
              </div>

              {/* Category Pill Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {['all', 'Billing & Invoicing', 'Technical & API', 'Feature Roadmap', 'Praise & UGC', 'Onboarding & Help'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedResponseCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedResponseCategory === cat
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Templates' : cat}
                  </button>
                ))}
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 max-h-[220px] overflow-y-auto pr-1">
                {smartResponses
                  .filter((t) => selectedResponseCategory === 'all' || t.category === selectedResponseCategory)
                  .map((template) => (
                    <div
                      key={template.id}
                      className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between space-y-2 group transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors leading-snug">
                            {template.title}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                            {template.averageResolutionSpeed}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {template.templateText.replace(/{authorName}/g, activeMention.authorName)}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                          <span>Tone: {template.brandVoiceTone.split('&')[0]}</span>
                          <span>Used {template.usageCount}x</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => handleApplySmartResponse(template, false)}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>Insert Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySmartResponse(template, true)}
                          className="flex-1 py-1 px-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
                          title="Instantly resolve and dispatch this reply to the user"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>1-Click Resolve</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* ENHANCEMENT: DYNAMIC SMART REPLY SUGGESTION (INTENT & SENTIMENT ANALYZED) */}
            {smartSuggestion && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/25 border-2 border-red-500/50 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/50 text-red-400">
                      <BrainCircuit className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          Smart Reply Suggestion
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                          {smartSuggestion.confidenceScore}% Intent Confidence
                        </span>
                        {smartSuggestion.sentimentAnalysis.urgency === 'Priority 1' ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-500/60 text-red-300 text-[10px] font-mono font-bold">
                            Priority 1
                          </span>
                        ) : smartSuggestion.sentimentAnalysis.urgency === 'Elevated' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300 text-[10px] font-mono font-bold">
                            Elevated
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Detected Intent: <strong className="text-white">{smartSuggestion.intentLabel}</strong> ({smartSuggestion.intentCategory})
                      </p>
                    </div>
                  </div>

                  {/* Template Switcher Dropdown */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline">From Library:</span>
                    <select
                      value={smartSuggestion.matchedTemplate.id}
                      onChange={(e) => setTemplateOverrideId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer font-sans"
                      title="Switch to another template from the Smart Response library"
                    >
                      {smartResponses.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.title} ({tpl.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* NLP Analysis & Trigger Badges */}
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-[11px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Trigger Tokens:</span>
                      {smartSuggestion.triggerKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-700/80 text-red-300 font-mono text-[10px] rounded-md"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Tone: <strong className="text-slate-200">{smartSuggestion.matchedTemplate.brandVoiceTone}</strong> · Target SLA: <strong className="text-emerald-400">{smartSuggestion.matchedTemplate.averageResolutionSpeed}</strong>
                    </div>
                  </div>

                  <p className="text-slate-200 text-xs leading-relaxed italic border-l-2 border-red-500/60 pl-2.5 bg-slate-900/40 py-1.5 rounded-r-lg">
                    &quot;{smartSuggestion.personalizedPreview}&quot;
                  </p>
                </div>

                {/* Quick Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 leading-snug">
                    <CornerDownRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{smartSuggestion.rationale}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyText(smartSuggestion.personalizedPreview);
                        showNotificationToast(
                          'Suggested Reply Loaded to Draft',
                          `Populated drafted response for ${activeMention.authorName}. Ready for manual review.`
                        );
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                      <span>Apply to Draft for Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplySmartResponse(smartSuggestion.matchedTemplate, true)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-red-900/30"
                      title="1-Click apply verified template and resolve case"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Accept & 1-Click Resolve</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AUTONOMOUS BRAND AGENT REPLY DRAFTER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  Brand-Trained Agent Response Draft
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Guarded by: Active Brand Pillars
                </span>
              </div>

              <textarea
                rows={4}
                value={activeReplyText}
                onChange={(e) => setActiveReplyText(e.target.value)}
                placeholder="Draft or insert smart response..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 leading-relaxed font-sans"
              />

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                <div className="text-[11px] text-slate-500">
                  Target Channel: <strong className="text-slate-300 uppercase">{activeMention.platform} API Gateway</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={userRole === 'analyst'}
                    onClick={handleSendReply}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-900/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Verified Reply</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: ADD NEW SMART RESPONSE TEMPLATE */}
      {isAddingNewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                Add New Smart Response Template
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNewTemplate(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block font-semibold mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  value={newTemplateData.title || ''}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, title: e.target.value })}
                  placeholder="e.g. Inactive Seat Credit Refund"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplateData.category}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="Technical & API">Technical & API</option>
                    <option value="Feature Roadmap">Feature Roadmap</option>
                    <option value="Praise & UGC">Praise & UGC</option>
                    <option value="Onboarding & Help">Onboarding & Help</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block font-semibold mb-1">
                    Brand Voice Tone
                  </label>
                  <input
                    type="text"
                    value={newTemplateData.brandVoiceTone || ''}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, brandVoiceTone: e.target.value })}
                    placeholder="e.g. Empathetic, Decisive & Fast"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block font-semibold mb-1">
                  Response Copy Template (Use &#123;authorName&#125; for automatic personalization)
                </label>
                <textarea
                  rows={4}
                  value={newTemplateData.templateText || ''}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, templateText: e.target.value })}
                  placeholder="Hello {authorName}, we investigated this right away..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingNewTemplate(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTemplate}
                disabled={!newTemplateData.title || !newTemplateData.templateText}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
