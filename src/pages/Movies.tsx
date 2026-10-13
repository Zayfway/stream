import React, { useCallback, useState } from 'react';
import { discover } from '@/utils/api';
import { getWatchRegion } from '@/utils/watchProviders';
import Navbar from '@/components/Navbar';
import Aurora from '@/components/Aurora';
import InfiniteMediaGrid from '@/components/InfiniteMediaGrid';
import FilterBar, { Filters, DEFAULT_FILTERS } from '@/components/FilterBar';

const Movies: React.FC = () => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const fetcher = useCallback(
    (page: number) =>
      discover('movie', { ...filters, region: getWatchRegion() }, page),
    [filters]
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-16 text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">Films</h1>

          <div className="mb-8">
            <FilterBar type="movie" value={filters} onChange={setFilters} />
          </div>

          <InfiniteMediaGrid fetcher={fetcher} tagType="movie" />
        </div>
      </div>
    </div>
  );
};

export default Movies;
