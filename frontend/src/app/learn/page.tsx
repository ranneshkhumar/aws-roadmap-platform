'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  Search, 
  BookOpen, 
  AlertCircle, 
  X,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Zap,
  Layers,
  Settings
} from 'lucide-react';
import { learningService, progressService, TopicSummary } from '@/services/api';
import { getAuthSession } from '@/lib/authHelper';
import { authService } from '@/services/auth.service';
import { AppLayout } from '@/components/Layout/AppLayout';
import { SkyBackground } from '@/components/Roadmap/SkyBackground';
import { TopicRailItem } from '@/components/Learn/TopicRailItem';
import { LearningGuidePanel } from '@/components/Learn/LearningGuidePanel';
import { cn } from '@/lib/utils';

export default function LearnPage() {
  const router = useRouter();
  
  // State variables
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [continueModule, setContinueModule] = useState<any | null>(null);
  const [userXP, setUserXP] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Exit handler
  const handleExit = () => {
    authService.logout();
    router.push('/login');
  };

  // Resume navigation handler (shared between green circle and Resume button)
  const handleResume = () => {
    if (continueModule) {
      router.push(`/learn/${continueModule.topicSlug}`);
    }
  };

  const handleReviewTopics = () => {
    const element = document.getElementById('topic-rail-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auth & Initial Fetch
  useEffect(() => {
    const session = getAuthSession();
    if (!session.isAuthenticated) {
      router.replace('/login');
      return;
    }
    setUserRole(session.role);

    let active = true;
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const [data, continueData, progressData] = await Promise.all([
          learningService.getTopicList(),
          learningService.getContinueModule(),
          progressService.getMyProgress(),
        ]);
        if (!active) return;
        setTopics(data);
        setContinueModule(continueData.module);
        setUserXP(progressData.currentXP);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load topics:', err);
        setError('Failed to load learning topics. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTopics();
    return () => { active = false; };
  }, [router]);

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase();
    return topics.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.description && t.description.toLowerCase().includes(q))
    );
  }, [topics, searchQuery]);

  // Find matching topic progress for continue module
  const continueTopicProgress = useMemo(() => {
    if (!continueModule || topics.length === 0) return '0 / 0 Modules';
    const topic = topics.find((t) => t.slug === continueModule.topicSlug);
    if (!topic) return '0 / 0 Modules';
    return `${topic.completedModules} / ${topic.totalModules} Modules`;
  }, [continueModule, topics]);

  // Map display level for continue module
  const continueDisplayLevel = useMemo(() => {
    if (!continueModule) return 'Beginner';
    const mapping: Record<string, string> = {
      BEGINNER: 'Beginner',
      INTERMEDIATE: 'Intermediate',
      ADVANCED: 'Advanced',
    };
    return mapping[continueModule.level] || 'Beginner';
  }, [continueModule]);

  // Fallback reward calculation
  const continueXPReward = useMemo(() => {
    if (!continueModule) return 50;
    if (continueModule.level === 'ADVANCED') return 100;
    if (continueModule.level === 'INTERMEDIATE') return 75;
    return 50;
  }, [continueModule]);

  // Completion calculations
  const topicsCompletedCount = useMemo(() => {
    return topics.filter(t => t.completedModules > 0 && t.completedModules === t.totalModules).length;
  }, [topics]);

  const modulesCompletedCount = useMemo(() => {
    return topics.reduce((sum, t) => sum + (t.completedModules || 0), 0);
  }, [topics]);

  const isPlatformCompleted = useMemo(() => {
    if (topics.length === 0) return false;
    const totalCompleted = topics.reduce((sum, t) => sum + (t.completedModules || 0), 0);
    const totalModules = topics.reduce((sum, t) => sum + (t.totalModules || 0), 0);
    return (totalModules > 0 && totalCompleted === totalModules) || !continueModule;
  }, [topics, continueModule]);

  // Check dial states
  const getDialStatus = (topic: TopicSummary) => {
    const isLocked = !topic.unlocked;
    const isCompleted = topic.status === 'COMPLETED';
    const isCurrent = topic.unlocked && !isCompleted;
    
    if (isLocked) return 'LOCKED';
    if (isCompleted) return 'COMPLETED';
    if (isCurrent) return 'CURRENT';
    return 'AVAILABLE';
  };

  // Main UI Load/Error views
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen w-screen bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-white flex items-center justify-center relative overflow-hidden font-sans select-none">
          {/* Cloud Background from Roadmaps */}
          <SkyBackground />

          <div className="flex flex-col items-center gap-4 z-10 pointer-events-auto">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute w-12 h-12 rounded-full bg-sky-500/10 animate-ping" />
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin stroke-[2.5]" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase animate-pulse font-heading">
              Loading Learning Tracks...
            </span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen w-screen bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-white flex items-center justify-center relative overflow-hidden font-sans select-none">
          {/* Cloud Background from Roadmaps */}
          <SkyBackground />

          <div className="flex flex-col items-center gap-4 bg-white/95 border border-slate-200/50 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-md rounded-3xl p-8 z-10 pointer-events-auto text-center max-w-md mx-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center shadow-md">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <span className="text-xs text-slate-600 font-bold font-heading">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 font-heading uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen w-screen bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-white font-sans select-none relative overflow-y-auto pb-12">
        {/* Cloud Background from Roadmaps */}
        <SkyBackground />

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col gap-8 relative z-10">
          
          {/* ROADMAP PROGRESS HEADER PANEL */}
          <header className="flex flex-col md:flex-row items-center justify-between gap-4 w-full pointer-events-auto py-2">
            {/* Left Side: Current Mission Info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              {isPlatformCompleted ? (
                <div
                  className="w-12 h-12 rounded-full bg-white/95 border border-slate-200/80 flex items-center justify-center shadow-lg flex-shrink-0 animate-bounce"
                >
                  <svg viewBox="0 0 304 182" className="w-8 h-auto" fill="none">
                    <path
                      fill="#252F3E"
                      d="M86.4,66.4c0,3.7,0.4,6.7,1.1,8.9c0.8,2.2,1.8,4.6,3.2,7.2c0.5,0.8,0.7,1.6,0.7,2.3c0,1-0.6,2-1.9,3l-6.3,4.2c-0.9,0.6-1.8,0.9-2.6,0.9c-1,0-2-0.5-3-1.4C76.2,90,75,88.4,74,86.8c-1-1.7-2-3.6-3.1-5.9c-7.8,9.2-17.6,13.8-29.4,13.8c-8.4,0-15.1-2.4-20-7.2c-4.9-4.8-7.4-11.2-7.4-19.2c0-8.5,3-15.4,9.1-20.6c6.1-5.2,14.2-7.8,24.5-7.8c3.4,0,6.9,0.3,10.6,0.8c3.7,0.5,7.5,1.3,11.5,2.2v-7.3c0-7.6-1.6-12.9-4.7-16c-3.2-3.1-8.6-4.6-16.3-4.6c-3.5,0-7.1,0.4-10.8,1.3c-3.7,0.9-7.3,2-10.8,3.4c-1.6,0.7-2.8,1.1-3.5,1.3c-0.7,0.2-1.2,0.3-1.6,0.3c-1.4,0-2.1-1-2.1-3.1v-4.9c0-1.6,0.2-2.8,0.7-3.5c0.5-0.7,1.4-1.4,2.8-2.1c3.5-1.8,7.7-3.3,12.6-4.5c4.9-1.3,10.1-1.9,15.6-1.9c11.9,0,20.6,2.7,26.2,8.1c5.5,5.4,8.3,13.6,8.3,24.6V66.4z M45.8,81.6c3.3,0,6.7-0.6,10.3-1.8c3.6-1.2,6.8-3.4,9.5-6.4c1.6-1.9,2.8-4,3.4-6.4c0.6-2.4,1-5.3,1-8.7v-4.2c-2.9-0.7-6-1.3-9.2-1.7c-3.2-0.4-6.3-0.6-9.4-0.6c-6.7,0-11.6,1.3-14.9,4c-3.3,2.7-4.9,6.5-4.9,11.5c0,4.7,1.2,8.2,3.7,10.6C37.7,80.4,41.2,81.6,45.8,81.6z M126.1,92.4c-1.8,0-3-0.3-3.8-1c-0.8-0.6-1.5-2-2.1-3.9L96.7,10.2c-0.6-2-0.9-3.3-0.9-4c0-1.6,0.8-2.5,2.4-2.5h9.8c1.9,0,3.2,0.3,3.9,1c0.8,0.6,1.4,2,2,3.9l16.8,66.2l15.6-66.2c0.5-2,1.1-3.3,1.9-3.9c0.8-0.6,2.2-1,4-1h8c1.9,0,3.2,0.3,4,1c0.8,0.6,1.5,2,1.9,3.9l15.8,67l17.3-67c0.6-2,1.3-3.3,2-3.9c0.8-0.6,2.1-1,3.9-1h9.3c1.6,0,2.5,0.8,2.5,2.5c0,0.5-0.1,1-0.2,1.6c-0.1,0.6-0.3,1.4-0.7,2.5l-24.1,77.3c-0.6,2-1.3,3.3-2.1,3.9c-0.8,0.6-2.1,1-3.8,1h-8.6c-1.9,0-3.2-0.3-4-1c-0.8-0.7-1.5-2-1.9-4L156,23l-15.4,64.4c-0.5,2-1.1,3.3-1.9,4c-0.8,0.7-2.2,1-4,1H126.1z M254.6,95.1c-5.2,0-10.4-0.6-15.4-1.8c-5-1.2-8.9-2.5-11.5-4c-1.6-0.9-2.7-1.9-3.1-2.8c-0.4-0.9-0.6-1.9-0.6-2.8v-5.1c0-2.1,0.8-3.1,2.3-3.1c0.6,0,1.2,0.1,1.8,0.3c0.6,0.2,1.5,0.6,2.5,1c3.4,1.5,7.1,2.7,11,3.5c4,0.8,7.9,1.2,11.9,1.2c6.3,0,11.2-1.1,14.6-3.3c3.4-2.2,5.2-5.4,5.2-9.5c0-2.8-0.9-5.1-2.7-7c-1.8-1.9-5.2-3.6-10.1-5.2L246,52c-7.3-2.3-12.7-5.7-16-10.2c-3.3-4.4-5-9.3-5-14.5c0-4.2,0.9-7.9,2.7-11.1c1.8-3.2,4.2-6,7.2-8.2c3-2.3,6.4-4,10.4-5.2c4-1.2,8.2-1.7,12.6-1.7c2.2,0,4.5,0.1,6.7,0.4c2.3,0.3,4.4,0.7,6.5,1.1c2,0.5,3.9,1,5.7,1.6c1.8,0.6,3.2,1.2,4.2,1.8c1.4,0.8,2.4,1.6,3,2.5c0.6,0.8,0.9,1.9,0.9,3.3v4.7c0,2.1-0.8,3.2-2.3,3.2c-0.8,0-2.1-0.4-3.8-1.2c-5.7-2.6-12.1-3.9-19.2-3.9c-5.7,0-10.2,0.9-13.3,2.8c-3.1,1.9-4.7,4.8-4.7,8.9c0,2.8,1,5.2,3,7.1c2,1.9,5.7,3.8,11,5.5l14.2,4.5c7.2,2.3,12.4,5.5,15.5,9.6c3.1,4.1,4.6,8.8,4.6,14c0,4.3-0.9,8.2-2.6,11.6c-1.8,3.4-4.2,6.4-7.3,8.8c-3.1,2.5-6.8,4.3-11.1,5.6C264.4,94.4,259.7,95.1,254.6,95.1z"
                    />
                    <path
                      fill="#FF9900"
                      d="M273.5,143.7c-32.9,24.3-80.7,37.2-121.8,37.2c-57.6,0-109.5-21.3-148.7-56.7c-3.1-2.8-0.3-6.6,3.4-4.4c42.4,24.6,94.7,39.5,148.8,39.5c36.5,0,76.6-7.6,113.5-23.2C274.2,133.6,278.9,139.7,273.5,143.7z"
                    />
                    <path
                      fill="#FF9900"
                      d="M287.2,128.1c-4.2-5.4-27.8-2.6-38.5-1.3c-3.2,0.4-3.7-2.4-0.8-4.5c18.8-13.2,49.7-9.4,53.3-5c3.6,4.5-1,35.4-18.6,50.2c-2.7,2.3-5.3,1.1-4.1-1.9C282.5,155.7,291.4,133.4,287.2,128.1z"
                    />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={handleResume}
                  disabled={!continueModule}
                  aria-label="Resume learning"
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 flex-shrink-0",
                    continueModule
                      ? "bg-emerald-500 shadow-emerald-500/20 cursor-pointer hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                      : "bg-slate-300 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </button>
              )}
              <div className="flex flex-col text-slate-800">
                {isPlatformCompleted ? (
                  <>
                    <span className="text-base font-black text-slate-900 block leading-tight font-heading mt-0.5">
                      🎉 AWS Journey Complete
                    </span>
                    <span className="text-xs font-semibold text-slate-500 mt-1 block">
                      Congratulations! You've completed every available topic.
                    </span>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-extrabold">
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50/80 border border-emerald-100/30 px-2.5 py-0.5 rounded-md">
                        {topicsCompletedCount} {topicsCompletedCount === 1 ? 'Topic' : 'Topics'} Completed
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1 text-cyan-600 bg-cyan-50/80 border border-cyan-100/30 px-2.5 py-0.5 rounded-md">
                        {modulesCompletedCount} {modulesCompletedCount === 1 ? 'Module' : 'Modules'} Completed
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-heading">
                      CONTINUE YOUR JOURNEY
                    </span>
                    <span className="text-base font-black text-slate-900 block leading-tight font-heading mt-0.5 animate-pulse">
                      {continueModule ? `Current Mission: ${continueModule.name}` : 'Ready to start your AWS journey'}
                    </span>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-extrabold text-slate-500">
                      <span className="flex items-center gap-1 text-cyan-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {continueModule ? continueTopicProgress : 'Select a topic to start'}
                      </span>
                      {continueModule?.topicName && (
                        <>
                          <span className="text-slate-300">|</span>
                          <Link
                            href={`/learn/${continueModule.topicSlug}`}
                            className="text-indigo-650 font-bold bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-0.5 rounded-md text-[10px] tracking-tight cursor-pointer transition-all hover:scale-105 inline-flex items-center gap-1"
                            title="Go to topic roadmap"
                          >
                            Topic: {continueModule.topicName}
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Side: Reward & Resume */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {/* Total XP Badge */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-600 fill-current" />
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block font-heading">
                    TOTAL SCORE
                  </span>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    {userXP} XP
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block font-heading">
                    MISSION REWARD
                  </span>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    +{continueModule ? continueXPReward : 50} XP
                  </span>
                </div>
              </div>

              {/* Level badge */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block font-heading">
                    LEVEL
                  </span>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    {continueDisplayLevel}
                  </span>
                </div>
              </div>

              {(userRole === 'core' || userRole === 'crew') && (
                <Link
                  href={userRole === 'core' ? '/core/topics' : '/core/learners'}
                  className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-600 rounded-2xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
                  title="Admin Portal"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={handleExit}
                className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-500 rounded-2xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {isPlatformCompleted ? null : (
                <button
                  disabled={!continueModule}
                  onClick={handleResume}
                  className={cn(
                    "font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 tracking-wider font-heading cursor-pointer text-white",
                    continueModule 
                      ? "bg-[#00cba9] hover:bg-[#00bda0]" 
                      : "bg-slate-300 shadow-none cursor-not-allowed"
                  )}
                >
                  Resume Learning
                </button>
              )}
            </div>
          </header>

          {/* TWO-COLUMN LAYOUT: Topic rail + Learning Guide */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Search + Topic Rail */}
            <div className="flex-[2] min-w-0" id="topic-rail-section">
              <div className="flex items-center pointer-events-auto">
                <div className="relative min-w-[240px] w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Topics"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-white/90 border border-slate-200/80 rounded-full text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 shadow-sm transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <main className="flex flex-col items-center">
                {filteredTopics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="text-sm font-bold text-slate-600">No matching topics found</h3>
                    <p className="text-xs text-slate-400 mt-1">Try search with a different keyword</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full px-4 py-6 animate-fade-in">
                    {filteredTopics.map((topic) => {
                      const status = getDialStatus(topic);
                      return (
                        <TopicRailItem
                          key={topic.id}
                          topic={topic}
                          status={status}
                        />
                      );
                    })}
                  </div>
                )}
              </main>
            </div>

            {/* Right Column: Learning Guide Panel */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
              <div className="lg:sticky lg:top-8">
                <LearningGuidePanel />
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}