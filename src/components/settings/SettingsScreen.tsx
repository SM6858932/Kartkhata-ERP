import React, { useState, useEffect } from 'react';
import { User, Vendor } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Settings, Moon, Sun, Monitor, FileText, Shield, Info, MessageCircle, Star,
  Building2, ChevronRight, Mail, Phone
} from 'lucide-react';

interface SettingsScreenProps {
  currentUser: User;
  vendors: Vendor[];
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  vendors,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
    isDark ? 'dark' : 'light'
  );

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  };

  const menuItems = [
    {
      icon: <FileText className="w-4 h-4 text-sky-400" />,
      label: 'Terms & Conditions',
      onClick: () => {},
    },
    {
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      label: 'Privacy Policy',
      onClick: () => {},
    },
    {
      icon: <Info className="w-4 h-4 text-indigo-400" />,
      label: 'About Us',
      subtitle: 'CartKhata ERP v1.0.0',
      onClick: () => {},
    },
    {
      icon: <MessageCircle className="w-4 h-4 text-purple-400" />,
      label: 'Contact Developer',
      subtitle: 'support@cartkhata.com',
      onClick: () => window.location.href = 'mailto:support@cartkhata.com',
    },
    {
      icon: <Star className="w-4 h-4 text-amber-400" />,
      label: 'Rate & Review on Play Store',
      onClick: () => window.open('https://play.google.com/store/apps/details?id=com.cartkhata.rentmanager', '_blank'),
    },
  ];

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black font-outfit text-slate-900 dark:text-white">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">App preferences & information</p>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Appearance</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map(mode => {
            const isActive = themeMode === mode;
            const icons = { light: Sun, dark: Moon, system: Monitor };
            const Icon = icons[mode];
            const labels = { light: 'Light', dark: 'Dark', system: 'System' };
            return (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{labels[mode]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{item.label}</p>
                {item.subtitle && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.subtitle}</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        ))}
      </div>

      {/* Lead Capture Card */}
      <div className="p-4 rounded-2xl border bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 dark:from-orange-950/60 dark:to-amber-950/60 dark:border-orange-500/30">
        <div className="flex items-center gap-2 text-orange-400 font-bold mb-2">
          <Building2 className="w-4 h-4" />
          <span className="text-sm">List your agency's ERP with us</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
          Got a food cart network? Let us help you digitize operations with a custom CartKhata instance.
        </p>
        <a
          href="mailto:support@cartkhata.com?subject=ERP%20Partnership%20Inquiry"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-orange-600/20 transition hover:from-orange-500 hover:to-amber-500"
        >
          <Mail className="w-4 h-4" />
          Send Inquiry
        </a>
      </div>

      {/* User Info Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Signed in as <span className="font-semibold text-slate-600 dark:text-slate-300">{currentUser.name}</span>
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {currentUser.email || currentUser.phone} · {currentUser.role}
        </p>
      </div>
    </div>
  );
};
