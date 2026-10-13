import React from 'react';
import { ChevronDown, Check, SlidersHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MOVIE_GENRES, TV_GENRES } from '@/utils/api';
import { BROWSE_PROVIDERS } from '@/utils/watchProviders';

export interface Filters {
  genre?: number;
  year?: number;
  sortBy: string;
  providerId?: number;
  originCountry?: string;
}

export const DEFAULT_FILTERS: Filters = { sortBy: 'popularity.desc' };

type Opt = { label: string; value: string | number | undefined };

const YEARS: Opt[] = [
  { label: 'Toutes années', value: undefined },
  ...Array.from({ length: 2026 - 1950 + 1 }, (_, i) => {
    const y = 2026 - i;
    return { label: String(y), value: y };
  }),
];

const COUNTRIES: Opt[] = [
  { label: 'Tous pays', value: undefined },
  { label: 'États-Unis', value: 'US' },
  { label: 'France', value: 'FR' },
  { label: 'Royaume-Uni', value: 'GB' },
  { label: 'Japon', value: 'JP' },
  { label: 'Corée du Sud', value: 'KR' },
  { label: 'Inde', value: 'IN' },
  { label: 'Canada', value: 'CA' },
  { label: 'Allemagne', value: 'DE' },
  { label: 'Espagne', value: 'ES' },
  { label: 'Italie', value: 'IT' },
  { label: 'Chine', value: 'CN' },
  { label: 'Brésil', value: 'BR' },
];

const FilterSelect: React.FC<{
  label: string;
  value: string | number | undefined;
  options: Opt[];
  onChange: (v: string | number | undefined) => void;
}> = ({ label, value, options, onChange }) => {
  const current = options.find((o) => o.value === value);
  const active = value !== undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
            active
              ? 'border-transparent bg-white text-black'
              : 'border-white/12 bg-white/[0.05] text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          {current && active ? current.label : label}
          <ChevronDown size={14} className="opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[320px] w-52 overflow-y-auto bg-popover/95 backdrop-blur-xl border-white/10"
      >
        {options.map((o) => (
          <DropdownMenuItem
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className="cursor-pointer gap-2"
          >
            <span className="flex-1 truncate">{o.label}</span>
            {o.value === value && <Check size={15} className="text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FilterBar: React.FC<{
  type: 'movie' | 'tv';
  value: Filters;
  onChange: (f: Filters) => void;
}> = ({ type, value, onChange }) => {
  const genres = type === 'movie' ? MOVIE_GENRES : TV_GENRES;

  const genreOpts: Opt[] = [
    { label: 'Tous genres', value: undefined },
    ...genres.map((g) => ({ label: g.name, value: g.id })),
  ];

  const sortOpts: Opt[] = [
    { label: 'Populaire', value: 'popularity.desc' },
    { label: 'Mieux noté', value: 'vote_average.desc' },
    {
      label: 'Plus récent',
      value: type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc',
    },
    ...(type === 'movie' ? [{ label: 'Recettes', value: 'revenue.desc' }] : []),
  ];

  const providerOpts: Opt[] = [
    { label: 'Tous providers', value: undefined },
    ...BROWSE_PROVIDERS.map((p) => ({ label: p.name, value: p.id })),
  ];

  const dirty =
    value.genre !== undefined ||
    value.year !== undefined ||
    value.providerId !== undefined ||
    value.originCountry !== undefined ||
    value.sortBy !== DEFAULT_FILTERS.sortBy;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
        <SlidersHorizontal size={15} /> Filtres
      </span>

      <FilterSelect label="Genre" value={value.genre} options={genreOpts}
        onChange={(v) => onChange({ ...value, genre: v as number | undefined })} />
      <FilterSelect label="Année" value={value.year} options={YEARS}
        onChange={(v) => onChange({ ...value, year: v as number | undefined })} />
      <FilterSelect label="Tri" value={value.sortBy} options={sortOpts}
        onChange={(v) => onChange({ ...value, sortBy: (v as string) || DEFAULT_FILTERS.sortBy })} />
      <FilterSelect label="Provider" value={value.providerId} options={providerOpts}
        onChange={(v) => onChange({ ...value, providerId: v as number | undefined })} />
      <FilterSelect label="Pays" value={value.originCountry} options={COUNTRIES}
        onChange={(v) => onChange({ ...value, originCountry: v as string | undefined })} />

      {dirty && (
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-white transition"
        >
          <X size={14} /> Réinitialiser
        </button>
      )}
    </div>
  );
};

export default FilterBar;
