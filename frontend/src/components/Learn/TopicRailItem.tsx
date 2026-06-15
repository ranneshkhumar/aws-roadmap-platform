'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Cloud, Wrench, Shield, Anchor, Sparkles, BookOpen, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopicSummary } from '@/services/api';
import { CloudProgress } from './CloudProgress';

const THEME_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  TECH: Cloud,
  FORGE: Wrench,
  CITADEL: Shield,
  HARBOR: Anchor,
  CRYSTAL: Sparkles,
};

interface TopicRailItemProps {
  topic: TopicSummary;
  status: 'CURRENT' | 'AVAILABLE' | 'COMPLETED' | 'LOCKED';
}

export const TopicRailItem: React.FC<TopicRailItemProps> = ({ topic, status }) => {
  const router = useRouter();
  const isLocked = status === 'LOCKED';
  const IconComponent = THEME_ICON[topic.theme] || BookOpen;

  const cloudPct = useMemo(() => {
    if (topic.totalModules === 0) return 0;
    return Math.round((topic.completedModules / topic.totalModules) * 100);
  }, [topic.completedModules, topic.totalModules]);

  const cloudColor = status === 'COMPLETED' ? 'emerald' : 'sky';

  const handleClick = () => {
    if (!isLocked) {
      router.push(`/learn/${topic.slug}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={cn(
        'relative w-full max-w-[900px] h-[120px] group',
        'transition-all duration-[250ms]',
        isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5',
      )}
    >
      {/* Glass background with layered depth */}
      <div
        className={cn(
          'absolute inset-0 rounded-[20px] backdrop-blur-[20px] border transition-all duration-[250ms]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_rgba(0,0,0,0.08)]',
          status === 'CURRENT' && [
            'bg-white/[0.18] border-sky-400/60',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_35px_rgba(14,165,233,0.15),0_10px_30px_rgba(0,0,0,0.08)]',
          ],
          status === 'AVAILABLE' && 'bg-white/[0.12] border-white/25',
          status === 'COMPLETED' && 'bg-white/[0.12] border-white/25',
          status === 'LOCKED' && 'bg-white/[0.06] border-white/10 opacity-50',
          !isLocked && 'group-hover:bg-white/[0.18] group-hover:border-white/35',
        )}
      />

      {/* Left accent strip */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-[250ms]',
          status === 'CURRENT' && 'bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.6)]',
          status === 'AVAILABLE' && 'bg-blue-400',
          status === 'COMPLETED' && 'bg-emerald-400',
          status === 'LOCKED' && 'bg-slate-500',
        )}
      />

      {/* Content row */}
      <div className="relative flex items-center justify-between h-full px-6">
        {/* Left: Icon + Topic name + Status */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-[250ms]',
              status === 'CURRENT' && 'bg-sky-500/15 text-sky-600',
              status === 'AVAILABLE' && 'bg-blue-500/10 text-blue-600',
              status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-600',
              status === 'LOCKED' && 'bg-slate-500/10 text-slate-500',
            )}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span
              className={cn(
                'text-base sm:text-lg font-semibold tracking-tight truncate',
                status === 'CURRENT' && 'text-sky-800',
                status === 'AVAILABLE' && 'text-slate-800',
                status === 'COMPLETED' && 'text-slate-800',
                status === 'LOCKED' && 'text-slate-500',
              )}
            >
              {topic.name}
            </span>

            {/* Status badge below topic name */}
            <div className="flex items-center">
              {status === 'CURRENT' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-[9px] font-black text-sky-700 uppercase tracking-widest">
                    Current
                  </span>
                </div>
              )}
              {status === 'AVAILABLE' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">
                    Available
                  </span>
                </div>
              )}
              {status === 'COMPLETED' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                    Completed
                  </span>
                </div>
              )}
              {status === 'LOCKED' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Locked
                  </span>
                </div>
              )}
            </div>

            {/* Module progress text */}
            {isLocked ? (
              <span className="text-[10px] text-slate-400 leading-none">
                Unlock previous topic
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 leading-none">
                {topic.completedModules} / {topic.totalModules} Modules
              </span>
            )}
          </div>
        </div>

        {/* Right: Dedicated cloud area — only for unlocked topics */}
        {!isLocked && (
          <div className="w-[240px] h-[76px] flex-shrink-0">
            <CloudProgress pct={cloudPct} color={cloudColor} topicId={topic.id} />
          </div>
        )}
      </div>
    </button>
  );
};
