'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Cpu, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

interface OpeningSplashAnimationProps {
  onFinish: () => void;
  autoDismissMs?: number;
}

export function OpeningSplashAnimation({ onFinish, autoDismissMs = 1800 }: OpeningSplashAnimationProps) {
  const [phase, setPhase] = useState<'intro' | 'revealed' | 'fadeout'>('intro');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase('revealed');
    }, 300);

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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-50 via-sky-50/40 to-blue-50 transition-opacity duration-500 cursor-pointer select-none ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient curved waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" />
        {/* Soft bottom wave decoration */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-blue-100/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Official Synchro Brand Logo with smooth glow */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500 animate-pulse" />
          <div className="relative w-28 h-28 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden">
            <Image
              src="/synchro-logo.png"
              alt="Synchro Electricals"
              width={100}
              height={100}
              className="object-contain w-full h-full rounded-xl transition transform hover:scale-105 duration-300"
              priority
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 tracking-wider uppercase">
            <Zap className="w-3 h-3 text-blue-600" />
            <span>Industrial Operations Platform</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            SYNCHRO ELECTRICALS <span className="text-blue-600 block text-sm font-semibold tracking-widest mt-0.5">PVT. LTD.</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Operations Portal • Production & Quality Management System
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-44 space-y-2">
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 h-full rounded-full animate-[progress_1.8s_ease-in-out_forwards]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>Production</span>
            </span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-cyan-600" />
              <span>Quality Control</span>
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Click anywhere to skip
        </div>
      </div>
    </div>
  );
}
