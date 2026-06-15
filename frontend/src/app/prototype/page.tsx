'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopicDialProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  state: 'CURRENT' | 'AVAILABLE' | 'COMPLETED' | 'LOCKED';
}

const TopicDial: React.FC<TopicDialProps> = ({ name, icon: IconComponent, state }) => {
  const isCurrent = state === 'CURRENT';
  const isAvailable = state === 'AVAILABLE';
  const isCompleted = state === 'COMPLETED';
  const isLocked = state === 'LOCKED';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 240px Mechanical 3D Dial Button */}
      <div 
        className={cn(
          "relative w-[240px] h-[240px] rounded-full flex items-center justify-center p-[10px] select-none text-white",
          // Bevel & Depth Shadows for the 3D Socket casing
          isLocked
            ? "bg-gradient-to-b from-[#CCCCCC] via-[#B5B5B5] to-[#888888] border border-[#A0A0A0] shadow-[0_20px_40px_rgba(0,0,0,0.25),0_8px_16px_rgba(0,0,0,0.3),inset_0_4px_6px_rgba(255,255,255,0.6),inset_0_-4px_6px_rgba(0,0,0,0.25)]"
            : "bg-gradient-to-b from-[#FDFDFD] via-[#E2E8F0] to-[#B8C5D6] border border-[#CBD5E1] shadow-[0_25px_50px_rgba(15,23,42,0.2),0_10px_20px_rgba(15,23,42,0.15),inset_0_4px_6px_rgba(255,255,255,0.85),inset_0_-4px_6px_rgba(0,0,0,0.15)]"
        )}
      >
        {/* Layer 2: Inner Illuminated Ring */}
        <div 
          className={cn(
            "absolute inset-[12px] rounded-full border-2 transition-all duration-500 z-10",
            isLocked
              ? "border-slate-500/30 bg-[#94A3B8]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              : isCompleted
                ? "border-amber-400 bg-amber-950/20 shadow-[0_0_22px_rgba(245,158,11,0.65),inset_0_0_15px_rgba(245,158,11,0.5)]"
                : isCurrent
                  ? "border-emerald-400 bg-emerald-950/20 shadow-[0_0_25px_rgba(16,185,129,0.8),inset_0_0_18px_rgba(16,185,129,0.6)] animate-pulse-emerald-glow"
                  : "border-blue-400/60 bg-blue-950/15 shadow-[0_0_18px_rgba(59,130,246,0.45),inset_0_0_12px_rgba(59,130,246,0.3)]"
          )}
        />

        {/* Layer 3: Center Cap Knob */}
        {isLocked ? (
          // LOCKED STATE: flat, desaturated cap with chain overlay
          <div className="absolute inset-[24px] rounded-full bg-[#CBD5E1] border border-[#B8C5D6] flex flex-col items-center justify-center p-6 z-20 shadow-[inset_0_2px_4px_white,0_4px_8px_rgba(0,0,0,0.12)] grayscale select-none">
            {/* Detailed chains SVG crossing the face */}
            <svg className="absolute top-4 inset-x-0 mx-auto w-24 h-12 text-slate-500/70" viewBox="0 0 80 30" fill="none">
              <rect x="5" y="10" width="18" height="9" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
              <rect x="18" y="12" width="15" height="6" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <rect x="28" y="10" width="18" height="9" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
              <rect x="42" y="12" width="15" height="6" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <rect x="52" y="10" width="18" height="9" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            <Icons.Lock className="w-8 h-8 text-slate-400 mt-4 relative z-10" />
            <span className="text-[12px] font-black text-slate-500 mt-3 relative z-10 uppercase tracking-widest leading-none font-sans">
              {name}
            </span>
          </div>
        ) : isCompleted ? (
          // COMPLETED STATE: gold ring, pressed down cap
          <div 
            className="absolute inset-[24px] rounded-full bg-gradient-to-b from-[#18233C] to-[#0A101C] border border-[#0B1528] flex flex-col items-center justify-center p-6 z-20 text-center shadow-[inset_0_6px_12px_rgba(0,0,0,0.6),0_1px_2px_rgba(255,255,255,0.08)] translate-y-[3px]"
          >
            {/* Glass Curved Glare Reflection */}
            <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/10 via-white/2 to-transparent rounded-t-full pointer-events-none z-10" />
            <IconComponent className="w-8 h-8 text-amber-400 mb-2" />
            <span className="text-[12.5px] font-black text-slate-100 uppercase tracking-widest leading-none font-sans">
              {name}
            </span>
          </div>
        ) : isCurrent ? (
          // CURRENT STATE: elevated cap rises and lowers in a slow breathing loop
          <motion.div
            animate={{
              y: [-3, 3, -3],
              boxShadow: [
                "inset 0 3px 6px rgba(255,255,255,0.15), 0 8px 20px rgba(0,0,0,0.45)",
                "inset 0 1px 3px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.25)",
                "inset 0 3px 6px rgba(255,255,255,0.15), 0 8px 20px rgba(0,0,0,0.45)"
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-[22px] rounded-full bg-gradient-to-b from-[#1F2D4E] to-[#0E1528] border border-[#0B1528] flex flex-col items-center justify-center p-6 z-20 text-center cursor-pointer focus:outline-none"
          >
            {/* Glass Curved Glare Reflection */}
            <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/12 via-white/2 to-transparent rounded-t-full pointer-events-none z-10" />
            <IconComponent className="w-8 h-8 text-emerald-400 mb-2" />
            <span className="text-[12.5px] font-black text-slate-100 uppercase tracking-widest leading-none font-sans">
              {name}
            </span>
          </motion.div>
        ) : (
          // AVAILABLE STATE: hover lift cap
          <motion.div
            whileHover={{
              y: -6,
              boxShadow: "inset 0 3px 6px rgba(255,255,255,0.15), 0 10px 22px rgba(0,0,0,0.5)"
            }}
            whileTap={{ y: 2 }}
            className="absolute inset-[22px] rounded-full bg-gradient-to-b from-[#1F2D4E] to-[#0E1528] border border-[#0B1528] flex flex-col items-center justify-center p-6 z-20 text-center cursor-pointer shadow-[inset_0_3px_6px_rgba(255,255,255,0.12),0_6px_12px_rgba(0,0,0,0.35)] focus:outline-none"
          >
            {/* Glass Curved Glare Reflection */}
            <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/12 via-white/2 to-transparent rounded-t-full pointer-events-none z-10" />
            <IconComponent className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-[12.5px] font-black text-slate-100 uppercase tracking-widest leading-none font-sans">
              {name}
            </span>
          </motion.div>
        )}

        {/* LED slot & indicator at bottom center */}
        <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
          {isLocked ? (
            <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-500 shadow-inner">
              <Icons.Lock className="w-3 h-3" />
            </div>
          ) : (
            <div 
              className={cn(
                "w-4 h-4 rounded-full border border-black/30 shadow-[0_0_12px_var(--led-glow)]",
                isCompleted 
                  ? "bg-amber-400 shadow-amber-400/90" 
                  : isCurrent
                    ? "bg-emerald-400 shadow-emerald-400/95 animate-pulse"
                    : "bg-blue-400 shadow-blue-500/80"
              )} 
              style={{
                // @ts-ignore
                '--led-glow': isCompleted ? '#F59E0B' : (isCurrent ? '#10B981' : '#3B82F6')
              }} 
            />
          )}
        </div>

        {/* Gold check badge for completed dial */}
        {isCompleted && (
          <div className="absolute top-[12px] right-[12px] w-6 h-6 rounded-full bg-amber-400 text-slate-950 border-2 border-white flex items-center justify-center shadow-md z-30 animate-bounce" style={{ animationDuration: '3.5s' }}>
            <Icons.Check className="w-3.5 h-3.5 stroke-[4.5]" />
          </div>
        )}
      </div>

      {/* Under Label */}
      <span className="text-[10px] font-black tracking-widest uppercase text-slate-450 mt-1">
        {state}
      </span>
    </div>
  );
};

export default function DialPrototypePage() {
  return (
    <div className="min-h-screen w-screen bg-[#FAFDFB] font-sans flex flex-col items-center justify-center p-10 relative overflow-hidden select-none">
      
      {/* Light elegant white-to-emerald gradient backdrops */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EBF5EF] via-white to-[#FAFDFB] z-0 pointer-events-none" />
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col items-center gap-10">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-emerald-600 uppercase">
            Phase X Prototype
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
            3D TopicDials Console
          </h1>
          <p className="text-xs text-slate-450 font-bold max-w-md leading-normal">
            Physical hardware-style mechanical dials selector console in emerald green, gold, and white.
          </p>
        </div>

        {/* The 4 standalone dials side-by-side */}
        <div className="flex flex-wrap items-center justify-center gap-10 pt-4">
          <TopicDial 
            name="AWS" 
            icon={Icons.Cloud} 
            state="CURRENT" 
          />
          <TopicDial 
            name="DevOps" 
            icon={Icons.RefreshCw} 
            state="AVAILABLE" 
          />
          <TopicDial 
            name="Security" 
            icon={Icons.Shield} 
            state="COMPLETED" 
          />
          <TopicDial 
            name="Networking" 
            icon={Icons.Network} 
            state="LOCKED" 
          />
        </div>

      </div>

      {/* Pulse keyframe animation */}
      <style>{`
        @keyframes emerald-glow-pulse {
          0%, 100% { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.3); }
          50% { border-color: rgba(16, 185, 129, 0.85); box-shadow: 0 0 25px rgba(16, 185, 129, 0.75), inset 0 0 15px rgba(16, 185, 129, 0.6); }
        }
        .animate-pulse-emerald-glow {
          animation: emerald-glow-pulse 3s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}
