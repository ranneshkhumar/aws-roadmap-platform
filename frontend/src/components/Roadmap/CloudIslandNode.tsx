'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloudIslandNodeProps {
  id: string;
  name: string;
  points: number;
  status: 'completed' | 'current' | 'locked';
  iconName: string;
  x: number; // percentage
  y: number; // pixels
  onClick: () => void;
  index: number;
  level?: string;
  levelIndex?: number;
}

export const CloudIslandNode: React.FC<CloudIslandNodeProps> = ({
  id,
  name,
  points,
  status,
  iconName,
  x,
  y,
  onClick,
  index,
  level,
  levelIndex
}) => {
  // Stagger float delay for natural look
  const floatDelay = (index * 0.35) % 2;

  // Level-relative display number: use levelIndex if provided, else fall back to index
  const circleNumber = (levelIndex ?? index) + 1;
  const progressNumber = String(circleNumber).padStart(2, '0');

  return (
    <div
      className={cn(
        "absolute z-25 -translate-x-1/2 -translate-y-1/2 select-none transition-all duration-300",
        status !== 'locked' ? "cursor-pointer animate-float-cloud" : "cursor-default animate-float-cloud opacity-80"
      )}
      style={{
        left: `${x}%`,
        top: `${y}px`,
        animationDelay: `${floatDelay}s`,
      }}
      onClick={status !== 'locked' ? onClick : undefined}
    >
      {/* 3D Base Shadow (scales with float) */}
      <motion.div
        className={cn(
          "absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-32 h-4 rounded-full blur-lg pointer-events-none transition-all duration-300",
          status === 'current'
            ? "bg-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
            : status === 'completed'
              ? "bg-emerald-400/25 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              : "bg-slate-500/15"
        )}
        animate={{
          scale: [0.85, 1.1, 0.85],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: floatDelay,
          ease: 'easeInOut'
        }}
      />

      {/* Completed Particles floating upward */}
      {status === 'completed' && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {[...Array(4)].map((_, i) => {
            const xOffset = ((i * 15) % 26) - 13;
            const duration = 2.4 + (i * 0.4);
            const delay = i * 0.6;
            return (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                style={{
                  left: `calc(50% + ${xOffset}px)`,
                  top: '25%',
                }}
                animate={{
                  y: [0, -60],
                  x: [0, xOffset * 1.3],
                  opacity: [0, 0.9, 0.4, 0],
                  scale: [0.4, 1.2, 0.4]
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay,
                  ease: 'easeOut'
                }}
              />
            );
          })}
        </div>
      )}

      {/* Pulsing ring indicators for CURRENT node */}
      {status === 'current' && (
        <>
          <motion.div
            className="absolute -inset-4 border-2 border-dashed border-cyan-400 rounded-full pointer-events-none animate-[spin_18s_linear_infinite] opacity-70"
            style={{ borderRadius: '50%' }}
          />
          <motion.div
            className="absolute -inset-4 border border-cyan-300 rounded-full pointer-events-none animate-pulse-glow"
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[9px] px-3.5 py-0.5 rounded-full border-2 border-white tracking-widest shadow-md animate-bounce z-35 whitespace-nowrap font-outfit">
            CURRENT
          </div>
        </>
      )}

      {/* Floating Island Container */}
      <div
        className={cn(
          "relative w-44 h-36 flex flex-col items-center justify-center transition-all duration-300",
          status === 'current' ? "scale-120 z-30" : "hover:scale-105 active:scale-95"
        )}
      >
        {/* Layered 3D Premium Cloud Island SVG */}
        <svg
          viewBox="0 0 180 140"
          className={cn(
            "w-44 h-36 absolute inset-0 z-10 pointer-events-none transition-all duration-300",
            status === 'completed' && "drop-shadow-[0_12px_22px_rgba(16,185,129,0.3)]",
            status === 'current' && "drop-shadow-[0_15px_30px_rgba(34,211,238,0.55)]",
            status === 'locked' && "drop-shadow-[0_4px_8px_rgba(0,0,0,0.03)]"
          )}
        >
          <defs>
            {/* Grass Gradients */}
            <linearGradient id={`grass-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" /> {/* emerald-500 */}
              <stop offset="100%" stopColor="#047857" /> {/* emerald-700 */}
            </linearGradient>

            {/* Dirt/Soil Gradients */}
            <linearGradient id={`soil-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#78350F" /> {/* amber-900 */}
              <stop offset="100%" stopColor="#451A03" /> {/* amber-950 */}
            </linearGradient>

            {/* Cloud Island Base Gradients */}
            <linearGradient id={`cloud-base-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Rock base gradients */}
            <linearGradient id={`rock-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748B" /> {/* slate-500 */}
              <stop offset="50%" stopColor="#475569" /> {/* slate-600 */}
              <stop offset="100%" stopColor="#1E293B" /> {/* slate-800 */}
            </linearGradient>
          </defs>

          {/* Locked Silhouette Cloud: Just a soft grey/white cloud, no grass, no dirt */}
          {status === 'locked' ? (
            <g>
              {/* Cloud Body for Locked state */}
              <path
                d="M 45,95 
                   C 15,95 10,70 30,55 
                   C 10,35 35,15 65,20 
                   C 80,5 115,10 125,30 
                   C 150,20 165,45 155,70 
                   C 165,85 145,95 125,95 
                   Z"
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                opacity="0.85"
              />
              {/* Inner highlight */}
              <path
                d="M 50,85 C 60,88 90,88 100,83 C 110,88 140,88 145,81 C 150,71 150,58 140,53 C 135,43 115,48 110,48 C 100,38 80,43 75,51 C 65,48 50,55 53,68 C 47,73 47,81 50,85 Z"
                fill="#FFFFFF"
                opacity="0.45"
              />
            </g>
          ) : (
            <g>
              {/* 1. FLOATING ROCK BASE (Bottom layer) */}
              {/* Jagged rocky core pointing downwards */}
              <path
                d="M 30,73 
                   L 150,73 
                   L 130,105 
                   L 90,132 
                   L 50,105 Z"
                fill={`url(#rock-grad-${id})`}
                stroke="#334155"
                strokeWidth="1.2"
              />
              {/* Shading/Jagged rock highlights */}
              <path d="M 68,73 L 90,132 L 98,73" fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.4" />
              <path d="M 112,73 L 130,105 L 90,132" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.6" />
              <path d="M 30,73 L 50,105 L 90,132" fill="none" stroke="#475569" strokeWidth="0.8" opacity="0.5" />

              {/* 2. GRASS LAYER (Middle layer) */}
              {/* Earthen rim line for depth */}
              <ellipse
                cx="90"
                cy="73"
                rx="62"
                ry="17"
                fill={`url(#soil-grad-${id})`}
              />
              {/* Lush Green Grass surface */}
              <ellipse
                cx="90"
                cy="72"
                rx="60"
                ry="16"
                fill={`url(#grass-grad-${id})`}
              />
              {/* Grass Border */}
              <ellipse
                cx="90"
                cy="72"
                rx="60"
                ry="16"
                fill="none"
                stroke="#047857"
                strokeWidth="1.5"
              />

              {/* 3. CLOUD LAYER (Top layer sitting on the grass) */}
              <path
                d="M 50,70 
                   C 32,70 28,55 40,45 
                   C 28,35 42,20 65,25 
                   C 75,10 105,12 115,28 
                   C 135,18 147,38 137,58 
                   C 147,70 132,82 115,82 
                   C 98,86 78,86 65,82 
                   C 52,82 50,76 50,70 Z"
                fill={`url(#cloud-base-grad-${id})`}
                stroke={status === 'current' ? '#22D3EE' : '#CBD5E1'}
                strokeWidth={status === 'current' ? '1.5' : '1'}
                opacity="0.95"
              />

              {/* Cloud Layer Inner Highlights */}
              <path
                d="M 55,62 C 60,65 85,65 92,60 C 100,65 125,65 130,59 C 135,50 135,38 126,34 C 122,25 104,29 99,29 C 90,20 72,24 67,31 C 58,28 45,34 48,46 C 42,50 42,57 45,61 Z"
                fill="#FFFFFF"
                opacity="0.45"
              />
            </g>
          )}
        </svg>

        {/* Flag pole on the first island (Fundamentals) */}
        {index === 0 && status !== 'locked' && (
          <div className="absolute top-[-25px] left-[32%] -translate-x-1/2 z-30 flex flex-col items-center select-none pointer-events-none">
            {/* Flag fabric */}
            <div className="relative w-6 h-4 bg-emerald-500 border border-emerald-600 rounded-sm shadow-sm flex items-center justify-center">
              <Icons.Flag className="w-2.5 h-2.5 text-white fill-current" />
            </div>
            {/* Pole */}
            <div className="w-0.5 h-7 bg-slate-800 -mt-0.5" />
          </div>
        )}

        {/* Floating Checkmark Badge for Completed Nodes */}
        {status === 'completed' && (
          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#10B981] to-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-md z-30 animate-bounce" style={{ animationDuration: '3.5s' }}>
            <Icons.Check className="w-3.5 h-3.5 stroke-[3.5]" />
          </div>
        )}

        {/* Node Content Nested Inside the Cloud Layer (Directly inside the cloud SVG face) */}
        {status !== 'locked' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-5 pt-3 pb-8 text-center">
            {/* Progress Number */}
            <span className={cn(
              "text-xl font-black tracking-tight leading-none font-heading",
              status === 'completed' ? "text-[#065F46]" : "text-slate-800"
            )}>
              {progressNumber}
            </span>

            {/* Module Name */}
            <span
              className={cn(
                "text-[10px] font-black tracking-tight mt-0.5 leading-snug max-w-[110px] font-sans",
                status === 'completed' ? "text-[#065F46]" : "text-slate-900"
              )}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {name}
            </span>

            {/* XP Points */}
            <span className={cn(
              "text-[8px] font-extrabold mt-0.5 uppercase tracking-wider font-heading",
              status === 'completed' ? "text-emerald-700" : "text-cyan-700"
            )}>
              +{points} XP
            </span>
          </div>
        ) : (
          /* Locked State: Show only a lock icon, no text */
          <div className="absolute inset-0 flex items-center justify-center z-20 pb-4">
            <div className="w-8 h-8 rounded-full bg-slate-350/60 border border-slate-400/20 flex items-center justify-center text-slate-500 shadow-inner">
              <Icons.Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
