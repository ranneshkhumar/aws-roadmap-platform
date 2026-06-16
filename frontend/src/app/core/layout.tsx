'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { getAuthSession } from '@/lib/authHelper';
import { authService } from '@/services/auth.service';
import { ToastContainer } from '@/components/Core/Toast';
import { cn } from '@/lib/utils';

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
      
      {/* ═══════════════ SIDEBAR NAVIGATION ═══════════════ */}
      <aside className="w-64 flex-shrink-0 h-full bg-white border-r border-slate-200 flex flex-col justify-between select-none">
        {!pathname.startsWith('/core/learners') && (
          <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4">
            {/* Logo / Header */}
            <div className="flex items-center gap-2.5 px-6 pb-6 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Icons.Shield className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 tracking-tight leading-tight uppercase font-heading">
                  Cloud Club
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase leading-none mt-0.5 font-heading">
                  CMS Portal
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="mt-6 flex-1 px-4 space-y-1">
              {userRole === 'core' && (
                <Link
                  href="/core/topics"
                  className={cn(
                    "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-heading",
                    pathname.startsWith('/core/topics')
                      ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icons.Layers className={cn(
                    "w-4 h-4",
                    pathname.startsWith('/core/topics') ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  Roadmap Builder
                </Link>
              )}

              <Link
                href="/core/learners"
                className={cn(
                  "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-heading",
                  pathname.startsWith('/core/learners')
                    ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icons.Users className={cn(
                  "w-4 h-4",
                  pathname.startsWith('/core/learners') ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )} />
                Learners Directory
              </Link>
            </nav>
          </div>
        )}

        {/* Sidebar Bottom Actions */}
        <div className={cn("p-4 border-t border-slate-100 space-y-1", pathname.startsWith('/core/learners') && "mt-auto border-t-0")}>
          {!pathname.startsWith('/core/learners') && userRole !== 'crew' && (
            <Link
              href="/learn"
              className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-heading"
            >
              <Icons.ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              Back to Learning Hub
            </Link>
          )}

          <button
            onClick={() => { authService.logout(); router.push('/login'); }}
            className="w-full group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-heading"
          >
            <Icons.LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT PANEL (Right) ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Page Content viewport */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
      
    </div>
  );
}

