/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Core Type Definitions
 */

export type SocialPlatform = 'x' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'threads';

export type PostStatus = 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'failed';

export type UserRole = 'admin' | 'creator' | 'approver' | 'analyst';

export type BrandArchetype =
  | 'The Innovator'
  | 'The Strategist'
  | 'The Visionary'
  | 'The Challenger'
  | 'The Catalyst'
  | 'The Sage';

export interface BrandProfile {
  id: string;
  name: string;
  archetype: BrandArchetype;
  tagline: string;
  targetIndustry: string;
  voiceAttributes: string[];
  valuePillars: string[];
  bannedWords: string[];
  toneDials: {
    technicalVsAccessible: number;
    energeticVsReserved: number;
    boldVsUnderstated: number;
  };
  brandColors?: {
    primary: string;
    secondary: string;
    background: string;
    swatches: string[];
  };
  brandFonts?: string[];
  logoUrl?: string;
  websiteUrl?: string;
}

export interface CustomerAvatar {
  id: string;
  name: string;
  roleTitle: string;
  avatarImageUrl: string;
  demographics: {
    ageRange: string;
    seniority: string;
    companySize: string;
    budgetAuthority: string;
    geographicRegion?: string;
    targetMarketSegment?: string;
  };
  painPoints: string[];
  emotionalTriggers: string[];
  contentAffinities: string[];
  preferredPlatforms: SocialPlatform[];
  peakEngagementHours: string[];
  receptivityKeywords: string[];
  isCustom?: boolean;
  isAiGenerated?: boolean;
  derivedFromOffer?: string;
  matchScore?: number;
  matchRationale?: string;
  suggestedHookAngle?: string;
  bestChannelsRationale?: string;
  bestTimeWindowsRationale?: string;
}

export interface ReceptivityMatch {
  avatarId: string;
  score: number;
  receptivityLevel: 'High' | 'Moderate' | 'Low';
  whyReceptive: string;
  suggestedHookAngle: string;
}

export type MarketingFormatType = 'social_post' | 'sponsored_ad' | 'short_video' | 'carousel';

export interface PostVariant {
  id: string;
  campaignId: string;
  variantLabel: 'Variant A' | 'Variant B';
  formatType?: MarketingFormatType;
  hookAngle: string;
  content: string;
  headline?: string;
  ctaText?: string;
  destinationUrl?: string;
  pixelEvent?: 'Lead' | 'ViewContent' | 'AddToCart' | 'Purchase' | 'Contact';
  carouselSlides?: { slideNumber: number; title: string; body: string; visualCue?: string }[];
  videoBeats?: TikTokStoryboardBeat[];
  hashtags: string[];
  platform: SocialPlatform;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'text';
  scheduledTime?: string;
  status: PostStatus;
  metrics: {
    impressions: number;
    clicks: number;
    likes: number;
    shares: number;
    comments: number;
    ctr: number;
    conversionRate: number;
  };
}

export interface SplitTestExperiment {
  id: string;
  campaignId: string;
  title: string;
  platform: SocialPlatform;
  hypothesis: string;
  variantA: PostVariant;
  variantB: PostVariant;
  status: 'running' | 'completed';
  startDate: string;
  durationDays: number;
  confidenceScore: number;
  winningVariantKey?: 'Variant A' | 'Variant B';
  liftPercentage?: number;
}

export interface Campaign {
  id: string;
  title: string;
  brandProfileId: string;
  targetAvatarIds: string[];
  goal: string;
  theme: string;
  sourceType: 'url' | 'social_repurpose' | 'brief';
  sourceInput: string;
  keyTakeaways: string[];
  status: 'active' | 'draft' | 'completed' | 'paused';
  receptivityScores: Record<string, ReceptivityMatch>;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'published' | 'split_winner' | 'alert' | 'system';
  timestamp: string;
  read: boolean;
  priority: 'high' | 'normal' | 'low';
}

export interface HeatmapCell {
  day: number;
  hour: number;
  intensity: number;
}

export interface CompetitorPost {
  id: string;
  content: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  hookType: string;
  weaknessToExploit: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  handle: string;
  platform: SocialPlatform;
  avatarUrl: string;
  archetype: string;
  followerCount: number;
  avgEngagementRate: number;
  weeklyCadence: number;
  shareOfVoice: number;
  topHookAngle: string;
  recentPosts: CompetitorPost[];
  comparisonDeltas: {
    erDelta: number;
    cadenceDelta: number;
    growthDelta: number;
  };
}

export interface GeneratedVisualAsset {
  id: string;
  prompt: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: string;
  targetAvatarName?: string;
}

export type SentimentType = 'praise_ugc' | 'feature_inquiry' | 'product_friction' | 'urgent_escalation';

export type CaseStatus = 'open' | 'auto_remediated' | 'escalated_human' | 'converted_to_ugc';

export interface InboundSocialMention {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  platform: 'x' | 'linkedin' | 'reddit' | 'instagram' | 'reviews';
  sourceUrl?: string;
  content: string;
  timestamp: string;
  sentiment: SentimentType;
  sentimentScore: number;
  autoDraftReply: string;
  status: CaseStatus;
  urgencyLevel: 'low' | 'medium' | 'high';
  isUgcEligible: boolean;
  followerCount?: number;
  influenceScore?: number;
  isHighInfluence?: boolean;
}

export interface SmartResponseTemplate {
  id: string;
  category: 'Billing & Invoicing' | 'Technical & API' | 'Feature Roadmap' | 'Onboarding & Help' | 'Praise & UGC';
  title: string;
  templateText: string;
  sentimentTrigger: SentimentType;
  usageCount: number;
  brandVoiceTone: string;
  averageResolutionSpeed: string;
  isAiRefined: boolean;
}

