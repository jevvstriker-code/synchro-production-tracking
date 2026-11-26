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
        backgroundColor: '#2563eb',
        borderRadius: 8,
        hoverBackgroundColor: '#1d4ed8',
      },
    ],
  };

  const delayChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: {
          color: '#64748b',
          font: { size: 10 },
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
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6,
      },
    ],
  };

  const velocityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: {
          color: '#64748b',
          font: { size: 10 },
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
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Assembly Lines Overview</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Lines 1–7 Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">Live shop floor throughput &amp; line workload distribution</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline font-medium">Click line to filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {lineBreakdown.map((line, idx) => (
            <div
              key={line.lineName}
              onClick={() => onSelectLine(line.lineName)}
              className="bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition">
                  Line {idx + 1}
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-md">
                  {line.total}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                <span>Act: <strong className="text-slate-800">{line.active}</strong></span>
                <span>Done: <strong className="text-emerald-600">{line.completed}</strong></span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${line.efficiency}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-blue-600 mt-1 text-right font-medium">
                {line.efficiency}% eff.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Analytics Charts: Bottlenecks & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Production Bottlenecks Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col">
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Delay &amp; Bottleneck Analytics
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Cumulative root causes triggering workstation wait times.
          </p>
          <div className="relative w-full h-64 sm:h-72">
            <Bar data={delayChartData} options={delayChartOptions} />
          </div>
        </div>

        {/* Stage Progress Velocity Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col">
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                11 Manufacturing Stages Velocity
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
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
