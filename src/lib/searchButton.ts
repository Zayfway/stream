import { downscale, readAsDataUrl } from './cursor';

export interface SearchButtonConfig {
  type: 'icon' | 'image';
  imageUrl?: string; // dataURL when type === 'image'
}

export const SEARCH_BTN_KEY = 'meystream-search-btn';
export const DEFAULT_SEARCH_BTN: SearchButtonConfig = { type: 'icon' };

const ACCEPT = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];

/** Validate + downscale an image to replace the search icon (kept light for storage). */
export async function fileToSearchButtonUrl(file: File): Promise<string> {
  if (!ACCEPT.includes(file.type)) throw new Error('Format : PNG, SVG, WEBP ou JPG.');
  if (file.size > 1024 * 1024) throw new Error('Trop lourd (max 1 Mo).');
  const dataUrl = await readAsDataUrl(file);
  if (file.type === 'image/svg+xml') return dataUrl;
  return downscale(dataUrl, 128);
}
