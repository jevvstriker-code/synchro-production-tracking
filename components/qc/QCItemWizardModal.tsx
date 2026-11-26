'use client';

import React, { useState, useEffect } from 'react';
import { QCRecord, ReworkRecord, QCStatus, QCStage, InOutType, DefectType, VerificationStatus } from '@/types/qc';
import { JobCard } from '@/types';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Microscope,
  Layers,
  Link as LinkIcon,
  Check,
  Sparkles
} from 'lucide-react';

export interface QCItemForm extends QCRecord {
  reworkDraft?: Partial<ReworkRecord>;
}

interface QCItemWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: QCItemForm) => void;
  initialItem?: QCItemForm | null;
  productionJobCards?: JobCard[];
}

const getLiveTimeString = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export function QCItemWizardModal({
  isOpen,
  onClose,
  onSave,
  initialItem,
  productionJobCards = [],
}: QCItemWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [selectedJobCardNo, setSelectedJobCardNo] = useState<string>('');
  const [stage, setStage] = useState<QCStage>((initialItem?.stage as QCStage) || 'Final QC');
  const [itemName, setItemName] = useState(initialItem?.item_name || '');
  const [category, setCategory] = useState(initialItem?.category || '');
  const [inOut, setInOut] = useState<InOutType>((initialItem?.in_out as InOutType) || 'Indoor');

  const [serialNo, setSerialNo] = useState(initialItem?.serial_no || '');
  const [teamVendor, setTeamVendor] = useState(initialItem?.team_vendor || '');
  const [client, setClient] = useState(initialItem?.client || '');

  const [qty, setQty] = useState<number>(initialItem?.qty || 1);
  const [docs, setDocs] = useState(initialItem?.docs || 'Yes');
  const [inspectionTime, setInspectionTime] = useState(initialItem?.inspection_time || getLiveTimeString());
  const [status, setStatus] = useState<QCStatus>(initialItem?.status || 'Accepted');
  const [remarks, setRemarks] = useState(initialItem?.remarks || '');

  // Defect Fields (Step 4)
  const [defectStage, setDefectStage] = useState(initialItem?.reworkDraft?.stage || 'Wiring');
  const [defectQty, setDefectQty] = useState<number>(initialItem?.reworkDraft?.qty || initialItem?.qty || 1);
  const [defectReason, setDefectReason] = useState(initialItem?.reworkDraft?.reason || '');
  const [rootCause, setRootCause] = useState(initialItem?.reworkDraft?.root_cause || '');
  const [actionTaken, setActionTaken] = useState(initialItem?.reworkDraft?.action_taken || '');
  const [correctiveAction, setCorrectiveAction] = useState(initialItem?.reworkDraft?.corrective_action || '');
  const [verifStatus, setVerifStatus] = useState<VerificationStatus>(
    initialItem?.reworkDraft?.verification_status || 'Pending'
  );

  const [validationError, setValidationError] = useState('');

  // Handle Production Panel Selection Auto-Fill
  const handleSelectProductionPanel = (jcNo: string) => {
    setSelectedJobCardNo(jcNo);
    if (!jcNo) return;

    const jc = productionJobCards.find((c) => c.job_card_no === jcNo);
    if (jc) {
      setItemName(`${jc.product_name} (${jc.panel_type || 'Industrial Panel'})`);
      setSerialNo(jc.job_card_no);
      setClient(jc.customer_code || 'Internal Production');
      setCategory(jc.panel_type || 'Power Distribution Panel');
      setTeamVendor(jc.assemblyLine || 'Line 1');

      // Recommend In-Process QC if stage is 5 or 6, or Final QC if stage is 7+
      if (jc.current_stage_idx >= 7) {
        setStage('Final QC');
      } else if (jc.current_stage_idx >= 5) {
        setStage('In-Process QC');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setStage((initialItem.stage as QCStage) || 'Final QC');
        setItemName(initialItem.item_name || '');
        setCategory(initialItem.category || '');
        setInOut((initialItem.in_out as InOutType) || 'Indoor');
        setSerialNo(initialItem.serial_no || '');
        setSelectedJobCardNo(initialItem.job_card_no || initialItem.serial_no || '');
        setTeamVendor(initialItem.team_vendor || '');
        setClient(initialItem.client || '');
        setQty(initialItem.qty || 1);
        setDocs(initialItem.docs || 'Yes');
        setInspectionTime(initialItem.inspection_time || getLiveTimeString());
        setStatus(initialItem.status || 'Accepted');
        setRemarks(initialItem.remarks || '');
        setDefectStage(initialItem.reworkDraft?.stage || 'Wiring');
        setDefectQty(initialItem.reworkDraft?.qty || initialItem.qty || 1);
        setDefectReason(initialItem.reworkDraft?.reason || '');
        setRootCause(initialItem.reworkDraft?.root_cause || '');
        setActionTaken(initialItem.reworkDraft?.action_taken || '');
        setCorrectiveAction(initialItem.reworkDraft?.corrective_action || '');
        setVerifStatus(initialItem.reworkDraft?.verification_status || 'Pending');
      } else {
        setStage('Final QC');
        setItemName('');
        setCategory('');
        setInOut('Indoor');
        setSerialNo('');
        setSelectedJobCardNo('');
        setTeamVendor('');
        setClient('');
        setQty(1);
        setDocs('Yes');
        setInspectionTime(getLiveTimeString());
        setStatus('Accepted');
        setRemarks('');
        setCurrentStep(1);
        setDefectStage('Wiring');
        setDefectQty(1);
        setDefectReason('');
        setRootCause('');
        setActionTaken('');
        setCorrectiveAction('');
        setVerifStatus('Pending');
      }
      setValidationError('');
    }
  }, [isOpen, initialItem]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    if (!itemName.trim()) {
      setValidationError('Panel / Item name is required.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const validateStep2 = () => {
    if (!serialNo.trim()) {
      setValidationError('Serial number or Job Card identifier is required.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep === 3) {
      if (status === 'Rework' || status === 'Rejected') {
        setCurrentStep(4);
        return;
      } else {
        handleFinalSave();
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSave = () => {
    if (status !== 'Accepted') {
      if (!defectReason.trim()) {
        setValidationError('Defect reason is mandatory for Rework/Rejection.');
        return;
      }
    }

    const payload: QCItemForm = {
      id: initialItem?.id || `rec-${Date.now()}`,
      log_id: initialItem?.log_id || '',
      stage,
      item_name: itemName.trim(),
      category: category.trim(),
      in_out: inOut,
      serial_no: serialNo.trim(),
      job_card_no: selectedJobCardNo || serialNo.trim(),
      team_vendor: teamVendor.trim(),
      client: client.trim(),
      qty: Math.max(1, Number(qty) || 1),
      docs,
      inspection_time: inspectionTime,
      status,
      remarks: remarks.trim(),
    };

    if (status === 'Rework' || status === 'Rejected') {
      payload.reworkDraft = {
        item_name: itemName.trim(),
        team_vendor: teamVendor.trim(),
        stage: defectStage,
        defect_type: status === 'Rejected' ? 'Rejected' : 'Rework',
        qty: defectQty,
        reason: defectReason.trim(),
        root_cause: rootCause.trim(),
        action_taken: actionTaken.trim(),
        corrective_action: correctiveAction.trim(),
        verification_status: verifStatus,
        job_card_no: selectedJobCardNo || serialNo.trim(),
      };
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {initialItem ? 'Edit QC Item Inspection' : 'Log Shop Floor QC Inspection'}
              </h3>
              <p className="text-[11px] text-slate-500">Step {currentStep} of {status === 'Accepted' ? 3 : 4}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-1.5 pb-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === currentStep
                  ? 'bg-blue-600'
                  : s < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {validationError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: Panel & Stage */}
        {currentStep === 1 && (
          <div className="space-y-3 text-xs">
            {productionJobCards.length > 0 && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-blue-900 flex items-center space-x-1">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Link with Live Production Panel</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold font-mono">
                    {productionJobCards.length} Active Panels
                  </span>
                </div>
                <select
                  value={selectedJobCardNo}
                  onChange={(e) => handleSelectProductionPanel(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Manual Standalone Entry / Select Production Panel --</option>
                  {productionJobCards.map((jc) => (
                    <option key={jc.id} value={jc.job_card_no}>
                      {jc.job_card_no} — {jc.product_name} ({jc.current_stage})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspection Stage *</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Incoming QC', 'In-Process QC', 'Final QC'] as QCStage[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStage(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      stage === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Item / Panel Name *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. 415V MCC Panel, APFC Panel"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. PCC / MCC / VFD"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enclosure Type</label>
                <select
                  value={inOut}
                  onChange={(e) => setInOut(e.target.value as InOutType)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Indoor">Indoor Panel</option>
                  <option value="Outdoor">Outdoor Weatherproof</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Tracking & Client */}
        {currentStep === 2 && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Serial Number / Job Card No *</label>
              <input
                type="text"
                required
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="e.g. JC-2026-001 or SN-9844"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client / Project</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Tata Steel Ltd., Reliance"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assembly Line / Team / Vendor</label>
              <input
                type="text"
                value={teamVendor}
                onChange={(e) => setTeamVendor(e.target.value)}
                placeholder="e.g. Line 1, Wiring Team Alpha"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Docs Verified?</label>
                <select
                  value={docs}
                  onChange={(e) => setDocs(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Yes">Yes (Complete)</option>
                  <option value="No">No (Pending)</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection Time</label>
                <input
                  type="time"
                  value={inspectionTime}
                  onChange={(e) => setInspectionTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Verdict & Quantity */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Inspection Verdict *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Accepted')}
                  className={`py-3 px-2 rounded-2xl border-2 font-bold flex flex-col items-center space-y-1 transition ${
                    status === 'Accepted'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Accepted</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('Rework')}
                  className={`py-3 px-2 rounded-2xl border-2 font-bold flex flex-col items-center space-y-1 transition ${
                    status === 'Rework'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Rework</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('Rejected')}
                  className={`py-3 px-2 rounded-2xl border-2 font-bold flex flex-col items-center space-y-1 transition ${
                    status === 'Rejected'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <X className="w-5 h-5 text-rose-600" />
                  <span>Rejected</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspected Quantity</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspector Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter observation notes, test parameters, or checklist remarks..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Defect & Rework Logging (Only if Rework / Rejected) */}
        {currentStep === 4 && (
          <div className="space-y-3 text-xs animate-in fade-in">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Record Defect Details for Shop Floor Rectification</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Process Stage *</label>
                <select
                  value={defectStage}
                  onChange={(e) => setDefectStage(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Wiring">Wiring</option>
                  <option value="Fabrication">Fabrication</option>
                  <option value="Busbar">Busbar</option>
                  <option value="Switchgear">Switchgear</option>
                  <option value="Testing">Testing</option>
                  <option value="Powder Coating">Powder Coating</option>
                  <option value="Packing">Packing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Defect Qty</label>
                <input
                  type="number"
                  min="1"
                  value={defectQty}
                  onChange={(e) => setDefectQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Defect Reason / Failure Cause *</label>
              <textarea
                rows={2}
                required
                value={defectReason}
                onChange={(e) => setDefectReason(e.target.value)}
                placeholder="e.g. Ferrule missing on CT circuit, contactor coil loose connection..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Root Cause Analysis</label>
              <input
                type="text"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="e.g. Assembly rush, drawing discrepancy"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Immediate Action & Corrective Plan</label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g. Re-crimped lug and tightened with torque wrench"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : currentStep === 3 && (status === 'Rework' || status === 'Rejected') ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <span>Log Defect Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>Save QC Inspection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
