/**
 * MeyStream - Direct HLS Stream Resolver Service
 * Queries open-source stream resolver backends (Consumet / Sudo-Flix style)
 * to retrieve raw .m3u8 playlists for native Hls.js playback without iframes.
 */

export interface StreamQuality {
  quality: string;
  url: string;
  isM3U8: boolean;
}

export interface DirectStreamResult {
  sourceUrl: string;
  qualities: StreamQuality[];
  headers?: Record<string, string>;
  subtitles?: Array<{ url: string; lang: string; label: string }>;
}

export const RESOLVER_URL_KEY = 'meystream-resolver-api';

// Default list of fallback resolver endpoints (can be overridden by user)
export const DEFAULT_RESOLVER_ENDPOINTS = [
  'https://api.consumet.org',
  'https://consumet-api.up.railway.app',
];

/**
 * Get current configured resolver endpoint
 */
export const getResolverEndpoint = (): string => {
  try {
    return localStorage.getItem(RESOLVER_URL_KEY) || DEFAULT_RESOLVER_ENDPOINTS[0];
  } catch {
    return DEFAULT_RESOLVER_ENDPOINTS[0];
  }
};

/**
 * Save custom resolver endpoint
 */
export const setResolverEndpoint = (url: string): void => {
  try {
    localStorage.setItem(RESOLVER_URL_KEY, url.trim().replace(/\/+$/, ''));
  } catch {
    /* ignore */
  }
};

/**
 * Attempt to resolve direct .m3u8 stream for movie or TV show
 */
export async function resolveDirectHLSStream(
  tmdbId: string | number,
  type: 'movie' | 'tv',
  season: number = 1,
  episode: number = 1,
  title?: string
): Promise<DirectStreamResult | null> {
  const baseUrl = getResolverEndpoint();

  try {
    // 1. Try FlixHQ provider via Consumet format
    const searchParam = encodeURIComponent(title || `tmdb-${tmdbId}`);
    const searchUrl = `${baseUrl}/movies/flixhq/${searchParam}`;

    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const firstResult = searchData.results?.[0];
    if (!firstResult?.id) return null;

    // 2. Fetch media details / episode ID
    const infoUrl = `${baseUrl}/movies/flixhq/info?id=${encodeURIComponent(firstResult.id)}`;
    const infoRes = await fetch(infoUrl, { signal: AbortSignal.timeout(4000) });
    if (!infoRes.ok) return null;

    const infoData = await infoRes.json();
    let episodeId = firstResult.id;

    if (type === 'tv' && infoData.episodes?.length > 0) {
      const match = infoData.episodes.find(
        (ep: any) => ep.season === season && ep.number === episode
      ) || infoData.episodes[0];
      episodeId = match.id;
    } else if (infoData.episodes?.[0]?.id) {
      episodeId = infoData.episodes[0].id;
    }

    // 3. Fetch watch stream sources
    const watchUrl = `${baseUrl}/movies/flixhq/watch?episodeId=${encodeURIComponent(
      episodeId
    )}&mediaId=${encodeURIComponent(firstResult.id)}`;

    const watchRes = await fetch(watchUrl, { signal: AbortSignal.timeout(5000) });
    if (!watchRes.ok) return null;

    const watchData = await watchRes.json();
    const rawSources: any[] = watchData.sources || [];
    if (rawSources.length === 0) return null;

    // Pick highest quality or master .m3u8
    const m3u8Source = rawSources.find((s) => s.isM3U8 || s.url?.includes('.m3u8')) || rawSources[0];

    const qualities: StreamQuality[] = rawSources.map((s) => ({
      quality: s.quality || 'Auto',
      url: s.url,
      isM3U8: Boolean(s.isM3U8 || s.url?.includes('.m3u8')),
    }));

    return {
      sourceUrl: m3u8Source.url,
      qualities,
      headers: watchData.headers,
      subtitles: watchData.subtitles,
    };
  } catch (err) {
    // Non-fatal: resolver fallback to embeds
    return null;
  }
}
