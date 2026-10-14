import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { getImageUrl } from '@/utils/api';
import {
  getHistory,
  removeFromHistory,
  HistoryEntry,
  HISTORY_UPDATED_EVENT,
} from '@/lib/history';

const typeOf = (m: HistoryEntry): 'movie' | 'tv' =>
  (m.media_type as 'movie' | 'tv') || (m.first_air_date ? 'tv' : 'movie');

const ContinueWatching: React.FC = () => {
  const [items, setItems] = useState<HistoryEntry[]>(getHistory);
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setItems(getHistory());
    window.addEventListener(HISTORY_UPDATED_EVENT, sync);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, sync);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-5 text-left">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Reprendre</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x">
        {items.map((m) => {
          const type = typeOf(m);
          const title = m.title || m.name || '';
          const img = getImageUrl(m.backdrop_path || m.poster_path, 'w780');
          return (
            <div key={m.id} className="group shrink-0 w-[260px] sm:w-[300px] snap-start">
              <div
                onClick={() => navigate(`/details/${type}/${m.id}`)}
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/10"
              >
                {img ? (
                  <img src={img} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="h-full w-full bg-card" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <button
                  onClick={(e) => { e.stopPropagation(); removeFromHistory(m.id); }}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 transition hover:text-white"
                  aria-label="Retirer"
                >
                  <X size={14} />
                </button>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
                    <Play size={22} className="fill-black ml-0.5" />
                  </span>
                </div>

                {typeof m.progress === 'number' && m.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-brand-gradient" style={{ width: `${Math.min(100, m.progress * 100)}%` }} />
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-white truncate">{title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatching;
