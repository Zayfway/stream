export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  /** Gradient stops used for the swatch preview (CSS color values). */
  from: string;
  to: string;
}

/**
 * The themes offered in Settings → Appearance.
 * The visual values live in src/index.css under [data-theme="<id>"].
 * Keep the ids in sync between the two files.
 */
export const THEMES: ThemeDef[] = [
  {
    id: "sunset",
    name: "Signature",
    description: "Rosé qui réchauffe vers l'ambre — la signature MeyStream",
    from: "#d85f78",
    to: "#e8824a",
  },
  {
    id: "flamingo",
    name: "Flamingo",
    description: "Rose flamant, chaud mais tenu",
    from: "#e05c93",
    to: "#e36370",
  },
  {
    id: "ember",
    name: "Ember",
    description: "Braise orange qui glisse vers le rouge",
    from: "#e37338",
    to: "#d64c45",
  },
  {
    id: "peach",
    name: "Peach",
    description: "Pêche douce vers le blush, la plus discrète",
    from: "#e89168",
    to: "#d888a0",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Émeraude vers le teal, ton bijou",
    from: "#36bd89",
    to: "#35b3aa",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Bleu profond vers le cyan, calme",
    from: "#419fe0",
    to: "#33b0cc",
  },
  {
    id: "grape",
    name: "Grape",
    description: "Violet vers l'orchidée, élégant",
    from: "#9b6ee0",
    to: "#c072d0",
  },
  {
    id: "rosegold",
    name: "Rose Gold",
    description: "Rose poudré vers l'or, effet métal brossé",
    from: "#d888a0",
    to: "#d9a74d",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Indigo vers pervenche, nocturne",
    from: "#5f7fe3",
    to: "#8873e0",
  },
  {
    id: "mono",
    name: "Mono",
    description: "Graphite monochrome, retenue totale",
    from: "#d1d1d1",
    to: "#8f8f8f",
  },
];

export const DEFAULT_THEME = "sunset";
export const THEME_STORAGE_KEY = "meystream-theme";

export const isValidTheme = (id: string | null | undefined): boolean =>
  !!id && THEMES.some((t) => t.id === id);
