/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS — Social Media Content Creation, Automated Delivery & Brand Intelligence Platform
 * BE-Agnostic Multi-LLM Creative Studio & Distribution Engine
 */

import { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import HomeDashboard from './components/HomeDashboard';
import ContentStudio from './components/ContentStudio';
import BrandAvatarStudio from './components/BrandAvatarStudio';
import ServiceOrchestrator from './components/ServiceOrchestrator';
import AdnetiksVideoStudio from './components/AdnetiksVideoStudio';
import SplitTestLab from './components/SplitTestLab';
import SmartScheduler from './components/SmartScheduler';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import IntegrationsHub from './components/IntegrationsHub';
import StakeholderReportModal from './components/StakeholderReportModal';
import NotificationDrawer from './components/NotificationDrawer';
import AdnetiksLogo from './components/AdnetiksLogo';

import {
  BrandProfile,
  CustomerAvatar,
  Campaign,
  PostVariant,
  SplitTestExperiment,
  NotificationItem,
  CompetitorProfile,
  InboundSocialMention,
  UserRole,
  CampaignVideoAsset,
} from './types';

import {
  initialBrandProfile,
  initialAvatars,
  initialCampaigns,
  initialSplitTests,
  initialPosts,
  initialNotifications,
  initialCompetitors,
  initialInboundMentions,
  initialTrendingSounds,
  initialTikTokTemplates,
  initialTikTokAdMetrics,
  generateHeatmapData,
} from './data/mockData';

export default function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<string>('home');
  const [studioSourceMode, setStudioSourceMode] = useState<'screenshot' | 'url' | 'social_repurpose' | 'brief'>('screenshot');

  // Role-Based Access Control State
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('adnetiks_user_role');
    return (saved as UserRole) || 'admin';
  });

  // Dark / Light Theme
  const [isDark, setIsDark] = useState<boolean>(true);

  // Core Data Stores with LocalStorage fallback
  const [brandProfile, setBrandProfile] = useState<BrandProfile>(() => {
    const saved = localStorage.getItem('adnetiks_brand_profile');
    return saved ? JSON.parse(saved) : initialBrandProfile;
  });

  const [avatars, setAvatars] = useState<CustomerAvatar[]>(() => {
    const saved = localStorage.getItem('adnetiks_avatars');
    return saved ? JSON.parse(saved) : initialAvatars;
  });

  const [selectedAvatar, setSelectedAvatar] = useState<CustomerAvatar>(() => avatars[0] || initialAvatars[0]);

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('adnetiks_campaigns');
    return saved ? JSON.parse(saved) : initialCampaigns;
  });

  const [splitTests, setSplitTests] = useState<SplitTestExperiment[]>(() => {
    const saved = localStorage.getItem('adnetiks_split_tests');
    return saved ? JSON.parse(saved) : initialSplitTests;
  });

  const [posts, setPosts] = useState<PostVariant[]>(() => {
    const saved = localStorage.getItem('adnetiks_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('adnetiks_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(() => {
    const saved = localStorage.getItem('adnetiks_competitors');
    return saved ? JSON.parse(saved) : initialCompetitors;
  });

  const [mentions, setMentions] = useState<InboundSocialMention[]>(() => {
    const saved = localStorage.getItem('adnetiks_inbound_mentions');
    return saved ? JSON.parse(saved) : initialInboundMentions;
  });

  const [trendingSounds] = useState(initialTrendingSounds);
  const [videoTemplates] = useState(initialTikTokTemplates);
  const [adMetrics] = useState(initialTikTokAdMetrics);
  const [heatmapData] = useState(() => generateHeatmapData());

  // Modal & Drawer States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Active Campaign Project & Sub-Pillar Tabs
  const [activeCampaignId, setActiveCampaignId] = useState<string>(() => campaigns[0]?.id || 'camp-q4-surge');
  const [distributionSubTab, setDistributionSubTab] = useState<'queue' | 'ab_lab'>('queue');
  const [signalsSubTab, setSignalsSubTab] = useState<'analytics' | 'inbox'>('analytics');

  // Active Hero Video Asset Plugged Into Campaign Builder (AI Generated, Recorded, or Uploaded)
  const [attachedCampaignVideo, setAttachedCampaignVideo] = useState<CampaignVideoAsset | null>(null);
  const [studioInitialFormat, setStudioInitialFormat] = useState<'social_post' | 'sponsored_ad' | 'short_video' | 'carousel' | undefined>(undefined);

  // In-App Toast System
  const [toast, setToast] = useState<{ id: string; title: string; message: string } | null>(null);
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);

  // Hydrate persistent server-side workspace (.adnetiks-data/workspace.json) on boot
  useEffect(() => {
    fetch('/api/workspace')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const ws = data?.workspace;
        if (ws) {
          if (ws.brandProfile) setBrandProfile(ws.brandProfile);
          if (Array.isArray(ws.avatars) && ws.avatars.length > 0) {
            setAvatars(ws.avatars);
            setSelectedAvatar(ws.avatars[0]);
          }
          if (Array.isArray(ws.campaigns) && ws.campaigns.length > 0) {
            setCampaigns(ws.campaigns);
            setActiveCampaignId(ws.campaigns[0].id);
          }
          if (Array.isArray(ws.posts) && ws.posts.length > 0) setPosts(ws.posts);
          if (Array.isArray(ws.splitTests) && ws.splitTests.length > 0) setSplitTests(ws.splitTests);
          if (ws.attachedCampaignVideo !== undefined) setAttachedCampaignVideo(ws.attachedCampaignVideo);
          if (ws.brandConfigured) localStorage.setItem('adnetiks_brand_configured', 'true');
        }
      })
      .catch(() => {})
      .finally(() => setWorkspaceHydrated(true));
  }, []);

  // Debounced sync to persistent server-side workspace storage
  useEffect(() => {
    if (!workspaceHydrated) return;
    const timer = setTimeout(() => {
      fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandProfile,
          avatars,
          campaigns,
          posts,
          splitTests,
          attachedCampaignVideo,
          brandConfigured: localStorage.getItem('adnetiks_brand_configured') === 'true',
        }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [workspaceHydrated, brandProfile, avatars, campaigns, posts, splitTests, attachedCampaignVideo]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('adnetiks_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('adnetiks_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('adnetiks_brand_profile', JSON.stringify(brandProfile));
  }, [brandProfile]);

  useEffect(() => {
    localStorage.setItem('adnetiks_avatars', JSON.stringify(avatars));
  }, [avatars]);

  useEffect(() => {
    localStorage.setItem('adnetiks_split_tests', JSON.stringify(splitTests));
  }, [splitTests]);

  useEffect(() => {
    localStorage.setItem('adnetiks_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('adnetiks_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('adnetiks_competitors', JSON.stringify(competitors));
  }, [competitors]);

  useEffect(() => {
    localStorage.setItem('adnetiks_inbound_mentions', JSON.stringify(mentions));
  }, [mentions]);

  // Handle Theme Toggle
  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toast Trigger Helper
  const showNotificationToast = (title: string, message: string) => {
    const id = `${Date.now()}`;
    setToast({ id, title, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  // Queue Posts Handler
  const handleSaveToQueue = (newPosts: PostVariant[]) => {
    setPosts((prev) => [...newPosts, ...prev]);
  };

  // Launch Split Test Handler
  const handleLaunchSplitTest = (newExperiment: SplitTestExperiment) => {
    setSplitTests((prev) => [newExperiment, ...prev]);
    setPosts((prev) => [newExperiment.variantA, newExperiment.variantB, ...prev]);
    setActiveTab('split_lab');
  };

  // Declare Winner Handler — Automatically Feeds Proven Winner Into Closed-Loop Brand Memory
  const handleDeclareWinner = (experimentId: string, winnerKey: 'Variant A' | 'Variant B') => {
    const exp = splitTests.find((t) => t.id === experimentId);
    setSplitTests((prev) =>
      prev.map((t) =>
        t.id === experimentId
          ? {
              ...t,
              status: 'completed',
              winningVariantKey: winnerKey,
              confidenceScore: 99.1,
              liftPercentage: 62.4,
            }
          : t
      )
    );

    if (exp) {
      const winnerObj = winnerKey === 'Variant A' ? exp.variantA : exp.variantB;
      fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandProfile.name,
          source: 'ab_winner',
          platform: exp.platform,
          winningVariant: winnerKey,
          hookAngle: winnerObj.hookAngle || exp.title,
          takeaway: `Prioritize "${winnerObj.hookAngle || exp.title}" (${winnerKey}) on ${exp.platform.toUpperCase()} — won A/B split test over alternative hook.`,
          evidenceMetric: '+62.4% lift · 99.1% confidence',
          confidence: 99,
        }),
      })
        .then(() => {
          showNotificationToast(
            'Winner Learned Into Brand Brain',
            `"${winnerObj.hookAngle}" saved to Closed-Loop Memory and will automatically sharpen future campaigns.`
          );
        })
        .catch(() => {});
    }
  };

  // Preloaded Trending Theme from Analytics Monitor
  const [preloadedTheme, setPreloadedTheme] = useState<{
    theme: string;
    hashtags: string[];
  } | null>(null);

  const handleDeployTrendingTheme = (theme: string, hashtags: string[]) => {
    setPreloadedTheme({ theme, hashtags });
    setActiveTab('studio');
    showNotificationToast(
      'Trending Theme Deployed to Studio',
      `Loaded "${theme}" into campaign studio with ${hashtags.length} trending tags.`
    );
  };

  // Counter Competitor Handler
  const handleSendToRemixStudio = (postContent: string) => {
    setActiveTab('studio');
    showNotificationToast(
      'Competitor Post Loaded in Studio',
      'Deploy an ADNETIKS counter-campaign exploiting their message weakness.'
    );
  };

  // Convert Inbound UGC Praise to Campaign Post
  const handleConvertUgcToPost = (mention: InboundSocialMention) => {
    const newUgcPost: PostVariant = {
      id: `ugc-post-${Date.now()}`,
      campaignId: 'camp-q4-surge',
      variantLabel: 'Variant A',
      hookAngle: `Customer Praise: ${mention.authorName}`,
      content: `"${mention.content}"\n\n— ${mention.authorName} (${mention.authorHandle})\n\nNothing beats genuine audience velocity. This is why we prioritize fan resonance over generic feature broadcasting.`,
      hashtags: ['#CustomerLove', '#UGC', '#CommunityGrowth', '#SocialProof'],
      platform: 'linkedin',
      mediaUrl: '/src/assets/images/campaign_creative_asset_1793456644284.jpg',
      mediaType: 'image',
      scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'approved',
      metrics: { impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, conversionRate: 0 },
    };

    setPosts([newUgcPost, ...posts]);
    setActiveTab('scheduler');
  };

  // Export Video Script to Queue
  const handleSendScriptToQueue = (scriptTitle: string, scriptContent: string) => {
    const newVideoPost: PostVariant = {
      id: `video-script-${Date.now()}`,
      campaignId: 'camp-q4-surge',
      variantLabel: 'Variant A',
      hookAngle: `3-Beat Reel: ${scriptTitle}`,
      content: scriptContent,
      hashtags: ['#ContentCreator', '#ShortFormVideo', '#GrowthStrategy', '#VideoReels'],
      platform: 'tiktok',
      mediaUrl: '/src/assets/images/campaign_creative_asset_1793456644284.jpg',
      mediaType: 'video',
      scheduledTime: new Date(Date.now() + 43200000).toISOString(),
      status: 'approved',
      metrics: { impressions: 0, clicks: 0, likes: 0, shares: 0, comments: 0, ctr: 0, conversionRate: 0 },
    };

    setPosts([newVideoPost, ...posts]);
    setActiveTab('scheduler');
  };

  // Unified Navigation Helper (maps legacy tab names cleanly into the 4 pillars)
  const handleNavigateTab = (tab: string) => {
    if (tab === 'scheduler') {
      setDistributionSubTab('queue');
      setActiveTab('distribution');
      return;
    }
    if (tab === 'split_lab') {
      setDistributionSubTab('ab_lab');
      setActiveTab('distribution');
      return;
    }
    if (tab === 'analytics') {
      setSignalsSubTab('analytics');
      setActiveTab('signals');
      return;
    }
    if (tab === 'service_agents') {
      setSignalsSubTab('inbox');
      setActiveTab('signals');
      return;
    }
    setActiveTab(tab);
  };

  // Create Real Saved Campaign Project
  const handleCreateCampaign = () => {
    const newId = `camp-${Date.now()}`;
    const newCamp: Campaign = {
      id: newId,
      title: `${brandProfile.name} Campaign #${campaigns.length + 1}`,
      brandProfileId: brandProfile.id,
      targetAvatarIds: selectedAvatar ? [selectedAvatar.id] : [],
      goal: `Engage ${selectedAvatar?.name || 'core audience'} across priority social channels`,
      theme: brandProfile.valuePillars[0] || 'Multi-Channel Launch',
      sourceType: 'url',
      sourceInput: '',
      keyTakeaways: [],
      status: 'active',
      receptivityScores: {},
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    setActiveCampaignId(newId);
    setStudioSourceMode('screenshot');
    setStudioInitialFormat(undefined);
    setActiveTab('studio');
    showNotificationToast('New Campaign Created', `Created "${newCamp.title}" in Campaign Studio.`);
  };

  const handleOpenCampaign = (campaignId: string) => {
    setActiveCampaignId(campaignId);
    setActiveTab('studio');
  };

  const handleUpdateCampaignTitle = (campaignId: string, title: string) => {
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, title } : c)));
  };

  // Complete Brand & Demographic Calibration Wizard
  const handleCompleteBrandSetup = (
    updatedBrand: BrandProfile,
    discoveredAvatars: CustomerAvatar[],
    goToCampaigns?: boolean
  ) => {
    setBrandProfile(updatedBrand);
    if (discoveredAvatars.length > 0) {
      setAvatars(discoveredAvatars);
      setSelectedAvatar(discoveredAvatars[0]);
    }
    if (goToCampaigns) {
      setActiveTab('studio');
    }
  };

  // Plug Video Asset from Video Studio directly into Campaign Builder
  const handlePlugVideoIntoCampaign = (video: CampaignVideoAsset) => {
    setAttachedCampaignVideo(video);
    setStudioInitialFormat('short_video');
    setActiveTab('studio');
    showNotificationToast(
      'Video Plugged Into Campaign Builder',
      `"${video.title}" is now attached as your active campaign hero video.`
    );
  };

  // Navigation from Command Hub
  const handleNavigateToStudio = (mode: 'screenshot' | 'url' | 'brief' = 'screenshot') => {
    setStudioSourceMode(mode);
    setStudioInitialFormat(undefined);
    setActiveTab('studio');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled' || p.status === 'approved').length;
  const activeCampaignTitle = campaigns.find((c) => c.id === activeCampaignId)?.title;

  return (
    <div className={`min-h-screen flex flex-row ${isDark ? 'dark bg-[#0A0A0C] text-[#E5E5F0]' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Left Collapsible 4-Pillar Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        currentRole={userRole}
        onNewCampaignClick={handleCreateCampaign}
        brandName={brandProfile.name}
        scheduledCount={scheduledCount}
        campaignCount={campaigns.length}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 pl-16 lg:pl-0">
        
        {/* Minimal Contextual Studio Header */}
        <TopNav
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          currentRole={userRole}
          setCurrentRole={setUserRole}
          unreadCount={unreadCount}
          openNotifications={() => setIsNotificationDrawerOpen(true)}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onNewCampaignClick={handleCreateCampaign}
          brandName={brandProfile.name}
          brandArchetype={brandProfile.archetype}
          activeCampaignTitle={activeCampaignTitle}
        />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* Workspace Overview */}
          {activeTab === 'home' && (
            <HomeDashboard
              brandProfile={brandProfile}
              campaigns={campaigns}
              posts={posts}
              splitTests={splitTests}
              avatars={avatars}
              onNavigateToStudio={handleNavigateToStudio}
              onNavigateToTab={handleNavigateTab}
              onSelectAvatar={(av) => setSelectedAvatar(av)}
              onOpenCampaign={handleOpenCampaign}
              onCreateCampaign={handleCreateCampaign}
              onCompleteBrandSetup={handleCompleteBrandSetup}
              showNotificationToast={showNotificationToast}
            />
          )}

          {/* PILLAR 1: Brand Brain & Audience Demographics */}
          {activeTab === 'brand_avatar' && (
            <BrandAvatarStudio
              brandProfile={brandProfile}
              setBrandProfile={setBrandProfile}
              avatars={avatars}
              setAvatars={setAvatars}
              onSelectAvatarForCampaign={(av) => {
                setSelectedAvatar(av);
                setActiveTab('studio');
              }}
              onCompleteBrandSetup={handleCompleteBrandSetup}
              showNotificationToast={showNotificationToast}
              userRole={userRole}
            />
          )}

          {/* PILLAR 2: Campaigns (Projects + Guided Studio + AI/Recorded Video) */}
          {activeTab === 'studio' && (
            <ContentStudio
              brandProfile={brandProfile}
              avatars={avatars}
              setAvatars={setAvatars}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
              onSaveToQueue={handleSaveToQueue}
              onLaunchSplitTest={(exp) => {
                handleLaunchSplitTest(exp);
                setDistributionSubTab('ab_lab');
                setActiveTab('distribution');
              }}
              userRole={userRole}
              showNotificationToast={showNotificationToast}
              preloadedTheme={preloadedTheme}
              onClearPreloadedTheme={() => setPreloadedTheme(null)}
              initialSourceMode={studioSourceMode}
              initialFormat={studioInitialFormat}
              attachedVideo={attachedCampaignVideo}
              onAttachVideo={setAttachedCampaignVideo}
              campaigns={campaigns}
              activeCampaignId={activeCampaignId}
              onSelectCampaign={setActiveCampaignId}
              onCreateCampaign={handleCreateCampaign}
              onUpdateCampaignTitle={handleUpdateCampaignTitle}
            />
          )}

          {/* Standalone Video Studio (still accessible if linked directly) */}
          {activeTab === 'video_studio' && (
            <AdnetiksVideoStudio
              trendingSounds={trendingSounds}
              templates={videoTemplates}
              adMetrics={adMetrics}
              onSendScriptToQueue={handleSendScriptToQueue}
              onPlugIntoCampaign={handlePlugVideoIntoCampaign}
              userRole={userRole}
              showNotificationToast={showNotificationToast}
            />
          )}

          {/* PILLAR 3: Distribution (Unified Smart Calendar Queue + A/B Split Lab) */}
          {(activeTab === 'distribution' || activeTab === 'scheduler' || activeTab === 'split_lab') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F1F2A] pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">
                    Distribution &amp; Hook Experiments
                  </h2>
                  <p className="text-xs text-[#8B8BA8]">
                    Manage your automated multi-platform publishing queue and live A/B hook tests in one place.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#111116] p-1 rounded-xl border border-[#1F1F2A] self-start sm:self-auto">
                  <button
                    onClick={() => setDistributionSubTab('queue')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      distributionSubTab === 'queue'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-[#8B8BA8] hover:text-white'
                    }`}
                  >
                    Calendar &amp; Queue ({posts.length})
                  </button>
                  <button
                    onClick={() => setDistributionSubTab('ab_lab')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      distributionSubTab === 'ab_lab'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-[#8B8BA8] hover:text-white'
                    }`}
                  >
                    A/B Hook Lab ({splitTests.length})
                  </button>
                </div>
              </div>

              {distributionSubTab === 'queue' ? (
                <SmartScheduler
                  posts={posts}
                  setPosts={setPosts}
                  userRole={userRole}
                  showNotificationToast={showNotificationToast}
                />
              ) : (
                <SplitTestLab
                  splitTests={splitTests}
                  onDeclareWinner={handleDeclareWinner}
                  userRole={userRole}
                  showNotificationToast={showNotificationToast}
                />
              )}
            </div>
          )}

          {/* PILLAR 4: Signals & Inbox (Unified Growth Analytics + Fan Engagement) */}
          {(activeTab === 'signals' || activeTab === 'analytics' || activeTab === 'service_agents') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F1F2A] pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">
                    Analytics &amp; Engagement Inbox
                  </h2>
                  <p className="text-xs text-[#8B8BA8]">
                    Track real clicks, conversions &amp; trends, feed winners into your Brand Brain, and resolve fan/customer replies.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#111116] p-1 rounded-xl border border-[#1F1F2A] self-start sm:self-auto">
                  <button
                    onClick={() => setSignalsSubTab('analytics')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      signalsSubTab === 'analytics'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-[#8B8BA8] hover:text-white'
                    }`}
                  >
                    Analytics &amp; Trends
                  </button>
                  <button
                    onClick={() => setSignalsSubTab('inbox')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      signalsSubTab === 'inbox'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-[#8B8BA8] hover:text-white'
                    }`}
                  >
                    Fan &amp; DM Inbox ({mentions.length})
                  </button>
                </div>
              </div>

              {signalsSubTab === 'analytics' ? (
                <AnalyticsDashboard
                  posts={posts}
                  heatmapData={heatmapData}
                  competitors={competitors}
                  setCompetitors={setCompetitors}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  onSendToRemixStudio={handleSendToRemixStudio}
                  onDeployTrendingTheme={handleDeployTrendingTheme}
                  showNotificationToast={showNotificationToast}
                />
              ) : (
                <ServiceOrchestrator
                  mentions={mentions}
                  setMentions={setMentions}
                  onConvertUgcToPost={handleConvertUgcToPost}
                  userRole={userRole}
                  showNotificationToast={showNotificationToast}
                />
              )}
            </div>
          )}

          {/* AI Engines & Social Connectors */}
          {activeTab === 'integrations' && (
            <IntegrationsHub showNotificationToast={showNotificationToast} />
          )}

        </main>

        {/* Minimal Editorial Footer */}
        <footer className="border-t border-[#1F1F2A] bg-[#0A0A0C] py-5 px-4 sm:px-8 text-xs text-[#52526B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AdnetiksLogo size={18} />
              <span className="text-[#8B8BA8] font-bold tracking-wide">ADNETIKS Studio</span>
              <span>·</span>
              <span>Autonomous Social Content &amp; Delivery</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#52526B]">
              <span>Mode: <strong className="text-white capitalize">{userRole}</strong></span>
              <span>·</span>
              <span className="text-red-400 font-semibold font-mono">BE-Agnostic LLM Core</span>
              <span>·</span>
              <span>© 2026 ADNETIKS</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Slide-Over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        showNotificationToast={showNotificationToast}
      />

      {/* Stakeholder PDF / CSV Report Modal */}
      <StakeholderReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        brandProfile={brandProfile}
        posts={posts}
        splitTests={splitTests}
      />

      {/* Push Notification Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#111116] border border-[#2A2A38] p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0A0A0C] border border-[#1F1F2A] flex items-center justify-center shrink-0">
            <AdnetiksLogo size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="truncate">{toast.title}</span>
              <button
                onClick={() => setToast(null)}
                className="text-[#8B8BA8] hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-[#8B8BA8] leading-snug mt-0.5">
              {toast.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
