'use client';

import React, { useState, useEffect, useRef } from 'react';
import { JobCard, StageLog, PRODUCTION_STAGES, DELAY_REASONS } from '@/types';
import { stageLogService } from '@/services/stageLogService';
import { auditService } from '@/services/auditService';
import { useAuth } from '@/components/AuthContext';
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Flame,
  Check,
  Edit3
} from 'lucide-react';

interface FastStageWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCard | null;
  stages: StageLog[];
  onRefresh: () => void;
  initialStageIndex?: number;
}

export function FastStageWizardModal({
  isOpen,
  onClose,
  jobCard,
  stages,
  onRefresh,
  initialStageIndex = 0,
}: FastStageWizardModalProps) {
  const { currentUser, isAdmin, isFitter, isSupervisor } = useAuth();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [liveElapsed, setLiveElapsed] = useState<string>('00:00:00');

  // Form states for current stage
  const [operatorName, setOperatorName] = useState<string>('');
  const [delayReason, setDelayReason] = useState<string>('None');
  const [delayNotes, setDelayNotes] = useState<string>('');

  // Admin Override States
  const [isAdminOverrideOpen, setIsAdminOverrideOpen] = useState<boolean>(false);
  const [overrideStartDate, setOverrideStartDate] = useState<string>('');
  const [overrideStartTime, setOverrideStartTime] = useState<string>('');
  const [overrideEndDate, setOverrideEndDate] = useState<string>('');
  const [overrideEndTime, setOverrideEndTime] = useState<string>('');
  const [overrideHours, setOverrideHours] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Set default active step to the first incomplete stage when opened
  useEffect(() => {
    if (isOpen && stages.length > 0) {
      if (initialStageIndex !== undefined && initialStageIndex >= 0 && initialStageIndex < stages.length) {
        setActiveStepIndex(initialStageIndex);
      } else {
        const firstIncomplete = stages.findIndex((s) => s.status !== 'completed');
        setActiveStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      }
    }
    setStatusMessage(null);
  }, [isOpen, stages, initialStageIndex]);

  // Sync form inputs when step changes
  const currentStage = stages[activeStepIndex];
  useEffect(() => {
    if (currentStage) {
      setOperatorName(currentStage.operator_name || currentUser?.full_name || '');
      setDelayReason(currentStage.delay_reason || 'None');
      setDelayNotes(currentStage.delay_notes || '');

      setOverrideStartDate(currentStage.start_date || new Date().toISOString().substring(0, 10));
      setOverrideStartTime(currentStage.start_time ? currentStage.start_time.substring(0, 5) : '09:00');
      setOverrideEndDate(currentStage.end_date || new Date().toISOString().substring(0, 10));
      setOverrideEndTime(currentStage.end_time ? currentStage.end_time.substring(0, 5) : '15:00');
      setOverrideHours(currentStage.duration_hours ? String(currentStage.duration_hours) : '2.0');
      setOverrideReason('');
      setIsAdminOverrideOpen(false);
    }
  }, [activeStepIndex, currentStage, currentUser]);

  // Live stopwatch counter effect
  useEffect(() => {
    let interval: any = null;
    if (currentStage && currentStage.status === 'in_progress' && currentStage.started_at) {
      const updateTimer = () => {
        const start = new Date(currentStage.started_at!).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((now - start) / 1000));
        const hrs = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        setLiveElapsed(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setLiveElapsed('00:00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStage]);

  if (!isOpen || !jobCard || !currentStage) return null;

  const currentDef = PRODUCTION_STAGES[activeStepIndex] || {
    name: currentStage.stage_name,
    description: '',
    standardDurationHrs: 2,
  };

  // Handler: Start Stage (Auto records start time)
  const handleStartStage = async () => {
    if (!operatorName.trim()) {
      setStatusMessage({ text: 'Please enter operator name before starting stage.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await stageLogService.startStage(
        currentStage.id,
        jobCard.id,
        activeStepIndex,
        operatorName.trim()
      );

      await auditService.logAudit({
        job_card_no: jobCard.job_card_no,
        action: `Started Stage: ${currentStage.stage_name}`,
        actor_name: currentUser?.full_name || operatorName.trim(),
        actor_role: currentUser?.role || 'fitter',
        details: `Operator: ${operatorName.trim()} | Line: ${jobCard.assemblyLine}`,
      });

      setStatusMessage({ text: `Stage "${currentStage.stage_name}" started! Live timer active.`, type: 'success' });
      onRefresh();
    } catch (e: any) {
      console.error('Error starting stage', e);
      setStatusMessage({ text: 'Failed to start stage. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Complete Stage & Advance to Next (Auto records end time)
  const handleCompleteAndNext = async () => {
    if (!operatorName.trim()) {
      setStatusMessage({ text: 'Operator name is mandatory before completing stage.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await stageLogService.completeStage(
        currentStage.id,
        jobCard.id,
        activeStepIndex,
        {
          operatorName: operatorName.trim(),
          delayReason,
          delayNotes,
        }
      );

      await auditService.logAudit({
        job_card_no: jobCard.job_card_no,
        action: `Completed Stage: ${currentStage.stage_name}`,
        actor_name: currentUser?.full_name || operatorName.trim(),
        actor_role: currentUser?.role || 'supervisor',
        details: `Duration: ${res.updatedStage.duration_display} | Delay: ${delayReason}`,
      });

      setStatusMessage({ text: `Stage completed! Advanced to next stage.`, type: 'success' });
      onRefresh();

      if (!res.isAllComplete && activeStepIndex < PRODUCTION_STAGES.length - 1) {
        setActiveStepIndex(activeStepIndex + 1);
      } else {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      console.error('Error completing stage', e);
      setStatusMessage({ text: 'Failed to complete stage. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Admin Override Timestamps
  const handleAdminOverrideSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setStatusMessage({ text: 'Only Admins are authorized to override recorded timestamps.', type: 'error' });
      return;
    }
    if (!overrideReason.trim()) {
      setStatusMessage({ text: 'Mandatory override justification required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await stageLogService.adminOverrideStage(currentStage.id, {
        startDate: overrideStartDate,
        startTime: overrideStartTime,
        endDate: overrideEndDate,
        endTime: overrideEndTime,
        durationHours: parseFloat(overrideHours) || 1.0,
        operatorName: operatorName.trim() || 'Admin Override',
        delayReason,
        adminName: currentUser?.full_name || 'System Admin',
        reason: overrideReason.trim(),
      });

      await auditService.logAudit({
        job_card_no: jobCard.job_card_no,
        action: `Admin Override: ${currentStage.stage_name}`,
        actor_name: currentUser?.full_name || 'Admin',
        actor_role: 'admin',
        details: `Reason: ${overrideReason.trim()} | Set Times: ${overrideStartDate} ${overrideStartTime} -> ${overrideEndDate} ${overrideEndTime}`,
      });

      setStatusMessage({ text: 'Admin timestamp override applied successfully.', type: 'success' });
      setIsAdminOverrideOpen(false);
      onRefresh();
    } catch (e) {
      console.error('Error overriding stage', e);
      setStatusMessage({ text: 'Failed to apply admin override.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl my-auto max-h-[96vh] flex flex-col space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {jobCard.job_card_no}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {jobCard.assemblyLine}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-tight">
              {jobCard.product_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Toast inside Wizard */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Process Stepper Navigation Tabs (Mobile Touch Friendly) */}
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs overflow-x-auto space-x-1.5 scrollbar-none">
          {PRODUCTION_STAGES.map((s, idx) => {
            const st = stages[idx];
            const isDone = st?.status === 'completed';
            const isCurrent = idx === activeStepIndex;
            const isRunning = st?.status === 'in_progress';

            return (
              <button
                key={idx}
                onClick={() => setActiveStepIndex(idx)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : isRunning
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{idx + 1}</span>
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                {isRunning && <Flame className="w-3 h-3 fill-amber-500" />}
              </button>
            );
          })}
        </div>

        {/* Active Stage Heading & Live Time Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Stage {activeStepIndex + 1} of {PRODUCTION_STAGES.length}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {currentStage.stage_name}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">{currentDef.description}</p>
          </div>

          {/* Live Stopwatch / Recorded Duration */}
          <div className="flex items-center space-x-3 bg-white px-3.5 py-2.5 rounded-xl border border-blue-200 shadow-sm shrink-0">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {currentStage.status === 'in_progress'
                  ? 'Live Working Time'
                  : currentStage.status === 'completed'
                  ? 'Total Time Recorded'
                  : 'Std. Target Time'}
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-slate-900 leading-none mt-0.5">
                {currentStage.status === 'in_progress' ? (
                  <span className="text-amber-600 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1.5 inline-block"></span>
                    {liveElapsed}
                  </span>
                ) : currentStage.status === 'completed' ? (
                  <span className="text-emerald-700 font-mono">
                    {currentStage.duration_display || `${currentStage.duration_hours || 1.5}h`}
                  </span>
                ) : (
                  <span className="text-slate-500">{currentDef.standardDurationHrs}.0h</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Form Area */}
        <div className="flex-1 overflow-y-auto space-y-4 py-1 pr-1">
          {/* Operator and Delay Reason (Rapid Input) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fitter / Operator Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Ramesh K. or Suresh P."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delay Factor / Bottleneck
              </label>
              <select
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {DELAY_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {delayReason !== 'None' && (
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                Delay Explanation & Corrective Action
              </label>
              <textarea
                rows={2}
                value={delayNotes}
                onChange={(e) => setDelayNotes(e.target.value)}
                placeholder="Explain reason for delay..."
                className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Timestamps Card (Auto-recorded by system) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Recorded Production Timestamps</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentStage.is_admin_override ? '(Admin Override Applied)' : '(Auto Clock Generated)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600 font-mono pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Started At</span>
                <span className="font-bold text-slate-800">
                  {currentStage.start_date
                    ? `${currentStage.start_date} ${currentStage.start_time || ''}`
                    : 'Not started yet'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Completed At</span>
                <span className="font-bold text-slate-800">
                  {currentStage.end_date
                    ? `${currentStage.end_date} ${currentStage.end_time || ''}`
                    : 'In progress'}
                </span>
              </div>
            </div>

            {/* Admin Override Toggle (Only Admin can modify recorded timestamps) */}
            {isAdmin ? (
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsAdminOverrideOpen(!isAdminOverrideOpen)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isAdminOverrideOpen ? 'Close Override Form' : 'Admin Override Timestamps'}</span>
                </button>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Admin Privileged
                </span>
              </div>
            ) : (
              <div className="pt-1.5 text-[11px] text-slate-500 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>Timestamps auto-locked. Only Admin can modify historical records.</span>
              </div>
            )}
          </div>

          {/* Admin Override Form Modal Expansion */}
          {isAdmin && isAdminOverrideOpen && (
            <form
              onSubmit={handleAdminOverrideSave}
              className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150"
            >
              <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Admin Override: Adjust Date & Time Manually</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Start Date & Time</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={overrideStartDate}
                      onChange={(e) => setOverrideStartDate(e.target.value)}
                      className="bg-white border rounded p-1.5 text-xs"
                    />
                    <input
                      type="time"
                      value={overrideStartTime}
                      onChange={(e) => setOverrideStartTime(e.target.value)}
                      className="bg-white border rounded p-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">End Date & Time</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={overrideEndDate}
                      onChange={(e) => setOverrideEndDate(e.target.value)}
                      className="bg-white border rounded p-1.5 text-xs"
                    />
                    <input
                      type="time"
                      value={overrideEndTime}
                      onChange={(e) => setOverrideEndTime(e.target.value)}
                      className="bg-white border rounded p-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={overrideHours}
                    onChange={(e) => setOverrideHours(e.target.value)}
                    className="w-full bg-white border rounded p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Override Justification (Required) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Reason for timestamp correction..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full bg-white border rounded p-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdminOverrideOpen(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow"
                >
                  Save Timestamp Override
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Wizard Footer Action Buttons ("Next Next" rapid data flow) */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={activeStepIndex === PRODUCTION_STAGES.length - 1}
              onClick={() => setActiveStepIndex(Math.min(PRODUCTION_STAGES.length - 1, activeStepIndex + 1))}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition flex items-center space-x-1"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Action Button (Start or Complete & Next) */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {currentStage.status === 'pending' ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStartStage}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>▶ Start Stage (Auto Clock)</span>
              </button>
            ) : currentStage.status === 'in_progress' ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteAndNext}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {activeStepIndex === PRODUCTION_STAGES.length - 1
                    ? '✓ Finish & Dispatch Panel'
                    : '✓ Complete & Next Stage ➔'}
                </span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Stage Completed</span>
                </span>
                {activeStepIndex < PRODUCTION_STAGES.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStepIndex(activeStepIndex + 1)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition flex items-center space-x-1"
                  >
                    <span>Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
