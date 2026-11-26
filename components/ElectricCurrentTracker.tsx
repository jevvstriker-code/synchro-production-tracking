'use client';

import React, { useState, useEffect } from 'react';
import { JobCard, StageLog, PRODUCTION_STAGES } from '@/types';
import { jobCardService } from '@/services/jobCardService';
import { useAuth } from '@/components/AuthContext';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Flame,
  Check,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';

interface ElectricCurrentTrackerProps {
  jobCard: JobCard;
  onOpenWizard: (jcNo: string) => void;
  onOpenReport?: (card: JobCard) => void;
  onRefresh?: () => void;
}

export function ElectricCurrentTracker({
  jobCard,
  onOpenWizard,
  onOpenReport,
  onRefresh,
}: ElectricCurrentTrackerProps) {
  const { isLoggedIn, isFitter, isSupervisor, isAdmin } = useAuth();
  const [stages, setStages] = useState<StageLog[]>([]);
  const [activeNodeIdx, setActiveNodeIdx] = useState<number | null>(null);
  const [liveElapsed, setLiveElapsed] = useState<string>('00:00:00');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load stages for this panel
  useEffect(() => {
    let isMounted = true;
    const fetchStages = async () => {
      try {
        const res = await jobCardService.getJobCardWithStages(jobCard.job_card_no);
        if (isMounted && res) {
          setStages(res.stages);
        }
      } catch (err) {
        console.error('Failed to load stages for tracker:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchStages();
    return () => {
      isMounted = false;
    };
  }, [jobCard.job_card_no]);

  // Current active stage
  const currentStageIdx = jobCard.current_stage_idx || 0;
  const isCompleted = jobCard.status === 'completed' || jobCard.status === 'dispatched';
  const isDelayed = jobCard.status === 'delayed';

  // Live stopwatch for active in-progress stage
  useEffect(() => {
    let interval: any = null;
    const runningStage = stages.find((s) => s.status === 'in_progress');

    if (runningStage && runningStage.started_at && !isCompleted) {
      const updateTimer = () => {
        const start = new Date(runningStage.started_at!).getTime();
        const diffSecs = Math.max(0, Math.floor((Date.now() - start) / 1000));
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
  }, [stages, isCompleted]);

  // Calculate power percentage (0% to 100%)
  const powerPercentage = isCompleted
    ? 100
    : Math.min(
        95,
        Math.max(
          5,
          Math.round((currentStageIdx / (PRODUCTION_STAGES.length - 1)) * 100)
        )
      );

  // Short stage acronyms for compact busbar labels
  const stageShortTitles = [
    'Material',
    'Fabric.',
    'Sw.Gear',
    'Busbar',
    'Wiring',
    'Isol.',
    'Testing',
    'Label',
    'Packing',
    'Confirm',
    'Dispatch',
  ];

  const selectedStageData =
    activeNodeIdx !== null
      ? stages.find((s) => s.stage_index === activeNodeIdx) || null
      : null;

  const selectedStageDef =
    activeNodeIdx !== null ? PRODUCTION_STAGES[activeNodeIdx] : null;

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs text-slate-800 space-y-4 overflow-hidden relative">
      {/* Decorative High-Voltage Header Border Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-90"></div>

      {/* 1. Header: Voltage & Power Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs transition-all ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                : isDelayed
                ? 'bg-amber-100 text-amber-600 border border-amber-200'
                : 'bg-blue-100 text-blue-600 border border-blue-200'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-mono">
                {isCompleted
                  ? '⚡ 415V 3-PHASE • FULL POWER ENERGIZED'
                  : isDelayed
                  ? '⚠️ IMPEDANCE SURGE • HIGH RESISTANCE'
                  : '⚡ LIVE POWER CONDUIT • CURRENT ACTIVE'}
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isDelayed
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {powerPercentage}% POWER
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mt-0.5">
              <span>{isCompleted ? 'Panel Dispatched & Energized' : `Stage ${currentStageIdx + 1}: ${jobCard.current_stage}`}</span>
              {!isCompleted && liveElapsed !== '00:00:00' && (
                <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                  <span>{liveElapsed}</span>
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {onOpenReport && (
            <button
              onClick={() => onOpenReport(jobCard)}
              className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-slate-200 shadow-2xs"
              title="Print Route Sheet Dossier"
            >
              Dossier
            </button>
          )}

          <button
            onClick={() => onOpenWizard(jobCard.job_card_no)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition flex items-center space-x-1"
          >
            <span>Update Stage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Electricity Busbar Conduit Rail (Scrollable on small mobile) */}
      <div className="overflow-x-auto scrollbar-none pb-2 pt-4 px-1">
        <div className="min-w-[620px] relative px-4">
          {/* Base Unpowered Conduit Track */}
          <div className="h-2.5 bg-slate-200 rounded-full w-full relative overflow-visible border border-slate-300/80">
            {/* Active Electricity Current Running Line */}
            <div
              className={`h-full rounded-full transition-all duration-700 relative ${
                isCompleted
                  ? 'bg-emerald-500 shadow-xs'
                  : isDelayed
                  ? 'bg-amber-500 shadow-xs'
                  : 'bg-blue-600 shadow-xs'
              }`}
              style={{ width: `${powerPercentage}%` }}
            >
              {/* Electric Current Front Spark Beam */}
              {!isCompleted && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full blur-[1px] animate-ping opacity-75"></div>
              )}
            </div>
          </div>

          {/* 11 Electrical Contact Nodes */}
          <div className="flex justify-between items-center relative -top-[19px]">
            {PRODUCTION_STAGES.map((stage, idx) => {
              const isPast = isCompleted || idx < currentStageIdx;
              const isCurrent = !isCompleted && idx === currentStageIdx;
              const isPending = !isCompleted && idx > currentStageIdx;
              const isNodeSelected = activeNodeIdx === idx;
              const stageData = stages.find((s) => s.stage_index === idx);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center group relative cursor-pointer"
                  onClick={() => setActiveNodeIdx(activeNodeIdx === idx ? null : idx)}
                >
                  {/* The Contact Pad / Power Node */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-mono text-[10px] font-black transition-all transform duration-300 ${
                      isPast
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                        : isCurrent
                        ? isDelayed
                          ? 'bg-amber-500 border-amber-400 text-white shadow-md scale-110 ring-2 ring-amber-200'
                          : 'bg-blue-600 border-blue-400 text-white shadow-md scale-110 ring-2 ring-blue-200'
                        : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 shadow-2xs'
                    } ${isNodeSelected ? 'ring-2 ring-blue-500 scale-115' : ''}`}
                    title={`${idx + 1}. ${stage.name}`}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`text-[9px] mt-1.5 font-semibold text-center tracking-tight transition-colors ${
                      isPast
                        ? 'text-emerald-700'
                        : isCurrent
                        ? isDelayed
                          ? 'text-amber-700 font-bold'
                          : 'text-blue-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stageShortTitles[idx]}
                  </span>

                  {/* Duration pill under node */}
                  {stageData?.duration_hours && Number(stageData.duration_hours) > 0 ? (
                    <span className="text-[8px] font-mono text-slate-500 mt-0.5">
                      {Number(stageData.duration_hours).toFixed(1)}h
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[8px] font-mono text-blue-600 font-bold mt-0.5">
                      Live
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Inline Quick Stage Inspector (Shows on node tap without opening window) */}
      {selectedStageDef && activeNodeIdx !== null && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-xs animate-in fade-in duration-200 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-blue-600 font-bold">
                Stage {activeNodeIdx + 1}:
              </span>
              <strong className="text-slate-900 text-xs">{selectedStageDef.name}</strong>
              <span className="text-[10px] text-slate-400">
                (Std Target: {selectedStageDef.standardDurationHrs}h)
              </span>
            </div>

            <button
              onClick={() => setActiveNodeIdx(null)}
              className="text-[10px] text-slate-400 hover:text-slate-700 underline"
            >
              Close Info
            </button>
          </div>

          <p className="text-[11px] text-slate-600">{selectedStageDef.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-slate-500">
            <div>
              <span>Status:</span>{' '}
              <strong
                className={
                  selectedStageData?.status === 'completed'
                    ? 'text-emerald-600 font-bold'
                    : selectedStageData?.status === 'in_progress'
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500'
                }
              >
                {selectedStageData?.status || (activeNodeIdx < currentStageIdx ? 'completed' : 'pending')}
              </strong>
            </div>
            <div>
              <span>Operator:</span>{' '}
              <strong className="text-slate-800">
                {selectedStageData?.operator_name || 'Floor Team'}
              </strong>
            </div>
            <div>
              <span>Duration:</span>{' '}
              <strong className="text-slate-800">
                {selectedStageData?.duration_display ||
                  (selectedStageData?.duration_hours
                    ? `${selectedStageData.duration_hours}h`
                    : '—')}
              </strong>
            </div>
            <div>
              <span>Bottleneck:</span>{' '}
              <strong
                className={
                  selectedStageData?.delay_reason && selectedStageData.delay_reason !== 'None'
                    ? 'text-amber-600 font-bold'
                    : 'text-slate-400'
                }
              >
                {selectedStageData?.delay_reason || 'None'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Power Conduit Footnote */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
        <div className="flex items-center space-x-3">
          <span>
            Supervisor: <strong className="text-slate-700">{jobCard.supervisor_name}</strong>
          </span>
          <span>•</span>
          <span>
            PPC: <strong className="text-slate-700">{jobCard.ppc_name}</strong>
          </span>
          <span>•</span>
          <span>
            Type: <strong className="text-slate-700">{jobCard.panel_type}</strong>
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
          <Info className="w-3 h-3 text-blue-500" />
          <span>Click any contact node to inspect stage details inline</span>
        </div>
      </div>
    </div>
  );
}
