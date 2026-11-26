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
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex justify-between items-center transition hover:shadow-md">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total QC Inspected
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalQC}</h4>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{passRate}% Pass Yield</span>
          </span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
          <Microscope className="w-5 h-5" />
        </div>
      </div>

      {/* Total Defects */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex justify-between items-center transition hover:shadow-md">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Defects
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{totalDefects}</h4>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{defectRate}% Defect Rate</span>
          </span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Verified Rectified */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex justify-between items-center transition hover:shadow-md">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Verified Rectified
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{verifiedOK}</h4>
          <span className="text-[11px] text-slate-500 mt-1 block">Reworks cleared &amp; approved</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
          <CheckCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Reworks */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex justify-between items-center transition hover:shadow-md">
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Pending Reworks
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{pendingDefects}</h4>
          <span className="text-[11px] text-amber-600 mt-1 block">Active on shop floor</span>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-xs">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
