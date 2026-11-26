'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Factory,
  ShieldCheck,
  ArrowRight,
  Zap,
  Cpu,
  Delete,
  CheckCircle2,
  Wrench,
  Layers,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';

interface OperationsPortalGatewayProps {
  onSuccess?: () => void;
  closable?: boolean;
  onClose?: () => void;
}

export function OperationsPortalGateway({ onSuccess, closable = false, onClose }: OperationsPortalGatewayProps) {
  const { loginWithPin, loginWithCredentials, isLoading, authError } = useAuth();
  const [selectedApp, setSelectedApp] = useState<'production' | 'qc'>('production');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authMode, setAuthMode] = useState<'standard' | 'keypad'>('standard');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showForgotTip, setShowForgotTip] = useState(false);

  // Submit standard username + password or PIN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const idVal = identifier.trim();
    const passVal = password.trim();

    if (!idVal) {
      setLocalError('Please enter your username, email, or PIN.');
      return;
    }

    // If identifier is 4 digits numeric and no password was typed, authenticate via PIN directly!
    if (/^\d{4}$/.test(idVal) && !passVal) {
      const user = await loginWithPin(idVal, selectedApp);
      if (user) {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        setLocalError('Invalid quick PIN code or account inactive.');
      }
      return;
    }

    if (!passVal) {
      setLocalError('Please enter your password.');
      return;
    }

    const user = await loginWithCredentials(idVal, passVal, selectedApp);
    if (user) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setLocalError('Invalid credentials. Please verify your username and password.');
    }
  };

  // Touch Keypad submit for shop floor
  const handleKeypadPress = async (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(async () => {
          const user = await loginWithPin(nextPin, selectedApp);
          if (user) {
            setPin('');
            if (onSuccess) onSuccess();
            if (onClose) onClose();
          } else {
            setLocalError('Invalid PIN code.');
            setPin('');
          }
        }, 150);
      }
    }
  };

  // Fast demo role login without displaying passwords on screen
  const handleFastRoleSelect = async (rolePin: string, mode: 'production' | 'qc') => {
    setLocalError(null);
    setSelectedApp(mode);
    const user = await loginWithPin(rolePin, mode);
    if (user) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Subtle Professional Ambient Decorative Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl" />
      </div>

      {/* Close button if rendered as a modal overlay for authenticated users */}
      {closable && onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 shadow-md border border-slate-200 transition z-20"
          title="Close Gateway"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Main Container - Scaled for Laptop (Landscape), Tablet & Phone (Portrait) */}
      <div className="relative w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center space-y-5 sm:space-y-6 z-10 my-auto py-4">
        {/* Top Brand Header matching reference image media_1795682361034_524a80ae.png */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl shadow-md border border-blue-100 p-1 flex items-center justify-center shrink-0">
            <Image
              src="/synchro-logo.png"
              alt="Synchro Logo"
              width={48}
              height={48}
              className="object-contain w-full h-full rounded-xl"
              priority
            />
          </div>
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wider uppercase font-sans">
              SYNCHRO ELECTRICALS
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wide">
              PVT. LTD.
            </p>
          </div>
        </div>

        {/* Title and Accent */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight font-sans">
            Operations Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Production &amp; Quality Management System
          </p>
        </div>

        {/* Central Clean White Card */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5 transition-all">
          {/* Error Message */}
          {(localError || authError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-2xl animate-shake font-medium flex items-center space-x-2">
              <span className="font-bold">Error:</span>
              <span>{localError || authError}</span>
            </div>
          )}

          {authMode === 'standard' ? (
            /* Standard Username & Password Login */
            <form onSubmit={handleSignIn} className="space-y-4 text-xs sm:text-sm">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Username / Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full pl-10 sm:pl-11 pr-4 py-3 bg-slate-50/60 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none transition shadow-sm text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Input (Strictly Masked) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 sm:pl-11 pr-11 py-3 bg-slate-50/60 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none transition shadow-sm text-xs sm:text-sm tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help Tip */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotTip(!showForgotTip)}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {showForgotTip && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed font-normal">
                  Contact PPC or System Admin to reset your credentials or use your 4-digit quick PIN.
                </div>
              )}

              {/* Primary Sign In Button matching reference image media_1795682361034_524a80ae.png */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              {/* Switch to Mobile PIN Keypad */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('keypad')}
                  className="text-xs text-slate-500 hover:text-blue-600 transition font-medium"
                >
                  Switch to Touch PIN Keypad
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Quick Mobile Touch Keypad */
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Enter 4-Digit Quick PIN
                </span>
                <div className="flex justify-center space-x-2.5 my-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                        pin.length > idx
                          ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {pin.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[270px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-12 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 border border-slate-200 rounded-2xl text-lg font-bold text-slate-700 shadow-sm transition active:scale-95 flex items-center justify-center"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition flex items-center justify-center"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 border border-slate-200 rounded-2xl text-lg font-bold text-slate-700 shadow-sm transition active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-slate-600 transition flex items-center justify-center"
                >
                  <Delete className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('standard')}
                  className="text-xs text-slate-500 hover:text-blue-600 transition font-medium"
                >
                  ← Return to Standard Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: OR SELECT APPLICATION matching reference image media_1795682361034_524a80ae.png */}
        <div className="w-full space-y-3 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap bg-[#f8fafc]">
              — OR SELECT APPLICATION —
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Two Responsive Application Buttons matching reference image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Production App Card */}
            <button
              type="button"
              onClick={() => setSelectedApp('production')}
              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                selectedApp === 'production'
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-sm ring-2 ring-blue-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl transition ${
                    selectedApp === 'production'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}
                >
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Production</h3>
                  <p className="text-[11px] text-slate-500">Floor Lines &amp; Tracking</p>
                </div>
              </div>
              <ArrowRight
                className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                  selectedApp === 'production' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Quality Control App Card */}
            <button
              type="button"
              onClick={() => setSelectedApp('qc')}
              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                selectedApp === 'qc'
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-sm ring-2 ring-blue-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl transition ${
                    selectedApp === 'qc'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Quality Control</h3>
                  <p className="text-[11px] text-slate-500">QC Testing &amp; Registers</p>
                </div>
              </div>
              <ArrowRight
                className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                  selectedApp === 'qc' ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Demo Access Pills */}
        <div className="w-full pt-1 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>QUICK ROLE ACCESS</span>
            <span>1-CLICK SIGN-IN</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { name: 'Nirav Kikani', role: 'Fitter • Line 1', pin: '3122', mode: 'production' as const },
              { name: 'Dipen Malli', role: 'QC Inspector', pin: '4401', mode: 'qc' as const },
              { name: 'Khimji Gadhiya', role: 'Supervisor', pin: '6530', mode: 'production' as const },
              { name: 'Chirag Hathaliya', role: 'PPC Planning', pin: '3105', mode: 'production' as const },
              { name: 'Admin Manager', role: 'Root Admin', pin: '2619', mode: 'production' as const },
              { name: 'Developer Master', role: 'Full Root Access', pin: '9999', mode: 'production' as const },
            ].map((account) => (
              <button
                key={account.name}
                type="button"
                onClick={() => handleFastRoleSelect(account.pin, account.mode)}
                className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition shadow-xs group"
              >
                <div className="font-bold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                  {account.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{account.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
          Copyright © Industrial Dr. Prepared this app for Synchro Electricals Pvt. Ltd.
        </div>
      </div>
    </div>
  );
}
