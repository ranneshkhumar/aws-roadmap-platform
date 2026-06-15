'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { getAuthSession } from '@/lib/authHelper';
import { authService } from '@/services/auth.service';
import { ToastContainer } from '@/components/Core/Toast';

interface CoreLayoutProps {
  children: React.ReactNode;
}

export default function CoreLayout({ children }: CoreLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();

    if (!session.isAuthenticated || !session.role) {
      router.replace('/login');
      return;
    }

    setUserRole(session.role);

    // Core Protection rules
    if (session.role === 'core') {
      setLoading(false);
    } else if (session.role === 'crew') {
      // Crew can only access Learners directory (/core/learners)
      if (pathname.startsWith('/core/learners')) {
        setLoading(false);
      } else {
        router.replace('/core/learners');
      }
    } else {
      // Enthusiasts redirected out
      router.replace('/learn');
    }
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans items-center justify-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
            Verifying Core Clearance...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden select-none">
      <ToastContainer />
      
      {/* ═══════════════ PLACEHOLDER SIDEBAR (future dashboard integration) ═══════════════ */}
      <aside className="w-64 flex-shrink-0 h-full bg-white border-r border-slate-200">
        <div className="h-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider select-none">
            Dashboard Navigation
          </span>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT PANEL (Right) ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Navbar */}
        <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          
          {/* Navigation Tabs based on role - replaced with a neutral title */}
          <div className="flex items-center gap-6 h-full text-xs font-bold text-slate-800">
            <span className="text-sm font-extrabold tracking-tight text-slate-700 select-none">
              CMS Admin Hub
            </span>
          </div>

          {/* Right Side: Logout + Bell action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { authService.logout(); router.push('/login'); }}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <Icons.LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
            <button
              onClick={() => alert("Notifications are clear.")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-650 transition-colors"
            >
              <Icons.Bell className="w-4.5 h-4.5" />
            </button>
          </div>
        </nav>

        {/* Page Content viewport */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
      
    </div>
  );
}

