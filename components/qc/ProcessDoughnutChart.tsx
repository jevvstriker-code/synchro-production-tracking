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

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = ['#0284c7', '#1d4ed8', '#f59e0b', '#e11d48', '#8b5cf6', '#10b981', '#64748b', '#ec4899'];

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Defect Data'],
        datasets: [
          {
            data: values.length ? values : [0],
            backgroundColor: values.length ? colors.slice(0, labels.length) : ['#e2e8f0'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11, family: 'Inter, sans-serif' },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} defects`,
            },
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
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-slate-800">Process-wise Defect Breakdown</h3>
        <span className="text-[10px] text-slate-400 font-medium">Click slice to drill down</span>
      </div>
      <div className="relative flex-grow min-h-[220px] w-full">
        <canvas ref={canvasRef} className="cursor-pointer" />
      </div>
    </div>
  );
}
