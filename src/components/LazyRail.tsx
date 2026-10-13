import React, { useEffect, useRef, useState } from 'react';
import { Media, SearchResults } from '@/utils/api';
import MediaRail from './MediaRail';

interface LazyRailProps {
  title: string;
  fetcher: () => Promise<SearchResults>;
  tagType?: 'movie' | 'tv';
  viewAllLink?: string;
  accent?: boolean;
}

/**
 * A content rail that only fetches its data once it scrolls near the viewport.
 * Lets the home stack many categories without firing dozens of requests upfront.
 */
const LazyRail: React.FC<LazyRailProps> = ({ title, fetcher, tagType, viewAllLink, accent }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    fetcher()
      .then((d) => {
        if (cancelled) return;
        const list = (d.results || []).filter((m) => m.poster_path);
        setItems(
          tagType ? list.map((m) => ({ ...m, media_type: m.media_type || tagType })) : list
        );
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [started, fetcher, tagType]);

  // Hide a rail that resolved empty
  if (started && !loading && items.length === 0) return <div ref={ref} />;

  return (
    <div ref={ref}>
      <MediaRail
        title={title}
        medias={items}
        isLoading={!started || loading}
        viewAllLink={viewAllLink}
        accent={accent}
      />
    </div>
  );
};

export default LazyRail;
