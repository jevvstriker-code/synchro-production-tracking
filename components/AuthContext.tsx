'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthController } from '@/controllers/useAuthController';
import { AppUser } from '@/types';

interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  authError: string | null;
  welcomeBanner: string | null;
  dismissWelcomeBanner: () => void;
  portalMode: 'production' | 'qc';
  setPortalMode: (mode: 'production' | 'qc') => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isSupervisor: boolean;
  isFitter: boolean;
  isQCInspector: boolean;
  isDashboardViewer: boolean;
  canView: (module: string) => boolean;
  requiresApproval: () => boolean;
  loginWithPin: (pin: string, requestedMode?: 'production' | 'qc') => Promise<AppUser | null>;
  loginWithCredentials: (username: string, secret: string, requestedMode?: 'production' | 'qc') => Promise<AppUser | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthController();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
