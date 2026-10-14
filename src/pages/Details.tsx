import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MediaDetails,
  getMediaDetails,
  getRecommendations,
  getCredits,
  getVideos,
  getTitleWatchProviders,
  getImageUrl,
  getProviderLogoUrl,
  CastMember,
  Video,
  WatchProvider,
  Media,
} from '@/utils/api';
import { getWatchRegion } from '@/utils/watchProviders';
import { recordView } from '@/lib/history';
import Navbar from '@/components/Navbar';
import PageBackdrop from '@/components/PageBackdrop';
import MediaRail from '@/components/MediaRail';
import WatchlistButton from '@/components/WatchlistButton';
import Loader from '@/components/Loader';
import { Play, Star, X } from 'lucide-react';

const money = (n?: number) =>
  n && n > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—';

const Details: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const mt = (type as 'movie' | 'tv') || 'movie';

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [recs, setRecs] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailer, setTrailer] = useState<Video | null>(null);

  useEffect(() => {
    if (!type || !id) return;
    let cancelled = false;
    setLoading(true);
    window.scrollTo(0, 0);

    Promise.all([
      getMediaDetails(id, mt),
      getRecommendations(id, mt).catch(() => null),
      getCredits(id, mt).catch(() => null),
      getVideos(id, mt).catch(() => null),
      getTitleWatchProviders(id, mt).catch(() => null),
    ]).then(([d, r, c, v, wp]) => {
      if (cancelled) return;
      setDetails(d);
      setCast(c?.cast?.slice(0, 16) || []);
      setVideos(
        (v?.results || []).filter((x) => x.site === 'YouTube' && ['Trailer', 'Teaser'].includes(x.type))
      );
      const region = getWatchRegion();
      setProviders(wp?.results?.[region]?.flatrate || []);
      setRecs((r?.results || []).map((m) => ({ ...m, media_type: mt })).slice(0, 18));
      // Continue Watching
      recordView({
        id: d.id,
        title: d.title,
        name: d.name,
        poster_path: d.poster_path,
        backdrop_path: d.backdrop_path,
        overview: d.overview,
        vote_average: d.vote_average,
        release_date: d.release_date,
        first_air_date: d.first_air_date,
        media_type: mt,
        genre_ids: d.genres?.map((g) => g.id) || [],
      });
    }).finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [type, id, mt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center items-center h-[70vh]"><Loader size="large" /></div>
      </div>
    );
  }
  if (!details) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 text-center">
          <h1 className="text-2xl font-bold text-white">Introuvable</h1>
        </div>
      </div>
    );
  }

  const backdrop = getImageUrl(details.backdrop_path, 'original');
  const title = details.title || details.name || '';
  const year = (details.release_date || details.first_air_date || '').slice(0, 4);
  const runtime = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : details.episode_run_time?.[0]
    ? `${details.episode_run_time[0]}m`
    : details.number_of_seasons
    ? `${details.number_of_seasons} saison${details.number_of_seasons > 1 ? 's' : ''}`
    : '—';

  const mediaForList: Media = {
    id: details.id, title: details.title || '', name: details.name || '',
    poster_path: details.poster_path, backdrop_path: details.backdrop_path,
    release_date: details.release_date || '', first_air_date: details.first_air_date || '',
    vote_average: details.vote_average, media_type: mt, overview: details.overview,
    genre_ids: details.genres.map((g) => g.id),
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <PageBackdrop url={backdrop} />

      <div className="relative z-10">
        <Navbar />

        {/* Backdrop (sharp) — image + gradient masked as ONE block so the bottom
            dissolves into the fixed page backdrop with no seam. */}
        <div className="relative w-full h-[62vh] min-h-[420px]">
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 44%, transparent 98%)',
              maskImage: 'linear-gradient(to bottom, #000 44%, transparent 98%)',
            }}
          >
            {backdrop && (
              <img
                src={backdrop}
                alt={title}
                className="w-full h-full object-cover object-center animate-blur-in"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/20 to-transparent" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 -mt-56 sm:-mt-64 relative">
          <div className="grid lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
            {/* Main */}
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white text-shadow-lg">{title}</h1>

              {details.genres.length > 0 && (
                <p className="mt-3 text-white/70 font-medium">
                  {details.genres.map((g) => g.name).join(' · ')}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/watch/${mt}/${id}`)}
                  className="flex items-center gap-2 rounded-full bg-white px-7 py-3 font-bold text-black transition hover:bg-white/90 shadow-lg"
                >
                  <Play size={20} className="fill-black" /> Regarder
                </button>
                <WatchlistButton media={mediaForList} variant="button" size={18} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
                {year && <span>{year}</span>}
                <span>{runtime}</span>
                {details.vote_average > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={15} className="fill-yellow-400 text-yellow-400" />
                    {Math.round(details.vote_average * 10) / 10}
                  </span>
                )}
                <span className="uppercase text-xs px-2 py-0.5 rounded-full border border-white/20 bg-white/10">
                  {mt === 'tv' ? 'Série' : 'Film'}
                </span>
              </div>

              {details.tagline && <p className="mt-5 italic text-white/60">{details.tagline}</p>}

              <p className="mt-4 max-w-2xl text-white/85 leading-relaxed">
                {details.overview || 'Aucun synopsis disponible.'}
              </p>

              {/* Where to watch */}
              {providers.length > 0 && (
                <div className="mt-6 scroll-mt-28" id="where">
                  <p className="text-sm font-semibold text-white mb-2">Où regarder</p>
                  <div className="flex flex-wrap gap-2.5">
                    {providers.map((p) => (
                      <div key={p.provider_id} className="h-11 w-11 rounded-xl overflow-hidden border border-white/10 bg-white/5" title={p.provider_name}>
                        <img src={getProviderLogoUrl(p.logo_path, 'w92')} alt={p.provider_name} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">Dispo via JustWatch · région {getWatchRegion()}</p>
                </div>
              )}
            </div>

            {/* Info sidebar */}
            <aside className="lg:pt-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 space-y-3 text-left">
                {[
                  ['Durée', runtime],
                  ['Langue', details.original_language?.toUpperCase() || '—'],
                  ['Sortie', details.release_date || details.first_air_date || '—'],
                  mt === 'movie' ? ['Budget', money(details.budget)] : ['Saisons', String(details.number_of_seasons ?? '—')],
                  mt === 'movie' ? ['Recettes', money(details.revenue)] : ['Épisodes', String(details.number_of_episodes ?? '—')],
                  ['Statut', details.status || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 text-sm border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-white font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <section className="mt-12 text-left scroll-mt-28" id="casting">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Casting</h2>
              <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                {cast.map((c) => (
                  <div key={c.id} className="shrink-0 w-[92px] text-center">
                    <div className="h-[92px] w-[92px] rounded-full overflow-hidden border border-white/10 bg-card mx-auto">
                      {c.profile_path ? (
                        <img src={getImageUrl(c.profile_path, 'w185')!} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/40 text-2xl font-semibold">{c.name.charAt(0)}</div>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-white truncate">{c.name}</p>
                    {c.character && <p className="text-[11px] text-muted-foreground truncate">{c.character}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trailers */}
          {videos.length > 0 && (
            <section className="mt-10 text-left scroll-mt-28" id="trailers">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Bandes-annonces</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                {videos.map((v) => (
                  <button key={v.id} onClick={() => setTrailer(v)}
                    className="group shrink-0 w-[260px] text-left">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                      <img src={`https://img.youtube.com/vi/${v.key}/hqdefault.jpg`} alt={v.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black"><Play size={20} className="fill-black ml-0.5" /></span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-white/80 truncate">{v.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <div className="mt-6 pb-16">
              <MediaRail title="Dans le même genre" medias={recs} />
            </div>
          )}
        </div>
      </div>

      {/* Trailer lightbox */}
      {trailer && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTrailer(null)}>
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setTrailer(null)} className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Fermer">
              <X size={18} />
            </button>
            <iframe
              className="w-full h-full rounded-xl"
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title={trailer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Details;
