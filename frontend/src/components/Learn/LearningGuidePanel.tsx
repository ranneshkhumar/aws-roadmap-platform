'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as AWSIcons from './AWSServiceIcons';

interface GuidelineSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  prominent?: boolean;
  prominentColor?: 'amber' | 'sky';
  themeColor: string;
}

interface ExampleLine {
  label: string;
  value: string;
}

const SECTIONS: (GuidelineSection | { type: 'divider' } | { type: 'example'; lines: ExampleLine[] })[] = [
  {
    icon: <AWSIcons.StepFunctionsIcon size={18} />,
    title: 'Complete modules in sequence.',
    description: 'Modules must be completed in order. Skipping ahead is not allowed.',
    themeColor: 'pink',
  },
  { type: 'divider' },
  {
    icon: <AWSIcons.S3Icon size={18} />,
    title: 'Revisit completed modules anytime.',
    description: 'After completing a module, you can return to it at any time for revision and learning.',
    themeColor: 'emerald',
  },
  { type: 'divider' },
  {
    icon: <AWSIcons.IAMIcon size={18} />,
    title: 'Unlock topics through progress.',
    description: 'Complete all modules in a topic to unlock the next topic.',
    themeColor: 'red',
  },
  { type: 'divider' },
  {
    icon: <AWSIcons.ConfigIcon size={18} />,
    title: 'Quiz Attempt Policy',
    description: 'Each quiz can only be attempted once. Review the learning material carefully before starting.',
    prominent: true,
    prominentColor: 'amber',
    themeColor: 'blue',
  },
  { type: 'divider' },
  {
    icon: <AWSIcons.CloudWatchIcon size={18} />,
    title: 'Earn points through learning and quiz performance.',
    description: 'Completing a module awards 50% of the available points automatically.',
    themeColor: 'fuchsia',
  },
  { type: 'divider' },
  {
    icon: <AWSIcons.QuickSightIcon size={18} />,
    title: 'Quiz accuracy determines the remaining points.',
    description: 'The remaining 50% is awarded based on your quiz score. Higher accuracy earns more points.',
    themeColor: 'indigo',
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
    icon: <AWSIcons.ApplicationComposerIcon size={18} />,
    title: 'Follow the learning path.',
    description: 'Modules, levels, and topics must be completed in order. You cannot jump between modules, levels, or topics.',
    prominent: true,
    prominentColor: 'sky',
    themeColor: 'violet',
  },
];

// Color mapping for AWS service icon container and soft ambient glow effects
const COLOR_MAP: Record<string, { glow: string; border: string; iconBg: string; text: string }> = {
  pink: {
    glow: 'bg-pink-500/10 shadow-[0_0_20px_rgba(244,114,182,0.18)]',
    border: 'border-pink-500/20 hover:border-pink-500/35',
    iconBg: 'bg-pink-500/10 border-pink-500/20',
    text: 'text-pink-600'
  },
  emerald: {
    glow: 'bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.18)]',
    border: 'border-emerald-500/20 hover:border-emerald-500/35',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-600'
  },
  red: {
    glow: 'bg-red-500/10 shadow-[0_0_20px_rgba(248,113,113,0.18)]',
    border: 'border-red-500/20 hover:border-red-500/35',
    iconBg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-600'
  },
  blue: {
    glow: 'bg-blue-500/10 shadow-[0_0_20px_rgba(96,165,250,0.18)]',
    border: 'border-blue-500/20 hover:border-blue-500/35',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-600'
  },
  fuchsia: {
    glow: 'bg-fuchsia-500/10 shadow-[0_0_20px_rgba(232,121,249,0.18)]',
    border: 'border-fuchsia-500/20 hover:border-fuchsia-500/35',
    iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    text: 'text-fuchsia-600'
  },
  indigo: {
    glow: 'bg-indigo-500/10 shadow-[0_0_20px_rgba(129,140,248,0.18)]',
    border: 'border-indigo-500/20 hover:border-indigo-500/35',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    text: 'text-indigo-600'
  },
  teal: {
    glow: 'bg-teal-500/10 shadow-[0_0_20px_rgba(45,212,191,0.18)]',
    border: 'border-teal-500/20 hover:border-teal-500/35',
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    text: 'text-teal-600'
  },
  violet: {
    glow: 'bg-violet-500/10 shadow-[0_0_20px_rgba(167,139,250,0.18)]',
    border: 'border-violet-500/20 hover:border-violet-500/35',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    text: 'text-violet-600'
  }
};

