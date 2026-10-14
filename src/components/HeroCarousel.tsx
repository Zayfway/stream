import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrending, getImageUrl, Media } from '@/utils/api';
import {
  Play,
  Info,
  Plus,
  Check,
  Star,
} from 'lucide-react';
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  WATCHLIST_UPDATED_EVENT,
} from '@/utils/watchlist';

const SLIDE_MS = 8000;
const MAX_SLIDES = 7;

const typeOf = (m: Media): 'movie' | 'tv' =>
  (m.media_type as 'movie' | 'tv') || (m.first_air_date ? 'tv' : 'movie');

const yearOf = (m: Media): string => {
  const d = m.release_date || m.first_air_date;
  return d ? String(new Date(d).getFullYear()) : '';
};

const HeroCarousel: React.FC<{ onBackdrop?: (url: string | null) => void }> = ({ onBackdrop }) => {
  const [slides, setSlides] = useState<Media[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inList, setInList] = useState(false);
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch featured titles
  useEffect(() => {
    let cancelled = false;
    getTrending('day')
      .then((data) => {
        if (cancelled) return;
        const withArt = data.results
          .filter((m) => m.backdrop_path && (m.title || m.name) && m.overview)
          .slice(0, MAX_SLIDES);
        setSlides(withArt);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-advance
  const scheduleNext = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setActive((i) => (slides.length ? (i + 1) % slides.length : 0));
    }, SLIDE_MS);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length || paused) return;
    scheduleNext();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active, slides.length, paused, scheduleNext]);

  // Keep the "in my list" state in sync for the active slide
  const current = slides[active];

  // Surface the active backdrop so the page can bleed it as an ambient layer
  useEffect(() => {
    if (current) onBackdrop?.(getImageUrl(current.backdrop_path, 'w780'));
  }, [current, onBackdrop]);
  useEffect(() => {
    if (!current) return;
    const sync = () => setInList(isInWatchlist(current.id));
    sync();
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
  }, [current]);

  if (!slides.length) {
    return (
      <div className="w-full h-[78vh] sm:h-[85vh] min-h-[520px] bg-card animate-pulse flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-white/70 border-t-transparent animate-spin" />
      </div>
    );
  }

  const type = typeOf(current);
  const title = current.title || current.name || '';

  const toggleList = () => {
    if (isInWatchlist(current.id)) removeFromWatchlist(current.id);
    else addToWatchlist(current);
  };

  return (
    <div
      className="relative w-full h-[78vh] sm:h-[85vh] min-h-[520px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Visual layer (image + readability gradient) masked as ONE block so its
          bottom dissolves into the fixed page backdrop — no seam anywhere. */}
      <div
        className="absolute inset-0"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, #000 46%, transparent 98%)',
          maskImage: 'linear-gradient(to bottom, #000 46%, transparent 98%)',
        }}
      >
        {slides.map((m, i) => {
          const url = getImageUrl(m.backdrop_path, 'original');
          return (
            <div
              key={m.id}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={i !== active}
            >
              {url && (
                <img
                  src={url}
                  alt={m.title || m.name || ''}
                  className="w-full h-full object-cover object-center"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-end">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-[4.5rem] sm:pb-20 text-left">
          <div key={current.id} className="max-w-2xl animate-slide-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white text-shadow-lg">
              {title}
            </h1>

            <div className="mt-4 flex items-center flex-wrap gap-3 text-white/85">
              {current.vote_average > 0 && (
                <span className="flex items-center gap-1 font-semibold">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  {Math.round(current.vote_average * 10) / 10}
                </span>
              )}
              {yearOf(current) && <span>{yearOf(current)}</span>}
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-full border border-white/25 bg-white/10">
                {type === 'tv' ? 'Série' : 'Film'}
              </span>
            </div>

            <p className="mt-4 text-base sm:text-lg text-white/85 line-clamp-2 sm:line-clamp-3">
              {current.overview}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(`/watch/${type}/${current.id}`)}
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3 font-bold text-black transition hover:bg-white/90 shadow-lg"
              >
                <Play size={20} className="fill-black" /> Regarder
              </button>

              <button
                onClick={toggleList}
                aria-label={inList ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {inList ? <Check size={22} /> : <Plus size={22} />}
              </button>

              <button
                onClick={() => navigate(`/details/${type}/${current.id}`)}
                aria-label="Détails"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Info size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented progress indicator */}
      <div className="absolute bottom-6 left-4 sm:left-auto sm:bottom-20 sm:right-10 z-10 flex items-center gap-2">
        {slides.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            aria-label={`Aller au titre ${i + 1}`}
            className={`h-1.5 rounded-full overflow-hidden transition-all duration-300 ${
              i === active ? 'w-10 bg-white/25' : 'w-2.5 bg-white/40 hover:bg-white/70'
            }`}
          >
            {i === active && (
              <span
                key={active}
                className="block h-full w-full bg-white hero-fill"
                style={{ ['--hero-dur' as string]: `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
