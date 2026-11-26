'use client';

import React from 'react';
import { Microscope, AlertTriangle, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';

interface MetricsCardsProps {
  totalQC: number;
  totalDefects: number;
  passRate: number;
  defectRate: number;
  verifiedOK: number;
  pendingDefects: number;
}

export function MetricsCards({
  totalQC,
  totalDefects,
  passRate,
  defectRate,
  verifiedOK,
  pendingDefects,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total QC Inspected */}
      <div className="cyber-card p-4 sm:p-5 rounded-2xl border border-cyan-500/25 flex justify-between items-center transition hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div>
          <p className="text-[10px] sm:text-[11px] text-cyan-400 font-bold uppercase tracking-wider font-mono">
            TOTAL QC AUDITED
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">{totalQC}</h4>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{passRate}% Pass Yield</span>
          </span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <Microscope className="w-5 h-5" />
        </div>
      </div>

      {/* Total Defects */}
      <div className="cyber-card p-4 sm:p-5 rounded-2xl border border-rose-500/25 flex justify-between items-center transition hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
        <div>
          <p className="text-[10px] sm:text-[11px] text-rose-400 font-bold uppercase tracking-wider font-mono">
            TOTAL DEFECTS
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 font-mono">{totalDefects}</h4>
          <span className="text-[11px] text-rose-400 font-semibold mt-1 inline-flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{defectRate}% Defect Rate</span>
          </span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Verified Rectified */}
      <div className="cyber-card p-4 sm:p-5 rounded-2xl border border-emerald-500/25 flex justify-between items-center transition hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
        <div>
          <p className="text-[10px] sm:text-[11px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
            VERIFIED RECTIFIED
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">{verifiedOK}</h4>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Reworks cleared &amp; approved</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          <CheckCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Reworks */}
      <div className="cyber-card p-4 sm:p-5 rounded-2xl border border-amber-500/25 flex justify-between items-center transition hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
        <div>
          <p className="text-[10px] sm:text-[11px] text-amber-400 font-bold uppercase tracking-wider font-mono">
            PENDING REWORKS
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">{pendingDefects}</h4>
          <span className="text-[11px] text-amber-400 font-mono mt-1 block">Active on shop floor</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
