import React from 'react';

/**
 * A fixed, full-viewport blurred banner behind the whole page, with a smooth
 * vertical scrim. Because it is one fixed layer with no section boundaries,
 * there is never a horizontal seam: the hero image above simply masks its
 * bottom into this, and every rail scrolls over a continuous colour wash that
 * re-tints to the current title.
 */
const PageBackdrop: React.FC<{ url: string | null }> = ({ url }) => {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 kenburns transition-[background-image] duration-700"
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(64px) saturate(1.3)',
          opacity: 0.55,
        }}
      />
      {/* Scrim: let the banner breathe near the top, settle into the base
          background further down so deep content stays readable. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-background" />
    </div>
  );
};

export default PageBackdrop;
