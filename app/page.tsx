'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/Navbar';
import { DashboardCharts } from '@/components/DashboardCharts';
import { FastStageWizardModal } from '@/components/FastStageWizardModal';
import { PrintableJobCardModal } from '@/components/PrintableJobCardModal';
import { PrintablePanelReportModal } from '@/components/PrintablePanelReportModal';
import { PrintableBatchReportModal } from '@/components/PrintableBatchReportModal';
import { AddAssemblyLineModal } from '@/components/AddAssemblyLineModal';
import { ImportExportModal } from '@/components/ImportExportModal';
import { LiveCameraModal } from '@/components/LiveCameraModal';
import { LoginModal } from '@/components/LoginModal';
import { TeamPerformanceView } from '@/components/TeamPerformanceView';
import { AdminPortalView } from '@/components/AdminPortalView';
import { ElectricCurrentTracker } from '@/components/ElectricCurrentTracker';
import { OpeningSplashAnimation } from '@/components/OpeningSplashAnimation';
import { WelcomeCelebrationModal } from '@/components/WelcomeCelebrationModal';
import { OperationsPortalGateway } from '@/components/OperationsPortalGateway';
import { QCManagementView } from '@/components/qc/QCManagementView';

import { jobCardService } from '@/services/jobCardService';
import { stageLogService } from '@/services/stageLogService';
import { reworkService } from '@/services/reworkService';
import { auditService } from '@/services/auditService';
import { analyticsService } from '@/services/analyticsService';
import { assemblyLineService } from '@/services/assemblyLineService';
import { approvalService } from '@/services/approvalService';
import { supabase } from '@/lib/supabase/client';
import { JobCard, StageLog, ReworkLog, AuditTrail, AssemblyLine, PRODUCTION_STAGES, ASSEMBLY_LINES } from '@/types';

import {
  Boxes,
  CheckCircle,
  Clock,
  Timer,
  RotateCcw,
  AlertTriangle,
  QrCode,
  Search,
  Plus,
  Printer,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  FileDown,
  Layers,
  ArrowRight,
  Camera,
  Share2,
  X,
  FileText,
  CheckSquare,
  Square,
  Factory,
  Zap,
  FileJson,
  ShieldAlert,
  Calendar
} from 'lucide-react';

