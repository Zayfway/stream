import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MediaGrid from '@/components/MediaGrid';
import { Media, discoverByProvider, getProviderLogoUrl } from '@/utils/api';
import {
  getProviderById,
  expandProviderIds,
  getWatchRegion,
} from '@/utils/watchProviders';
import { ArrowLeft } from 'lucide-react';

const ProviderResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const providerId = Number(id);
  const provider = getProviderById(providerId);

  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId || Number.isNaN(providerId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const ids = expandProviderIds(providerId);
    const region = getWatchRegion();

    Promise.all([
      discoverByProvider('movie', ids, { region }).catch(() => null),
      discoverByProvider('tv', ids, { region }).catch(() => null),
    ])
      .then(([movies, tv]) => {
        if (cancelled) return;
        // Interleave movies & TV (both already popularity-sorted by TMDB)
        const mv = (movies?.results || []).map((m) => ({ ...m, media_type: 'movie' as const }));
        const tvv = (tv?.results || []).map((m) => ({ ...m, media_type: 'tv' as const }));
        const merged: Media[] = [];
        for (let i = 0; i < Math.max(mv.length, tvv.length); i++) {
          if (mv[i]) merged.push(mv[i]);
          if (tvv[i]) merged.push(tvv[i]);
        }
        setItems(merged.filter((m) => m.poster_path));
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-left">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          {provider ? (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={getProviderLogoUrl(provider.logo, 'w154')}
                  alt={provider.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {provider.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Disponible sur ce service · via TMDB &amp; JustWatch
                </p>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-white">Provider</h1>
          )}
        </div>

        <MediaGrid title="" medias={items} isLoading={loading} />

        {!loading && items.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Rien à afficher pour ce service dans ta région ({getWatchRegion()}).
          </p>
        )}
      </div>
    </div>
  );
};

export default ProviderResults;
