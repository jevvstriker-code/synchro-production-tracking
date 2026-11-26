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
      setLocalError('Please enter your username, email, or PIN code.');
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/30 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Background Decorative Electrical & Engineering Doodle Watermarks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06] sm:opacity-[0.08]">
        {/* Top Left Doodles */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-16 text-blue-700">
          <Zap className="w-16 h-16 sm:w-24 sm:h-24 stroke-[1.2]" />
        </div>
        <div className="absolute top-28 left-48 sm:top-36 sm:left-64 text-blue-800">
          <Factory className="w-20 h-20 sm:w-28 sm:h-28 stroke-[1.2]" />
        </div>

        {/* Top Right Doodles */}
        <div className="absolute top-10 right-12 sm:top-16 sm:right-24 text-blue-700">
          <ShieldCheck className="w-16 h-16 sm:w-24 sm:h-24 stroke-[1.2]" />
        </div>
        <div className="absolute top-44 right-36 text-blue-800">
          <Cpu className="w-14 h-14 sm:w-20 sm:h-20 stroke-[1.2]" />
        </div>

        {/* Bottom Left Doodles */}
        <div className="absolute bottom-16 left-12 sm:bottom-20 sm:left-24 text-blue-700">
          <Wrench className="w-16 h-16 sm:w-24 sm:h-24 stroke-[1.2]" />
        </div>
        <div className="absolute bottom-36 left-44 text-blue-800">
          <Layers className="w-14 h-14 sm:w-20 sm:h-20 stroke-[1.2]" />
        </div>

        {/* Bottom Right Doodles */}
        <div className="absolute bottom-12 right-16 sm:bottom-16 sm:right-32 text-blue-700">
          <Zap className="w-20 h-20 sm:w-28 sm:h-28 stroke-[1.2]" />
        </div>
      </div>

      {/* Close button if rendered as a modal overlay for authenticated users */}
      {closable && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-sm border border-slate-200 transition z-20"
          title="Close Gateway"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Main Container - Scaled for Laptop (Landscape), Tablet & Phone (Portrait) */}
      <div className="relative w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center space-y-5 sm:space-y-6 z-10 my-auto py-4">
        {/* Top Brand Header */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl shadow-md border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
            <Image
              src="/synchro-logo.png"
              alt="Synchro Logo"
              width={44}
              height={44}
              className="object-contain w-full h-full rounded-lg"
              priority
            />
          </div>
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wider uppercase leading-none">
              SYNCHRO ELECTRICALS
            </h2>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">
              PVT. LTD.
            </p>
          </div>
        </div>

        {/* Title and Accent */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Operations <span className="text-blue-600">Portal</span>
          </h1>
          <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium pt-0.5">
            Production & Quality Management System
          </p>
        </div>

        {/* Central Card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-900/5 p-6 sm:p-8 space-y-5 transition-all">
          {/* Error Message */}
          {(localError || authError) && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl animate-shake">
              {localError || authError}
            </div>
          )}

          {authMode === 'standard' ? (
            /* Standard Username & Password Login */
            <form onSubmit={handleSignIn} className="space-y-4 text-xs sm:text-sm">
              {/* Username Input */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Username / Email"
                    className="w-full pl-10 sm:pl-11 pr-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-xs text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Input (Strictly Masked) */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 sm:pl-11 pr-11 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-xs text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotTip(!showForgotTip)}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              {showForgotTip && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 leading-relaxed animate-in fade-in">
                  Please contact the System Administrator or PPC Manager to reset credentials or use your 4-digit quick PIN.
                </div>
              )}

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 sm:py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 text-xs sm:text-sm"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Switch to Mobile PIN Keypad */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('keypad')}
                  className="text-xs text-slate-500 hover:text-blue-600 font-semibold"
                >
                  Switch to Touch PIN Keypad →
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Quick Mobile Touch Keypad */
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Enter 4-Digit Quick PIN
                </span>
                <div className="flex justify-center space-x-2.5 my-2.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-11 sm:w-11 sm:h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                        pin.length > idx
                          ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105 shadow-sm'
                          : 'border-slate-300 bg-slate-50 text-slate-300'
                      }`}
                    >
                      {pin.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-11 sm:h-12 bg-slate-50 hover:bg-slate-100 active:bg-blue-100 border border-slate-200 rounded-2xl text-base sm:text-lg font-bold text-slate-800 shadow-sm transition active:scale-95 flex items-center justify-center"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-11 sm:h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 sm:h-12 bg-slate-50 hover:bg-slate-100 active:bg-blue-100 border border-slate-200 rounded-2xl text-base sm:text-lg font-bold text-slate-800 shadow-sm transition active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="h-11 sm:h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-slate-600 transition flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('standard')}
                  className="text-xs text-slate-500 hover:text-blue-600 font-semibold"
                >
                  ← Switch to Username & Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: OR SELECT APPLICATION */}
        <div className="w-full space-y-3 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-300/80 w-full" />
            <span className="bg-transparent px-3 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              OR SELECT APPLICATION
            </span>
            <div className="border-t border-slate-300/80 w-full" />
          </div>

          {/* Two Responsive Application Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* 1. Production Floor Card */}
            <button
              type="button"
              onClick={() => setSelectedApp('production')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${
                selectedApp === 'production'
                  ? 'bg-white border-blue-600 shadow-lg shadow-blue-600/10 ring-2 ring-blue-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedApp === 'production' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Production</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Floor Lines & Tracking</p>
                </div>
              </div>
              <div className={`p-1 rounded-full ${selectedApp === 'production' ? 'text-blue-600' : 'text-slate-400'}`}>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 2. Quality Control Card */}
            <button
              type="button"
              onClick={() => setSelectedApp('qc')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${
                selectedApp === 'qc'
                  ? 'bg-white border-blue-600 shadow-lg shadow-blue-600/10 ring-2 ring-blue-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedApp === 'qc' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Quality Control</h3>
                  <p className="text-[10px] text-slate-500 font-medium">QC Testing & Registers</p>
                </div>
              </div>
              <div className={`p-1 rounded-full ${selectedApp === 'qc' ? 'text-blue-600' : 'text-slate-400'}`}>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Fast Staff Accounts (Names & Roles only — Passwords NEVER shown) */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <span>Quick Role Access</span>
              <span className="text-[9px] text-blue-600 font-normal">1-Click Sign-In</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFastRoleSelect('3122', 'production')}
                className="p-2 bg-white/80 hover:bg-white border border-slate-200 rounded-xl text-left transition shadow-2xs hover:border-blue-400"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Nirav Kikani</div>
                <div className="text-[9px] text-slate-500 truncate">Fitter • Line 1</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('2026', 'qc')}
                className="p-2 bg-white/80 hover:bg-white border border-slate-200 rounded-xl text-left transition shadow-2xs hover:border-blue-400"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Dipen Malli</div>
                <div className="text-[9px] text-slate-500 truncate">QC Inspector</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('6530', 'production')}
                className="p-2 bg-white/80 hover:bg-white border border-slate-200 rounded-xl text-left transition shadow-2xs hover:border-blue-400"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Khimji Gadhiya</div>
                <div className="text-[9px] text-slate-500 truncate">Supervisor</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('3105', 'production')}
                className="p-2 bg-white/80 hover:bg-white border border-slate-200 rounded-xl text-left transition shadow-2xs hover:border-blue-400"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Chirag Hathaliya</div>
                <div className="text-[9px] text-slate-500 truncate">PPC Planning</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('2619', 'production')}
                className="p-2 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition shadow-2xs"
              >
                <div className="font-bold text-blue-900 text-[11px] truncate">Admin Manager</div>
                <div className="text-[9px] text-blue-600 truncate">Management</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('9999', 'production')}
                className="p-2 bg-purple-50/80 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition shadow-2xs"
              >
                <div className="font-bold text-purple-900 text-[11px] truncate">Developer Master</div>
                <div className="text-[9px] text-purple-600 truncate">Systems Engineering</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="text-center text-[10px] text-slate-400 font-medium pt-2">
          Copyright © Industrial Dr. Prepared this app for Synchro Electricals Pvt. Ltd.
        </div>
      </div>
    </div>
  );
}
