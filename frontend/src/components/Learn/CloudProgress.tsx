'use client';

import React from 'react';

interface CloudProgressProps {
  pct: number;
  color: 'sky' | 'emerald';
  topicId: string;
}

const CLOUD_PATH = 'M 25,80 A 15,15 0 0,1 45,50 A 20,20 0 0,1 95,35 A 18,18 0 0,1 130,55 A 14,14 0 0,1 145,80 Z';

const COLOR_MAP = {
  sky: {
    waterFrom: '#0ea5e9',
    waterTo: '#1d4ed8',
    stroke: '#38bdf8',
    text: '#0284c7',
    waveBack: 'rgba(56, 189, 248, 0.4)',
    waveFront: 'rgba(255, 255, 255, 0.45)',
    glow: '#0ea5e9',
    innerWall: 'linear-gradient(to bottom, #e0f2fe, #bae6fd)',
  },
  emerald: {
    waterFrom: '#10b981',
    waterTo: '#064e3b',
    stroke: '#34d399',
    text: '#047857',
    waveBack: 'rgba(52, 211, 153, 0.4)',
    waveFront: 'rgba(255, 255, 255, 0.45)',
    glow: '#10b981',
    innerWall: 'linear-gradient(to bottom, #d1fae5, #a7f3d0)',
  },
};

