import React from 'react';
import { useBackground } from '@/contexts/BackgroundProvider';
import Aurora from './Aurora';
import LiquidBackground from './LiquidBackground';

const supportsWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch { return false; } })();
const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The theme background behind content pages (search, settings, lists…).
 * Picks the user's choice: real-time liquid, aurora, their own looping video, or nothing.
 */
const AnimatedBackground: React.FC = () => {
  const { mode, videoUrl } = useBackground();

  if (mode === 'none') return null;
  if (mode === 'video' && videoUrl) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <video src={videoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-background/45" />
      </div>
    );
  }
  if (mode === 'liquid' && supportsWebGL && !reducedMotion) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <LiquidBackground className="opacity-80" />
        <div className="absolute inset-0 bg-background/35" />
      </div>
    );
  }
  return <Aurora />;
};

export default AnimatedBackground;
