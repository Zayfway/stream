import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Settings as SettingsIcon, Home, Film, Tv, Bookmark, History, LogIn, User } from 'lucide-react';
import { useSearchButton } from '@/contexts/SearchButtonProvider';
import { useAuth } from '@/contexts/AuthProvider';
import Logo from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Shows', href: '/tv-shows', icon: Tv },
  { name: 'My List', href: '/watchlist', icon: Bookmark },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { searchButton } = useSearchButton();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 safe-top transition-all duration-300 ${
        scrolled ? 'bg-background/70 backdrop-blur-xl' : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-10 mx-auto">
        <div className="flex items-center justify-between h-[72px] gap-3">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Logo size={32} className="drop-shadow" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="text-brand-gradient">Mey</span><span className="text-white">Stream</span>
            </span>
          </Link>

          {/* Center pill */}
          <div className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl p-1.5 shadow-lg">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    active ? 'bg-white text-black shadow' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}>
                  <item.icon size={16} strokeWidth={active ? 2.6 : 2.2} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => navigate('/search')}
              className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden text-white/80 transition-all hover:bg-white/10 hover:text-white"
              aria-label="Recherche">
              {searchButton.type === 'image' && searchButton.imageUrl ? (
                <img src={searchButton.imageUrl} alt="" className="h-6 w-6 object-contain" draggable={false} />
              ) : (
                <Search size={20} />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10 hover:text-white data-[state=open]:bg-white data-[state=open]:text-black"
                  aria-label="Menu compte"
                >
                  {user ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-brand-foreground text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <SettingsIcon size={20} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover/95 backdrop-blur-xl border-white/10">
                {user ? (
                  <DropdownMenuItem className="gap-2 cursor-default">
                    <User size={16} /> <span className="truncate">{user.name}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/settings?tab=account')} className="gap-2 cursor-pointer">
                    <LogIn size={16} /> Se connecter
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate('/history')} className="gap-2 cursor-pointer">
                  <History size={16} /> Historique
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 cursor-pointer">
                  <SettingsIcon size={16} /> Réglages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10"
              aria-label="Menu">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mx-4 mb-3 rounded-2xl glass overflow-hidden animate-slide-down">
          <div className="p-2 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.name} to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold ${
                    active ? 'bg-white text-black' : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}>
                  <item.icon size={18} />{item.name}
                </Link>
              );
            })}
            <Link to="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-white/80 hover:bg-white/5 hover:text-white">
              <History size={18} /> Historique
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-white/80 hover:bg-white/5 hover:text-white">
              <SettingsIcon size={18} /> Réglages
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
