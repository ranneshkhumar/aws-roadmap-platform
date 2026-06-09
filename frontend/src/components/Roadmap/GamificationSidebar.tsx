'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { MOCK_ACHIEVEMENTS } from '@/constants/roadmapData';
import { cn } from '@/lib/utils';

interface GamificationSidebarProps {
  xp: number;
  level: number;
  streak: number;
  completedCount: number;
  s3Completed: boolean;
}

export const GamificationSidebar: React.FC<GamificationSidebarProps> = ({
  xp,
  level,
  streak,
  completedCount,
  s3Completed
}) => {
  // Compute level XP boundaries. Let's say each level is 1000 XP.
  const levelXpFloor = (level - 1) * 1000;
  const levelXpCeil = level * 1000;
  const currentLevelProgress = xp - levelXpFloor;
  const progressPercent = Math.min(Math.max((currentLevelProgress / 1000) * 100, 0), 100);

  // Dynamically update S3 badge if completed
  const badges = MOCK_ACHIEVEMENTS.map(badge => {
    if (badge.id === 'badge3' && s3Completed) {
      return {
        ...badge,
        unlocked: true,
        date: 'Today'
      };
    }
    return badge;
  });

  const dailyQuests = [
    { id: 1, text: 'Analyze AWS S3 Bucket storage logic', xp: 50, done: s3Completed },
    { id: 2, text: 'Review 3 tier VPC architecture nodes', xp: 75, done: completedCount >= 5 },
    { id: 3, text: 'Solve daily Security Group puzzle', xp: 100, done: false }
  ];

  return (
    <div className="w-full xl:w-80 space-y-6">
      {/* 1. Profile Dashboard Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
        {/* Abstract vector circle bg */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Avatar shell */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-blue-500/10">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                <Icons.User className="w-6 h-6 text-blue-100" />
              </div>
            </div>
            {/* Glowing active indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
              Explorer Rank
            </span>
            <h4 className="text-base font-bold text-white leading-tight">
              Rannesh Khumar
            </h4>
            <span className="text-xs text-slate-400">
              Cloud Initiate
            </span>
          </div>
        </div>

        {/* Level & XP Gauge */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Level {level}</span>
            <span className="text-slate-400">{xp} / {levelXpCeil} XP</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Completion Streak Card 🔥 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
            Learning Streak
          </span>
          <h4 className="text-xl font-black text-white flex items-center gap-1.5">
            {streak} Days Active
          </h4>
          <p className="text-xs text-slate-400">
            Keep it up to multiply XP!
          </p>
        </div>

        {/* Animated Flame Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-125 pointer-events-none" />
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-14 h-14 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 rounded-2xl shadow-lg flex items-center justify-center"
          >
            <Icons.Flame className="w-8 h-8 text-slate-950 fill-current" />
          </motion.div>
        </div>
      </div>

      {/* 3. Achievements / Badges Case (3D Hover Effect) */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Icons.Award className="w-4 h-4 text-blue-400" />
          Earned Badges ({badges.filter(b => b.unlocked).length}/4)
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => {
            const BadgeIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[badge.icon] || Icons.Award;
            
            return (
              <motion.div
                key={badge.id}
                style={{ perspective: 1000 }}
                whileHover={{ 
                  rotateY: 12, 
                  rotateX: -10, 
                  z: 10,
                  scale: 1.03
                }}
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col items-center text-center relative overflow-hidden transition-all duration-300",
                  badge.unlocked 
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" 
                    : "bg-slate-950/40 border-slate-900/60 opacity-40 select-none"
                )}
              >
                {/* Micro circle bg */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-inner",
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.color} text-slate-950`
                    : "bg-slate-800 text-slate-600"
                )}>
                  <BadgeIcon className="w-5 h-5 stroke-[2.5]" />
                </div>

                <span className={cn(
                  "text-xs font-bold truncate w-full",
                  badge.unlocked ? "text-slate-100" : "text-slate-500"
                )}>
                  {badge.name}
                </span>
                
                <span className="text-[9px] text-slate-500 mt-0.5">
                  {badge.unlocked ? badge.date : 'Locked'}
                </span>

                {/* Locked overlay lock icon */}
                {!badge.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Icons.Lock className="w-2.5 h-2.5 text-slate-600" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Daily Quests checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Icons.CalendarRange className="w-4 h-4 text-blue-400" />
          Daily Missions
        </h4>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          {dailyQuests.map((quest) => (
            <div key={quest.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className={cn(
                  "mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center flex-shrink-0",
                  quest.done 
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                    : "border-slate-700 bg-slate-800 text-slate-500"
                )}>
                  {quest.done && <Icons.Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={cn(
                  "leading-snug",
                  quest.done ? "text-slate-500 line-through" : "text-slate-300"
                )}>
                  {quest.text}
                </span>
              </div>
              <span className={cn(
                "font-bold flex-shrink-0 bg-slate-850 px-1.5 py-0.5 rounded text-[10px] border",
                quest.done 
                  ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" 
                  : "text-amber-500 border-slate-700 bg-slate-900"
              )}>
                +{quest.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
