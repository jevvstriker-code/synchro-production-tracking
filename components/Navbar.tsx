'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  Zap,
  BarChart3,
  QrCode,
  Layers,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Users,
  Settings,
  Camera,
  LogOut,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openScanner: () => void;
  openLoginModal: () => void;
}

export function Navbar({ activeTab, setActiveTab, openScanner, openLoginModal }: NavbarProps) {
  const { currentUser, isLoggedIn, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'qr-generator', label: 'Job Card & QR', icon: QrCode },
    { id: 'assembly-lines', label: 'Assembly Lines', icon: Layers },
    { id: 'audit-trail', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'rework-register', label: 'Rework', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'team-performance', label: 'Team Performance', icon: Users },
    { id: 'admin-portal', label: 'Admin Portal', icon: Settings },
  ];

  return (
    <header className="bg-blue-600 text-white border-b border-blue-700 sticky top-0 z-40 shadow-md select-none print:hidden">
      <div className="w-full max-w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0"
        >
          <div className="bg-white p-2 rounded-lg text-blue-600 font-bold text-xl shadow-md flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0">
            <Zap className="w-5 h-5 fill-blue-600 text-blue-600" />
          </div>
          <div className="truncate">
            <h1 className="font-bold text-sm sm:text-base lg:text-lg leading-tight tracking-tight text-white truncate">
              Synchro Electricals Pvt. Ltd.
            </h1>
            <p className="text-[10px] text-blue-100 hidden sm:block">Industrial Production & Live QR Tracking</p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden xl:flex space-x-1 lg:space-x-1.5 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Action / Scanner & Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={openScanner}
            className="bg-white hover:bg-blue-50 text-blue-700 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition flex items-center space-x-1.5"
            title="Scan panel QR code with camera"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Scan QR</span>
          </button>

          {isLoggedIn && currentUser ? (
            <div className="flex items-center space-x-1.5 bg-blue-700/80 px-2.5 py-1.5 rounded-lg border border-blue-500">
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold leading-none">{currentUser.full_name}</div>
                <div className="text-[10px] text-blue-200 capitalize font-medium">{currentUser.role}</div>
              </div>
              <button
                onClick={logout}
                className="p-1 hover:bg-blue-800 rounded text-blue-100 hover:text-white transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="bg-blue-700 hover:bg-blue-800 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border border-blue-500 flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Staff Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="xl:hidden flex overflow-x-auto px-2 py-1.5 bg-blue-700/95 border-t border-blue-500 space-x-1 shadow-inner scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
