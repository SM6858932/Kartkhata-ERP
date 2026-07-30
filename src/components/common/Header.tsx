import React from 'react';
import { User } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, Sun, Moon, ShoppingCart } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onOpenDrawer: () => void;
  onOpenStaffManager: () => void;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenDrawer,
  unreadNotifCount,
  onOpenNotifications,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b px-3 sm:px-4 py-2.5 shadow-sm theme-transition bg-white/95 border-slate-200/80 dark:bg-slate-900/95 dark:border-slate-800 pe-[env(safe-area-inset-right)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg font-outfit tracking-tight text-slate-900 dark:text-white">
                CartKhata
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-indigo-600 text-white shadow-xs tracking-wider">
                ERP
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            className="p-2 rounded-xl transition active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenNotifications}
            title="Notifications"
            aria-label={`Notifications ${unreadNotifCount > 0 ? `(${unreadNotifCount} unread)` : ''}`}
            className="relative p-2 rounded-xl transition active:scale-95 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          <div
            onClick={onOpenDrawer}
            className="cursor-pointer shrink-0 transition active:scale-95"
            title={`${currentUser.name} (${currentUser.role})`}
          >
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
