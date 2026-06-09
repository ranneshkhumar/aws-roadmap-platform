'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntermediateCloudsOverlayProps {
  locked: boolean;
}

export const IntermediateCloudsOverlay: React.FC<IntermediateCloudsOverlayProps> = ({ locked }) => {
  // Define 10 high-quality clouds to completely mask the intermediate region (y: 1040px to 1610px)
  const clouds = [
    // Left side clouds
    { id: 'cloud-l1', left: '2%', top: '40px', width: 280, height: 140, driftX: [-5, 15, -5], driftY: [-5, 8, -5], duration: 10, grad: 'grad-dark', partDir: -1 },
    { id: 'cloud-l2', left: '15%', top: '150px', width: 340, height: 160, driftX: [-8, 20, -8], driftY: [-10, 10, -10], duration: 13, grad: 'grad-medium', partDir: -1 },
    { id: 'cloud-l3', left: '-5%', top: '290px', width: 320, height: 150, driftX: [-4, 12, -4], driftY: [-6, 6, -6], duration: 11, grad: 'grad-light', partDir: -1 },
    { id: 'cloud-l4', left: '12%', top: '420px', width: 350, height: 170, driftX: [-6, 18, -6], driftY: [-8, 12, -8], duration: 15, grad: 'grad-dark', partDir: -1 },
    { id: 'cloud-l5', left: '-2%', top: '560px', width: 310, height: 145, driftX: [-5, 15, -5], driftY: [-5, 10, -5], duration: 12, grad: 'grad-medium', partDir: -1 },

    // Right side clouds
    { id: 'cloud-r1', left: '68%', top: '60px', width: 330, height: 150, driftX: [15, -10, 15], driftY: [-6, 8, -6], duration: 12, grad: 'grad-light', partDir: 1 },
    { id: 'cloud-r2', left: '50%', top: '190px', width: 360, height: 170, driftX: [18, -12, 18], driftY: [-8, 12, -8], duration: 14, grad: 'grad-dark', partDir: 1 },
    { id: 'cloud-r3', left: '72%', top: '320px', width: 310, height: 150, driftX: [12, -8, 12], driftY: [-5, 6, -5], duration: 10, grad: 'grad-medium', partDir: 1 },
    { id: 'cloud-r4', left: '55%', top: '470px', width: 370, height: 180, driftX: [20, -15, 20], driftY: [-10, 10, -10], duration: 16, grad: 'grad-light', partDir: 1 },
    { id: 'cloud-r5', left: '68%', top: '590px', width: 340, height: 160, driftX: [15, -10, 15], driftY: [-7, 8, -7], duration: 13, grad: 'grad-dark', partDir: 1 },
  ];

  return (
    <div 
      className={cn(
        "absolute top-[920px] left-0 right-0 h-[780px] z-30 select-none overflow-hidden transition-all duration-1000",
        locked ? "pointer-events-auto bg-slate-900/[0.04]" : "pointer-events-none"
      )}
    >
      {/* Linear Gradients Definition */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="grad-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.95" /> {/* slate-700 */}
            <stop offset="60%" stopColor="#1e293b" stopOpacity="0.90" /> {/* slate-800 */}
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" /> {/* slate-900 */}
          </linearGradient>
          <linearGradient id="grad-medium" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" stopOpacity="0.95" /> {/* slate-600 */}
            <stop offset="60%" stopColor="#334155" stopOpacity="0.90" /> {/* slate-700 */}
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.85" /> {/* slate-800 */}
          </linearGradient>
          <linearGradient id="grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" stopOpacity="0.92" /> {/* slate-500 */}
            <stop offset="60%" stopColor="#475569" stopOpacity="0.88" /> {/* slate-600 */}
            <stop offset="100%" stopColor="#334155" stopOpacity="0.82" /> {/* slate-700 */}
          </linearGradient>
        </defs>
      </svg>

      <AnimatePresence>
        {locked && (
          <>
            {/* Animated background mist */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pointer-events-none"
            />

            {/* Cloud layers */}
            {clouds.map((cloud) => (
              <motion.div
                key={cloud.id}
                className="absolute drop-shadow-[0_15px_25px_rgba(15,23,42,0.35)]"
                style={{
                  left: cloud.left,
                  top: cloud.top,
                  width: cloud.width,
                  height: cloud.height,
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: cloud.driftX,
                  y: cloud.driftY,
                }}
                exit={{
                  x: cloud.partDir * 500,
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: 1.5, ease: 'easeOut' }
                }}
                transition={{
                  x: { repeat: Infinity, duration: cloud.duration, ease: 'easeInOut' },
                  y: { repeat: Infinity, duration: cloud.duration, ease: 'easeInOut' },
                  opacity: { duration: 0.8 },
                  scale: { duration: 0.8 },
                }}
              >
                <svg
                  viewBox="0 0 200 100"
                  fill={`url(#${cloud.grad})`}
                  className="w-full h-full stroke-slate-600/10"
                  strokeWidth="1"
                >
                  {/* Fluffy detailed path */}
                  <path d="M 30,70 
                           A 20,20 0 0,1 60,40 
                           A 25,25 0 0,1 110,30 
                           A 22,22 0 0,1 150,45 
                           A 18,18 0 0,1 180,70 
                           A 10,10 0 0,1 170,80 
                           L 30,80 
                           A 10,10 0 0,1 30,70 Z" />
                  
                  {/* Fluffy inner layer highlights */}
                  <path 
                    d="M 45,72 C 55,75 85,75 95,70 C 105,75 135,75 140,68 C 145,58 145,45 135,40 C 130,30 110,35 105,35 C 95,25 75,30 70,38 C 60,35 45,42 48,55 C 42,60 42,68 45,72 Z" 
                    fill="#FFFFFF" 
                    opacity="0.04" 
                  />
                </svg>
              </motion.div>
            ))}

            {/* Locked Region Header & Overlay Info */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -30, transition: { duration: 0.6 } }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center text-center p-8 max-w-sm rounded-3xl bg-slate-950/80 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              {/* Outer glowing ring for lock icon */}
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-slate-900 border border-white/5 mb-4 shadow-inner">
                <div className="absolute -inset-1.5 border border-dashed border-slate-700 rounded-full animate-[spin_20s_linear_infinite] opacity-40" />
                <Icons.Lock className="w-7 h-7 text-slate-400 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-slate-100 tracking-wider font-heading uppercase">
                Intermediate Region
              </h3>
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent my-2" />
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px]">
                Hidden in grey clouds. Complete all 6 Beginner modules to disperse the storm.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
