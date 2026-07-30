import React from 'react';
import { User, Vendor } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import {
  X,
  UserCheck,
  ShieldCheck,
  Building2,
  FileText,
  Lock,
  Star,
  MessageCircle,
  LogOut,
  Moon,
  Sun,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AppDrawerProps {
  isOpen: boolean;
  currentUser: User;
  vendors?: Vendor[];
  onClose: () => void;
  onLogout: () => void;
  onOpenPartnerWithUs: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenStaffManager?: () => void;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  currentUser,
  vendors = [],
  onClose,
  onLogout,
  onOpenPartnerWithUs,
  onOpenPrivacyPolicy,
  onOpenStaffManager
}) => {
  const { isDark, toggleTheme, theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 backdrop-blur-sm transition-opacity bg-black/30 dark:bg-slate-950/80"
      />

      {/* Drawer Card */}
      <aside className="relative w-full max-w-xs border-l h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto theme-transition bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          {/* Header Profile Section */}
          <div className="p-5 border-b bg-gradient-to-br from-slate-50 to-white border-slate-200 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold shadow-md">
                  🛒
                </div>
                <div>
                  <h2 className="font-extrabold text-sm font-outfit text-slate-900 dark:text-white">
                    CartKhata ERP
                  </h2>
                  <span className="text-[10px] text-orange-400 font-mono">v1.0.0 (API 26-36)</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center border bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Session Badge */}
            <div className="border rounded-xl p-3 flex items-center gap-3 bg-slate-50 border-slate-200 dark:bg-slate-900/90 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                  {currentUser.name}
                </h4>
                <p className="text-[10px] truncate text-slate-500 dark:text-slate-400">
                  {currentUser.email || currentUser.phone}
                </p>
                <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-orange-500/20 text-orange-300 mt-1">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation & Settings Options */}
          <div className="p-4 space-y-4 text-xs">
            {/* Quick Actions Group */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 text-slate-500 dark:text-slate-400">
                Settings &amp; App Info
              </span>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2.5 rounded-xl transition hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800/60 dark:text-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  {isDark ? (
                    <Moon className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                  <span>Appearance / Mode</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md border bg-amber-50 border-amber-200 text-amber-700 dark:bg-slate-800 dark:border-slate-700 dark:text-orange-300">
                  {isDark ? '🌙 Dark' : '☀️ Light'}
                </span>
              </button>

              {/* Privacy Policy */}
              <button
                onClick={() => {
                  onClose();
                  onOpenPrivacyPolicy();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl transition hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Privacy Policy &amp; Data Deletion</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>

              {/* Terms & Conditions */}
              <button
                onClick={() => {
                  onClose();
                  onOpenPrivacyPolicy();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl transition hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Terms of Service</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>

              {/* Rate & Review */}
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl transition hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Rate &amp; Review on Play Store</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </a>

              {/* Contact Developer */}
              <a
                href="mailto:support@cartkhata.com"
                className="flex items-center justify-between p-2.5 rounded-xl transition hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-purple-400" />
                  <span>Contact Developer Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </a>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Enterprise Lead Generation Card */}
            <div className="border p-3.5 rounded-2xl space-y-2 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 dark:bg-gradient-to-br dark:from-orange-950/60 dark:to-amber-950/60 dark:border-orange-500/30">
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <Building2 className="w-4 h-4" />
                <span>Partner with Us</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Need a custom Mobile App, Website, or ERP system for your food cart network?
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenPartnerWithUs();
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-orange-600/20 transition active:scale-95"
              >
                Request Franchise Solution
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer: Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full font-bold py-2.5 rounded-xl border flex items-center justify-center gap-2 transition bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 border-slate-300 hover:border-rose-300 dark:bg-slate-800 dark:hover:bg-rose-600/20 dark:hover:text-rose-400 dark:text-slate-300 dark:border-slate-700 dark:hover:border-rose-500/40"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
