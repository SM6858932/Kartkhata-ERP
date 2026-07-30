import React from 'react';
import { AuditLog } from '../../types';
import { ShieldAlert, Clock, User, FileCode } from 'lucide-react';

interface AuditLogTabProps {
  auditLogs: AuditLog[];
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <div>
          <h2 className="font-extrabold text-lg text-white font-outfit flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            Immutable Audit Trail Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Complete serial-numbered audit log of every payment, location change, and system edit.
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl">
          {auditLogs.length} Log Entries
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Serial No</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Description</th>
                <th className="p-3">Changed By</th>
                <th className="p-3">Audit Details (Old &rarr; New)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-3 font-mono font-bold text-orange-400">{log.serialNo}</td>
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.changedAt).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-slate-800 text-slate-200 border border-slate-700 rounded-md">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white max-w-xs">{log.description}</td>
                  <td className="p-3 text-slate-300">{log.changedByName}</td>
                  <td className="p-3 max-w-sm">
                    {log.oldValue && (
                      <div className="text-[10px] text-rose-400 font-mono truncate">
                        Old: {log.oldValue}
                      </div>
                    )}
                    {log.newValue && (
                      <div className="text-[10px] text-emerald-400 font-mono truncate">
                        New: {log.newValue}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
