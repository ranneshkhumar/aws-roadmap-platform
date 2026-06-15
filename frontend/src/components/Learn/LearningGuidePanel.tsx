'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuidelineSection {
  icon: string;
  title: string;
  description: string;
  prominent?: boolean;
  prominentColor?: 'amber' | 'sky';
}

interface ExampleLine {
  label: string;
  value: string;
}

const SECTIONS: (GuidelineSection | { type: 'divider' } | { type: 'example'; lines: ExampleLine[] })[] = [
  {
    icon: '📚',
    title: 'Complete modules in sequence.',
    description: 'Modules must be completed in order. Skipping ahead is not allowed.',
  },
  { type: 'divider' },
  {
    icon: '🔄',
    title: 'Revisit completed modules anytime.',
    description: 'After completing a module, you can return to it at any time for revision and learning.',
  },
  { type: 'divider' },
  {
    icon: '🔒',
    title: 'Unlock topics through progress.',
    description: 'Complete all modules in a topic to unlock the next topic.',
  },
  { type: 'divider' },
  {
    icon: '⚠️',
    title: 'Quiz Attempt Policy',
    description: 'Each quiz can only be attempted once. Review the learning material carefully before starting.',
    prominent: true,
    prominentColor: 'amber',
  },
  { type: 'divider' },
  {
    icon: '⭐',
    title: 'Earn points through learning and quiz performance.',
    description: 'Completing a module awards 50% of the available points automatically.',
  },
  { type: 'divider' },
  {
    icon: '🎯',
    title: 'Quiz accuracy determines the remaining points.',
    description: 'The remaining 50% is awarded based on your quiz score. Higher accuracy earns more points.',
  },
  { type: 'divider' },
  {
    type: 'example',
    lines: [
      { label: 'Module Completion', value: '50 Points' },
      { label: 'Quiz Score', value: '8 / 10 Correct' },
      { label: 'Quiz Reward', value: '40 Points' },
      { label: 'Final Score', value: '90 Points' },
    ],
  },
  { type: 'divider' },
  {
    icon: '🚀',
    title: 'Follow the learning path.',
    description: 'Modules, levels, and topics must be completed in order. You cannot jump between modules, levels, or topics.',
    prominent: true,
    prominentColor: 'sky',
  },
];

const prominentStyles = {
  amber: 'pl-3 border-l-2 border-l-amber-400 bg-amber-500/5 -ml-3 rounded-r-lg',
  sky: 'pl-3 border-l-2 border-l-sky-400 bg-sky-500/5 -ml-3 rounded-r-lg',
};

const prominentTitleStyles = {
  amber: 'text-amber-700',
  sky: 'text-sky-700',
};

export const LearningGuidePanel: React.FC = () => {
  return (
    <div className="rounded-[20px] bg-white/[0.12] backdrop-blur-[20px] border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          GUIDELINES
        </span>
      </div>

      <div className="flex flex-col">
        {SECTIONS.map((section, i) => {
          if ('type' in section && section.type === 'divider') {
            return <hr key={i} className="border-white/10 my-3" />;
          }

          if ('type' in section && section.type === 'example') {
            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">📈</span>
                  <span className="text-[11px] font-bold text-slate-700">Example Scoring</span>
                </div>
                <div className="pl-7 space-y-1">
                  <p className="text-[10px] text-slate-500 mb-1.5">For a 100-point module:</p>
                  {section.lines.map((line, j) => (
                    <div key={j} className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-600">{line.label}</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          const guideline = section as GuidelineSection;
          const isProminent = guideline.prominent;
          const pc = guideline.prominentColor || 'sky';

          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2.5',
                isProminent ? prominentStyles[pc] : '',
              )}
            >
              <span className="text-sm mt-0.5 flex-shrink-0">{guideline.icon}</span>
              <div>
                <p className={cn(
                  'text-[11px] font-bold leading-relaxed',
                  isProminent ? prominentTitleStyles[pc] : 'text-slate-700',
                )}>
                  {guideline.title}
                </p>
                <p className="text-[10.5px] text-slate-500 leading-relaxed mt-0.5">
                  {guideline.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
