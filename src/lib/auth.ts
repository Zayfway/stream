export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  createdAt: number;
}

export const AUTH_KEY = 'meystream-user';

/*
  Local-first accounts.
  ---------------------
  A profile lives on this device (localStorage) so the app works offline and in
  the packaged iOS build with zero backend. The shape is deliberately minimal and
  backend-ready: swap getStoredUser/saveUser for calls to a hosted API (e.g. the
  user's Render service) to get real cross-device sync — the rest of the app only
  depends on this interface, not on where the data lives.
*/

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function clearUser(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

export function makeUserId(): string {
  return `u_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
