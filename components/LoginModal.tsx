'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { X, Lock, ShieldCheck, KeyRound, User, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredRole?: string;
  message?: string;
}

export function LoginModal({ isOpen, onClose, onSuccess, requiredRole, message }: LoginModalProps) {
  const { loginWithPin, loginWithCredentials, isLoading, authError } = useAuth();
  const [authMode, setAuthMode] = useState<'pin' | 'credentials'>('pin');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter your 4-digit PIN');
      return;
    }
    setErrorMsg(null);
    const user = await loginWithPin(pin.trim());
    if (user) {
      setPin('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid PIN code or inactive account.');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password/PIN');
      return;
    }
    setErrorMsg(null);
    const user = await loginWithCredentials(username.trim(), password.trim());
    if (user) {
      setUsername('');
      setPassword('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid username or password.');
    }
  };

  const handleQuickDemoLogin = async (presetPin: string) => {
    setErrorMsg(null);
    const user = await loginWithPin(presetPin);
    if (user) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Staff Authentication</h3>
              <p className="text-[11px] text-slate-500">
                {requiredRole ? `Required: ${requiredRole.toUpperCase()}` : 'Fitter, Supervisor or Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {(errorMsg || authError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {errorMsg || authError}
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('pin')}
            className={`py-1.5 rounded-lg transition ${
              authMode === 'pin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fast PIN Login
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('credentials')}
            className={`py-1.5 rounded-lg transition ${
              authMode === 'credentials' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Username & Password
          </button>
        </div>

        {authMode === 'pin' ? (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 4-Digit Security PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-3 text-center text-2xl tracking-[0.4em] font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length < 3}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow transition flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying...' : 'Authorize Access'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username or Phone</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or amit"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password or PIN</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow transition mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Fast Preset Login Buttons for Instant Testing on Shop Floor */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider mb-2">
            Quick 1-Tap Login
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('1234')}
              className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 transition"
            >
              <div className="text-[11px] font-bold">Admin</div>
              <div className="text-[9px] text-slate-400 font-mono">PIN: 1234</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('1234')}
              className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 transition"
            >
              <div className="text-[11px] font-bold">Supervisor</div>
              <div className="text-[9px] text-slate-400 font-mono">Amit: 1234</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('1111')}
              className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 transition"
            >
              <div className="text-[11px] font-bold">Fitter</div>
              <div className="text-[9px] text-slate-400 font-mono">Ramesh: 1111</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
