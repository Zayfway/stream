import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Media, SearchResults } from '@/utils/api';
import MediaGrid from './MediaGrid';

interface InfiniteMediaGridProps {
  /** Must be stable per "view" (wrap in useCallback keyed on the active tab). */
  fetcher: (page: number) => Promise<SearchResults>;
  tagType?: 'movie' | 'tv';
  maxPages?: number;
}

/**
 * A MediaGrid that loads more pages as the user scrolls — no pagination,
 * no page change. Resets when `fetcher` changes (e.g. switching tab).
 */
const InfiniteMediaGrid: React.FC<InfiniteMediaGridProps> = ({
  fetcher,
  tagType,
  maxPages = 500,
}) => {
  const [items, setItems] = useState<Media[]>([]);
  const [status, setStatus] = useState<'loading' | 'more' | 'idle' | 'done'>('loading');
  const pageRef = useRef(1);
  const totalRef = useRef(1);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (page: number, fresh: boolean) => {
      if (busy.current) return;
      busy.current = true;
      setStatus(fresh ? 'loading' : 'more');
      try {
        const d = await fetcher(page);
        const list = (d.results || []).filter((m) => m.poster_path);
        const tagged = tagType
          ? list.map((m) => ({ ...m, media_type: m.media_type || tagType }))
          : list;
        totalRef.current = Math.min(d.total_pages || 1, maxPages);
        pageRef.current = page;
        setItems((prev) =>
          fresh ? tagged : [...prev, ...tagged.filter((n) => !prev.some((p) => p.id === n.id))]
        );
        setStatus(page >= totalRef.current ? 'done' : 'idle');
      } catch {
        setStatus('idle');
      } finally {
        busy.current = false;
      }
    },
    [fetcher, tagType, maxPages]
  );

  // Fresh load whenever the fetcher (view) changes
  useEffect(() => {
    pageRef.current = 1;
    totalRef.current = 1;
    setItems([]);
    load(1, true);
  }, [load]);

  // Infinite scroll. Re-observe after each load settles (status change) so a
  // sentinel that is still in view keeps the chain going — IntersectionObserver
  // won't re-fire on an unchanged intersection, so recreating it re-checks.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !busy.current && pageRef.current < totalRef.current) {
          load(pageRef.current + 1, false);
        }
      },
      { rootMargin: '800px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load, status, items.length]);

  return (
    <div>
      <MediaGrid title="" medias={items} isLoading={status === 'loading'} />
      <div ref={sentinel} className="h-8" />
      {status === 'more' && (
        <div className="py-6 text-center text-muted-foreground text-sm">Chargement…</div>
      )}
      {status === 'done' && items.length > 0 && (
        <div className="py-6 text-center text-muted-foreground text-sm">C'est tout pour cette catégorie.</div>
      )}
    </div>
  );
};

export default InfiniteMediaGrid;