export const LearningGuidePanel: React.FC = () => {
  return (
    <div className="rounded-[24px] bg-white/[0.08] backdrop-blur-[20px] border border-white/20 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),0_12px_36px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6 select-none w-full min-h-full">
      {/* Guidelines Header */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shadow-sm border border-amber-500/20">
            <Lightbulb className="w-[18px] h-[18px] text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest font-heading">
            GUIDELINES
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 font-semibold tracking-tight pl-[46px] -mt-1 leading-normal">
          Platform learning rules and progression guidelines
        </p>
      </div>

      {/* Guidelines Cards Stack */}
      <div className="flex flex-col gap-4">
        {SECTIONS.filter(section => 'type' in section ? section.type !== 'divider' : true).map((section, i) => {
          // Render example scoring card
          if ('type' in section && section.type === 'example') {
            return (
              <div
                key={i}
                className="w-full bg-sky-50/[0.06] border border-white/20 rounded-2xl p-5 md:p-6 flex flex-col gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(15,23,42,0.03)] backdrop-blur-md relative overflow-hidden group transition-all duration-300 hover:bg-sky-50/[0.09]"
              >
                {/* Soft ambient teal color glow overlay when hovered */}
                <div className="absolute inset-0 bg-teal-500/10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300" />

                <div className="flex items-center gap-4 z-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative flex-shrink-0 bg-white/[0.15] border border-white/25 shadow-inner transition-all duration-300 group-hover:scale-105">
                    <div className="absolute inset-0 rounded-2xl bg-teal-500/10 blur-md opacity-40 transition-opacity group-hover:opacity-60" />
                    <div className="relative z-10 flex items-center justify-center">
                      <AWSIcons.CostExplorerIcon size={28} />
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase font-heading">
                    Example Scoring
                  </h3>
                </div>

                <div className="space-y-2 pt-1 z-10">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    For a 100-point module:
                  </p>
                  {section.lines.map((line, j) => (
                    <div key={j} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/10 last:border-0 last:pb-0">
                      <span className="text-slate-600 font-semibold">{line.label}</span>
                      <span className="font-extrabold text-slate-800 tabular-nums">{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          const guideline = section as GuidelineSection;
          const isProminent = guideline.prominent;
          const pc = guideline.prominentColor || 'sky';
          const themeColor = guideline.themeColor;
          const config = COLOR_MAP[themeColor] || COLOR_MAP.blue;

          // Prominent container theme mappings
          const containerClass = isProminent
            ? pc === 'amber'
              ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border-amber-500/35 hover:border-amber-500/50 shadow-[0_8px_24px_rgba(245,158,11,0.05)]'
              : 'bg-sky-500/[0.08] hover:bg-sky-500/[0.12] border-sky-500/35 hover:border-sky-500/50 shadow-[0_8px_24px_rgba(14,165,233,0.05)]'
            : 'bg-sky-50/[0.06] hover:bg-sky-50/[0.10] border-white/20 hover:border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(15,23,42,0.03)]';

          const iconContainerClass = isProminent
            ? pc === 'amber'
              ? 'bg-amber-500/[0.12] border-amber-500/30 shadow-inner'
              : 'bg-sky-500/[0.12] border-sky-500/30 shadow-inner'
            : 'bg-white/[0.15] border-white/25 shadow-inner';

          const titleColorClass = isProminent
            ? pc === 'amber'
              ? 'text-amber-900 font-extrabold'
              : 'text-sky-900 font-extrabold'
            : 'text-slate-800 font-extrabold';

          const descColorClass = isProminent
            ? pc === 'amber'
              ? 'text-amber-800/90'
              : 'text-sky-800'
            : 'text-slate-600/90';

          const glowColorClass = config.glow;

          return (
            <div
              key={i}
              className={cn(
                'w-full border rounded-2xl p-5 md:p-6 flex items-start gap-5 transition-all duration-300 hover:scale-[1.01] backdrop-blur-md relative overflow-hidden group',
                containerClass
              )}
            >
              {/* Soft ambient color glow overlay when hovered */}
              <div className={cn('absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300', glowColorClass)} />

              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center relative flex-shrink-0 border shadow-inner transition-all duration-300 group-hover:scale-105', iconContainerClass)}>
                {/* Micro-glow for the icon container itself */}
                <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center justify-center">
                  {React.cloneElement(guideline.icon as React.ReactElement<{ size?: number }>, { size: 28 })}
                </div>
              </div>

              <div className="flex-1 min-w-0 z-10">
                <h3 className={cn(
                  'text-sm tracking-tight leading-snug font-heading',
                  titleColorClass
                )}>
                  {guideline.title}
                </h3>
                <p className={cn('text-xs leading-relaxed mt-2', descColorClass)}>
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
