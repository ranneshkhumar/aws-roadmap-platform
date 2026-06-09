'use client';

import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div 
      className="min-h-screen w-screen text-slate-100 overflow-x-hidden font-sans relative flex flex-col"
      style={{
        background: 'linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 50%, #FFFFFF 100%)'
      }}
    >
      
      {/* Render core screen viewports */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative bg-transparent">
        {children}
      </main>
    </div>
  );
};
