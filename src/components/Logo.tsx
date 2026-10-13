import React from 'react';

/**
 * MeyStream mark — a bold "M" monogram (two peaks, reads as motion / sound
 * waves) in a rounded squircle. The gradient pulls from the live theme vars,
 * so the logo re-tints with every theme.
 */
const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="meyLogoGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: 'hsl(var(--brand))' }} />
        <stop offset="1" style={{ stopColor: 'hsl(var(--brand-2))' }} />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#meyLogoGradient)" />
    <path
      d="M8 23V11L16 19L24 11V23"
      stroke="white"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
