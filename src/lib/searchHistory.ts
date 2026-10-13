export const SEARCH_HISTORY_KEY = 'meystream-search-history';
const MAX = 8;

export function getSearches(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function addSearch(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  const rest = getSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
  save([q, ...rest]);
}

export function removeSearch(query: string): void {
  save(getSearches().filter((s) => s !== query));
}

export function clearSearches(): void {
  save([]);
}
