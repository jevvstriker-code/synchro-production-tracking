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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 select-none cursor-pointer animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center text-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Animated Badge Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-md border ${
              isQC
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : isDev
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            {isQC ? (
              <Microscope className="w-10 h-10 text-blue-600 animate-bounce" />
            ) : isDev ? (
              <Cpu className="w-10 h-10 text-indigo-600 animate-bounce" />
            ) : (
              <Factory className="w-10 h-10 text-blue-600 animate-bounce" />
            )}
          </div>
        </div>

        {/* Mode Tag */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold uppercase tracking-wider text-blue-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {isQC ? "Let's Check • QC Mode" : isDev ? 'Master Developer Mode' : "Let's Build • Production Mode"}
          </span>
        </div>

        {/* Welcome Greeting */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, <span className="text-blue-600">{user.full_name}</span>!
          </h2>
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              {user.role}
            </span>
            <span>•</span>
            <span>{user.department || 'Synchro Electricals'}</span>
          </div>
        </div>

        {/* Quote Card */}
        <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left shadow-xs">
          <div className="text-2xl font-serif text-slate-400 leading-none select-none">“</div>
          <p className="text-xs sm:text-sm text-slate-700 font-medium italic -mt-2 px-2 leading-relaxed">
            {quote}
          </p>
          <div className="text-right text-xs text-slate-500 font-semibold mt-2 px-2 flex items-center justify-end space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />
            <span>Synchro Floor Intelligence</span>
          </div>
        </div>

        {/* Progress Bar & Manual Enter Button */}
        <div className="space-y-3 pt-1">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 animate-[progress_2.8s_linear_forwards]" />
          </div>

          <button
            onClick={onFinish}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition flex items-center justify-center space-x-2"
          >
            <span>Enter {isQC ? 'QC Inspection' : 'Production Floor'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
