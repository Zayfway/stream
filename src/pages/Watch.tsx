import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Peer, { DataConnection } from 'peerjs';
import Hls from 'hls.js';
import { getMediaDetails, MediaDetails, getSeasonDetails, Episode } from '@/utils/api';
import { Provider, getSources, getDefaultProvider, setFavoriteProvider } from '@/utils/providers';
import { fetchSubtitles, SubtitleTrack, loadSubtitleAsVttBlob } from '@/utils/subtitles';
import {
  resolveDirectHLSStream,
  DirectStreamResult,
  getResolverEndpoint,
  setResolverEndpoint,
} from '@/utils/resolver';
import { recordView } from '@/lib/history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import Loader from '@/components/Loader';
import {
  ArrowLeft,
  Cast,
  Settings,
  Users,
  Check,
  ChevronRight,
  Server,
  Subtitles,
  Tv,
  RefreshCw,
  X,
  Share2,
  Sliders,
  ChevronDown,
  Copy,
  Radio,
  LogOut,
  Info,
  Search,
  Download,
  Sparkles,
  Play,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SettingsView = 'main' | 'servers' | 'party' | 'subtitles' | 'quality' | 'cast';

const Watch: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
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

  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Subtitle styling settings
  const [nativeSubtitles, setNativeSubtitles] = useState(false);
  const [pastelMode, setPastelMode] = useState(false);
  const [subtitleDelay, setSubtitleDelay] = useState(0);
  const [subtitleFont, setSubtitleFont] = useState<'Cinejoy' | 'Netflix' | 'Montserrat'>('Cinejoy');
  const [subtitleSize, setSubtitleSize] = useState(100);

  // Subtitles Live API state
  const [subtitlesList, setSubtitlesList] = useState<SubtitleTrack[]>([]);
  const [subtitlesLoading, setSubtitlesLoading] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<SubtitleTrack | null>(null);
  const [subtitleSearch, setSubtitleSearch] = useState('');
  const [activeTrackBlobUrl, setActiveTrackBlobUrl] = useState<string | null>(null);

  // Direct HLS Video Player refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Direct Stream state (Method 1: HLS Resolver)
  const [directStream, setDirectStream] = useState<DirectStreamResult | null>(null);
  const [isResolvingDirect, setIsResolvingDirect] = useState(false);
  const [useDirectStream, setUseDirectStream] = useState(false);
  const [resolverApiUrl, setResolverApiUrl] = useState(getResolverEndpoint());

  // Watch Party State (P2P via WebRTC / PeerJS)
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [connectedUsersCount, setConnectedUsersCount] = useState(0);
  const [isPartyConnected, setIsPartyConnected] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  // Initialize providers
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

  // Clean exit / Back button
  const handleBack = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/details/${type}/${id}`);
    }
  };

  // Generate Stream URL
  const getWatchUrl = () => {
    if (useDirectStream && directStream?.sourceUrl) {
      return directStream.sourceUrl;
    }
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
  const isHlsStream = Boolean(
    useDirectStream || (watchUrl && (watchUrl.includes('.m3u8') || provider?.isHLSPlayer))
  );

  // Attempt to resolve direct HLS stream (Method 1)
  useEffect(() => {
    if (!media || !id) return;
    let isMounted = true;
    setIsResolvingDirect(true);

    const title = media.title || media.name || '';
    resolveDirectHLSStream(id, type as 'movie' | 'tv', selectedSeason, selectedEpisode, title)
      .then((res) => {
        if (isMounted) {
          if (res && res.sourceUrl) {
            setDirectStream(res);
          }
          setIsResolvingDirect(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsResolvingDirect(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, type, selectedSeason, selectedEpisode, media]);

  // Live subtitles fetcher
  useEffect(() => {
    if (!type || !id) return;
    let isMounted = true;
    setSubtitlesLoading(true);

    fetchSubtitles(type as 'movie' | 'tv', id, selectedSeason, selectedEpisode)
      .then((subs) => {
        if (isMounted) {
          setSubtitlesList(subs);
          setSubtitlesLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération des sous-titres:', err);
        if (isMounted) setSubtitlesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [type, id, selectedSeason, selectedEpisode]);

  // Handle subtitle selection & activation
  const handleSelectSubtitle = async (sub: SubtitleTrack) => {
    try {
      if (activeSubtitle?.id === sub.id) {
        setActiveSubtitle(null);
        setActiveTrackBlobUrl(null);
        toast.info('Sous-titre désactivé');
        return;
      }
      toast.loading('Chargement du sous-titre...', { id: 'sub-load' });
      const blobUrl = await loadSubtitleAsVttBlob(sub.url);
      setActiveSubtitle(sub);
      setActiveTrackBlobUrl(blobUrl);
      toast.success(`Sous-titre activé : ${sub.flag} ${sub.label}`, { id: 'sub-load' });
    } catch (e) {
      toast.error('Erreur lors du chargement du sous-titre', { id: 'sub-load' });
    }
  };

  const handleDownloadSubtitle = (sub: SubtitleTrack) => {
    window.open(sub.url, '_blank');
    toast.success(`Téléchargement lancé (${sub.label})`);
  };

  // HLS Native Video Player initialization
  useEffect(() => {
    if (!isHlsStream || !videoRef.current || !watchUrl) return;

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(watchUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {});
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = watchUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isHlsStream, watchUrl, reloadKey]);

  // Server selection
  const handleSelectServer = (p: Provider) => {
    setProvider(p);
    setFavoriteProvider(p.id);
    setSettingsView('main');
    toast.success(`Serveur : ${p.name}`);

    // Broadcast sync to Watch Party peers if host
    if (isHost) {
      broadcastPartySync({ providerId: p.id });
    }
  };

  // =========================================================================
  // WATCH PARTY IMPLEMENTATION (PeerJS P2P)
  // =========================================================================
  const broadcastPartySync = (data: { providerId?: string; season?: number; episode?: number }) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({ type: 'PARTY_SYNC', ...data });
      }
    });
  };

  // 1. Create a Watch Party (Host)
  const handleCreateParty = () => {
    // Generate clean 6-digit code
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peerId = `meystream-${randomCode}`;

    if (peerRef.current) peerRef.current.destroy();

    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      setPartyCode(randomCode);
      setIsHost(true);
      setIsPartyConnected(true);
      toast.success(`Watch Party créée ! Code : ${randomCode}`);
    });

    peer.on('connection', (conn) => {
      connectionsRef.current.push(conn);
      setConnectedUsersCount(connectionsRef.current.length);
      toast.info('Un ami a rejoint votre Watch Party !');

      conn.on('open', () => {
        // Send initial sync state
        conn.send({
          type: 'PARTY_SYNC',
          providerId: provider?.id,
          season: selectedSeason,
          episode: selectedEpisode,
        });
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter((c) => c !== conn);
        setConnectedUsersCount(connectionsRef.current.length);
      });
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      toast.error('Erreur de connexion Watch Party. Réessayez.');
    });
  };

  // 2. Join an existing Watch Party
  const handleJoinParty = (codeToJoin: string) => {
    const cleanCode = codeToJoin.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Veuillez entrer un code valide.');
      return;
    }

    if (peerRef.current) peerRef.current.destroy();

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const targetPeerId = `meystream-${cleanCode}`;
      const conn = peer.connect(targetPeerId);

      conn.on('open', () => {
        setIsHost(false);
        setPartyCode(cleanCode);
        setIsPartyConnected(true);
        toast.success(`Connecté à la Watch Party de l'hôte !`);
      });

      conn.on('data', (data: any) => {
        if (data && data.type === 'PARTY_SYNC') {
          if (data.providerId) {
            const matched = providersList.find((p) => p.id === data.providerId);
            if (matched) setProvider(matched);
          }
          if (data.season) setSelectedSeason(data.season);
          if (data.episode) setSelectedEpisode(data.episode);
          toast.info("Synchronisé avec l'hôte");
        }
      });

      conn.on('close', () => {
        toast.error("L'hôte a quitté la Watch Party.");
        setIsPartyConnected(false);
        setPartyCode(null);
      });

      conn.on('error', () => {
        toast.error('Impossible de se connecter à ce code. Vérifiez que l’hôte est toujours en ligne.');
      });
    });
  };

  // Check URL params for auto-joining party (?party=XXXXXX)
  useEffect(() => {
    const autoParty = searchParams.get('party');
    if (autoParty && !isPartyConnected) {
      handleJoinParty(autoParty);
    }
  }, [searchParams]);

  // Leave / Close party
  const handleLeaveParty = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    connectionsRef.current = [];
    setPartyCode(null);
    setIsHost(false);
    setIsPartyConnected(false);
    setConnectedUsersCount(0);
    toast.info('Watch Party quittée.');
  };

  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  // TV Cast handler
  const handleCastToTV = async () => {
    if ('presentation' in navigator && (navigator as any).presentation) {
      try {
        const req = new (window as any).PresentationRequest([watchUrl]);
        await req.start();
        toast.success('Connexion à la TV en cours...');
        return;
      } catch (e) {}
    }
    setSettingsView('cast');
    setSettingsOpen(true);
  };

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
        <h1 className="text-xl font-bold mb-4">Média introuvable</h1>
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
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden select-none font-sans text-white">
      {/* ============================================================== */}
      {/* 1. LECTEUR VIDÉO (Prend 100% de l'écran SANS superposition)     */}
      {/* ============================================================== */}
      <div className="absolute inset-0 w-full h-full bg-black z-0">
        {provider && watchUrl ? (
          isHlsStream ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                key={`hls-${watchUrl}-${reloadKey}`}
                className="w-full h-full object-contain"
                controls
                playsInline
                autoPlay
                crossOrigin="anonymous"
              >
                {activeTrackBlobUrl && activeSubtitle && (
                  <track
                    kind="subtitles"
                    src={activeTrackBlobUrl}
                    srcLang={activeSubtitle.language}
                    label={activeSubtitle.label}
                    default
                  />
                )}
              </video>
            </div>
          ) : (
            <iframe
              key={`${provider.id}-${type}-${id}-${selectedSeason}-${selectedEpisode}-${reloadKey}`}
              src={watchUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title={title}
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-center p-6 bg-zinc-950">
            <Server size={32} className="text-[#95FF50] mb-3" />
            <h2 className="text-lg font-bold">Sélectionne un serveur</h2>
            <Button
              onClick={() => {
                setSettingsView('servers');
                setSettingsOpen(true);
              }}
              className="mt-4 rounded-full bg-[#95FF50] text-black font-semibold hover:bg-[#85ee40]"
            >
              Choisir un serveur
            </Button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. COMMANDES FLOTTANTES DISCRÈTES (Ne masquent pas la vidéo)    */}
      {/* ============================================================== */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 sm:p-5 pointer-events-none">
        {/* Top-Left : BOUTON RETOUR (Quitte le plein écran & revient) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-black/75 hover:bg-black/95 text-white/90 hover:text-white backdrop-blur-xl border border-white/15 shadow-2xl transition group"
            title="Quitter le lecteur et revenir à la page d'avant"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold pr-1">Retour</span>
          </button>

          {/* Quick TV Season/Episode selector (Discret en haut à gauche pour les séries) */}
          {type === 'tv' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-black/75 backdrop-blur-xl border border-white/15 rounded-full px-2 py-1 shadow-2xl">
              <Select
                value={selectedSeason.toString()}
                onValueChange={(val) => {
                  const s = parseInt(val);
                  setSelectedSeason(s);
                  setSelectedEpisode(1);
                  if (isHost) broadcastPartySync({ season: s, episode: 1 });
                }}
              >
                <SelectTrigger className="h-7 border-0 bg-transparent text-[11px] font-semibold text-white/90 px-2 min-w-[75px] focus:ring-0">
                  <SelectValue placeholder="Saison" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      Saison {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-white/30 text-xs">•</span>

              <Select
                value={selectedEpisode.toString()}
                onValueChange={(val) => {
                  const ep = parseInt(val);
                  setSelectedEpisode(ep);
                  if (isHost) broadcastPartySync({ episode: ep });
                }}
              >
                <SelectTrigger className="h-7 border-0 bg-transparent text-[11px] font-semibold text-white/90 px-2 min-w-[90px] focus:ring-0">
                  <SelectValue placeholder="Épisode" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-56">
                  {episodes.map((ep) => (
                    <SelectItem key={ep.id} value={ep.episode_number.toString()}>
                      Ép. {ep.episode_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Top-Right : BOUTONS WATCH PARTY & OPTIONS FLOTTANTS */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Watch Party Active Indicator Badge */}
          {isPartyConnected && (
            <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-[#95FF50]/15 border border-[#95FF50]/40 text-[#95FF50] text-xs font-semibold backdrop-blur-xl shadow-lg">
              <Radio size={14} className="animate-pulse" />
              <span>Party : {partyCode} {isHost ? '(Hôte)' : ''}</span>
              {isHost && connectedUsersCount > 0 && (
                <span className="bg-[#95FF50] text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  +{connectedUsersCount}
                </span>
              )}
            </div>
          )}

          {/* Watch Party Shortcut */}
          <button
            onClick={() => {
              setSettingsView('party');
              setSettingsOpen(true);
            }}
            className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full backdrop-blur-xl border border-white/15 shadow-2xl transition text-xs font-semibold ${
              isPartyConnected
                ? 'bg-[#95FF50] text-black border-[#95FF50]'
                : 'bg-black/75 hover:bg-black/95 text-white/90 hover:text-white'
            }`}
            title="Watch Party (Regarder ensemble à distance)"
          >
            <Users size={16} className={isPartyConnected ? 'text-black' : 'text-[#95FF50]'} />
            <span className="hidden sm:inline">Watch Party</span>
          </button>

          {/* Raccourci Sous-titres (CC) */}
          <button
            onClick={() => {
              setSettingsView('subtitles');
              setSettingsOpen(true);
            }}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-full backdrop-blur-xl border border-white/15 shadow-2xl transition text-xs font-semibold ${
              activeSubtitle
                ? 'bg-[#95FF50]/20 border-[#95FF50]/50 text-[#95FF50]'
                : 'bg-black/75 hover:bg-black/95 text-white/90 hover:text-white'
            }`}
            title="Gérer les sous-titres (Français, VOST...)"
          >
            <Subtitles size={16} className={activeSubtitle ? 'text-[#95FF50]' : 'text-white/80'} />
            <span className="hidden sm:inline">
              {activeSubtitle ? activeSubtitle.label : 'CC'}
              {subtitlesList.length > 0 ? ` (${subtitlesList.length})` : ''}
            </span>
          </button>

          {/* Bouton Cast direct */}
          <button
            onClick={handleCastToTV}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-black/75 hover:bg-black/95 text-white/90 hover:text-white backdrop-blur-xl border border-white/15 shadow-2xl transition"
            title="Projeter sur la TV (Cast / AirPlay)"
          >
            <Cast size={18} className="text-[#95FF50]" />
          </button>

          {/* Bouton Options & Serveurs */}
          <button
            onClick={() => {
              setSettingsView('main');
              setSettingsOpen(!settingsOpen);
            }}
            className={`flex items-center gap-1.5 h-10 px-3.5 rounded-full backdrop-blur-xl border border-white/15 shadow-2xl transition text-xs font-semibold ${
              settingsOpen
                ? 'bg-[#95FF50] text-black border-[#95FF50]'
                : 'bg-black/75 hover:bg-black/95 text-white/90 hover:text-white'
            }`}
            title="Options & Serveurs"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Options</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TIROIR D'OPTIONS CINEJOY FLOTTANT (Sur le côté droit)       */}
      {/* ============================================================== */}
      {settingsOpen && (
        <div className="absolute right-3.5 sm:right-5 top-16 sm:top-20 z-40 w-[320px] sm:w-[360px] bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
          {/* VUE : WATCH PARTY (Rejoindre & Créer une session live) */}
          {settingsView === 'party' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium"
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Watch Party</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Si déjà dans une party */}
              {isPartyConnected ? (
                <div className="space-y-3 bg-white/[0.04] p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 font-medium">Statut de la session :</span>
                    <span className="text-xs font-bold text-[#95FF50]">Active</span>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase font-semibold">Code de la Party</p>
                      <p className="text-lg font-mono font-bold tracking-widest text-[#95FF50]">{partyCode}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (partyCode && navigator.clipboard) {
                          navigator.clipboard.writeText(partyCode);
                          toast.success('Code copié !');
                        }
                      }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                      title="Copier le code"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  {isHost && (
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      👑 <strong>Vous êtes l'hôte :</strong> Dès que vous changez de serveur ou d'épisode, tous vos amis se synchronisent instantanément avec vous.
                    </p>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        const fullLink = `${window.location.origin}/watch/${type}/${id}?party=${partyCode}`;
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(fullLink);
                          toast.success('Lien d’invitation copié ! Envoie-le à tes potes.');
                        }
                      }}
                      className="w-full rounded-full bg-[#95FF50] text-black font-semibold hover:bg-[#85ee40] text-xs h-9"
                    >
                      <Share2 size={14} className="mr-1.5" />
                      Partager le lien d'invitation
                    </Button>

                    <Button
                      onClick={handleLeaveParty}
                      variant="outline"
                      className="w-full rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs h-9"
                    >
                      <LogOut size={14} className="mr-1.5" />
                      Quitter la Watch Party
                    </Button>
                  </div>
                </div>
              ) : (
                /* Pas encore dans une party : 2 OPTIONS */
                <div className="space-y-4">
                  {/* Option 1 : CRÉER / SHARE PARTY */}
                  <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/10 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-[#95FF50]/20 flex items-center justify-center">
                        <Share2 size={16} className="text-[#95FF50]" />
                      </div>
                      <h4 className="text-xs font-bold text-white">Créer une Party (Share)</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Créez un code unique. Vos amis qui rejoignent regarderont en même temps que vous et suivront vos choix d'épisodes et de serveurs.
                    </p>
                    <Button
                      onClick={handleCreateParty}
                      className="w-full rounded-full bg-[#95FF50] text-black font-semibold hover:bg-[#85ee40] text-xs h-9"
                    >
                      Créer ma Watch Party
                    </Button>
                  </div>

                  {/* Option 2 : REJOINDRE / JOIN PARTY */}
                  <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/10 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-sky-400/20 flex items-center justify-center">
                        <Users size={16} className="text-sky-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white">Rejoindre une Party (Join)</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Entrez le code à 6 caractères donné par votre ami pour synchroniser votre flux avec le sien.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: 8X4A92"
                        value={inputJoinCode}
                        onChange={(e) => setInputJoinCode(e.target.value)}
                        className="h-9 bg-black/60 border-white/15 text-xs text-white uppercase tracking-wider font-mono"
                        maxLength={8}
                      />
                      <Button
                        onClick={() => handleJoinParty(inputJoinCode)}
                        className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0"
                      >
                        Rejoindre
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VUE : LISTE DES SERVEURS & FLUX DIRECT HLS */}
          {settingsView === 'servers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium"
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Sources Vidéo</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* SECTION 1 : MODE DIRECT HLS (MÉTHODE 1) */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#95FF50]/15 to-emerald-950/20 border border-[#95FF50]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#95FF50]" />
                    <span className="text-xs font-bold text-white">Flux Direct HLS (Sans iframe)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#95FF50] text-black">
                    Méthode 1
                  </span>
                </div>

                <p className="text-[11px] text-white/70 leading-relaxed">
                  Extrait automatiquement le fichier <strong className="text-white">.m3u8</strong> brut pour jouer la vidéo directement dans le lecteur natif HTML5 sans aucune publicité.
                </p>

                {directStream ? (
                  <div className="pt-1 flex items-center justify-between">
                    <div className="text-[11px] text-white/90">
                      <span>Qualité : </span>
                      <strong className="text-[#95FF50]">{directStream.qualities[0]?.quality || '1080p'}</strong>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const next = !useDirectStream;
                        setUseDirectStream(next);
                        toast.success(next ? 'Flux direct HLS activé !' : 'Retour aux serveurs embed');
                      }}
                      className={`h-7 px-3 rounded-full text-xs font-bold transition ${
                        useDirectStream
                          ? 'bg-[#95FF50] text-black hover:bg-[#85ee40]'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {useDirectStream ? 'Désactiver Direct' : 'Activer Direct HLS'}
                    </Button>
                  </div>
                ) : isResolvingDirect ? (
                  <div className="flex items-center gap-2 text-xs text-[#95FF50] pt-1">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Recherche d'un flux .m3u8 disponible...</span>
                  </div>
                ) : (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-white/50">Flux direct en attente</span>
                    <button
                      onClick={() => {
                        setIsResolvingDirect(true);
                        const title = media?.title || media?.name || '';
                        resolveDirectHLSStream(id || '', type as 'movie' | 'tv', selectedSeason, selectedEpisode, title)
                          .then((res) => {
                            if (res) {
                              setDirectStream(res);
                              setUseDirectStream(true);
                              toast.success('Flux HLS direct trouvé et activé !');
                            } else {
                              toast.info('Aucun flux direct instantané, utilisation des serveurs embed');
                            }
                            setIsResolvingDirect(false);
                          });
                      }}
                      className="text-[11px] text-[#95FF50] hover:underline font-semibold"
                    >
                      Scanner maintenant
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2 : SERVEURS EMBED CLASSIQUES */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block px-1">
                  Serveurs de streaming alternatifs ({providersList.length})
                </span>

                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                  {providersList.map((p) => {
                    const isCur = !useDirectStream && p.id === provider?.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setUseDirectStream(false);
                          handleSelectServer(p);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                          isCur
                            ? 'bg-[#95FF50]/20 border border-[#95FF50]/50 text-white'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="font-semibold">{p.name}</span>
                          {p.warning && <span className="text-[10px] text-white/50 truncate">{p.warning}</span>}
                        </div>
                        {isCur && <Check size={16} className="text-[#95FF50] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VUE : SOUS-TITRES & GESTION EN DIRECT */}
          {settingsView === 'subtitles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium"
                >
                  <ArrowLeft size={16} />
                  <span>Sous-titres ({subtitlesList.length})</span>
                </button>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Sous-titre actuellement actif */}
              {activeSubtitle ? (
                <div className="p-3 rounded-2xl bg-[#95FF50]/10 border border-[#95FF50]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{activeSubtitle.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-[#95FF50]">Actif : {activeSubtitle.label}</p>
                      <p className="text-[10px] text-white/60">Piste synchronisée</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveSubtitle(null);
                      setActiveTrackBlobUrl(null);
                      toast.info('Sous-titre désactivé');
                    }}
                    className="h-7 px-2.5 rounded-lg border-white/20 text-white hover:bg-white/10 text-[11px]"
                  >
                    Désactiver
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                  <p className="text-xs font-semibold text-white">Sous-titres automatiques</p>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Sélectionne une piste ci-dessous pour l'activer sur le lecteur ou télécharge le fichier .srt.
                  </p>
                </div>
              )}

              {/* Barre de recherche de langue */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  placeholder="Filtrer par langue (ex: Français, English)..."
                  value={subtitleSearch}
                  onChange={(e) => setSubtitleSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-white/[0.05] border-white/10 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>

              {/* Liste des sous-titres récupérés */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {subtitlesLoading ? (
                  <div className="py-8 text-center text-xs text-white/50 flex flex-col items-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-[#95FF50]" />
                    <span>Récupération des pistes de sous-titres...</span>
                  </div>
                ) : (
                  (() => {
                    const filtered = subtitlesList.filter(
                      (s) =>
                        s.label.toLowerCase().includes(subtitleSearch.toLowerCase()) ||
                        s.language.toLowerCase().includes(subtitleSearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs text-white/40">
                          Aucun sous-titre trouvé pour cette recherche.
                        </div>
                      );
                    }

                    return filtered.map((sub) => {
                      const isActive = activeSubtitle?.id === sub.id;
                      return (
                        <div
                          key={sub.id}
                          className={`flex items-center justify-between p-2 rounded-xl border transition ${
                            isActive
                              ? 'bg-[#95FF50]/15 border-[#95FF50]/40 text-white'
                              : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-white/90'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-sm">{sub.flag}</span>
                            <span className="text-xs font-medium truncate">{sub.label}</span>
                            <span className="text-[10px] text-white/40 uppercase font-mono">[{sub.language}]</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSelectSubtitle(sub)}
                              className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition ${
                                isActive
                                  ? 'bg-[#95FF50] text-black'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              {isActive ? 'Actif' : 'Activer'}
                            </button>
                            <button
                              onClick={() => handleDownloadSubtitle(sub)}
                              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition"
                              title="Télécharger le fichier (.srt)"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              {/* Paramètres de style des sous-titres */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                {/* Switch Native */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Sous-titres natifs</p>
                    <p className="text-[10px] text-white/50">Moteur intégré au navigateur</p>
                  </div>
                  <Switch checked={nativeSubtitles} onCheckedChange={setNativeSubtitles} />
                </div>

                {/* Mode Pastel */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Mode Pastel</p>
                  <Switch checked={pastelMode} onCheckedChange={setPastelMode} />
                </div>

                {/* Choix Police */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold">Style de police</p>
                  <div className="grid grid-cols-3 gap-1 bg-white/[0.04] p-1 rounded-xl">
                    {(['Cinejoy', 'Netflix', 'Montserrat'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSubtitleFont(f)}
                        className={`py-1 text-xs rounded-lg font-medium transition ${
                          subtitleFont === f ? 'bg-zinc-800 text-white shadow' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Taille du texte */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Taille du texte</span>
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
              </div>
            </div>
          )}

          {/* VUE : CAST SUR LA TV */}
          {settingsView === 'cast' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium"
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Projeter sur TV</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={async () => {
                    if ('presentation' in navigator && (navigator as any).presentation) {
                      try {
                        const req = new (window as any).PresentationRequest([watchUrl]);
                        await req.start();
                        toast.success('Diffusion envoyée vers la TV');
                        return;
                      } catch (e) {}
                    }
                    toast.info('Utilise le menu "Caster..." dans les options de ton navigateur Chrome/Brave/Edge.');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Cast size={18} className="text-[#95FF50]" />
                    <div>
                      <p className="text-xs font-semibold text-white">Chromecast / Google TV</p>
                      <p className="text-[10px] text-white/50">Box TV, Android TV, Google Cast</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-white/40" />
                </button>

                <button
                  onClick={() => {
                    toast.info('Sur Mac ou iPhone : active la recopie AirPlay dans le Centre de Contrôle vers ton Apple TV.');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Tv size={18} className="text-sky-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Apple AirPlay</p>
                      <p className="text-[10px] text-white/50">Apple TV, Mac, iPad, iPhone</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-white/40" />
                </button>

                <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/10 space-y-2">
                  <p className="text-xs font-semibold text-white">Lien pour Smart TV (Samsung, LG...)</p>
                  <p className="text-[11px] text-white/60">
                    Ouvre le navigateur web de ta télé et colle directement ce lien :
                  </p>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Lien copié !');
                      }
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#95FF50] transition flex items-center justify-center gap-2"
                  >
                    <Copy size={14} />
                    <span>Copier le lien complet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VUE PRINCIPALE DU TIROIR CINEJOY */}
          {settingsView === 'main' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold tracking-wider uppercase text-white/60">Options du Lecteur</span>
                <button onClick={() => setSettingsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* 2x2 Grid : SERVEUR, QUALITÉ, SOUS-TITRES, WATCH PARTY */}
              <div className="grid grid-cols-2 gap-2">
                {/* SERVEUR */}
                <button
                  onClick={() => setSettingsView('servers')}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Serveur
                  </span>
                  <span className="text-xs font-bold text-[#95FF50] mt-0.5 truncate block">
                    {provider?.name?.split(' ')[0] || 'Vidsrc'}
                  </span>
                </button>

                {/* QUALITÉ */}
                <button
                  onClick={() => {
                    setQuality((prev) => (prev === 'Auto' ? '1080p' : prev === '1080p' ? '720p' : 'Auto'));
                    toast.info(`Qualité : ${quality === 'Auto' ? '1080p' : quality === '1080p' ? '720p' : 'Auto'}`);
                  }}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Qualité
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{quality}</span>
                </button>

                {/* SOUS-TITRES */}
                <button
                  onClick={() => setSettingsView('subtitles')}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Sous-titres
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block">Config [CC]</span>
                </button>

                {/* WATCH PARTY */}
                <button
                  onClick={() => setSettingsView('party')}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-3 text-left transition"
                >
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-white/50 block">
                    Watch Party
                  </span>
                  <span className="text-xs font-bold text-[#95FF50] mt-0.5 block">
                    {isPartyConnected ? partyCode : 'Lancer'}
                  </span>
                </button>
              </div>

              {/* Action List items */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => setSettingsView('party')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-[#95FF50]" />
                    <span>Watch Party (Share / Join)</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </button>

                <button
                  onClick={() => setSettingsView('cast')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Tv size={16} className="text-[#95FF50]" />
                    <span>Projeter sur la TV (Cast)</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </button>

                <button
                  onClick={() => {
                    setReloadKey((prev) => prev + 1);
                    toast.info('Lecteur rechargé');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-xs font-medium transition"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw size={16} className="text-white/70" />
                    <span>Recharger le lecteur</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Watch;