export const CloudProgress: React.FC<CloudProgressProps> = ({ pct, color, topicId }) => {
  const c = COLOR_MAP[color];
  const cloudBottom = 80;
  const cloudTop = 35;
  const fillRange = cloudBottom - cloudTop;
  const waterY = cloudBottom - (pct / 100) * fillRange;

  const uid = `cp-${topicId}`;

  // Custom wave paths
  const getWavePath = () => {
    return `M 0,${waterY} Q 20,${waterY - 3.5} 40,${waterY} T 80,${waterY} T 120,${waterY} T 160,${waterY} T 200,${waterY} T 240,${waterY} L 240,100 L 0,100 Z`;
  };

  const getWavePathFront = () => {
    return `M 0,${waterY} Q 20,${waterY - 2} 40,${waterY} T 80,${waterY} T 120,${waterY} T 160,${waterY} T 200,${waterY} T 240,${waterY} L 240,100 L 0,100 Z`;
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <svg 
        viewBox="20 15 130 70" 
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)]" 
        fill="none"
      >
        <defs>
          {/* Clipping path to restrict contents strictly inside the cloud */}
          <clipPath id={`${uid}-clip`}>
            <path d={CLOUD_PATH} />
          </clipPath>
          
          {/* Gradient for liquid/water */}
          <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.waterFrom} />
            <stop offset="100%" stopColor={c.waterTo} />
          </linearGradient>
          
          {/* Glass base gradient */}
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
          </linearGradient>

          {/* Radial 3D Gloss reflection gradient overlay */}
          <radialGradient id={`${uid}-gloss`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
            <stop offset="45%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="75%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0.18)" />
          </radialGradient>

          {/* Diagonal sheen reflection overlay */}
          <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="35%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="45%" stopColor="rgba(255, 255, 255, 0.35)" />
            <stop offset="48%" stopColor="rgba(255, 255, 255, 0.55)" />
            <stop offset="51%" stopColor="rgba(255, 255, 255, 0.35)" />
            <stop offset="60%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>

          {/* Metallic rim stroke gradient */}
          <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor={c.stroke} />
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={c.stroke} />
          </linearGradient>

          {/* Soft outer glow shadow */}
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComponentTransfer in="blur" result="glow1">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Drop Shadow behind cloud */}
        <path d={CLOUD_PATH} fill="rgba(15, 23, 42, 0.06)" transform="translate(0, 4.5)" />

        {/* 2. Glass Cloud Outer Capsule Container */}
        <path 
          d={CLOUD_PATH} 
          fill={`url(#${uid}-body)`} 
          stroke={`url(#${uid}-rim)`}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ filter: `url(#${uid}-glow)` }}
        />

        {/* 3. Water Filling (Clipped Inside Cloud Capsule) */}
        {pct > 0 && (
          <g clipPath={`url(#${uid}-clip)`}>
            {/* Solid fill for completed, wave animation system for partial */}
            {pct === 100 ? (
              <path d={CLOUD_PATH} fill={`url(#${uid}-water)`} />
            ) : (
              <>
                {/* Background base water */}
                <rect x="0" y={waterY} width="180" height="100" fill={`url(#${uid}-water)`} />
                
                {/* Animated Back Wave */}
                <g className={`wave-back-${uid}`}>
                  <path d={getWavePath()} fill={c.waveBack} />
                </g>

                {/* Animated Front Wave */}
                <g className={`wave-front-${uid}`}>
                  <path d={getWavePathFront()} fill={c.waveFront} />
                </g>

                {/* Floating micro-bubbles rising from bottom */}
                <circle cx="45" cy="72" r="1.3" fill="#ffffff" className={`bubble-1-${uid}`} opacity="0.6" />
                <circle cx="75" cy="75" r="1.8" fill="#ffffff" className={`bubble-2-${uid}`} opacity="0.5" />
                <circle cx="105" cy="69" r="1.1" fill="#ffffff" className={`bubble-3-${uid}`} opacity="0.7" />
                <circle cx="125" cy="73" r="1.4" fill="#ffffff" className={`bubble-4-${uid}`} opacity="0.6" />
              </>
            )}
          </g>
        )}

        {/* 4. Inset Shadow/Dark Rim Overlay inside the capsule (Clipped) */}
        <g clipPath={`url(#${uid}-clip)`} style={{ mixBlendMode: 'multiply' }}>
          <path 
            d={CLOUD_PATH} 
            stroke="rgba(15, 23, 42, 0.15)" 
            strokeWidth="3.5" 
            fill="none" 
          />
        </g>

        {/* 5. 3D Radial Gloss overlay sitting on top of water */}
        <path d={CLOUD_PATH} fill={`url(#${uid}-gloss)`} style={{ mixBlendMode: 'overlay' }} />

        {/* 6. Diagonal Sheen reflection */}
        <path d={CLOUD_PATH} fill={`url(#${uid}-sheen)`} style={{ mixBlendMode: 'screen' }} />

        {/* 7. Glass Highlight Arc along upper curves */}
        <path 
          d="M 28,73 A 13,13 0 0,1 45,51 A 19,19 0 0,1 95,36 A 17,17 0 0,1 130,56" 
          stroke="rgba(255, 255, 255, 0.75)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none" 
        />

        {/* 8. Outlined Centered Text / Checkmark Badge */}
        {pct === 100 ? (
          /* High contrast checkmark path */
          <g>
            <path
              d="M 75,51 L 81,57 L 95,41"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 75,51 L 81,57 L 95,41"
              fill="none"
              stroke={c.text}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : (
          /* Text Percentage display with high-visibility stroke mask */
          <g>
            <text
              x="85"
              y="54"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinejoin="round"
              className="text-[13px] font-black tracking-tight select-none font-heading"
            >
              {pct}%
            </text>
            <text
              x="85"
              y="54"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={c.text}
              className="text-[13px] font-black tracking-tight select-none font-heading"
            >
              {pct}%
            </text>
          </g>
        )}

        {/* Scoped CSS animations for waves and bubbles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes waveMove-${uid} {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-80px, 0, 0); }
          }
          @keyframes bubbleRise-${uid} {
            0% { transform: translate3d(0, 10px, 0); opacity: 0; }
            20% { opacity: 0.8; }
            80% { opacity: 0.8; }
            100% { transform: translate3d(0, -30px, 0); opacity: 0; }
          }
          .wave-back-${uid} {
            animation: waveMove-${uid} 4.2s linear infinite;
          }
          .wave-front-${uid} {
            animation: waveMove-${uid} 2.6s linear infinite;
          }
          .bubble-1-${uid} {
            animation: bubbleRise-${uid} 3.4s ease-in-out infinite;
          }
          .bubble-2-${uid} {
            animation: bubbleRise-${uid} 4.4s ease-in-out infinite 1s;
          }
          .bubble-3-${uid} {
            animation: bubbleRise-${uid} 2.9s ease-in-out infinite 0.5s;
          }
          .bubble-4-${uid} {
            animation: bubbleRise-${uid} 3.9s ease-in-out infinite 1.8s;
          }
        ` }} />
      </svg>
    </div>
  );
};
