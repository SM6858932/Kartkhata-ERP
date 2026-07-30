import React from 'react';
import { LogOut, X } from 'lucide-react';

interface ExitConfirmModalProps {
  onConfirmExit: () => void;
  onCancel: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  onConfirmExit,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in bg-black/30 dark:bg-slate-950/80">
      <div className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            <h2 className="text-base font-black font-outfit">Exit CartKhata?</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Do you really want to exit the application? All your data is safely stored locally.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm border transition active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
            >
              No, Stay
            </button>
            <button
              onClick={onConfirmExit}
              className="flex-1 py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/20 transition active:scale-95"
            >
              Yes, Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
