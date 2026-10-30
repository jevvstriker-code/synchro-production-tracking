'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { JobCard, StageLog, ReworkLog, PRODUCTION_STAGES } from '@/types';
import { jobCardService } from '@/services/jobCardService';
import { reworkService } from '@/services/reworkService';
import { X, Printer, Download, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PrintablePanelReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCard | null;
}

export function PrintablePanelReportModal({
  isOpen,
  onClose,
  jobCard,
}: PrintablePanelReportModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [stages, setStages] = useState<StageLog[]>([]);
  const [reworkLogs, setReworkLogs] = useState<ReworkLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && jobCard) {
      loadDetails();
    }
  }, [isOpen, jobCard]);

  const loadDetails = async () => {
    if (!jobCard) return;
    setIsLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/track/${jobCard.job_card_no}`;

      const qr = await QRCode.toDataURL(url, {
        width: 140,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrDataUrl(qr);

      const [resStages, resRework] = await Promise.all([
        jobCardService.getJobCardWithStages(jobCard.job_card_no),
        reworkService.getAllReworkLogs(),
      ]);

      if (resStages) {
        setStages(resStages.stages);
      }
      setReworkLogs(resRework.filter((r) => r.job_card_no === jobCard.job_card_no));
    } catch (err) {
      console.error('Error loading report details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !jobCard) return null;

  const totalActualHours = stages.reduce((acc, s) => acc + Number(s.duration_hours || 0), 0);
  const totalTargetHours = PRODUCTION_STAGES.reduce((acc, s) => acc + s.standardDurationHrs, 0);
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const delayCount = stages.filter((s) => s.delay_reason && s.delay_reason !== 'None').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Container - hide outer wrapper during print */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col border border-slate-200">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl print:hidden">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Panel Production Dossier & Route Sheet
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Serial No: <strong className="text-blue-600">{jobCard.job_card_no}</strong> | {jobCard.assemblyLine || jobCard.assembly_line}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Dossier (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans text-slate-800 text-xs leading-relaxed space-y-6 printable-document">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-xl tracking-wider">
                SE
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  Synchro Electricals Pvt. Ltd.
                </h1>
                <p className="text-[11px] text-slate-600">
                  Industrial Panel Manufacturing, Automation & Switchgear Division
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  ISO 9001:2015 Certified | CPRI Tested & Approved Panels
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-right">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-20 h-20 border border-slate-300 rounded p-1 bg-white"
                />
              )}
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                  {jobCard.job_card_no}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Printed: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
                </p>
                <p className="text-[11px] font-bold mt-0.5 uppercase tracking-wide text-blue-700">
                  {jobCard.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Specifications & Metadata Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 avoid-break">
            <h2 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Section 1: Panel Identification & Production Order Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Product Description</span>
                <strong className="text-slate-900 font-bold">{jobCard.product_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assembly Line</span>
                <strong className="text-blue-700 font-bold">{jobCard.assemblyLine || jobCard.assembly_line}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Panel Type / Lot</span>
                <strong className="text-slate-900">{jobCard.panel_type} (Lot: {jobCard.lot_qty})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Customer Reference</span>
                <strong className="text-slate-900">{jobCard.customer_code || 'Internal / Stock'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">PPC Engineer</span>
                <strong className="text-slate-800">{jobCard.ppc_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Line Supervisor</span>
                <strong className="text-slate-800">{jobCard.supervisor_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Fitter</span>
                <strong className="text-slate-800">{jobCard.assigned_fitter_name || 'Floor Team'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Start & Target Date</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {jobCard.production_start_date} ➔ {jobCard.production_end_date || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 11-Stage Route Sheet */}
          <div className="space-y-2 avoid-break">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
                Section 2: Industrial Process Route Sheet & Floor Sign-Offs (11 Stages)
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">
                Completed: {completedCount}/11 | Actual: {totalActualHours.toFixed(1)}h (Std: {totalTargetHours}h)
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-2.5 w-8">#</th>
                    <th className="py-2 px-2.5">Manufacturing Process</th>
                    <th className="py-2 px-2 w-20">Status</th>
                    <th className="py-2 px-2 text-center w-16">Std (h)</th>
                    <th className="py-2 px-2 text-center w-16">Actual (h)</th>
                    <th className="py-2 px-2.5 w-28">Start Time</th>
                    <th className="py-2 px-2.5 w-28">Completion Time</th>
                    <th className="py-2 px-2.5">Operator</th>
                    <th className="py-2 px-2.5">Remarks / Delay Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {PRODUCTION_STAGES.map((def, idx) => {
                    const st = stages.find((s) => s.stage_index === idx);
                    const isDone = st?.status === 'completed';
                    const isCurrent = st?.status === 'in_progress';

                    return (
                      <tr
                        key={idx}
                        className={
                          isCurrent
                            ? 'bg-blue-50/50 font-semibold text-slate-900'
                            : isDone
                            ? 'bg-white'
                            : 'bg-slate-50/40 text-slate-400'
                        }
                      >
                        <td className="py-1.5 px-2.5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-900">
                          {def.name}
                          {st?.is_admin_override && (
                            <span className="ml-1 text-[9px] text-purple-700 font-bold bg-purple-100 px-1 rounded">
                              [Admin Edited]
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-mono uppercase text-[10px]">
                          {isDone ? (
                            <span className="text-emerald-700 font-bold">Done</span>
                          ) : isCurrent ? (
                            <span className="text-blue-700 font-bold">Active</span>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-slate-500">
                          {def.standardDurationHrs}h
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold">
                          {st?.duration_hours ? `${Number(st.duration_hours).toFixed(1)}h` : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                          {st?.started_at ? st.started_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600">
                          {st?.completed_at ? st.completed_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">
                          {st?.operator_name || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-[10px]">
                          {st?.delay_reason && st.delay_reason !== 'None' ? (
                            <span className="text-amber-700 font-bold">
                              {st.delay_reason} {st.delay_notes ? `(${st.delay_notes})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Rework & Corrective Actions (if any) */}
          {reworkLogs.length > 0 && (
            <div className="space-y-2 avoid-break">
              <h2 className="font-bold text-[11px] text-amber-800 uppercase tracking-wider">
                Section 3: Quality Rejection & Rework Log
              </h2>
              <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50/40">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-amber-100/60 text-amber-900 font-bold border-b border-amber-200">
                      <th className="py-1.5 px-2.5">Process Stage</th>
                      <th className="py-1.5 px-2.5">Defect / Rejection Reason</th>
                      <th className="py-1.5 px-2.5">Supervisor</th>
                      <th className="py-1.5 px-2.5">Corrective Action Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200 text-slate-700">
                    {reworkLogs.map((rw) => (
                      <tr key={rw.id}>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">{rw.process_name}</td>
                        <td className="py-1.5 px-2.5 text-red-700 font-bold">{rw.reason}</td>
                        <td className="py-1.5 px-2.5">{rw.supervisor_name}</td>
                        <td className="py-1.5 px-2.5 text-slate-800">{rw.corrective_action || 'Completed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Official Sign-Off Authority Boxes */}
          <div className="pt-4 border-t-2 border-slate-300 avoid-break">
            <h2 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-3">
              Official Quality & Production Approval Authorities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-24 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-500">Assembly Fitter</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto my-1"></div>
                <span className="text-[10px] text-slate-700 font-medium">
                  {jobCard.assigned_fitter_name || 'Floor Operator'}
                </span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-24 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-500">Line Supervisor</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto my-1"></div>
                <span className="text-[10px] text-slate-700 font-medium">{jobCard.supervisor_name}</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-24 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-500">QA / QC Inspector</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto my-1"></div>
                <span className="text-[10px] text-slate-700 font-medium">Quality Certified</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-24 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-500">Works / Plant Head</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto my-1"></div>
                <span className="text-[10px] text-slate-700 font-medium">Final Dispatch Clearance</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-3">
              This document is an electronically managed and audit-tracked production record of Synchro Electricals Pvt. Ltd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
