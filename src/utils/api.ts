import { toast } from "@/components/ui/use-toast";

// TMDB API key
const API_KEY = "71fdb081b0133511ac14ac0cc10fd307";
const BASE_URL = "https://api.themoviedb.org/3";

// Types
export interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  genre_ids: number[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface MediaDetails extends Media {
  genres: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
  tagline: string;
  budget?: number;
  revenue?: number;
  original_language?: string;
  homepage?: string;
  vote_count?: number;
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
  }[];
}

export interface SeasonDetails {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
  poster_path: string;
  overview: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
}

export interface SearchResults {
  page: number;
  results: Media[];
  total_pages: number;
  total_results: number;
}

// Generic fetch function with error handling
const fetchApi = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error("API fetch error:", error);
    toast({
      title: "Error",
      description: "Failed to fetch data. Please try again later.",
      variant: "destructive",
    });
    throw error;
  }
};

// Trending
export const getTrending = (timeWindow: "day" | "week" = "week", page: number = 1) => {
  return fetchApi<SearchResults>(`/trending/all/${timeWindow}?api_key=${API_KEY}&page=${page}`);
};

// Popular Movies
export const getPopularMovies = (page: number = 1) => {
  return fetchApi<SearchResults>(`/movie/popular?api_key=${API_KEY}&page=${page}`);
};

// Popular TV Shows
export const getPopularTVShows = (page: number = 1) => {
  return fetchApi<SearchResults>(`/tv/popular?api_key=${API_KEY}&page=${page}`);
};

// Top Rated Movies
export const getTopRatedMovies = (page: number = 1) => {
  return fetchApi<SearchResults>(`/movie/top_rated?api_key=${API_KEY}&page=${page}`);
};

// Top Rated TV Shows
export const getTopRatedTVShows = (page: number = 1) => {
  return fetchApi<SearchResults>(`/tv/top_rated?api_key=${API_KEY}&page=${page}`);
};

// Now Playing Movies
export const getNowPlayingMovies = (page: number = 1) => {
  return fetchApi<SearchResults>(`/movie/now_playing?api_key=${API_KEY}&page=${page}`);
};

// TV Shows Currently Airing
export const getOnAirTVShows = (page: number = 1) => {
  return fetchApi<SearchResults>(`/tv/on_the_air?api_key=${API_KEY}&page=${page}`);
};

// Get Media Details (Movie or TV Show)
export const getMediaDetails = (id: string, type: "movie" | "tv") => {
  return fetchApi<MediaDetails>(`/${type}/${id}?api_key=${API_KEY}`);
};

// Get Season Details
export const getSeasonDetails = (tvId: string, seasonNumber: number) => {
  return fetchApi<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
};

