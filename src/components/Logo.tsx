import React from 'react';

/**
 * MeyStream mark — three flowing streams converging into a play point.
 * Reads as "stream" and "play" at once; no letter, no clapperboard.
 * Strokes take the live theme gradient, so the mark re-tints with every theme.
 */
const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="meyMarkGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: 'hsl(var(--brand))' }} />
        <stop offset="1" style={{ stopColor: 'hsl(var(--brand-2))' }} />
      </linearGradient>
    </defs>
    <g stroke="url(#meyMarkGradient)" strokeWidth="3.2" strokeLinecap="round" fill="none">
      <path d="M6 9.5C13 9.5 18 12.5 26 16" />
      <path d="M6 16C13 16 18 16 26 16" opacity="0.85" />
      <path d="M6 22.5C13 22.5 18 19.5 26 16" />
    </g>
  </svg>
);

export default Logo;
