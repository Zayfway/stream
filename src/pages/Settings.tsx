import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Aurora from '@/components/Aurora';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCursor } from '@/contexts/CursorProvider';
import { useSearchButton } from '@/contexts/SearchButtonProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { makeId } from '@/lib/customTheme';
import { hexHue } from '@/lib/color';
import { CURSOR_PRESETS, fileToCursorUrl, CursorConfig } from '@/lib/cursor';
import { fileToSearchButtonUrl } from '@/lib/searchButton';
import {
  Provider,
  getSources,
  addSource,
  updateSource,
  removeSource,
  setFavoriteProvider,
  getFavoriteProviderId,
  SOURCES_UPDATED_EVENT,
} from '@/utils/providers';
import { getWatchRegion, setWatchRegion } from '@/utils/watchProviders';
import {
  Palette,
  Server,
  Info,
  Check,
  ArrowLeft,
  User,
  Play,
  MousePointer2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Pencil,
  Search as SearchIcon,
  LogOut,
} from 'lucide-react';

type TabId = 'account' | 'appearance' | 'sources' | 'playback' | 'about';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'account', label: 'Compte', icon: User },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'sources', label: 'Sources', icon: Server },
  { id: 'playback', label: 'Lecture', icon: Play },
  { id: 'about', label: 'À propos', icon: Info },
];

const REGIONS = [
  ['US', 'États-Unis'], ['FR', 'France'], ['GB', 'Royaume-Uni'], ['CA', 'Canada'],
  ['BE', 'Belgique'], ['CH', 'Suisse'], ['DE', 'Allemagne'], ['ES', 'Espagne'],
  ['IT', 'Italie'], ['NL', 'Pays-Bas'], ['BR', 'Brésil'], ['JP', 'Japon'],
];

