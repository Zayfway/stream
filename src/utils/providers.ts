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
    id: 'plex',
    name: 'Mon Plex Personnel (Local) 🍿',
    movieUrl: 'https://app.plex.tv/desktop/#!/provider/tv.plex.provider.discover/details?key=%2Flibrary%2Fmetadata%2F{tmdb_id}',
    tvUrl: 'https://app.plex.tv/desktop/#!/provider/tv.plex.provider.discover/details?key=%2Flibrary%2Fmetadata%2F{tmdb_id}',
    warning: 'Serveur personnel légal',
  },
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
