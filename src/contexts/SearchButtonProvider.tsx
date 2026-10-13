import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SEARCH_BTN_KEY,
  DEFAULT_SEARCH_BTN,
  SearchButtonConfig,
} from '@/lib/searchButton';

interface SearchButtonContextValue {
  searchButton: SearchButtonConfig;
  setSearchButton: (c: SearchButtonConfig) => void;
  resetSearchButton: () => void;
}

const Ctx = createContext<SearchButtonContextValue | undefined>(undefined);

const read = (): SearchButtonConfig => {
  try {
    const raw = localStorage.getItem(SEARCH_BTN_KEY);
    if (raw) return { ...DEFAULT_SEARCH_BTN, ...JSON.parse(raw) };
  } catch {
    /* private mode */
  }
  return DEFAULT_SEARCH_BTN;
};

export const SearchButtonProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchButton, setSearchButtonState] = useState<SearchButtonConfig>(read);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_BTN_KEY, JSON.stringify(searchButton));
    } catch {
      /* ignore */
    }
  }, [searchButton]);

  return (
    <Ctx.Provider
      value={{
        searchButton,
        setSearchButton: setSearchButtonState,
        resetSearchButton: () => setSearchButtonState(DEFAULT_SEARCH_BTN),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useSearchButton = (): SearchButtonContextValue => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSearchButton must be used within SearchButtonProvider');
  return c;
};
