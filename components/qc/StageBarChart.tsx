'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

interface StageBarChartProps {
  data: Record<string, number>;
  onSelectStage: (stage: string) => void;
}

export function StageBarChart({ data, onSelectStage }: StageBarChartProps) {
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
    const resolvedLabels = labels.length ? labels : ['No Data'];
    const resolvedValues = values.length ? values : [0];

    const backgroundColors = resolvedLabels.map((l) =>
      l.includes('(Acc)') ? '#10b981' : l.includes('(Rej/Rew)') ? '#f43f5e' : '#2563eb'
    );

    // If chart already exists, update data quietly with ZERO animation to prevent twitching/bouncing
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
        chartInstance.current.data.datasets[0].backgroundColor = backgroundColors;
      }
      chartInstance.current.update('none'); // Silent update without animation
      return;
    }

    // Initial chart creation with animations disabled to prevent periodic bar growth on sync
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: resolvedLabels,
        datasets: [
          {
            label: 'Inspected Items',
            data: resolvedValues,
            backgroundColor: backgroundColors,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Prevents annoying re-render bar growth during auto-sync
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` Quantity: ${context.raw} items`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#64748b', stepSize: 1 },
            grid: { color: '#f1f5f9' },
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
        <h3 className="text-sm font-bold text-slate-900">QC Status by Stage</h3>
        <span className="text-[10px] text-blue-600 font-medium">Click bar to drill down</span>
      </div>
      <div className="relative flex-grow min-h-[220px] w-full">
        <canvas ref={canvasRef} className="cursor-pointer" />
      </div>
    </div>
  );
}
