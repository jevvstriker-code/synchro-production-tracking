'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface ProcessDoughnutChartProps {
  data: Record<string, number>;
  onSelectStage: (stage: string) => void;
}

export function ProcessDoughnutChart({ data, onSelectStage }: ProcessDoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const onSelectStageRef = useRef(onSelectStage);
  onSelectStageRef.current = onSelectStage;

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = ['#2563eb', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#10b981', '#64748b', '#ec4899'];
    const resolvedLabels = labels.length ? labels : ['No Defect Data'];
    const resolvedValues = values.length ? values : [0];
    const resolvedColors = values.length ? colors.slice(0, labels.length) : ['#e2e8f0'];

    // If chart already exists, update data quietly with ZERO animation to prevent twitching/spinning
    if (chartInstance.current) {
      const currentLabels = chartInstance.current.data.labels || [];
      const currentValues = (chartInstance.current.data.datasets[0]?.data as number[]) || [];

      const isUnchanged =
        currentLabels.length === resolvedLabels.length &&
        resolvedLabels.every((l, i) => l === currentLabels[i]) &&
        resolvedValues.every((v, i) => v === currentValues[i]);

      if (isUnchanged) return;

      chartInstance.current.data.labels = resolvedLabels;
      if (chartInstance.current.data.datasets[0]) {
        chartInstance.current.data.datasets[0].data = resolvedValues;
        chartInstance.current.data.datasets[0].backgroundColor = resolvedColors;
      }
      chartInstance.current.update('none'); // Silent update without animation
      return;
    }

    // Initial chart creation with animations disabled to prevent periodic re-spins
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: resolvedLabels,
        datasets: [
          {
            data: resolvedValues,
            backgroundColor: resolvedColors,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Prevents annoying re-render spin during auto-sync
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              color: '#64748b',
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} defects`,
            },
          },
        },
        onClick: (evt, activeEls) => {
          if (activeEls.length > 0) {
            const index = activeEls[0].index;
            const stageLabel = labels[index];
            if (stageLabel && onSelectStageRef.current) onSelectStageRef.current(stageLabel);
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-slate-900">Process-wise Defect Breakdown</h3>
        <span className="text-[10px] text-blue-600 font-medium">Click slice to drill down</span>
      </div>
      <div className="relative flex-grow min-h-[220px] w-full">
        <canvas ref={canvasRef} className="cursor-pointer" />
      </div>
    </div>
  );
}
