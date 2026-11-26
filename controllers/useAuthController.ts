'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppUser } from '@/types';
import { userService } from '@/services/userService';

const AUTH_STORAGE_KEY = 'synchro_production_auth_user';
const PORTAL_MODE_KEY = 'synchro_portal_mode';
const ANIMATION_STORAGE_KEY = 'synchro_enable_animations';

export const PRODUCTION_PUNS = [
  "Let's build with precision! Spark the line, tighten the busbars, and keep the current flowing!",
  "Turning raw sheet metal and copper into engineering masterpieces — one panel at a time!",
  "Built tough, wired right, energized to perfection. Let's make today's production legendary!",
  "Current flows where focus goes — let's power up the assembly lines!",
  "High voltage enthusiasm, zero resistance teamwork!"
];

export const QC_PUNS = [
  "Let's check every millimeter! Catching defects today so our customers catch pure excellence tomorrow.",
  "In God we trust; everything else, we test, measure, and verify!",
  "Zero defects isn't just a goal — it's the only standard we ship!",
  "QC motto: If it's not documented and verified, it didn't pass inspection!",
  "We don't find faults to blame, we find them to build unmatched quality!"
];

export const DEV_PUNS = [
  "Master Developer override engaged. Building high-voltage systems and fault-tolerant architecture!",
  "System running at peak frequency — zero downtime, maximum throughput!"
];

