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
  const { currentUser, isLoggedIn, logout, isAdmin, isDeveloper, isFitter, canViewQC, canView, portalMode, setPortalMode } = useAuth();

  // Audit trail moved inside Admin Portal
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assembly-lines', label: 'Assembly Lines', icon: Layers },
    { id: 'qr-generator', label: 'Job Card & QR', icon: QrCode },
    { id: 'rework-register', label: 'Rework', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'team-performance', label: 'Team Performance', icon: Users },
    { id: 'admin-portal', label: isDeveloper ? 'Dev & Admin' : 'Admin Portal', icon: Settings },
  ];

  // Filter tabs according to Admin-configured permissions
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'admin-portal') return isAdmin;
    return canView(item.id);
  });

  return (
    <header className="bg-blue-600 text-white border-b border-blue-700 sticky top-0 z-40 shadow-sm select-none print:hidden">
      <div className="w-full max-w-full px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Official Synchro Brand Emblem */}
        <div className="flex items-center space-x-3 shrink-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            {/* Logo box */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl p-1 shadow-sm border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
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
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-sans">
                  Synchro Electricals Pvt. Ltd.
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-blue-100 font-medium">
                Industrial Production &amp; Live QR Tracking
              </p>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher (Isolated container - never overlaps logo) */}
        <div className="flex items-center justify-center shrink-0">
          {canViewQC ? (
            <div className="flex items-center bg-blue-700/80 p-1 rounded-2xl border border-blue-500/60 shadow-inner text-xs">
              {/* Production Mode Button */}
              <button
                onClick={() => {
                  setPortalMode('production');
                  setActiveTab('dashboard');
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-xs ${
                  portalMode === 'production'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600/50'
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
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-blue-100 hover:text-white hover:bg-blue-600/50'
                }`}
              >
                <Microscope className="w-3.5 h-3.5" />
                <span className="tracking-wide">QC Inspection</span>
              </button>
            </div>
          ) : isFitter ? (
            <div className="flex items-center space-x-1.5 bg-blue-700/90 px-3 sm:px-4 py-1.5 rounded-2xl border border-blue-500/60 shadow-inner text-xs font-bold text-white">
              <Factory className="w-3.5 h-3.5 text-blue-200" />
              <span>Shop Floor Station</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-blue-700/80 px-3 py-1.5 rounded-2xl border border-blue-500/60 text-xs font-bold text-white">
              <Factory className="w-3.5 h-3.5 text-blue-200" />
              <span>Production Flow</span>
            </div>
          )}
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
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-blue-100 hover:text-white hover:bg-blue-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Actions, Camera Scanner & Operator Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          {openImportExportModal && (isAdmin || canView('backup_restore')) && (
            <button
              onClick={openImportExportModal}
              className="bg-blue-700 hover:bg-blue-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-blue-500/50 shadow-xs transition flex items-center space-x-1.5"
              title="Backup and JSON Import/Export"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden md:inline">Backup</span>
            </button>
          )}

          <button
            onClick={openScanner}
            className="bg-white hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 border border-blue-200"
            title="Scan panel QR code with camera"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Scan QR</span>
          </button>

          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-2 bg-blue-700/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-500/50 shadow-xs">
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white truncate max-w-[130px]">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">
                  {currentUser.role.replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1 hover:bg-blue-600 text-blue-200 hover:text-white rounded-lg transition"
                title="Log out from console"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="bg-white hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 flex items-center space-x-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Navigation Sub-bar (for screens where top bar is full, or in Production mode) */}
      {portalMode === 'production' && (
        <div className="2xl:hidden flex overflow-x-auto px-3 py-1.5 bg-[#1e40af] border-t border-blue-500/30 space-x-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
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
