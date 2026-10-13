import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, ThemeDef } from "@/lib/themes";
import {
  CustomThemeInput,
  applyCustomTheme,
  clearCustomThemeVars,
  loadCustomThemes,
  saveCustomThemes,
} from "@/lib/customTheme";

interface ThemeContextValue {
  theme: string;
  setTheme: (id: string) => void;
  themes: ThemeDef[];
  customThemes: CustomThemeInput[];
  saveCustomTheme: (input: CustomThemeInput) => void;
  deleteCustomTheme: (id: string) => void;
  previewCustomTheme: (input: CustomThemeInput) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isBuiltIn = (id: string) => THEMES.some((t) => t.id === id);

const applyTheme = (id: string, customs: CustomThemeInput[]) => {
  const root = document.documentElement;
  if (id.startsWith("custom:")) {
    const t = customs.find((x) => `custom:${x.id}` === id);
    if (t) {
      applyCustomTheme(t);
      return;
    }
    // stale custom id — fall back
    clearCustomThemeVars();
    root.setAttribute("data-theme", DEFAULT_THEME);
    root.style.colorScheme = "dark";
    return;
  }
  clearCustomThemeVars();
  root.setAttribute("data-theme", isBuiltIn(id) ? id : DEFAULT_THEME);
  root.style.colorScheme = "dark";
};

const readStoredTheme = (customs: CustomThemeInput[]): string => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (isBuiltIn(stored) || customs.some((c) => `custom:${c.id}` === stored))) {
      return stored;
    }
  } catch {
    /* storage blocked */
  }
  return DEFAULT_THEME;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customThemes, setCustomThemes] = useState<CustomThemeInput[]>(loadCustomThemes);
  const [theme, setThemeState] = useState<string>(() => readStoredTheme(loadCustomThemes()));

  useEffect(() => {
    applyTheme(theme, customThemes);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme, customThemes]);

  const setTheme = (id: string) => {
    if (isBuiltIn(id) || customThemes.some((c) => `custom:${c.id}` === id)) {
      setThemeState(id);
    }
  };

  const saveCustomTheme = (input: CustomThemeInput) => {
    const next = (() => {
      const idx = customThemes.findIndex((c) => c.id === input.id);
      if (idx === -1) return [...customThemes, input];
      const copy = [...customThemes];
      copy[idx] = input;
      return copy;
    })();
    setCustomThemes(next);
    saveCustomThemes(next);
    setThemeState(`custom:${input.id}`);
  };

  const deleteCustomTheme = (id: string) => {
    const next = customThemes.filter((c) => c.id !== id);
    setCustomThemes(next);
    saveCustomThemes(next);
    if (theme === `custom:${id}`) setThemeState(DEFAULT_THEME);
  };

  // Live preview without persisting (for the builder sliders/pickers)
  const previewCustomTheme = (input: CustomThemeInput) => applyCustomTheme(input);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: THEMES,
        customThemes,
        saveCustomTheme,
        deleteCustomTheme,
        previewCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
