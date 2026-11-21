/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS 1-Click URL Onboarding Orchestrator
 * Takes a single website URL and automatically runs:
 *   1. Multi-Page CDP Website Brand Scan (screenshots, hex palette, fonts, full-site messaging)
 *   2. Intelligent Brand Profile & Voice Calibration
 *   3. Ideal Customer Avatar Discovery (grounded in all crawled pages)
 *   4. First Multi-Platform Campaign & Ready-to-Publish Post Drafts
 */

import { runFullWebsiteBrandScan } from './brandScanner.ts';
import { handleDiscoverAvatars, handleGenerateContent } from './api.ts';

export interface OneClickOnboardPayload {
  url: string;
  targetRegion?: string;
  platforms?: string[];
  campaignGoal?: string;
}

interface BrandPreset {
  industry: string;
  archetype: 'The Visionary' | 'The Catalyst' | 'The Challenger' | 'The Innovator' | 'The Strategist';
  voiceAttributes: string[];
  valuePillars: string[];
  bannedWords: string[];
}

function classifyBrandFromSite(dossierText: string, domain: string): BrandPreset {
  const text = `${domain} ${dossierText}`.toLowerCase();

  if (/music|track|album|spotify|concert|tour|vinyl|artist|record label|sound/i.test(text)) {
    return {
      industry: 'Music & Artist Brand',
      archetype: 'The Visionary',
      voiceAttributes: ['Authentic & Unfiltered', 'Cinematic', 'Community-First', 'Bold Energy'],
      valuePillars: ['Original Sound & Story', 'Direct Fan Connection', 'Live Drops & Releases'],
      bannedWords: ['Synergy', 'B2B Pipeline', 'Enterprise ROI', 'Leverage'],
    };
  }

  if (/insurance|policy|polici|carrier|quote|coverage|fintech|loan|mortgage|finance|compare/i.test(text)) {
    return {
      industry: 'Insurance, Fintech & Comparison',
      archetype: 'The Strategist',
      voiceAttributes: ['Transparent & Trustworthy', 'Data-Backed', 'Zero Jargon', 'Consumer-First'],
      valuePillars: ['Side-by-Side Clarity', 'Real Savings Without Fine Print', 'Fast Guided Decisions'],
      bannedWords: ['Secret Hack', 'Guaranteed Overnight', 'Too Good To Be True'],
    };
  }

  if (/shop|store|cart|checkout|apparel|merch|shipping|ecommerce|streetwear|product drop/i.test(text)) {
    return {
      industry: 'Product & E-Commerce Brand',
      archetype: 'The Challenger',
      voiceAttributes: ['Tactile & Visual', 'Confident', 'Scarcity-Driven', 'Culture-Aware'],
      valuePillars: ['Craftsmanship & Design', 'Social Proof & Unboxing', 'Limited Drop Velocity'],
      bannedWords: ['Cheap', 'Discount Bin', 'Legacy Solution'],
    };
  }

  if (/agency|studio|consulting|client|service|booked|audit|marketing partner/i.test(text)) {
    return {
      industry: 'Agency & Consulting',
      archetype: 'The Strategist',
      voiceAttributes: ['Trustworthy', 'Outcome-Focused', 'Clear & Practical', 'Consultative'],
      valuePillars: ['Proven Client Results', 'Fast Turnaround', 'Transparent Process'],
      bannedWords: ['Guru', 'Secret Hack', 'Guaranteed Overnight'],
    };
  }

  return {
    industry: 'Tech, SaaS & Digital Platform',
    archetype: 'The Innovator',
    voiceAttributes: ['Sharp & Direct', 'Evidence-Backed', 'Zero Fluff', 'Forward-Looking'],
    valuePillars: ['Measurable Speed & Outcomes', 'Modern Architecture', 'User-First Clarity'],
    bannedWords: ['Revolutionary Paradigm', 'Game-Changing Synergy', 'Seamless Disruption'],
  };
}

