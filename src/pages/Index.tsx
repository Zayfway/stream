import React, { useState } from 'react';
import {
  getTrendingMovies,
  getTrendingTVShows,
  getPopularMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getTopRatedMovies,
  getTopRatedTVShows,
  getOnAirTVShows,
  getAcclaimed,
  discoverByGenre,
  MOVIE_GENRES,
  SearchResults,
} from '@/utils/api';
import HeroCarousel from '@/components/HeroCarousel';
import BrowseByProvider from '@/components/BrowseByProvider';
import ContinueWatching from '@/components/ContinueWatching';
import LazyRail from '@/components/LazyRail';
import Navbar from '@/components/Navbar';
import PageBackdrop from '@/components/PageBackdrop';

interface RailDef {
  title: string;
  fetcher: () => Promise<SearchResults>;
  tagType?: 'movie' | 'tv';
  viewAllLink?: string;
  accent?: boolean;
}

// Stable (module-scoped) rail list so LazyRails don't refetch on re-render.
const RAILS: RailDef[] = [
  { title: 'Tendances films', fetcher: () => getTrendingMovies('week'), tagType: 'movie', viewAllLink: '/movies', accent: true },
  { title: 'Tendances séries', fetcher: () => getTrendingTVShows('week'), tagType: 'tv', viewAllLink: '/tv-shows', accent: true },
  { title: 'Populaires en ce moment', fetcher: () => getPopularMovies(), tagType: 'movie', viewAllLink: '/movies' },
  { title: 'En salle', fetcher: () => getNowPlayingMovies(), tagType: 'movie', viewAllLink: '/movies?tab=now-playing' },
  { title: 'Bientôt au cinéma', fetcher: () => getUpcomingMovies(), tagType: 'movie' },
  { title: 'Films les mieux notés', fetcher: () => getTopRatedMovies(), tagType: 'movie', viewAllLink: '/movies?tab=top-rated' },
  { title: 'Séries les mieux notées', fetcher: () => getTopRatedTVShows(), tagType: 'tv', viewAllLink: '/tv-shows?tab=top-rated' },
  { title: 'Séries du moment', fetcher: () => getOnAirTVShows(), tagType: 'tv', viewAllLink: '/tv-shows' },
  { title: 'Acclamés par la critique', fetcher: () => getAcclaimed('movie'), tagType: 'movie', accent: true },
  { title: 'Séries acclamées', fetcher: () => getAcclaimed('tv'), tagType: 'tv' },
  // Genre rails — lots to scroll through when you don't know what to watch
  ...MOVIE_GENRES.map((g) => ({
    title: g.name,
    fetcher: () => discoverByGenre('movie', g.id),
    tagType: 'movie' as const,
  })),
];

const Index: React.FC = () => {
  const [heroBackdrop, setHeroBackdrop] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <PageBackdrop url={heroBackdrop} />

      <div className="relative z-10">
        <Navbar />
        <HeroCarousel onBackdrop={setHeroBackdrop} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-24 space-y-1">
          <ContinueWatching />
          <BrowseByProvider />

          {RAILS.map((r) => (
            <LazyRail
              key={r.title}
              title={r.title}
              fetcher={r.fetcher}
              tagType={r.tagType}
              viewAllLink={r.viewAllLink}
              accent={r.accent}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
