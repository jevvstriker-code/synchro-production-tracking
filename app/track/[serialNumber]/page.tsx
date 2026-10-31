'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { jobCardService } from '@/services/jobCardService';
import { JobCard, StageLog, PRODUCTION_STAGES } from '@/types';
import { useAuth } from '@/components/AuthContext';
import { FastStageWizardModal } from '@/components/FastStageWizardModal';
import { LoginModal } from '@/components/LoginModal';
import { PrintablePanelReportModal } from '@/components/PrintablePanelReportModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Flame,
  User,
  ShieldCheck,
  ChevronRight,
  BarChart2,
  Lock,
  Layers,
  ArrowLeft,
  Share2,
  Send,
  Check,
  Printer
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TrackPanelPage({
  params,
}: {
  params: Promise<{ serialNumber: string }>;
}) {
  const resolvedParams = use(params);
  const serialNumber = decodeURIComponent(resolvedParams.serialNumber);

  const { currentUser, isLoggedIn, isFitter, isSupervisor, isAdmin } = useAuth();
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [stages, setStages] = useState<StageLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveElapsed, setLiveElapsed] = useState<string>('00:00:00');
  const [graphViewMode, setGraphViewMode] = useState<'bars' | 'chart'>('chart');

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadPanelData();
  }, [serialNumber]);

  const loadPanelData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await jobCardService.getJobCardWithStages(serialNumber);
      if (res) {
        setJobCard(res.jobCard);
        setStages(res.stages);
      } else {
        setErrorMsg(`Job Card "${serialNumber}" not found in database.`);
      }
    } catch (e) {
      console.error('Error fetching panel data:', e);
      setErrorMsg('Failed to load live tracking details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Find active stage
  const activeStage = stages.find((s) => s.status === 'in_progress') || stages.find((s) => s.status === 'pending');

  // Live timer for currently active stage
  useEffect(() => {
    let interval: any = null;
    const currentRunning = stages.find((s) => s.status === 'in_progress');
    if (currentRunning && currentRunning.started_at) {
      const updateTimer = () => {
        const start = new Date(currentRunning.started_at!).getTime();
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
  }, [stages]);

  const handleUpdateClick = () => {
    if (isLoggedIn) {
      setIsWizardOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsWizardOpen(true);
  };

  const handleShareWhatsApp = () => {
    if (!jobCard) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = encodeURIComponent(
      `*Synchro Electricals Live Tracking - ${jobCard.job_card_no}*\nProduct: ${jobCard.product_name}\nLine: ${jobCard.assemblyLine}\nCurrent Stage: ${jobCard.current_stage}\nTrack: ${origin}/track/${jobCard.job_card_no}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Connecting to Live Panel Sensor & Database...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !jobCard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Panel Not Found</h2>
          <p className="text-xs text-slate-500">{errorMsg || 'Invalid Job Card Serial Number scanned.'}</p>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Production App</span>
          </Link>
        </div>
      </div>
    );
  }

  const completedStagesCount = stages.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completedStagesCount / PRODUCTION_STAGES.length) * 100);

  // Chart Data: Actual vs Target Duration per stage
  const chartLabels = PRODUCTION_STAGES.map((s, i) => `${i + 1}. ${s.name}`);
  const targetDurations = PRODUCTION_STAGES.map((s) => s.standardDurationHrs);
  const actualDurations = stages.map((st) => Number(st.duration_hours || (st.status === 'completed' ? 1.5 : 0)));

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Actual Hours Taken',
        data: actualDurations,
        backgroundColor: '#2563eb',
        borderRadius: 4,
      },
      {
        label: 'Standard Target (Hrs)',
        data: targetDurations,
        backgroundColor: '#cbd5e1',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 10 } },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { font: { size: 10 }, stepSize: 1 },
        grid: { color: '#f1f5f9' },
      },
      y: {
        ticks: { font: { size: 9 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Background Screen View (Hidden when printing dossier) */}
      <div className="print:hidden flex flex-col flex-1">
        {/* Top Header */}
        <header className="bg-blue-600 text-white px-4 py-3.5 shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-blue-100 transition">
            <div className="bg-white p-1.5 rounded-lg text-blue-600 shadow-sm flex items-center justify-center w-8 h-8">
              <Zap className="w-5 h-5 fill-blue-600 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">Synchro Electricals</h1>
              <p className="text-[10px] text-blue-200">Public Live Tracking</p>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition flex items-center space-x-1"
              title="Print Official Panel Dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-1.5 bg-blue-700 hover:bg-blue-800 rounded-lg text-white transition"
              title="Share on WhatsApp"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpdateClick}
              className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
            >
              {isLoggedIn ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Update Stage</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fitter Login & Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        {/* Panel Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {jobCard.job_card_no}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded">
                  {jobCard.assemblyLine}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {jobCard.panel_type}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
                {jobCard.product_name}
              </h2>
            </div>

            {/* Overall Progress Indicator */}
            <div className="sm:text-right shrink-0">
              <div className="text-xs text-slate-500 font-medium">Production Progress</div>
              <div className="text-2xl font-extrabold text-blue-600 font-mono">{progressPct}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>

          {/* Current Stage & Live Clock Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Current Workstation Stage
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {jobCard.current_stage}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Step {jobCard.current_stage_idx + 1} of {PRODUCTION_STAGES.length}
              </p>
            </div>

            {/* Live Timer if In Progress */}
            {activeStage?.status === 'in_progress' ? (
              <div className="bg-white border border-amber-300 px-4 py-2 rounded-xl shadow-xs flex items-center space-x-3 shrink-0">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Live Stage Duration</div>
                  <div className="text-lg font-bold font-mono text-amber-600 leading-none mt-0.5">
                    {liveElapsed}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs text-xs text-slate-600 shrink-0">
                Status: <strong className="capitalize text-blue-700">{jobCard.status.replace('_', ' ')}</strong>
              </div>
            )}
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Customer Code</span>
              <span className="font-semibold text-slate-800">{jobCard.customer_code || 'Direct Customer'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Production Started</span>
              <span className="font-semibold text-slate-800">{jobCard.production_start_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Production Supervisor</span>
              <span className="font-semibold text-slate-800">{jobCard.supervisor_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">PPC In-Charge</span>
              <span className="font-semibold text-slate-800">{jobCard.ppc_name}</span>
            </div>
          </div>
        </div>

        {/* Total Process Time Graph (How much time each process took) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  Total Process Graph (Time Consumed Per Stage)
                </h3>
                <p className="text-xs text-slate-500">
                  Visual graph of actual hours logged vs target hours for each manufacturing step
                </p>
              </div>
            </div>

            {/* Toggle view mode */}
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGraphViewMode('chart')}
                className={`px-3 py-1 rounded-lg transition ${
                  graphViewMode === 'chart' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Chart
              </button>
              <button
                type="button"
                onClick={() => setGraphViewMode('bars')}
                className={`px-3 py-1 rounded-lg transition ${
                  graphViewMode === 'bars' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                List Bars
              </button>
            </div>
          </div>

          {/* View Mode 1: Interactive Chart.js Horizontal Bar Chart */}
          {graphViewMode === 'chart' ? (
            <div className="relative w-full h-80 sm:h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            /* View Mode 2: Detailed Progress List Bars */
            <div className="space-y-2.5 pt-1">
              {stages.map((st, idx) => {
                const hrs = st.duration_hours || (st.status === 'completed' ? 1.5 : 0);
                const maxHrs = 6.0;
                const barPct = Math.min(100, Math.max(5, (hrs / maxHrs) * 100));
                const isCurrent = st.stage_index === jobCard.current_stage_idx;

                return (
                  <div key={st.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800 flex items-center space-x-1.5">
                        <span className="font-mono text-slate-400 text-[11px]">{idx + 1}.</span>
                        <span className={isCurrent ? 'font-bold text-blue-600' : ''}>{st.stage_name}</span>
                        {st.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {st.status === 'in_progress' && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {st.status === 'completed' ? (
                          st.duration_display || `${hrs.toFixed(1)}h`
                        ) : st.status === 'in_progress' ? (
                          <span className="text-amber-600">Active ({liveElapsed})</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          st.status === 'completed'
                            ? 'bg-blue-600'
                            : st.status === 'in_progress'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-transparent'
                        }`}
                        style={{ width: st.status === 'pending' ? '0%' : `${barPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 11 Stages Timeline & Sign-off Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>11 Industrial Production Stages Audit</span>
            </h3>
            <span className="text-xs text-slate-400">Shop Floor Log</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[650px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">End Time</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Fitter / Operator</th>
                  <th className="py-2.5 px-3">Delay Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stages.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {idx + 1}. {st.stage_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {st.start_date ? `${st.start_date} ${st.start_time || ''}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {st.end_date ? `${st.end_date} ${st.end_time || ''}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {st.duration_display || (st.duration_hours ? `${st.duration_hours}h` : '—')}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {st.operator_name || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {st.delay_reason && st.delay_reason !== 'None' ? (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {st.delay_reason}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating / Sticky Mobile Update Button */}
        <div className="sticky bottom-4 z-20">
          <button
            onClick={handleUpdateClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition transform active:scale-98"
          >
            {isLoggedIn ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span>Launch Stage Update Wizard ➔</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-blue-200" />
                <span>Authorize Fitter / Supervisor to Update Status</span>
              </>
            )}
          </button>
        </div>
      </main>
      </div>

      {/* Fast Stage Wizard Modal */}
      <FastStageWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        jobCard={jobCard}
        stages={stages}
        onRefresh={loadPanelData}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        message="Please log in with your Fitter/Supervisor PIN or credentials to update this panel's stage."
      />

      {/* Official Panel Report Modal */}
      <PrintablePanelReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        jobCard={jobCard}
      />
    </div>
  );
}
