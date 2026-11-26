'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Cpu, Zap, Activity } from 'lucide-react';

interface OpeningSplashAnimationProps {
  onFinish: () => void;
  autoDismissMs?: number;
}

export function OpeningSplashAnimation({ onFinish, autoDismissMs = 1500 }: OpeningSplashAnimationProps) {
  const [phase, setPhase] = useState<'intro' | 'revealed'>('intro');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase('revealed');
    }, 150);

    const timer2 = setTimeout(() => {
      onFinish();
    }, autoDismissMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [autoDismissMs, onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#040714] cyber-grid-bg select-none cursor-pointer overflow-hidden transition-all duration-500"
    >
      {/* Ambient Cyber Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Futuristic Scanline Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent pointer-events-none animate-pulse" />

      {/* Centered Holographic Brand Box */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 px-6 animate-in fade-in zoom-in-95 duration-500 max-w-md w-full">
        {/* Synchro Logo with Holographic Chamber and HUD corners */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-2xl opacity-40 animate-pulse" />
          
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-[#070d1e]/90 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.35)] border border-cyan-500/50 p-3 flex items-center justify-center backdrop-blur-xl">
            {/* Corner HUD markers */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

            <div className="w-full h-full bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-inner">
              <Image
                src="/synchro-logo.png"
                alt="Synchro Logo"
                width={120}
                height={120}
                className="object-contain w-full h-full rounded-xl transition transform duration-500 scale-100"
                priority
              />
            </div>
          </div>
        </div>

        {/* Cyber Brand Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>CORE OPERATIONS PLATFORM v2.5</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-sky-400 tracking-widest uppercase font-mono">
            SYNCHRO ELECTRICALS
          </h2>
          <p className="text-xs text-cyan-400/80 font-mono tracking-wider">
            Industrial Production &amp; Quality Gateway
          </p>
        </div>

        {/* High-Tech Animated Loading Bar */}
        <div className="w-48 bg-slate-900 border border-cyan-500/30 rounded-full h-1.5 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <div className="bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 h-full rounded-full animate-[progress_1.5s_ease-in-out_forwards]" />
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 tracking-wider">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>CLICK ANYWHERE TO SKIP</span>
        </div>
      </div>
    </div>
  );
}
