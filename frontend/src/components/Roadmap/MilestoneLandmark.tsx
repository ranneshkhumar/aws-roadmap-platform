'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandmarkProps {
  x: number;
  y: number;
  locked?: boolean;
}

// 1. Beginner Summit (Mountain Island)
export const BeginnerSummitLandmark: React.FC<LandmarkProps> = ({ x, y, locked = true }) => {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ left: `${x}%`, top: `${y}px` }}
    >
      {/* 3D Base Shadow */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-56 h-4.5 bg-black/15 blur-lg pointer-events-none"
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Mountain Structure on Floating Island Base */}
      <motion.div
        className="relative w-72 h-64 flex flex-col items-center justify-center cursor-default animate-float-cloud"
      >
        {/* Snowy Mountain Floating Island SVG */}
        <svg viewBox="0 0 180 140" className="w-72 h-56 absolute bottom-6 drop-shadow-xl pointer-events-none">
          <defs>
            {/* Rock Base Gradients */}
            <linearGradient id="beg-rock-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" /> {/* slate-600 */}
              <stop offset="60%" stopColor="#334155" /> {/* slate-700 */}
              <stop offset="100%" stopColor="#1E293B" /> {/* slate-800 */}
            </linearGradient>
            {/* Grass Layer Gradients */}
            <linearGradient id="beg-grass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" /> {/* emerald-500 */}
              <stop offset="100%" stopColor="#047857" /> {/* emerald-700 */}
            </linearGradient>
            {/* Mountain Peaks Gradient */}
            <linearGradient id="beg-peak-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" /> {/* slate-400 */}
              <stop offset="100%" stopColor="#475569" /> {/* slate-600 */}
            </linearGradient>
            <linearGradient id="snow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {/* 1. FLOATING ROCK BASE */}
          <path 
            d="M 25,90 
               L 155,90 
               L 135,118 
               L 90,135 
               L 45,118 Z" 
            fill="url(#beg-rock-grad)"
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          {/* Rock cracks */}
          <path d="M 60,90 L 90,135 L 105,90" fill="none" stroke="#1E293B" strokeWidth="1" opacity="0.4" />
          <path d="M 120,90 L 135,118 M 45,118 L 90,135" fill="none" stroke="#1E293B" strokeWidth="1" opacity="0.4" />

          {/* 2. GRASS LAYER */}
          <ellipse cx="90" cy="90" rx="68" ry="18" fill="#065F46" /> {/* soil depth */}
          <ellipse cx="90" cy="89" rx="66" ry="17" fill="url(#beg-grass-grad)" stroke="#047857" strokeWidth="1.5" />

          {/* 3. MOUNTAIN PEAKS RISING FROM GRASS */}
          {/* Left Peak */}
          <polygon points="30,89 65,35 100,89" fill="url(#beg-peak-grad)" />
          <polygon points="53,53 65,35 77,53 66,60 59,56" fill="url(#snow-grad)" />

          {/* Right Peak */}
          <polygon points="80,89 115,40 150,89" fill="url(#beg-peak-grad)" />
          <polygon points="103,60 115,40 127,60 117,67 110,63" fill="url(#snow-grad)" />

          {/* Center Main Peak */}
          <polygon points="45,89 90,20 135,89" fill="url(#beg-peak-grad)" />
          <polygon points="75,44 90,20 105,44 92,53 82,48" fill="url(#snow-grad)" />

          {/* Cloud drifts hugging the mountain peaks base */}
          <path d="M 15,92 C 15,82 35,78 55,78 C 75,78 90,83 105,78 C 120,78 135,83 150,83 C 165,83 165,92 155,96 C 145,100 125,102 110,102 C 95,104 75,104 55,102 C 35,104 15,100 15,92 Z" fill="#FFFFFF" opacity="0.9" />
        </svg>

        {/* Floating Trophy Icon Badge on top of peaks */}
        <div className="absolute top-2 flex flex-col items-center">
          <motion.div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border relative transition-all duration-300",
              locked 
                ? "bg-white/95 border-slate-200 text-slate-400" 
                : "bg-gradient-to-br from-amber-400 to-amber-500 border-white text-slate-950 shadow-amber-500/20"
            )}
            animate={!locked ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icons.Trophy className="w-5 h-5 fill-current" />
          </motion.div>
        </div>

        {/* Premium Summit Sign Plate Overlay (No separate plate beneath, island itself is the node) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-60 bg-emerald-600 border border-emerald-500 rounded-2xl px-4 py-2.5 text-center shadow-2xl z-30 select-none">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-white font-heading">
            BEGINNER SUMMIT
          </h4>
          <p className="text-[9.5px] text-emerald-100 font-semibold leading-snug mt-1 font-sans">
            Complete all Beginner modules to unlock the Intermediate level.
          </p>
          {locked ? (
            <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 text-slate-400 p-1.5 rounded-full shadow-md">
              <Icons.Lock className="w-3 h-3" />
            </div>
          ) : (
            <div className="absolute -top-2 -right-2 bg-emerald-500 border-2 border-white text-white p-1 rounded-full shadow-md animate-bounce">
              <Icons.Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// 2. Intermediate Summit (Larger Mountain Island)
export const IntermediateSummitLandmark: React.FC<LandmarkProps> = ({ x, y, locked = true }) => {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ left: `${x}%`, top: `${y}px` }}
    >
      {/* 3D Base Shadow */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-60 h-4.5 bg-black/15 blur-lg pointer-events-none"
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Larger Mountain Structure on Floating Island Base */}
      <motion.div
        className="relative w-80 h-72 flex flex-col items-center justify-center cursor-default animate-float-cloud"
      >
        {/* Snowy Mountain Floating Island SVG */}
        <svg viewBox="0 0 180 140" className="w-80 h-64 absolute bottom-6 drop-shadow-xl pointer-events-none">
          {/* 1. FLOATING ROCK BASE (Larger) */}
          <path 
            d="M 20,85 
               L 160,85 
               L 138,118 
               L 90,138 
               L 42,118 Z" 
            fill="url(#beg-rock-grad)"
            stroke="#1E293B"
            strokeWidth="1.5"
            opacity={locked ? 0.8 : 1}
          />
          <path d="M 55,85 L 90,138 L 105,85" fill="none" stroke="#1E293B" strokeWidth="1" opacity="0.3" />
          <path d="M 125,85 L 138,118 M 42,118 L 90,138" fill="none" stroke="#1E293B" strokeWidth="1" opacity="0.3" />

          {/* 2. GRASS LAYER (Larger) */}
          <ellipse cx="90" cy="85" rx="72" ry="19" fill="#065F46" opacity={locked ? 0.8 : 1} />
          <ellipse cx="90" cy="84" rx="70" ry="18" fill="url(#beg-grass-grad)" stroke="#047857" strokeWidth="1.5" opacity={locked ? 0.8 : 1} />

          {/* 3. PEAKS */}
          {/* Left Peak */}
          <polygon points="25,84 62,25 98,84" fill="url(#beg-peak-grad)" opacity={locked ? 0.7 : 1} />
          <polygon points="50,44 62,25 74,44 63,52 56,47" fill="url(#snow-grad)" opacity={locked ? 0.7 : 1} />

          {/* Right Peak */}
          <polygon points="82,84 118,30 154,84" fill="url(#beg-peak-grad)" opacity={locked ? 0.7 : 1} />
          <polygon points="106,49 118,30 130,49 120,56 113,52" fill="url(#snow-grad)" opacity={locked ? 0.7 : 1} />

          {/* Center Main Peak */}
          <polygon points="40,84 90,10 140,84" fill="url(#beg-peak-grad)" opacity={locked ? 0.7 : 1} />
          <polygon points="73,36 90,10 107,36 93,46 83,41" fill="url(#snow-grad)" opacity={locked ? 0.7 : 1} />

          {/* Cloud base drifts */}
          <path d="M 10,88 C 10,78 30,74 50,74 C 70,74 85,79 100,74 C 115,74 130,79 145,79 C 160,79 160,88 150,92 C 140,96 120,98 105,98 C 90,100 70,100 50,98 C 30,100 10,96 10,88 Z" fill="#FFFFFF" opacity="0.9" />
        </svg>

        {/* Floating Badge on top of peaks */}
        <div className="absolute top-2 flex flex-col items-center">
          <motion.div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border relative transition-all duration-300",
              locked 
                ? "bg-slate-100/90 border-slate-350 text-slate-400" 
                : "bg-gradient-to-br from-orange-450 to-orange-550 border-white text-white shadow-orange-500/20"
            )}
            animate={!locked ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icons.Zap className="w-5 h-5 fill-current" />
          </motion.div>
        </div>

        {/* Premium Summit Sign Plate (Matches intermediate sign in reference image) */}
        <div className={cn(
          "absolute bottom-6 left-1/2 -translate-x-1/2 w-60 border rounded-2xl px-4 py-2.5 text-center shadow-2xl z-30 select-none",
          locked 
            ? "bg-slate-700 border-slate-600 text-slate-205" 
            : "bg-orange-600 border-orange-500 text-white"
        )}>
          <h4 className="text-[11px] font-black uppercase tracking-wider font-heading text-white">
            INTERMEDIATE SUMMIT
          </h4>
          <p className={cn(
            "text-[9.5px] font-semibold leading-snug mt-1 font-sans",
            locked ? "text-slate-300" : "text-orange-100"
          )}>
            Complete all Intermediate modules to unlock the Advanced level.
          </p>
          {locked ? (
            <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 text-slate-400 p-1.5 rounded-full shadow-md">
              <Icons.Lock className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="absolute -top-2 -right-2 bg-emerald-500 border-2 border-white text-white p-1 rounded-full shadow-md animate-bounce">
              <Icons.Check className="w-3 h-3 stroke-[3]" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// 3. Cloud Architect Summit (Floating Castle Island)
export const CloudArchitectSummitLandmark: React.FC<LandmarkProps> = ({ x, y, locked = true }) => {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ left: `${x}%`, top: `${y}px` }}
    >
      {/* 3D Base Shadow */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-5 bg-black/15 blur-lg pointer-events-none"
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating Castle Island */}
      <motion.div
        className="relative w-80 h-76 flex flex-col items-center justify-center cursor-default animate-float-cloud"
      >
        {/* Floating Rock/Grass Castle Island Base SVG */}
        <svg viewBox="0 0 180 140" className="w-80 h-64 absolute bottom-6 drop-shadow-2xl pointer-events-none">
          <defs>
            <linearGradient id="castle-rock-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" /> {/* cosmic tint */}
              <stop offset="30%" stopColor="#475569" />
              <stop offset="70%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="castle-grass-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>

          {/* 1. FLOATING ROCK BASE */}
          <path 
            d="M 20,85 
               L 160,85 
               L 135,118 
               L 90,138 
               L 45,118 Z" 
            fill="url(#castle-rock-grad)"
            stroke="#1E293B"
            strokeWidth="1.5"
            opacity={locked ? 0.75 : 1}
          />
          {/* Rock cracks */}
          <path d="M 55,85 L 90,138 L 115,85" fill="none" stroke="#0F172A" strokeWidth="1.2" opacity="0.4" />
          
          {/* 2. GRASS LAYER */}
          <ellipse cx="90" cy="85" rx="72" ry="19" fill="#045D43" opacity={locked ? 0.75 : 1} />
          <ellipse cx="90" cy="84" rx="70" ry="18" fill="url(#castle-grass-grad)" stroke="#047857" strokeWidth="1.5" opacity={locked ? 0.75 : 1} />

          {/* 3. FLUFFY BASE CLOUDS */}
          <path d="M 10,88 C 10,78 30,73 50,73 C 70,73 90,78 110,78 C 130,78 150,73 150,88 C 150,98 120,102 90,102 C 60,102 10,98 10,88 Z" fill="#FFFFFF" opacity="0.9" />
        </svg>

        {/* Castle drawing vector */}
        <div className="absolute top-4 flex flex-col items-center">
          <svg 
            width="110" 
            height="110" 
            viewBox="0 0 64 64" 
            className={cn(
              "transition-all duration-350 drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
              locked 
                ? "text-slate-400 fill-slate-300/40 opacity-40" 
                : "text-amber-100 fill-amber-500 drop-shadow-[0_0_30px_rgba(255,221,148,0.95)] animate-pulse"
            )}
          >
            {/* Center Keep */}
            <rect x="22" y="24" width="20" height="24" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="20,24 32,12 44,24" fill="currentColor" />
            {/* Left Tower */}
            <rect x="12" y="16" width="8" height="32" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="10,16 16,6 22,16" fill="currentColor" />
            {/* Right Tower */}
            <rect x="44" y="16" width="8" height="32" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="42,16 48,6 54,16" fill="currentColor" />
            {/* Castle door */}
            <path d="M28 48 V38 C28 35, 36 35, 36 38 V48 Z" fill="#334155" />
          </svg>
        </div>

        {/* Premium Summit Sign Plate (Matches Castle sign in screenshot) */}
        <div className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 w-60 border rounded-2xl px-4 py-2.5 text-center shadow-2xl z-30 select-none",
          locked 
            ? "bg-slate-800 border-slate-700 text-slate-205" 
            : "bg-slate-950 border-slate-900 text-white shadow-emerald-500/10"
        )}>
          <h4 className="text-[11px] font-black uppercase tracking-wider font-heading text-white">
            CLOUD ARCHITECT SUMMIT
          </h4>
          <p className={cn(
            "text-[9.5px] font-semibold leading-snug mt-1 font-sans",
            locked ? "text-slate-400" : "text-slate-200"
          )}>
            Complete all Advanced modules and become a Cloud Architect.
          </p>
          {locked ? (
            <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 text-slate-400 p-1.5 rounded-full shadow-md">
              <Icons.Lock className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="absolute -top-2 -right-2 bg-amber-500 border-2 border-white text-white p-1 rounded-full shadow-md animate-bounce">
              <Icons.PartyPopper className="w-3 h-3 stroke-[2.5]" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
