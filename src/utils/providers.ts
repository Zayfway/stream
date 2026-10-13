
export interface Provider {
  id: string;
  name: string;
  movieUrl: string;
  tvUrl: string;
  warning?: string;
  script?: string;
  isHLSPlayer?: boolean;
}

// Add function to manage favorite provider
export const getFavoriteProviderId = (): string => {
  return localStorage.getItem('favoriteProvider') || 'vidsrc';
};

export const setFavoriteProvider = (providerId: string): void => {
  localStorage.setItem('favoriteProvider', providerId);
};

export const getDefaultProvider = (): Provider => {
  const favoriteId = getFavoriteProviderId();
  return providers.find(p => p.id === favoriteId) || providers[0];
