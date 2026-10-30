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
        borderRadius: 6,
      },
    ],
  };

  const delayChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
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
          font: { size: 9 },
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
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const velocityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
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
          font: { size: 9 },
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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Assembly Lines 1 to 7 Workload & Velocity
              </h2>
              <p className="text-[11px] text-slate-500">Live operational status across all workstations</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Click any line to filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {lineBreakdown.map((line, idx) => (
            <div
              key={line.lineName}
              onClick={() => onSelectLine(line.lineName)}
              className="bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 p-3 rounded-xl cursor-pointer transition shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition">
                  Line {idx + 1}
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-semibold">
                  {line.total}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1.5">
                <span>Active: <strong className="text-slate-900">{line.active}</strong></span>
                <span>Done: <strong className="text-blue-600">{line.completed}</strong></span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${line.efficiency}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 text-right font-medium">
                {line.efficiency}% rate
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Analytics Charts: Bottlenecks & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Production Bottlenecks Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Production Bottlenecks & Delay Causes
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Stages and factors generating cumulative shop-floor delays.
          </p>
          <div className="relative w-full h-64 sm:h-72">
            <Bar data={delayChartData} options={delayChartOptions} />
          </div>
        </div>

        {/* Stage Progress Velocity Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                11 Industrial Stages Velocity
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Throughput count of panels successfully clearing each manufacturing stage.
          </p>
          <div className="relative w-full h-64 sm:h-72">
            <Line data={velocityChartData} options={velocityChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
