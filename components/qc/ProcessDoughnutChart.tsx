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
    const colors = ['#06b6d4', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#10b981', '#64748b', '#ec4899'];

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Defect Data'],
        datasets: [
          {
            data: values.length ? values : [0],
            backgroundColor: values.length ? colors.slice(0, labels.length) : ['#1e293b'],
            borderWidth: 2,
            borderColor: '#0a0f1d',
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
              color: '#94a3b8',
              font: { size: 11, family: 'monospace' },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#06b6d4',
            borderWidth: 1,
            titleFont: { family: 'monospace' },
            bodyFont: { family: 'monospace' },
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
    <div className="cyber-card p-4 sm:p-5 rounded-2xl border border-cyan-500/25 shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-white tracking-wide font-mono">Process-wise Defect Breakdown</h3>
        <span className="text-[10px] text-cyan-400 font-mono">CLICK SLICE TO DRILL DOWN</span>
      </div>
      <div className="relative flex-grow min-h-[220px] w-full">
        <canvas ref={canvasRef} className="cursor-pointer" />
      </div>
    </div>
  );
}
