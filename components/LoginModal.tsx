'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  X,
  Lock,
  ShieldCheck,
  KeyRound,
  User,
  Delete,
  Factory,
  CheckCircle2,
  Cpu,
  Sparkles,
  Layers,
  Search,
  Microscope,
  Wrench
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredRole?: string;
  message?: string;
  closable?: boolean;
}

export function LoginModal({ isOpen, onClose, onSuccess, requiredRole, message, closable = true }: LoginModalProps) {
  const { loginWithPin, loginWithCredentials, isLoading, authError } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<'production' | 'qc' | 'developer'>('production');
  const [authMode, setAuthMode] = useState<'pin' | 'credentials'>('pin');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = async (pinValue?: string) => {
    const val = (pinValue || pin).trim();
    if (!val) {
      setErrorMsg('Please enter your PIN code');
      return;
    }
    setErrorMsg(null);
    const targetMode = selectedWorkspace === 'qc' ? 'qc' : 'production';
    const user = await loginWithPin(val, targetMode);
    if (user) {
      setPin('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid PIN code or inactive account.');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          handlePinSubmit(newPin);
        }, 150);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPin('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password/PIN');
      return;
    }
    setErrorMsg(null);
    const targetMode = selectedWorkspace === 'qc' ? 'qc' : 'production';
    const user = await loginWithCredentials(username.trim(), password.trim(), targetMode);
    if (user) {
      setUsername('');
      setPassword('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid username or password.');
    }
  };

  const handleQuickDemoLogin = async (presetPin: string, mode: 'production' | 'qc' | 'developer') => {
    setErrorMsg(null);
    setSelectedWorkspace(mode);
    const targetMode = mode === 'qc' ? 'qc' : 'production';
    const user = await loginWithPin(presetPin, targetMode);
    if (user) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Synchro Gateway Sign-In</h3>
              <p className="text-[11px] text-slate-500">Select your workspace mode and enter PIN</p>
            </div>
          </div>
          {closable && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Workspace Selection: "Let's Build" vs "Let's Check" */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Choose Your Workstation Context:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Production Mode */}
            <button
              type="button"
              onClick={() => setSelectedWorkspace('production')}
              className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between space-y-2 ${
                selectedWorkspace === 'production'
                  ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-1.5 rounded-xl ${selectedWorkspace === 'production' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Factory className="w-4 h-4" />
                </span>
                {selectedWorkspace === 'production' && (
                  <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 leading-tight">🏭 Let's Build</div>
                <div className="text-[10px] text-slate-500 font-medium">Production Floor & Lines</div>
              </div>
            </button>

            {/* 2. QC Inspection Mode */}
            <button
              type="button"
              onClick={() => setSelectedWorkspace('qc')}
              className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between space-y-2 ${
                selectedWorkspace === 'qc'
                  ? 'bg-cyan-50 border-cyan-600 shadow-md ring-2 ring-cyan-500/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-1.5 rounded-xl ${selectedWorkspace === 'qc' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Microscope className="w-4 h-4" />
                </span>
                {selectedWorkspace === 'qc' && (
                  <span className="text-[9px] font-bold bg-cyan-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 leading-tight">🔬 Let's Check</div>
                <div className="text-[10px] text-slate-500 font-medium">Quality Control Gate</div>
              </div>
            </button>
          </div>

          {/* Developer / Enterprise Admin Option */}
          <button
            type="button"
            onClick={() => setSelectedWorkspace('developer')}
            className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
              selectedWorkspace === 'developer'
                ? 'bg-purple-100 border-purple-500 text-purple-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>🛠️ Enterprise Developer / Admin Access</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">PIN 9999 / 2619</span>
          </button>
        </div>

        {message && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {(errorMsg || authError) && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl animate-shake">
            {errorMsg || authError}
          </div>
        )}

        {/* Tab Toggle: PIN vs Credentials */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setAuthMode('pin')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
              authMode === 'pin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Touch Quick PIN
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('credentials')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
              authMode === 'credentials'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            User & Password
          </button>
        </div>

        {/* Mode 1: Mobile Touch PIN */}
        {authMode === 'pin' && (
          <div className="space-y-4">
            <div className="flex justify-center space-x-2.5 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                    pin.length > idx
                      ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm scale-105'
                      : 'border-slate-300 bg-slate-50 text-slate-300'
                  }`}
                >
                  {pin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-blue-100 border border-slate-200 rounded-2xl text-lg font-bold text-slate-800 shadow-sm transition active:scale-95 flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 shadow-sm transition flex items-center justify-center"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-blue-100 border border-slate-200 rounded-2xl text-lg font-bold text-slate-800 shadow-sm transition active:scale-95 flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 rounded-2xl text-slate-600 shadow-sm transition flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              disabled={isLoading || pin.length < 3}
              onClick={() => handlePinSubmit()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
            >
              {isLoading ? 'Verifying PIN...' : `Sign In to ${selectedWorkspace === 'qc' ? "Let's Check (QC)" : "Let's Build"}`}
            </button>
          </div>
        )}

        {/* Mode 2: Username & Password / PIN */}
        {authMode === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username / Identifier</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, developer, inspector"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password or Quick PIN</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password or numeric PIN"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
            >
              {isLoading ? 'Authenticating...' : `Sign In to ${selectedWorkspace === 'qc' ? "Let's Check (QC)" : "Let's Build"}`}
            </button>
          </form>
        )}

        {/* 1-Click Fast Accounts Chips for Easy Testing */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Fast Role Accounts</span>
            <span className="text-[9px] text-blue-600 font-normal">Click to Sign In</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('9999', 'developer')}
              className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 text-left transition flex items-center justify-between"
            >
              <span className="font-semibold">Developer Master</span>
              <span className="text-[9px] font-mono bg-purple-200 px-1 rounded">9999</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('2619', 'production')}
              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 text-left transition flex items-center justify-between"
            >
              <span className="font-semibold">Admin Manager</span>
              <span className="text-[9px] font-mono bg-blue-200 px-1 rounded">2619</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('2026', 'qc')}
              className="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl border border-cyan-200 text-left transition flex items-center justify-between"
            >
              <span className="font-semibold">QC Inspector (Dipen)</span>
              <span className="text-[9px] font-mono bg-cyan-200 px-1 rounded">2026</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('5678', 'qc')}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-left transition flex items-center justify-between"
            >
              <span className="font-semibold">QC Viewer</span>
              <span className="text-[9px] font-mono bg-emerald-200 px-1 rounded">5678</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('3122', 'production')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left transition flex items-center justify-between"
            >
              <span>Fitter (Nirav)</span>
              <span className="text-[9px] font-mono bg-slate-200 px-1 rounded">3122</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('6530', 'production')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left transition flex items-center justify-between"
            >
              <span>Supervisor (Khimji)</span>
              <span className="text-[9px] font-mono bg-slate-200 px-1 rounded">6530</span>
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
          Copyright © Industrial Dr. Prepared this app for Synchro Electricals Pvt. Ltd.
        </div>
      </div>
    </div>
  );
}
