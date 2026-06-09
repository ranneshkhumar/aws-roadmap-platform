'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ModuleData } from '@/constants/roadmapData';
import { cn } from '@/lib/utils';

interface MissionDetailsDrawerProps {
  module: ModuleData | null;
  isOpen: boolean;
  onClose: () => void;
  status: 'completed' | 'current' | 'locked';
}

export const MissionDetailsDrawer: React.FC<MissionDetailsDrawerProps> = ({
  module,
  isOpen,
  onClose,
  status
}) => {
  const router = useRouter();

  if (!module) return null;

  const handleStartLearning = () => {
    // Navigate to the dedicated learning page route
    router.push(`/roadmap/module/${module.id}`);
    onClose();
  };

  const statusLabel = {
    completed: 'Completed',
    current: 'Ready To Start',
    locked: 'Locked'
  }[status];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white/90 border-l border-slate-200/60 text-slate-900 flex flex-col shadow-2xl backdrop-blur-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            {/* Header Hero Area */}
            <div className="relative p-6 border-b border-slate-200/50 bg-slate-50/50">
              <button
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/40 transition-colors"
                onClick={onClose}
              >
                <Icons.X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2 font-outfit">
                {module.name}
              </h2>
            </div>

            {/* Mission Parameters */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5 font-outfit">
                  <Icons.Sliders className="w-4 h-4 text-emerald-600" />
                  Mission parameters
                </h4>

                <div className="bg-white border border-slate-200/60 rounded-2xl p-4 divide-y divide-slate-100 shadow-sm font-medium">
                  {/* Status row */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500">Completion Status</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-outfit",
                      status === 'completed' && "bg-[#50C999]/10 text-emerald-700 border-[#50C999]/20",
                      status === 'current' && "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse",
                      status === 'locked' && "bg-slate-100 text-slate-400 border-slate-200"
                    )}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Estimated duration row */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500">Estimated Time</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1 font-outfit">
                      <Icons.Clock className="w-3.5 h-3.5 text-amber-600" />
                      {module.estimatedTime}
                    </span>
                  </div>

                  {/* Dedicated learning pages row */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500">Learning Pages</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1 font-outfit">
                      <Icons.BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                      {module.learningPagesCount} Pages
                    </span>
                  </div>

                  {/* Architecture validations quiz questions row */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500">Quiz Questions</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1 font-outfit">
                      <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {module.quizQuestionsCount} Questions
                    </span>
                  </div>

                  {/* XP Reward row */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-500">XP Reward</span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1 font-outfit">
                      <Icons.Zap className="w-3.5 h-3.5 fill-current" />
                      +{module.points} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-slate-200/50 bg-slate-50 flex flex-col">
              {status !== 'locked' ? (
                <button
                  onClick={handleStartLearning}
                  className="w-full text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs tracking-wider transition-all hover:brightness-105 active:scale-[0.98] shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 font-outfit"
                  style={{
                    background: 'linear-gradient(96deg, rgb(255, 221, 148) 7.63%, rgb(80, 201, 153) 37.94%, rgba(243, 179, 68, 0.974) 65.23%, rgb(143, 255, 248) 92.12%)'
                  }}
                >
                  <Icons.GraduationCap className="w-4.5 h-4.5 stroke-[2.5]" />
                  Start Learning
                </button>
              ) : (
                <div className="w-full bg-slate-250 text-slate-400 font-bold py-3.5 px-6 rounded-2xl text-xs text-center border border-slate-300/40 select-none flex items-center justify-center gap-1.5 font-outfit">
                  <Icons.Lock className="w-4 h-4" />
                  Locked (Complete pre-requisites)
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
