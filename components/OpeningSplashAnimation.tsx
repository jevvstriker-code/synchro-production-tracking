'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f0f6fd] select-none cursor-pointer overflow-hidden transition-all duration-300"
    >
      {/* Decorative Wave at the bottom matching reference image media_1795682345629_7d989f9c.png */}
      <div className="absolute -bottom-1 inset-x-0 pointer-events-none">
        <svg viewBox="0 0 1440 280" className="w-full h-auto text-[#dbeafe]/80 fill-current opacity-80" preserveAspectRatio="none">
          <path d="M0,160 C320,240 420,80 720,160 C1020,240 1120,100 1440,180 L1440,280 L0,280 Z" />
        </svg>
        <svg viewBox="0 0 1440 240" className="w-full h-auto text-[#bfdbfe]/50 fill-current -mt-24 opacity-60" preserveAspectRatio="none">
          <path d="M0,90 C360,180 500,40 820,110 C1140,180 1200,60 1440,120 L1440,240 L0,240 Z" />
        </svg>
      </div>

      {/* Centered Brand Emblem */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-5 px-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Synchro Logo with soft shadow */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-blue-400/20 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-xl border border-blue-100 p-2 flex items-center justify-center">
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

        {/* Brand Typography */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-wider uppercase font-sans">
            SYNCHRO ELECTRICALS PVT. LTD.
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Operations Portal • Production &amp; Quality Management System
          </p>
        </div>

        {/* Subtle loading bar */}
        <div className="w-36 bg-blue-100 rounded-full h-1 overflow-hidden">
          <div className="bg-blue-600 h-full rounded-full animate-[progress_1.5s_ease-in-out_forwards]" />
        </div>

        <div className="text-[10px] text-slate-400 font-sans pt-1">
          Click anywhere to skip
        </div>
      </div>
    </div>
  );
}
