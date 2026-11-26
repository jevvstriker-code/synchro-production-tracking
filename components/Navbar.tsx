'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import {
  Zap,
  BarChart3,
  QrCode,
  Layers,
  AlertTriangle,
  FileText,
  Users,
  Settings,
  Camera,
  LogOut,
  UserCheck,
  FileJson,
  Microscope,
  Factory,
  Cpu,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openScanner: () => void;
  openLoginModal: () => void;
  openImportExportModal?: () => void;
}

export function Navbar({ activeTab, setActiveTab, openScanner, openLoginModal, openImportExportModal }: NavbarProps) {
  const { currentUser, isLoggedIn, logout, isAdmin, isDeveloper, canView, portalMode, setPortalMode } = useAuth();

  // Audit trail moved inside Admin Portal
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'qr-generator', label: 'Job Card & QR', icon: QrCode },
    { id: 'assembly-lines', label: 'Assembly Lines', icon: Layers },
    { id: 'rework-register', label: 'Rework', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'team-performance', label: 'Team Telemetry', icon: Users },
    { id: 'admin-portal', label: isDeveloper ? 'Dev & Admin' : 'Admin Portal', icon: Settings },
  ];

  // Filter tabs according to Admin-configured permissions
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'admin-portal') return isAdmin;
    return canView(item.id);
  });

  return (
    <header className="bg-[#070b14]/95 text-white border-b border-cyan-500/25 sticky top-0 z-40 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] select-none print:hidden">
      <div className="w-full max-w-full px-3 sm:px-5 lg:px-7 h-16 flex items-center justify-between gap-3">
        {/* Left: Official Synchro Brand & Holographic Status */}
        <div className="flex items-center space-x-3 shrink-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            {/* Logo box with cyan glow */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white/95 rounded-xl p-1 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition duration-300">
              <Image
                src="/synchro-logo.png"
                alt="Synchro Logo"
                width={36}
                height={36}
                className="object-contain w-full h-full rounded-lg"
                priority
              />
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm sm:text-base tracking-wider text-white uppercase font-mono">
                  SYNCHRO
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-bold hidden sm:inline">
                  CORE v2.5
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-cyan-400/70 font-mono tracking-widest uppercase hidden sm:block">
                Operations &amp; QC Grid
              </p>
            </div>
          </div>
        </div>

        {/* Center: Futuristic Mode Switcher (Clean, distinct, never overlapping) */}
        <div className="flex items-center justify-center shrink-0">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-xs">
            {/* Production Mode Button */}
            <button
              onClick={() => {
                setPortalMode('production');
                setActiveTab('dashboard');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-xs ${
                portalMode === 'production'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span className="tracking-wide">Production</span>
            </button>

            {/* QC Mode Button */}
            <button
              onClick={() => {
                setPortalMode('qc');
                setActiveTab('qc-management');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-xs ${
                portalMode === 'qc'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span className="tracking-wide">QC Inspection</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs (when in Production Mode and screen is wide) */}
        {portalMode === 'production' && (
          <nav className="hidden 2xl:flex items-center space-x-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Actions, Camera Scanner & Operator Holographic Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          {openImportExportModal && (isAdmin || canView('backup_restore')) && (
            <button
              onClick={openImportExportModal}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 shadow-sm transition flex items-center space-x-1.5"
              title="Backup and JSON Import/Export"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-mono">BACKUP</span>
            </button>
          )}

          <button
            onClick={openScanner}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex items-center space-x-1.5 border border-cyan-400/40"
            title="Scan panel QR code with camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="font-mono">SCAN QR</span>
          </button>

          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-900/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-inner">
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                  {currentUser.full_name}
                </div>
                <div className="text-[9px] text-cyan-400 font-mono uppercase tracking-wider">
                  [{currentUser.role.replace(/_/g, ' ')}]
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
                title="Log out from console"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/40 flex items-center space-x-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Navigation Sub-bar (for screens where top bar is full, or in Production mode) */}
      {portalMode === 'production' && (
        <div className="2xl:hidden flex overflow-x-auto px-3 py-1.5 bg-[#0a0f1d] border-t border-cyan-500/15 space-x-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
