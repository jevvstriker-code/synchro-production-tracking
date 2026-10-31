'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

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
        width: 160,
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('printable-panel-dossier');
    if (!el || !jobCard) return;
    setIsDownloadingPdf(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2, // High resolution crisp export
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 5; // 5mm margin
      const printWidth = pageWidth - margin * 2; // 200mm
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        printWidth,
        Math.min(printHeight, pageHeight - margin * 2)
      );

      const fileName = `Synchro_Dossier_${jobCard.job_card_no}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Direct PDF export error:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print-modal-overlay print:p-0 print:m-0 print:overflow-visible">
      {/* Container - cleanly unwrapped when printing */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col border border-slate-200 print-modal-container print:shadow-none print:border-none print:max-h-none print:rounded-none">
        {/* Top Control Bar (Hidden when printing or exporting) */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-2xl print:hidden">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
              <span>Panel Production Dossier & Route Sheet</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
                1-Page A4 Portrait
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Serial No: <strong className="text-blue-600">{jobCard.job_card_no}</strong> | {jobCard.assemblyLine || jobCard.assembly_line}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* 1-Click Direct Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-3 sm:px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              title="Download high-resolution 1-page portrait PDF immediately"
            >
              {isDownloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Standard 1-Page Browser Print / Save to PDF */}
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 sm:px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              title="Open browser print dialog formatted strictly for 1-page portrait"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (1 Page)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body: Strictly formatted to fit 1-page A4 Portrait */}
        <div
          id="printable-panel-dossier"
          className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans text-slate-800 text-[11px] leading-tight space-y-2.5 printable-document print-single-page print:p-0 print:space-y-2 print:overflow-visible bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-2.5 flex items-center justify-between gap-3 avoid-break">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg tracking-wider shadow-xs">
                SE
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase leading-none">
                  Synchro Electricals Pvt. Ltd.
                </h1>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                  Industrial Panel Manufacturing, Automation & Switchgear Division
                </p>
                <p className="text-[9px] text-slate-500 font-medium">
                  ISO 9001:2015 Certified | CPRI Tested & Approved Panels | QR Live Audit Sheet
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-right">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-16 h-16 border border-slate-300 rounded p-0.5 bg-white shadow-xs"
                />
              )}
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow-xs">
                  {jobCard.job_card_no}
                </span>
                <p className="text-[9px] text-slate-500 mt-1">
                  Printed: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wide text-blue-700">
                  Status: {jobCard.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Specifications & Metadata Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 avoid-break">
            <h2 className="font-bold text-[10px] text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Section 1: Panel Identification & Production Order Details</span>
              <span className="text-[9px] text-slate-500 lowercase font-normal font-mono">
                sync-id: {jobCard.id ? jobCard.id.substring(0, 8) : 'active'}
              </span>
            </h2>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Product Description</span>
                <strong className="text-slate-900 font-bold block truncate">{jobCard.product_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Assembly Line</span>
                <strong className="text-blue-700 font-bold block truncate">{jobCard.assemblyLine || jobCard.assembly_line}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Panel Type / Lot</span>
                <strong className="text-slate-900 block truncate">{jobCard.panel_type} (Lot: {jobCard.lot_qty})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Customer Reference</span>
                <strong className="text-slate-900 block truncate">{jobCard.customer_code || 'Internal / Stock'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">PPC Engineer</span>
                <strong className="text-slate-800 block truncate">{jobCard.ppc_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Line Supervisor</span>
                <strong className="text-slate-800 block truncate">{jobCard.supervisor_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Assigned Fitter</span>
                <strong className="text-slate-800 block truncate">{jobCard.assigned_fitter_name || 'Floor Team'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Start & Target Date</span>
                <span className="font-mono text-[9px] text-slate-700 block truncate">
                  {jobCard.production_start_date} ➔ {jobCard.production_end_date || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 11-Stage Route Sheet */}
          <div className="space-y-1.5 avoid-break">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[10px] text-slate-900 uppercase tracking-wider">
                Section 2: Industrial Process Route Sheet & Floor Sign-Offs (11 Stages)
              </h2>
              <span className="text-[9px] text-slate-500 font-medium">
                Completed: <strong>{completedCount}/11</strong> | Actual: <strong>{totalActualHours.toFixed(1)}h</strong> (Std: {totalTargetHours}h)
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1 px-1.5 w-6 text-center">#</th>
                    <th className="py-1 px-1.5">Manufacturing Process</th>
                    <th className="py-1 px-1.5 w-16">Status</th>
                    <th className="py-1 px-1 text-center w-12">Std (h)</th>
                    <th className="py-1 px-1 text-center w-14">Actual (h)</th>
                    <th className="py-1 px-1.5 w-24">Start Time</th>
                    <th className="py-1 px-1.5 w-24">Completion Time</th>
                    <th className="py-1 px-1.5 w-24">Operator</th>
                    <th className="py-1 px-1.5">Remarks / Delay Cause</th>
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
                            ? 'bg-blue-50/60 font-semibold text-slate-900'
                            : isDone
                            ? 'bg-white'
                            : 'bg-slate-50/30 text-slate-400'
                        }
                      >
                        <td className="py-0.5 px-1.5 font-mono text-slate-400 text-center font-bold">{idx + 1}</td>
                        <td className="py-0.5 px-1.5 font-medium text-slate-900">
                          {def.name}
                          {st?.is_admin_override && (
                            <span className="ml-1 text-[8px] text-purple-700 font-bold bg-purple-100 px-1 rounded">
                              [Admin]
                            </span>
                          )}
                        </td>
                        <td className="py-0.5 px-1.5 font-mono uppercase text-[9px]">
                          {isDone ? (
                            <span className="text-emerald-700 font-bold">Done</span>
                          ) : isCurrent ? (
                            <span className="text-blue-700 font-bold">Active</span>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="py-0.5 px-1 text-center font-mono text-slate-500">
                          {def.standardDurationHrs}h
                        </td>
                        <td className="py-0.5 px-1 text-center font-mono font-bold">
                          {st?.duration_hours ? `${Number(st.duration_hours).toFixed(1)}h` : '—'}
                        </td>
                        <td className="py-0.5 px-1.5 font-mono text-[8.5px] text-slate-600">
                          {st?.started_at ? st.started_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-0.5 px-1.5 font-mono text-[8.5px] text-slate-600">
                          {st?.completed_at ? st.completed_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-0.5 px-1.5 font-medium text-slate-800">
                          {st?.operator_name || '—'}
                        </td>
                        <td className="py-0.5 px-1.5 text-[8.5px]">
                          {st?.delay_reason && st.delay_reason !== 'None' ? (
                            <span className="text-amber-700 font-bold">
                              {st.delay_reason} {st.delay_notes ? `(${st.delay_notes})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Normal</span>
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
            <div className="space-y-1 avoid-break">
              <h2 className="font-bold text-[10px] text-amber-800 uppercase tracking-wider">
                Section 3: Quality Rejection & Rework Log
              </h2>
              <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50/40">
                <table className="w-full text-left border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-amber-100/60 text-amber-900 font-bold border-b border-amber-200">
                      <th className="py-1 px-1.5">Process Stage</th>
                      <th className="py-1 px-1.5">Defect / Rejection Reason</th>
                      <th className="py-1 px-1.5">Supervisor</th>
                      <th className="py-1 px-1.5">Corrective Action Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200 text-slate-700">
                    {reworkLogs.map((rw) => (
                      <tr key={rw.id}>
                        <td className="py-0.5 px-1.5 font-semibold text-slate-900">{rw.process_name}</td>
                        <td className="py-0.5 px-1.5 text-red-700 font-bold">{rw.reason}</td>
                        <td className="py-0.5 px-1.5">{rw.supervisor_name}</td>
                        <td className="py-0.5 px-1.5 text-slate-800">{rw.corrective_action || 'Completed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Official Sign-Off Authority Boxes */}
          <div className="pt-2 border-t-2 border-slate-300 avoid-break">
            <h2 className="font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">
              Official Quality & Production Approval Authorities
            </h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-14 bg-white">
                <span className="text-[8.5px] uppercase font-bold text-slate-500">Assembly Fitter</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                <span className="text-[9px] text-slate-700 font-medium truncate">
                  {jobCard.assigned_fitter_name || 'Floor Operator'}
                </span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-14 bg-white">
                <span className="text-[8.5px] uppercase font-bold text-slate-500">Line Supervisor</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                <span className="text-[9px] text-slate-700 font-medium truncate">{jobCard.supervisor_name}</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-14 bg-white">
                <span className="text-[8.5px] uppercase font-bold text-slate-500">QA / QC Inspector</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                <span className="text-[9px] text-slate-700 font-medium truncate">Quality Certified</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between h-14 bg-white">
                <span className="text-[8.5px] uppercase font-bold text-slate-500">Works / Plant Head</span>
                <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                <span className="text-[9px] text-slate-700 font-medium truncate">Dispatch Clearance</span>
              </div>
            </div>
            <p className="text-[8px] text-slate-400 text-center mt-1.5">
              This document is an electronically managed and audit-tracked production record of Synchro Electricals Pvt. Ltd. | Scan QR code above for live digital route history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
