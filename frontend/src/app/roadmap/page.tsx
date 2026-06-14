'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoadmapRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/learn');
  }, [router]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-white/70 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-white/60 rounded-full blur-[90px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">
          Loading Roadmap...
        </span>
      </div>
    </div>
  );
}