export default function HomePage() {
  const {
    currentUser,
    isLoggedIn,
    isAdmin,
    isSupervisor,
    isDeveloper,
    isQCInspector,
    canView,
    requiresApproval,
    welcomeBanner,
    dismissWelcomeBanner,
    welcomeModalData,
    dismissWelcomeModal,
    animationsEnabled,
    portalMode,
    setPortalMode,
  } = useAuth();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Automatically ensure login modal is closed when user is authenticated
  useEffect(() => {
    if (isLoggedIn) {
      setIsLoginModalOpen(false);
    }
  }, [isLoggedIn]);

  // Production Dashboard Date Filter State
  const [prodPeriod, setProdPeriod] = useState<string>('all');
  const [prodStartDate, setProdStartDate] = useState<string>('');
  const [prodEndDate, setProdEndDate] = useState<string>('');
  const [isProdCustomDate, setIsProdCustomDate] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAssemblyLine, setSelectedAssemblyLine] = useState<string>('Assembly Line 1');

  // Data States
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [assemblyLines, setAssemblyLines] = useState<AssemblyLine[]>([]);
  const [reworkLogs, setReworkLogs] = useState<ReworkLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrail[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{
    activeCount: number;
    completedCount: number;
    delayedCount: number;
    avgCycleHours: number;
    reworkCount: number;
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
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Selection state for multiple records print
  const [selectedPanelIds, setSelectedPanelIds] = useState<Set<string>>(new Set());

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [selectedWizardJobCard, setSelectedWizardJobCard] = useState<JobCard | null>(null);
  const [selectedWizardStages, setSelectedWizardStages] = useState<StageLog[]>([]);

  const [isStickerModalOpen, setIsStickerModalOpen] = useState<boolean>(false);
  const [selectedStickerJobCard, setSelectedStickerJobCard] = useState<JobCard | null>(null);

  // Individual Panel Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedReportJobCard, setSelectedReportJobCard] = useState<JobCard | null>(null);

  // Batch Report Modal
  const [isBatchReportModalOpen, setIsBatchReportModalOpen] = useState<boolean>(false);
  const [batchReportCards, setBatchReportCards] = useState<JobCard[]>([]);

  // Add Assembly Line Modal
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState<boolean>(false);

  // Backup & JSON Import/Export Modal
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);
  const [importExportTab, setImportExportTab] = useState<'export' | 'import'>('export');

  // Reports Tab Filters
  const [reportsFilterLine, setReportsFilterLine] = useState<string>('all');
  const [reportsFilterStatus, setReportsFilterStatus] = useState<string>('all');
  const [reportsSearch, setReportsSearch] = useState<string>('');

  const [isAddReworkModalOpen, setIsAddReworkModalOpen] = useState<boolean>(false);
  const [reworkFormJc, setReworkFormJc] = useState<string>('');
  const [reworkFormProcess, setReworkFormProcess] = useState<string>('Testing');
  const [reworkFormReason, setReworkFormReason] = useState<string>('');
  const [reworkFormSupervisor, setReworkFormSupervisor] = useState<string>('Amit Verma');

  // Job Card Creation Form State
  const [formJcNo, setFormJcNo] = useState<string>(`SE26090${Math.floor(400 + Math.random() * 100)}`);
  const [formCustCode, setFormCustCode] = useState<string>('CUST-050');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [formLotQty, setFormLotQty] = useState<number>(1);
  const [formProductName, setFormProductName] = useState<string>('800 KVAR APFC Panel');
  const [formPanelType, setFormPanelType] = useState<string>('Indoor');
  const [formLine, setFormLine] = useState<string>('Assembly Line 1');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formPpcName, setFormPpcName] = useState<string>('Rajesh Sharma');
  const [formSupName, setFormSupName] = useState<string>('Amit Verma');

  // Load all data with optional silent background refresh
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const activeStart = isProdCustomDate ? prodStartDate : undefined;
      const activeEnd = isProdCustomDate ? prodEndDate : undefined;
      const [cards, lines, reworks, audits, analytics] = await Promise.all([
        jobCardService.getAllJobCards(),
        assemblyLineService.getAll(),
        reworkService.getAllReworkLogs(),
        auditService.getAuditLogs(50),
        analyticsService.getDashboardAnalytics(isProdCustomDate ? 'custom' : prodPeriod, activeStart, activeEnd),
      ]);
      setJobCards(cards);
      setAssemblyLines(lines);
      setReworkLogs(reworks);
      setAuditLogs(audits);
      setAnalyticsData(analytics);
    } catch (e) {
      console.error('Failed to load application data', e);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [prodPeriod, prodStartDate, prodEndDate, isProdCustomDate]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time synchronization across devices (Laptop & Mobile):
  // 1) 3-second silent background poller ensures instant updates without refreshing page
  // 2) Supabase Realtime WebSocket subscription for live push
  useEffect(() => {
    const timer = setInterval(() => {
      loadAllData(true);
    }, 3000);

    const channel = supabase
      .channel('synchro-floor-sync')
      .on('postgres_changes', { event: '*', schema: 'synchro_production_tracking', table: 'job_cards' }, () => {
        loadAllData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'synchro_production_tracking', table: 'stage_logs' }, () => {
        loadAllData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'synchro_production_tracking', table: 'approval_requests' }, () => {
        loadAllData(true);
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [loadAllData]);

  // Fitter Role Access Restriction:
  // If a fitter logs in without admin dashboard approval, redirect them directly to Assembly Lines
  useEffect(() => {
    if (currentUser?.role === 'fitter') {
      if (!canView('dashboard') && activeTab === 'dashboard') {
        setActiveTab('assembly-lines');
      }
    }
  }, [currentUser, activeTab, canView]);

  // Open Stage Wizard for a panel
  const handleOpenWizard = async (jobCardNo: string) => {
    try {
      const res = await jobCardService.getJobCardWithStages(jobCardNo);
      if (res) {
        setSelectedWizardJobCard(res.jobCard);
        setSelectedWizardStages(res.stages);
        setIsWizardOpen(true);
      }
    } catch (e) {
      console.error('Error opening stage wizard:', e);
    }
  };

  // Open QR Sticker Modal
  const handleOpenSticker = (card: JobCard) => {
    setSelectedStickerJobCard(card);
    setIsStickerModalOpen(true);
  };

  // Open Individual Panel Report
  const handleOpenPanelReport = (card: JobCard) => {
    setSelectedReportJobCard(card);
    setIsReportModalOpen(true);
  };

  // Toggle Panel Selection for Batch Print
  const handleToggleSelectPanel = (id: string) => {
    const next = new Set(selectedPanelIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPanelIds(next);
  };

  // Select / Deselect All Panels
  const handleToggleSelectAll = (visibleCards: JobCard[]) => {
    if (selectedPanelIds.size === visibleCards.length && visibleCards.length > 0) {
      setSelectedPanelIds(new Set());
    } else {
      setSelectedPanelIds(new Set(visibleCards.map((c) => c.id)));
    }
  };

  // Trigger Batch Print
  const handleOpenBatchReport = (panelsToPrint?: JobCard[]) => {
    const list = panelsToPrint || jobCards.filter((c) => selectedPanelIds.has(c.id));
    if (list.length === 0) {
      alert('Please select at least one panel record to print.');
      return;
    }
    setBatchReportCards(list);
    setIsBatchReportModalOpen(true);
  };

  // Handle Scan QR from Camera
  const handleScanResult = (decodedText: string) => {
    // Check if URL or raw JC
    let jcNo = decodedText.trim();
    if (jcNo.includes('/track/')) {
      const parts = jcNo.split('/track/');
      jcNo = parts[1].split('?')[0].trim();
    } else if (jcNo.includes('jc=')) {
      const match = jcNo.match(/jc=([^&]+)/);
      if (match) jcNo = match[1].trim();
    }

    const found = jobCards.find((j) => j.job_card_no.toLowerCase() === jcNo.toLowerCase());
    if (found) {
      handleOpenWizard(found.job_card_no);
    } else {
      alert(`Scanned Job Card "${jcNo}" not found in current database.`);
    }
  };

  // Create New Job Card
  const handleCreateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();

    // Manager approval check: Non-admins require Admin Manager approval
    if (requiresApproval()) {
      try {
        await approvalService.createRequest({
          request_type: 'job_card_create',
          job_card_no: formJcNo.trim(),
          panel_name: formProductName.trim(),
          requester_name: currentUser?.full_name || formPpcName,
          requester_role: currentUser?.role || 'ppc',
          requester_id: currentUser?.id,
          action_payload: {
            job_card_no: formJcNo.trim(),
            customer_code: formCustCode.trim(),
            date: formDate,
            lot_qty: Number(formLotQty) || 1,
            product_name: formProductName.trim(),
            panel_type: formPanelType,
            assembly_line: formLine,
            current_stage: PRODUCTION_STAGES[0].name,
            current_stage_idx: 0,
            status: 'in_progress',
            production_start_date: formStartDate,
            production_end_date: formEndDate || null,
            ppc_name: formPpcName.trim(),
            supervisor_name: formSupName.trim(),
          },
        });

        alert(`✓ Job Card "${formJcNo.trim()}" submitted for Admin Manager Approval! Changes will launch once approved in the Admin Portal.`);
        setFormJcNo(`SE26090${Math.floor(400 + Math.random() * 100)}`);
        await loadAllData();
      } catch (err: any) {
        alert(`Error submitting job card: ${err.message}`);
      }
      return;
    }

    try {
      const newCard = await jobCardService.createJobCard({
        job_card_no: formJcNo.trim(),
        customer_code: formCustCode.trim(),
        date: formDate,
        lot_qty: Number(formLotQty) || 1,
        product_name: formProductName.trim(),
        panel_type: formPanelType,
        assembly_line: formLine,
        current_stage: PRODUCTION_STAGES[0].name,
        status: 'in_progress',
        production_start_date: formStartDate,
        production_end_date: formEndDate || null,
        ppc_name: formPpcName.trim(),
        supervisor_name: formSupName.trim(),
      });

      await auditService.logAudit({
        job_card_no: newCard.job_card_no,
        action: 'Created Job Card & QR Code',
        actor_name: currentUser?.full_name || formPpcName,
        actor_role: currentUser?.role || 'ppc',
        details: `Line: ${newCard.assemblyLine} | Product: ${newCard.product_name}`,
      });

      await loadAllData();
      handleOpenSticker(newCard);
      // Generate next random JC No
      setFormJcNo(`SE26090${Math.floor(400 + Math.random() * 100)}`);
    } catch (err: any) {
      alert(`Error creating job card: ${err.message || 'Already exists'}`);
    }
  };

  // Delete Job Card
  const handleDeleteJobCard = async (card: JobCard) => {
    if (!isAdmin) {
      alert('Only the System Administrator is authorized to delete production records.');
      return;
    }
    if (confirm(`Delete Job Card ${card.job_card_no}? This will also delete all stage logs.`)) {
      try {
        await jobCardService.deleteJobCard(card.id);
        await auditService.logAudit({
          job_card_no: card.job_card_no,
          action: 'Deleted Job Card',
          actor_name: currentUser?.full_name || 'Admin',
          actor_role: currentUser?.role || 'admin',
          details: `Panel: ${card.product_name}`,
        });
        loadAllData();
      } catch (e) {
        console.error('Delete error', e);
      }
    }
  };

  // Save Rework Log
  const handleSaveRework = async (e: React.FormEvent) => {
    e.preventDefault();
    const jc = jobCards.find((j) => j.job_card_no === reworkFormJc);

    // Manager approval check: Non-admins require Admin approval
    if (requiresApproval()) {
      try {
        await approvalService.createRequest({
          request_type: 'rework_log',
          job_card_no: reworkFormJc,
          panel_name: jc?.product_name || 'Electrical Panel',
          stage_name: reworkFormProcess,
          requester_name: currentUser?.full_name || reworkFormSupervisor,
          requester_role: currentUser?.role || 'supervisor',
          requester_id: currentUser?.id,
          action_payload: {
            job_card_no: reworkFormJc,
            product_name: jc?.product_name || 'APFC Panel',
            assembly_line: jc?.assemblyLine || 'Assembly Line 1',
            process_name: reworkFormProcess,
            reason: reworkFormReason,
            supervisor_name: reworkFormSupervisor,
          },
        });

        alert(`✓ Rework defect submitted for Admin Manager Approval! Once approved, it will be added to the register.`);
        setIsAddReworkModalOpen(false);
        setReworkFormReason('');
        await loadAllData();
      } catch (err: any) {
        alert(`Error submitting rework log: ${err.message}`);
      }
      return;
    }

    try {
      await reworkService.createReworkLog({
        job_card_no: reworkFormJc,
        product_name: jc?.product_name || 'APFC Panel',
        assembly_line: jc?.assemblyLine || 'Assembly Line 1',
        process_name: reworkFormProcess,
        reason: reworkFormReason,
        supervisor_name: reworkFormSupervisor,
      });

      await auditService.logAudit({
        job_card_no: reworkFormJc,
        action: 'Logged Rework / Rejection',
        actor_name: reworkFormSupervisor,
        actor_role: 'supervisor',
        details: `Process: ${reworkFormProcess} | Reason: ${reworkFormReason}`,
      });

      setIsAddReworkModalOpen(false);
      setReworkFormReason('');
      loadAllData();
    } catch (e) {
      console.error('Failed to save rework', e);
    }
  };

  // Filter panels for dashboard table
  const filteredPanels = jobCards.filter((jc) => {
    // Period date filter
    if (isProdCustomDate && prodStartDate && prodEndDate) {
      if (jc.date < prodStartDate || jc.date > prodEndDate) return false;
    } else if (isProdCustomDate && prodStartDate) {
      if (jc.date < prodStartDate) return false;
    } else if (isProdCustomDate && prodEndDate) {
      if (jc.date > prodEndDate) return false;
    } else if (prodPeriod === 'today') {
      const today = new Date().toISOString().substring(0, 10);
      if (jc.date !== today) return false;
    } else if (prodPeriod === '7d' || prodPeriod === '30d' || prodPeriod === '90d') {
      const days = prodPeriod === '7d' ? 7 : prodPeriod === '30d' ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      if (jc.date < cutoff) return false;
    }

    const q = searchFilter.toLowerCase();
    return (
      jc.job_card_no.toLowerCase().includes(q) ||
      jc.product_name.toLowerCase().includes(q) ||
      (jc.assemblyLine || jc.assembly_line || '').toLowerCase().includes(q) ||
      jc.current_stage.toLowerCase().includes(q)
    );
  });

  // 1. If animations are enabled and opening splash is active, render ONLY the Opening Splash Screen
  if (animationsEnabled && showSplash) {
    return (
      <OpeningSplashAnimation
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  // 2. If not logged in, render the dedicated Operations Portal Gateway Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased text-slate-800">
        {/* Post-Login Welcome Celebration Animation with Name & Pun/Quote */}
        {welcomeModalData && (
          <WelcomeCelebrationModal
            user={welcomeModalData.user}
            mode={welcomeModalData.mode}
            quote={welcomeModalData.quote}
            onFinish={dismissWelcomeModal}
          />
        )}

        {/* Dedicated Operations Portal Gateway Screen matching user design */}
        <OperationsPortalGateway
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            loadAllData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased text-slate-900">
      {/* 0.1 Post-Login Welcome Celebration Animation with Name & Pun/Quote */}
      {welcomeModalData && (
        <WelcomeCelebrationModal
          user={welcomeModalData.user}
          mode={welcomeModalData.mode}
          quote={welcomeModalData.quote}
          onFinish={dismissWelcomeModal}
        />
      )}

      {/* Underlying Web Application (Hidden during print so only printable modals render) */}
      <div className="print:hidden flex flex-col flex-1">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openScanner={() => setIsScannerOpen(true)}
          openLoginModal={() => setIsLoginModalOpen(true)}
          openImportExportModal={() => {
            setImportExportTab('export');
            setIsImportExportModalOpen(true);
          }}
        />

        {/* Welcome Toast Notification Banner */}
        {welcomeBanner && (
          <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-semibold">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span>{welcomeBanner}</span>
            </div>
            <button
              onClick={dismissWelcomeBanner}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Container */}
        <main className="flex-1 w-full max-w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto">
        {portalMode === 'qc' ? (
          <QCManagementView />
        ) : !isAdmin && !canView(activeTab) ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You do not have permission to view the <strong className="text-slate-800 capitalize">{activeTab.replace('-', ' ')}</strong> module. Access permissions are strictly managed by the System Administrator in the Enterprise Admin Portal.
            </p>
            {!isLoggedIn ? (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow transition"
              >
                Staff Login
              </button>
            ) : (
              <div className="text-[11px] text-slate-400">
                Logged in as <span className="font-semibold text-slate-600">{currentUser?.full_name}</span> ({currentUser?.role})
              </div>
            )}
          </div>
        ) : (
          <>
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <section className="space-y-4 sm:space-y-6">
            {/* Dashboard Period Filter */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Production Period:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: '90d', label: 'Last 90 Days' },
                    { id: 'custom', label: 'Specific Dates' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        if (btn.id === 'custom') {
                          setIsProdCustomDate(true);
                          setProdPeriod('custom');
                        } else {
                          setIsProdCustomDate(false);
                          setProdPeriod(btn.id);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                        (btn.id === 'custom' && isProdCustomDate) || (!isProdCustomDate && prodPeriod === btn.id)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {isProdCustomDate && (
                <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase">From:</span>
                  <input
                    type="date"
                    value={prodStartDate}
                    onChange={(e) => setProdStartDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                  />
                  <span className="text-slate-500 font-bold">to</span>
                  <input
                    type="date"
                    value={prodEndDate}
                    onChange={(e) => setProdEndDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Delay Bottleneck Banner */}
            {analyticsData && analyticsData.delayedCount > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-2xl shadow-xs border border-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Shop Floor Bottleneck Warning
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {analyticsData.delayedCount} panel(s) flagged with material, fabrication, busbar or testing delays.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('assembly-lines')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline flex items-center space-x-1"
                >
                  <span>Investigate Lines</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/90 transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Panels
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {analyticsData?.activeCount ?? 0}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">Live On Floor</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/90 transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Completed &amp; Shipped
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {analyticsData?.completedCount ?? 0}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">Dispatched</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/90 transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Delayed Panels
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                    {analyticsData?.delayedCount ?? 0}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">Wait Time</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/90 transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Avg Cycle Time
                  </span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Timer className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {analyticsData?.avgCycleHours ?? 0}h
                  </span>
                  <span className="ml-2 text-xs text-slate-500">Per Stage</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/90 transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Rework Register
                  </span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl sm:text-3xl font-extrabold text-purple-600">
                    {reworkLogs.length}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">Cases</span>
                </div>
              </div>
            </div>

            {/* Dashboard Charts & Lines Grid */}
            {analyticsData && (
              <DashboardCharts
                delayCauses={analyticsData.delayCauses}
                stageVelocity={analyticsData.stageVelocity}
                lineBreakdown={analyticsData.lineBreakdown}
                onSelectLine={(line) => {
                  setSelectedAssemblyLine(line);
                  setActiveTab('assembly-lines');
                }}
              />
            )}

            {/* Live Panel Production Table */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      Live Panel Production Registry
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sequential shop floor stage tracking, timers &amp; camera QR diagnostics
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search JC No, Panel or Line..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full rounded-xl pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Action Toolbar */}
              {selectedPanelIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>{selectedPanelIds.size} Panel Record{selectedPanelIds.size > 1 ? 's' : ''} Selected</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenBatchReport()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Batch Dossier</span>
                    </button>
                    <button
                      onClick={() => setSelectedPanelIds(new Set())}
                      className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3 w-10 text-center">
                        <button
                          onClick={() => handleToggleSelectAll(filteredPanels)}
                          className="p-0.5 hover:bg-slate-200 rounded"
                          title="Select / Deselect All Visible"
                        >
                          {selectedPanelIds.size === filteredPanels.length && filteredPanels.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Job Card No.</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Line</th>
                      <th className="py-3 px-4">Current Stage</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">Loading panel registry...</td>
                      </tr>
                    ) : filteredPanels.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">No panels match filter.</td>
                      </tr>
                    ) : (
                      filteredPanels.map((jc) => {
                        const isDone = jc.status === 'completed' || jc.status === 'dispatched';
                        const isDelayed = jc.status === 'delayed';
                        const progress = isDone ? 100 : Math.round(((jc.current_stage_idx || 0) / PRODUCTION_STAGES.length) * 100);
                        const isSelected = selectedPanelIds.has(jc.id);

                        return (
                          <tr
                            key={jc.id}
                            className={`transition ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'}`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleToggleSelectPanel(jc.id)}
                                className="p-0.5 hover:bg-slate-200 rounded"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">
                              <button
                                onClick={() => handleOpenWizard(jc.job_card_no)}
                                className="hover:underline flex items-center space-x-1"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>{jc.job_card_no}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{jc.product_name}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium">
                                {jc.assemblyLine || jc.assembly_line}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">{jc.current_stage}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-[11px] w-7 text-slate-600">{progress}%</span>
                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isDone
                                        ? 'bg-emerald-500'
                                        : isDelayed
                                        ? 'bg-amber-500'
                                        : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isDone ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  COMPLETED
                                </span>
                              ) : isDelayed ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  DELAYED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  IN PRODUCTION
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenWizard(jc.job_card_no)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition"
                                title="Update stage"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => handleOpenPanelReport(jc)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg text-xs transition inline-flex items-center space-x-1 font-semibold"
                                title="Print Official Panel Dossier"
                              >
                                <Printer className="w-3 h-3 text-slate-500" />
                                <span>Report</span>
                              </button>
                              <button
                                onClick={() => handleOpenSticker(jc)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg text-xs transition"
                                title="View & Print QR Sticker"
                              >
                                <QrCode className="w-3.5 h-3.5 inline" />
                              </button>
                              <a
                                href={`/track/${jc.job_card_no}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg text-xs transition inline-block"
                                title="Open Live Tracking URL"
                              >
                                <ExternalLink className="w-3.5 h-3.5 inline" />
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 2: JOB CARD & QR GENERATOR ================= */}
        {activeTab === 'qr-generator' && (
          <section className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Creation Form */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        Generate New Job Card & Live QR Tracking
                      </h3>
                      <p className="text-xs text-slate-500">
                        Registers panel in database and assigns unique tracking URL
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateJobCard} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Job Card No. (Serial) *</label>
                    <input
                      type="text"
                      required
                      value={formJcNo}
                      onChange={(e) => setFormJcNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer Code</label>
                    <input
                      type="text"
                      value={formCustCode}
                      onChange={(e) => setFormCustCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Registration Date *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lot Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formLotQty}
                      onChange={(e) => setFormLotQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Product Description *</label>
                    <input
                      type="text"
                      required
                      value={formProductName}
                      onChange={(e) => setFormProductName(e.target.value)}
                      placeholder="e.g. 1025 KVAR APFC Panel"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Panel Type *</label>
                    <select
                      value={formPanelType}
                      onChange={(e) => setFormPanelType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Indoor">Indoor</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="HT Panel">HT Panel</option>
                      <option value="LT Distribution">LT Distribution</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Assembly Line *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddLineModalOpen(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </button>
                    </div>
                    <select
                      value={formLine}
                      onChange={(e) => setFormLine(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      {(assemblyLines.filter((l) => l.is_active).length > 0
                        ? assemblyLines.filter((l) => l.is_active).map((l) => l.name)
                        : ASSEMBLY_LINES
                      ).map((line) => (
                        <option key={line} value={line}>
                          {line}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Supervisor Name *</label>
                    <input
                      type="text"
                      required
                      value={formSupName}
                      onChange={(e) => setFormSupName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PPC In-Charge *</label>
                    <input
                      type="text"
                      required
                      value={formPpcName}
                      onChange={(e) => setFormPpcName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2 flex justify-end space-x-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition flex items-center space-x-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Create Job Card & Generate QR</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Side Info / Fast Instructions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">QR Code Workflow</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. When you create a Job Card, an industrial barcode/QR sticker is automatically created with a direct tracking URL.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    2. Print and paste this sticker directly onto the panel enclosure on the shop floor.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    3. Anyone scanning the QR code using any native smartphone camera instantly opens the live panel tracking view.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    4. Logged-in Fitters and Supervisors can immediately update the status on floor with the step-by-step wizard.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                  Scan QR stickers anytime with normal camera or the in-app camera scanner.
                </div>
              </div>
            </div>

            {/* Registered Job Cards Registry */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Registered Job Cards ({jobCards.length})</h3>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Job Card No</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Line</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Supervisor / PPC</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {jobCards.map((jc) => (
                      <tr key={jc.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{jc.job_card_no}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{jc.product_name}</td>
                        <td className="py-2.5 px-3">{jc.assemblyLine}</td>
                        <td className="py-2.5 px-3">{jc.panel_type}</td>
                        <td className="py-2.5 px-3 text-slate-500">{jc.date}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {jc.supervisor_name} / {jc.ppc_name}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenSticker(jc)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold"
                          >
                            Sticker
                          </button>
                          <button
                            onClick={() => handleDeleteJobCard(jc)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 3: ASSEMBLY LINES (Dynamic) ================= */}
        {activeTab === 'assembly-lines' && (
          <section className="space-y-4 sm:space-y-6">
            {/* Line Selection Buttons */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Factory className="w-4 h-4 text-blue-600" />
                  <span>Assembly Workstations & Production Lines</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                    Active: {selectedAssemblyLine}
                  </span>
                  <button
                    onClick={() => setIsAddLineModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {(assemblyLines.filter((l) => l.is_active).length > 0
                  ? assemblyLines.filter((l) => l.is_active).map((l) => l.name)
                  : ASSEMBLY_LINES
                ).map((line) => {
                  const isActive = selectedAssemblyLine === line;
                  const count = jobCards.filter((j) => (j.assemblyLine || j.assembly_line) === line).length;
                  return (
                    <button
                      key={line}
                      onClick={() => setSelectedAssemblyLine(line)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{line}</div>
                      <div className={`text-[11px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {count} Panels
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Power Load & Throughput Banner */}
            {(() => {
              const linePanels = jobCards.filter((j) => (j.assemblyLine || j.assembly_line) === selectedAssemblyLine);
              const completedCount = linePanels.filter((j) => j.status === 'completed' || j.status === 'dispatched').length;
              const delayedCount = linePanels.filter((j) => j.status === 'delayed').length;
              const inProgressCount = linePanels.filter((j) => j.status === 'in_progress').length;
              const total = linePanels.length;
              const linePowerPct = total > 0 ? Math.round((completedCount / total) * 100) : 100;

              return (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                        <span>{selectedAssemblyLine} Grid Power Load</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
                          {linePowerPct}% LINE ENERGIZED
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {total} Panels Active on Floor • {completedCount} Fully Powered (Done) • {inProgressCount} Under Active Draw
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Delayed</span>
                      <strong className={delayedCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                        {delayedCount} Panels
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">In Flow</span>
                      <strong className="text-blue-600 font-bold">{inProgressCount} Active</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Panels in selected line with Inline Electric Current Running Tracker */}
            <div className="space-y-4">
              {jobCards
                .filter((j) => (j.assemblyLine || j.assembly_line) === selectedAssemblyLine)
                .map((jc) => (
                  <div
                    key={jc.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-600 text-sm">
                            {jc.job_card_no}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                            {jc.panel_type}
                          </span>
                          <span className="text-xs text-slate-500">Lot: {jc.lot_qty}</span>
                          <span className="text-xs text-slate-400">• Cust: {jc.customer_code || 'Stock'}</span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 mt-1">{jc.product_name}</h4>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenPanelReport(jc)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print Dossier</span>
                        </button>
                        <button
                          onClick={() => handleOpenSticker(jc)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          Print QR
                        </button>
                        <button
                          onClick={() => handleOpenWizard(jc.job_card_no)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Open Wizard</span>
                        </button>
                      </div>
                    </div>

                    {/* LIVE ELECTRIC CURRENT RUNNING TRACKER LINE */}
                    <ElectricCurrentTracker
                      jobCard={jc}
                      onOpenWizard={handleOpenWizard}
                      onOpenReport={handleOpenPanelReport}
                      onRefresh={loadAllData}
                    />
                  </div>
                ))}

              {jobCards.filter((j) => (j.assemblyLine || j.assembly_line) === selectedAssemblyLine).length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
                  No panels assigned to {selectedAssemblyLine}.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================= TAB 4: AUDIT TRAIL ================= */}
        {activeTab === 'audit-trail' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Enterprise Audit Log</h3>
                <p className="text-xs text-slate-500">Tamper-evident record of all stage updates and overrides</p>
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Job Card No</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{log.timestamp.substring(0, 19).replace('T', ' ')}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{log.job_card_no}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-600">{log.actor_name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= TAB 5: REWORK REGISTER ================= */}
        {activeTab === 'rework-register' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Rework & Rejection Register</h3>
                <p className="text-xs text-slate-500">Shop-floor rejection reasons, supervisor corrective actions</p>
              </div>
              <button
                onClick={() => setIsAddReworkModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Log Rework Case</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Job Card No</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Line</th>
                    <th className="py-2.5 px-3">Process Stage</th>
                    <th className="py-2.5 px-3">Re-work Reason</th>
                    <th className="py-2.5 px-3">Supervisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reworkLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">No rework cases logged.</td>
                    </tr>
                  ) : (
                    reworkLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{log.job_card_no}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.product_name}</td>
                        <td className="py-2.5 px-3">{log.assembly_line}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{log.process_name}</td>
                        <td className="py-2.5 px-3 text-amber-700 font-medium">{log.reason}</td>
                        <td className="py-2.5 px-3 text-slate-600">{log.supervisor_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= TAB 6: REPORTS & EXPORTS ================= */}
        {activeTab === 'reports' && (() => {
          const reportFilteredPanels = jobCards.filter((jc) => {
            const lineMatch = reportsFilterLine === 'all' || (jc.assemblyLine || jc.assembly_line) === reportsFilterLine;
            const statusMatch = reportsFilterStatus === 'all' || jc.status === reportsFilterStatus;
            const searchMatch =
              !reportsSearch ||
              jc.job_card_no.toLowerCase().includes(reportsSearch.toLowerCase()) ||
              jc.product_name.toLowerCase().includes(reportsSearch.toLowerCase()) ||
              (jc.customer_code || '').toLowerCase().includes(reportsSearch.toLowerCase());
            return lineMatch && statusMatch && searchMatch;
          });

          const activeLinesList =
            assemblyLines.filter((l) => l.is_active).length > 0
              ? assemblyLines.filter((l) => l.is_active).map((l) => l.name)
              : ASSEMBLY_LINES;

          return (
            <section className="space-y-6">
              {/* Batch Report Generator Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Production Reports & Batch Records Printer</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Print official individual panel dossiers, shift handover summary dockets, or batch QR stickers
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setImportExportTab('export');
                        setIsImportExportModalOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
                      title="Export or Import full application database as JSON"
                    >
                      <FileJson className="w-4 h-4" />
                      <span>Backup / JSON Transfer</span>
                    </button>

                    <button
                      onClick={() =>
                        handleOpenBatchReport(
                          selectedPanelIds.size > 0
                            ? jobCards.filter((j) => selectedPanelIds.has(j.id))
                            : reportFilteredPanels
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>
                        Print {selectedPanelIds.size > 0 ? `${selectedPanelIds.size} Selected` : `All (${reportFilteredPanels.length})`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Filter by Assembly Line</label>
                    <select
                      value={reportsFilterLine}
                      onChange={(e) => setReportsFilterLine(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="all">All Assembly Lines ({jobCards.length})</option>
                      {activeLinesList.map((line) => (
                        <option key={line} value={line}>
                          {line}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Filter by Production Status</label>
                    <select
                      value={reportsFilterStatus}
                      onChange={(e) => setReportsFilterStatus(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="all">All Statuses</option>
                      <option value="in_progress">In Production</option>
                      <option value="delayed">Delayed / Bottlenecks</option>
                      <option value="completed">Completed</option>
                      <option value="dispatched">Dispatched</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Search Panels</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search Serial, Model, Customer..."
                        value={reportsSearch}
                        onChange={(e) => setReportsSearch(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtered Panel Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Showing {reportFilteredPanels.length} Panel Record{reportFilteredPanels.length !== 1 ? 's' : ''}
                      {selectedPanelIds.size > 0 && ` (${selectedPanelIds.size} selected for printing)`}
                    </span>
                    <button
                      onClick={() => handleToggleSelectAll(reportFilteredPanels)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>
                        {selectedPanelIds.size === reportFilteredPanels.length && reportFilteredPanels.length > 0
                          ? 'Deselect All'
                          : 'Select All'}
                      </span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3 w-8 text-center">
                            <button
                              onClick={() => handleToggleSelectAll(reportFilteredPanels)}
                              className="p-0.5"
                            >
                              {selectedPanelIds.size === reportFilteredPanels.length && reportFilteredPanels.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-3">Job Card No</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Line</th>
                          <th className="py-2.5 px-3">Current Stage</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Print Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {reportFilteredPanels.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-400">
                              No panel records match filter criteria.
                            </td>
                          </tr>
                        ) : (
                          reportFilteredPanels.map((jc) => {
                            const isSelected = selectedPanelIds.has(jc.id);
                            return (
                              <tr
                                key={jc.id}
                                className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                              >
                                <td className="py-2.5 px-3 text-center">
                                  <button onClick={() => handleToggleSelectPanel(jc.id)}>
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                                  {jc.job_card_no}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {jc.product_name}
                                  <span className="block text-[10px] text-slate-500">
                                    {jc.panel_type} | Cust: {jc.customer_code || 'Internal'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">{jc.assemblyLine || jc.assembly_line}</td>
                                <td className="py-2.5 px-3">
                                  <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                                    {jc.current_stage}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      jc.status === 'completed' || jc.status === 'dispatched'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : jc.status === 'delayed'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {jc.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleOpenPanelReport(jc)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition inline-flex items-center space-x-1"
                                    title="Print Individual Panel Dossier"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Dossier</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenSticker(jc)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs transition"
                                    title="Print QR Sticker"
                                  >
                                    <QrCode className="w-3.5 h-3.5 inline" />
                                  </button>
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

              {/* Workstation Efficiency Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-slate-800">Workstation Efficiency Breakdown</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">Assembly Line</th>
                        <th className="py-2.5 px-3">Total Panels</th>
                        <th className="py-2.5 px-3">Active</th>
                        <th className="py-2.5 px-3">Completed</th>
                        <th className="py-2.5 px-3">Delays Logged</th>
                        <th className="py-2.5 px-3 text-right">Efficiency Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {analyticsData?.lineBreakdown.map((line) => (
                        <tr key={line.lineName} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{line.lineName}</td>
                          <td className="py-2.5 px-3 font-mono">{line.total}</td>
                          <td className="py-2.5 px-3 font-mono">{line.active}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">{line.completed}</td>
                          <td className="py-2.5 px-3 font-mono text-amber-600">{line.delays}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded font-bold">
                              {line.efficiency}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ================= TAB 7: TEAM PERFORMANCE (Evaluated only when requested) ================= */}
        {activeTab === 'team-performance' && <TeamPerformanceView />}

        {/* ================= TAB 8: ADMIN PORTAL ================= */}
        {activeTab === 'admin-portal' && <AdminPortalView />}
          </>
        )}
      </main>

      {/* Enterprise Copyright Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 text-slate-500 py-4 px-4 text-center text-xs shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">Synchro Electricals Pvt. Ltd.</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500">Integrated Shop-Floor Production &amp; QC Intelligence Portal</span>
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-slate-600">
            Copyright © <strong className="text-blue-600 font-bold">Industrial Dr.</strong> Prepared this app for Synchro Electricals Pvt. Ltd.
          </div>
        </div>
      </footer>
      </div>

      {/* MODALS */}

      {/* 1. Fast Stage Wizard Modal */}
      <FastStageWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        jobCard={selectedWizardJobCard}
        stages={selectedWizardStages}
        onRefresh={loadAllData}
      />

      {/* 2. QR Code Printable Sticker Modal */}
      <PrintableJobCardModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        jobCard={selectedStickerJobCard}
      />

      {/* 3. In-App Camera Scanner Modal */}
      <LiveCameraModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        jobCards={jobCards}
      />

      {/* 4. Staff Login Gateway & Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          loadAllData();
        }}
        closable={true}
      />

      {/* 5. Add Rework Modal */}
      {isAddReworkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Log Rework or Rejection</h3>
              <button
                onClick={() => setIsAddReworkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRework} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Job Card *</label>
                <select
                  required
                  value={reworkFormJc}
                  onChange={(e) => setReworkFormJc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Panel...</option>
                  {jobCards.map((jc) => (
                    <option key={jc.id} value={jc.job_card_no}>
                      {jc.job_card_no} — {jc.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Process Stage *</label>
                <select
                  value={reworkFormProcess}
                  onChange={(e) => setReworkFormProcess(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {PRODUCTION_STAGES.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rejection / Rework Reason *</label>
                <textarea
                  required
                  rows={2}
                  value={reworkFormReason}
                  onChange={(e) => setReworkFormReason(e.target.value)}
                  placeholder="Describe failure cause..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supervisor Name *</label>
                <input
                  type="text"
                  required
                  value={reworkFormSupervisor}
                  onChange={(e) => setReworkFormSupervisor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddReworkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Rework Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Individual Panel Report Modal */}
      <PrintablePanelReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        jobCard={selectedReportJobCard}
      />

      {/* 7. Batch Production Records Modal */}
      <PrintableBatchReportModal
        isOpen={isBatchReportModalOpen}
        onClose={() => setIsBatchReportModalOpen(false)}
        jobCards={batchReportCards}
      />

      {/* 8. Add Assembly Line Modal */}
      <AddAssemblyLineModal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        onSuccess={loadAllData}
        existingCount={assemblyLines.length}
      />

      {/* 9. Database Backup & JSON Import/Export Modal */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onSuccess={loadAllData}
        initialTab={importExportTab}
      />
    </div>
  );
}
