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

  // Active Hero Video Asset Plugged Into Campaign Builder (AI Generated, Recorded, or Uploaded)
  const [attachedCampaignVideo, setAttachedCampaignVideo] = useState<CampaignVideoAsset | null>(null);
  const [studioInitialFormat, setStudioInitialFormat] = useState<'social_post' | 'sponsored_ad' | 'short_video' | 'carousel' | undefined>(undefined);

  // In-App Toast System
  const [toast, setToast] = useState<{ id: string; title: string; message: string } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('adnetiks_user_role', userRole);
  }, [userRole]);

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

  // Declare Winner Handler
  const handleDeclareWinner = (experimentId: string, winnerKey: 'Variant A' | 'Variant B') => {
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

  return (
    <div className={`min-h-screen flex flex-row ${isDark ? 'dark bg-[#0A0A0C] text-[#E5E5F0]' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Left Collapsible Studio Dock / Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={userRole}
        onNewCampaignClick={() => handleNavigateToStudio('screenshot')}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 pl-16 lg:pl-0">
        
        {/* Top Header */}
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={userRole}
          setCurrentRole={setUserRole}
          unreadCount={unreadCount}
          openNotifications={() => setIsNotificationDrawerOpen(true)}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onNewCampaignClick={() => handleNavigateToStudio('screenshot')}
        />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* 1. Command Hub / Home Dashboard */}
          {activeTab === 'home' && (
            <HomeDashboard
              campaigns={campaigns}
              posts={posts}
              splitTests={splitTests}
              avatars={avatars}
              onNavigateToStudio={handleNavigateToStudio}
              onNavigateToTab={setActiveTab}
              onSelectAvatar={(av) => setSelectedAvatar(av)}
            />
          )}

          {/* 2. Creative Studio & Content Ingestion (Screenshot / URL / Brief) */}
          {activeTab === 'studio' && (
            <ContentStudio
              brandProfile={brandProfile}
              avatars={avatars}
              setAvatars={setAvatars}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
              onSaveToQueue={handleSaveToQueue}
              onLaunchSplitTest={handleLaunchSplitTest}
              userRole={userRole}
              showNotificationToast={showNotificationToast}
              preloadedTheme={preloadedTheme}
              onClearPreloadedTheme={() => setPreloadedTheme(null)}
              initialSourceMode={studioSourceMode}
              initialFormat={studioInitialFormat}
              attachedVideo={attachedCampaignVideo}
              onAttachVideo={setAttachedCampaignVideo}
            />
          )}

          {/* 3. Brand & Audience Avatar Intelligence */}
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
              userRole={userRole}
            />
          )}

          {/* 4. Autonomous Fan Service & Inbound DM / Mention Listening */}
          {activeTab === 'service_agents' && (
            <ServiceOrchestrator
              mentions={mentions}
              setMentions={setMentions}
              onConvertUgcToPost={handleConvertUgcToPost}
              userRole={userRole}
              showNotificationToast={showNotificationToast}
            />
          )}

          {/* 5. ADNETIKS Video Studio (Shorts, Reels, TikTok, X) */}
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

          {/* 6. A/B Split Testing Laboratory */}
          {activeTab === 'split_lab' && (
            <SplitTestLab
              splitTests={splitTests}
              onDeclareWinner={handleDeclareWinner}
              userRole={userRole}
              showNotificationToast={showNotificationToast}
            />
          )}

          {/* 7. Smart AI Scheduler & Automated Queue */}
          {activeTab === 'scheduler' && (
            <SmartScheduler
              posts={posts}
              setPosts={setPosts}
              userRole={userRole}
              showNotificationToast={showNotificationToast}
            />
          )}

          {/* 8. Growth & Performance Analytics */}
          {activeTab === 'analytics' && (
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
          )}

          {/* 9. Integrations & Connector Hub */}
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
