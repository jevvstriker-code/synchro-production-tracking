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

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    const backgroundColors = labels.map((l) =>
      l.includes('(Acc)') ? '#10b981' : l.includes('(Rej/Rew)') ? '#f43f5e' : '#2563eb'
    );

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            label: 'Inspected Items',
            data: values.length ? values : [0],
            backgroundColor: backgroundColors,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            if (stageLabel) onSelectStage(stageLabel);
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, onSelectStage]);

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
