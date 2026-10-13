import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Aurora from '@/components/Aurora';
import MediaGrid from '@/components/MediaGrid';
import {
  getHistory,
  clearHistory,
  HistoryEntry,
  HISTORY_UPDATED_EVENT,
} from '@/lib/history';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

const History: React.FC = () => {
  const [items, setItems] = useState<HistoryEntry[]>(getHistory);

  useEffect(() => {
    const sync = () => setItems(getHistory());
    window.addEventListener(HISTORY_UPDATED_EVENT, sync);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, sync);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Aurora />
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-16 text-left">
          <div className="flex items-center justify-between mb-8 gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <HistoryIcon size={28} /> Historique
            </h1>
            {items.length > 0 && (
              <button onClick={clearHistory}
                className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
                <Trash2 size={15} /> Tout effacer
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <HistoryIcon size={28} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-white font-semibold">Rien pour l'instant</p>
              <p className="text-sm text-muted-foreground mt-1">Les titres que tu ouvres apparaîtront ici.</p>
            </div>
          ) : (
            <MediaGrid title="" medias={items} />
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
