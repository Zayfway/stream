import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Media } from '@/utils/api';
import MediaCard from './MediaCard';

interface MediaRailProps {
  title: string;
  medias: Media[];
  isLoading?: boolean;
  viewAllLink?: string;
  accent?: boolean;
}

const MediaRail: React.FC<MediaRailProps> = ({
  title,
  medias,
  isLoading = false,
  viewAllLink,
  accent = false,
}) => {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="py-5 text-left group/rail">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2.5">
          {accent && <span className="h-5 w-1 rounded-full bg-brand-gradient" />}
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm text-muted-foreground hover:text-white transition flex items-center gap-1">
              Voir tout <ChevronRight size={15} />
            </Link>
          )}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover/rail:opacity-100 transition">
            <button onClick={() => scroll('left')} aria-label="Précédent"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll('right')} aria-label="Suivant"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shrink-0 w-[140px] sm:w-[160px] animate-pulse">
              <div className="aspect-[2/3] rounded-lg bg-white/5" />
              <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div ref={scroller} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x">
          {medias.map((media, i) => (
            <div key={`${media.media_type || ''}-${media.id}`} className="shrink-0 w-[140px] sm:w-[160px] snap-start">
              <MediaCard media={media} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MediaRail;
