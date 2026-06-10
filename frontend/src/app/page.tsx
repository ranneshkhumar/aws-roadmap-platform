'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const role = localStorage.getItem('role');

    if (!isAuth || !role) {
      router.replace('/login');
    } else {
      if (role === 'core') {
        router.replace('/core/roadmaps');
      } else {
        router.replace('/roadmap');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen w-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
          Redirecting to learning track...
        </span>
      </div>
    </div>
  );
}
