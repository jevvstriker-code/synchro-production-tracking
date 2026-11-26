'use client';

import React from 'react';
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
  Sparkles
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

  // Audit trail moved to inside of Admin Portal per user requirement
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'qr-generator', label: 'Job Card & QR', icon: QrCode },
    { id: 'assembly-lines', label: 'Assembly Lines', icon: Layers },
    { id: 'rework-register', label: 'Rework', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'team-performance', label: 'Team Performance', icon: Users },
    { id: 'admin-portal', label: isDeveloper ? 'Dev & Admin Portal' : 'Admin Portal', icon: Settings },
  ];

  // Filter tabs according to Admin-configured permissions
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'admin-portal') return isAdmin;
    return canView(item.id);
  });

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white border-b border-blue-800 sticky top-0 z-40 shadow-lg select-none print:hidden">
      <div className="w-full max-w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 min-w-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0"
          >
            <div className="bg-white p-2 rounded-xl text-blue-600 font-bold text-xl shadow-md flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0">
              <Zap className="w-5 h-5 fill-blue-600 text-blue-600" />
            </div>
            <div className="truncate">
              <h1 className="font-extrabold text-sm sm:text-base lg:text-lg leading-tight tracking-tight text-white truncate flex items-center space-x-1.5">
                <span>Synchro Electricals</span>
                <span className="text-[10px] bg-blue-500/50 px-1.5 py-0.5 rounded font-mono hidden md:inline">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-blue-200 hidden sm:block">Industrial Production &amp; QC Management</p>
            </div>
          </div>

          {/* Portal Switcher Pill: Production vs QC */}
          <div className="hidden lg:flex items-center bg-blue-900/60 p-1 rounded-2xl border border-blue-400/40 text-xs ml-2 shadow-inner">
            <button
              onClick={() => {
                setPortalMode('production');
                setActiveTab('dashboard');
              }}
              className={`px-3 py-1 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                portalMode === 'production'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Production</span>
            </button>

            <button
              onClick={() => {
                setPortalMode('qc');
                setActiveTab('qc-management');
              }}
              className={`px-3 py-1 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                portalMode === 'qc'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>QC Inspection</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs (when in Production Mode) */}
        {portalMode === 'production' && (
          <nav className="hidden xl:flex space-x-1 lg:space-x-1.5 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-blue-100 hover:bg-blue-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Quick Action / Scanner, Backup & Auth */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Mobile Portal Mode Toggle */}
          <div className="lg:hidden flex items-center bg-blue-900/60 p-0.5 rounded-xl border border-blue-400/40 text-[10px]">
            <button
              onClick={() => {
                setPortalMode('production');
                setActiveTab('dashboard');
              }}
              className={`px-2 py-1 rounded-lg font-bold ${
                portalMode === 'production' ? 'bg-white text-blue-700 shadow' : 'text-blue-200'
              }`}
            >
              PROD
            </button>
            <button
              onClick={() => {
                setPortalMode('qc');
                setActiveTab('qc-management');
              }}
              className={`px-2 py-1 rounded-lg font-bold ${
                portalMode === 'qc' ? 'bg-indigo-500 text-white shadow' : 'text-blue-200'
              }`}
            >
              QC
            </button>
          </div>

          {openImportExportModal && (isAdmin || canView('backup_restore')) && (
            <button
              onClick={openImportExportModal}
              className="bg-blue-800 hover:bg-blue-900 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border border-blue-500 shadow transition flex items-center space-x-1.5"
              title="Backup and JSON Import/Export"
            >
              <FileJson className="w-4 h-4 text-blue-200" />
              <span className="hidden sm:inline">Backup / JSON</span>
            </button>
          )}

          <button
            onClick={openScanner}
            className="bg-white hover:bg-blue-50 text-blue-700 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow transition flex items-center space-x-1.5"
            title="Scan panel QR code with camera"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Scan QR</span>
          </button>

          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-2 bg-blue-900/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-400/50 shadow-inner">
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold leading-none text-white">
                  Welcome, {currentUser.full_name}
                </div>
                <div className="text-[10px] text-blue-200 capitalize font-medium flex items-center space-x-1 mt-0.5">
                  <span>{currentUser.role.replace(/_/g, ' ')}</span>
                  <span>•</span>
                  <span>{currentUser.department || 'Production'}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1 hover:bg-blue-800 rounded-lg text-blue-200 hover:text-white transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="bg-blue-800 hover:bg-blue-900 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border border-blue-500 flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Staff Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Sub-bar (for Production mode) */}
      {portalMode === 'production' && (
        <div className="xl:hidden flex overflow-x-auto px-2 py-1.5 bg-blue-800/95 border-t border-blue-600 space-x-1 shadow-inner scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
