'use client';

import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface OpeningSplashAnimationProps {
  onFinish: () => void;
  autoDismissMs?: number;
}

export function OpeningSplashAnimation({ onFinish, autoDismissMs = 1800 }: OpeningSplashAnimationProps) {
  const [phase, setPhase] = useState<'intro' | 'revealed' | 'fadeout'>('intro');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase('revealed');
    }, 400);

    const timer2 = setTimeout(() => {
      setPhase('fadeout');
    }, autoDismissMs - 400);

    const timer3 = setTimeout(() => {
      onFinish();
    }, autoDismissMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [autoDismissMs, onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 transition-opacity duration-500 cursor-pointer select-none ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient radial gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 rounded-3xl blur-xl opacity-60 animate-tilt" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-blue-400/50 rounded-2xl flex items-center justify-center shadow-2xl">
            <Zap className="w-12 h-12 text-blue-400 fill-blue-400/80 animate-bounce" />
          </div>
        </div>

        {/* Brand Title with smooth reveal */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[11px] font-semibold text-blue-300 tracking-wider uppercase">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Enterprise Industrial Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Synchro Electricals <span className="text-blue-400">Pvt. Ltd.</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Unified Production Tracking, QR Serialization & Shop Floor Quality Control (QC)
          </p>
        </div>

        {/* Progress Bar & Badges */}
        <div className="w-48 space-y-3">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-400 to-amber-400 h-full rounded-full animate-[progress_1.8s_ease-in-out_forwards]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Production</span>
            </span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>QC Control</span>
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Click anywhere to skip
        </div>
      </div>
    </div>
  );
}
