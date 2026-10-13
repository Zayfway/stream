export interface CursorConfig {
  presetId: string; // 'system' | 'dot' | 'ring' | 'crosshair' | 'custom'
  imageUrl?: string; // dataURL, only when presetId === 'custom'
  hotspotX: number; // unitless, 0..size
  hotspotY: number;
}

export const CURSOR_KEY = 'meystream-cursor';
export const MAX_CURSOR_PX = 128; // hard browser cap (larger = silently dropped)
export const SAFE_CURSOR_PX = 32; // target for raster uploads

export interface CursorPreset {
  id: string;
  label: string;
  url: string | null;
  hotspot: [number, number];
}

export const CURSOR_PRESETS: CursorPreset[] = [
  { id: 'system', label: 'Système', url: null, hotspot: [0, 0] },
  {
    id: 'dot',
    label: 'Point',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='5' fill='white'/%3E%3C/svg%3E",
    hotspot: [8, 8],
  },
  {
    id: 'ring',
    label: 'Cercle',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
    hotspot: [12, 12],
  },
  {
    id: 'crosshair',
    label: 'Croix',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 2v20M2 12h20' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
    hotspot: [12, 12],
  },
];

export const DEFAULT_CURSOR: CursorConfig = {
  presetId: 'system',
  hotspotX: 0,
  hotspotY: 0,
};

const STYLE_ID = 'meystream-cursor-style';

/** Inject a <style> AFTER Tailwind so !important beats .cursor-pointer utilities. */
export function applyCursor(cfg: CursorConfig): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  const url =
    cfg.presetId === 'custom'
      ? cfg.imageUrl
      : CURSOR_PRESETS.find((p) => p.id === cfg.presetId)?.url;

  if (cfg.presetId === 'system' || !url) {
    el.textContent = '';
    return;
  }

  const hs = `${cfg.hotspotX} ${cfg.hotspotY}`;
  el.textContent = `
    @media (pointer: fine) {
      html, body { cursor: url("${url}") ${hs}, auto !important; }
      a, button, [role="button"], input[type="submit"], label[for],
      select, summary, .cursor-pointer {
        cursor: url("${url}") ${hs}, pointer !important;
      }
    }`;
}

const ACCEPT = ['image/png', 'image/svg+xml', 'image/gif', 'image/webp', 'image/x-icon'];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function downscale(dataUrl: string, max: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      if (scale === 1) return resolve(dataUrl);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Validate + downscale an uploaded cursor so the browser doesn't silently drop it. */
export async function fileToCursorUrl(file: File): Promise<string> {
  if (!ACCEPT.includes(file.type)) {
    throw new Error('Format non supporté (PNG, SVG, GIF, WEBP, ICO).');
  }
  if (file.size > 256 * 1024) throw new Error('Trop lourd (max 256 Ko).');
  const dataUrl = await readAsDataUrl(file);
  if (file.type === 'image/svg+xml') return dataUrl;
  return downscale(dataUrl, SAFE_CURSOR_PX);
}

export { readAsDataUrl };
