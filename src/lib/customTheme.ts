import { hexToHslTriple } from './color';

export interface CustomThemeInput {
  id: string; // uuid for a saved slot
  name: string;
  brand: string; // hex
  brand2: string; // hex
  tintHue: number; // 0..360 — the near-black base tint
  radius?: number; // rem, default 1
}

export const CUSTOM_THEMES_KEY = 'meystream-custom-themes';
export const ACTIVE_CUSTOM_VARS_KEY = 'meystream-active-custom-vars';

/**
 * Derive the full shadcn variable set from brand + brand-2 + a tint hue,
 * mirroring the S/L steps of the hand-authored premium themes so a generated
 * theme matches the built-ins' near-neutral, low-saturation look.
 */
export function deriveThemeVars(t: CustomThemeInput): Record<string, string> {
  const H = Math.round(t.tintHue);
  return {
    '--background': `${H} 13% 5%`,
    '--foreground': `0 0% 98%`,
    '--card': `${H} 12% 8%`,
    '--card-foreground': `0 0% 98%`,
    '--popover': `${H} 13% 7%`,
    '--popover-foreground': `0 0% 98%`,
    '--primary': `0 0% 98%`,
    '--primary-foreground': `${H} 14% 8%`,
    '--secondary': `${H} 9% 14%`,
    '--secondary-foreground': `0 0% 98%`,
    '--muted': `${H} 9% 14%`,
    '--muted-foreground': `${H} 10% 66%`,
    '--accent': `${H} 10% 16%`,
    '--accent-foreground': `0 0% 98%`,
    '--border': `${H} 10% 15%`,
    '--input': `${H} 10% 15%`,
    '--ring': hexToHslTriple(t.brand),
    '--brand': hexToHslTriple(t.brand),
    '--brand-2': hexToHslTriple(t.brand2),
    '--brand-foreground': `0 0% 100%`,
    '--radius': `${t.radius ?? 1}rem`,
  };
}

const CUSTOM_VARS = Object.keys(
  deriveThemeVars({ id: 'x', name: '', brand: '#000000', brand2: '#000000', tintHue: 0 })
);

export function applyCustomTheme(input: CustomThemeInput): void {
  const root = document.documentElement;
  const vars = deriveThemeVars(input);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.setAttribute('data-theme', 'custom');
  root.style.colorScheme = 'dark';
  // Cache the resolved vars so the pre-paint script can apply them with no flash.
  try {
    localStorage.setItem(ACTIVE_CUSTOM_VARS_KEY, JSON.stringify(vars));
  } catch {
    /* ignore */
  }
}

/** Strip inline overrides so a built-in [data-theme] stylesheet rule wins again. */
export function clearCustomThemeVars(): void {
  const root = document.documentElement;
  for (const k of CUSTOM_VARS) root.style.removeProperty(k);
  try {
    localStorage.removeItem(ACTIVE_CUSTOM_VARS_KEY);
  } catch {
    /* ignore */
  }
}

export function loadCustomThemes(): CustomThemeInput[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    return raw ? (JSON.parse(raw) as CustomThemeInput[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomThemes(list: CustomThemeInput[]): void {
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Short unique-ish id without Math.random cliffs across SSR (client-only here). */
export function makeId(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
