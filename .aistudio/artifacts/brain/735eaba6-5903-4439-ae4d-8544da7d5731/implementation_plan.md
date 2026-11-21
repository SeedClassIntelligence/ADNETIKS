# ADNETIKS — Competitor Feature Evaluation & System Expansion Plan

This plan evaluates the competitor concepts provided (Fuel's Autonomous Service Orchestration and TikTok's Creative Suite & Ad Manager), benchmarks them against what ADNETIKS already provides, identifies unique high-value gaps, and details the architecture for integrating two new power modules: **Inbound Social Listening & Autonomous Service Agents** and **TikTok Creative Video Studio & Ad Attribution Center**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Audit of Competitor Features vs. Existing ADNETIKS Capabilities**:
> - **Already Existing in ADNETIKS (No duplicate work needed)**:
>   - *Autonomous Content Generation & Publishing*: Already built in `ContentStudio` and `SmartScheduler` with Gemini 3.8 Flash and peak-hour AI queue.
>   - *AI Content Intelligence & Analytics*: Already built in `AnalyticsDashboard` with 7x24 engagement heatmap and cross-platform CTR tracking.
>   - *A/B Split-Testing & Competitor Watch*: Already built in `SplitTestLab` and `CompetitorWatch`.
> - **What is Brand New & Intriguing from Your Competitor Analysis (To Be Built)**:
>   1. **Service Orchestration & Social Listening (The Fuel Concept)**:
>      - *Inbound Mention Discovery*: Automated web and social listening detecting where users are praising, asking questions, or venting about the brand.
>      - *Autonomous Brand-Trained Service Agents*: Auto-drafts or resolves low-complexity customer cases in strict adherence to brand voice; escalates critical/urgent cases to human team ("Stay on call for the hard cases").
>      - *User Generated Content (UGC) to Campaign Pipeline*: Detects glowing customer praise and converts it into approved, scheduled social posts in one click.
>   2. **TikTok Native Creative Studio & Ad Attribution (The TikTok for Business Concept)**:
>      - *Trending Sounds & Viral Hashtags Radar*: Real-time momentum rankings for commercial sounds and trending audio.
>      - *3-Beat Video Script Storyboarder*: Generates high-converting TikTok scripts (0-3s Hook, 3-12s Proof/Demo, 12-15s CTA) with on-screen text direction.
>      - *Interactive 9:16 Native Video Ad Simulator*: Customizable templates (Product Showcase, Founder POV, UGC Review, Problem/Solution) with phone frame preview, audio selector, and text overlay timing.
>      - *Ad Performance & TikTok Pixel Attribution Tracker*: Monitors ROAS, cost-per-acquisition (CPA), conversion funnel (Views → Clicks → Add to Cart → Purchase), and audience segment targeting.

---

## 1. Overview & Core Concept

- **The Problem Solved**: Marketing and customer retention are two sides of the same coin: *"It costs more to get a customer than to keep one."* Existing social schedulers only broadcast outbound posts. By integrating inbound social listening with autonomous service agents, ADNETIKS closes the loop between organic marketing and customer retention. Simultaneously, adding dedicated short-form video storyboarding and TikTok Ad Manager attribution empowers teams to turn organic attention into measurable paid conversions.
- **Target Audience**: Growth marketing teams, e-commerce brand owners, and agency social media managers seeking an all-in-one platform for organic distribution, short-form video creation, and customer retention.

---

## 2. User Experience & Visual Design

### New User Flows

1. **Autonomous Service & Social Listening Hub (`Service Orchestration`)**:
   - **Live Inbound Stream**: Real-time incoming feed of mentions across X, LinkedIn, Reddit, Instagram, and review platforms.
   - **Sentiment & Intent Triage**: Automatically tags posts as *Praise (UGC candidate)*, *Feature Question*, *Product Venting / Bug*, or *Billing Issue*.
   - **Brand Agent Auto-Remediation**:
     - Low-risk/Praise: Brand-trained agent drafts an on-brand, empathetic reply.
     - High-risk/Critical: Flagged with an amber warning badge for human sign-off (*"Escalated to Human Review"*).
   - **1-Click "Convert UGC to Campaign Post"**: Turns genuine customer compliments into styled multi-channel social posts with quote cards.

