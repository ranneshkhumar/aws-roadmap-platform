'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/Layout/AppLayout';
import { RoadmapScreen } from '@/components/Roadmap/RoadmapScreen';
import { getAuthSession } from '@/lib/authHelper';
import { learningService } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { SkyBackground } from '@/components/Roadmap/SkyBackground';

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
      <div className="min-h-screen w-screen bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-white flex items-center justify-center relative overflow-hidden font-sans select-none">
        <SkyBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Outer pulsing ring */}
            <div className="absolute w-12 h-12 rounded-full bg-sky-500/10 animate-ping" />
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin stroke-[2.5]" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase animate-pulse font-heading">
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
