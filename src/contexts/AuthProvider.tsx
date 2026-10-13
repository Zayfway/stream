import React, { createContext, useContext, useState } from 'react';
import {
  AuthUser,
  getStoredUser,
  saveUser,
  clearUser,
  makeUserId,
} from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (name: string, email?: string) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<Pick<AuthUser, 'name' | 'email'>>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const signIn = (name: string, email?: string) => {
    const u: AuthUser = {
      id: user?.id ?? makeUserId(),
      name: name.trim() || 'Moi',
      email: email?.trim() || undefined,
      createdAt: user?.createdAt ?? Date.now(),
    };
    saveUser(u);
    setUser(u);
  };

  const signOut = () => {
    clearUser();
    setUser(null);
  };

  const updateProfile = (patch: Partial<Pick<AuthUser, 'name' | 'email'>>) => {
    if (!user) return;
    const u = { ...user, ...patch };
    saveUser(u);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
