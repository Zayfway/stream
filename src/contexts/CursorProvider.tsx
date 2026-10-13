import React, { createContext, useContext, useEffect, useState } from 'react';
import { CURSOR_KEY, DEFAULT_CURSOR, CursorConfig, applyCursor } from '@/lib/cursor';

interface CursorContextValue {
  cursor: CursorConfig;
  setCursor: (c: CursorConfig) => void;
  resetCursor: () => void;
}

const CursorContext = createContext<CursorContextValue | undefined>(undefined);

const read = (): CursorConfig => {
  try {
    const raw = localStorage.getItem(CURSOR_KEY);
    if (raw) return { ...DEFAULT_CURSOR, ...JSON.parse(raw) };
  } catch {
    /* private mode */
  }
  return DEFAULT_CURSOR;
};

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cursor, setCursorState] = useState<CursorConfig>(read);

  useEffect(() => {
    applyCursor(cursor);
    try {
      localStorage.setItem(CURSOR_KEY, JSON.stringify(cursor));
    } catch {
      /* ignore */
    }
  }, [cursor]);

  return (
    <CursorContext.Provider
      value={{
        cursor,
        setCursor: setCursorState,
        resetCursor: () => setCursorState(DEFAULT_CURSOR),
      }}
    >
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = (): CursorContextValue => {
  const c = useContext(CursorContext);
  if (!c) throw new Error('useCursor must be used within CursorProvider');
  return c;
};
