'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { JobCard, StageLog, ReworkLog, PRODUCTION_STAGES } from '@/types';
import { jobCardService } from '@/services/jobCardService';
import { reworkService } from '@/services/reworkService';
import { X, Printer, Download, ShieldCheck, FileText } from 'lucide-react';

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
        width: 180,
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

  // Specific Identification Number & Serial Number formatting
  const serialNo = (jobCard.job_card_no || 'SE000000').replace(/[^a-zA-Z0-9_-]/g, '_');
  const specificIdentNo = (jobCard.id ? jobCard.id.split('-')[0] : 'PANEL').toUpperCase();
  const cleanProductName = (jobCard.product_name || 'Panel')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_');

  // Exact file name requested: Serial Number & Specific Identification Number
  const pdfFileName = `${serialNo}_ID-${specificIdentNo}_${cleanProductName}.pdf`;
  const printTitle = `${serialNo}_ID-${specificIdentNo}_${cleanProductName}`;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = printTitle;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 2500);
  };

  const handleDownloadPdf = async () => {
    // We capture the dedicated A4 template (#a4-dossier-pdf-template) which has fixed 794px desktop A4 width
    // This ensures consistent, reliable spacing and zero mobile-screen distortion!
    const el = document.getElementById('a4-dossier-pdf-template') || document.getElementById('printable-panel-dossier');
    if (!el || !jobCard) return;
    setIsDownloadingPdf(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2, // 300 DPI crisp resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 8; // 8mm margin
      const printableWidth = pageWidth - margin * 2; // 194mm
      const printableHeight = pageHeight - margin * 2; // 281mm

      // Natural proportional aspect ratio (no vertical stretching or unnatural flex voids)
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        printableWidth,
        Math.min(imgHeight, printableHeight),
        undefined,
        'FAST'
      );

      pdf.save(pdfFileName);
    } catch (err) {
      console.error('Direct PDF export error:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 print-modal-overlay">
      {/* =========================================================================
          PART 1: RESPONSIVE ON-SCREEN MODAL (Mobile, Tablet & Desktop Friendly)
          ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden print-modal-container">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 print:hidden">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Panel Production Dossier & Route Sheet</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                A4 Portrait
              </span>
            </h3>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Serial No: <strong className="text-blue-700">{serialNo}</strong> | Specific ID:{' '}
              <strong className="text-slate-900">#{specificIdentNo}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* 1-Click Direct Download PDF with Serial No & Specific ID */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-3 sm:px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              title={`Download PDF as: ${pdfFileName}`}
            >
              {isDownloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Browser Print / Save as PDF (1 Page) */}
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 sm:px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              title="Open browser print dialog (Default filename set to Serial No & ID)"
            >
              <Printer className="w-4 h-4" />
              <span>Print (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Responsive Document Body (Scrollable, mobile responsive, used for on-screen & browser print) */}
        <div
          id="printable-panel-dossier"
          className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans text-slate-800 text-xs leading-normal space-y-4 printable-document print-dossier-page bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 avoid-break">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-700 text-white rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl tracking-wider shadow-sm shrink-0">
                SE
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase leading-tight">
                  Synchro Electricals Pvt. Ltd.
                </h1>
                <p className="text-[11px] text-slate-700 font-medium">
                  Industrial Panel Manufacturing, Automation & Switchgear Division
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  ISO 9001:2015 Certified | CPRI Tested & Approved Panels | QR Live Route Sheet
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:text-right shrink-0">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-16 h-16 sm:w-18 sm:h-18 border-2 border-slate-800 rounded-lg p-0.5 bg-white shadow-xs"
                />
              )}
              <div className="sm:text-right">
                <div className="bg-slate-900 text-white font-mono font-black text-xs px-2.5 py-1 rounded shadow-xs tracking-wider inline-block">
                  {jobCard.job_card_no}
                </div>
                <div className="text-[10px] font-mono text-slate-700 mt-1 font-semibold">
                  SPECIFIC ID: <strong className="text-slate-900 font-black">#{specificIdentNo}</strong>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11px] font-black mt-0.5 uppercase tracking-wide text-blue-700">
                  STATUS: {jobCard.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Specifications & Metadata Grid */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 sm:p-3.5 avoid-break">
            <h2 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Section 1: Panel Identification & Production Specifications</span>
              <span className="text-[10px] text-blue-800 font-mono font-bold">
                Panel UID: {jobCard.id || specificIdentNo}
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Product Description
                </span>
                <strong className="text-slate-900 font-extrabold block text-xs leading-normal">
                  {jobCard.product_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Assembly Line
                </span>
                <strong className="text-blue-700 font-extrabold block text-xs leading-normal">
                  {jobCard.assemblyLine || jobCard.assembly_line}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Panel Type / Lot Qty
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-normal">
                  {jobCard.panel_type} (Lot: {jobCard.lot_qty})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Customer Reference
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-normal">
                  {jobCard.customer_code || 'Internal / Stock'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  PPC Engineer
                </span>
                <strong className="text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.ppc_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Line Supervisor
                </span>
                <strong className="text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.supervisor_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Assigned Fitter
                </span>
                <strong className="text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.assigned_fitter_name || 'Floor Team'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Start & Target Date
                </span>
                <span className="font-mono text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.production_start_date} ➔ {jobCard.production_end_date || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 11-Stage Route Sheet */}
          <div className="space-y-2 avoid-break">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider">
                Section 2: Industrial Process Route Sheet & Floor Sign-Offs (11 Stages)
              </h2>
              <span className="text-[10px] text-slate-600 font-medium">
                Completed: <strong className="text-emerald-700">{completedCount}/11</strong> | Actual:{' '}
                <strong className="text-slate-900">{totalActualHours.toFixed(1)}h</strong> (Std:{' '}
                {totalTargetHours}h)
              </span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-x-auto bg-white">
              <table className="w-full min-w-[640px] text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b-2 border-slate-300">
                    <th className="py-2 px-2 w-7 text-center">#</th>
                    <th className="py-2 px-2.5">Manufacturing Process</th>
                    <th className="py-2 px-2 text-center w-20">Status</th>
                    <th className="py-2 px-1.5 text-center w-14">Std (h)</th>
                    <th className="py-2 px-1.5 text-center w-16">Actual (h)</th>
                    <th className="py-2 px-2 w-28">Start Time</th>
                    <th className="py-2 px-2 w-28">Completion Time</th>
                    <th className="py-2 px-2 w-24">Operator</th>
                    <th className="py-2 px-2">Remarks / Delay Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {PRODUCTION_STAGES.map((def, idx) => {
                    const st = stages.find((s) => s.stage_index === idx);
                    const isDone = st?.status === 'completed';
                    const isCurrent = st?.status === 'in_progress';

                    return (
                      <tr
                        key={idx}
                        className={
                          isCurrent
                            ? 'bg-blue-50/70 font-semibold text-slate-900'
                            : isDone
                            ? 'bg-white'
                            : 'bg-slate-50/40 text-slate-400'
                        }
                      >
                        <td className="py-1.5 px-2 font-mono text-slate-500 font-bold text-center">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">
                          {def.name}
                          {st?.is_admin_override && (
                            <span className="ml-1 text-[8px] text-purple-700 font-bold bg-purple-100 px-1 py-0.2 rounded border border-purple-200">
                              [Admin]
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {isDone ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              DONE
                            </span>
                          ) : isCurrent ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono font-medium text-slate-600">
                          {def.standardDurationHrs}h
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-mono font-bold text-slate-900">
                          {st?.duration_hours ? `${Number(st.duration_hours).toFixed(1)}h` : '—'}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-[9.5px] text-slate-700">
                          {st?.started_at ? st.started_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-[9.5px] text-slate-700">
                          {st?.completed_at ? st.completed_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-slate-800">
                          {st?.operator_name || '—'}
                        </td>
                        <td className="py-1.5 px-2 text-[9.5px]">
                          {st?.delay_reason && st.delay_reason !== 'None' ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                              {st.delay_reason} {st.delay_notes ? `(${st.delay_notes})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Quality Compliance / Rework */}
          {reworkLogs.length > 0 ? (
            <div className="space-y-1.5 avoid-break">
              <h2 className="font-extrabold text-[10.5px] text-amber-900 uppercase tracking-wider">
                Section 3: Quality Rejection & Corrective Action Log
              </h2>
              <div className="border border-amber-300 rounded-xl overflow-hidden bg-amber-50/50">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-amber-100 text-amber-900 font-extrabold border-b border-amber-300">
                      <th className="py-1 px-2.5">Process Stage</th>
                      <th className="py-1 px-2.5">Defect / Rejection Cause</th>
                      <th className="py-1 px-2.5">Supervisor</th>
                      <th className="py-1 px-2.5">Corrective Action Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200 text-slate-800">
                    {reworkLogs.map((rw) => (
                      <tr key={rw.id}>
                        <td className="py-1 px-2.5 font-bold text-slate-900">{rw.process_name}</td>
                        <td className="py-1 px-2.5 text-red-700 font-bold">{rw.reason}</td>
                        <td className="py-1 px-2.5 font-medium">{rw.supervisor_name}</td>
                        <td className="py-1 px-2.5 text-slate-800 font-medium">
                          {rw.corrective_action || 'Corrected & Approved'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs avoid-break">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-emerald-900 block text-[10.5px]">
                    Quality Inspection & Compliance Verification
                  </span>
                  <span className="text-[9.5px] text-emerald-800 font-medium">
                    100% stage quality criteria satisfied. Zero rejections or rework reported during production.
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-emerald-600 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded">
                  IS 8623 / IEC 61439 Standard
                </span>
              </div>
            </div>
          )}

          {/* Section 4: Approval Authorities */}
          <div className="avoid-break space-y-1.5">
            <h2 className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
              Section 4: Official Quality & Production Approval Authorities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div className="border border-slate-300 rounded-xl p-2.5 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  Assembly Fitter
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-1"></div>
                <div>
                  <span className="text-[11px] text-slate-900 font-extrabold block leading-normal">
                    {jobCard.assigned_fitter_name || 'Floor Operator'}
                  </span>
                  <span className="text-[8.5px] text-slate-400 block font-medium">Signature & Date</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-2.5 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  Line Supervisor
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-1"></div>
                <div>
                  <span className="text-[11px] text-slate-900 font-extrabold block leading-normal">
                    {jobCard.supervisor_name}
                  </span>
                  <span className="text-[8.5px] text-slate-400 block font-medium">Signature & Date</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-2.5 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  QA / QC Inspector
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-1"></div>
                <div>
                  <span className="text-[11px] text-slate-900 font-extrabold block leading-normal">
                    Quality Certified
                  </span>
                  <span className="text-[8.5px] text-slate-400 block font-medium">Signature & Stamp</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-2.5 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  Works / Plant Head
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-1"></div>
                <div>
                  <span className="text-[11px] text-slate-900 font-extrabold block leading-normal">
                    Dispatch Authorized
                  </span>
                  <span className="text-[8.5px] text-slate-400 block font-medium">Clearance Stamp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Footer */}
          <div className="pt-2 border-t border-slate-300 text-center avoid-break">
            <p className="text-[9px] text-slate-500 font-medium">
              Synchro Electricals Pvt. Ltd. | Official Production Record | Panel Serial:{' '}
              <strong className="text-slate-800">{serialNo}</strong> | Specific ID:{' '}
              <strong className="text-slate-800">#{specificIdentNo}</strong> | Scan QR code on top right for live
              cloud status.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PART 2: DEDICATED A4 PDF EXPORT TEMPLATE (Clean 794px Desktop A4 Layout)
          - Positioned off-screen with positive bounding box (never affected by mobile viewport)
          - Natural vertical flow (space-y-3.5) with ZERO artificial justify-between gaps
          - Produces razor-sharp, perfectly-spaced 1-page A4 PDFs on ANY device
          ========================================================================= */}
      <div
        id="a4-dossier-pdf-template"
        className="pdf-export-hidden-on-print"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '794px',
          minWidth: '794px',
          maxWidth: '794px',
          zIndex: -50,
          opacity: 0.001,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          padding: '24px 28px',
        }}
      >
        <div className="space-y-3.5 font-sans text-slate-800 text-xs leading-normal bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 bg-blue-700 text-white rounded-xl flex items-center justify-center font-black text-2xl tracking-wider shadow-sm shrink-0">
                SE
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                  Synchro Electricals Pvt. Ltd.
                </h1>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  Industrial Panel Manufacturing, Automation & Switchgear Division
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  ISO 9001:2015 Certified | CPRI Tested & Approved Panels | QR Live Route Sheet
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 text-right shrink-0">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-18 h-18 border-2 border-slate-800 rounded-lg p-0.5 bg-white shadow-xs"
                  style={{ width: '68px', height: '68px' }}
                />
              )}
              <div className="text-right">
                <div className="bg-slate-900 text-white font-mono font-black text-xs px-2.5 py-1 rounded shadow-xs tracking-wider inline-block">
                  {jobCard.job_card_no}
                </div>
                <div className="text-[10px] font-mono text-slate-700 mt-1 font-semibold">
                  SPECIFIC ID: <strong className="text-slate-900 font-black">#{specificIdentNo}</strong>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[11px] font-black mt-0.5 uppercase tracking-wide text-blue-700">
                  STATUS: {jobCard.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Specifications & Metadata Grid (Always 4 Columns) */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3">
            <h2 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Section 1: Panel Identification & Production Specifications</span>
              <span className="text-[10px] text-blue-800 font-mono font-bold">
                Panel UID: {jobCard.id || specificIdentNo}
              </span>
            </h2>
            <div className="grid grid-cols-4 gap-2.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Product Description
                </span>
                <strong className="text-slate-900 font-extrabold block text-xs leading-normal">
                  {jobCard.product_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Assembly Line
                </span>
                <strong className="text-blue-700 font-extrabold block text-xs leading-normal">
                  {jobCard.assemblyLine || jobCard.assembly_line}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Panel Type / Lot Qty
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-normal">
                  {jobCard.panel_type} (Lot: {jobCard.lot_qty})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Customer Reference
                </span>
                <strong className="text-slate-900 font-bold block text-xs leading-normal">
                  {jobCard.customer_code || 'Internal / Stock'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  PPC Engineer
                </span>
                <strong className="text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.ppc_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Line Supervisor
                </span>
                <strong className="text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.supervisor_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Assigned Fitter
                </span>
                <strong className="text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.assigned_fitter_name || 'Floor Team'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wide">
                  Start & Target Date
                </span>
                <span className="font-mono text-slate-800 font-bold block text-xs leading-normal">
                  {jobCard.production_start_date} ➔ {jobCard.production_end_date || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 11-Stage Route Sheet Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider">
                Section 2: Industrial Process Route Sheet & Floor Sign-Offs (11 Stages)
              </h2>
              <span className="text-[10px] text-slate-600 font-medium">
                Completed: <strong className="text-emerald-700">{completedCount}/11</strong> | Actual:{' '}
                <strong className="text-slate-900">{totalActualHours.toFixed(1)}h</strong> (Std:{' '}
                {totalTargetHours}h)
              </span>
            </div>

            <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b-2 border-slate-300">
                    <th className="py-1.5 px-2 w-7 text-center">#</th>
                    <th className="py-1.5 px-2.5">Manufacturing Process</th>
                    <th className="py-1.5 px-2 text-center w-20">Status</th>
                    <th className="py-1.5 px-1.5 text-center w-14">Std (h)</th>
                    <th className="py-1.5 px-1.5 text-center w-16">Actual (h)</th>
                    <th className="py-1.5 px-2 w-28">Start Time</th>
                    <th className="py-1.5 px-2 w-28">Completion Time</th>
                    <th className="py-1.5 px-2 w-24">Operator</th>
                    <th className="py-1.5 px-2">Remarks / Delay Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {PRODUCTION_STAGES.map((def, idx) => {
                    const st = stages.find((s) => s.stage_index === idx);
                    const isDone = st?.status === 'completed';
                    const isCurrent = st?.status === 'in_progress';

                    return (
                      <tr
                        key={idx}
                        className={
                          isCurrent
                            ? 'bg-blue-50/70 font-semibold text-slate-900'
                            : isDone
                            ? 'bg-white'
                            : 'bg-slate-50/40 text-slate-400'
                        }
                      >
                        <td className="py-1 px-2 font-mono text-slate-500 font-bold text-center">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-2.5 font-bold text-slate-900">
                          {def.name}
                          {st?.is_admin_override && (
                            <span className="ml-1 text-[8px] text-purple-700 font-bold bg-purple-100 px-1 py-0.2 rounded border border-purple-200">
                              [Admin]
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-2 text-center">
                          {isDone ? (
                            <span className="inline-block px-2 py-0.2 rounded text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              DONE
                            </span>
                          ) : isCurrent ? (
                            <span className="inline-block px-2 py-0.2 rounded text-[9.5px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-1.5 text-center font-mono font-medium text-slate-600">
                          {def.standardDurationHrs}h
                        </td>
                        <td className="py-1 px-1.5 text-center font-mono font-bold text-slate-900">
                          {st?.duration_hours ? `${Number(st.duration_hours).toFixed(1)}h` : '—'}
                        </td>
                        <td className="py-1 px-2 font-mono text-[9.5px] text-slate-700">
                          {st?.started_at ? st.started_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-1 px-2 font-mono text-[9.5px] text-slate-700">
                          {st?.completed_at ? st.completed_at.substring(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="py-1 px-2 font-bold text-slate-800">
                          {st?.operator_name || '—'}
                        </td>
                        <td className="py-1 px-2 text-[9.5px]">
                          {st?.delay_reason && st.delay_reason !== 'None' ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                              {st.delay_reason} {st.delay_notes ? `(${st.delay_notes})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Quality Compliance / Rework */}
          {reworkLogs.length > 0 ? (
            <div className="space-y-1">
              <h2 className="font-extrabold text-[10.5px] text-amber-900 uppercase tracking-wider">
                Section 3: Quality Rejection & Corrective Action Log
              </h2>
              <div className="border border-amber-300 rounded-xl overflow-hidden bg-amber-50/50">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-amber-100 text-amber-900 font-extrabold border-b border-amber-300">
                      <th className="py-1 px-2.5">Process Stage</th>
                      <th className="py-1 px-2.5">Defect / Rejection Cause</th>
                      <th className="py-1 px-2.5">Supervisor</th>
                      <th className="py-1 px-2.5">Corrective Action Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200 text-slate-800">
                    {reworkLogs.map((rw) => (
                      <tr key={rw.id}>
                        <td className="py-1 px-2.5 font-bold text-slate-900">{rw.process_name}</td>
                        <td className="py-1 px-2.5 text-red-700 font-bold">{rw.reason}</td>
                        <td className="py-1 px-2.5 font-medium">{rw.supervisor_name}</td>
                        <td className="py-1 px-2.5 text-slate-800 font-medium">
                          {rw.corrective_action || 'Corrected & Approved'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-emerald-900 block text-[10.5px]">
                    Quality Inspection & Compliance Verification
                  </span>
                  <span className="text-[9.5px] text-emerald-800 font-medium">
                    100% stage quality criteria satisfied. Zero rejections or rework reported during production.
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-emerald-600 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded">
                  IS 8623 / IEC 61439 Standard
                </span>
              </div>
            </div>
          )}

          {/* Section 4: Approval Authorities */}
          <div className="space-y-1">
            <h2 className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
              Section 4: Official Quality & Production Approval Authorities
            </h2>
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="border-2 border-slate-300 rounded-xl p-2 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  Assembly Fitter
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-0.5"></div>
                <div>
                  <span className="text-[10.5px] text-slate-900 font-extrabold block leading-normal">
                    {jobCard.assigned_fitter_name || 'Floor Operator'}
                  </span>
                  <span className="text-[8px] text-slate-400 block font-medium">Signature & Date</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 rounded-xl p-2 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  Line Supervisor
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-0.5"></div>
                <div>
                  <span className="text-[10.5px] text-slate-900 font-extrabold block leading-normal">
                    {jobCard.supervisor_name}
                  </span>
                  <span className="text-[8px] text-slate-400 block font-medium">Signature & Date</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 rounded-xl p-2 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  QA / QC Inspector
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-0.5"></div>
                <div>
                  <span className="text-[10.5px] text-slate-900 font-extrabold block leading-normal">
                    Quality Certified
                  </span>
                  <span className="text-[8px] text-slate-400 block font-medium">Signature & Stamp</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 rounded-xl p-2 flex flex-col justify-between h-20 bg-white shadow-xs">
                <span className="text-[9.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                  Works / Plant Head
                </span>
                <div className="border-b border-dashed border-slate-400 w-4/5 mx-auto my-0.5"></div>
                <div>
                  <span className="text-[10.5px] text-slate-900 font-extrabold block leading-normal">
                    Dispatch Authorized
                  </span>
                  <span className="text-[8px] text-slate-400 block font-medium">Clearance Stamp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-300 text-center">
            <p className="text-[9px] text-slate-500 font-medium">
              Synchro Electricals Pvt. Ltd. | Official Production Record | Panel Serial:{' '}
              <strong className="text-slate-800">{serialNo}</strong> | Specific ID:{' '}
              <strong className="text-slate-800">#{specificIdentNo}</strong> | Scan QR code on top right for live
              cloud status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
