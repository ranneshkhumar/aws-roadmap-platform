'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  Search, 
  Lock, 
  Check, 
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

        <div className="max-w-6xl mx-auto px-6 pt-8 flex flex-col gap-8 relative z-10">
          
          {/* ROADMAP PROGRESS HEADER PANEL */}
          <header className="bg-white/95 border border-slate-200/50 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-md w-full pointer-events-auto">
            {/* Left Side: Current Mission Info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Green circle with > icon */}
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              </div>
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
                onClick={() => continueModule && router.push(`/learn/${continueModule.topicSlug}`)}
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

          {/* SEARCH BAR SUB-SECTION */}
          <div className="flex justify-end items-center mt-2 pointer-events-auto">
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

          {/* RESPONSIVE TOPIC DIALS GRID */}
          <main className="flex-1">
            {filteredTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-600">No matching topics found</h3>
                <p className="text-xs text-slate-400 mt-1">Try search with a different keyword</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 justify-items-center py-6 animate-fade-in">
                {filteredTopics.map((topic) => {
                  const status = getDialStatus(topic);
                  const isLocked = status === 'LOCKED';
                  
                  return (
                    <button
                      key={topic.id}
                      disabled={isLocked}
                      onClick={() => !isLocked && router.push(`/learn/${topic.slug}`)}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-full transition-all duration-300 select-none outline-none focus:outline-none",
                        "w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36",
                        isLocked ? "cursor-not-allowed opacity-75" : "cursor-pointer",
                        status === 'CURRENT' ? "hover:animate-slow-hover" : ""
                      )}
                    >
                      {/* 1. Outer Ring / 3D Base Plate */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-full transition-all duration-500",
                          "border bg-gradient-to-b shadow-md",
                          // Current: Emerald glow & pulse ring
                          status === 'CURRENT' && [
                            "border-emerald-300/80 bg-gradient-to-b from-emerald-50 to-slate-200/40",
                            "shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-2 ring-emerald-400/20"
                          ],
                          // Available: Blue accent ring
                          status === 'AVAILABLE' && [
                            "border-blue-300/70 bg-gradient-to-b from-blue-50/50 to-slate-200/40",
                            "shadow-[0_0_10px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/10"
                          ],
                          // Completed: Gold ring
                          status === 'COMPLETED' && [
                            "border-amber-300 bg-gradient-to-b from-amber-50 to-slate-200/40",
                            "shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/10"
                          ],
                          // Locked: Gray metal finish
                          status === 'LOCKED' && [
                            "border-slate-300 bg-slate-200 shadow-inner"
                          ]
                        )}
                      />

                      {/* 2. Recessed Socket (Inner Well) */}
                      <div
                        className={cn(
                          "absolute inset-2 rounded-full transition-all duration-500",
                          "shadow-[inset_0_4px_8px_rgba(15,23,42,0.06),inset_0_-2px_4px_rgba(255,255,255,0.7)]",
                          status === 'CURRENT' && "border border-emerald-100/50 bg-emerald-50/10",
                          status === 'AVAILABLE' && "border border-blue-50/50 bg-sky-50/5",
                          status === 'COMPLETED' && "border border-amber-100/50 bg-amber-50/5",
                          status === 'LOCKED' && "border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] bg-slate-100"
                        )}
                      />

                      {/* 3. Interactive Plunger (Center Cap) */}
                      <div
                        className={cn(
                          "absolute inset-4 rounded-full transition-all duration-500 flex flex-col items-center justify-center p-3 text-center",
                          "shadow-[0_6px_10px_rgba(15,23,42,0.1),0_1px_3px_rgba(15,23,42,0.06),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(15,23,42,0.06)]",
                          
                          // Press down animation on hover/active
                          !isLocked && (status === 'COMPLETED'
                            ? "bg-gradient-to-b from-amber-50/90 to-amber-100/40 text-slate-700 border border-amber-300/60 shadow-[inset_0_3px_5px_rgba(15,23,42,0.05)] scale-[0.96] hover:translate-y-0 hover:scale-[0.96]" // slightly depressed center caps do not pop out
                            : "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0.5 active:shadow-sm"
                          ),

                          status === 'CURRENT' && [
                            "bg-gradient-to-b from-emerald-50 to-white text-slate-800 border border-emerald-200",
                            "animate-cap-bob"
                          ],
                          status === 'AVAILABLE' && "bg-gradient-to-b from-sky-50 to-white text-slate-800 border border-blue-200",
                          status === 'LOCKED' && "bg-slate-200/90 text-slate-400 border border-slate-300 shadow-none hover:translate-y-0 hover:scale-100"
                        )}
                      >
                        {/* Topic Name */}
                        <span
                          className={cn(
                            "text-[10px] md:text-xs font-bold leading-tight line-clamp-3 select-none tracking-tight font-heading px-1",
                            status === 'CURRENT' && "text-emerald-700",
                            status === 'AVAILABLE' && "text-blue-700",
                            status === 'COMPLETED' && "text-amber-800",
                            status === 'LOCKED' && "text-slate-400"
                          )}
                        >
                          {topic.name}
                        </span>

                        {/* Status Icon/Overlay */}
                        <div className="absolute bottom-2">
                          {status === 'COMPLETED' && (
                            <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3.5]" />
                          )}
                          {status === 'LOCKED' && (
                            <Lock className="w-3 h-3 text-slate-400" />
                          )}
                          {status === 'CURRENT' && (
                            <div className="relative flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute" />
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4. Chain Overlay for Locked Dial */}
                      {status === 'LOCKED' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-full opacity-35">
                          <svg className="absolute inset-0 w-full h-full text-slate-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                            {/* Crossed diagonal dashed line chain overlay representation */}
                            <line x1="12" y1="12" x2="88" y2="88" strokeDasharray="5 3" />
                            <line x1="88" y1="12" x2="12" y2="88" strokeDasharray="5 3" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </main>

        </div>
      </div>
    </AppLayout>
  );
}