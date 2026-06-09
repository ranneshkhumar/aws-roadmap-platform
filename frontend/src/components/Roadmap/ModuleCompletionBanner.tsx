'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface ModuleCompletionBannerProps {
  onTakeQuiz: () => void;
}

export const ModuleCompletionBanner: React.FC<ModuleCompletionBannerProps> = ({ onTakeQuiz }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 text-center py-6 flex flex-col items-center justify-center flex-1"
    >
      <div className="w-16 h-16 rounded-full bg-emerald-55/5 text-emerald-600 border border-emerald-200 flex items-center justify-center relative shadow-inner">
        <Icons.CheckCircle className="w-8 h-8 fill-current text-emerald-550" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-slate-900 tracking-tight font-heading">
          Learning Content Completed
        </h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
          Excellent progress! You have thoroughly analyzed the study nodes. The validation quiz is now open to claim your explorer rank points.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-2xl p-4 flex items-center justify-center gap-2 w-full max-w-md">
        <Icons.LockOpen className="w-4 h-4 text-blue-600 flex-shrink-0 animate-bounce" />
        <span>Quiz Unlocked! 15 multiple-choice questions ahead.</span>
      </div>

      <button
        onClick={onTakeQuiz}
        className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] shadow-md shadow-blue-600/15"
      >
        Take Quiz
      </button>
    </motion.div>
  );
};
