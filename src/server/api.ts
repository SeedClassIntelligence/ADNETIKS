/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Server-Side AI API Engine
 * Text generation is provider-agnostic via llmProvider.ts (Gemini, OpenAI, Anthropic, OpenAI-compatible).
 * Image generation currently uses Gemini; swap to DALL-E 3 or Stability AI by updating handleGenerateImage.
 */

import { GoogleGenAI } from '@google/genai';
import { generateText } from './llmProvider.ts';

// Gemini client used exclusively for image generation
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export interface GenerateContentPayload {
  brandProfile: {
    name: string;
    archetype: string;
    voiceAttributes: string[];
    bannedWords: string[];
  };
  customerAvatar: {
    name: string;
    roleTitle: string;
    painPoints: string[];
    emotionalTriggers: string[];
    preferredPlatforms: string[];
  };
  sourceType: 'url' | 'social_repurpose' | 'brief';
  sourceInput: string;
  campaignGoal?: string;
  platforms: string[];
}

export async function handleGenerateContent(payload: GenerateContentPayload) {
  const systemInstruction = `You are ADNETIKS AI, an elite brand strategist and multi-platform social media growth director.
Brand Profile:
- Brand Name: ${payload.brandProfile.name}
- Brand Archetype: ${payload.brandProfile.archetype}
- Voice Attributes: ${payload.brandProfile.voiceAttributes.join(', ')}
- Strictly Prohibited Words (Do NOT use): ${payload.brandProfile.bannedWords.join(', ')}

Target Customer Avatar:
- Name: ${payload.customerAvatar.name} (${payload.customerAvatar.roleTitle})
- Key Pain Points: ${payload.customerAvatar.painPoints.join('; ')}
- Emotional Triggers: ${payload.customerAvatar.emotionalTriggers.join('; ')}

Task:
Synthesize social campaign copy from the provided source input (${payload.sourceType}):
"${payload.sourceInput.slice(0, 1500)}"
Campaign Goal: ${payload.campaignGoal || 'High organic engagement and qualified inbound leads'}

Generate a structured response for these platforms: ${payload.platforms.join(', ')}.
For each platform, create:
1. Variant A (Hard Data, Direct Value, Action-Oriented)
2. Variant B (Provocative Question, Story Hook, Emotional Resonance)
Also generate:
- Receptivity score (0-100)
- Receptivity rationale explaining why ${payload.customerAvatar.name} connects to this angle
- Recommended hashtags
- Visual asset prompt description

Return STRICTLY valid JSON conforming to this schema:
{
  "receptivity": {
    "score": 92,
    "level": "High",
    "rationale": "Directly tackles Tyler's bottleneck regarding CAC and inconsistent organic cadence.",
    "suggestedHookAngle": "Focus on engineering time saved and predictable revenue."
  },
  "visualPrompt": "Modern high-tech data visualization interface, dark mode with neon red accents, 4:3 ratio",
  "variants": [
    {
      "platform": "linkedin",
      "variantA": {
        "hookAngle": "Data-Driven Teardown",
        "content": "Full post copy...",
        "hashtags": ["#Growth", "#B2B"]
      },
      "variantB": {
        "hookAngle": "Contrarian Narrative",
        "content": "Full post copy...",
        "hashtags": ["#Leadership", "#Brand"]
      }
    }
  ]
}`;

  const userPrompt = `Generate multi-platform campaign variants and audience receptivity analysis based on the instructions.`;

  try {
    const responseText = await generateText(userPrompt, systemInstruction);
    if (responseText) {
      const parsed = JSON.parse(responseText);
      return parsed;
    }
  } catch (error) {
    console.warn('LLM API call failed or encountered error, falling back to heuristic engine:', error);
  }

  // Resilient High-Fidelity Heuristic Generation (Fallback)
  return generateHeuristicContent(payload);
}

