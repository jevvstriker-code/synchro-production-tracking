'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { AppUser, UserRole, AuditTrail } from '@/types';
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
  Lock
} from 'lucide-react';

export function AdminPortalView() {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userSearch, setUserSearch] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'audit' | 'system'>('users');

  // Add / Edit User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formFullName, setFormFullName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('fitter');
  const [formPin, setFormPin] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, aLogs] = await Promise.all([
        userService.getAllUsers(),
        auditService.getAuditLogs(100),
      ]);
      setUsers(uList);
      setAuditLogs(aLogs);
    } catch (e) {
      console.error('Error loading admin portal data', e);
    } finally {
      setIsLoading(false);
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
    setFormMsg(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormFullName(user.full_name);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormPin(user.pin_code);
    setFormPassword('');
    setFormPhone(user.phone || '');
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
          phone: formPhone.trim() || undefined,
        });

        await auditService.logAudit({
          job_card_no: 'SYSTEM',
          action: `Admin Updated User: ${formUsername}`,
          actor_name: currentUser?.full_name || 'Admin',
          actor_role: 'admin',
          details: `Role: ${formRole} | PIN: ${formPin}`,
        });

        setFormMsg({ text: 'User successfully updated!', type: 'success' });
      } else {
        await userService.createUser({
          full_name: formFullName.trim(),
          username: formUsername.toLowerCase().trim(),
          role: formRole,
          pin_code: formPin.trim(),
          password: formPassword.trim() || formPin.trim(),
          phone: formPhone.trim() || undefined,
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
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Enterprise Admin Portal
            </h2>
            <p className="text-xs text-slate-500">
              Manage Fitter & Supervisor credentials, access PINs, tamper-evident audit logs & database health
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Admin Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Selector */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'audit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Activity Audit ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeAdminTab === 'system'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase Schema Info</span>
        </button>
      </div>

      {/* Tab 1: Staff User Management */}
      {activeAdminTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900">
              Active Fitters, Supervisors & PPC Directory
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, role or username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
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
                    <td colSpan={7} className="text-center py-6 text-slate-400">Loading accounts...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">No staff accounts match search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.full_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">@{u.username}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'supervisor'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'fitter'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {u.pin_code}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{u.phone || '—'}</td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition"
                          title="Edit User"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition"
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

      {/* Tab 2: Activity Audit Trail */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Tamper-Evident System Audit Trail</h3>
            <span className="text-xs text-slate-400">Latest 100 entries</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Job Card No</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{log.timestamp.substring(0, 19).replace('T', ' ')}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{log.job_card_no}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.actor_name} ({log.actor_role})</td>
                    <td className="py-2.5 px-4 text-slate-500">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System / Database Info */}
      {activeAdminTab === 'system' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Database & Schema Isolation Status</h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
            <div className="font-bold">Connected PostgreSQL Engine:</div>
            <div className="font-mono text-[11px] bg-white p-2.5 rounded-lg border border-blue-200">
              Host: db.eicforalejjzquoucbxp.supabase.co<br />
              Schema: synchro_production_tracking (Dedicated Schema Isolated)<br />
              RLS: Enabled on all tables<br />
              Tables: app_users, job_cards, stage_logs, rework_logs, audit_trail
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="fitter">Fitter / Operator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="ppc">PPC In-Charge</option>
                    <option value="admin">System Admin</option>
                  </select>
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
                    placeholder="1234"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {!editingUserId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (Optional - defaults to PIN)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  {editingUserId ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
