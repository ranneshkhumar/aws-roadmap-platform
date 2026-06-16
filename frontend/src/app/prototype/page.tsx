'use client';

import React, { useState } from 'react';
import { SkyBackground } from '@/components/Roadmap/SkyBackground';

// TypeScript Interfaces for Strict Typing
interface Module {
  name: string;
  status: string; // 'completed' | 'current' | 'locked'
}

interface CurrentTopic {
  id: number;
  title: string;
  module: string;
  modulesCompleted: number;
  modulesTotal: number;
  estimatedTime: string;
  progressPercent: number;
  modules: Module[];
}

interface UpcomingTopic {
  id: number;
  title: string;
  modules: number;
  estimatedTime: string;
}

interface UserStats {
  totalXP: number;
  level: string;
}

interface MockData {
  currentTopic: CurrentTopic;
  completedCount: number;
  totalTopics: number;
  upcomingTopics: UpcomingTopic[];
  remainingCount: number;
  userStats: UserStats;
}

// Hardcoded Mock Data (Strictly Typed)
const mockData: MockData = {
  currentTopic: {
    id: 12,
    title: "Cloud Fundamentals",
    module: "MOD 3",
    modulesCompleted: 2,
    modulesTotal: 3,
    estimatedTime: "~45 min",
    progressPercent: 67,
    modules: [
      { name: "Intro", status: "completed" },
      { name: "Core Concepts", status: "completed" },
      { name: "Labs", status: "current" },
    ],
  },
  completedCount: 11,
  totalTopics: 47,
  upcomingTopics: [
    { id: 13, title: "Lambda Functions", modules: 4, estimatedTime: "~30 min" },
    { id: 14, title: "IAM & Permissions", modules: 5, estimatedTime: "~60 min" },
    { id: 15, title: "S3 Storage Basics", modules: 3, estimatedTime: "~45 min" },
    { id: 16, title: "EC2 Compute", modules: 6, estimatedTime: "~50 min" },
  ],
  remainingCount: 34,
  userStats: {
    totalXP: 150,
    level: "Advanced",
  },
};