export function useAuthController() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [portalMode, setPortalModeState] = useState<'production' | 'qc'>('production');
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);
  const [welcomeModalData, setWelcomeModalData] = useState<{
    user: AppUser;
    mode: 'production' | 'qc';
    quote: string;
  } | null>(null);

  useEffect(() => {
    try {
      // Do not automate login on app open - always require login when app reopens
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);

      const storedMode = localStorage.getItem(PORTAL_MODE_KEY) as 'production' | 'qc' | null;
      if (storedMode) {
        setPortalModeState(storedMode);
      }

      const storedAnim = localStorage.getItem(ANIMATION_STORAGE_KEY);
      if (storedAnim !== null) {
        setAnimationsEnabledState(storedAnim === 'true');
      }
    } catch (e) {
      console.error('Failed to init auth controller', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPortalMode = useCallback((mode: 'production' | 'qc') => {
    setPortalModeState(mode);
    try {
      localStorage.setItem(PORTAL_MODE_KEY, mode);
    } catch (e) {
      console.error('Failed to save portal mode', e);
    }
  }, []);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    try {
      localStorage.setItem(ANIMATION_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save animation preference', e);
    }
  }, []);

  const getRandomQuote = (targetMode: 'production' | 'qc', role: string) => {
    if (role === 'developer') {
      return DEV_PUNS[Math.floor(Math.random() * DEV_PUNS.length)];
    }
    if (targetMode === 'qc' || role === 'qc_inspector') {
      return QC_PUNS[Math.floor(Math.random() * QC_PUNS.length)];
    }
    return PRODUCTION_PUNS[Math.floor(Math.random() * PRODUCTION_PUNS.length)];
  };

  const loginWithPin = useCallback(async (pin: string, requestedMode?: 'production' | 'qc'): Promise<AppUser | null> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await userService.authenticate(pin);
      if (user) {
        setCurrentUser(user);
        
        // Determine portal mode
        const mode = requestedMode || (user.role === 'qc_inspector' || user.role === 'dashboard_viewer' ? 'qc' : 'production');
        setPortalMode(mode);

        const quote = getRandomQuote(mode, user.role);
        if (animationsEnabled) {
          setWelcomeModalData({ user, mode, quote });
        }

        setWelcomeBanner(`Welcome, ${user.full_name}!`);
        setTimeout(() => setWelcomeBanner(null), 6000);

        return user;
      } else {
        setAuthError('Invalid PIN code or inactive account.');
        return null;
      }
    } catch (e) {
      console.error('Login error', e);
      setAuthError('Authentication service error.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setPortalMode, animationsEnabled]);

  const loginWithCredentials = useCallback(
    async (username: string, passwordOrPin: string, requestedMode?: 'production' | 'qc'): Promise<AppUser | null> => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const user = await userService.authenticate(username, passwordOrPin);
        if (user) {
          setCurrentUser(user);
          
          const mode = requestedMode || (user.role === 'qc_inspector' || user.role === 'dashboard_viewer' ? 'qc' : 'production');
          setPortalMode(mode);

          const quote = getRandomQuote(mode, user.role);
          if (animationsEnabled) {
            setWelcomeModalData({ user, mode, quote });
          }

          setWelcomeBanner(`Welcome, ${user.full_name}!`);
          setTimeout(() => setWelcomeBanner(null), 6000);

          return user;
        } else {
          setAuthError('Invalid username, password, or PIN.');
          return null;
        }
      } catch (e) {
        console.error('Login error', e);
        setAuthError('Authentication service error.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setPortalMode, animationsEnabled]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setWelcomeBanner(null);
    setWelcomeModalData(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const dismissWelcomeModal = useCallback(() => {
    setWelcomeModalData(null);
  }, []);

  const canView = useCallback(
    (moduleId: string): boolean => {
      // 1. Admin and Developer always have full view access to everything
      if (currentUser?.role === 'admin' || currentUser?.role === 'developer') return true;

      // 2. Guest (unauthenticated) can only see public dashboard
      if (!currentUser) {
        return moduleId === 'dashboard' || moduleId === 'qc-dashboard';
      }

      // 3. Check granular permissions configured by Admin
      if (currentUser.permissions) {
        const key = `view_${moduleId.replace(/-/g, '_')}` as keyof typeof currentUser.permissions;
        if (currentUser.permissions[key] !== undefined) {
          return !!currentUser.permissions[key];
        }
      }

      // 4. Default fallback matrix by role
      switch (currentUser.role) {
        case 'supervisor':
          return ['dashboard', 'job-cards', 'qr-generator', 'assembly-lines', 'rework-register', 'reports', 'qc-dashboard', 'qc-registers'].includes(moduleId);
        case 'ppc':
          return ['dashboard', 'job-cards', 'qr-generator', 'assembly-lines', 'reports'].includes(moduleId);
        case 'fitter':
          return ['dashboard', 'job-cards', 'assembly-lines', 'rework-register'].includes(moduleId);
        case 'qc_inspector':
          return ['qc-dashboard', 'qc-shop-floor', 'qc-registers', 'qc-reports', 'dashboard', 'job-cards', 'assembly-lines', 'rework-register'].includes(moduleId);
        case 'dashboard_viewer':
          return ['qc-dashboard', 'qc-registers', 'qc-reports', 'dashboard', 'reports'].includes(moduleId);
        default:
          return moduleId === 'dashboard' || moduleId === 'qc-dashboard';
      }
    },
    [currentUser]
  );

  const requiresApproval = useCallback((): boolean => {
    // Admin and Developer never require approval
    if (currentUser?.role === 'admin' || currentUser?.role === 'developer') return false;

    // Check specific user flag if configured
    if (currentUser?.permissions?.requires_admin_approval !== undefined) {
      return !!currentUser.permissions.requires_admin_approval;
    }

    // Default: Fitters and Supervisors require approval for floor updates
    return currentUser?.role === 'fitter' || currentUser?.role === 'supervisor';
  }, [currentUser]);

  return {
    currentUser,
    isLoading,
    authError,
    welcomeBanner,
    dismissWelcomeBanner: () => setWelcomeBanner(null),
    welcomeModalData,
    dismissWelcomeModal,
    animationsEnabled,
    setAnimationsEnabled,
    portalMode,
    setPortalMode,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'developer',
    isDeveloper: currentUser?.role === 'developer',
    isSupervisor: currentUser?.role === 'supervisor',
    isFitter: currentUser?.role === 'fitter',
    isQCInspector: currentUser?.role === 'qc_inspector',
    isDashboardViewer: currentUser?.role === 'dashboard_viewer',
    canView,
    requiresApproval,
    loginWithPin,
    loginWithCredentials,
    logout,
  };
}
