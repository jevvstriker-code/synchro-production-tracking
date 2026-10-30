'use client';

import React, { useState, useEffect } from 'react';
import { analyticsService, OperatorPerformance } from '@/services/analyticsService';
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
  Users,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Search,
  Download,
  Printer,
  BarChart2,
  ListFilter
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function TeamPerformanceView() {
  const [performances, setPerformances] = useState<OperatorPerformance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<OperatorPerformance | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'comparison'>('leaderboard');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getTeamPerformanceAnalytics();
      setPerformances(data);
      if (data.length > 0 && !selectedOperator) {
        setSelectedOperator(data[0]);
      }
    } catch (e) {
      console.error('Error loading team performance', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = performances.filter((p) =>
    p.operatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStagesAll = performances.reduce((acc, p) => acc + p.totalStagesCompleted, 0);
  const totalHoursAll = performances.reduce((acc, p) => acc + p.totalHoursSpent, 0);
  const avgEfficiencyAll =
    performances.length > 0
      ? Math.round(performances.reduce((acc, p) => acc + p.efficiencyScore, 0) / performances.length)
      : 100;

  const handleExportCSV = () => {
    let csv = 'Operator Name,Total Stages,Total Hours,Avg Hours/Stage,Delayed Stages,On-Time Rate,Efficiency Score\r\n';
    performances.forEach((p) => {
      csv += `"${p.operatorName}",${p.totalStagesCompleted},${p.totalHoursSpent},${p.avgHoursPerStage},${p.delayedStagesCount},"${p.onTimeRate}%","${p.efficiencyScore}%"\r\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Synchro_Manpower_Performance_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Comparison Chart Data
  const comparisonLabels = performances.map((p) => p.operatorName);
  const comparisonChartData = {
    labels: comparisonLabels,
    datasets: [
      {
        label: 'Efficiency Rating (%)',
        data: performances.map((p) => p.efficiencyScore),
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
      {
        label: 'On-Time Accuracy (%)',
        data: performances.map((p) => p.onTimeRate),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  const comparisonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 11 } },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { font: { size: 10 }, stepSize: 20 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Team & Manpower Performance Evaluation
              </h2>
              <p className="text-xs text-slate-500">
                Operator cycle times, process efficiency, stage completion velocity & delay audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Fitters
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {performances.length}
            </div>
            <span className="text-[10px] text-slate-400">Assigned Operators</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Stages Completed
            </span>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
              {totalStagesAll}
            </div>
            <span className="text-[10px] text-slate-400">Total Workstations</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Logged Work Time
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {totalHoursAll.toFixed(1)}h
            </div>
            <span className="text-[10px] text-slate-400">Cumulative Time</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Team Efficiency
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
              {avgEfficiencyAll}%
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">On-Time Standard</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Leaderboard vs Comparison Chart */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeSubTab === 'leaderboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Operator Profiles & Details</span>
        </button>
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeSubTab === 'comparison'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Team Efficiency Comparison Chart</span>
        </button>
      </div>

      {activeSubTab === 'comparison' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900">
            Operator Efficiency & On-Time Performance Benchmark
          </h3>
          <p className="text-xs text-slate-500">
            Direct side-by-side comparison of individual fitter cycle compliance and accuracy scores
          </p>
          <div className="relative w-full h-80 sm:h-96 pt-2">
            <Bar data={comparisonChartData} options={comparisonChartOptions} />
          </div>
        </div>
      ) : (
        /* Main Grid: Operator List & Detail Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Operator List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Operators & Fitters Leaderboard</h3>
              <span className="text-xs text-slate-500 font-mono">{filtered.length} Staff</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search fitter by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Calculating manpower metrics...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No operators match query</div>
              ) : (
                filtered.map((op, idx) => {
                  const isSelected = selectedOperator?.operatorName === op.operatorName;
                  return (
                    <div
                      key={op.operatorName}
                      onClick={() => setSelectedOperator(op)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{op.operatorName}</div>
                          <div className="text-[10px] text-slate-500">
                            {op.totalStagesCompleted} stages • {op.totalHoursSpent}h total
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-700">{op.efficiencyScore}%</div>
                        <div className="text-[10px] text-slate-400">Efficiency</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Operator In-Depth Breakdown */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            {selectedOperator ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase text-blue-600 tracking-wider">
                      Performance Profile
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedOperator.operatorName}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold">
                      {selectedOperator.efficiencyScore}% Rating Score
                    </span>
                  </div>
                </div>

                {/* Stat Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Stages Finished</span>
                    <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                      {selectedOperator.totalStagesCompleted}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Floor Work Time</span>
                    <span className="text-lg font-bold text-blue-600 mt-0.5 block">
                      {selectedOperator.totalHoursSpent}h
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Time / Stage</span>
                    <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                      {selectedOperator.avgHoursPerStage}h
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">On-Time Accuracy</span>
                    <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
                      {selectedOperator.onTimeRate}%
                    </span>
                  </div>
                </div>

                {/* Stage-wise Detailed Breakdown Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Process Stage Execution Breakdown
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Process Stage</th>
                          <th className="py-2.5 px-3">Panels Handled</th>
                          <th className="py-2.5 px-3">Avg Hours Taken</th>
                          <th className="py-2.5 px-3 text-right">Performance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {Object.keys(selectedOperator.stageBreakdown).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-slate-400">
                              No individual stage data recorded.
                            </td>
                          </tr>
                        ) : (
                          Object.entries(selectedOperator.stageBreakdown).map(([stName, data]) => (
                            <tr key={stName} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{stName}</td>
                              <td className="py-2.5 px-3 font-mono">{data.count}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                {data.avgHours}h
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Optimum
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">Select an operator to preview metrics.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
