import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Search, Bookmark } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/movies', label: 'Films', icon: Film },
  { to: '/tv-shows', label: 'Séries', icon: Tv },
  { to: '/search', label: 'Recherche', icon: Search },
  { to: '/watchlist', label: 'Ma liste', icon: Bookmark },
];

/** Mobile bottom tab bar, liquid-glass pill. Desktop keeps the top pill nav. */
const BottomTabBar: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/watch')) return null;

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 px-3 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-md flex items-center justify-between rounded-full border border-white/15 bg-white/[0.08] px-2 py-2 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]">
        {TABS.map((t) => {
          const active = isActive(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-[56px] flex-col items-center gap-1 rounded-full px-3 py-1.5 transition-all duration-200 ${
                active ? 'bg-white text-black shadow' : 'text-white/70 hover:text-white'
              }`}
            >
              <t.icon size={20} strokeWidth={active ? 2.6 : 2} />
              <span className="text-[10px] font-semibold leading-none">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