const Section: React.FC<{ title: string; desc?: string; children: React.ReactNode }> = ({
  title, desc, children,
}) => (
  <section className="space-y-5">
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {desc && <p className="text-muted-foreground text-sm mt-1">{desc}</p>}
    </div>
    {children}
  </section>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 ${className}`}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ Account */
const AccountSection: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  return (
    <Section title="Compte" desc="Un profil local pour garder ta liste, ta progression et ton style. La sync multi-appareils arrivera via le serveur.">
      <Card>
        {user ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-brand-foreground text-lg font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email || 'Profil local'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); signIn(name, email); toast.success('Profil créé'); }}
            className="space-y-4"
          >
            <p className="text-sm text-white/80">Crée ton profil pour synchroniser tes réglages et ta progression.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Ton nom" aria-label="Nom"
                className="h-11 rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white placeholder:text-muted-foreground outline-none focus:border-white/25"
              />
              <input
                value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                placeholder="Email (optionnel)" aria-label="Email"
                className="h-11 rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white placeholder:text-muted-foreground outline-none focus:border-white/25"
              />
            </div>
            <button type="submit" className="rounded-full bg-white px-6 py-2.5 font-semibold text-black transition hover:bg-white/90">
              Créer mon profil
            </button>
          </form>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {[['Trakt', 'Synchronise liste, historique et progression'], ['Simkl', 'Synchronise liste, historique et progression']].map(([n, d]) => (
          <Card key={n} className="flex items-center justify-between gap-3 opacity-70">
            <div>
              <p className="font-semibold text-white">Connecter {n}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </div>
            <span className="text-xs rounded-full border border-white/12 px-2.5 py-1 text-muted-foreground">Bientôt</span>
          </Card>
        ))}
      </div>
    </Section>
  );
};

/* -------------------------------------------------------------- Theme builder */
const ThemeBuilder: React.FC = () => {
  const { saveCustomTheme, previewCustomTheme } = useTheme();
  const [brand, setBrand] = useState('#d85f78');
  const [brand2, setBrand2] = useState('#e8824a');
  const [tint, setTint] = useState(hexHue('#d85f78'));
  const [radius, setRadius] = useState(1);
  const [name, setName] = useState('Mon thème');

  const draft = { id: 'draft', name, brand, brand2, tintHue: tint, radius };

  const preview = () => previewCustomTheme(draft);

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <Palette size={18} className="text-brand" />
        <h3 className="font-semibold text-white">Créer un thème</h3>
      </div>

      <div
        className="h-16 w-full rounded-xl"
        style={{ backgroundImage: `linear-gradient(135deg, ${brand}, ${brand2})` }}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex items-center justify-between gap-3 text-sm text-white/80">
          Couleur 1
          <input type="color" value={brand}
            onChange={(e) => { setBrand(e.target.value); setTint(hexHue(e.target.value)); }}
            className="h-9 w-14 rounded-md bg-transparent cursor-pointer" />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm text-white/80">
          Couleur 2
          <input type="color" value={brand2} onChange={(e) => setBrand2(e.target.value)}
            className="h-9 w-14 rounded-md bg-transparent cursor-pointer" />
        </label>
      </div>

      <label className="block text-sm text-white/80">
        <span className="flex justify-between"><span>Teinte du fond</span><span className="text-muted-foreground">{tint}°</span></span>
        <input type="range" min={0} max={360} value={tint} onChange={(e) => setTint(Number(e.target.value))}
          className="w-full mt-2 accent-white" />
      </label>

      <label className="block text-sm text-white/80">
        <span className="flex justify-between"><span>Arrondi</span><span className="text-muted-foreground">{radius.toFixed(2)}rem</span></span>
        <input type="range" min={0} max={1.5} step={0.05} value={radius} onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full mt-2 accent-white" />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du thème"
          className="h-10 flex-1 min-w-[160px] rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white placeholder:text-muted-foreground outline-none focus:border-white/25" />
        <button onClick={preview} className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
          Aperçu
        </button>
        <button
          onClick={() => { saveCustomTheme({ ...draft, id: makeId(), name: name || 'Mon thème' }); toast.success('Thème enregistré'); }}
          className="rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Enregistrer
        </button>
      </div>
    </Card>
  );
};

/* -------------------------------------------------------------- Cursor section */
const cursorValueFor = (cfg: CursorConfig): string => {
  const url = cfg.presetId === 'custom'
    ? cfg.imageUrl
    : CURSOR_PRESETS.find((p) => p.id === cfg.presetId)?.url;
  if (cfg.presetId === 'system' || !url) return 'auto';
  return `url("${url}") ${cfg.hotspotX} ${cfg.hotspotY}, auto`;
};

const CursorSection: React.FC = () => {
  const { cursor, setCursor, resetCursor } = useCursor();
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (f: File) => {
    try {
      const url = await fileToCursorUrl(f);
      setCursor({ presetId: 'custom', imageUrl: url, hotspotX: 0, hotspotY: 0 });
      toast.success('Curseur importé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import impossible');
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <MousePointer2 size={18} className="text-brand" />
        <h3 className="font-semibold text-white">Curseur</h3>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {CURSOR_PRESETS.map((p) => {
          const active = cursor.presetId === p.id;
          return (
            <button key={p.id}
              onClick={() => setCursor({ presetId: p.id, hotspotX: p.hotspot[0], hotspotY: p.hotspot[1] })}
              className={`rounded-xl border px-4 py-2 text-sm transition ${active ? 'border-transparent brand-ring text-white' : 'border-white/12 text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              {p.label}
            </button>
          );
        })}
        <button onClick={() => fileRef.current?.click()}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${cursor.presetId === 'custom' ? 'border-transparent brand-ring text-white' : 'border-white/12 text-white/75 hover:bg-white/10 hover:text-white'}`}>
          <Upload size={14} /> Importer
        </button>
        <input ref={fileRef} type="file" accept=".png,.svg,.gif,.webp,.ico" className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-28 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-xs text-muted-foreground"
          style={{ cursor: cursorValueFor(cursor) }}
        >
          survole-moi
        </div>
        <button onClick={resetCursor} className="text-sm text-muted-foreground hover:text-white transition">
          Réinitialiser
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Le curseur custom ne s'applique pas sur écran tactile.</p>
    </Card>
  );
};

/* ------------------------------------------------------- Search button section */
const SearchButtonSection: React.FC = () => {
  const { searchButton, setSearchButton, resetSearchButton } = useSearchButton();
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (f: File) => {
    try {
      const url = await fileToSearchButtonUrl(f);
      setSearchButton({ type: 'image', imageUrl: url });
      toast.success('Bouton mis à jour');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import impossible');
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon size={18} className="text-brand" />
        <h3 className="font-semibold text-white">Bouton de recherche</h3>
      </div>
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full overflow-hidden border border-white/12 bg-white/[0.05]">
          {searchButton.type === 'image' && searchButton.imageUrl
            ? <img src={searchButton.imageUrl} alt="" className="h-6 w-6 object-contain" />
            : <SearchIcon size={20} className="text-white/80" />}
        </span>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
          <Upload size={14} /> Importer une image
        </button>
        <button onClick={resetSearchButton} className="text-sm text-muted-foreground hover:text-white transition">
          Réinitialiser
        </button>
        <input ref={fileRef} type="file" accept=".png,.svg,.webp,.jpg,.jpeg" className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------- Sources manager */
const EMPTY_FORM = { name: '', movieUrl: '', tvUrl: '' };

const SourcesSection: React.FC = () => {
  const [sources, setSources] = useState<Provider[]>(getSources);
  const [def, setDef] = useState(getFavoriteProviderId());
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    const sync = () => { setSources(getSources()); setDef(getFavoriteProviderId()); };
    window.addEventListener(SOURCES_UPDATED_EVENT, sync);
    return () => window.removeEventListener(SOURCES_UPDATED_EVENT, sync);
  }, []);

  const startEdit = (s: Provider) => {
    setEditingId(s.id);
    setForm({ name: s.name, movieUrl: s.movieUrl, tvUrl: s.tvUrl });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.movieUrl) { toast.error('Nom et URL film requis'); return; }
    if (editingId) {
      updateSource({ id: editingId, name: form.name, movieUrl: form.movieUrl, tvUrl: form.tvUrl || form.movieUrl });
      toast.success('Source mise à jour');
    } else {
      addSource({ id: makeId(), name: form.name, movieUrl: form.movieUrl, tvUrl: form.tvUrl || form.movieUrl });
      toast.success('Source ajoutée');
    }
    cancelEdit();
  };

  return (
    <Section title="Sources" desc="Une source, c'est une base qui dessert plein de titres (via le jeton {tmdb_id}), pas un seul film. Ajoute-en autant que tu veux — Plex, Pluto TV, ton serveur.">
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((s) => (
            <Card key={s.id} className={`flex items-center justify-between gap-3 py-4 ${editingId === s.id ? 'brand-ring border-transparent' : ''}`}>
              <label className="flex items-center gap-3 cursor-pointer min-w-0">
                <input type="radio" name="default-source" checked={def === s.id}
                  onChange={() => { setFavoriteProvider(s.id); setDef(s.id); }} className="accent-white shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{s.name} {def === s.id && <span className="text-xs text-brand">· défaut</span>}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">{s.movieUrl}</p>
                </div>
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(s)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-white" aria-label="Modifier">
                  <Pencil size={15} />
                </button>
                <button onClick={() => { removeSource(s.id); if (editingId === s.id) cancelEdit(); toast('Source retirée'); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-white" aria-label="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <form onSubmit={submit} className="space-y-3">
          <p className="font-semibold text-white flex items-center gap-2">
            {editingId ? <><Pencil size={15} /> Modifier la source</> : <><Plus size={16} /> Ajouter une source</>}
          </p>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nom (ex: Mon Plex)"
            className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white placeholder:text-muted-foreground outline-none focus:border-white/25" />
          <input value={form.movieUrl} onChange={(e) => setForm({ ...form, movieUrl: e.target.value })}
            placeholder="URL film — …/movie/{tmdb_id}"
            className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white placeholder:text-muted-foreground outline-none focus:border-white/25 font-mono text-sm" />
          <input value={form.tvUrl} onChange={(e) => setForm({ ...form, tvUrl: e.target.value })}
            placeholder="URL série — …/tv/{tmdb_id}/{season_number}/{episode_number} (optionnel)"
            className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white placeholder:text-muted-foreground outline-none focus:border-white/25 font-mono text-sm" />
          <div className="flex items-center gap-2">
            <button type="submit" className="rounded-full bg-white px-5 py-2.5 font-semibold text-black transition hover:bg-white/90">
              {editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
                Annuler
              </button>
            )}
          </div>
        </form>
      </Card>

      {sources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <Server size={26} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-white font-semibold">Aucune source configurée</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoute ta première source ci-dessus.</p>
        </div>
      )}
    </Section>
  );
};

/* -------------------------------------------------------------- Playback section */
const PlaybackSection: React.FC = () => {
  const [region, setRegion] = useState(getWatchRegion());
  return (
    <Section title="Lecture" desc="Préférences de lecture et de découverte.">
      <Card className="space-y-2">
        <p className="font-semibold text-white">Région</p>
        <p className="text-sm text-muted-foreground">Détermine la disponibilité par chaîne dans « Browse by Provider ».</p>
        <select value={region}
          onChange={(e) => { setRegion(e.target.value); setWatchRegion(e.target.value); toast.success('Région mise à jour'); }}
          className="mt-2 h-11 rounded-xl border border-white/12 bg-white/[0.05] px-4 text-white outline-none focus:border-white/25">
          {REGIONS.map(([code, label]) => (
            <option key={code} value={code} className="bg-background">{label} ({code})</option>
          ))}
        </select>
      </Card>
    </Section>
  );
};

/* --------------------------------------------------------------------- Settings */
const Settings: React.FC = () => {
  const { theme, setTheme, themes, customThemes, deleteCustomTheme } = useTheme();
  const location = useLocation();
  const initialTab = (new URLSearchParams(location.search).get('tab') as TabId) || 'appearance';
  const validTab = TABS.some((t) => t.id === initialTab) ? initialTab : 'appearance';
  const [tab, setTab] = useState<TabId>(validTab);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Aurora />
      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 text-left">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Retour">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Réglages</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-3">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                <t.icon size={16} />{t.label}
              </button>
            );
          })}
        </div>

        {tab === 'account' && <AccountSection />}

        {tab === 'appearance' && (
          <div className="space-y-8">
            <Section title="Thème" desc="Choisis la palette de toute l'interface. Ça s'applique partout, direct.">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {themes.map((t) => {
                  const active = theme === t.id;
                  return (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={`group relative text-left rounded-2xl border p-4 transition-all ${active ? 'border-transparent brand-ring bg-white/[0.06]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'}`}>
                      <div className="h-16 w-full rounded-xl mb-3" style={{ backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{t.name}</span>
                        {active && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient"><Check size={12} className="text-brand-foreground" strokeWidth={3} /></span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                    </button>
                  );
                })}

                {customThemes.map((c) => {
                  const active = theme === `custom:${c.id}`;
                  return (
                    <div key={c.id} className={`group relative text-left rounded-2xl border p-4 transition-all ${active ? 'border-transparent brand-ring bg-white/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                      <button onClick={() => setTheme(`custom:${c.id}`)} className="block w-full text-left">
                        <div className="h-16 w-full rounded-xl mb-3" style={{ backgroundImage: `linear-gradient(135deg, ${c.brand}, ${c.brand2})` }} />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-sm truncate">{c.name}</span>
                          {active && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient"><Check size={12} className="text-brand-foreground" strokeWidth={3} /></span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Thème perso</p>
                      </button>
                      <button onClick={() => deleteCustomTheme(c.id)} aria-label="Supprimer"
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 transition hover:text-white">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Section>

            <ThemeBuilder />

            <div className="grid lg:grid-cols-2 gap-5">
              <CursorSection />
              <SearchButtonSection />
            </div>
          </div>
        )}

        {tab === 'sources' && <SourcesSection />}
        {tab === 'playback' && <PlaybackSection />}

        {tab === 'about' && (
          <Section title="À propos">
            <Card className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-brand-foreground text-2xl font-extrabold">M</span>
              <div>
                <h2 className="text-xl font-bold text-white">MeyStream</h2>
                <p className="text-sm text-muted-foreground">Ton catalogue, ton style. Propulsé par TMDB.</p>
              </div>
            </Card>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les métadonnées (affiches, synopsis, notes, disponibilité par chaîne) proviennent de TMDB &amp; JustWatch. Les sources de lecture sont celles que tu configures toi-même.
            </p>
          </Section>
        )}
      </div>
    </div>
  );
};

export default Settings;
