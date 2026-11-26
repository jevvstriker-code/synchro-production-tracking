'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppUser } from '@/types';
import { userService } from '@/services/userService';

const AUTH_STORAGE_KEY = 'synchro_production_auth_user';
const PORTAL_MODE_KEY = 'synchro_portal_mode';

export function useAuthController() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [portalMode, setPortalModeState] = useState<'production' | 'qc'>('production');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedMode = localStorage.getItem(PORTAL_MODE_KEY) as 'production' | 'qc' | null;
      if (storedMode) {
        setPortalModeState(storedMode);
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);

        // Auto-route to QC if role is QC
        if (parsed.role === 'qc_inspector' || parsed.role === 'dashboard_viewer') {
          setPortalModeState('qc');
        }

        // Refresh fresh permissions and profile from Supabase in background
        if (parsed?.id) {
          userService.getUserById(parsed.id).then((fresh) => {
            if (fresh && fresh.is_active) {
              setCurrentUser(fresh);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fresh));
            } else if (fresh && !fresh.is_active) {
              setCurrentUser(null);
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }).catch((err) => {
            console.warn('Could not refresh user permissions in background', err);
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse auth user from storage', e);
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

  const loginWithPin = useCallback(async (pin: string, requestedMode?: 'production' | 'qc'): Promise<AppUser | null> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await userService.authenticate(pin);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        
        // Determine portal mode
        const mode = requestedMode || (user.role === 'qc_inspector' || user.role === 'dashboard_viewer' ? 'qc' : 'production');
        setPortalMode(mode);

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
  }, [setPortalMode]);

  const loginWithCredentials = useCallback(
    async (username: string, passwordOrPin: string, requestedMode?: 'production' | 'qc'): Promise<AppUser | null> => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const user = await userService.authenticate(username, passwordOrPin);
        if (user) {
          setCurrentUser(user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          
          const mode = requestedMode || (user.role === 'qc_inspector' || user.role === 'dashboard_viewer' ? 'qc' : 'production');
          setPortalMode(mode);

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
    [setPortalMode]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setWelcomeBanner(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
