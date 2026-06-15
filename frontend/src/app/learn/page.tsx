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
  Layers
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

  // Auth & Initial Fetch
  useEffect(() => {
    const session = getAuthSession();
    if (!session.isAuthenticated) {
      router.replace('/login');
      return;
    }

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

          <div className="flex flex-col items-center gap-4 bg-white/95 border border-slate-200/50 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-md rounded-3xl p-8 z-10 pointer-events-auto">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute w-12 h-12 rounded-full bg-sky-500/10 animate-ping" />
              {/* Inner glass circle containing spinner */}
              <div className="w-16 h-16 rounded-full bg-white/80 border border-slate-200/60 flex items-center justify-center shadow-md relative">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin stroke-[2.5]" />
              </div>
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
          <header className="bg-white/95 border border-slate-200/50 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-md w-full pointer-events-auto">
            {/* Left Side: Current Mission Info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Green circle with > icon (same action as Resume Learning) */}
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
              <div className="flex flex-col text-slate-800">
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

              <button
                onClick={handleExit}
                className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-500 rounded-2xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

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
            </div>
          </header>

          {/* TWO-COLUMN LAYOUT: Topic rail + Learning Guide */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Search + Topic Rail */}
            <div className="flex-[2] min-w-0">
              <div className="flex justify-end items-center pointer-events-auto">
                <div className="relative min-w-[240px] max-w-xs w-full">
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