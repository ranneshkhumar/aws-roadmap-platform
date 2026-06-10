'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoreLayoutProps {
  children: React.ReactNode;
}

const topTabs = [
  { label: 'Roadmap', href: '/core/roadmaps' },
];

export default function CoreLayout({ children }: CoreLayoutProps) {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden select-none">
      
      {/* ═══════════════ PERMANENT LIGHT SIDEBAR (Left) ═══════════════ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 h-full">
        {/* Branding Logo */}
        <div className="px-6 py-4.5 flex items-center gap-2.5 border-b border-slate-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-650 text-white flex items-center justify-center">
            <Icons.Cloud className="w-4.5 h-4.5 fill-current" />
          </div>
          <span className="text-[12px] font-black tracking-wider uppercase text-slate-900 font-heading">
            AWS Cloud Club
          </span>
        </div>

        {/* Empty Sidebar Content Spacer */}
        <div className="flex-1 bg-slate-50/10" />

        {/* Bottom Panel Actions (CORE Credentials & Exit) */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5 flex-shrink-0">
          
          {/* CORE Profile (coming below navbar) */}
          <div className="flex items-center gap-2.5 px-3 py-2 border border-slate-150 bg-slate-50/50 rounded-xl select-text">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center font-black text-xs select-none flex-shrink-0">
              CO
            </div>
            <div className="text-[10px] text-left">
              <p className="font-extrabold text-slate-800 leading-tight">CORE</p>
              <p className="text-slate-450 font-bold mt-0.5">AWS Cloud Club Staff</p>
            </div>
          </div>

          {/* Exit Link */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <Icons.LogOut className="w-4 h-4 text-rose-500" />
            <span>Exit to Student view</span>
          </Link>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT PANEL (Right) ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Navbar */}
        <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          
          {/* Left Side: Navigation Tabs */}
          <div className="flex items-center gap-6 h-full text-xs font-bold">
            {topTabs.map((tab) => {
              const active = isTabActive(tab.href);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "transition-all duration-150 h-full flex items-center px-1 border-b-2",
                    active
                      ? "text-indigo-650 font-extrabold border-indigo-600"
                      : "text-slate-400 border-transparent hover:text-slate-700"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side: Bell notification */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
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
