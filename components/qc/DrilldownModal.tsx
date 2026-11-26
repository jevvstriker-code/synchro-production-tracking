'use client';

import React from 'react';
import { X, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { ReworkRecord, QCRecord } from '@/types/qc';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'rework' | 'qc';
  items: any[];
}

export function DrilldownModal({
  isOpen,
  onClose,
  title,
  type,
  items,
}: DrilldownModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                type === 'rework' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {type === 'rework' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : (
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">{items.length} records matching selection</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Table */}
        <div className="overflow-auto flex-grow p-0">
          <table className="w-full text-left border-collapse text-xs">
            {type === 'rework' ? (
              <>
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b sticky top-0 z-10 text-[10px]">
                  <tr>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Item / Panel</th>
                    <th className="p-3">Team / Vendor</th>
                    <th className="p-3">Reason & Action Taken</th>
                    <th className="p-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No rework records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((r: ReworkRecord, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-medium whitespace-nowrap">{r.issue_date}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {r.item_name}
                          <span className="text-[10px] text-slate-500 block">Qty: {r.qty}</span>
                        </td>
                        <td className="p-3">{r.team_vendor || '-'}</td>
                        <td className="p-3">
                          <p className="text-rose-600 font-semibold mb-0.5">Defect: {r.reason}</p>
                          <p className="text-slate-600">Action: {r.action_taken || '-'}</p>
                          {r.root_cause && (
                            <p className="text-[10px] text-slate-400">Root Cause: {r.root_cause}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              r.verification_status === 'OK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.verification_status === 'OK' ? 'Verified OK' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b sticky top-0 z-10 text-[10px]">
                  <tr>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Item / Serial</th>
                    <th className="p-3">Client / Vendor</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No QC records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((q: QCRecord, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold whitespace-nowrap">{q.stage}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {q.item_name}
                          <span className="text-[10px] text-slate-500 block">SN: {q.serial_no || '-'}</span>
                        </td>
                        <td className="p-3">
                          {q.client}
                          <span className="text-[10px] text-slate-400 block">{q.team_vendor}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              q.status === 'Accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.status === 'Rework'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{q.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
