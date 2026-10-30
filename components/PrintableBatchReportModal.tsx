'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { JobCard, PRODUCTION_STAGES } from '@/types';
import { X, Printer, FileText, Layers, Tag, CheckSquare } from 'lucide-react';

interface PrintableBatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCards: JobCard[];
}

export function PrintableBatchReportModal({
  isOpen,
  onClose,
  jobCards,
}: PrintableBatchReportModalProps) {
  const [printMode, setPrintMode] = useState<'summary' | 'dossiers' | 'stickers'>('summary');
  const [qrMap, setQrMap] = useState<{ [jcNo: string]: string }>({});

  useEffect(() => {
    if (isOpen && jobCards.length > 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const map: { [jcNo: string]: string } = {};

      const promises = jobCards.map(async (jc) => {
        try {
          const url = `${origin}/track/${jc.job_card_no}`;
          const qr = await QRCode.toDataURL(url, {
            width: 140,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          map[jc.job_card_no] = qr;
        } catch (e) {
          console.error(e);
        }
      });

      Promise.all(promises).then(() => setQrMap(map));
    }
  }, [isOpen, jobCards]);

  if (!isOpen || jobCards.length === 0) return null;

  const totalSelected = jobCards.length;
  const completedCount = jobCards.filter((j) => j.status === 'completed' || j.status === 'dispatched').length;
  const inProgressCount = jobCards.filter((j) => j.status === 'in_progress').length;
  const delayedCount = jobCards.filter((j) => j.status === 'delayed').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col border border-slate-200">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 rounded-t-2xl print:hidden">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Batch Production Report & Records Printer</span>
            </h3>
            <p className="text-xs text-slate-500">
              Selected <strong>{totalSelected}</strong> panel records | Ready for print & export
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-200 p-0.5 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setPrintMode('summary')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  printMode === 'summary'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Summary Matrix</span>
              </button>
              <button
                onClick={() => setPrintMode('dossiers')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  printMode === 'dossiers'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Multi Dossiers</span>
              </button>
              <button
                onClick={() => setPrintMode('stickers')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  printMode === 'stickers'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>QR Stickers</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print {printMode === 'summary' ? 'Summary' : printMode === 'dossiers' ? 'All Dossiers' : 'Stickers'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans text-slate-800 text-xs printable-document">
          {/* ================= MODE 1: SUMMARY DOCKET ================= */}
          {printMode === 'summary' && (
            <div className="space-y-6">
              {/* Report Header */}
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
                      Batch Production Summary Docket & Shift Handover Record
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Vadodara Works | Total Records in Batch: {totalSelected}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                    BATCH REPORT
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* KPI Summary Tiles */}
              <div className="grid grid-cols-4 gap-3 text-center avoid-break">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Panels</span>
                  <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalSelected}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Completed / Dispatched</span>
                  <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">{completedCount}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-blue-700">In Progress</span>
                  <p className="text-xl font-black text-blue-700 font-mono mt-0.5">{inProgressCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Bottlenecks / Delayed</span>
                  <p className="text-xl font-black text-amber-700 font-mono mt-0.5">{delayedCount}</p>
                </div>
              </div>

              {/* Records Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden avoid-break">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Job Card No</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3">Assembly Line</th>
                      <th className="py-2.5 px-3">Current Stage</th>
                      <th className="py-2.5 px-2.5 text-center">Status</th>
                      <th className="py-2.5 px-3">Supervisor</th>
                      <th className="py-2.5 px-3">Fitter</th>
                      <th className="py-2.5 px-2.5 text-center w-14">QR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {jobCards.map((jc, idx) => (
                      <tr key={jc.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{jc.job_card_no}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {jc.product_name}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {jc.panel_type} | Lot: {jc.lot_qty} | Cust: {jc.customer_code || '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {jc.assemblyLine || jc.assembly_line}
                        </td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                            {jc.current_stage}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              jc.status === 'completed' || jc.status === 'dispatched'
                                ? 'bg-emerald-100 text-emerald-800'
                                : jc.status === 'delayed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {jc.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{jc.supervisor_name}</td>
                        <td className="py-2 px-3 text-slate-700">{jc.assigned_fitter_name || 'Floor Team'}</td>
                        <td className="py-1 px-2.5 text-center">
                          {qrMap[jc.job_card_no] && (
                            <img
                              src={qrMap[jc.job_card_no]}
                              alt="QR"
                              className="w-8 h-8 mx-auto border border-slate-200 rounded"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sign-off Blocks */}
              <div className="pt-4 border-t-2 border-slate-300 avoid-break">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border border-slate-300 rounded-lg p-3 bg-white h-20 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Prepared By (PPC)</span>
                    <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-700 font-medium">Production Planning</span>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 bg-white h-20 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Shop Floor Supervisor</span>
                    <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-700 font-medium">Floor In-Charge</span>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 bg-white h-20 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Plant Head / Manager</span>
                    <div className="border-b border-dotted border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-700 font-medium">Operations Approval</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 2: MULTI DOSSIERS (Page Breaks) ================= */}
          {printMode === 'dossiers' && (
            <div className="space-y-12">
              {jobCards.map((jc, index) => (
                <div
                  key={jc.id}
                  className={`space-y-5 ${
                    index < jobCards.length - 1 ? 'page-break' : ''
                  }`}
                >
                  {/* Dossier Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        SE
                      </div>
                      <div>
                        <h1 className="text-base font-black uppercase text-slate-900">
                          Synchro Electricals Pvt. Ltd.
                        </h1>
                        <p className="text-[10px] text-slate-500">
                          Panel Production Dossier & Route Sheet | Record {index + 1} of {jobCards.length}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-right">
                      {qrMap[jc.job_card_no] && (
                        <img
                          src={qrMap[jc.job_card_no]}
                          alt="QR"
                          className="w-16 h-16 border border-slate-300 rounded p-0.5 bg-white"
                        />
                      )}
                      <div>
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {jc.job_card_no}
                        </span>
                        <p className="text-[10px] text-blue-700 font-bold mt-1 uppercase">
                          {jc.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Spec Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Product</span>
                      <strong className="text-slate-900">{jc.product_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Line</span>
                      <strong className="text-blue-700">{jc.assemblyLine || jc.assembly_line}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Type / Lot</span>
                      <span>{jc.panel_type} (Lot: {jc.lot_qty})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Supervisor</span>
                      <span>{jc.supervisor_name}</span>
                    </div>
                  </div>

                  {/* 11 Stage Overview Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-700">
                          <th className="py-1 px-2 w-6">#</th>
                          <th className="py-1 px-2">Stage Process</th>
                          <th className="py-1 px-2 w-16 text-center">Target (h)</th>
                          <th className="py-1 px-2">Status</th>
                          <th className="py-1 px-2">Supervisor / Sign</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {PRODUCTION_STAGES.map((s, sIdx) => {
                          const isReached = sIdx <= jc.current_stage_idx;
                          const isCurrent = sIdx === jc.current_stage_idx;

                          return (
                            <tr
                              key={sIdx}
                              className={isCurrent ? 'bg-blue-50 font-bold text-blue-900' : ''}
                            >
                              <td className="py-1 px-2 font-mono text-slate-400">{sIdx + 1}</td>
                              <td className="py-1 px-2 font-medium">{s.name}</td>
                              <td className="py-1 px-2 text-center font-mono">{s.standardDurationHrs}h</td>
                              <td className="py-1 px-2">
                                {sIdx < jc.current_stage_idx || jc.status === 'completed' ? (
                                  <span className="text-emerald-700 font-bold">Completed</span>
                                ) : isCurrent ? (
                                  <span className="text-blue-700 font-bold">In Progress</span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </td>
                              <td className="py-1 px-2 text-slate-500">
                                {isReached ? jc.supervisor_name : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-3 text-center pt-2">
                    <div className="border border-slate-300 rounded p-2 text-[10px]">
                      <span className="text-slate-500 block">Operator Signature</span>
                      <div className="h-6"></div>
                      <span className="text-slate-800 font-medium">{jc.assigned_fitter_name || 'Floor Fitter'}</span>
                    </div>
                    <div className="border border-slate-300 rounded p-2 text-[10px]">
                      <span className="text-slate-500 block">Supervisor Signature</span>
                      <div className="h-6"></div>
                      <span className="text-slate-800 font-medium">{jc.supervisor_name}</span>
                    </div>
                    <div className="border border-slate-300 rounded p-2 text-[10px]">
                      <span className="text-slate-500 block">Quality Sign-Off</span>
                      <div className="h-6"></div>
                      <span className="text-slate-800 font-medium">Quality Passed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= MODE 3: BATCH QR STICKERS (Sticker Sheet) ================= */}
          {printMode === 'stickers' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {jobCards.map((jc) => (
                <div
                  key={jc.id}
                  className="border-2 border-slate-900 rounded-xl p-3.5 bg-white text-center space-y-2 avoid-break shadow-sm"
                >
                  <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span className="font-black text-xs uppercase text-slate-900">SYNCHRO ELECTRICALS</span>
                    <span className="text-[9px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                      {jc.panel_type}
                    </span>
                  </div>

                  {qrMap[jc.job_card_no] ? (
                    <img
                      src={qrMap[jc.job_card_no]}
                      alt="QR"
                      className="w-28 h-28 mx-auto border border-slate-200 rounded p-1"
                    />
                  ) : (
                    <div className="w-28 h-28 mx-auto bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                      Generating...
                    </div>
                  )}

                  <div>
                    <span className="font-mono font-black text-sm text-blue-700 block tracking-wider">
                      {jc.job_card_no}
                    </span>
                    <strong className="text-[11px] text-slate-900 block truncate">{jc.product_name}</strong>
                    <span className="text-[10px] text-slate-600 block">
                      {jc.assemblyLine || jc.assembly_line} | Lot: {jc.lot_qty}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-[9px] text-slate-400">
                    Scan with Smartphone Camera for Live Tracking
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
