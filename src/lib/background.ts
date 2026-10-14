export type BgMode = 'liquid' | 'aurora' | 'video' | 'none';

export const BG_MODE_KEY = 'meystream-bg-mode';
export const DEFAULT_BG_MODE: BgMode = 'liquid';
export const BG_MODES: { id: BgMode; label: string; desc: string }[] = [
  { id: 'liquid', label: 'Liquide', desc: 'Encre qui se mélange, aux couleurs du thème' },
  { id: 'aurora', label: 'Aurora', desc: 'Halos doux qui dérivent' },
  { id: 'video', label: 'Ma vidéo', desc: 'Ta propre vidéo en boucle' },
  { id: 'none', label: 'Aucun', desc: 'Fond uni, le plus léger' },
];

export const getBgMode = (): BgMode => {
  try {
    const v = localStorage.getItem(BG_MODE_KEY) as BgMode | null;
    return v && BG_MODES.some((m) => m.id === v) ? v : DEFAULT_BG_MODE;
  } catch {
    return DEFAULT_BG_MODE;
  }
};
export const setBgModeStored = (m: BgMode) => {
  try { localStorage.setItem(BG_MODE_KEY, m); } catch { /* ignore */ }
};

/* ---- custom video stored in IndexedDB (too big for localStorage) ---- */
const DB = 'meystream', STORE = 'files', KEY = 'bg-video';
const openDB = (): Promise<IDBDatabase> =>
  new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
const tx = async (mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest) =>
  new Promise<unknown>(async (res, rej) => {
    const db = await openDB();
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
export const saveVideo = (blob: Blob) => tx('readwrite', (s) => s.put(blob, KEY));
export const loadVideo = () => tx('readonly', (s) => s.get(KEY)) as Promise<Blob | undefined>;
export const deleteVideo = () => tx('readwrite', (s) => s.delete(KEY));

/* ---- liquid look: sharpness + colour source ---- */
export interface LiquidSettings { sharp: number; colorMode: 'theme' | 'custom'; a: string; b: string }
export const LIQUID_KEY = 'meystream-liquid';
export const DEFAULT_LIQUID: LiquidSettings = { sharp: 0.65, colorMode: 'theme', a: '#36bd89', b: '#0a2e23' };
export const getLiquid = (): LiquidSettings => {
  try { const r = localStorage.getItem(LIQUID_KEY); return r ? { ...DEFAULT_LIQUID, ...JSON.parse(r) } : DEFAULT_LIQUID; } catch { return DEFAULT_LIQUID; }
};
export const setLiquidStored = (l: LiquidSettings) => { try { localStorage.setItem(LIQUID_KEY, JSON.stringify(l)); } catch { /* ignore */ } };
export function hexToRgb01(hex: string): [number, number, number] {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const VIDEO_ACCEPT = ['video/mp4', 'video/webm', 'video/quicktime'];

/** "H S% L%" (shadcn triple) -> [r,g,b] in 0..1, for the shader */
export function hslTripleToRgb(triple: string): [number, number, number] {
  const [hs, ss, ls] = triple.trim().split(/\s+/);
  const h = (parseFloat(hs) || 0) / 360, s = (parseFloat(ss) || 0) / 100, l = (parseFloat(ls) || 50) / 100;
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t: number) => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
