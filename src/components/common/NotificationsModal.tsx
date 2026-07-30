import React from 'react';
import { AppNotification } from '../../types';
import { StorageService } from '../../services/storage';
import { X, Bell, CheckCircle2, MapPin, BadgeIndianRupee } from 'lucide-react';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onRefresh
}) => {
  const handleMarkRead = (id: string) => {
    StorageService.markNotificationRead(id);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <h3 className="font-bold text-white text-base flex items-center gap-2 font-outfit">
            <Bell className="w-5 h-5 text-orange-400" />
            System Notifications
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  n.read
                    ? 'bg-slate-900/50 border-slate-800 opacity-60'
                    : 'bg-slate-800 border-orange-500/40 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {n.type === 'payment' ? (
                      <BadgeIndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">{n.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(n.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 mt-1 pl-6">{n.message}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">No notifications yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
