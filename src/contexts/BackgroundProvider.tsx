import React, { createContext, useContext, useEffect, useState } from 'react';
import { BgMode, getBgMode, setBgModeStored, saveVideo, loadVideo, deleteVideo } from '@/lib/background';

interface Ctx {
  mode: BgMode;
  setMode: (m: BgMode) => void;
  videoUrl: string | null;
  importVideo: (file: File) => Promise<void>;
  clearVideo: () => Promise<void>;
}
const BackgroundContext = createContext<Ctx | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<BgMode>(getBgMode);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Restore a previously imported video
  useEffect(() => {
    let url: string | null = null;
    loadVideo().then((blob) => { if (blob) { url = URL.createObjectURL(blob); setVideoUrl(url); } }).catch(() => undefined);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, []);

  const setMode = (m: BgMode) => { setModeState(m); setBgModeStored(m); };

  const importVideo = async (file: File) => {
    await saveVideo(file);
    setVideoUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
    setMode('video');
  };

  const clearVideo = async () => {
    await deleteVideo();
    setVideoUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    if (mode === 'video') setMode('liquid');
  };

  return (
    <BackgroundContext.Provider value={{ mode, setMode, videoUrl, importVideo, clearVideo }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): Ctx => {
  const c = useContext(BackgroundContext);
  if (!c) throw new Error('useBackground must be used within BackgroundProvider');
  return c;
};
