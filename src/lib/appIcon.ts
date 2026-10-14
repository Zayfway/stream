import { registerPlugin, Capacitor } from '@capacitor/core';

const AppIcon = registerPlugin<{ change(o: { name: string | null }): Promise<void> }>('AppIcon');

// hue of each built-in theme's brand colour (mono = grey, matched by low saturation)
const HUES: Record<string, number> = { sunset: 348, flamingo: 338, ember: 20, peach: 20, aurora: 158, ocean: 206, grape: 266, rosegold: 344, midnight: 224 };

const nearest = (h: number) => {
  let best = 'sunset', d = 999;
  for (const [k, v] of Object.entries(HUES)) { const dd = Math.min(Math.abs(h - v), 360 - Math.abs(h - v)); if (dd < d) { d = dd; best = k; } }
  return best;
};

/** Icon asset name for a theme id (null = the primary "sunset" icon). Custom themes map to the closest built-in hue. */
export function iconNameForTheme(themeId: string, customBrandTriple?: string): string | null {
  let id = themeId;
  if (themeId.startsWith('custom:')) {
    const [h, s] = (customBrandTriple || '').split(/\s+/).map(parseFloat);
    id = isNaN(h) ? 'sunset' : s < 12 ? 'mono' : nearest(h);
  }
  return id === 'sunset' ? null : `AppIcon-${id}`;
}

/** Keep the home-screen icon in the theme's colours (native only; iOS shows a system notice on change). */
export async function syncAppIcon(themeId: string, customBrandTriple?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const name = iconNameForTheme(themeId, customBrandTriple);
  try { await AppIcon.change({ name }); } catch (e) { console.warn('[AppIcon] change failed', name, e); }
}
