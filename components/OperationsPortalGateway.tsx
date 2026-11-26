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
  X,
  Radio,
  Terminal,
  Activity
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
      setLocalError('Please enter your Operator ID, username, or PIN.');
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
      setLocalError('Please enter your security access key / password.');
      return;
    }

    const user = await loginWithCredentials(idVal, passVal, selectedApp);
    if (user) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setLocalError('Invalid credentials. Access rejected by security gateway.');
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
    <div className="min-h-screen w-full cyber-grid-bg text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Ambient Cybernetic Radial Energy Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />
      </div>

      {/* Close button if rendered as a modal overlay for authenticated users */}
      {closable && onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white shadow-lg border border-cyan-500/30 transition z-20"
          title="Close Gateway"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Main Container - Scaled for Laptop (Landscape), Tablet & Phone (Portrait) */}
      <div className="relative w-full max-w-md sm:max-w-lg mx-auto flex flex-col items-center space-y-5 sm:space-y-6 z-10 my-auto py-4">
        {/* Top Brand Header */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white/95 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] border border-cyan-400/50 p-1 flex items-center justify-center shrink-0">
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
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-widest uppercase font-mono">
                SYNCHRO ELECTRICALS
              </h2>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-cyan-400 tracking-widest uppercase flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>CORE OPERATIONS // PVT. LTD.</span>
            </p>
          </div>
        </div>

        {/* Title and Accent */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 uppercase font-mono">
            OPERATIONS PORTAL
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full mx-auto shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <p className="text-xs sm:text-sm text-slate-400 font-mono pt-1">
            Production &amp; Quality Intelligence Gateway
          </p>
        </div>

        {/* Central Futuristic Holographic Card */}
        <div className="w-full bg-[#0a1020]/90 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.12)] p-6 sm:p-8 space-y-5 transition-all relative">
          {/* Corner HUD markers */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

          {/* Error Message */}
          {(localError || authError) && (
            <div className="bg-red-950/80 border border-red-500/50 text-red-200 text-xs p-3 rounded-2xl animate-shake font-mono flex items-center space-x-2">
              <span className="text-red-400 font-bold">[ERR]:</span>
              <span>{localError || authError}</span>
            </div>
          )}

          {authMode === 'standard' ? (
            /* Standard Username & Password Login */
            <form onSubmit={handleSignIn} className="space-y-4 text-xs sm:text-sm">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 block">
                  Operator Identifier // Email / PIN
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-cyan-400/70">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username or 4-digit PIN"
                    className="w-full pl-10 sm:pl-11 pr-4 py-3 bg-[#050812] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              {/* Password Input (Strictly Masked) */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 block">
                  Security Access Key // Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-cyan-400/70">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 sm:pl-11 pr-11 py-3 bg-[#050812] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner text-xs sm:text-sm font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-cyan-300 p-1 transition"
                    title={showPassword ? 'Hide security key' : 'Show security key'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help Tip */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5 font-mono">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-slate-300">Remember session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotTip(!showForgotTip)}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono"
                >
                  Forgot key?
                </button>
              </div>

              {showForgotTip && (
                <div className="p-2.5 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-[11px] text-cyan-200 leading-relaxed font-mono">
                  [GATEWAY NOTE]: Contact PPC or System Admin to reset PIN/password or use standard quick PIN code.
                </div>
              )}

              {/* Primary Cyber Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-3.5 px-6 rounded-2xl text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] active:scale-[0.99] border border-cyan-300/40"
              >
                <span>{isLoading ? 'AUTHENTICATING...' : 'INITIALIZE SYSTEM ACCESS'}</span>
                <ArrowRight className="w-4 h-4 text-cyan-100" />
              </button>

              {/* Switch to Mobile PIN Keypad */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('keypad')}
                  className="text-xs text-slate-400 hover:text-cyan-400 font-mono transition"
                >
                  [ SWITCH TO TOUCH PIN KEYPAD ]
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Quick Mobile Touch Keypad */
            <div className="space-y-4">
              <div className="text-center font-mono">
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  ENTER 4-DIGIT QUICK ACCESS PIN
                </span>
                <div className="flex justify-center space-x-2.5 my-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                        pin.length > idx
                          ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                          : 'border-slate-700 bg-slate-900/60 text-slate-600'
                      }`}
                    >
                      {pin.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[270px] mx-auto font-mono">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-12 bg-[#050812] hover:bg-slate-800 active:bg-cyan-900/40 border border-slate-700 hover:border-cyan-500/50 rounded-2xl text-lg font-bold text-slate-200 shadow-md transition active:scale-95 flex items-center justify-center"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold text-slate-400 transition flex items-center justify-center"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 bg-[#050812] hover:bg-slate-800 active:bg-cyan-900/40 border border-slate-700 hover:border-cyan-500/50 rounded-2xl text-lg font-bold text-slate-200 shadow-md transition active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="h-12 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 transition flex items-center justify-center"
                >
                  <Delete className="w-5 h-5 text-cyan-400" />
                </button>
              </div>

              <div className="text-center pt-1 font-mono">
                <button
                  type="button"
                  onClick={() => setAuthMode('standard')}
                  className="text-xs text-slate-400 hover:text-cyan-400 transition"
                >
                  ← RETURN TO OPERATOR LOGIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: SELECT WORKSPACE ROUTE */}
        <div className="w-full space-y-3 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-cyan-500/20 w-full" />
            <span className="px-3 text-[10px] sm:text-[11px] font-mono font-bold text-cyan-400/80 uppercase tracking-widest whitespace-nowrap">
              TARGET WORKSPACE ROUTING
            </span>
            <div className="border-t border-cyan-500/20 w-full" />
          </div>

          {/* Two Responsive Application Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full font-mono">
            {/* 1. Production Floor Card */}
            <button
              type="button"
              onClick={() => setSelectedApp('production')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${
                selectedApp === 'production'
                  ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedApp === 'production'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : 'bg-slate-800 text-cyan-400'
                  }`}
                >
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white leading-tight">PRODUCTION</h3>
                  <p className="text-[10px] text-slate-400 font-sans">Floor Lines &amp; Grid Power</p>
                </div>
              </div>
              <div className={`p-1 rounded-full ${selectedApp === 'production' ? 'text-cyan-400' : 'text-slate-600'}`}>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 2. Quality Control Card */}
            <button
              type="button"
              onClick={() => setSelectedApp('qc')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${
                selectedApp === 'qc'
                  ? 'bg-slate-900/90 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedApp === 'qc'
                      ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.8)]'
                      : 'bg-slate-800 text-indigo-400'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white leading-tight">QUALITY GATE</h3>
                  <p className="text-[10px] text-slate-400 font-sans">Testing &amp; Dossiers</p>
                </div>
              </div>
              <div className={`p-1 rounded-full ${selectedApp === 'qc' ? 'text-indigo-400' : 'text-slate-600'}`}>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Quick Operator Clearance Access (Names & Roles only — Passwords NEVER shown) */}
          <div className="pt-2 font-mono">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              <span>AUTHORIZED CLEARANCE PROFILES</span>
              <span className="text-[9px] text-cyan-400">1-CLICK AUTH</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFastRoleSelect('3122', 'production')}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200 text-[11px] truncate">Nirav Kikani</div>
                <div className="text-[9px] text-cyan-400 truncate">FITTER // LINE 1</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('2026', 'qc')}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200 text-[11px] truncate">Dipen Malli</div>
                <div className="text-[9px] text-indigo-400 truncate">QC INSPECTOR</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('6530', 'production')}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200 text-[11px] truncate">Khimji Gadhiya</div>
                <div className="text-[9px] text-cyan-400 truncate">SUPERVISOR</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('3105', 'production')}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200 text-[11px] truncate">Chirag Hathaliya</div>
                <div className="text-[9px] text-cyan-400 truncate">PPC PLANNING</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('2619', 'production')}
                className="p-2 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-500/40 rounded-xl text-left transition"
              >
                <div className="font-bold text-blue-200 text-[11px] truncate">Admin Manager</div>
                <div className="text-[9px] text-blue-400 truncate">MANAGEMENT</div>
              </button>

              <button
                type="button"
                onClick={() => handleFastRoleSelect('9999', 'production')}
                className="p-2 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/40 rounded-xl text-left transition"
              >
                <div className="font-bold text-purple-200 text-[11px] truncate">Developer Master</div>
                <div className="text-[9px] text-purple-400 truncate">CORE ARCHITECTURE</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="text-center text-[10px] text-slate-500 font-mono pt-2 tracking-wider">
          SYSTEM PREPARED BY INDUSTRIAL DR. // SYNCHRO ELECTRICALS PVT. LTD.
        </div>
      </div>
    </div>
  );
}