export async function runOneClickOnboarding(payload: OneClickOnboardPayload) {
  const startedAt = Date.now();
  const rawUrl = (payload.url || '').trim();
  if (!rawUrl) {
    return { ok: false, error: 'Please paste a public website URL (for example https://yourcompany.com).' };
  }

  const targetRegion = (payload.targetRegion || 'US, UK & Global Tier-1 Markets').trim();
  const platforms =
    Array.isArray(payload.platforms) && payload.platforms.length > 0
      ? payload.platforms
      : ['linkedin', 'x', 'instagram', 'tiktok'];

  // STEP 1: Multi-Page Chrome CDP Website Scan
  const scan = await runFullWebsiteBrandScan(rawUrl);
  if (!scan.ok) {
    return { ok: false, error: scan.error || 'Website scan failed.' };
  }

  // STEP 2: Auto-Classify Brand Identity & Voice
  const preset = classifyBrandFromSite(scan.summaryText || `${scan.brandName} ${scan.description}`, scan.domain || '');
  const brandProfile = {
    id: `brand-${Date.now()}`,
    name: scan.brandName || scan.domain || 'My Brand',
    archetype: preset.archetype,
    tagline: scan.tagline || `${scan.brandName} Official Experience`,
    targetIndustry: preset.industry,
    voiceAttributes: preset.voiceAttributes,
    valuePillars:
      scan.headings && scan.headings.length >= 2
        ? [
            scan.headings[0].slice(0, 64),
            scan.headings[1].slice(0, 64),
            preset.valuePillars[0],
          ]
        : preset.valuePillars,
    bannedWords: preset.bannedWords,
    brandColors: scan.palette,
    brandFonts: scan.fonts,
    logoUrl: scan.faviconUrl,
    websiteUrl: scan.url,
    toneDials: {
      analyticalVsEmotional: 62,
      formalVsCasual: 55,
      safeVsBold: 74,
      conciseVsDetailed: 45,
    },
  };

  // STEP 3: Discover Ideal Customer Avatars grounded in full-site multi-page dossier
  const dossierInput = scan.summaryText || `${brandProfile.name}: ${brandProfile.tagline}`;
  const avatarResp = await handleDiscoverAvatars({
    sourceInput: `${brandProfile.name} (${preset.industry}, Region: ${targetRegion})\n${dossierInput}`,
    sourceType: 'brief',
    campaignGoal:
      payload.campaignGoal ||
      `Turn ${brandProfile.name}'s full-site value proposition into high-converting organic & paid social campaigns`,
    brandProfile: {
      name: brandProfile.name,
      archetype: brandProfile.archetype,
      voiceAttributes: brandProfile.voiceAttributes,
    },
  });

  const discoveredAvatars = (avatarResp?.prospects || []).map((av: any, idx: number) => ({
    ...av,
    id: av.id || `avatar-onboard-${Date.now()}-${idx + 1}`,
    demographics: {
      ...(av.demographics || {}),
      geographicRegion: av.demographics?.geographicRegion || targetRegion,
    },
  }));

  const primaryAvatar = discoveredAvatars[0] || {
    id: `avatar-onboard-${Date.now()}-fallback`,
    name: `${brandProfile.name} Core Buyer`,
    roleTitle: 'Decision Maker & Active Evaluator',
    avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
    demographics: {
      ageRange: '26–48',
      seniority: 'Decision Maker',
      companySize: 'Growth & Consumer',
      budgetAuthority: 'Active Buyer',
      geographicRegion: targetRegion,
    },
    painPoints: ['Comparing options takes too long', 'Hard to tell what actually delivers value'],
    emotionalTriggers: ['Clarity and confidence', 'Saving time and avoiding costly mistakes'],
    contentAffinities: [preset.industry, 'Comparisons', 'Real Proof'],
    preferredPlatforms: platforms,
    peakEngagementHours: ['8:30 AM', '12:30 PM', '6:00 PM'],
    receptivityKeywords: [brandProfile.name, 'Compare', 'Results'],
    matchScore: 94,
  };

  // STEP 4: Generate Ready-to-Publish First Multi-Platform Campaign
  const campaignId = `camp-onboard-${Date.now()}`;
  const campaignGoal =
    payload.campaignGoal ||
    `Launch ${brandProfile.name} with multi-page brand messaging across ${platforms.join(', ')}`;

  const contentResult = await handleGenerateContent({
    brandProfile: {
      name: brandProfile.name,
      archetype: brandProfile.archetype,
      voiceAttributes: brandProfile.voiceAttributes,
      bannedWords: brandProfile.bannedWords,
    },
    customerAvatar: {
      name: primaryAvatar.name,
      roleTitle: primaryAvatar.roleTitle,
      painPoints: primaryAvatar.painPoints || [],
      emotionalTriggers: primaryAvatar.emotionalTriggers || [],
      preferredPlatforms: primaryAvatar.preferredPlatforms || platforms,
    },
    sourceType: 'brief',
    sourceInput: dossierInput,
    campaignGoal,
    platforms,
  });

  // Assemble Saved Campaign & Ready Post Variants
  const crawledLabels = (scan.crawledPages || []).map((p) => p.label).filter(Boolean);
  const campaign = {
    id: campaignId,
    title: `${brandProfile.name} — 1-Click Launch Campaign`,
    brandProfileId: brandProfile.id,
    targetAvatarIds: discoveredAvatars.map((a: any) => a.id),
    goal: campaignGoal,
    theme: scan.headings?.[0] || brandProfile.tagline,
    sourceType: 'url' as const,
    sourceInput: scan.url || rawUrl,
    keyTakeaways: [
      ...(crawledLabels.length > 0 ? [`Crawled ${crawledLabels.length} site sections: ${crawledLabels.join(', ')}`] : []),
      ...(scan.headings || []).slice(0, 3),
    ],
    status: 'active' as const,
    receptivityScores: {
      [primaryAvatar.id]: contentResult?.receptivity?.score || 94,
    },
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const heroMedia = scan.desktopScreenshotUrl || scan.ogImageUrl || '/src/assets/images/campaign_creative_asset_1793456644284.jpg';
  const now = Date.now();
  const generatedPosts: any[] = [];
  (contentResult?.variants || []).forEach((v: any, idx: number) => {
    const plat = v.platform || platforms[idx] || 'linkedin';
    if (v.variantA?.content) {
      generatedPosts.push({
        id: `post-onboard-${now}-${idx}-a`,
        campaignId,
        variantLabel: 'Variant A',
        hookAngle: v.variantA.hookAngle || 'Direct Value Hook',
        content: v.variantA.content,
        hashtags: v.variantA.hashtags || [`#${brandProfile.name.replace(/\W+/g, '')}`],
        platform: plat,
        mediaUrl: heroMedia,
        mediaType: 'image',
        scheduledTime: new Date(now + (idx + 1) * 6 * 3600 * 1000).toISOString(),
        status: 'approved',
        metrics: { impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, conversionRate: 0 },
      });
    }
    if (v.variantB?.content) {
      generatedPosts.push({
        id: `post-onboard-${now}-${idx}-b`,
        campaignId,
        variantLabel: 'Variant B',
        hookAngle: v.variantB.hookAngle || 'Story & Comparison Hook',
        content: v.variantB.content,
        hashtags: v.variantB.hashtags || [`#${brandProfile.name.replace(/\W+/g, '')}`],
        platform: plat,
        mediaUrl: scan.mobileScreenshotUrl || heroMedia,
        mediaType: 'image',
        scheduledTime: new Date(now + (idx + 5) * 6 * 3600 * 1000).toISOString(),
        status: 'draft',
        metrics: { impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, conversionRate: 0 },
      });
    }
  });

  return {
    ok: true,
    elapsedMs: Date.now() - startedAt,
    scan,
    brandProfile,
    avatars: discoveredAvatars.length > 0 ? discoveredAvatars : [primaryAvatar],
    campaign,
    generatedPosts,
    receptivity: contentResult?.receptivity,
  };
}
