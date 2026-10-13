import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BROWSE_PROVIDERS } from '@/utils/watchProviders';
import { getProviderLogoUrl } from '@/utils/api';

const BrowseByProvider: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-6 text-left">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
        Browse by Provider
      </h2>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {BROWSE_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/provider/${p.id}`)}
            className="group shrink-0 w-[78px] sm:w-[88px] focus:outline-none"
            aria-label={`Parcourir ${p.name}`}
          >
            <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-white/25 group-focus-visible:brand-ring">
              <img
                src={getProviderLogoUrl(p.logo, 'w154')}
                alt={p.name}
                className="h-full w-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </div>
            <span className="mt-2 block text-xs text-white/65 truncate group-hover:text-white transition-colors">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default BrowseByProvider;
