import React from 'react';
import { LayoutGrid, Users, FileText, Settings, Plus } from 'lucide-react';

export type TabType = 'home' | 'vendors' | 'statements' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAddVendor: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onAddVendor,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <nav className="relative backdrop-blur-xl border-t px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-2xl theme-transition bg-white/95 border-slate-200/90 dark:bg-slate-900/95 dark:border-slate-800">
        <div className="max-w-md mx-auto flex items-end justify-between px-3">

          <button onClick={() => onTabChange('home')} aria-label="Home tab" className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all duration-200 ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Home</span>
            {activeTab === 'home' && <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-0.5" />}
          </button>

          <button onClick={() => onTabChange('vendors')} aria-label="Vendors tab" className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all duration-200 ${activeTab === 'vendors' ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Vendors</span>
            {activeTab === 'vendors' && <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-0.5" />}
          </button>

          <div className="relative -top-5 flex flex-col items-center">
            <button onClick={onAddVendor} aria-label="Add vendor" title="Add Vendor" className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-600/40 border-4 border-white dark:border-slate-900 transition-all duration-200 active:scale-95">
              <Plus className="w-7 h-7" />
            </button>
            <span className="text-[10px] font-bold mt-1 text-orange-500 dark:text-orange-400">Add Vendor</span>
          </div>

          <button onClick={() => onTabChange('statements')} aria-label="Statements tab" className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all duration-200 ${activeTab === 'statements' ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Statements</span>
            {activeTab === 'statements' && <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-0.5" />}
          </button>

          <button onClick={() => onTabChange('settings')} aria-label="Settings tab" className={`flex flex-col items-center justify-center py-1 px-2.5 transition-all duration-200 ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">Settings</span>
            {activeTab === 'settings' && <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-0.5" />}
          </button>

        </div>
      </nav>
    </div>
  );
};