// Search
export const searchMedia = (query: string, page: number = 1) => {
  return fetchApi<SearchResults>(`/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
};

// Get image URL
export const getImageUrl = (path: string | null, size: "original" | "w500" | "w780" = "w500") => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Get movie/TV genres
export const getGenres = async (type: "movie" | "tv") => {
  return fetchApi<{genres: Genre[]}>(`/genre/${type}/list?api_key=${API_KEY}`);
};

// Get recommendations
export const getRecommendations = (id: string, type: "movie" | "tv", page: number = 1) => {
  return fetchApi<SearchResults>(`/${type}/${id}/recommendations?api_key=${API_KEY}&page=${page}`);
};

// Trending by media type
export const getTrendingMovies = (timeWindow: "day" | "week" = "week", page = 1) =>
  fetchApi<SearchResults>(`/trending/movie/${timeWindow}?api_key=${API_KEY}&page=${page}`);

export const getTrendingTVShows = (timeWindow: "day" | "week" = "week", page = 1) =>
  fetchApi<SearchResults>(`/trending/tv/${timeWindow}?api_key=${API_KEY}&page=${page}`);

// Acclaimed / award-caliber (high rating with a meaningful vote count)
export const getAcclaimed = (type: "movie" | "tv", page = 1) =>
  fetchApi<SearchResults>(
    `/discover/${type}?api_key=${API_KEY}&sort_by=vote_average.desc&vote_count.gte=2000&page=${page}`
  );

// Upcoming movies
export const getUpcomingMovies = (page = 1) =>
  fetchApi<SearchResults>(`/movie/upcoming?api_key=${API_KEY}&page=${page}`);

// Discover by genre
export const discoverByGenre = (type: "movie" | "tv", genreId: number, page = 1) =>
  fetchApi<SearchResults>(
    `/discover/${type}?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=150&page=${page}`
  );

// Flexible discover with filters (genre / year / sort / provider / country)
export interface DiscoverParams {
  genre?: number;
  year?: number;
  sortBy?: string;
  providerId?: number;
  region?: string; // watch_region, required when providerId set
  originCountry?: string;
}
export const discover = (type: "movie" | "tv", params: DiscoverParams, page = 1) => {
  const q = new URLSearchParams();
  q.set("api_key", API_KEY);
  q.set("page", String(page));
  q.set("sort_by", params.sortBy || "popularity.desc");
  q.set("vote_count.gte", (params.sortBy || "").startsWith("vote_average") ? "300" : "50");
  if (params.genre) q.set("with_genres", String(params.genre));
  if (params.year) {
    q.set(type === "movie" ? "primary_release_year" : "first_air_date_year", String(params.year));
  }
  if (params.providerId) {
    q.set("with_watch_providers", String(params.providerId));
    q.set("watch_region", params.region || "US");
  }
  if (params.originCountry) q.set("with_origin_country", params.originCountry);
  return fetchApi<SearchResults>(`/discover/${type}?${q.toString()}`);
};

// TMDB TV genre ids (differ from movie ids)
export const TV_GENRES: { id: number; name: string }[] = [
  { id: 10759, name: "Action & Aventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comédie" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentaire" },
  { id: 18, name: "Drame" },
  { id: 10751, name: "Familial" },
  { id: 10762, name: "Enfants" },
  { id: 9648, name: "Mystère" },
  { id: 10765, name: "Sci-Fi & Fantastique" },
  { id: 10768, name: "Guerre & Politique" },
  { id: 37, name: "Western" },
];

// TMDB genre ids (shared movie/tv where they overlap)
export const MOVIE_GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Aventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comédie" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentaire" },
  { id: 18, name: "Drame" },
  { id: 10751, name: "Familial" },
  { id: 14, name: "Fantastique" },
  { id: 27, name: "Horreur" },
  { id: 9648, name: "Mystère" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science-Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "Guerre" },
];

// Cast & crew
export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order: number;
}
export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}
export const getCredits = (id: string, type: "movie" | "tv") =>
  fetchApi<{ id: number; cast: CastMember[]; crew: CrewMember[] }>(
    `/${type}/${id}/credits?api_key=${API_KEY}`
  );

// Videos (trailers / teasers)
export interface Video {
  id: string;
  key: string;
  name: string;
  site: string; // "YouTube"
  type: string; // "Trailer" | "Teaser" | ...
  official: boolean;
}
export const getVideos = (id: string, type: "movie" | "tv") =>
  fetchApi<{ id: number; results: Video[] }>(`/${type}/${id}/videos?api_key=${API_KEY}`);

/*
  Watch-provider DISCOVERY (JustWatch-style, powered by TMDB).
  This is metadata only — "which titles are available on Netflix/Disney+/etc.
  in a region". It is NOT playback and is unrelated to src/utils/providers.ts
  (the user's own playback sources). When showing per-title providers, TMDB
  terms require visible JustWatch attribution.
*/
export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

// Build a provider-logo URL (w92 for the icon strip, original for crispness)
export const getProviderLogoUrl = (
  logoPath: string,
  size: "w45" | "w92" | "w154" | "w185" | "original" = "w92"
) => `https://image.tmdb.org/t/p/${size}${logoPath}`;

// Discover titles available on one or more providers in a region.
// watch_region is REQUIRED by TMDB whenever with_watch_providers is set.
export const discoverByProvider = (
  type: "movie" | "tv",
  providerIds: number[],
  options: {
    region?: string;
    monetization?: string;
    sortBy?: string;
    page?: number;
  } = {}
) => {
  const {
    region = "US",
    monetization = "flatrate|free|ads",
    sortBy = "popularity.desc",
    page = 1,
  } = options;
  return fetchApi<SearchResults>(
    `/discover/${type}?api_key=${API_KEY}&watch_region=${region}` +
      `&with_watch_providers=${providerIds.join("|")}` +
      `&with_watch_monetization_types=${monetization}` +
      `&sort_by=${sortBy}&page=${page}`
  );
};

// Per-title "where to watch" (for the Details page). link is a JustWatch page.
export const getTitleWatchProviders = (id: string, type: "movie" | "tv") => {
  return fetchApi<{
    id: number;
    results: Record<
      string,
      {
        link: string;
        flatrate?: WatchProvider[];
        rent?: WatchProvider[];
        buy?: WatchProvider[];
        ads?: WatchProvider[];
      }
    >;
  }>(`/${type}/${id}/watch/providers?api_key=${API_KEY}`);
};
