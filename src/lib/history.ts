import { Media } from '@/utils/api';

export interface HistoryEntry extends Media {
  viewedAt: number;
  progress?: number; // 0..1, reserved for real playback progress
}

export const HISTORY_KEY = 'meystream-history';
export const HISTORY_UPDATED_EVENT = 'meystream-history-updated';
const MAX = 30;

const notify = () => window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(list: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX)));
    notify();
  } catch {
    /* ignore */
  }
}

/** Record (or bump) a title the user opened, so they can resume it later. */
export function recordView(media: Media, progress?: number): void {
  const entry: HistoryEntry = {
    ...media,
    viewedAt: Date.now(),
    progress,
  };
  const rest = getHistory().filter((m) => m.id !== media.id);
  save([entry, ...rest]);
}

export function removeFromHistory(id: number): void {
  save(getHistory().filter((m) => m.id !== id));
}

export function clearHistory(): void {
  save([]);
}
