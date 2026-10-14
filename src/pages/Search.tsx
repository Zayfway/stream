import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchMedia, getTrending, Media } from '@/utils/api';
import Navbar from '@/components/Navbar';
import Aurora from '@/components/Aurora';
import MediaGrid from '@/components/MediaGrid';
import { addSearch, getSearches, removeSearch, clearSearches } from '@/lib/searchHistory';
import { Search as SearchIcon, X, Clock } from 'lucide-react';

const SUGGESTIONS = [
  'Dune',
  'Oppenheimer',
  'Interstellar',
  'Coraline',
  'Breaking Bad',
  'The Batman',
  'Arcane',
];

const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = useMemo(
    () => new URLSearchParams(location.search).get('q') || '',
    [location.search]
  );

  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Media[]>([]);
  const [trending, setTrending] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>(getSearches);

  // Keep input in sync if the URL query changes (e.g. navbar search)
  useEffect(() => {
    setQuery(initial);
    if (initial.trim().length >= 2) {
      addSearch(initial);
      setRecents(getSearches());
    }
  }, [initial]);

  // Trending Today (shown when there is no active query)
  useEffect(() => {
    getTrending('day')
      .then((d) => setTrending(d.results.filter((m) => m.poster_path).slice(0, 18)))
      .catch(() => undefined);
  }, []);

  // Debounced live search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchMedia(q)
        .then((d) =>
          setResults(
            d.results.filter(
              (m) => m.poster_path && (m.media_type === 'movie' || m.media_type === 'tv' || !m.media_type)
            )
          )
        )
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const hasQuery = query.trim().length >= 2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    addSearch(q);
    setRecents(getSearches());
    navigate(`/search?q=${encodeURIComponent(q)}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Aurora />

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 page-top pb-16">
        {/* Hero search */}
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Qu'est-ce que tu veux regarder&nbsp;?
          </h1>

          <form onSubmit={submit} className="mt-8 relative">
            <SearchIcon
              size={22}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cherche un film, une série, une personne…"
              className="w-full h-14 sm:h-16 rounded-full border border-white/12 bg-white/[0.06] backdrop-blur-xl pl-14 pr-14 text-base sm:text-lg text-white placeholder:text-muted-foreground outline-none transition focus:border-white/25 focus:bg-white/[0.09]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                aria-label="Effacer"
              >
                <X size={20} />
              </button>
            )}
          </form>

          {!hasQuery && (
            <div className="mt-6 space-y-4">
              {recents.length > 0 && (
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2.5 text-xs text-muted-foreground">
                    <Clock size={13} /> Recherches récentes
                    <button
                      onClick={() => { clearSearches(); setRecents([]); }}
                      className="ml-1 underline hover:text-white transition"
                    >
                      effacer
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {recents.map((s) => (
                      <span key={s} className="group flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] pl-4 pr-2 py-1.5 text-sm text-white/80">
                        <button onClick={() => setQuery(s)} className="hover:text-white transition">{s}</button>
                        <button
                          onClick={() => { removeSearch(s); setRecents(getSearches()); }}
                          className="text-muted-foreground hover:text-white transition"
                          aria-label={`Retirer ${s}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2.5 text-xs text-muted-foreground">Suggestions</p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results or Trending Today */}
        <div className="mt-12">
          {hasQuery ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-5 text-left">
                Résultats pour «&nbsp;{query.trim()}&nbsp;»
              </h2>
              <MediaGrid title="" medias={results} isLoading={loading} />
              {!loading && results.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  Aucun résultat. Essaie un autre titre.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-5 text-left">
                Tendances du jour
              </h2>
              <MediaGrid title="" medias={trending} isLoading={trending.length === 0} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
