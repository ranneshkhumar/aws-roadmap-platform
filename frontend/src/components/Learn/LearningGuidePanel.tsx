'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

const GUIDELINES = [
  'Complete all modules in a topic to unlock the next topic.',
  'Every module contains learning content followed by a knowledge check.',
  'Earn XP by completing modules and quizzes.',
  'Topics must be completed in sequence.',
  'Locked topics unlock automatically after completing the previous topic.',
];

export const LearningGuidePanel: React.FC = () => {
  return (
    <div className="rounded-[20px] bg-white/[0.12] backdrop-blur-[20px] border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Learning Guidelines
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        {GUIDELINES.map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
