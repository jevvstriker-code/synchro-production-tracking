'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppUser } from '@/types';
import { userService } from '@/services/userService';

const AUTH_STORAGE_KEY = 'synchro_production_auth_user';

export function useAuthController() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
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

  const loginWithPin = useCallback(async (pin: string): Promise<AppUser | null> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await userService.authenticate(pin);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
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
  }, []);

  const loginWithCredentials = useCallback(
    async (username: string, passwordOrPin: string): Promise<AppUser | null> => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const user = await userService.authenticate(username, passwordOrPin);
        if (user) {
          setCurrentUser(user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
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
    []
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const canView = useCallback(
    (moduleId: string): boolean => {
      // 1. Admin always has full view access to everything
      if (currentUser?.role === 'admin') return true;

      // 2. Guest (unauthenticated) can only see public dashboard
      if (!currentUser) {
        return moduleId === 'dashboard';
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
          return ['dashboard', 'job-cards', 'qr-generator', 'assembly-lines', 'rework-register', 'reports'].includes(moduleId);
        case 'ppc':
          return ['dashboard', 'job-cards', 'qr-generator', 'assembly-lines'].includes(moduleId);
        case 'fitter':
          return ['assembly-lines'].includes(moduleId);
        default:
          return moduleId === 'dashboard';
      }
    },
    [currentUser]
  );

  const requiresApproval = useCallback((): boolean => {
    // Admin never requires approval
    if (currentUser?.role === 'admin') return false;

    // Check specific user flag if configured
    if (currentUser?.permissions?.requires_admin_approval !== undefined) {
      return !!currentUser.permissions.requires_admin_approval;
    }

    // By default, every non-admin action requires Admin approval
    return true;
  }, [currentUser]);

  return {
    currentUser,
    isLoading,
    authError,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isSupervisor: currentUser?.role === 'supervisor' || currentUser?.role === 'admin',
    isFitter: currentUser?.role === 'fitter' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin',
    canView,
    requiresApproval,
    loginWithPin,
    loginWithCredentials,
    logout,
  };
}
