import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getMediaDetails, MediaDetails, getSeasonDetails, Episode } from '@/utils/api';
import { Provider, getSources, getDefaultProvider, setFavoriteProvider } from '@/utils/providers';
import { recordView } from '@/lib/history';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import Loader from '@/components/Loader';
import {
  ArrowLeft,
  Cast,
  Settings,
  Maximize,
  Minimize,
  Moon,
  Users,
  Check,
  ChevronRight,
  Server,
  Subtitles,
  Tv,
  RefreshCw,
  Info,
  X,
  Share2,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SettingsView = 'main' | 'servers' | 'subtitles' | 'quality' | 'sleep' | 'audio';

const Watch: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  // Media & Episode state
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Providers & Server state
  const [providersList, setProvidersList] = useState<Provider[]>(getSources);
  const [provider, setProvider] = useState<Provider | null>(getDefaultProvider());
  const [quality, setQuality] = useState<string>('Auto');
  const [selectedAudio, setSelectedAudio] = useState<string>('Default');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('Off');

  // UI / Controls state
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [showCastModal, setShowCastModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Subtitle custom settings (Cinejoy style)
  const [nativeSubtitles, setNativeSubtitles] = useState(false);
  const [pastelMode, setPastelMode] = useState(false);
  const [subtitleDelay, setSubtitleDelay] = useState(0);
  const [subtitleFont, setSubtitleFont] = useState<'Cinejoy' | 'Netflix' | 'Montserrat'>('Cinejoy');
  const [subtitleSize, setSubtitleSize] = useState(100);

  // Sleep Timer state
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerActive, setSleepTimerActive] = useState(false);

  // Key to force re-render / reload iframe
  const [reloadKey, setReloadKey] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync available providers
  useEffect(() => {
    setProvidersList(getSources());
  }, []);

  // Fetch Media Details
  useEffect(() => {
    if (!type || !id) return;

    const fetchMediaDetails = async () => {
      setLoading(true);
      try {
        const mediaData = await getMediaDetails(id, type as 'movie' | 'tv');
        setMedia(mediaData);

        // Record history
        recordView({
          id: mediaData.id,
          title: mediaData.title,
          name: mediaData.name,
          poster_path: mediaData.poster_path,
          backdrop_path: mediaData.backdrop_path,
          overview: mediaData.overview,
          vote_average: mediaData.vote_average,
          release_date: mediaData.release_date,
          first_air_date: mediaData.first_air_date,
          media_type: type as 'movie' | 'tv',
          genre_ids: mediaData.genres?.map((g) => g.id) || [],
        });

        if (type === 'tv') {
          const seasonData = await getSeasonDetails(id, selectedSeason);
          setEpisodes(seasonData.episodes);
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaDetails();
  }, [type, id, selectedSeason]);

  // Autohide controls on mouse inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!settingsOpen && !showCastModal && !showDetailsModal) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Fullscreen management
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Generate stream URL with parameters
  const getWatchUrl = () => {
    if (!media || !provider) return '';
    if (type === 'movie') {
      return provider.movieUrl.replace('{tmdb_id}', id || '');
    } else {
      return provider.tvUrl
        .replace('{tmdb_id}', id || '')
        .replace('{season_number}', selectedSeason.toString())
        .replace('{episode_number}', selectedEpisode.toString());
    }
  };

  const watchUrl = getWatchUrl();

  const handleSelectServer = (p: Provider) => {
    setProvider(p);
    setFavoriteProvider(p.id);
    setSettingsView('main');
    toast.success(`Serveur changé : ${p.name}`);
  };

  // Cast Handler
  const handleCastToTV = async () => {
    // 1. Try Presentation API (Chromecast / Google Cast)
    if ('presentation' in navigator && (navigator as any).presentation) {
      try {
        const presentationRequest = new (window as any).PresentationRequest([watchUrl]);
        await presentationRequest.start();
        toast.success('Connexion à la TV en cours...');
        return;
      } catch (e) {
        // Fallback to cast dialog
      }
    }

    // 2. Try WebKit AirPlay
    const video = document.querySelector('video') as any;
    if (video && video.webkitShowPlaybackTargetPicker) {
      try {
        video.webkitShowPlaybackTargetPicker();
        return;
      } catch (e) {}
    }

    // 3. Open TV Cast Assistant Modal
    setShowCastModal(true);
  };

  // Sleep Timer countdown
  useEffect(() => {
    if (!sleepTimerMinutes || !sleepTimerActive) return;
    const timer = setTimeout(() => {
      toast.info('Minuteur de sommeil écoulé : mise en pause du lecteur');
      setProvider(null);
      setSleepTimerActive(false);
    }, sleepTimerMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [sleepTimerMinutes, sleepTimerActive]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader size="large" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
        <h1 className="text-2xl font-bold mb-4">Média introuvable</h1>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-full">
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const title = media.title || media.name || '';
  const totalSeasons = media.number_of_seasons || 0;
  const currentEpisode = episodes.find((ep) => ep.episode_number === selectedEpisode);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden select-none font-sans text-white"
    >
      {/* ============================================================== */}
      {/* TOP BAR OVERLAY (Cinejoy style)                                */}
      {/* ============================================================== */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls || settingsOpen || showCastModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Back button */}
        <button
          onClick={() => navigate(`/details/${type}/${id}`)}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white"
          title="Retour aux détails"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Center: Title + Episode details */}
        <div className="flex flex-col items-center text-center px-4 max-w-[65vw]">
          <h1 className="text-base sm:text-lg font-semibold tracking-wide truncate max-w-full drop-shadow-md">
            {title}
          </h1>
          {type === 'tv' && currentEpisode && (
            <span className="text-xs text-white/70 font-medium truncate drop-shadow">
              Saison {selectedSeason} • Épisode {selectedEpisode} : {currentEpisode.name}
            </span>
          )}
        </div>

        {/* Right: Cast on TV & Reload */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setReloadKey((prev) => prev + 1);
              toast.info('Lecteur rechargé');
            }}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white"
            title="Recharger le lecteur"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={handleCastToTV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white border border-white/10"
            title="Projeter sur la TV"
          >
            <Cast size={18} className="text-[#95FF50]" />
            <span className="hidden sm:inline text-xs font-semibold tracking-wide text-white">Cast</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIDEO PLAYER VIEWPORT (Full Grand Écran)                       */}
      {/* ============================================================== */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center">
        {provider && watchUrl ? (
          <iframe
            key={`${provider.id}-${type}-${id}-${selectedSeason}-${selectedEpisode}-${reloadKey}`}
            src={watchUrl}
            className="w-full h-full border-0 absolute inset-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            title={title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-zinc-900 to-black rounded-2xl border border-white/10 max-w-md mx-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Server size={28} className="text-[#95FF50]" />
            </div>
            <h2 className="text-lg font-bold">Sélectionne un serveur</h2>
            <p className="text-sm text-zinc-400 mt-2">
              Clique ci-dessous pour choisir l'un des 14 serveurs disponibles.
            </p>
            <Button
              onClick={() => {
                setSettingsView('servers');
                setSettingsOpen(true);
              }}
              className="mt-5 rounded-full bg-[#95FF50] text-black font-semibold hover:bg-[#85ee40]"
            >
              Choisir un serveur
            </Button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* BOTTOM CONTROLS OVERLAY (Cinejoy Style)                        */}
      {/* ============================================================== */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 flex flex-col justify-end px-4 sm:px-6 py-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls || settingsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: TV Show Episode selector or Current Server badge */}
          <div className="flex items-center gap-2">
            {type === 'tv' && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedSeason.toString()}
                  onValueChange={(val) => {
                    setSelectedSeason(parseInt(val));
                    setSelectedEpisode(1);
                  }}
                >
                  <SelectTrigger className="h-9 rounded-full bg-white/10 hover:bg-white/20 border-white/10 text-xs px-3 min-w-[90px]">
                    <SelectValue placeholder="Saison" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                      <SelectItem key={s} value={s.toString()}>
                        Saison {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedEpisode.toString()}
                  onValueChange={(val) => setSelectedEpisode(parseInt(val))}
                >
                  <SelectTrigger className="h-9 rounded-full bg-white/10 hover:bg-white/20 border-white/10 text-xs px-3 min-w-[100px]">
                    <SelectValue placeholder="Épisode" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                    {episodes.map((ep) => (
                      <SelectItem key={ep.id} value={ep.episode_number.toString()}>
                        Ép. {ep.episode_number} - {ep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Server Pill Button */}
            <button
              onClick={() => {
                setSettingsView('servers');
                setSettingsOpen(true);
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-white/90 backdrop-blur-md transition"
            >
              <span className="h-2 w-2 rounded-full bg-[#95FF50] animate-pulse" />
              <span className="truncate max-w-[140px]">{provider?.name || 'Serveur'}</span>
              <ChevronDown size={14} className="opacity-60" />
            </button>
          </div>

          {/* Right: Info, Settings, Fullscreen buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white"
              title="Informations"
            >
              <Info size={18} />
            </button>

            <button
              onClick={() => {
                setSettingsView('main');
                setSettingsOpen(!settingsOpen);
              }}
              className={`flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-md transition ${
                settingsOpen
                  ? 'bg-[#95FF50] text-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Paramètres de lecture"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CINEJOY SETTINGS DRAWER / OVERLAY PANEL                        */}
      {/* (Exactement comme sur ta capture d'écran Cinejoy)              */}
      {/* ============================================================== */}
      {settingsOpen && (
        <div className="absolute right-4 sm:right-6 bottom-16 sm:bottom-20 z-50 w-[320px] sm:w-[350px] bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Sub-view: SERVER LIST SELECTION */}
          {settingsView === 'servers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>
                <span className="text-sm font-bold text-white">Serveurs disponibles</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                {providersList.map((p) => {
                  const isSelected = p.id === provider?.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectServer(p)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                        isSelected
                          ? 'bg-[#95FF50]/20 border border-[#95FF50]/50 text-white'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-semibold">{p.name}</span>
                        {p.warning && <span className="text-[10px] text-white/50 truncate">{p.warning}</span>}
                      </div>
                      {isSelected && <Check size={16} className="text-[#95FF50] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-view: SUBTITLE SETTINGS (Capture 3 Cinejoy) */}
          {settingsView === 'subtitles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                >
                  <ArrowLeft size={16} />
                  <span>Subtitle settings</span>
                </button>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Use native subtitles */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Use native subtitles</p>
                  <p className="text-[10px] text-white/50">Render using device's built-in engine</p>
                </div>
                <Switch checked={nativeSubtitles} onCheckedChange={setNativeSubtitles} />
              </div>

              {/* Pastel mode */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Pastel mode</p>
                <Switch checked={pastelMode} onCheckedChange={setPastelMode} />
              </div>

              {/* Subtitle delay */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Subtitle delay</p>
                <Slider
                  value={[subtitleDelay]}
                  min={-5}
                  max={5}
                  step={0.5}
                  onValueChange={(val) => setSubtitleDelay(val[0])}
                  className="py-1"
                />
                <div className="flex items-center justify-between text-[11px] text-white/60 bg-white/[0.03] rounded-lg p-1.5">
                  <button onClick={() => setSubtitleDelay((d) => d - 0.5)} className="hover:text-white">
                    ‹ Heard audio
                  </button>
                  <span className="font-bold text-white">{subtitleDelay}s</span>
                  <button onClick={() => setSubtitleDelay((d) => d + 0.5)} className="hover:text-white">
                    Saw caption ›
                  </button>
                </div>
              </div>

              {/* Font */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Font</p>
                <div className="grid grid-cols-3 gap-1.5 bg-white/[0.04] p-1 rounded-xl">
                  {(['Cinejoy', 'Netflix', 'Montserrat'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setSubtitleFont(f)}
                      className={`py-1 text-xs rounded-lg font-medium transition ${
                        subtitleFont === f
                          ? 'bg-zinc-800 text-white shadow'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text size */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Text size</span>
                <span className="font-bold text-[#95FF50]">{subtitleSize}%</span>
              </div>
              <Slider
                value={[subtitleSize]}
                min={50}
                max={150}
                step={10}
                onValueChange={(val) => setSubtitleSize(val[0])}
              />
            </div>
          )}

          {/* Sub-view: QUALITY SELECTION */}
          {settingsView === 'quality' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>
                <span className="text-sm font-bold">Qualité vidéo</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {['Auto (Recommandé)', '1080p Full HD', '720p HD', '480p SD'].map((q) => {
                const isCur = quality === q.split(' ')[0];
                return (
                  <button
                    key={q}
                    onClick={() => {
                      setQuality(q.split(' ')[0]);
                      setSettingsView('main');
                      toast.success(`Qualité réglée sur ${q}`);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                      isCur
                        ? 'bg-[#95FF50]/20 border border-[#95FF50]/50 text-white'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80'
                    }`}
                  >
                    <span>{q}</span>
                    {isCur && <Check size={16} className="text-[#95FF50]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* MAIN CINEJOY PANEL (Capture 2 Cinejoy) */}
          {settingsView === 'main' && (
            <div className="space-y-4">
              {/* Close Button Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold tracking-wider uppercase text-white/60">Lecteur Options</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* 2x2 Grid: QUALITY, SERVER, SUBTITLES, AUDIO */}
              <div className="grid grid-cols-2 gap-2">
                {/* QUALITY */}
                <button
                  onClick={() => setSettingsView('quality')}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Quality
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{quality}</span>
                </button>

                {/* SERVER */}
                <button
                  onClick={() => setSettingsView('servers')}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Server
                  </span>
                  <span className="text-xs font-bold text-[#95FF50] mt-0.5 truncate block">
                    {provider?.name?.split(' ')[0] || 'Nebula'}
                  </span>
                </button>

                {/* SUBTITLES */}
                <button
                  onClick={() => setSettingsView('subtitles')}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Subtitles
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{selectedSubtitle}</span>
                </button>

                {/* AUDIO */}
                <button
                  onClick={() => {
                    setSelectedAudio((prev) => (prev === 'Default' ? 'Français' : 'Default'));
                    toast.info('Piste audio basculée');
                  }}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Audio
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{selectedAudio}</span>
                </button>
              </div>

              {/* Action List items */}
              <div className="space-y-1 pt-1">
                {/* Cast to TV shortcut */}
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    handleCastToTV();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Tv size={16} className="text-[#95FF50]" />
                    <span>Projeter sur la TV (Cast)</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </button>

                {/* Sleep Timer */}
                <button
                  onClick={() => {
                    const next = sleepTimerMinutes === 30 ? 60 : sleepTimerMinutes === 60 ? null : 30;
                    setSleepTimerMinutes(next);
                    setSleepTimerActive(!!next);
                    toast.success(next ? `Minuteur réglé sur ${next} minutes` : 'Minuteur désactivé');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Moon size={16} className="text-white/70" />
                    <span>Sleep Timer</span>
                  </div>
                  <span className="text-[11px] text-[#95FF50] font-semibold">
                    {sleepTimerMinutes ? `${sleepTimerMinutes}m` : 'Off'}
                  </span>
                </button>

                {/* Watch Party */}
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Lien du stream copié pour Watch Party !');
                    }
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-white/70" />
                    <span>Watch Party</span>
                  </div>
                  <Share2 size={14} className="opacity-50" />
                </button>

                {/* Enable Subtitles Toggle */}
                <div className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium">
                  <div className="flex items-center gap-2.5">
                    <Subtitles size={16} className="text-white/70" />
                    <span>Enable Subtitles</span>
                  </div>
                  <Switch
                    checked={selectedSubtitle !== 'Off'}
                    onCheckedChange={(checked) => setSelectedSubtitle(checked ? 'Français' : 'Off')}
                  />
                </div>

                {/* Subtitle Settings Link */}
                <button
                  onClick={() => setSettingsView('subtitles')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders size={16} className="text-white/70" />
                    <span>Subtitle Settings</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TV CAST / PROJECTION MODAL                                     */}
      {/* ============================================================== */}
      {showCastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#95FF50]/20 flex items-center justify-center">
                  <Tv size={20} className="text-[#95FF50]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Projeter sur la TV</h3>
                  <p className="text-xs text-white/50">AirPlay, Chromecast & Smart TV</p>
                </div>
              </div>
              <button onClick={() => setShowCastModal(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Chromecast / Google Cast */}
              <button
                onClick={async () => {
                  if ('presentation' in navigator && (navigator as any).presentation) {
                    try {
                      const req = new (window as any).PresentationRequest([watchUrl]);
                      await req.start();
                      setShowCastModal(false);
                      toast.success('Diffusion lancée');
                      return;
                    } catch (e) {}
                  }
                  toast.info('Utilise le menu "Caster..." dans les paramètres de ton navigateur (Chrome / Brave / Edge).');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <Cast size={20} className="text-[#95FF50]" />
                  <div>
                    <p className="text-xs font-semibold text-white">Google Cast / Chromecast</p>
                    <p className="text-[11px] text-white/50">Smart TV Android, Google TV, Freebox, Box TV</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>

              {/* Option 2: Apple AirPlay */}
              <button
                onClick={() => {
                  toast.info('Sur Mac ou iPhone : utilise le bouton AirPlay dans le Centre de contrôle ou dans la barre des menus pour recopier vers ton Apple TV.');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <Tv size={20} className="text-sky-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Apple AirPlay</p>
                    <p className="text-[11px] text-white/50">Apple TV, téléviseurs compatibles AirPlay 2</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>

              {/* Option 3: Partage direct du lien TV */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">Ouvrir sur le navigateur de ta Smart TV</p>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Lien copié dans le presse-papier !');
                      }
                    }}
                    className="text-xs font-bold text-[#95FF50] hover:underline"
                  >
                    Copier le lien
                  </button>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Ouvre simplement l'application navigateur de ta télé (LG WebOS, Samsung Tizen, Android TV) et tape l'adresse de ton site pour lancer le film directement sur grand écran.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowCastModal(false)}
              className="w-full rounded-full bg-white/10 hover:bg-white/20 text-white font-medium border border-white/10"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DETAILS MODAL                                                  */}
      {/* ============================================================== */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold">{title}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed max-h-60 overflow-y-auto">
              {media.overview || 'Aucun synopsis disponible.'}
            </p>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => setShowDetailsModal(false)} variant="outline" className="rounded-full text-xs">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
