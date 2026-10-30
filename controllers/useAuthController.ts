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
        setCurrentUser(JSON.parse(stored));
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

  return {
    currentUser,
    isLoading,
    authError,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isSupervisor: currentUser?.role === 'supervisor' || currentUser?.role === 'admin',
    isFitter: currentUser?.role === 'fitter' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin',
    loginWithPin,
    loginWithCredentials,
    logout,
  };
}