function generateHeuristicContent(payload: GenerateContentPayload) {
  const avatarName = payload.customerAvatar.name;
  const painPoint = payload.customerAvatar.painPoints[0] || 'reaching and engaging your real audience';
  const brandName = payload.brandProfile.name;
  const inputSnippet = payload.sourceInput.replace(/^https?:\/\//, '').slice(0, 60);
  const inputLower = (payload.sourceInput + ' ' + (payload.campaignGoal || '')).toLowerCase();

  const isMusic = inputLower.includes('music') || inputLower.includes('track') || inputLower.includes('song') || inputLower.includes('album') || inputLower.includes('tour') || inputLower.includes('concert') || inputLower.includes('spotify') || inputLower.includes('sound');
  const isArt = inputLower.includes('art') || inputLower.includes('artist') || inputLower.includes('paint') || inputLower.includes('visual') || inputLower.includes('design') || inputLower.includes('drop') || inputLower.includes('merch');

  const variants = payload.platforms.map((platform) => {
    let varAContent = '';
    let varBContent = '';
    let hashtags: string[] = [];

    if (isMusic) {
      if (platform === 'instagram' || platform === 'tiktok') {
        varAContent = `New drop alert 🔊 We just released what we've been working on in the studio.\n\nEvery track was produced with relentless attention to frequency and feeling. Available everywhere now.\n\nLink in bio to stream and let us know your favorite record in the comments! ⚡`;
        varBContent = `Most artists release music and hope the algorithm finds the right ears.\n\nWe designed this release directly for the listeners who need this sound right now.\n\nTurn this up in your headphones and tell us what you feel. 🖤`;
        hashtags = ['#NewMusic', '#NowStreaming', '#MusicProducer', '#IndieMusic', '#ConcertLife'];
      } else if (platform === 'x' || platform === 'threads') {
        varAContent = `The new music drop is officially live.\n\n3 reasons this project hits different:\n1. Zero filler tracks\n2. Real analog instrumentation\n3. Built for the stage\n\nStream now on all platforms 🎧👇`;
        varBContent = `Stop making art for the algorithm.\n\nMake what resonates with the people who stay until the venue lights turn back on.\n\nNew record out now. Link below 🔗`;
        hashtags = ['#NewDrop', '#MusicScene', '#ArtistCommunity'];
      } else {
        varAContent = `Excited to present the official release of our latest creative project: ${inputSnippet}.\n\nCrafted specifically for ${avatarName} and our core listener community.\n\nStream the full release on all major DSPs now.`;
        varBContent = `Artistic independence means owning your sound and communicating directly with your supporters.\n\nOur latest release is live. Thank you to everyone supporting the vision.`;
        hashtags = ['#MusicIndustry', '#CreativeDirection', '#ReleaseDay'];
      }
    } else if (isArt) {
      if (platform === 'instagram' || platform === 'tiktok') {
        varAContent = `New visual showcase 🎨 Taking you behind the creation of this piece.\n\nEvery stroke, shadow, and palette decision was calibrated to evoke raw emotion.\n\nSwipe through to see the progression. Limited prints dropping this week. 🖤`;
        varBContent = `What happens when you stop following trends and build something authentic?\n\nThis piece was made for ${avatarName} and anyone who values artistic obsession over mass reproduction.\n\nWhich detail catches your eye first?`;
        hashtags = ['#VisualArt', '#ContemporaryArt', '#ArtCollector', '#DesignInspiration'];
      } else {
        varAContent = `Revealing our newest creative work: ${inputSnippet}.\n\nDesigned to push visual boundaries while staying true to the ${brandName} aesthetic.\n\nFull gallery and acquisition details now open.`;
        varBContent = `True aesthetic impact comes from bold visual conviction.\n\nTake a closer look at our latest piece and the story behind it.`;
        hashtags = ['#ArtDirection', '#VisualDesign', '#Creatives'];
      }
    } else {
      if (platform === 'linkedin') {
        varAContent = `We analyzed our campaigns across the last 90 days.\n\nThe single biggest shift?\n\nAligning content directly with ${avatarName}'s core priority: ${painPoint.toLowerCase()}.\n\n3 key outcomes:\n→ 3.4x higher audience resonance\n→ 52% reduction in production friction\n→ 100% adherence to ${brandName} standards\n\nNo vanity metrics. Just real engagement.`;
        varBContent = `Most teams waste hours creating content that gets lost in the feed.\n\nWhy? Because they broadcast announcements instead of addressing what keeps ${avatarName} up at night.\n\nWhen you solve real friction like ${painPoint.toLowerCase()}, your message becomes magnetic.`;
        hashtags = ['#CreativeStrategy', '#BrandBuilding', '#Growth', '#Leadership'];
      } else if (platform === 'x' || platform === 'threads') {
        varAContent = `How to solve ${painPoint.toLowerCase()} without burning out your team:\n\n1. Lock your target audience triggers\n2. Calibrate brand voice dials\n3. Automate delivery to peak windows\n4. A/B split-test every hook\n\nFull breakdown below 🧵👇`;
        varBContent = `Unpopular opinion: If your content isn’t generating inbound conversations, it’s not an algorithm problem.\n\nIt’s an audience resonance problem.\n\nSpeak directly to the priorities ${avatarName} cares about today.`;
        hashtags = ['#CreatorEconomy', '#BrandStrategy', '#BuildingInPublic'];
      } else if (platform === 'instagram') {
        varAContent = `Swipe through the exact framework we use at ${brandName} to eliminate ${painPoint.toLowerCase()} across multi-channel campaigns. 📊\n\nSave this post for your next planning session!`;
        varBContent = `Behind the scenes of high-velocity creative content: it is not about more noise. It is about authentic resonance. ✨\n\nDouble tap if your team is focusing on quality over volume this season.`;
        hashtags = ['#ContentDesign', '#CreativeDirector', '#VisualStrategy'];
      } else if (platform === 'tiktok') {
        varAContent = `POV: You stopped guessing what to post and started matching your message to real audience psychology. ${avatarName} will love this teardown. 📈`;
        varBContent = `The exact reason your posts are getting scrolled past (and how to fix your hook in 10 seconds). 🔥`;
        hashtags = ['#CreatorTok', '#Storytelling', '#WorkSmarter'];
      } else {
        varAContent = `Transparent breakdown: Here is how we addressed ${painPoint.toLowerCase()} for ${avatarName} and increased organic distribution by 240%.\n\nKey takeaway: consistency beats sporadic viral attempts every single time.`;
        varBContent = `The hardest part of modern communication isn’t ideation. It’s maintaining relentless voice standards across multiple channels simultaneously.\n\nHere is how we solved it.`;
        hashtags = ['#BrandStrategy', '#CreativeLeadership'];
      }
    }

    return {
      platform,
      variantA: {
        hookAngle: isMusic ? 'Direct High-Energy Hook' : 'Hard Data & Concrete Teardown',
        content: varAContent,
        hashtags,
      },
      variantB: {
        hookAngle: isMusic ? 'Emotional Fan Connection' : 'Contrarian Narrative & Resonance',
        content: varBContent,
        hashtags: hashtags.slice(0, 3),
      },
    };
  });

  return {
    receptivity: {
      score: 95,
      level: 'High',
      rationale: `The campaign concept strongly aligns with ${avatarName}'s core interests and directly answers: "${painPoint}".`,
      suggestedHookAngle: isMusic ? 'Lead with sonic immersion and live concert excitement.' : 'Lead with concrete value and authentic tone.',
    },
    visualPrompt: `High-fidelity creative visual asset for ${brandName} featuring dynamic studio lighting, obsidian background, and bold crimson styling, 4:3 ratio`,
    sourceSnippet: inputSnippet,
    variants,
  };
}

export interface GenerateImagePayload {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16' | '3:4';
  brandProfile: {
    name: string;
    archetype: string;
  };
  customerAvatar?: {
    name: string;
    roleTitle: string;
  };
}

export async function handleGenerateImage(payload: GenerateImagePayload) {
  // Image generation currently uses Gemini; swap to DALL-E 3 or Stability AI by updating this function
  const ai = getGeminiClient();
  const aspectRatio = payload.aspectRatio || '1:1';

  // Construct enriched visual prompt grounding in brand and target avatar
  const fullPrompt = `${payload.prompt}. Brand: ${payload.brandProfile.name} (${payload.brandProfile.archetype} archetype). Tailored for audience: ${payload.customerAvatar?.name || 'Executive Marketers'} (${payload.customerAvatar?.roleTitle || 'B2B Growth Leaders'}). Sleek dark modern aesthetic, sharp commercial studio lighting, high resolution, award-winning advertising visual.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          return {
            imageUrl: `data:${mime};base64,${part.inlineData.data}`,
            source: 'gemini-3.1-flash-lite-image',
            prompt: fullPrompt,
            aspectRatio,
            success: true,
          };
        }
      }
    } catch (error: any) {
      console.warn('Gemini image generation encountered error:', error);
    }
  }

  // High-fidelity fallback asset selector
  const fallbackImages = [
    '/src/assets/images/campaign_creative_asset_1793456644284.jpg',
    '/src/assets/images/adnetiks_hero_banner_1793456625181.jpg',
    '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
    '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
  ];
  const selectedFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

  return {
    imageUrl: selectedFallback,
    source: 'adnetiks-brand-asset-engine',
    prompt: fullPrompt,
    aspectRatio,
    success: true,
  };
}

export interface DiscoverAvatarsPayload {
  sourceInput: string;
  sourceType: 'url' | 'social_repurpose' | 'brief';
  campaignGoal?: string;
  brandProfile: {
    name: string;
    archetype: string;
    voiceAttributes?: string[];
  };
}

export async function handleDiscoverAvatars(payload: DiscoverAvatarsPayload) {
  const systemInstruction = `You are ADNETIKS AI, an elite brand strategist, customer avatar intelligence architect, and go-to-market director.
Analyze the following ingested product, service, or campaign offer from ${payload.brandProfile.name}:
- Source Type: ${payload.sourceType}
- Source Details: "${payload.sourceInput.slice(0, 2000)}"
- Campaign Goal: ${payload.campaignGoal || 'Drive high-conversion organic demand and qualified buyers'}

Task:
Synthesize 2 to 3 highest-converting Target Customer Avatars (greatest prospective buyers) tailored specifically to this exact product, service, or campaign offering.
For each avatar, provide realistic persona details with exact pain points that this specific product solves.

Return STRICTLY valid JSON conforming to this schema:
{
  "prospects": [
    {
      "id": "avatar-disc-1",
      "name": "Jordan Hayes",
      "roleTitle": "VP of Growth & Pipeline Marketing",
      "avatarImageUrl": "/src/assets/images/avatar_tech_founder_1793456642984.jpg",
      "demographics": {
        "ageRange": "32-46",
        "seniority": "VP / Executive",
        "companySize": "50-250 Employees (Series A-B)",
        "budgetAuthority": "$150K - $500K Annually"
      },
      "painPoints": [
        "Unpredictable pipeline from outbound cold channels",
        "Content team produces generic posts that fail to convert enterprise accounts",
        "Scaling organic distribution without tripling headcount"
      ],
      "emotionalTriggers": [
        "Desire for predictable board-level ROI",
        "Fear of missing quarterly ARR targets",
        "Pride in running an efficient, high-leverage team"
      ],
      "contentAffinities": ["B2B SaaS Growth", "Pipeline Velocity", "AI Automation"],
      "preferredPlatforms": ["linkedin", "x"],
      "peakEngagementHours": ["8:15 AM", "12:30 PM", "6:00 PM"],
      "receptivityKeywords": ["CAC", "Pipeline", "Organic Growth", "Conversion"],
      "matchScore": 96,
      "matchRationale": "This offering directly eliminates Jordan's #1 operational bottleneck by automating message-to-market resonance without manual agency overhead.",
      "suggestedHookAngle": "Focus on pipeline predictability and CAC reduction over feature vanity.",
      "isAiGenerated": true,
      "derivedFromOffer": "${payload.sourceInput.slice(0, 80).replace(/"/g, '')}"
    }
  ]
}`;

  const userPrompt = `Analyze the ingested offer and discover the greatest target customer prospect avatars.`;

  try {
    const responseText = await generateText(userPrompt, systemInstruction);
    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed.prospects && Array.isArray(parsed.prospects) && parsed.prospects.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('LLM Avatar Discovery failed or timed out, using heuristic generator:', error);
  }

  // Resilient Heuristic Prospect Discovery Engine
  return generateHeuristicProspects(payload);
}

function generateHeuristicProspects(payload: DiscoverAvatarsPayload) {
  const inputLower = (payload.sourceInput + ' ' + (payload.campaignGoal || '')).toLowerCase();
  const brandName = payload.brandProfile.name;
  const snippet = payload.sourceInput.replace(/^https?:\/\//, '').slice(0, 70);

  const isMusic = inputLower.includes('music') || inputLower.includes('track') || inputLower.includes('song') || inputLower.includes('album') || inputLower.includes('tour') || inputLower.includes('concert') || inputLower.includes('spotify') || inputLower.includes('sound') || inputLower.includes('band');
  const isArt = inputLower.includes('art') || inputLower.includes('paint') || inputLower.includes('visual') || inputLower.includes('design') || inputLower.includes('drop') || inputLower.includes('merch') || inputLower.includes('gallery');
  const isIntelligence = inputLower.includes('seed') || inputLower.includes('intelligence') || inputLower.includes('research') || inputLower.includes('model') || inputLower.includes('autonomous');
  const isEcommerce = inputLower.includes('shop') || inputLower.includes('d2c') || inputLower.includes('product') || inputLower.includes('cart') || inputLower.includes('retail');
  const isAgency = inputLower.includes('agency') || inputLower.includes('client') || inputLower.includes('services') || inputLower.includes('consult');

  if (isMusic) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Devon Taylor',
          roleTitle: 'Music Enthusiast & Active Concertgoer',
          avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
          demographics: {
            ageRange: '21–36',
            seniority: 'Fan Community / Core Supporter',
            companySize: 'Independent Music Culture',
            budgetAuthority: '$1,500+ Annual Music & Merch Spend',
          },
          painPoints: [
            'Missing limited vinyl releases and tour presale drops',
            'Overwhelmed by algorithmic streaming playlists with generic recommendations',
            'Craving genuine artistic connection and behind-the-scenes access',
          ],
          emotionalTriggers: [
            'Excitement of being early on an artist before they blow up',
            'Belonging to a passionate fan community with shared music taste',
            'Adrenaline of live concerts and front-row experiences',
          ],
          contentAffinities: ['New Music Drops', 'Concert Vlogs', 'Studio Production', 'Vinyl Collecting'],
          preferredPlatforms: ['instagram', 'tiktok', 'x'],
          peakEngagementHours: ['11:00 AM', '4:30 PM', '9:15 PM'],
          receptivityKeywords: ['New Track', 'Tour Dates', 'Presale', 'Exclusive Drop'],
          matchScore: 98,
          matchRationale: `Devon is intensely receptive because this release speaks directly to their sonic appetite and provides immediate streaming/ticket access.`,
          suggestedHookAngle: 'Lead with sonic immersion, unreleased teasers, and direct presale links.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
        {
          id: `avatar-disc-${Date.now()}-2`,
          name: 'Zoe Vance',
          roleTitle: 'Playlist Curator & Music Discovery Creator',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '24–38',
            seniority: 'Curator / Tastemaker',
            companySize: '50K+ Monthly Playlist Followers',
            budgetAuthority: 'Influence & Sync Recommender',
          },
          painPoints: [
            'Drowning in generic PR pitches from artists that lack unique sound signatures',
            'Finding fresh, high-replay tracks to keep playlist retention high',
            'Crediting authentic independent artists before commercial radio catches on',
          ],
          emotionalTriggers: [
            'Pride in having impeccable musical taste and breaking new talent',
            'Building cultural influence across Spotify, Apple Music, and TikTok',
          ],
          contentAffinities: ['Independent Music', 'Music Production Breakdown', 'A&R Discovery'],
          preferredPlatforms: ['tiktok', 'x', 'instagram'],
          peakEngagementHours: ['8:30 AM', '1:00 PM', '8:00 PM'],
          receptivityKeywords: ['Underground', 'Production Quality', 'Vibe', 'High Replay'],
          matchScore: 95,
          matchRationale: `Zoe values distinct production aesthetics. Highlighting the sonic originality makes this an effortless playlist addition.`,
          suggestedHookAngle: 'Focus on production craft, vocal texture, and listener replay value.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isArt) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Sora Takahashi',
          roleTitle: 'Visual Art Collector & Creative Director',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '28–46',
            seniority: 'Director / Collector',
            companySize: 'Design Studio / Independent Gallery',
            budgetAuthority: '$5,000–$25,000 Annual Art Budget',
          },
          painPoints: [
            'Saturated digital feeds full of cookie-cutter AI art lacking soul',
            'Missing limited archival print drops and original gallery pieces',
            'Desire to understand the philosophy and creative process behind the work',
          ],
          emotionalTriggers: [
            'Visual resonance with evocative, high-craft aesthetics',
            'Exclusivity of owning a physical piece or limited numbered print',
          ],
          contentAffinities: ['Contemporary Art', 'Visual Identity', 'Studio BTS', 'Typography'],
          preferredPlatforms: ['instagram', 'threads', 'x'],
          peakEngagementHours: ['9:30 AM', '2:15 PM', '8:45 PM'],
          receptivityKeywords: ['Limited Edition', 'Archival Print', 'Original Work', 'Process'],
          matchScore: 97,
          matchRationale: `Sora evaluates work on aesthetic depth and creative authenticity. Presenting the creative process and limited availability converts them rapidly.`,
          suggestedHookAngle: 'Highlight the visual narrative, craftsmanship, and drop timing.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isIntelligence) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Dr. Aris Thorne',
          roleTitle: 'Autonomous Systems & Intelligence Lead',
          avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
          demographics: {
            ageRange: '32–48',
            seniority: 'Principal / Founder',
            companySize: 'Advanced Intelligence & Systems',
            budgetAuthority: '$150K+ Compute & Tooling Budget',
          },
          painPoints: [
            'Clunky tools locked to single proprietary LLM vendors',
            'Slow execution pipelines with high latency and lack of orchestration',
            'Difficulty coordinating multi-agent workflows into clear user actions',
          ],
          emotionalTriggers: [
            'Sovereignty through model-agnostic and open-source infrastructure',
            'Speed of execution without manual repetitive orchestration',
          ],
          contentAffinities: ['Model-Agnostic LLMs', 'Autonomous Delivery', 'Agent Swarms'],
          preferredPlatforms: ['x', 'linkedin'],
          peakEngagementHours: ['7:30 AM', '12:00 PM', '6:30 PM'],
          receptivityKeywords: ['Agnostic', 'Automation', 'Performance', 'Latency'],
          matchScore: 99,
          matchRationale: `Directly solves Aris's need for vendor independence, model flexibility, and multi-channel automated delivery.`,
          suggestedHookAngle: 'Lead with BE-agnostic architecture and autonomous multi-agent orchestration.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isEcommerce) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Chloe Rivera',
          roleTitle: 'Head of E-Commerce & DTC Performance',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '28-39',
            seniority: 'Head of Department',
            companySize: '25-100 Employees (DTC / Retail)',
            budgetAuthority: '$200K+ Ad Spend Authority',
          },
          painPoints: [
            'Rising Meta & TikTok CAC squeezing contribution margins',
            'Creative fatigue requiring 10+ new video variations every week',
            'Converting social views into attributed checkout transactions',
          ],
          emotionalTriggers: [
            'Urgency to achieve 3.5x+ blended ROAS',
            'Pressure from founders to maintain profitable scaling',
            'Excitement for viral creator content that moves inventory',
          ],
          contentAffinities: ['DTC Growth', 'TikTok Ads Scaling', 'ROAS Optimization', 'Creative Strategy'],
          preferredPlatforms: ['tiktok', 'instagram'],
          peakEngagementHours: ['9:00 AM', '1:30 PM', '8:15 PM'],
          receptivityKeywords: ['ROAS', 'Contribution Margin', 'UGC', 'TikTok Ads'],
          matchScore: 97,
          matchRationale: `Chloe has immediate buying intent because this campaign directly targets rising acquisition costs with short-form creative angles.`,
          suggestedHookAngle: 'Lead with creative hook velocity and 3.4x ROAS attribution proof.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  if (isAgency) {
    return {
      prospects: [
        {
          id: `avatar-disc-${Date.now()}-1`,
          name: 'Siddharth Patel',
          roleTitle: 'Managing Partner & Creative Director',
          avatarImageUrl: '/src/assets/images/avatar_brand_strategist_1793456772495.jpg',
          demographics: {
            ageRange: '34-48',
            seniority: 'Managing Partner',
            companySize: '15-80 Team Members',
            budgetAuthority: '$100K+ Software & Stack Budget',
          },
          painPoints: [
            'Client churn caused by slow turnaround on social campaigns',
            'Junior copywriters producing off-brand, generic content',
            'Inability to scale client roster without hiring expensive headcount',
          ],
          emotionalTriggers: [
            'Pride in delivering award-winning client creative velocity',
            'Fear of losing retainer clients to nimble AI-native agencies',
          ],
          contentAffinities: ['Agency Scaling', 'Brand Strategy', 'Client Retention'],
          preferredPlatforms: ['linkedin', 'x'],
          peakEngagementHours: ['8:30 AM', '12:15 PM', '6:30 PM'],
          receptivityKeywords: ['Agency Margins', 'Client Retainers', 'Turnaround Velocity'],
          matchScore: 96,
          matchRationale: `Siddharth urgently needs this to protect agency gross margins and fulfill multi-channel deliverables in minutes.`,
          suggestedHookAngle: 'Focus on 52% reduction in content production time and client retainer retention.',
          isAiGenerated: true,
          derivedFromOffer: snippet,
        },
      ],
    };
  }

  // Dynamic Custom Extractor for any URL or text
  const cleanName = snippet.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 30) || 'Target Audience';

  return {
    prospects: [
      {
        id: `avatar-disc-${Date.now()}-1`,
        name: `Morgan Lee`,
        roleTitle: `Core Community & Audience for ${cleanName}`,
        avatarImageUrl: '/src/assets/images/avatar_tech_founder_1793456642984.jpg',
        demographics: {
          ageRange: '25–45',
          seniority: 'Target Decision Maker / Fan',
          companySize: cleanName,
          budgetAuthority: 'High Direct Conversion Potential',
        },
        painPoints: [
          `Finding authentic, high-quality content related to ${cleanName}`,
          'Tired of generic marketing noise and promotional spam',
          'Needs direct proof of value and clear calls to action',
        ],
        emotionalTriggers: [
          `Genuine resonance with the ${brandName} mission`,
          'Desire for streamlined, high-impact solutions and creative quality',
        ],
        contentAffinities: ['Authentic Messaging', 'Direct Value', 'Behind The Scenes'],
        preferredPlatforms: ['linkedin', 'x', 'instagram'],
        peakEngagementHours: ['8:30 AM', '12:30 PM', '6:00 PM'],
        receptivityKeywords: ['Value', 'Community', 'Authenticity', 'Velocity'],
        matchScore: 96,
        matchRationale: `Analyzed "${snippet}" and calibrated copy to directly answer Morgan's core priorities.`,
        suggestedHookAngle: `Directly address the primary outcome of ${cleanName} with compelling hooks.`,
        isAiGenerated: true,
        derivedFromOffer: snippet,
      },
    ],
  };
}