export interface SentimentSpikeAlert {
  id: string;
  triggeredAt: string;
  spikeType: 'negative_surge' | 'high_influence_critical' | 'brand_friction';
  sentimentDropPercentage: number;
  affectedMentionsCount: number;
  highInfluenceAuthor?: string;
  highInfluenceFollowers?: string;
  status: 'active' | 'investigating' | 'resolved';
  recommendedAction: string;
}

export interface TrendingSound {
  id: string;
  title: string;
  artist: string;
  usageCount: string;
  momentumScore: number;
  bpm: number;
  duration: string;
  recommendedVibe: string;
}

export interface TikTokStoryboardBeat {
  beatNumber: 1 | 2 | 3;
  beatTitle: string;
  timing: string;
  visualDirection: string;
  spokenAudio: string;
  onScreenText: string;
}

export interface TikTokVideoTemplate {
  id: string;
  title: string;
  category: 'Founder POV' | 'UGC Testimonial' | 'Problem vs Solution' | 'Product Showcase';
  previewImageUrl: string;
  beats: TikTokStoryboardBeat[];
  suggestedHashtags: string[];
}

export interface TikTokAdCampaignMetrics {
  campaignName: string;
  objective: 'Community Growth' | 'Lead Generation' | 'E-Commerce Sales';
  budgetSpend: number;
  attributedRevenue: number;
  roas: number;
  cpa: number;
  impressions: number;
  videoViews6s: number;
  clicks: number;
  addToCart: number;
  purchases: number;
}

// ==========================================
// NEW: TRENDING HASHTAGS & SOUNDS MONITOR TYPE
// ==========================================

export interface TrendingSocialActivity {
  id: string;
  tagOrSound: string;
  type: 'hashtag' | 'sound';
  platform: SocialPlatform;
  volume: string;
  velocityChange: string;
  sentiment: 'Spike' | 'Breakout' | 'Viral';
  suggestedTheme: string;
  hookRationale: string;
  targetAvatarName: string;
  projectedLift: string;
}

// ==========================================
// NEW: CALENDAR SENTIMENT HEATMAP & SPIKE MONITOR
// ==========================================

export type CalendarSentimentStatus =
  | 'peak_satisfaction'
  | 'net_positive'
  | 'neutral'
  | 'friction_peak'
  | 'complaint_spike';

export interface CalendarSentimentDay {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  csatScore: number;
  sentimentStatus: CalendarSentimentStatus;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  peakTimeWindow: string;
  triggerEvent: string;
  driverSummary: string;
  topCustomerQuote: string;
  recommendedPlaybook?: string;
}

export interface SmartReplySuggestion {
  matchedTemplate: SmartResponseTemplate;
  intentCategory: string;
  intentLabel: string;
  confidenceScore: number;
  sentimentAnalysis: {
    detectedSentiment: SentimentType;
    intensity: 'Mild' | 'Moderate' | 'Critical';
    urgency: 'Standard' | 'Elevated' | 'Priority 1';
  };
  triggerKeywords: string[];
  rationale: string;
  personalizedPreview: string;
}

// ==========================================
// NEW: MODEL-AGNOSTIC LLM ENGINE & AGENT PERFORMANCE
// ==========================================

export type LLMProviderType =
  | 'google_gemini'
  | 'openai'
  | 'anthropic'
  | 'meta_llama'
  | 'deepseek'
  | 'mistral'
  | 'custom_openai_compatible';

export interface LLMEngineConfig {
  id: string;
  provider: LLMProviderType;
  displayName: string;
  modelIdentifier: string;
  apiEndpoint?: string;
  temperature: number;
  contextWindow: string;
  isProductionActive: boolean;
  isOpenSource: boolean;
  latencyMs: number;
  costPer1kCases: string;
  accuracyBenchmark: number; // e.g. 97.4%
  resolutionSpeedBenchmark: string; // e.g. "1m 45s"
  humanInterventionRateBenchmark: number; // e.g. 5.8%
  description: string;
}

export interface AIAgentPerformanceMetrics {
  avgResolutionTimeSeconds: number;
  formattedAvgResolutionTime: string;
  autonomousResolutionRate: number; // e.g. 92.6%
  responseAccuracyScore: number; // e.g. 96.8%
  humanInterventionRate: number; // e.g. 7.4%
  totalCasesHandled: number;
  autoResolvedCases: number;
  humanEscalatedCases: number;
  firstContactResolutionRate: number;
  customerSatisfactionAfterAI: number;
  estimatedCostSavings: string;
  hallucinationRate: number; // e.g. 0.3%
  intentRecognitionAccuracy: number; // e.g. 98.4%
}

export interface AgentQueueCategoryMetric {
  category: string;
  caseVolume: number;
  avgResolutionTime: string;
  accuracy: number;
  humanInterventionRate: number;
  primaryInterventionReason: string;
  status: 'optimal' | 'attention_needed';
}

export interface HumanInterventionFactor {
  reason: string;
  percentage: number;
  caseCount: number;
  description: string;
  recommendedAction: string;
}

export interface AIVideoBeat {
  timing: string;
  title: string;
  spokenScript: string;
  visualDirection: string;
  kineticOverlay: string;
  brollPrompt?: string;
}

export interface CampaignVideoAsset {
  id: string;
  title: string;
  hookAngle?: string;
  source: 'ai_generated' | 'recorded' | 'uploaded';
  aspectRatio: '9:16' | '16:9' | '1:1';
  videoUrl?: string;
  voiceTone?: string;
  backgroundTrack?: string;
  beats: AIVideoBeat[];
  audioWaveform?: number[];
  videoMotionFrames?: { bgGradient: string; accentColor: string }[];
  attachedAt: string;
}
