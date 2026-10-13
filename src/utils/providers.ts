export interface Provider {
  id: string;
  name: string;
  movieUrl: string;
  tvUrl: string;
  warning?: string;
  script?: string;
  isHLSPlayer?: boolean;
}

/*
  Playback sources (user-managed)
  --------------------------------
  MeyStream ships with bundled default sources. Each user can also add their OWN
  source(s) from Settings > Sources. Entries are stored in localStorage (this device).

  Playback URLs support the tokens {tmdb_id}, {season_number}, {episode_number},
  substituted at playback time.
*/

export const SOURCES_KEY = 'meystream-sources';
export const DEFAULT_SOURCE_KEY = 'favoriteProvider';
export const SOURCES_UPDATED_EVENT = 'meystream-sources-updated';

export const notifySourcesUpdated = () => {
  window.dispatchEvent(new Event(SOURCES_UPDATED_EVENT));
};

/*
  ►► SOURCES PAR DÉFAUT ◄◄
  Catalogue complet des 14 providers compatibles TMDB.
*/
export const DEFAULT_SOURCES: Provider[] = [
  // --- TES SOURCES D'ORIGINE ---
  {
    id: 'vidsrc',
    name: 'Vidsrc.su ⭐',
    movieUrl: 'https://vidsrc.su/movie/{tmdb_id}',
    tvUrl: 'https://vidsrc.su/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Best server'
  },
  {
    id: 'vidfast',
    name: 'Vidfast',
    movieUrl: 'https://vidfast.pro/movie/{tmdb_id}',
    tvUrl: 'https://vidfast.pro/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Use Adblocker'
  },
  {
    id: 'videasy',
    name: 'Videasy',
    movieUrl: 'https://player.videasy.net/movie/{tmdb_id}',
    tvUrl: 'https://player.videasy.net/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Use Adblocker'
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    movieUrl: 'https://embed.su/embed/movie/{tmdb_id}',
    tvUrl: 'https://embed.su/embed/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Use Adblocker'
  },
  {
    id: 'vidsrcvip',
    name: 'VidSrc.vip',
    movieUrl: 'https://vidsrc.vip/embed/movie/{tmdb_id}',
    tvUrl: 'https://vidsrc.vip/embed/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Use Adblocker'
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    movieUrl: 'https://player.autoembed.cc/embed/movie/{tmdb_id}',
    tvUrl: 'https://player.autoembed.cc/embed/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Use Adblocker'
  },
  {
    id: '2embed',
    name: '2Embed',
    movieUrl: 'https://www.2embed.cc/embed/{tmdb_id}',
    tvUrl: 'https://www.2embed.cc/embedtv/{tmdb_id}&s={season_number}&e={episode_number}',
    warning: 'Use Adblocker'
  },
  // --- NOUVELLES SOURCES AJOUTÉES ---
  {
    id: 'vidlink',
    name: 'VidLink.pro ⚡',
    movieUrl: 'https://vidlink.pro/movie/{tmdb_id}',
    tvUrl: 'https://vidlink.pro/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Ultra Fast / Responsive'
  },
  {
    id: 'vixsrc',
    name: 'VixSrc',
    movieUrl: 'https://vixsrc.to/movie/{tmdb_id}',
    tvUrl: 'https://vixsrc.to/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Good quality'
  },
  {
    id: 'vidsrccc',
    name: 'VidSrc CC',
    movieUrl: 'https://vidsrc.cc/v2/embed/movie/{tmdb_id}',
    tvUrl: 'https://vidsrc.cc/v2/embed/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Multi-streams'
  },
  {
    id: 'vidsrcto',
    name: 'VidSrc.to',
    movieUrl: 'https://vidsrc.to/embed/movie/{tmdb_id}',
    tvUrl: 'https://vidsrc.to/embed/tv/{tmdb_id}/{season_number}/{episode_number}',
    warning: 'Use Adblocker'
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    movieUrl: 'https://multiembed.mov/?video_id={tmdb_id}&tmdb=1',
    tvUrl: 'https://multiembed.mov/?video_id={tmdb_id}&tmdb=1&s={season_number}&e={episode_number}',
    warning: 'Multiple server fallbacks'
  },
  {
    id: 'smashystream',
    name: 'SmashyStream',
    movieUrl: 'https://player.smashy.stream/movie/{tmdb_id}',
    tvUrl: 'https://player.smashy.stream/tv/{tmdb_id}?s={season_number}&e={episode_number}',
    warning: 'Good backup'
  },
  {
    id: 'moviesapi',
    name: 'MoviesAPI',
    movieUrl: 'https://moviesapi.club/movie/{tmdb_id}',
    tvUrl: 'https://moviesapi.club/tv/{tmdb_id}-{season_number}-{episode_number}',
    warning: 'Fast loading'
  }
];

export const providers = DEFAULT_SOURCES;

export const getSources = (): Provider[] => {
  let stored: Provider[] = [];
  try {
    const raw = localStorage.getItem(SOURCES_KEY);
    stored = raw ? (JSON.parse(raw) as Provider[]) : [];
  } catch {
    stored = [];
  }
  const storedIds = new Set(stored.map((s) => s.id));
  return [...DEFAULT_SOURCES.filter((s) => !storedIds.has(s.id)), ...stored];
};

export const saveSources = (list: Provider[]): void => {
  try {
    localStorage.setItem(SOURCES_KEY, JSON.stringify(list));
    notifySourcesUpdated();
  } catch {
    /* ignore */
  }
};

export const addSource = (s: Provider): void => {
  const list = getSources();
  saveSources([...list.filter((x) => x.id !== s.id), s]);
};

export const updateSource = (s: Provider): void => {
  const list = getSources().map((x) => (x.id === s.id ? s : x));
  saveSources(list);
};

export const removeSource = (id: string): void => {
  saveSources(getSources().filter((x) => x.id !== id));
};

export const hasProviders = (): boolean => getSources().length > 0;

export const getFavoriteProviderId = (): string => {
  try {
    return localStorage.getItem(DEFAULT_SOURCE_KEY) || getSources()[0]?.id || 'vidsrc';
  } catch {
    return getSources()[0]?.id || 'vidsrc';
  }
};

export const setFavoriteProvider = (providerId: string): void => {
  try {
    localStorage.setItem(DEFAULT_SOURCE_KEY, providerId);
    notifySourcesUpdated();
  } catch {
    /* ignore */
  }
};

export const getDefaultProvider = (): Provider | null => {
  const list = getSources();
  if (list.length === 0) return null;
  const favoriteId = getFavoriteProviderId();
  return list.find((p) => p.id === favoriteId) || list[0];
};
