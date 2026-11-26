'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { AlertTriangle, TrendingUp, Layers } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardChartsProps {
  delayCauses: { [reason: string]: number };
  stageVelocity: { stageName: string; completedCount: number }[];
  lineBreakdown: {
    lineName: string;
    total: number;
    active: number;
    completed: number;
    delays: number;
    efficiency: number;
  }[];
  onSelectLine: (lineName: string) => void;
}

export function DashboardCharts({
  delayCauses,
  stageVelocity,
  lineBreakdown,
  onSelectLine,
}: DashboardChartsProps) {
  // 1. Delay Reasons Chart Data
  const delayLabels = Object.keys(delayCauses);
  const delayValues = Object.values(delayCauses);

  const delayChartData = {
    labels: delayLabels.length > 0 ? delayLabels : ['No Delays Logged'],
    datasets: [
      {
        label: 'Delay Occurrences',
        data: delayValues.length > 0 ? delayValues : [0],
        backgroundColor: '#06b6d4',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#22d3ee',
        hoverBackgroundColor: '#38bdf8',
      },
    ],
  };

  const delayChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#06b6d4',
        borderWidth: 1,
        titleFont: { size: 12, family: 'monospace' },
        bodyFont: { size: 11, family: 'monospace' },
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 10, family: 'monospace' }, stepSize: 1 },
        grid: { color: 'rgba(51, 65, 85, 0.35)' },
      },
      x: {
        ticks: {
          color: '#94a3b8',
          font: { size: 9, family: 'monospace' },
          maxRotation: 25,
          minRotation: 25,
        },
        grid: { display: false },
      },
    },
  };

  // 2. Stage Velocity Line Chart Data
  const velocityLabels = stageVelocity.map((s) => s.stageName.split(' ')[0] + ' ' + (s.stageName.split(' ')[1] || ''));
  const velocityValues = stageVelocity.map((s) => s.completedCount);

  const velocityChartData = {
    labels: velocityLabels,
    datasets: [
      {
        label: 'Completed Panels',
        data: velocityValues,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(6, 182, 212, 0.18)',
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4.5,
        pointHoverRadius: 7,
      },
    ],
  };

  const velocityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#06b6d4',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', font: { size: 10, family: 'monospace' }, stepSize: 1 },
        grid: { color: 'rgba(51, 65, 85, 0.35)' },
      },
      x: {
        ticks: {
          color: '#94a3b8',
          font: { size: 9, family: 'monospace' },
          maxRotation: 25,
          minRotation: 25,
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Assembly Lines 1 to 7 Status Bar Grid */}
      <div className="cyber-card rounded-2xl p-4 sm:p-5 shadow-lg border border-cyan-500/25">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Assembly Lines Telemetry &amp; Velocity</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  LINES 1–7 ACTIVE
                </span>
              </h2>
              <p className="text-[11px] text-cyan-300/70 font-mono">Live shop floor throughput &amp; line workload distribution</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">SELECT LINE TO FILTER</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {lineBreakdown.map((line, idx) => (
            <div
              key={line.lineName}
              onClick={() => onSelectLine(line.lineName)}
              className="bg-slate-950/70 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-400/60 p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-sm group hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition font-mono">
                  LINE {idx + 1}
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded-md font-mono font-bold">
                  {line.total}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                <span>Act: <strong className="text-cyan-300">{line.active}</strong></span>
                <span>Done: <strong className="text-emerald-400">{line.completed}</strong></span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  style={{ width: `${line.efficiency}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-cyan-400/70 mt-1 text-right font-mono font-medium">
                {line.efficiency}% eff.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Analytics Charts: Bottlenecks & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Production Bottlenecks Chart */}
        <div className="cyber-card rounded-2xl p-4 sm:p-5 shadow-lg border border-cyan-500/25 flex flex-col">
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Delay &amp; Bottleneck Analytics
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3 font-mono">
            Cumulative root causes triggering workstation wait times.
          </p>
          <div className="relative w-full h-64 sm:h-72">
            <Bar data={delayChartData} options={delayChartOptions} />
          </div>
        </div>

        {/* Stage Progress Velocity Chart */}
        <div className="cyber-card rounded-2xl p-4 sm:p-5 shadow-lg border border-cyan-500/25 flex flex-col">
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                11 Manufacturing Stages Velocity
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3 font-mono">
            Panel throughput clearing each sequential manufacturing stage.
          </p>
          <div className="relative w-full h-64 sm:h-72">
            <Line data={velocityChartData} options={velocityChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
