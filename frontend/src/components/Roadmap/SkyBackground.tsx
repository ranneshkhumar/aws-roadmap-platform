'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const SkyBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Sky Ambient Light Glows */}
      <div 
        className="absolute w-[900px] h-[900px] rounded-full opacity-[0.15] blur-[160px] pointer-events-none"
        style={{
          top: '-10%',
          left: '-5%',
          background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)'
        }}
      />
      <div 
        className="absolute w-[900px] h-[900px] rounded-full opacity-[0.12] blur-[160px] pointer-events-none"
        style={{
          top: '35%',
          right: '-10%',
          background: 'radial-gradient(circle, #34D399 0%, transparent 70%)'
        }}
      />
      <div 
        className="absolute w-[1000px] h-[1000px] rounded-full opacity-[0.12] blur-[180px] pointer-events-none"
        style={{
          bottom: '-5%',
          left: '5%',
          background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)'
        }}
      />

      {/* Atmospheric Cloud Depth (Faint, heavily blurred back clouds) */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[150px] opacity-[0.25] blur-3xl text-white pointer-events-none">
        <CloudShape />
      </div>
      <div className="absolute top-[55%] right-[8%] w-[400px] h-[160px] opacity-[0.2] blur-3xl text-white pointer-events-none">
        <CloudShape />
      </div>
      <div className="absolute bottom-[15%] left-[5%] w-[380px] h-[150px] opacity-[0.25] blur-3xl text-white pointer-events-none">
        <CloudShape />
      </div>

      {/* Star Constellations (Glowing space stars) */}
      <div className="absolute inset-0">
        {[
          { top: '8%', left: '15%', size: '3px', delay: 1, duration: 3 },
          { top: '15%', left: '45%', size: '2px', delay: 0.5, duration: 4 },
          { top: '25%', left: '80%', size: '4px', delay: 2, duration: 5 },
          { top: '40%', left: '12%', size: '2.5px', delay: 1.5, duration: 3.5 },
          { top: '55%', left: '88%', size: '3px', delay: 0, duration: 4.5 },
          { top: '68%', left: '35%', size: '4px', delay: 2.5, duration: 3 },
          { top: '75%', left: '70%', size: '2px', delay: 1.2, duration: 4 },
          { top: '85%', left: '20%', size: '3.5px', delay: 0.8, duration: 5.5 },
          { top: '92%', left: '55%', size: '2px', delay: 1.9, duration: 3 }
        ].map((star, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0.15, 0.7, 0.15],
              scale: [0.85, 1.15, 0.85],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Background Cloud Layer 1 (Slow & Large - Light Fluffy Silhouette) */}
      <div className="absolute top-[12%] left-0 right-0 h-32 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute flex w-[200vw]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ ease: 'linear', duration: 180, repeat: Infinity }}
        >
          <div className="flex justify-around w-full opacity-[0.45] text-white">
            <CloudShape width={320} height={120} className="blur-xs" />
            <CloudShape width={450} height={150} className="blur-sm" />
            <CloudShape width={380} height={130} className="blur-xs" />
          </div>
          <div className="flex justify-around w-full opacity-[0.45] text-white">
            <CloudShape width={320} height={120} className="blur-xs" />
            <CloudShape width={450} height={150} className="blur-sm" />
            <CloudShape width={380} height={130} className="blur-xs" />
          </div>
        </motion.div>
      </div>

      {/* Background Cloud Layer 2 (Medium depth - Light Fluffy Silhouette) */}
      <div className="absolute top-[45%] left-0 right-0 h-40 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute flex w-[200vw]"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ ease: 'linear', duration: 140, repeat: Infinity }}
        >
          <div className="flex justify-around w-full opacity-[0.35] text-white">
            <CloudShape width={260} height={100} className="blur-sm" />
            <CloudShape width={350} height={120} className="blur-xs" />
            <CloudShape width={290} height={110} className="blur-sm" />
          </div>
          <div className="flex justify-around w-full opacity-[0.35] text-white">
            <CloudShape width={260} height={100} className="blur-sm" />
            <CloudShape width={350} height={120} className="blur-xs" />
            <CloudShape width={290} height={110} className="blur-sm" />
          </div>
        </motion.div>
      </div>

      {/* Background Cloud Layer 3 (Lower depth, smaller - Light Fluffy Silhouette) */}
      <div className="absolute bottom-[8%] left-0 right-0 h-28 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute flex w-[200vw]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ ease: 'linear', duration: 110, repeat: Infinity }}
        >
          <div className="flex justify-around w-full opacity-[0.5] text-white">
            <CloudShape width={200} height={80} className="blur-xs" />
            <CloudShape width={250} height={95} className="blur-sm" />
            <CloudShape width={210} height={85} className="blur-xs" />
          </div>
          <div className="flex justify-around w-full opacity-[0.5] text-white">
            <CloudShape width={200} height={80} className="blur-xs" />
            <CloudShape width={250} height={95} className="blur-sm" />
            <CloudShape width={210} height={85} className="blur-xs" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface CloudShapeProps {
  width?: number;
  height?: number;
  className?: string;
}

const CloudShape: React.FC<CloudShapeProps> = ({ width = 200, height = 100, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 100"
      fill="currentColor"
      className={cn("drop-shadow-[0_6px_12px_rgba(255,255,255,0.05)]", className)}
    >
      <path d="M 30,70 
               A 20,20 0 0,1 60,40 
               A 25,25 0 0,1 110,30 
               A 22,22 0 0,1 150,45 
               A 18,18 0 0,1 180,70 
               A 10,10 0 0,1 170,80 
               L 30,80 
               A 10,10 0 0,1 30,70 Z" />
    </svg>
  );
};
