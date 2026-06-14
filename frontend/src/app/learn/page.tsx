'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { learningService, TopicSummary } from '@/services/api';
import { getAuthSession } from '@/lib/authHelper';
import { AppLayout } from '@/components/Layout/AppLayout';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  NOT_STARTED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function LearnPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await learningService.getTopicList();
        if (!active) return;
        setTopics(data);
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

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen w-screen bg-gradient-to-b from-sky-50 via-sky-100 to-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">
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
        <div className="min-h-screen w-screen bg-gradient-to-b from-sky-50 via-sky-100 to-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Icons.AlertCircle className="w-10 h-10 text-rose-400" />
            <span className="text-sm text-slate-600 font-medium">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors"
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
      <div className="min-h-screen w-screen bg-gradient-to-b from-sky-50 via-sky-100 to-white font-sans select-none relative overflow-hidden">
        {/* Cloud blobs */}
        <div className="absolute top-[8%] left-[10%] w-80 h-80 bg-sky-200/60 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[25%] right-[5%] w-64 h-64 bg-white/80 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[15%] left-[20%] w-72 h-72 bg-sky-100/70 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[15%] w-56 h-56 bg-white/60 rounded-full blur-[90px] pointer-events-none" />

        {/* Floating island decoration */}
        <div className="absolute top-[12%] right-[12%] pointer-events-none opacity-60">
          <div className="relative">
            <div className="w-20 h-6 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full shadow-lg" />
            <div className="absolute -top-3 left-3 w-4 h-6 bg-emerald-500 rounded-full" />
            <div className="absolute -top-5 left-7 w-3 h-5 bg-emerald-400 rounded-full" />
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-3 bg-gradient-to-b from-amber-600/30 to-amber-700/10 rounded-full blur-sm" />
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-12">
            <span className="text-[10px] font-black tracking-widest text-sky-500 uppercase font-heading block mb-2">
              AWS Cloud Club
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Choose Your Learning Track
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-lg">
              Select a topic to begin your cloud journey. Each track contains curated modules with slides, quizzes, and hands-on content.
            </p>
          </div>

          {/* Topic cards */}
          {topics.length === 0 ? (
            <div className="text-center py-20">
              <Icons.BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-sm font-medium">No learning topics available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {topics.map((topic) => (
                <button
                  key={topic.slug}
                  disabled={!topic.unlocked}
                  onClick={() => router.push(`/learn/${topic.slug}`)}
                  className={cn(
                    "w-full text-left p-6 border rounded-2xl transition-all duration-300",
                    topic.unlocked
                      ? "bg-white/70 backdrop-blur-md border-white/60 shadow-sm shadow-sky-200/50 hover:border-sky-300 hover:shadow-md hover:shadow-sky-200/60 hover:-translate-y-0.5 group cursor-pointer"
                      : "bg-white/30 backdrop-blur-sm border-white/40 opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                          topic.unlocked
                            ? "bg-gradient-to-br from-sky-400 to-sky-500 shadow-lg shadow-sky-300/30"
                            : "bg-slate-200 border border-slate-300"
                        )}>
                          <Icons.Cloud className="w-5 h-5 text-white fill-current" />
                        </div>
                        <div>
                          <h2 className={cn(
                            "text-lg font-extrabold tracking-tight font-heading transition-colors",
                            topic.unlocked ? "text-slate-900 group-hover:text-sky-600" : "text-slate-400"
                          )}>
                            {topic.name}
                          </h2>
                        </div>
                        {topic.unlocked ? (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${statusColors[topic.status]}`}>
                            {statusLabels[topic.status]}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-[9px] font-bold">
                            <Icons.Lock className="w-3 h-3" />
                            Complete previous topic to unlock
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed mt-1 ml-[52px]",
                        topic.unlocked ? "text-slate-600" : "text-slate-400"
                      )}>
                        {topic.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 ml-[52px] text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Icons.Layers className="w-3 h-3" />
                          {topic.totalModules} Modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Icons.CheckCircle2 className="w-3 h-3" />
                          {topic.completedModules} Completed
                        </span>
                        {topic.unlocked && topic.status === 'IN_PROGRESS' && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Icons.Zap className="w-3 h-3" />
                            Continue Learning
                          </span>
                        )}
                        {topic.unlocked && topic.status === 'NOT_STARTED' && (
                          <span className="flex items-center gap-1 text-sky-500">
                            <Icons.ArrowRight className="w-3 h-3" />
                            Start Learning
                          </span>
                        )}
                        {topic.unlocked && topic.status === 'COMPLETED' && (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <Icons.Trophy className="w-3 h-3" />
                            Track Completed
                          </span>
                        )}
                      </div>
                    </div>
                    <Icons.ChevronRight className={cn(
                      "w-5 h-5 flex-shrink-0 mt-2 transition-colors",
                      topic.unlocked
                        ? "text-slate-400 group-hover:text-sky-500"
                        : "text-slate-300"
                    )} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
