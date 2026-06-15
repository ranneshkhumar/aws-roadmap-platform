'use client';

import React from 'react';

interface CloudProgressProps {
  pct: number;
  color: 'sky' | 'emerald';
  topicId: string;
}

const CLOUD_PATH =
  'M 6,54 A 12,12 0 0,1 18,42 A 16,16 0 0,1 50,30 A 14,14 0 0,1 78,38 A 12,12 0 0,1 94,54 Z';

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
  const cloudBottom = 54;
  const cloudTop = 30;
  const fillRange = cloudBottom - cloudTop;
  const waterY = cloudBottom - (pct / 100) * fillRange;

  const uid = `cp-${topicId}`;

  return (
    <div className="w-[110px] h-[64px] flex-shrink-0">
      <svg viewBox="0 0 100 60" className="w-full h-full" fill="none">
        <defs>
          <clipPath id={`${uid}-clip`}>
            <path d={CLOUD_PATH} />
          </clipPath>
          <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.waterFrom} />
            <stop offset="100%" stopColor={c.waterTo} />
          </linearGradient>
        </defs>

        {/* Cloud outline */}
        <path d={CLOUD_PATH} stroke={c.stroke} strokeWidth="1.8" opacity="0.85" />

        {/* Water fill clipped to cloud shape */}
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="0" y={waterY} width="100" height={cloudBottom - waterY} fill={`url(#${uid}-water)`} />

          {/* Animated wave surface */}
          {pct > 0 && pct < 100 && (
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -10,0; 0,0"
                dur="4s"
                repeatCount="indefinite"
              />
              <path
                d={`M -15,${waterY} Q 0,${waterY - 2.5} 12,${waterY} T 35,${waterY} T 58,${waterY} T 80,${waterY} T 105,${waterY} T 125,${waterY} L 125,60 L -15,60 Z`}
                fill={c.wave}
              />
            </g>
          )}
        </g>

        {/* Percentage text */}
        <text
          x="50"
          y="49"
          textAnchor="middle"
          fill={c.text}
          className="text-[11px] font-black"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {pct}%
        </text>
      </svg>
    </div>
  );
};
