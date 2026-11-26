'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import { qcService } from '@/services/qcService';
import { jobCardService } from '@/services/jobCardService';
import { QCLog, QCRecord, ReworkRecord, QCDashboardMetrics, VerificationStatus, QCStatus } from '@/types/qc';
import { JobCard } from '@/types';
import { MetricsCards } from '@/components/qc/MetricsCards';
import { ProcessDoughnutChart } from '@/components/qc/ProcessDoughnutChart';
import { StageBarChart } from '@/components/qc/StageBarChart';
import { DrilldownModal } from '@/components/qc/DrilldownModal';
import { QCItemWizardModal, QCItemForm } from '@/components/qc/QCItemWizardModal';
import {
  Microscope,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Search,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  ClipboardList,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export function QCManagementView() {
  const { currentUser, isAdmin, isDeveloper, isQCInspector } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shop-floor' | 'registers' | 'reports'>('dashboard');

  // Filter Period States
  const [period, setPeriod] = useState<string>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);

  // Data states
  const [metrics, setMetrics] = useState<QCDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [productionJobCards, setProductionJobCards] = useState<JobCard[]>([]);

  // Drilldown Modal
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);
  const [drilldownTitle, setDrilldownTitle] = useState<string>('');
  const [drilldownType, setDrilldownType] = useState<'rework' | 'qc'>('rework');
  const [drilldownItems, setDrilldownItems] = useState<any[]>([]);

  // Shop Floor Form State
  const [logId, setLogId] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [employeeName, setEmployeeName] = useState<string>('');
  const [department, setDepartment] = useState<string>('Quality Assurance');
  const [isWeekly, setIsWeekly] = useState<boolean>(false);
  const [weekEnding, setWeekEnding] = useState<string>('');
  const [highlights, setHighlights] = useState<string>('');
  const [challenges, setChallenges] = useState<string>('');
  const [nextPlan, setNextPlan] = useState<string>('');
  const [support, setSupport] = useState<string>('');
  const [stagedItems, setStagedItems] = useState<QCItemForm[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<QCItemForm | null>(null);
  const [saveStatusMsg, setSaveStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);

  // Registers State
  const [registerSubTab, setRegisterSubTab] = useState<'qc' | 'defects'>('qc');
  const [registerSearch, setRegisterSearch] = useState<string>('');
  const [registerStageFilter, setRegisterStageFilter] = useState<string>('all');
  const [registerStatusFilter, setRegisterStatusFilter] = useState<string>('all');
  const [allRegisters, setAllRegisters] = useState<{ qcRecords: any[]; reworks: any[] }>({ qcRecords: [], reworks: [] });

  // Load Dashboard Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeStart = isCustomDate ? startDate : undefined;
      const activeEnd = isCustomDate ? endDate : undefined;
      const m = await qcService.getDashboardMetrics(isCustomDate ? 'custom' : period, activeStart, activeEnd);
      setMetrics(m);

      const reg = await qcService.getAllRegisters(isCustomDate ? 'custom' : period, activeStart, activeEnd);
      setAllRegisters(reg);

      const jcs = await jobCardService.getAllJobCards();
      setProductionJobCards(jcs);
    } catch (e) {
      console.error('Error loading QC metrics', e);
    } finally {
      setIsLoading(false);
    }
  }, [period, isCustomDate, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set default inspector name from logged-in user
  useEffect(() => {
    if (currentUser?.full_name && !employeeName) {
      setEmployeeName(currentUser.full_name);
    }
    if (currentUser?.department) {
      setDepartment(currentUser.department);
    }
  }, [currentUser, employeeName]);

  // Drilldown Triggers
  const handleSelectDefectProcess = (processName: string) => {
    const matched = allRegisters.reworks.filter((r) => r.stage?.toLowerCase() === processName.toLowerCase());
    setDrilldownTitle(`Defect Root Cause Investigation: ${processName}`);
    setDrilldownType('rework');
    setDrilldownItems(matched);
    setIsDrilldownOpen(true);
  };

  const handleSelectStageBar = (stageLabel: string) => {
    const rawStage = stageLabel.replace(' (Acc)', '').replace(' (Rej/Rew)', '');
    const matched = allRegisters.qcRecords.filter((q) => q.stage?.toLowerCase() === rawStage.toLowerCase());
    setDrilldownTitle(`Inspection Items in Stage: ${rawStage}`);
    setDrilldownType('qc');
    setDrilldownItems(matched);
    setIsDrilldownOpen(true);
  };

  // Toggle Verification status for defects
  const handleToggleVerification = async (reworkId: string, currentStatus: string) => {
    try {
      await qcService.toggleReworkVerification(reworkId, currentStatus as VerificationStatus);
      await loadData();
    } catch (e) {
      console.error('Failed to update defect verification', e);
    }
  };

  // Shop Floor: Save Stage Item
  const handleSaveStagedItem = (item: QCItemForm) => {
    setStagedItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleDeleteStagedItem = (id: string) => {
    setStagedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Save Complete Daily/Weekly QC Log
  const handleSaveCompleteLog = async () => {
    if (!employeeName.trim()) {
      setSaveStatusMsg({ text: 'Inspector name is required.', type: 'error' });
      return;
    }
    if (stagedItems.length === 0) {
      setSaveStatusMsg({ text: 'Please add at least 1 inspected panel item.', type: 'error' });
      return;
    }

    setIsSavingLog(true);
    setSaveStatusMsg(null);
    try {
      const qcRecordsPayload: QCRecord[] = stagedItems.map((item) => ({
        id: item.id,
        log_id: logId,
        stage: item.stage,
        item_name: item.item_name,
        category: item.category,
        in_out: item.in_out,
        serial_no: item.serial_no,
        job_card_no: item.job_card_no || item.serial_no,
        team_vendor: item.team_vendor,
        client: item.client,
        qty: item.qty,
        docs: item.docs,
        inspection_time: item.inspection_time,
        status: item.status,
        remarks: item.remarks,
      }));

      const reworksPayload: ReworkRecord[] = stagedItems
        .filter((item) => item.reworkDraft)
        .map((item) => ({
          id: `rw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          log_id: logId,
          qc_record_id: item.id,
          job_card_no: item.job_card_no || item.serial_no,
          issue_date: entryDate,
          item_name: item.reworkDraft?.item_name || item.item_name,
          team_vendor: item.reworkDraft?.team_vendor || item.team_vendor,
          stage: item.reworkDraft?.stage || 'Wiring',
          defect_type: item.reworkDraft?.defect_type || (item.status === 'Rejected' ? 'Rejected' : 'Rework'),
          qty: item.reworkDraft?.qty || item.qty,
          reason: item.reworkDraft?.reason || 'Defect noted during QC',
          root_cause: item.reworkDraft?.root_cause || '',
          action_taken: item.reworkDraft?.action_taken || '',
          corrective_action: item.reworkDraft?.corrective_action || '',
          verification_status: item.reworkDraft?.verification_status || 'Pending',
        }));

      await qcService.saveLog({
        id: logId || `synchro-entry-${Date.now()}`,
        entry_date: entryDate,
        employee_name: employeeName.trim(),
        department: department.trim(),
        is_weekly: isWeekly,
        week_ending: weekEnding,
        highlights,
        challenges,
        next_plan: nextPlan,
        support,
        created_by: currentUser?.id,
        qc_records: qcRecordsPayload,
        reworks: reworksPayload,
      });

      setSaveStatusMsg({ text: '✓ QC Inspection Log successfully saved & synced with Supabase!', type: 'success' });
      setStagedItems([]);
      setLogId('');
      await loadData();

      setTimeout(() => {
        setActiveTab('dashboard');
        setSaveStatusMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error saving QC log', err);
      setSaveStatusMsg({ text: 'Error saving log: ' + err.message, type: 'error' });
    } finally {
      setIsSavingLog(false);
    }
  };

  // Filtered registers
  const filteredQCRecords = allRegisters.qcRecords.filter((q) => {
    const matchSearch =
      registerSearch === '' ||
      q.item_name?.toLowerCase().includes(registerSearch.toLowerCase()) ||
      q.serial_no?.toLowerCase().includes(registerSearch.toLowerCase()) ||
      q.client?.toLowerCase().includes(registerSearch.toLowerCase());
    const matchStage = registerStageFilter === 'all' || q.stage === registerStageFilter;
    const matchStatus = registerStatusFilter === 'all' || q.status === registerStatusFilter;
    return matchSearch && matchStage && matchStatus;
  });

  const filteredReworks = allRegisters.reworks.filter((r) => {
    const matchSearch =
      registerSearch === '' ||
      r.item_name?.toLowerCase().includes(registerSearch.toLowerCase()) ||
      r.reason?.toLowerCase().includes(registerSearch.toLowerCase()) ||
      r.team_vendor?.toLowerCase().includes(registerSearch.toLowerCase());
    const matchStatus =
      registerStatusFilter === 'all' ||
      (registerStatusFilter === 'OK' && r.verification_status === 'OK') ||
      (registerStatusFilter === 'Pending' && r.verification_status !== 'OK');
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs shrink-0">
            <Microscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Quality Control &amp; Testing Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                PostgreSQL Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Shop floor quality inspection, defect rectification registers &amp; in-process panel testing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 shadow-xs transition"
            title="Refresh QC Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setStagedItems([]);
              setActiveTab('shop-floor');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Shop Floor QC</span>
          </button>
        </div>
      </div>

      {/* QC Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>QC Dashboard &amp; Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('shop-floor')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'shop-floor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Shop Floor Entry</span>
            {stagedItems.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stagedItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('registers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'registers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>QC &amp; Defect Registers</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>A4 Quality Dossier</span>
          </button>
        </div>

        {/* Global Date Filter Controls */}
        {activeTab === 'dashboard' && (
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200 text-xs shadow-2xs">
            <button
              onClick={() => {
                setIsCustomDate(false);
                setPeriod('today');
              }}
              className={`px-2.5 py-1 rounded-xl font-semibold transition ${
                !isCustomDate && period === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setIsCustomDate(false);
                setPeriod('7d');
              }}
              className={`px-2.5 py-1 rounded-xl font-semibold transition ${
                !isCustomDate && period === '7d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => {
                setIsCustomDate(false);
                setPeriod('30d');
              }}
              className={`px-2.5 py-1 rounded-xl font-semibold transition ${
                !isCustomDate && period === '30d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => {
                setIsCustomDate(false);
                setPeriod('90d');
              }}
              className={`px-2.5 py-1 rounded-xl font-semibold transition ${
                !isCustomDate && period === '90d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setIsCustomDate(!isCustomDate)}
              className={`px-2.5 py-1 rounded-xl font-semibold transition flex items-center space-x-1 ${
                isCustomDate ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Specific Dates</span>
            </button>
          </div>
        )}
      </div>

      {/* Custom Date Range Bar */}
      {activeTab === 'dashboard' && isCustomDate && (
        <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center gap-3 text-xs shadow-xs animate-in fade-in">
          <span className="font-bold text-slate-700 flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Select Specific Inspection Range:</span>
          </span>
          <div className="flex items-center space-x-2">
            <label className="text-slate-500 font-medium">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-slate-500 font-medium">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800"
            />
          </div>
          <button
            onClick={loadData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-semibold shadow-xs transition"
          >
            Apply Filter
          </button>
        </div>
      )}

      {/* ================= VIEW 1: QC DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {metrics && (
            <MetricsCards
              totalQC={metrics.totalQCItems}
              totalDefects={metrics.totalDefects}
              passRate={metrics.passRate}
              defectRate={metrics.defectRate}
              verifiedOK={metrics.verifiedOKCount}
              pendingDefects={metrics.pendingDefectsCount}
            />
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {metrics && (
              <ProcessDoughnutChart
                data={metrics.processWiseDefects}
                onSelectStage={handleSelectDefectProcess}
              />
            )}
            {metrics && (
              <StageBarChart
                data={metrics.stageWiseInspections}
                onSelectStage={handleSelectStageBar}
              />
            )}
          </div>

          {/* Recent QC Inspection Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">QC Inspection Log History</h3>
                <p className="text-xs text-slate-500">All registered shop floor quality inspection dossiers</p>
              </div>
              <span className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
                Showing {metrics?.logs.length || 0} Logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5">Log Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Inspector</th>
                    <th className="p-3.5">Inspected Panels</th>
                    <th className="p-3.5">Defects</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {!metrics || metrics.logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No inspection logs recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    metrics.logs.map((log) => {
                      const totalQty = (log.qc_records || []).reduce((acc, q) => acc + (q.qty || 1), 0);
                      const defectQty = (log.reworks || []).reduce((acc, r) => acc + (r.qty || 1), 0);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                            {log.entry_date}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                log.is_weekly
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {log.is_weekly ? 'Weekly Summary' : 'Daily Floor Log'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800">{log.employee_name}</span>
                            <span className="text-[10px] text-slate-400 block">{log.department}</span>
                          </td>
                          <td className="p-3.5 font-semibold text-blue-600">
                            {totalQty} Panels / Items
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                defectQty > 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {defectQty} Defects
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setDrilldownTitle(`Log: ${log.entry_date} by ${log.employee_name}`);
                                setDrilldownType('qc');
                                setDrilldownItems(log.qc_records || []);
                                setIsDrilldownOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold transition"
                            >
                              View Items
                            </button>
                            {(isAdmin || isDeveloper) && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete QC log from ${log.entry_date}?`)) {
                                    await qcService.deleteLog(log.id);
                                    loadData();
                                  }
                                }}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Delete Log"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SHOP FLOOR ENTRY ================= */}
      {activeTab === 'shop-floor' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Shop Floor QC Logging Console</h3>
              <p className="text-xs text-slate-500">Record incoming, in-process, or final panel inspections</p>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsWizardOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inspection Item</span>
            </button>
          </div>

          {saveStatusMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
                saveStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {saveStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{saveStatusMsg.text}</span>
            </div>
          )}

          {/* Header Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspection Date *</label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspector Full Name *</label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. Dipen Malli"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Staged QC Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Inspected Items Queue ({stagedItems.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Click item to edit before final submission
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">Stage</th>
                    <th className="p-3">Item / Panel</th>
                    <th className="p-3">Serial / JC #</th>
                    <th className="p-3">Client / Vendor</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No inspection items added yet. Click &quot;Add Inspection Item&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    stagedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-semibold text-slate-800">{item.stage}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.item_name}</td>
                        <td className="p-3 font-mono text-blue-600">{item.serial_no || '-'}</td>
                        <td className="p-3 text-slate-600">{item.client || '-'}</td>
                        <td className="p-3 font-bold text-slate-900">{item.qty}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              item.status === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'Rework'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setIsWizardOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStagedItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={isSavingLog || stagedItems.length === 0}
              onClick={handleSaveCompleteLog}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingLog ? 'Saving Log to Database...' : 'Commit & Save Floor QC Log'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: REGISTERS ================= */}
      {activeTab === 'registers' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setRegisterSubTab('qc')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                  registerSubTab === 'qc'
                    ? 'bg-blue-600 text-white shadow-xs border-blue-600'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                Master QC Register ({filteredQCRecords.length})
              </button>

              <button
                onClick={() => setRegisterSubTab('defects')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                  registerSubTab === 'defects'
                    ? 'bg-rose-600 text-white shadow-xs border-rose-600'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                Defect Monitoring Register ({filteredReworks.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search panel, serial, client..."
                value={registerSearch}
                onChange={(e) => setRegisterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sub-Tab A: Master QC Register */}
          {registerSubTab === 'qc' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">Log Date</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Item / Panel</th>
                    <th className="p-3">Serial # / JC</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredQCRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No records match the active criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQCRecords.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 whitespace-nowrap">{q.log_date}</td>
                        <td className="p-3 font-semibold text-slate-800">{q.stage}</td>
                        <td className="p-3 font-bold text-slate-900">{q.item_name}</td>
                        <td className="p-3 font-mono text-blue-600">{q.serial_no || '-'}</td>
                        <td className="p-3 text-slate-600">{q.client || '-'}</td>
                        <td className="p-3 text-slate-600">{q.team_vendor || '-'}</td>
                        <td className="p-3 font-bold text-slate-900">{q.qty}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              q.status === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : q.status === 'Rework'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{q.employee_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-Tab B: Defect Monitoring Register */}
          {registerSubTab === 'defects' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-rose-600 text-[11px] font-bold uppercase tracking-wider border-b border-rose-100">
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Item / Panel</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Defect Reason &amp; Root Cause</th>
                    <th className="p-3">Action &amp; Corrective Plan</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3 text-center">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReworks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No defects found.
                      </td>
                    </tr>
                  ) : (
                    filteredReworks.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 whitespace-nowrap">{r.issue_date}</td>
                        <td className="p-3 font-bold text-slate-900">{r.item_name}</td>
                        <td className="p-3 font-semibold text-slate-800">{r.stage}</td>
                        <td className="p-3">
                          <p className="font-semibold text-rose-600">{r.reason}</p>
                          {r.root_cause && <p className="text-[10px] text-slate-500">Root Cause: {r.root_cause}</p>}
                        </td>
                        <td className="p-3">
                          <p className="text-slate-700">{r.action_taken || '-'}</p>
                          {r.corrective_action && (
                            <p className="text-[10px] text-emerald-600">Corrective: {r.corrective_action}</p>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{r.qty}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(r.id, r.verification_status)}
                            className={`px-3 py-1 rounded-full font-bold text-[10px] transition shadow-xs border ${
                              r.verification_status === 'OK'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Click to toggle status"
                          >
                            {r.verification_status === 'OK' ? '✓ VERIFIED OK' : '⏳ PENDING REWORK'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 4: A4 QUALITY DOSSIER ================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
            <div>
              <h3 className="font-bold text-slate-900 text-base">A4 Quality Inspection Dossier</h3>
              <p className="text-xs text-slate-500">Official printable quality control certificate &amp; report</p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Dossier</span>
            </button>
          </div>

          {/* Printable Sheet */}
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-6 space-y-6 font-sans shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Synchro Electricals Pvt. Ltd.
                </h1>
                <p className="text-xs text-slate-600">
                  Industrial Panel Manufacturing &amp; Quality Assurance Laboratory
                </p>
                <p className="text-[10px] text-slate-400">
                  Document: SEPL-QC-DOSSIER-2026 | Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold tracking-wider uppercase">
                  Quality Audit Report
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 text-center border-y border-slate-200 py-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Inspected</span>
                <span className="text-base font-black text-slate-900">{metrics?.totalQCItems || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Accepted OK</span>
                <span className="text-base font-black text-emerald-600">{metrics?.passRate || 100}%</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Defects Logged</span>
                <span className="text-base font-black text-rose-600">{metrics?.totalDefects || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Rectified &amp; Closed</span>
                <span className="text-base font-black text-blue-600">{metrics?.verifiedOKCount || 0}</span>
              </div>
            </div>

            {/* Recent Inspection Entries */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Summary of Inspected Electrical Panels
              </h4>
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2">Stage</th>
                    <th className="p-2">Panel Item</th>
                    <th className="p-2">Serial / JC #</th>
                    <th className="p-2">Client</th>
                    <th className="p-2">Verdict</th>
                    <th className="p-2">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allRegisters.qcRecords.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 font-semibold">{r.stage}</td>
                      <td className="p-2">{r.item_name}</td>
                      <td className="p-2 font-mono text-blue-600">{r.serial_no || '-'}</td>
                      <td className="p-2">{r.client || '-'}</td>
                      <td className="p-2 font-bold">{r.status}</td>
                      <td className="p-2">{r.employee_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-300 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 pb-8 font-semibold text-slate-800">
                  {employeeName || 'QC Inspector'}
                </div>
                <span className="text-[10px] text-slate-500 uppercase mt-1 block">QC Inspection Officer</span>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-8 font-semibold text-slate-800">
                  Production In-Charge
                </div>
                <span className="text-[10px] text-slate-500 uppercase mt-1 block">Shop Floor Supervisor</span>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-8 font-semibold text-slate-800">
                  Head of Quality
                </div>
                <span className="text-[10px] text-slate-500 uppercase mt-1 block">Plant Quality Manager</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modal */}
      <DrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        title={drilldownTitle}
        type={drilldownType}
        items={drilldownItems}
      />

      {/* Shop Floor Item Wizard */}
      <QCItemWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleSaveStagedItem}
        initialItem={editingItem}
        productionJobCards={productionJobCards}
      />
    </div>
  );
}
