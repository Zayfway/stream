/**
 * MeyStream - Subtitles Management Service
 * Fetches multi-language subtitles from the public MovieBox/Wing API
 * Converts SRT to VTT for browser compatibility
 */

export interface SubtitleTrack {
  id: string;
  language: string;
  url: string;
  label: string;
  flag: string;
}

const LANGUAGE_MAP: Record<string, { label: string; flag: string }> = {
  fr: { label: 'Français', flag: '🇫🇷' },
  fre: { label: 'Français', flag: '🇫🇷' },
  fra: { label: 'Français', flag: '🇫🇷' },
  en: { label: 'English', flag: '🇬🇧' },
  eng: { label: 'English', flag: '🇬🇧' },
  es: { label: 'Español', flag: '🇪🇸' },
  spa: { label: 'Español', flag: '🇪🇸' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  ger: { label: 'Deutsch', flag: '🇩🇪' },
  it: { label: 'Italiano', flag: '🇮🇹' },
  ita: { label: 'Italiano', flag: '🇮🇹' },
  pt: { label: 'Português', flag: '🇵🇹' },
  por: { label: 'Português', flag: '🇵🇹' },
  ar: { label: 'العربية', flag: '🇸🇦' },
  ara: { label: 'العربية', flag: '🇸🇦' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  rus: { label: 'Русский', flag: '🇷🇺' },
  nl: { label: 'Nederlands', flag: '🇳🇱' },
  dut: { label: 'Nederlands', flag: '🇳🇱' },
  tr: { label: 'Türkçe', flag: '🇹🇷' },
  tur: { label: 'Türkçe', flag: '🇹🇷' },
  pl: { label: 'Polski', flag: '🇵🇱' },
  pol: { label: 'Polski', flag: '🇵🇱' },
  zh: { label: '中文', flag: '🇨🇳' },
  chi: { label: '中文', flag: '🇨🇳' },
  ja: { label: '日本語', flag: '🇯🇵' },
  jpn: { label: '日本語', flag: '🇯🇵' },
  ko: { label: '한국어', flag: '🇰🇷' },
  kor: { label: '한국어', flag: '🇰🇷' },
};

/**
 * Fetch all available subtitles for a movie or TV show episode
 */
export async function fetchSubtitles(
  type: 'movie' | 'tv',
  tmdbId: number | string,
  season?: number,
  episode?: number
): Promise<SubtitleTrack[]> {
  try {
    let url = `https://subs.wing.st/subtitles?type=${type}&tmdb=${tmdbId}`;
    if (type === 'tv' && season && episode) {
      url += `&season=${season}&episode=${episode}`;
    }

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const rawSubs: Array<{ id: string; language: string; url: string }> = data.subtitles || [];

    const tracks: SubtitleTrack[] = rawSubs.map((sub, idx) => {
      const code = (sub.language || 'en').toLowerCase();
      const meta = LANGUAGE_MAP[code] || {
        label: code.toUpperCase(),
        flag: '🌐',
      };

      return {
        id: sub.id || `${code}-${idx}`,
        language: code,
        url: sub.url,
        label: meta.label,
        flag: meta.flag,
      };
    });

    // Sort: French first, English second, then others alphabetically
    return tracks.sort((a, b) => {
      if (a.language.startsWith('fr') && !b.language.startsWith('fr')) return -1;
      if (!a.language.startsWith('fr') && b.language.startsWith('fr')) return 1;
      if (a.language.startsWith('en') && !b.language.startsWith('en')) return -1;
      if (!a.language.startsWith('en') && b.language.startsWith('en')) return 1;
      return a.label.localeCompare(b.label);
    });
  } catch (err) {
    console.error('Failed to fetch subtitles:', err);
    return [];
  }
}

/**
 * Convert SRT subtitle text into WebVTT text
 */
export function srtToVtt(srt: string): string {
  // Normalize line endings
  let vtt = 'WEBVTT\n\n' + srt.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Convert timestamps 00:00:10,552 -> 00:00:10.552
  vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return vtt;
}

/**
 * Downloads a subtitle track and returns a Blob URL ready for <track src="...">
 */
export async function loadSubtitleAsVttBlob(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Impossible de charger le sous-titre');
  const srtContent = await res.text();
  const vttContent = srtToVtt(srtContent);
  const blob = new Blob([vttContent], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}
