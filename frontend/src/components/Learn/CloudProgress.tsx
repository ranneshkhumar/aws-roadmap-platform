'use client';

import React from 'react';

interface CloudProgressProps {
  pct: number;
  color: 'sky' | 'emerald';
  topicId: string;
}

const CLOUD_PATH =
  'M 12,42 A 10,10 0 0,1 22,33 A 14,14 0 0,1 48,25 A 12,12 0 0,1 70,29 A 14,14 0 0,1 102,33 A 10,10 0 0,1 148,42 Z';

const HIGHLIGHT_PATH =
  'M 14,40 A 9,9 0 0,1 23,32 A 13,13 0 0,1 48,25 A 11,11 0 0,1 69,29 A 13,13 0 0,1 101,33 A 9,9 0 0,1 146,40';

const COLOR_MAP = {
  sky: {
    waterFrom: '#38BDF8',
    waterTo: '#0EA5E9',
    stroke: '#38BDF8',
    text: '#0284C7',
    wave: 'rgba(255,255,255,0.2)',
  },
  emerald: {
    waterFrom: '#34D399',
    waterTo: '#10B981',
    stroke: '#34D399',
    text: '#059669',
    wave: 'rgba(255,255,255,0.2)',
  },
};

export const CloudProgress: React.FC<CloudProgressProps> = ({ pct, color, topicId }) => {
  const c = COLOR_MAP[color];
  const cloudBottom = 42;
  const cloudTop = 25;
  const fillRange = cloudBottom - cloudTop;
  const waterY = cloudBottom - (pct / 100) * fillRange;

  const uid = `cp-${topicId}`;

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 160 50" className="w-full h-full" fill="none">
        <defs>
          <clipPath id={`${uid}-clip`}>
            <path d={CLOUD_PATH} />
          </clipPath>
          <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.waterFrom} />
            <stop offset="100%" stopColor={c.waterTo} />
          </linearGradient>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
        </defs>

        {/* Depth shadow */}
        <path d={CLOUD_PATH} fill="rgba(0,0,0,0.06)" transform="translate(0, 2)" />

        {/* Cloud body (glass background) */}
        <path d={CLOUD_PATH} fill={`url(#${uid}-body)`} />

        {/* Water fill clipped to cloud shape */}
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="0" y={waterY} width="160" height={cloudBottom - waterY} fill={`url(#${uid}-water)`} />

          {/* Animated wave */}
          {pct > 0 && pct < 100 && (
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -12,0; 0,0"
                dur="4s"
                repeatCount="indefinite"
              />
              <path
                d={`M -20,${waterY} Q 0,${waterY - 2} 20,${waterY} T 60,${waterY} T 100,${waterY} T 140,${waterY} T 180,${waterY} L 180,50 L -20,50 Z`}
                fill={c.wave}
              />
            </g>
          )}
        </g>

        {/* Glass top highlight */}
        <path d={HIGHLIGHT_PATH} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" opacity={pct === 0 ? 1 : 0.5} />

        {/* Cloud outline */}
        <path d={CLOUD_PATH} stroke={c.stroke} strokeWidth="1.5" opacity="0.8" />

        {/* Percentage text */}
        <text
          x="80"
          y="36"
          textAnchor="middle"
          fill={c.text}
          className="text-[10px] font-black"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {pct}%
        </text>
      </svg>
    </div>
  );
};
