'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { jobCardService } from '@/services/jobCardService';
import { stageLogService } from '@/services/stageLogService';
import { AppUser, UserRole, AuditTrail, JobCard, StageLog, AssemblyLine, PRODUCTION_STAGES, ApprovalRequest, UserPermissions } from '@/types';
import { assemblyLineService } from '@/services/assemblyLineService';
import { approvalService } from '@/services/approvalService';
import { AddAssemblyLineModal } from '@/components/AddAssemblyLineModal';
import { ImportExportModal } from '@/components/ImportExportModal';
import {
  Settings,
  Users,
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  KeyRound,
  CheckCircle,
  XCircle,
  X,
  Search,
  Database,
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  Lock,
  Edit3,
  Factory,
  Plus,
  FileJson,
  Download,
  Upload,
  HardDriveDownload,
  HardDriveUpload,
  CheckSquare,
  ShieldAlert,
  Sliders,
  Check,
  Eye,
  Sparkles
} from 'lucide-react';

export function AdminPortalView() {
  const { currentUser, isAdmin, animationsEnabled, setAnimationsEnabled } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrail[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [assemblyLines, setAssemblyLines] = useState<AssemblyLine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userSearch, setUserSearch] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'approvals' | 'lines' | 'audit' | 'timestamps' | 'system' | 'backup'>('users');
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [approvalsFilter, setApprovalsFilter] = useState<'pending' | 'all'>('pending');
  const [actionStatusMsg, setActionStatusMsg] = useState<string | null>(null);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState<boolean>(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState<boolean>(false);
  const [importExportTab, setImportExportTab] = useState<'export' | 'import'>('export');

  // Add / Edit User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formFullName, setFormFullName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('fitter');
  const [formPin, setFormPin] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formDepartment, setFormDepartment] = useState<string>('Production');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>({
    view_dashboard: true,
    view_job_cards: true,
    view_assembly_lines: true,
    view_audit_trail: false,
    view_rework: true,
    view_reports: false,
    view_team_performance: false,
    view_qc_shop_floor: false,
    view_qc_registers: false,
    view_qc_reports: false,
    requires_admin_approval: true,
  });
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Timestamp Override Console state
  const [selectedJcNo, setSelectedJcNo] = useState<string>('');
  const [panelStages, setPanelStages] = useState<StageLog[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<JobCard | null>(null);
  const [editingStage, setEditingStage] = useState<StageLog | null>(null);
  const [overrideStartDate, setOverrideStartDate] = useState<string>('');
  const [overrideStartTime, setOverrideStartTime] = useState<string>('');
  const [overrideEndDate, setOverrideEndDate] = useState<string>('');
  const [overrideEndTime, setOverrideEndTime] = useState<string>('');
  const [overrideHours, setOverrideHours] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideStatusMsg, setOverrideStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, aLogs, jcList, linesList, reqList] = await Promise.all([
        userService.getAllUsers(),
        auditService.getAuditLogs(100),
        jobCardService.getAllJobCards(),
        assemblyLineService.getAll(),
        approvalService.getAllRequests(100),
      ]);
      setUsers(uList);
      setAuditLogs(aLogs);
      setJobCards(jcList);
      setAssemblyLines(linesList);
      setApprovalRequests(reqList);
      if (jcList.length > 0 && !selectedJcNo) {
        handleSelectJobCardForTimestamps(jcList[0].job_card_no);
      }
    } catch (e) {
      console.error('Error loading admin portal data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectJobCardForTimestamps = async (jcNo: string) => {
    setSelectedJcNo(jcNo);
    const jc = jobCards.find((j) => j.job_card_no === jcNo) || null;
    setSelectedPanel(jc);
    if (jcNo) {
      try {
        const res = await jobCardService.getJobCardWithStages(jcNo);
        if (res) {
          setPanelStages(res.stages);
        }
      } catch (e) {
        console.error('Failed to load stages for timestamp console', e);
      }
    }
  };

  const handleOpenStageOverride = (st: StageLog) => {
    setEditingStage(st);
    setOverrideStartDate(st.start_date || new Date().toISOString().substring(0, 10));
    setOverrideStartTime(st.start_time ? st.start_time.substring(0, 5) : '09:00');
    setOverrideEndDate(st.end_date || new Date().toISOString().substring(0, 10));
    setOverrideEndTime(st.end_time ? st.end_time.substring(0, 5) : '15:00');
    setOverrideHours(st.duration_hours ? String(st.duration_hours) : '2.0');
    setOverrideReason(st.admin_override_reason || '');
    setOverrideStatusMsg(null);
  };

  const handleSaveStageOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !selectedPanel) return;
    if (!overrideReason.trim()) {
      setOverrideStatusMsg('Mandatory override reason required for audit compliance.');
      return;
    }

    try {
      await stageLogService.adminOverrideStage(editingStage.id, {
        startDate: overrideStartDate,
        startTime: overrideStartTime,
        endDate: overrideEndDate,
        endTime: overrideEndTime,
        durationHours: parseFloat(overrideHours) || 1.0,
        operatorName: editingStage.operator_name || 'Admin Adjust',
        delayReason: editingStage.delay_reason || 'None',
        adminName: currentUser?.full_name || 'System Admin',
        reason: overrideReason.trim(),
      });

      await auditService.logAudit({
        job_card_no: selectedPanel.job_card_no,
        action: `Admin Override Stage: ${editingStage.stage_name}`,
        actor_name: currentUser?.full_name || 'Admin',
        actor_role: 'admin',
        details: `Reason: ${overrideReason.trim()} | Set Times: ${overrideStartDate} ${overrideStartTime} -> ${overrideEndDate} ${overrideEndTime}`,
      });

      setOverrideStatusMsg('Stage timestamps successfully overridden.');
      await handleSelectJobCardForTimestamps(selectedPanel.job_card_no);
      setTimeout(() => {
        setEditingStage(null);
      }, 1000);
    } catch (e: any) {
      console.error('Failed to save stage override', e);
      setOverrideStatusMsg(e.message || 'Error saving override.');
    }
  };

  const handleApproveRequest = async (reqId: string) => {
    try {
      await approvalService.approveRequest(reqId, currentUser?.full_name || 'Admin Manager');
      setActionStatusMsg('✓ Change request approved and successfully applied to shop floor!');
      await loadData();
      setTimeout(() => setActionStatusMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to approve request', err);
      alert('Error approving request: ' + err.message);
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    const reason = prompt('Optional reason for rejecting this change:');
    try {
      await approvalService.rejectRequest(reqId, currentUser?.full_name || 'Admin Manager', reason || 'Declined by Admin Manager');
      setActionStatusMsg('Change request declined.');
      await loadData();
      setTimeout(() => setActionStatusMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to reject request', err);
      alert('Error rejecting request: ' + err.message);
    }
  };

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setFormFullName('');
    setFormUsername('');
    setFormRole('fitter');
    setFormPin(String(Math.floor(1000 + Math.random() * 9000)));
    setFormPassword('');
    setFormPhone('');
    setFormDepartment('Production');
    setFormPermissions({
      view_dashboard: true,
      view_job_cards: true,
      view_assembly_lines: true,
      view_audit_trail: false,
      view_rework: true,
      view_reports: false,
      view_team_performance: false,
      view_qc_shop_floor: false,
      view_qc_registers: false,
      view_qc_reports: false,
      requires_admin_approval: true,
    });
    setFormMsg(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormFullName(user.full_name);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormPin(user.pin_code);
    setFormPassword(user.password || '');
    setFormPhone(user.phone || '');
    setFormDepartment(user.department || (user.role.includes('qc') ? 'Quality Assurance' : 'Production'));
    setFormPermissions(
      user.permissions || {
        view_dashboard: true,
        view_job_cards: true,
        view_assembly_lines: true,
        view_audit_trail: user.role === 'admin' || user.role === 'developer',
        view_rework: true,
        view_reports: user.role === 'admin' || user.role === 'developer',
        view_team_performance: user.role === 'admin' || user.role === 'developer',
        view_qc_shop_floor: user.role === 'admin' || user.role === 'developer' || user.role === 'qc_inspector',
        view_qc_registers: user.role === 'admin' || user.role === 'developer' || user.role === 'qc_inspector' || user.role === 'dashboard_viewer',
        view_qc_reports: user.role === 'admin' || user.role === 'developer' || user.role === 'qc_inspector' || user.role === 'dashboard_viewer',
        requires_admin_approval: user.role !== 'admin' && user.role !== 'developer',
      }
    );
    setFormMsg(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim() || !formPin.trim()) {
      setFormMsg({ text: 'Name, Username, and PIN are mandatory.', type: 'error' });
      return;
    }

    try {
      if (editingUserId) {
        await userService.updateUser(editingUserId, {
          full_name: formFullName.trim(),
          username: formUsername.toLowerCase().trim(),
          role: formRole,
          pin_code: formPin.trim(),
          password: formPassword.trim() || undefined,
          phone: formPhone.trim() || undefined,
          department: formDepartment.trim() || undefined,
          permissions: formPermissions,
        });

        await auditService.logAudit({
          job_card_no: 'SYSTEM',
          action: `Admin Updated User & Permissions: ${formUsername}`,
          actor_name: currentUser?.full_name || 'Admin',
          actor_role: 'admin',
          details: `Role: ${formRole} | Requires Approval: ${formPermissions.requires_admin_approval}`,
        });

        setFormMsg({ text: 'User & Permissions successfully updated!', type: 'success' });
      } else {
        await userService.createUser({
          full_name: formFullName.trim(),
          username: formUsername.toLowerCase().trim(),
          role: formRole,
          pin_code: formPin.trim(),
          password: formPassword.trim() || formPin.trim(),
          phone: formPhone.trim() || undefined,
          department: formDepartment.trim() || 'Production',
          permissions: formPermissions,
        });

        await auditService.logAudit({
          job_card_no: 'SYSTEM',
          action: `Admin Created User: ${formUsername}`,
          actor_name: currentUser?.full_name || 'Admin',
          actor_role: 'admin',
          details: `Role: ${formRole} | PIN: ${formPin}`,
        });

        setFormMsg({ text: 'New user successfully created!', type: 'success' });
      }

      await loadData();
      setTimeout(() => {
        setIsUserModalOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error saving user', err);
      setFormMsg({ text: err.message || 'Error saving user. Username may already exist.', type: 'error' });
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.toggleUserStatus(userId, !currentStatus);
      await loadData();
    } catch (e) {
      console.error('Failed to toggle status', e);
    }
  };

  const handleToggleLineActive = async (lineId: string, currentStatus: boolean, lineName: string) => {
    try {
      await assemblyLineService.toggleActive(lineId, currentStatus, lineName, currentUser?.full_name || 'Admin');
      await loadData();
    } catch (e) {
      console.error('Failed to toggle line status', e);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await userService.deleteUser(userId);
        await auditService.logAudit({
          job_card_no: 'SYSTEM',
          action: `Admin Deleted User: ${username}`,
          actor_name: currentUser?.full_name || 'Admin',
          actor_role: 'admin',
          details: `User ID: ${userId}`,
        });
        await loadData();
      } catch (e) {
        console.error('Failed to delete user', e);
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner matching reference image media_1795681443609_b2bacabc.png */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Enterprise Admin Portal
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Manager Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Fitter &amp; Supervisor credentials, access PINs, tamper-evident audit logs &amp; timestamp overrides
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Opening & Welcome Animations Toggle Switch */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
            <Sparkles className={`w-4 h-4 ${animationsEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Animation FX</span>
              <span className="text-[11px] font-bold text-slate-700">
                {animationsEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !animationsEnabled;
                setAnimationsEnabled(next);
                setActionStatusMsg(next ? '✓ System Opening & Welcome Animations Turned ON!' : '✓ Fast Floor Mode: Opening & Welcome Animations Turned OFF.');
                setTimeout(() => setActionStatusMsg(null), 3500);
              }}
              className={`ml-1 relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                animationsEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              title="Toggle splash intro and welcome celebration quotes"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  animationsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 shadow-xs transition"
            title="Refresh Admin Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setImportExportTab('export');
              setIsImportExportModalOpen(true);
            }}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 border border-indigo-200"
            title="Backup and JSON Import/Export"
          >
            <FileJson className="w-4 h-4" />
            <span>JSON Backup / Restore</span>
          </button>
          <button
            onClick={handleOpenAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {actionStatusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionStatusMsg}</span>
        </div>
      )}

      {/* Admin Tab Selector matching reference image pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'approvals'
              ? 'bg-blue-600 text-white shadow-xs'
              : approvalRequests.filter((r) => r.status === 'pending').length > 0
              ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Manager Approvals Queue</span>
          {approvalRequests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {approvalRequests.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveAdminTab('lines')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'lines'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Assembly Lines ({assemblyLines.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('timestamps')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'timestamps'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timestamp Correction Console</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security &amp; Activity Audit ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'backup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <HardDriveDownload className="w-4 h-4" />
          <span>Backup &amp; Restore (JSON)</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'system'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase Schema Info</span>
        </button>
      </div>

      {/* Tab 1: Staff User Management */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Active Fitters, Supervisors &amp; PPC Directory
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, role or username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-slate-800 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Mobile Quick PIN</th>
                  <th className="py-3 px-4">Phone No</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">Loading accounts...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">No staff accounts match search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">@{u.username}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block border ${
                            u.role === 'developer' || u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'qc_inspector'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : u.role === 'dashboard_viewer'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : u.role === 'supervisor'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : u.role === 'fitter'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {u.pin_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {u.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleUserActive(u.id, u.is_active)}
                          className="flex items-center space-x-1 font-semibold"
                        >
                          {u.is_active ? (
                            <span className="text-emerald-600 flex items-center">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition"
                          title="Edit User & Permissions"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Manager Approvals Queue */}
      {activeAdminTab === 'approvals' && (
        <div className="cyber-card rounded-2xl p-4 sm:p-5 shadow-xl border border-cyan-500/25 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                <span>Shop Floor Manager Approvals Queue</span>
                {approvalRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">
                    {approvalRequests.filter((r) => r.status === 'pending').length} PENDING
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve stage completions, job card creations, and rework incidents submitted by fitters and supervisors.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setApprovalsFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                  approvalsFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Pending ({approvalRequests.filter((r) => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setApprovalsFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                  approvalsFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All History ({approvalRequests.length})
              </button>
            </div>
          </div>

          {/* Requests List */}
          {(() => {
            const filteredRequests = approvalRequests.filter((r) =>
              approvalsFilter === 'pending' ? r.status === 'pending' : true
            );

            if (filteredRequests.length === 0) {
              return (
                <div className="py-12 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {approvalsFilter === 'pending'
                      ? 'ALL CAUGHT UP! NO PENDING APPROVALS'
                      : 'NO APPROVAL REQUESTS FOUND'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When operators or supervisors submit stage updates or new job cards, they will appear here for Admin Manager sign-off.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`border rounded-2xl p-4 sm:p-5 transition shadow-xs ${
                      req.status === 'pending'
                        ? 'bg-amber-50/50 border-amber-200'
                        : req.status === 'approved'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            req.request_type === 'stage_update'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : req.request_type === 'job_card_create'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.request_type.replace('_', ' ')}
                        </span>
                        <span className="font-mono font-bold text-xs text-blue-600">
                          {req.job_card_no}
                        </span>
                        {req.panel_name && (
                          <span className="text-xs font-semibold text-slate-700">
                            • {req.panel_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 font-mono">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {req.created_at ? new Date(req.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                    </div>

                    <div className="py-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">SUBMITTED BY:</span>
                        <span className="font-bold text-slate-900">{req.requester_name}</span>{' '}
                        <span className="capitalize text-blue-600 font-medium">({req.requester_role})</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">DETAILS / STAGE:</span>
                        <span className="font-semibold text-slate-800">
                          {req.stage_name || req.request_type}
                        </span>
                        {req.action_payload?.operatorName && (
                          <span className="text-slate-500 block text-[11px]">
                            Operator: {req.action_payload.operatorName} | Delay: {req.action_payload.delayReason || 'None'}
                          </span>
                        )}
                        {req.action_payload?.reason && (
                          <span className="text-slate-500 block text-[11px]">
                            Rework Reason: {req.action_payload.reason}
                          </span>
                        )}
                      </div>
                    </div>

                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold transition shadow-2xs"
                        >
                          ✕ DECLINE
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>APPROVE &amp; APPLY</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>
                          Reviewed by <strong className="text-slate-800">{req.reviewed_by}</strong> ({req.admin_notes || 'Approved'})
                        </span>
                        <span>{req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Assembly Lines Management */}
      {activeAdminTab === 'lines' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Factory className="w-4 h-4 text-blue-600" />
                <span>Shop Floor Assembly Lines &amp; Workstations</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure manufacturing lines, capacities, and active floor routing
              </p>
            </div>
            <button
              onClick={() => setIsAddLineModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Assembly Line</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Line Name</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Supervisor</th>
                  <th className="py-2.5 px-4">Capacity</th>
                  <th className="py-2.5 px-4">Active Panels</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assemblyLines.map((line) => {
                  const linePanels = jobCards.filter(
                    (j) => (j.assemblyLine || j.assembly_line) === line.name
                  );
                  const activeCount = linePanels.filter(
                    (j) => j.status === 'in_progress' || j.status === 'delayed'
                  ).length;

                  return (
                    <tr key={line.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{line.name}</td>
                      <td className="py-3 px-4 font-mono text-blue-600 font-semibold">{line.line_code || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{line.supervisor_name || 'General Supervisor'}</td>
                      <td className="py-3 px-4 font-mono">{line.capacity || 10} panels</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{activeCount}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleLineActive(line.id, line.is_active, line.name)}
                          className="flex items-center space-x-1 font-semibold"
                        >
                          {line.is_active ? (
                            <span className="text-emerald-600 flex items-center">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleLineActive(line.id, line.is_active, line.name)}
                          className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
                        >
                          {line.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Timestamp Correction Console (Admin Privilege) */}
      {activeAdminTab === 'timestamps' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Stage Timestamp Correction &amp; Override Console</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Only system administrators can adjust historical stage timestamps with mandatory audit justification
              </p>
            </div>

            {/* Panel Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-500">SELECT PANEL:</label>
              <select
                value={selectedJcNo}
                onChange={(e) => handleSelectJobCardForTimestamps(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                {jobCards.map((j) => (
                  <option key={j.id} value={j.job_card_no}>
                    {j.job_card_no} — {j.product_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPanel && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-700 gap-2">
              <div>
                <span className="text-slate-400">Job Card:</span>{' '}
                <strong className="text-blue-600 font-mono">{selectedPanel.job_card_no}</strong> •{' '}
                <strong className="text-slate-900">{selectedPanel.product_name}</strong>
              </div>
              <div>
                <span className="text-slate-400">Line:</span>{' '}
                <strong className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-medium">
                  {selectedPanel.assemblyLine}
                </strong>{' '}
                • <span className="text-slate-400">Status:</span>{' '}
                <strong className="capitalize text-emerald-600">{selectedPanel.status}</strong>
              </div>
            </div>
          )}

          {/* 11 Stages Timestamp Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Stage # &amp; Name</th>
                  <th className="py-2.5 px-3">Start Timestamp</th>
                  <th className="py-2.5 px-3">End Timestamp</th>
                  <th className="py-2.5 px-3">Duration (Hrs)</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {panelStages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">Loading stage logs...</td>
                  </tr>
                ) : (
                  panelStages.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {idx + 1}. {st.stage_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {st.start_date ? `${st.start_date} ${st.start_time || ''}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {st.end_date ? `${st.end_date} ${st.end_time || ''}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                        {st.duration_display || (st.duration_hours ? `${st.duration_hours}h` : '—')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{st.operator_name || '—'}</td>
                      <td className="py-2.5 px-3">
                        {st.is_admin_override ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            OVERRIDDEN
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            CLOCK AUTO
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenStageOverride(st)}
                          className="bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1 shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3 text-blue-500" />
                          <span>Override</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Admin Override Modal Expansion */}
          {editingStage && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span>Override: {editingStage.stage_name}</span>
                  </h3>
                  <button onClick={() => setEditingStage(null)} className="text-slate-400 hover:text-slate-700 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {overrideStatusMsg && (
                  <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-xl font-medium">
                    {overrideStatusMsg}
                  </div>
                )}

                <form onSubmit={handleSaveStageOverride} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Start Date &amp; Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={overrideStartDate}
                        onChange={(e) => setOverrideStartDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                      />
                      <input
                        type="time"
                        value={overrideStartTime}
                        onChange={(e) => setOverrideStartTime(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">End Date &amp; Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={overrideEndDate}
                        onChange={(e) => setOverrideEndDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                      />
                      <input
                        type="time"
                        value={overrideEndTime}
                        onChange={(e) => setOverrideEndTime(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Calculated Duration Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={overrideHours}
                      onChange={(e) => setOverrideHours(e.target.value)}
                      className="bg-white border border-slate-200 w-full rounded-xl p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Override Justification (Required for Audit Trail) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g., Fitter forgot to clock in after lunch break; confirmed by supervisor."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="bg-white border border-slate-200 w-full rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingStage(null)}
                      className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                    >
                      Save Override
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Activity Audit Trail */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Tamper-Evident System Audit Trail</span>
            </h3>
            <span className="text-xs text-slate-500">Latest 100 entries</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Job Card No</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{log.timestamp.substring(0, 19).replace('T', ' ')}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{log.job_card_no}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.actor_name} <span className="text-blue-600 font-medium">({log.actor_role})</span></td>
                    <td className="py-2.5 px-4 text-slate-500">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Data Backup & JSON Transfer */}
      {activeAdminTab === 'backup' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <HardDriveDownload className="w-5 h-5 text-blue-600" />
                <span>Database Backup &amp; JSON Data Portability</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Take comprehensive snapshots of currently working data or import external JSON datasets into PostgreSQL.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setImportExportTab('export');
                  setIsImportExportModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>EXPORT JSON</span>
              </button>
              <button
                onClick={() => {
                  setImportExportTab('import');
                  setIsImportExportModalOpen(true);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>IMPORT JSON</span>
              </button>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl border border-blue-200 shadow-2xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Database JSON Export</h4>
                  <p className="text-[11px] text-slate-500">Download snapshot of all active tables</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates a standardized JSON backup with metadata, timestamp, and table records for Job Cards, Stage Logs, Staff, Assembly Lines, and Audit logs.
              </p>
              <button
                onClick={() => {
                  setImportExportTab('export');
                  setIsImportExportModalOpen(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>LAUNCH EXPORT CONSOLE</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-200 shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Database JSON Import</h4>
                  <p className="text-[11px] text-slate-500">Restore or load data from JSON files</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload a JSON backup or dataset. Supports safe Merge &amp; Upsert, Append Only, or Clean Replace with foreign key dependency ordering.
              </p>
              <button
                onClick={() => {
                  setImportExportTab('import');
                  setIsImportExportModalOpen(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>LAUNCH IMPORT CONSOLE</span>
              </button>
            </div>
          </div>

          {/* Current Database Summary Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Live Database Table Telemetry Counts
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-blue-600 font-mono">{jobCards.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Job Cards / Panels</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-indigo-600 font-mono">{assemblyLines.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Assembly Lines</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-purple-600 font-mono">{users.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Staff Accounts</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-emerald-600 font-mono">{auditLogs.length}</div>
                <div className="text-[11px] font-semibold text-slate-500">Audit Logs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System / Database Info */}
      {activeAdminTab === 'system' && (
        <div className="space-y-4">
          {/* Visual Animations Preference Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Application Animations &amp; Celebration Experience</h3>
                  <p className="text-xs text-slate-500">
                    Control opening splash intro, celebration welcome animations, and floor quotes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = !animationsEnabled;
                  setAnimationsEnabled(next);
                  setActionStatusMsg(next ? '✓ System Opening & Welcome Animations Enabled!' : '✓ Fast Floor Mode: Opening & Welcome Animations Disabled.');
                  setTimeout(() => setActionStatusMsg(null), 3500);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border shadow-2xs ${
                  animationsEnabled
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{animationsEnabled ? 'Status: ANIMATIONS ACTIVE (ON)' : 'Status: ANIMATIONS DISABLED (OFF)'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div><strong className="text-blue-600">ANIMATIONS ON:</strong> Displays the sleek opening energy splash, workspace transition, and post-login celebration docket with operator name and industrial quote.</div>
              <div><strong className="text-amber-600">ANIMATIONS OFF (Fast Mode):</strong> Bypasses all visual delays, opening directly to workspace controls for maximum efficiency on shop-floor tablets.</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Database &amp; Schema Isolation Status</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
              <div className="font-bold text-blue-600">Connected PostgreSQL Engine:</div>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                Host: db.eicforalejjzquoucbxp.supabase.co<br />
                Schema: synchro_production_tracking (Dedicated Schema Isolated)<br />
                RLS: Enabled on all tables<br />
                Tables: job_cards, stage_logs, staff_users, assembly_lines, rework_logs, audit_trails, approval_requests, qc_logs, qc_records, qc_reworks
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{editingUserId ? 'Edit Staff Account' : 'Register New Staff Member'}</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-sm text-blue-600 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                  >
                    <option value="developer">Developer Master (Full Access)</option>
                    <option value="admin">Admin Manager</option>
                    <option value="qc_inspector">QC Inspector</option>
                    <option value="dashboard_viewer">Operations / QC Viewer</option>
                    <option value="supervisor">Production Supervisor</option>
                    <option value="fitter">Fitter / Operator</option>
                    <option value="ppc">PPC In-Charge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Assurance or Production"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile 4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="••••"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-slate-800 focus:outline-none focus:border-blue-500 font-bold shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password / Secret {editingUserId && '(leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="bg-white border border-slate-200 w-full rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Manager Access & Permissions Control */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Manager Access &amp; Permissions Control</span>
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                    Admin Manager
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <label className="flex items-start space-x-2 cursor-pointer bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.requires_admin_approval}
                      onChange={(e) =>
                        setFormPermissions({
                          ...formPermissions,
                          requires_admin_approval: e.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-amber-900">
                        Require Admin Approval For All Updates
                      </span>
                      <p className="text-[10px] text-amber-700/80">
                        When enabled, any stage completions or changes by this person go to Admin Manager approval queue first.
                      </p>
                    </div>
                  </label>

                  <div className="text-[11px] font-semibold text-slate-500 pt-1">
                    Allowed View Sections:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'view_dashboard', label: 'Dashboard & Analytics' },
                      { key: 'view_job_cards', label: 'Job Cards & QR' },
                      { key: 'view_assembly_lines', label: 'Assembly Lines' },
                      { key: 'view_rework', label: 'Rework Register' },
                      { key: 'view_reports', label: 'Production Reports' },
                      { key: 'view_team_performance', label: 'Team Telemetry' },
                      { key: 'view_audit_trail', label: 'Audit Trail' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formPermissions[item.key as keyof UserPermissions]}
                          onChange={(e) =>
                            setFormPermissions({
                              ...formPermissions,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-700 text-[11px]">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {editingUserId ? 'SAVE CHANGES' : 'CREATE STAFF MEMBER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assembly Line Modal */}
      <AddAssemblyLineModal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        onSuccess={loadData}
        existingCount={assemblyLines.length}
      />

      {/* Database Backup & JSON Import/Export Modal */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onSuccess={loadData}
        initialTab={importExportTab}
      />
    </div>
  );
}
