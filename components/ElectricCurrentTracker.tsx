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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg text-white space-y-4 overflow-hidden relative">
      {/* Decorative High-Voltage Warning Border Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-80"></div>

      {/* 1. Header: Voltage & Power Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 spark-indicator'
                : isDelayed
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-blue-500/20 text-cyan-400 border border-cyan-500/50 spark-indicator'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 font-mono">
                {isCompleted
                  ? '⚡ 415V 3-PHASE • FULL POWER ENERGIZED'
                  : isDelayed
                  ? '⚠️ IMPEDANCE SURGE • HIGH RESISTANCE'
                  : '⚡ LIVE POWER CONDUIT • CURRENT ACTIVE'}
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${
                  isCompleted
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                    : isDelayed
                    ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                }`}
              >
                {powerPercentage}% POWER
              </span>
            </div>

            <h4 className="text-sm font-bold text-white flex items-center space-x-2 mt-0.5">
              <span>{isCompleted ? 'Panel Dispatched & Energized' : `Stage ${currentStageIdx + 1}: ${jobCard.current_stage}`}</span>
              {!isCompleted && liveElapsed !== '00:00:00' && (
                <span className="text-xs font-mono font-normal text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-400 animate-spin" />
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
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border border-slate-700"
              title="Print Route Sheet Dossier"
            >
              Dossier
            </button>
          )}

          <button
            onClick={() => onOpenWizard(jobCard.job_card_no)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition flex items-center space-x-1"
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
          <div className="h-2.5 bg-slate-800 rounded-full w-full relative overflow-visible border border-slate-700/60">
            {/* Active Electricity Current Running Line */}
            <div
              className={`h-full rounded-full transition-all duration-700 relative ${
                isCompleted
                  ? 'electric-full-power'
                  : isDelayed
                  ? 'electric-delayed'
                  : 'electric-current-flow'
              }`}
              style={{ width: `${powerPercentage}%` }}
            >
              {/* Electric Current Front Spark Beam */}
              {!isCompleted && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-cyan-300 rounded-full blur-[2px] animate-ping opacity-75"></div>
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
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                        : isCurrent
                        ? isDelayed
                          ? 'bg-amber-600 border-amber-300 text-white electric-pulse-node shadow-[0_0_12px_rgba(245,158,11,0.9)] scale-110'
                          : 'bg-blue-600 border-cyan-300 text-white electric-pulse-node shadow-[0_0_14px_rgba(0,240,255,0.9)] scale-110'
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                    } ${isNodeSelected ? 'ring-2 ring-white scale-115' : ''}`}
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
                        ? 'text-emerald-400'
                        : isCurrent
                        ? isDelayed
                          ? 'text-amber-300 font-bold'
                          : 'text-cyan-300 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {stageShortTitles[idx]}
                  </span>

                  {/* Duration pill under node */}
                  {stageData?.duration_hours && Number(stageData.duration_hours) > 0 ? (
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">
                      {Number(stageData.duration_hours).toFixed(1)}h
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[8px] font-mono text-cyan-400 font-bold mt-0.5">
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
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs animate-in fade-in duration-200 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-cyan-400 font-bold">
                Stage {activeNodeIdx + 1}:
              </span>
              <strong className="text-white text-xs">{selectedStageDef.name}</strong>
              <span className="text-[10px] text-slate-400">
                (Std Target: {selectedStageDef.standardDurationHrs}h)
              </span>
            </div>

            <button
              onClick={() => setActiveNodeIdx(null)}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Close Info
            </button>
          </div>

          <p className="text-[11px] text-slate-300">{selectedStageDef.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-slate-400">
            <div>
              <span>Status:</span>{' '}
              <strong
                className={
                  selectedStageData?.status === 'completed'
                    ? 'text-emerald-400'
                    : selectedStageData?.status === 'in_progress'
                    ? 'text-cyan-400'
                    : 'text-slate-500'
                }
              >
                {selectedStageData?.status || (activeNodeIdx < currentStageIdx ? 'completed' : 'pending')}
              </strong>
            </div>
            <div>
              <span>Operator:</span>{' '}
              <strong className="text-slate-200">
                {selectedStageData?.operator_name || 'Floor Team'}
              </strong>
            </div>
            <div>
              <span>Duration:</span>{' '}
              <strong className="text-slate-200">
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
                    ? 'text-amber-400'
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
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span>
            Supervisor: <strong className="text-slate-200">{jobCard.supervisor_name}</strong>
          </span>
          <span>•</span>
          <span>
            PPC: <strong className="text-slate-200">{jobCard.ppc_name}</strong>
          </span>
          <span>•</span>
          <span>
            Type: <strong className="text-slate-200">{jobCard.panel_type}</strong>
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-slate-500">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Click any contact node to inspect stage details inline</span>
        </div>
      </div>
    </div>
  );
}
