/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Ready-to-Use Campaign Templates Library (12 Cross-Industry Blueprints)
 * One-click populates Campaign Builder with tailored offer brief, A/B copy variants,
 * Sponsored Ad headlines/CTAs, 3-beat AI Video scripts, and 4-slide Carousel decks.
 */

import { MarketingFormatType, SocialPlatform, AIVideoBeat } from '../types';

export type TemplateCategory =
  | 'artist_music'
  | 'creator_media'
  | 'ecommerce_merch'
  | 'tech_startup'
  | 'agency_events';

export interface CampaignTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  categoryLabel: string;
  summary: string;
  recommendedFormat: MarketingFormatType;
  recommendedPlatforms: SocialPlatform[];
  sourceType: 'screenshot' | 'url' | 'social_repurpose' | 'brief';
  sourceInput: string;
  campaignGoal: string;
  adHeadline: string;
  adCtaText: string;
  adDestinationUrl: string;
  pixelEvent: 'Lead' | 'ViewContent' | 'AddToCart' | 'Purchase' | 'Contact';
  variantA: {
    hookAngle: string;
    content: string;
    hashtags: string[];
  };
  variantB: {
    hookAngle: string;
    content: string;
    hashtags: string[];
  };
  videoBeats: AIVideoBeat[];
  carouselSlides: {
    slideNumber: number;
    title: string;
    body: string;
    visualCue: string;
  }[];
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'tmpl-single-drop',
    title: 'New Single / EP Release Drop',
    category: 'artist_music',
    categoryLabel: 'Artist / Music',
    summary: 'High-retention release rollout built around a raw studio moment, 9:16 sound-first teaser, and direct streaming link CTA.',
    recommendedFormat: 'short_video',
    recommendedPlatforms: ['tiktok', 'instagram', 'x'],
    sourceType: 'brief',
    sourceInput: 'New single & EP release drop — late-night analog synths, raw studio stems, streaming midnight everywhere.',
    campaignGoal: 'Drive pre-saves, first-48h stream velocity, and fan shares',
    adHeadline: 'Stream the New Single — Out Everywhere Midnight',
    adCtaText: 'Listen Now',
    adDestinationUrl: 'https://open.spotify.com',
    pixelEvent: 'ViewContent',
    variantA: {
      hookAngle: 'Raw Studio Frequency Hook',
      content: `We recorded this hook at 2:40 AM with one mic and zero second takes.\n\nNo label polish. Just the real frequency.\n\nStream the new single now and drop a 🔥 if you were here before the wave hit.`,
      hashtags: ['#NewMusic', '#IndependentArtist', '#StudioSession', '#OutNow'],
    },
    variantB: {
      hookAngle: 'Midnight Listener Story',
      content: `If you drive home after midnight with the windows down, I made this record for you.\n\nMonths of late-night rewrites finally locked into 3 minutes of pure energy.\n\nLink in bio — tell me which bar hits hardest.`,
      hashtags: ['#NewSingle', '#LateNightVibes', '#MusicDrop', '#SupportIndie'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: The Drop Hook',
        spokenScript: 'Wait until the bass hits at 0:04 — we almost deleted this entire track.',
        visualDirection: 'Close-up on studio monitors / headphones with moody crimson lighting.',
        kineticOverlay: 'ALMOST DELETED THIS TRACK 🎧🔥',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Raw Chorus Playback',
        spokenScript: 'Built from a 2 AM voice memo into the hardest record on the whole project.',
        visualDirection: 'Quick cuts of DAW timeline, vocal booth, and cover artwork flash.',
        kineticOverlay: '2 AM VOICE MEMO → FINAL MASTER 🎛️',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Stream CTA',
        spokenScript: 'Tap the link in bio to stream it full volume right now.',
        visualDirection: 'Cover art lockup + pulsing red CTA arrow.',
        kineticOverlay: 'STREAM FULL TRACK — LINK IN BIO ⚡',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'The Track We Almost Cut', body: 'How a 30-second phone memo turned into our lead single.', visualCue: 'Moody studio cover artwork' },
      { slideNumber: 2, title: 'Inside The Sound', body: 'Layered analog synth bass, raw room drums, zero over-compression.', visualCue: 'DAW stem breakdown visual' },
      { slideNumber: 3, title: 'The Lyric That Started It', body: 'Written after a 14-hour drive with nothing on the radio worth playing.', visualCue: 'Handwritten lyric note overlay' },
      { slideNumber: 4, title: 'Listen Now Everywhere', body: 'Available on Spotify, Apple Music & YouTube. Save to your night-drive playlist.', visualCue: 'Clean streaming QR / CTA card' },
    ],
  },
  {
    id: 'tmpl-tour-presale',
    title: 'Concert / Tour & VIP Presale',
    category: 'artist_music',
    categoryLabel: 'Artist / Music',
    summary: 'Geo-targeted flyer & sponsored ad campaign built to sell out early-bird presale tickets and VIP soundcheck passes.',
    recommendedFormat: 'sponsored_ad',
    recommendedPlatforms: ['instagram', 'tiktok', 'x'],
    sourceType: 'screenshot',
    sourceInput: 'Live tour announcement flyer — 8 cities, 48-hour fan presale access and limited VIP soundcheck upgrades.',
    campaignGoal: 'Convert local fans into early presale ticket buyers before general on-sale',
    adHeadline: '48-Hour Fan Presale Live — Limited VIP Soundcheck Passes',
    adCtaText: 'Unlock Tickets',
    adDestinationUrl: 'https://tickets.example.com/presale',
    pixelEvent: 'Purchase',
    variantA: {
      hookAngle: 'Urgency & City Callout',
      content: `THE TOUR IS OFFICIAL. 8 CITIES. ZERO BACKING TRACKS.\n\n48-hour fan presale opens right now — VIP soundcheck passes are capped at 40 per venue.\n\nGrab your city before general public opens Friday.`,
      hashtags: ['#LiveTour', '#Presale', '#ConcertTickets', '#LiveMusic'],
    },
    variantB: {
      hookAngle: 'Community Belonging',
      content: `Nothing compares to hearing a whole room sing back a chorus you wrote in your bedroom.\n\nWe are bringing the full live setup to your city this season. Drop your city below and grab presale access at the link.`,
      hashtags: ['#TourAnnouncement', '#OnTour', '#LiveShow', '#FanPresale'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Crowd Roar Opener',
        spokenScript: 'We are officially taking this show on the road — check if your city made the list.',
        visualDirection: 'Flash of stage lights, crowd hands up, quick zoom into tour dates flyer.',
        kineticOverlay: 'IS YOUR CITY ON THE LIST? 🎤⚡',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: VIP & Venue Tease',
        spokenScript: '48-hour fan presale is open right now with only 40 VIP soundcheck spots per night.',
        visualDirection: 'Scroll past tour dates with red highlight markers on major cities.',
        kineticOverlay: 'ONLY 40 VIP PASSES PER NIGHT 🎟️',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Ticket Lock CTA',
        spokenScript: 'Tap tickets in bio before Friday general sale wipes them out.',
        visualDirection: 'Direct point to link sticker with venue date ticker.',
        kineticOverlay: 'CLAIM PRESALE TICKETS NOW →',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Official Tour Dates', body: '8 intimate venues. Full live production. Presale open now.', visualCue: 'High-contrast tour poster' },
      { slideNumber: 2, title: 'What VIP Includes', body: 'Early entry, acoustic soundcheck, signed poster & exclusive merch tee.', visualCue: 'VIP laminate & stage preview' },
      { slideNumber: 3, title: 'Presale Window', body: '48 hours for core fans before public tickets go live.', visualCue: 'Countdown clock graphic' },
      { slideNumber: 4, title: 'Lock Your Spot', body: 'Tap the link to choose your city and claim early-bird pricing.', visualCue: 'Bold crimson CTA button' },
    ],
  },
  {
    id: 'tmpl-limited-merch',
    title: 'Limited Merch / Capsule Drop',
    category: 'ecommerce_merch',
    categoryLabel: 'E-Commerce / Merch',
    summary: 'Scarcity-driven capsule drop engineered for tactile visual appeal, numbered edition urgency, and direct AddToCart pixel tracking.',
    recommendedFormat: 'sponsored_ad',
    recommendedPlatforms: ['instagram', 'tiktok', 'facebook'],
    sourceType: 'screenshot',
    sourceInput: 'Limited 250-unit heavyweight 480gsm hoodie & embroidered cap capsule drop. Ships in 48 hours, never restocked.',
    campaignGoal: 'Sell out the 250-unit capsule drop within 72 hours',
    adHeadline: 'Capsule 04: 250 Numbered Units — Never Restocked',
    adCtaText: 'Shop The Drop',
    adDestinationUrl: 'https://shop.example.com/capsule-04',
    pixelEvent: 'AddToCart',
    variantA: {
      hookAngle: 'Craftsmanship & Scarcity',
      content: `480gsm French terry. Custom puff embroidery. Only 250 numbered pieces.\n\nOnce Capsule 04 sells out, the molds are retired permanently.\n\nEarly access is live right now — tap to lock your size before M/L disappear.`,
      hashtags: ['#CapsuleDrop', '#Streetwear', '#LimitedEdition', '#MerchDrop'],
    },
    variantB: {
      hookAngle: 'Anti-Fast-Fashion Manifesto',
      content: `Tired of thin blank hoodies that shrink after two washes?\n\nWe spent 6 months sourcing heavyweight fabric you can actually feel the second you open the box.\n\n250 pieces total. Live now.`,
      hashtags: ['#HeavyweightApparel', '#SmallBatch', '#DesignFirst', '#DropDay'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Tactile Close-Up',
        spokenScript: 'Stop buying paper-thin merch. Feel the difference of 480gsm heavyweight cotton.',
        visualDirection: 'Macro close-up of fabric texture, stitching, and woven neck tag.',
        kineticOverlay: '480GSM HEAVYWEIGHT · ZERO BLANKS 🧵',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Fit Check & Numbered Tag',
        spokenScript: 'Only 250 numbered pieces exist for Capsule 04 — and once your size is gone, no restocks.',
        visualDirection: '3-angle fit check + zoom on numbered interior label.',
        kineticOverlay: '250 NUMBERED UNITS · NO RESTOCK 🔒',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Shop Now CTA',
        spokenScript: 'Tap shop now to grab yours before sizes sell out tonight.',
        visualDirection: 'Clean product packshot with red Shop button.',
        kineticOverlay: 'SHOP CAPSULE 04 NOW ⚡',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Capsule 04 Is Live', body: 'Heavyweight cut-and-sew essentials built to outlast trends.', visualCue: 'Editorial lookbook hero shot' },
      { slideNumber: 2, title: 'Fabric Spec Breakdown', body: '480gsm combed cotton, double-lined hood, custom metal aglets.', visualCue: 'Annotated macro garment photo' },
      { slideNumber: 3, title: 'Strict 250-Unit Run', body: 'Individually numbered tags. Ships worldwide within 48 hours.', visualCue: 'Numbered tag close-up' },
      { slideNumber: 4, title: 'Claim Your Size', body: 'Sizes S–XXL available while inventory lasts.', visualCue: 'Direct store checkout card' },
    ],
  },
  {
    id: 'tmpl-flash-sale',
    title: '48-Hour Flash Sale / VIP Offer',
    category: 'ecommerce_merch',
    categoryLabel: 'E-Commerce / Merch',
    summary: 'High-intent conversion campaign with clear deadline urgency, objection handling, and Purchase pixel attribution.',
    recommendedFormat: 'sponsored_ad',
    recommendedPlatforms: ['instagram', 'facebook', 'x'],
    sourceType: 'url',
    sourceInput: '48-hour subscriber flash sale — 25% off bundles + free express shipping on orders over $75.',
    campaignGoal: 'Drive immediate 48-hour revenue spike from warm audiences',
    adHeadline: '48 Hours Only: 25% Off Bundles + Free Express Shipping',
    adCtaText: 'Claim 25% Off',
    adDestinationUrl: 'https://shop.example.com/flash-sale',
    pixelEvent: 'Purchase',
    variantA: {
      hookAngle: 'Direct Value + Hard Cutoff',
      content: `48 hours. 25% off every bundle. Free express shipping.\n\nWe rarely discount our flagship lineup — this window closes Sunday at 11:59 PM sharp.\n\nNo code required at checkout.`,
      hashtags: ['#FlashSale', '#BundleDeal', '#LimitedTime', '#ShopNow'],
    },
    variantB: {
      hookAngle: 'Bundle Upgrade Story',
      content: `Most customers start with one piece and come back a week later for the full kit.\n\nFor the next 48 hours, grab the complete bundle at 25% off with free express delivery included.`,
      hashtags: ['#VIPAccess', '#WeekendDrop', '#DirectToConsumer'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Clock Running Hook',
        spokenScript: 'You have 48 hours to grab our entire flagship bundle at 25% off.',
        visualDirection: 'Fast unboxing snap cut with ticking visual counter.',
        kineticOverlay: '48H ONLY · 25% OFF BUNDLES ⏳',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: What You Get',
        spokenScript: 'Every core bestseller packed together plus free express shipping — discount applies automatically.',
        visualDirection: 'Flat-lay reveal of each item snapping into frame.',
        kineticOverlay: 'FREE EXPRESS SHIPPING INCLUDED 📦',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Checkout CTA',
        spokenScript: 'Tap the link before Sunday midnight shuts the offer down.',
        visualDirection: 'Checkout screen showing instant 25% savings.',
        kineticOverlay: 'CLAIM 25% OFF BEFORE MIDNIGHT ⚡',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: '48-Hour Flash Window', body: '25% off all bundles. Ends Sunday 11:59 PM.', visualCue: 'Bold red/black sale card' },
      { slideNumber: 2, title: 'Bestseller Bundle', body: 'Save $45 instantly when bundled vs. buying individually.', visualCue: 'Bundle breakdown visual' },
      { slideNumber: 3, title: 'Fast Track Shipping', body: 'Free 2-day express shipping unlocked automatically.', visualCue: 'Shipping guarantee badge' },
      { slideNumber: 4, title: 'Tap to Claim', body: 'No coupon code needed — discount activates in cart.', visualCue: 'Direct CTA button' },
    ],
  },
  {
    id: 'tmpl-app-launch',
    title: 'Product / App Launch Blitz',
    category: 'tech_startup',
    categoryLabel: 'Tech / Startup',
    summary: 'Multi-channel launch kit turning a product URL into sharp B2B/builder teardowns, A/B hooks, and live demo conversions.',
    recommendedFormat: 'social_post',
    recommendedPlatforms: ['x', 'linkedin', 'threads'],
    sourceType: 'url',
    sourceInput: 'Public product launch: AI-native workflow platform eliminating 12+ hours of manual busywork every week.',
    campaignGoal: 'Drive launch-day signups, GitHub stars, and qualified product demos',
    adHeadline: 'Launch Smarter — Cut Manual Campaign Work by 80%',
    adCtaText: 'Try It Free',
    adDestinationUrl: 'https://github.com/SeedClassIntelligence/ADNETIKS',
    pixelEvent: 'Lead',
    variantA: {
      hookAngle: 'Hard Metric Launch Teardown',
      content: `Today we are opening public access.\n\nWhy we built it:\n1. Teams waste 12+ hours/week gluing disconnected tools together.\n2. Generic AI copy sounds robotic because it doesn't know your audience.\n3. You shouldn't be locked into one model vendor.\n\nTry the live build free — link below.`,
      hashtags: ['#ProductLaunch', '#BuildInPublic', '#AI', '#OpenSource'],
    },
    variantB: {
      hookAngle: 'Contrarian Problem Statement',
      content: `Hot take: You don't need another dashboard with 40 tabs.\n\nYou need one coherent system that knows your brand, maps your audience, generates real creative assets, and learns from every click.\n\nWe just shipped it. Test it live today.`,
      hashtags: ['#StartupLaunch', '#CreatorTools', '#Tech', '#Productivity'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Friction Callout',
        spokenScript: 'Stop paying for 6 disconnected marketing tools that still don’t talk to each other.',
        visualDirection: 'Screen recording slamming shut 6 messy browser tabs into one sleek dark studio.',
        kineticOverlay: '6 MESSY TOOLS → 1 STUDIO ⚡',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Live 8-Second Walkthrough',
        spokenScript: 'Drop a link or screenshot, calibrate your audience, render a 9:16 video, and publish everywhere in under 2 minutes.',
        visualDirection: 'Fast UI walkthrough showing live synthesis + 9:16 video render.',
        kineticOverlay: 'LINK → AD + VIDEO IN 2 MINS 🚀',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Try Live CTA',
        spokenScript: 'Link in bio to launch your first campaign free right now.',
        visualDirection: 'Logo lockup + live URL banner.',
        kineticOverlay: 'TEST IT FREE TODAY →',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Why Most Workflows Break', body: 'Creative, audience research, scheduling, and analytics live in separate silos.', visualCue: 'Fragmented stack diagram' },
      { slideNumber: 2, title: 'One Closed Loop', body: 'Brand Brain → Campaigns → Real Publishing → Attribution → Memory.', visualCue: '4-pillar loop graphic' },
      { slideNumber: 3, title: 'Zero Vendor Lock-In', body: 'Plug in Gemini, Claude, OpenAI, or local Ollama anytime.', visualCue: 'Agnostic LLM plug-in card' },
      { slideNumber: 4, title: 'Ship Faster Today', body: 'Launch your first multi-channel campaign in minutes.', visualCue: 'Free access CTA slide' },
    ],
  },
  {
    id: 'tmpl-waitlist-beta',
    title: 'VIP Waitlist / Early Access Beta',
    category: 'tech_startup',
    categoryLabel: 'Tech / Startup',
    summary: 'Exclusivity-driven pre-launch funnel capturing early adopters and founding members with Lead pixel tracking.',
    recommendedFormat: 'sponsored_ad',
    recommendedPlatforms: ['x', 'linkedin', 'instagram'],
    sourceType: 'brief',
    sourceInput: 'Founding 100 private beta waitlist — lifetime founding pricing and direct Slack access to the builders.',
    campaignGoal: 'Capture 500 high-intent beta signups before public launch',
    adHeadline: 'Founding 100 Private Beta — Lock Lifetime Access',
    adCtaText: 'Join Waitlist',
    adDestinationUrl: 'https://adnetiks.io/beta',
    pixelEvent: 'Lead',
    variantA: {
      hookAngle: 'Founding Cohort Scarcity',
      content: `We are onboarding the first 100 founding members into our private beta this week.\n\nWhat founding members get:\n• Lifetime 50% founder rate\n• Direct feature-request channel with the core team\n• Priority onboarding\n\nClaim a spot before Cohort 1 closes.`,
      hashtags: ['#PrivateBeta', '#EarlyAccess', '#FoundingMembers', '#Waitlist'],
    },
    variantB: {
      hookAngle: 'Insider Sneak Peek',
      content: `Been quietly building this behind closed doors for 4 months.\n\nFirst look goes to our waitlist this Thursday. Drop your email if you want early keys before the public rollout.`,
      hashtags: ['#SneakPeek', '#BetaLaunch', '#BuildInPublic'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Insider Reveal',
        spokenScript: 'Here is a 10-second sneak peek at what we have been building in stealth.',
        visualDirection: 'Over-the-shoulder monitor reveal in dark studio.',
        kineticOverlay: 'STEALTH BETA SNEAK PEEK 👀',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Founding Perks',
        spokenScript: 'We are letting in 100 founding testers with lifetime pricing and direct roadmap influence.',
        visualDirection: 'Quick feature clips + founding cohort counter.',
        kineticOverlay: 'ONLY 100 FOUNDING KEYS 🔑',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Waitlist CTA',
        spokenScript: 'Grab your invite key at the link before Cohort 1 locks.',
        visualDirection: 'Waitlist signup button highlight.',
        kineticOverlay: 'CLAIM BETA ACCESS NOW ⚡',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Cohort 1 Is Opening', body: '100 seats for early adopters ready to shape the roadmap.', visualCue: 'Dark obsidian invite card' },
      { slideNumber: 2, title: 'What You Unlock First', body: 'Full studio access, unlimited AI drafts, and early integrations.', visualCue: 'Feature preview grid' },
      { slideNumber: 3, title: 'Founding Member Perks', body: 'Locked lifetime pricing + private founder Discord.', visualCue: 'VIP badge graphic' },
      { slideNumber: 4, title: 'Reserve Your Key', body: 'Takes 15 seconds — invites roll out in order.', visualCue: 'Waitlist CTA slide' },
    ],
  },
  {
    id: 'tmpl-episode-multiplier',
    title: 'YouTube / Podcast Episode Multiplier',
    category: 'creator_media',
    categoryLabel: 'Creator / Media',
    summary: 'Turn one long-form YouTube video or podcast episode into a viral 9:16 clip, X takeaway thread, and IG carousel.',
    recommendedFormat: 'short_video',
    recommendedPlatforms: ['tiktok', 'instagram', 'x', 'threads'],
    sourceType: 'url',
    sourceInput: 'New 24-minute YouTube deep-dive episode breaking down our exact creative setup, workflow, and lessons learned.',
    campaignGoal: 'Multiply episode views across short-form feeds and drive subscribers',
    adHeadline: 'Watch the Full Breakdown — New Episode Live Now',
    adCtaText: 'Watch Episode',
    adDestinationUrl: 'https://youtube.com',
    pixelEvent: 'ViewContent',
    variantA: {
      hookAngle: '3 Takeaways Thread Hook',
      content: `I just published a 24-minute breakdown of everything that actually worked this quarter (and what flopped).\n\n3 biggest takeaways if you're short on time:\n1. Retention lives or dies in the first 2.5 seconds.\n2. Consistency beats perfection 10 out of 10 times.\n3. Own your audience list early.\n\nFull episode linked below 👇`,
      hashtags: ['#CreatorEconomy', '#YouTube', '#Podcast', '#ContentStrategy'],
    },
    variantB: {
      hookAngle: 'Curiosity Clip Hook',
      content: `The part at 11:40 in this week's episode completely changed how I think about creating.\n\nFull video is live on the channel now — drop a comment with your biggest takeaway.`,
      hashtags: ['#NewVideo', '#Creators', '#BehindTheScenes'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Bold Clip Tease',
        spokenScript: 'This one mistake kills 90% of creators before they hit 10,000 fans.',
        visualDirection: 'Punch-in crop on speaker at desk mic.',
        kineticOverlay: 'THE MISTAKE KILLING YOUR REACH 🚨',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Core Insight',
        spokenScript: 'Stop chasing random viral trends and start building repeatable formats your core audience expects every week.',
        visualDirection: 'Dynamic captions popping word-by-word with B-roll cut.',
        kineticOverlay: 'REPEATABLE FORMATS > RANDOM VIRALITY 📈',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Full Episode CTA',
        spokenScript: 'Full 24-minute breakdown is live on YouTube right now — link in bio.',
        visualDirection: 'Episode thumbnail card + subscribe cue.',
        kineticOverlay: 'WATCH FULL EPISODE ON YOUTUBE ▶',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'New Episode Cheat Sheet', body: '24 minutes condensed into 4 actionable slides.', visualCue: 'Episode thumbnail visual' },
      { slideNumber: 2, title: 'Takeaway #1: Hook First', body: 'Write the first 3 seconds before filming a single frame.', visualCue: 'Retention curve chart' },
      { slideNumber: 3, title: 'Takeaway #2: Repurpose Smart', body: '1 long video = 1 Reel, 1 Carousel, 1 Thread.', visualCue: 'Content multiplier map' },
      { slideNumber: 4, title: 'Watch Full Breakdown', body: 'Tap the link in bio for the complete walkthrough.', visualCue: 'YouTube CTA card' },
    ],
  },
  {
    id: 'tmpl-fan-community',
    title: 'Fan Club / Newsletter Growth Funnel',
    category: 'creator_media',
    categoryLabel: 'Creator / Media',
    summary: 'Move rented social followers onto your own email/SMS/community list using an irresistible free resource or VIP drop.',
    recommendedFormat: 'social_post',
    recommendedPlatforms: ['instagram', 'x', 'threads', 'linkedin'],
    sourceType: 'brief',
    sourceInput: 'Free creator resource pack + weekly insider dispatch for fans & builders who want early drops and raw templates.',
    campaignGoal: 'Convert social followers into owned email/community subscribers',
    adHeadline: 'Join 5,000+ Insiders — Get Early Drops & Free Kit',
    adCtaText: 'Join Free',
    adDestinationUrl: 'https://adnetiks.io/community',
    pixelEvent: 'Lead',
    variantA: {
      hookAngle: 'Algorithm Independence Hook',
      content: `Algorithms change overnight. Real communities don't.\n\nEvery Friday I send 1 actionable teardown, early drop links, and unreleased studio notes to 5,000+ insiders.\n\nJoin free — takes 10 seconds.`,
      hashtags: ['#Newsletter', '#Community', '#OwnYourAudience', '#Creators'],
    },
    variantB: {
      hookAngle: 'Free Gift Value Hook',
      content: `I packaged every template, checklist, and resource I use every week into one free starter kit.\n\nDrop into the community link below and it hits your inbox immediately.`,
      hashtags: ['#FreeResource', '#CreatorKit', '#InsiderClub'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Stop Relying on Algorithms',
        spokenScript: 'If your favorite platform vanished tomorrow, could you still reach your real fans?',
        visualDirection: 'Direct-to-camera hook with bold red caption.',
        kineticOverlay: 'OWN YOUR AUDIENCE LIST 📡',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: What Insiders Get',
        spokenScript: 'Every week we drop unreleased demos, free templates, and early ticket access straight to our inner circle.',
        visualDirection: 'Quick preview of newsletter + resource vault.',
        kineticOverlay: 'EARLY DROPS + FREE TEMPLATES 🎁',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Free Join CTA',
        spokenScript: 'Tap the link in bio to join free and grab the starter kit.',
        visualDirection: 'Clean signup CTA overlay.',
        kineticOverlay: 'JOIN FREE — LINK IN BIO ⚡',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Why We Built an Inner Circle', body: 'Direct connection without fighting algorithmic throttling.', visualCue: 'Editorial cover card' },
      { slideNumber: 2, title: 'Every Friday Drop', body: 'Raw breakdowns, behind-the-scenes clips & early links.', visualCue: 'Inbox preview mockup' },
      { slideNumber: 3, title: 'Instant Welcome Gift', body: 'Download our complete template starter kit on signup.', visualCue: 'Resource pack graphic' },
      { slideNumber: 4, title: 'Join 5,000+ Members', body: '100% free. Unsubscribe in 1 click anytime.', visualCue: 'Clean signup CTA' },
    ],
  },
  {
    id: 'tmpl-origin-story',
    title: 'Founder / Artist Origin Story',
    category: 'creator_media',
    categoryLabel: 'Creator / Media',
    summary: 'High-save, high-trust brand narrative carousel & post that builds deep emotional affinity with new audiences.',
    recommendedFormat: 'carousel',
    recommendedPlatforms: ['linkedin', 'instagram', 'threads'],
    sourceType: 'brief',
    sourceInput: 'Origin story: how we went from zero budget and a laptop to building a loyal community and shipping on our own terms.',
    campaignGoal: 'Build brand trust, profile visits, and high-save organic reach',
    adHeadline: 'Why We Built This From Scratch (Zero Shortcuts)',
    adCtaText: 'Read Our Story',
    adDestinationUrl: 'https://adnetiks.io/story',
    pixelEvent: 'ViewContent',
    variantA: {
      hookAngle: 'Honest Before/After Arc',
      content: `18 months ago we had a blank page, zero agency budget, and a stubborn belief that creative work shouldn't feel corporate.\n\n3 things that actually moved the needle:\n• Showing the messy process, not just polished wins\n• Listening directly to our first 50 fans\n• Shipping every single week without excuses\n\nSwipe the full breakdown →`,
      hashtags: ['#FounderStory', '#CreativeJourney', '#BuildInPublic', '#Authenticity'],
    },
    variantB: {
      hookAngle: 'Lessons Learned Reflection',
      content: `Nobody talks about the quiet months before anything clicks.\n\nIf you're in the middle of building something real right now, save this carousel — here are the 4 turning points that changed everything for us.`,
      hashtags: ['#BehindTheBrand', '#CreatorLife', '#KeepBuilding'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Day 1 Flashback',
        spokenScript: 'Here is what Day 1 actually looked like when nobody was watching.',
        visualDirection: 'Vintage/raw Day 1 desk shot cutting to today’s studio.',
        kineticOverlay: 'DAY 1 VS. TODAY 🎥',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: The Turning Point',
        spokenScript: 'Everything changed the moment we stopped copying templates and spoke directly to the people we actually wanted to serve.',
        visualDirection: 'Montage of community wins, studio sessions, and milestones.',
        kineticOverlay: 'REAL VOICE > GENERIC TEMPLATES 🔥',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Follow Along CTA',
        spokenScript: 'Follow along for what we are building next.',
        visualDirection: 'Warm closing shot + handle watermark.',
        kineticOverlay: 'FOLLOW THE JOURNEY →',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Day 1: Zero Budget', body: 'Just a laptop, a clear conviction, and a refusal to sound like everyone else.', visualCue: 'Raw workspace photo' },
      { slideNumber: 2, title: 'What Flopped Early', body: 'Trying to please everyone with generic, watered-down messaging.', visualCue: 'Flatline chart graphic' },
      { slideNumber: 3, title: 'The Breakthrough', body: 'Focusing obsessively on one real audience and showing the real craft.', visualCue: 'Upward momentum visual' },
      { slideNumber: 4, title: 'What’s Next', body: 'We’re just getting started — drop a comment on what you’re building.', visualCue: 'Community callout slide' },
    ],
  },
  {
    id: 'tmpl-case-study',
    title: 'Client Case Study / Proof Teardown',
    category: 'agency_events',
    categoryLabel: 'Agency / Service',
    summary: 'Data-backed transformation carousel & LinkedIn/X teardown engineered to book discovery calls with qualified buyers.',
    recommendedFormat: 'carousel',
    recommendedPlatforms: ['linkedin', 'x'],
    sourceType: 'brief',
    sourceInput: 'Client transformation case study: 3.4x CTR lift and 62% lower acquisition cost in 30 days using avatar-calibrated campaigns.',
    campaignGoal: 'Generate high-intent inbound discovery calls and audit requests',
    adHeadline: 'How We Drove 3.4x Higher CTR in 30 Days (Full Breakdown)',
    adCtaText: 'Book Strategy Call',
    adDestinationUrl: 'https://adnetiks.io/book',
    pixelEvent: 'Contact',
    variantA: {
      hookAngle: 'Hard Proof Breakdown',
      content: `30 days ago a client came to us burning $18K/mo on generic ads that nobody clicked.\n\nWe changed 3 things:\n1. Rebuilt messaging around real buyer friction\n2. Replaced stock graphics with 9:16 founder video hooks\n3. Split-tested every headline before scaling spend\n\nResult: 3.4x CTR lift in 4 weeks.\n\nWant the same teardown for your brand? Link below.`,
      hashtags: ['#CaseStudy', '#GrowthMarketing', '#PerformanceCreative', '#ROI'],
    },
    variantB: {
      hookAngle: 'Diagnostic Question',
      content: `Why do two brands selling almost the same offer get 5x different results on the exact same ad platform?\n\nIt's almost never the targeting algorithm. It's the first 2 lines of the creative.\n\nSwipe this 30-day client teardown to see the exact before & after.`,
      hashtags: ['#MarketingStrategy', '#AdCreative', '#ClientResults'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: The Before/After Metric',
        spokenScript: 'Here is how we took a stalled campaign to 3.4x higher click-through rate in 30 days.',
        visualDirection: 'Split screen showing old flat metrics vs. new climbing conversion curve.',
        kineticOverlay: '3.4x CTR IN 30 DAYS 📈',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: The 3 Moves',
        spokenScript: 'First, we locked the exact audience pain point. Second, we launched A/B video hooks. Third, we tracked real UTM clicks.',
        visualDirection: 'Screen tour of the exact winning ad creative and telemetry card.',
        kineticOverlay: 'AUDIENCE + A/B HOOKS + UTM PROOF ⚡',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Audit CTA',
        spokenScript: 'DM "AUDIT" or tap the link to get a free campaign breakdown.',
        visualDirection: 'Direct calendar link card.',
        kineticOverlay: 'BOOK YOUR FREE AUDIT →',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'The Starting Problem', body: 'High ad spend, stale creative, and generic messaging nobody remembered.', visualCue: 'Before-state metrics card' },
      { slideNumber: 2, title: 'Step 1: Audience Reset', body: 'Mapped exact buyer pain points and peak channel engagement hours.', visualCue: 'Demographic persona card' },
      { slideNumber: 3, title: 'Step 2: A/B Creative Sprint', body: 'Tested data-led vs. narrative hooks across Reels, LinkedIn & X.', visualCue: 'A/B test winner visual' },
      { slideNumber: 4, title: '30-Day Outcome: 3.4x CTR', body: 'Want us to run this playbook for your brand? Book a 15-min call.', visualCue: 'Discovery call CTA' },
    ],
  },
  {
    id: 'tmpl-ugc-spotlight',
    title: 'Fan / Customer UGC Proof Spotlight',
    category: 'agency_events',
    categoryLabel: 'Agency / Service',
    summary: 'Turn real fan praise, DMs, or customer reviews into high-trust social proof posts and retargeting ads.',
    recommendedFormat: 'social_post',
    recommendedPlatforms: ['instagram', 'x', 'linkedin', 'threads'],
    sourceType: 'social_repurpose',
    sourceInput: 'Customer/Fan testimonial spotlight: turning authentic community praise into scroll-stopping social proof.',
    campaignGoal: 'Convert skeptical fence-sitters using authentic third-party proof',
    adHeadline: 'Hear It Directly From Our Community — Not Just Us',
    adCtaText: 'See Why Fans Switch',
    adDestinationUrl: 'https://adnetiks.io/reviews',
    pixelEvent: 'Lead',
    variantA: {
      hookAngle: 'Direct Quote Spotlight',
      content: `"Switched our workflow over last week and saw more real engagement in 4 days than all of last month."\n\nYou can polish ad copy all day, but nothing beats real people sharing real results.\n\nGrateful for everyone building with us — link below to see what they're using.`,
      hashtags: ['#SocialProof', '#CommunityLove', '#UGC', '#RealResults'],
    },
    variantB: {
      hookAngle: 'Behind-The-Review Gratitude',
      content: `Woke up to this DM from a community member and had to share it.\n\nThis is the exact reason we obsess over the details nobody sees at first glance. Thank you for rocking with us.`,
      hashtags: ['#FanLove', '#Reviews', '#CommunityFirst'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Screenshot Pop-Up',
        spokenScript: 'Don’t take our word for it — read the DM that landed in our inbox this morning.',
        visualDirection: 'Real DM/review screenshot popping onto screen with highlight glow.',
        kineticOverlay: 'REAL INBOX RECEIPTS 💬🔥',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Why It Worked',
        spokenScript: 'When you build for real fans instead of vanity metrics, word of mouth does the heavy lifting.',
        visualDirection: 'Quick reel of customer/fan reactions and product in action.',
        kineticOverlay: 'BUILT FOR REAL RESULTS ⚡',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Try Yourself CTA',
        spokenScript: 'Tap the link in bio to experience it yourself today.',
        visualDirection: 'Clean brand mark + CTA button.',
        kineticOverlay: 'SEE FOR YOURSELF →',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'What People Are Saying', body: 'Unfiltered feedback straight from our community.', visualCue: 'Highlighted quote screenshot' },
      { slideNumber: 2, title: 'Before Switching', body: 'Hours lost every week guessing what to post and when.', visualCue: 'Friction recap card' },
      { slideNumber: 3, title: 'After Switching', body: 'Coordinated campaigns, sharper hooks, and measurable clicks.', visualCue: 'Result highlight card' },
      { slideNumber: 4, title: 'Join The Community', body: 'Test it yourself with zero risk — link in bio.', visualCue: 'CTA card' },
    ],
  },
  {
    id: 'tmpl-bts-camera',
    title: 'Behind-The-Scenes Teleprompter Take',
    category: 'artist_music',
    categoryLabel: 'Artist / Music',
    summary: 'Raw, high-trust 15-second vertical video designed to be filmed directly on your desktop webcam or phone camera.',
    recommendedFormat: 'short_video',
    recommendedPlatforms: ['tiktok', 'instagram', 'threads'],
    sourceType: 'brief',
    sourceInput: 'Raw behind-the-scenes studio update filmed direct-to-camera — showing the process, gear, and upcoming drop.',
    campaignGoal: 'Spark authentic comments, saves, and algorithmic discovery',
    adHeadline: 'Inside The Studio — First Look at What’s Coming Next',
    adCtaText: 'Follow For Drop',
    adDestinationUrl: 'https://adnetiks.io',
    pixelEvent: 'ViewContent',
    variantA: {
      hookAngle: 'Unfiltered Process Check-In',
      content: `Quick raw check-in straight from the desk — no fancy edit, just showing you what's actually cooking this week.\n\nDrop a comment if you want the full breakdown when it goes live.`,
      hashtags: ['#BehindTheScenes', '#StudioVibes', '#InProgress', '#CreatorLog'],
    },
    variantB: {
      hookAngle: 'Ask-The-Audience Co-Creation',
      content: `Need your honest vote before we lock this final version:\n\nShould we drop the raw cut this Friday or bundle it with the full visual pack next week? Vote in the comments 👇`,
      hashtags: ['#CoCreate', '#CommunityVote', '#BTS'],
    },
    videoBeats: [
      {
        timing: '0s - 3s',
        title: 'Beat 1: Direct Eye Contact Hook',
        spokenScript: 'Quick 15-second studio check-in — I need your honest take on what we’re dropping next.',
        visualDirection: 'Handheld phone or desktop webcam direct-to-lens, natural lighting.',
        kineticOverlay: 'NEED YOUR HONEST VOTE 👇',
      },
      {
        timing: '3s - 12s',
        title: 'Beat 2: Show The Work In Progress',
        spokenScript: 'We’ve been dialing in every detail all week and we’re finally ready to open the doors.',
        visualDirection: 'Pan briefly to screen, artwork, or studio gear while speaking.',
        kineticOverlay: 'FRESH OUT THE STUDIO 🔥',
      },
      {
        timing: '12s - 15s',
        title: 'Beat 3: Comment Engagement CTA',
        spokenScript: 'Comment "READY" below and I’ll send you the early link first.',
        visualDirection: 'Point down to comments + smile.',
        kineticOverlay: 'COMMENT "READY" FOR EARLY LINK ⚡',
      },
    ],
    carouselSlides: [
      { slideNumber: 1, title: 'Studio Check-In', body: 'What we’re building behind the scenes right now.', visualCue: 'Candid desk/studio photo' },
      { slideNumber: 2, title: 'The Current Draft', body: 'Sneak peek before final polish locks.', visualCue: 'Work-in-progress screenshot' },
      { slideNumber: 3, title: 'Your Vote Counts', body: 'Tell us which direction hits harder in the comments.', visualCue: 'A vs B choice card' },
      { slideNumber: 4, title: 'Early Access List', body: 'Drop "READY" to get first link before public release.', visualCue: 'Comment CTA graphic' },
    ],
  },
];
