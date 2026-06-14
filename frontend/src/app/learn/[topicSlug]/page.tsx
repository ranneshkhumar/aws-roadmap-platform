'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/Layout/AppLayout';
import { RoadmapScreen } from '@/components/Roadmap/RoadmapScreen';
import { getAuthSession } from '@/lib/authHelper';
import { learningService } from '@/services/api';

export default function TopicRoadmapPage() {
  const router = useRouter();
  const params = useParams();
  const topicSlug = params.topicSlug as string;
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const session = getAuthSession();
    if (!session.isAuthenticated) {
      router.replace('/login');
      return;
    }

    let active = true;
    const checkAccess = async () => {
      try {
        const topics = await learningService.getTopicList();
        if (!active) return;
        const topic = topics.find((t) => t.slug === topicSlug);
        if (topic && !topic.unlocked) {
          router.replace('/learn');
          return;
        }
        setLoading(false);
      } catch {
        if (!active) return;
        setLoading(false);
      }
    };

    checkAccess();
    return () => { active = false; };
  }, [router, topicSlug]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-white/70 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-white/60 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-sky-200/40 rounded-full blur-[70px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">
            Preparing Your Journey...
          </span>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <RoadmapScreen topicSlug={topicSlug} />
    </AppLayout>
  );
}