export default function PrototypePage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#bae6fd] via-[#e0f2fe] to-white font-sans text-slate-800 relative overflow-x-hidden flex flex-col">
      
      {/* Immersive animated sky background component */}
      <SkyBackground />

      {/* ZONE 1 — HEADER BAR (Sticky, 64px) */}
      <header className="sticky top-0 z-50 h-16 w-full bg-white/75 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-center md:justify-between select-none shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        
        {/* Desktop Header Layout */}
        <div className="hidden md:flex items-center justify-between w-full h-full">
          {/* Left: Back Link & Module Title */}
          <div className="flex items-center gap-3">
            <a href="/learn" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center p-1.5 hover:bg-slate-100 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none">Learning Path</span>
              <span className="text-xs font-semibold text-slate-900 mt-1 leading-none">
                {mockData.currentTopic.module} · {mockData.currentTopic.title}
              </span>
            </div>
          </div>

          {/* Center: Global Progress */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-650 whitespace-nowrap">
              Topic {mockData.currentTopic.id} of {mockData.totalTopics}
            </span>
            <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00A3BF] rounded-full" 
                style={{ width: `${(mockData.currentTopic.id / mockData.totalTopics) * 100}%` }} 
              />
            </div>
          </div>

          {/* Right: XP, Level & CTA */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-[#00A3BF] flex items-center gap-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
              <span>{mockData.userStats.totalXP} XP</span>
              <svg className="w-3.5 h-3.5 fill-current text-amber-500" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
              {mockData.userStats.level}
            </div>
            <button className="bg-[#00A3BF] hover:bg-[#008ba3] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer">
              Resume Learning
            </button>
          </div>
        </div>

        {/* Mobile Header Layout */}
        <div className="flex md:hidden flex-col justify-center h-full gap-1">
          {/* Row 1 */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
              <a href="/learn" className="text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <span className="text-xs font-semibold text-slate-900 truncate">
                {mockData.currentTopic.module} · {mockData.currentTopic.title}
              </span>
            </div>
            <button className="bg-[#00A3BF] hover:bg-[#008ba3] text-white px-3 py-1 rounded-xl text-[11px] font-semibold transition-all">
              Resume
            </button>
          </div>
          {/* Row 2 */}
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">
              Topic {mockData.currentTopic.id} of {mockData.totalTopics}
            </span>
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00A3BF] rounded-full" 
                style={{ width: `${(mockData.currentTopic.id / mockData.totalTopics) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT — FLEX ROW */}
      <div className="flex-1 w-full flex flex-row relative z-10">
        
        {/* Left Spacer */}
        <div className="flex-1 hidden xl:block bg-transparent" />

        {/* ZONE 2 — MAIN CONTENT COLUMN (max-width 680px) */}
        <div className="w-full max-w-[680px] px-4 md:px-6 py-8 flex flex-col gap-6">
          
          {/* SECTION A — COMPLETED SUMMARY ROW */}
          <div className="flex items-center justify-between py-2 text-sm select-none">
            <span className="font-semibold text-[#1EC981] flex items-center gap-1.5">
              <span className="text-sm font-bold">✓</span> {mockData.completedCount} topics completed
            </span>
            <span className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer transition-colors underline decoration-dotted underline-offset-4">
              [View history]
            </span>
          </div>

          <div className="h-[1px] w-full bg-slate-200/80" />

          {/* SECTION B — CURRENT TOPIC CARD (Expanded) */}
          <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#00A3BF] rounded-xl p-5 md:p-6 flex flex-col gap-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] select-none">
            
            {/* Top row with badges and title + Cloud Illustration */}
            <div className="flex items-start justify-between gap-6">
              
              {/* Left Details */}
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-[#00A3BF]/10 text-[#00A3BF] border border-[#00A3BF]/20 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3">
                  Current
                </span>
                
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight leading-tight">
                  {mockData.currentTopic.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 font-normal">
                  <span>{mockData.currentTopic.modulesCompleted} / {mockData.currentTopic.modulesTotal} Modules</span>
                  <span className="text-slate-350 font-semibold">•</span>
                  <span>{mockData.currentTopic.estimatedTime}</span>
                  <span className="text-slate-350 font-semibold">•</span>
                  <span className="text-[#00A3BF] font-semibold">{mockData.currentTopic.module}</span>
                </div>

                {/* Progress bar and numeric percentage */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00A3BF] rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${mockData.currentTopic.progressPercent}%` }} 
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#00A3BF] leading-none">
                    {mockData.currentTopic.progressPercent}%
                  </span>
                </div>
              </div>

              {/* Right Side: Cloud Progress Illustration */}
              <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200/60 rounded-xl p-2 relative overflow-hidden">
                <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-20 md:h-20 text-slate-200 select-none">
                  <defs>
                    <clipPath id="cloud-clip-illust">
                      <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
                    </clipPath>
                  </defs>
                  
                  {/* Unfilled background cloud shadow */}
                  <path 
                    d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" 
                    fill="#E2E8F0" 
                  />
                  
                  {/* Filled cloud bottom-up using clipPath */}
                  <g clipPath="url(#cloud-clip-illust)">
                    <rect 
                      x="0" 
                      y={20 - (16 * mockData.currentTopic.progressPercent) / 100} 
                      width="24" 
                      height="16" 
                      fill="#00A3BF" 
                      className="transition-all duration-700 ease-out"
                    />
                  </g>
                </svg>
              </div>

            </div>

            {/* Bottom Row: Action and Module Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              
              {/* Continue CTA */}
              <button className="border border-[#00A3BF] text-[#00A3BF] hover:bg-[#00A3BF]/5 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer">
                <span>Continue</span>
                <span className="text-sm">→</span>
              </button>

              {/* Module Pill List */}
              <div className="flex flex-wrap items-center gap-2">
                {mockData.currentTopic.modules.map((mod, idx) => {
                  const isCompleted = mod.status === 'completed';
                  const isCurrent = mod.status === 'current';
                  
                  return (
                    <div 
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                        isCompleted 
                          ? 'bg-[#1EC981]/10 text-[#1EC981] border-[#1EC981]/25'
                          : isCurrent
                          ? 'bg-[#00A3BF]/10 text-[#00A3BF] border-[#00A3BF]/25'
                          : 'bg-slate-50 text-slate-400 border-slate-200/80'
                      }`}
                    >
                      {isCompleted && <span className="text-[10px] font-bold">✓</span>}
                      {isCurrent && <span className="text-[10px] font-bold">→</span>}
                      <span>{mod.name}</span>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* SECTION C — UPCOMING TOPICS (Compact Locked Cards) */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest select-none">
              Upcoming Topics
            </span>
            
            {mockData.upcomingTopics.map((topic) => (
              <div 
                key={topic.id}
                className="bg-white/90 border border-slate-200/80 hover:border-slate-300 rounded-xl py-3 px-4 flex items-center justify-between gap-4 transition-all duration-200 group select-none shadow-[0_2px_8px_rgba(15,23,42,0.01)]"
              >
                {/* Left side detail */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Small Lock Icon */}
                  <svg className="w-3.5 h-3.5 text-slate-400 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V7zm3 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                  </svg>
                  
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {topic.title}
                  </span>
                  
                  <span className="text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full hidden sm:inline-block">
                    {topic.modules} Modules
                  </span>
                </div>

                {/* Right side estimated time */}
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 sm:bg-transparent sm:border-none sm:p-0">
                  {topic.estimatedTime}
                </span>
              </div>
            ))}
          </div>

          {/* SECTION D — HORIZON SUMMARY ROW */}
          <div className="flex items-center justify-between py-2 text-sm select-none mt-2">
            <span className="font-semibold text-slate-500">
              + {mockData.remainingCount} more topics ahead
            </span>
            <span className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer transition-colors flex items-center gap-1 underline decoration-dotted underline-offset-4">
              <span>[View full path]</span>
              <span className="text-sm">→</span>
            </span>
          </div>

        </div>

        {/* Right Spacer */}
        <div className="flex-1 hidden xl:block bg-transparent" />

        {/* ZONE 3 — RIGHT SIDEBAR (Fixed 280px, Hidden on Mobile) */}
        <aside className="hidden md:block w-[280px] border-l border-slate-200/80 bg-white/70 backdrop-blur-md shrink-0 p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto z-25 select-none">
          
          {/* Header click toggle */}
          <div 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="flex items-center justify-between p-2 hover:bg-slate-100/60 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-200"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <span>ⓘ</span>
              <span>Guidelines</span>
            </div>
            
            <svg 
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isSidebarExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Collapsible Guidelines List Container */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isSidebarExpanded ? 'max-h-[520px] opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            {/* Guidelines items */}
            <div className="space-y-4">
              
              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded-md bg-[#00A3BF]/10 text-[#00A3BF] border border-[#00A3BF]/20 flex items-center justify-center text-[#00A3BF] text-[10px] flex-shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1 text-[11px] leading-relaxed text-slate-650">
                  <span className="font-semibold text-slate-800 block">Sequential Locking</span>
                  Modules must be completed in order. Future paths unlock dynamically.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded-md bg-[#00A3BF]/10 text-[#00A3BF] border border-[#00A3BF]/20 flex items-center justify-center text-[#00A3BF] text-[10px] flex-shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1 text-[11px] leading-relaxed text-slate-650">
                  <span className="font-semibold text-slate-800 block">Practical Labs</span>
                  Hands-on AWS console sandboxes are required to achieve full module completion.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded-md bg-[#00A3BF]/10 text-[#00A3BF] border border-[#00A3BF]/20 flex items-center justify-center text-[#00A3BF] text-[10px] flex-shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1 text-[11px] leading-relaxed text-slate-650">
                  <span className="font-semibold text-slate-800 block">Quiz Validation</span>
                  Multiple-choice quizzes verify concept absorption. Unlimited retries are permitted.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded-md bg-[#00A3BF]/10 text-[#00A3BF] border border-[#00A3BF]/20 flex items-center justify-center text-[#00A3BF] text-[10px] flex-shrink-0 font-bold">
                  4
                </div>
                <div className="flex-1 text-[11px] leading-relaxed text-slate-650">
                  <span className="font-semibold text-slate-800 block">XP Rewards</span>
                  Complete paths to earn XP, level up, and rank on the AWS Cloud Club leaderboard.
                </div>
              </div>

            </div>

            {/* Compact Scoring Example Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 mt-5 shadow-sm">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest block mb-2.5">
                XP Calculation
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Module Reading</span>
                  <span className="font-medium text-slate-600">+50 XP</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Hands-on Lab</span>
                  <span className="font-medium text-slate-600">+100 XP</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-semibold text-[#1EC981]">
                  <span>Total Topic XP</span>
                  <span>150 XP ⚡</span>
                </div>
              </div>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}