2. **TikTok Native Creative Studio & Ad Attribution Hub**:
   - **Trending Audio & Hashtag Radar**: Live feed of top commercial sounds, viral momentum scores, and trending hashtags.
   - **3-Beat Video Script Generator**: Automatically writes 15-second and 30-second scripts with visual cues (e.g. *Beat 1 Hook: "Stop doing X", Beat 2: Demo product with text popup, Beat 3: Limited-time CTA*).
   - **Interactive 9:16 Phone Preview**: Switch between templates (Founder POV, UGC Testimonial, Split-Screen Problem/Solution), adjust text overlays, toggle audio tracks, and test simulated viewer reactions.
   - **TikTok Pixel & ROAS Attribution Dashboard**: Tracks ad spend vs. revenue, Return on Ad Spend (ROAS e.g. 3.82x), cost-per-lead, and conversion funnel drop-offs.

### Visual Identity & Theme

- Preserves the established **ADNETIKS Design Constitution**:
  - Deep slate dark mode canvas (`#090D16`), high-contrast structural cards (`#0F172A`), hairline dividers.
  - Accent colors: Cobalt Blue (`#2563EB`) for outbound studio, Red/Coral (`#EF4444`) for brand symbol and escalations, Emerald (`#10B981`) for resolved cases and positive ROAS, Neon Cyan (`#06B6D4`) for TikTok creative tags.
  - Typography: `Plus Jakarta Sans` for headers, `Public Sans` for text, `tabular-nums` for ROAS, pixel metrics, and sentiment percentages.
  - Anti-slop: Clean unboxed metadata with `·` separators; zero static pill clutter.

---

## 3. Key Architectural Decisions

- **Decision 1: Native Inbound Stream & Brand Voice Remediation Engine**
  - *Approach*: Extend server-side Gemini 3.8 Flash proxy to support `/api/service-orchestration` (sentiment scoring, automated reply drafting, and escalation rules). Seeded with realistic inbound customer interactions.
  - *Why*: Gives marketers instant visibility into real-world customer sentiment without requiring complex external webhook setups during evaluation.

- **Decision 2: 9:16 Native Short-Form Video Simulation**
  - *Approach*: Build a responsive, interactive 9:16 mobile phone simulator with animated video playback preview, sound track picker, timed captions, and customizable template styles.
  - *Why*: Allows marketers to visualize native TikTok pacing, hook retention, and overlay positioning directly inside the desktop/tablet interface.

---

## 4. Technical Architecture & Component Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ADNETIKS Unified Platform                         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     ▼                               ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│ Outbound Content Hub    │   │ Inbound Service Agent   │   │ TikTok Creative & Ads   │
│ - Content Ingestion     │   │ - Social Listening      │   │ - Trending Audio/Tags   │
│ - A/B Split Testing     │   │ - Autonomous Replies    │   │ - 3-Beat Scriptwriter   │
│ - AI Image Generator    │   │ - Human Escalation Gate │   │ - 9:16 Phone Simulator  │
│ - Smart Queue & Sched   │   │ - UGC-to-Post Pipeline  │   │ - Pixel ROAS Dashboard  │
└────────────┬────────────┘   └────────────┬────────────┘   └────────────┬────────────┘
             │                             │                             │
             └─────────────────────────────┼─────────────────────────────┘
                                           ▼
                      ┌────────────────────────────────────────┐
                      │      Unified Reactive State Engine     │
                      │  (Brand, Avatars, Queue, Inbound, Ads) │
                      └────────────────────┬───────────────────┘
                                           │
                                           ▼
                      ┌────────────────────────────────────────┐
                      │    Server-Side Gemini 3.8 Flash Proxy  │
                      │  (/api/service, /api/generate-content) │
                      └────────────────────────────────────────┘
```

---

## 5. Verification & Implementation Steps

1. **Data Models (`src/types/index.ts`)**: Add types for `InboundCase`, `SocialMention`, `TikTokScript`, `TrendingAudio`, and `PixelMetrics`.
2. **Mock Data (`src/data/mockData.ts`)**: Add realistic inbound social listening mentions (praises, inquiries, complaints), trending TikTok sounds, and pixel attribution stats.
3. **Component 1 (`src/components/ServiceOrchestrator.tsx`)**: Build the Social Listening & Autonomous Service Agent Hub with sentiment filters, auto-reply generator, human escalation queue, and 1-click UGC-to-post converter.
4. **Component 2 (`src/components/TikTokCreativeStudio.tsx`)**: Build the TikTok Creative Center with trending audio radar, 3-beat script generator, 9:16 phone mockup, and ad attribution/ROAS metrics.
5. **Top Navigation (`src/components/TopNav.tsx`)**: Add navigation items for "Service Agents" and "TikTok Studio".
6. **App Root (`src/App.tsx`)**: Integrate state persistence and seamless routing between inbound UGC praise and the creative studio.
7. **Verification**: Run `compile_applet` and `lint_applet` to ensure 0 build errors.
