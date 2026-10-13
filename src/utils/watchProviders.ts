/*
  Curated "Browse by Provider" strip (TMDB watch-provider DISCOVERY).
  Selecting one filters the catalogue to titles available on that service in the
  user's region — metadata only, never playback. provider_ids + logo_paths are
  TMDB's own (verified against the live US watch-provider list).
*/

export interface BrowseProvider {
  id: number;
  name: string;
  logo: string; // TMDB logo_path
}

export const BROWSE_PROVIDERS: BrowseProvider[] = [
  { id: 8, name: 'Netflix', logo: '/rK1KljqmbvO9HQa1PBFLILWah72.png' },
  { id: 9, name: 'Prime Video', logo: '/gMZdpavHmxFNnLpMHwVxfqeux2g.png' },
  { id: 337, name: 'Disney+', logo: '/5eZ872CghnHFLB1j8grszbrx0dx.png' },
  { id: 350, name: 'Apple TV+', logo: '/9icYBfYFcwgCbky5VdGUIKJ4C5i.png' },
  { id: 15, name: 'Hulu', logo: '/44uAnmSqvA4yBOdbPWN8YgQHjWm.png' },
  { id: 1899, name: 'HBO Max', logo: '/skypuy7SXuugIQeYg0IglmzoKaS.png' },
  { id: 531, name: 'Paramount+', logo: '/pkx3klJlwW5JdtaulvDx6hDNtch.png' },
  { id: 386, name: 'Peacock', logo: '/a1UIdq5BrkcAxnxcUhFsNbXnxeu.png' },
  { id: 283, name: 'Crunchyroll', logo: '/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png' },
  { id: 43, name: 'Starz', logo: '/h25xjouKmiSmFiiqw0aDXbxGZo7.png' },
  { id: 526, name: 'AMC+', logo: '/wsCUflcmL4dCkzBUaGP8cj1cTkh.png' },
  { id: 2, name: 'Apple TV', logo: '/qdEGArH3lKfFnAtYXMkSYk5wxuG.png' },
];

// Providers whose US list splits into sub-tiers — expand to catch all titles.
const PROVIDER_ALIASES: Record<number, number[]> = {
  531: [531, 2303, 2616], // Paramount+ (+ Premium / Essential)
};

export const expandProviderIds = (id: number): number[] => PROVIDER_ALIASES[id] ?? [id];

export const getProviderById = (id: number): BrowseProvider | undefined =>
  BROWSE_PROVIDERS.find((p) => p.id === id);

// Watch region (TMDB availability is per-country). User-configurable in Settings.
export const WATCH_REGION_KEY = 'meystream-watch-region';
export const DEFAULT_REGION = 'US';

export const getWatchRegion = (): string => {
  try {
    return localStorage.getItem(WATCH_REGION_KEY) || DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
};

export const setWatchRegion = (region: string): void => {
  try {
    localStorage.setItem(WATCH_REGION_KEY, region);
  } catch {
    /* ignore */
  }
};
