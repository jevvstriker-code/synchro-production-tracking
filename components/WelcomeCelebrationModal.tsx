'use client';

import React, { useEffect } from 'react';
import { Zap, ShieldCheck, Factory, Microscope, Cpu, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppUser } from '@/types';

interface WelcomeCelebrationModalProps {
  user: AppUser;
  mode: 'production' | 'qc';
  quote: string;
  onFinish: () => void;
  autoDismissMs?: number;
}

export function WelcomeCelebrationModal({
  user,
  mode,
  quote,
  onFinish,
  autoDismissMs = 2800,
}: WelcomeCelebrationModalProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onFinish]);

  const isQC = mode === 'qc' || user.role === 'qc_inspector';
  const isDev = user.role === 'developer';

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none cursor-pointer animate-in fade-in duration-300"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${
            isQC
              ? 'bg-cyan-500'
              : isDev
              ? 'bg-indigo-600'
              : 'bg-amber-500'
          }`}
        />
        <div
          className={`absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${
            isQC
              ? 'bg-emerald-500'
              : isDev
              ? 'bg-blue-600'
              : 'bg-blue-600'
          }`}
        />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-6 animate-in zoom-in-95 duration-300"
      >
        {/* Animated Badge Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-3xl blur-xl opacity-75 animate-pulse ${
              isQC
                ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400'
                : isDev
                ? 'bg-gradient-to-tr from-indigo-500 to-blue-500'
                : 'bg-gradient-to-tr from-amber-500 to-blue-600'
            }`}
          />
          <div className="relative w-24 h-24 bg-slate-950/90 border-2 border-slate-600 rounded-3xl flex items-center justify-center shadow-inner">
            {isQC ? (
              <Microscope className="w-12 h-12 text-cyan-400 animate-bounce" />
            ) : isDev ? (
              <Cpu className="w-12 h-12 text-indigo-400 animate-bounce" />
            ) : (
              <Factory className="w-12 h-12 text-amber-400 animate-bounce" />
            )}
          </div>
        </div>

        {/* Mode Tag */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className={isQC ? 'text-cyan-300' : isDev ? 'text-indigo-300' : 'text-amber-300'}>
            {isQC ? "Let's Check • QC Mode" : isDev ? 'Master Developer Mode' : "Let's Build • Production Mode"}
          </span>
        </div>

        {/* Welcome Greeting */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">{user.full_name}</span>!
          </h2>
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {user.role}
            </span>
            <span>•</span>
            <span>{user.department || 'Synchro Electricals'}</span>
          </div>
        </div>

        {/* Witty Pun / Quote Card */}
        <div className="relative bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-left shadow-inner">
          <div className="text-2xl font-serif text-slate-500 leading-none select-none">“</div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium italic -mt-2 px-2 leading-relaxed">
            {quote}
          </p>
          <div className="text-right text-xs text-slate-400 font-semibold mt-2 px-2 flex items-center justify-end space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
            <span>Synchro Floor Intelligence</span>
          </div>
        </div>

        {/* Progress Bar & Manual Enter Button */}
        <div className="space-y-3 pt-2">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full animate-[progress_2.8s_linear_forwards] ${
                isQC
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-400 to-blue-500'
              }`}
            />
          </div>

          <button
            onClick={onFinish}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition flex items-center justify-center space-x-2 ${
              isQC
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500'
                : isDev
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
            }`}
          >
            <span>Enter {isQC ? 'QC Inspection Gate' : 'Production Floor'} Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
