'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../admin-layout';
import { ShieldAlert, Search, Filter, Download, RefreshCw, Loader2 } from 'lucide-react';
import { getSession, isSuperAdminRole } from '@/lib/session';

interface AuditLogEntry {
    id: string;
    serialNo: string;
    entityType: string;
    entityId: string;
    action: string;
    changedBy: string;
    changedByName: string;
    changedAt: string;
    description: string;
    oldValue?: string;
    newValue?: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [entityFilter, setEntityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const session = getSession();
    const isSuperAdmin = isSuperAdminRole(session.role);

    const load = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (session.companyId) params.set('companyId', session.companyId);
        if (entityFilter !== 'all') params.set('entityType', entityFilter);
        params.set('limit', '200');

        const res = await fetch(`/api/audit-logs?${params}`);
        const json = await res.json();
        if (json.success) setLogs(json.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, [entityFilter, session.companyId]);

    const filteredLogs = logs.filter(log => {
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
                log.description?.toLowerCase().includes(q) ||
                log.changedByName?.toLowerCase().includes(q) ||
                log.serialNo?.toLowerCase().includes(q) ||
                log.entityType?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const exportCSV = () => {
        const headers = ['Serial No', 'Timestamp', 'Action', 'Entity Type', 'Description', 'Changed By', 'Old Value', 'New Value'];
        const rows = filteredLogs.map(log => [
            log.serialNo,
            new Date(log.changedAt).toLocaleString('en-IN'),
            log.action,
            log.entityType,
            `"${(log.description || '').replace(/"/g, '""')}"`,
            log.changedByName,
            `"${(log.oldValue || '').replace(/"/g, '""')}"`,
            `"${(log.newValue || '').replace(/"/g, '""')}"`,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const entityTypes = ['all', 'vendor', 'cart', 'agreement', 'payment', 'user', 'company'];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white font-outfit flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-orange-500" />
                            Audit Log
                        </h1>
                        <p className="text-sm text-slate-400">Immutable trail of all system changes</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={load}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </button>
                        <button onClick={exportCSV}
                            className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-2 rounded-xl transition"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        {entityTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setEntityFilter(type)}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl capitalize transition ${
                                    entityFilter === type
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                {type === 'all' ? 'All' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No audit log entries found.</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-3">Serial No</th>
                                        <th className="p-3">Timestamp</th>
                                        <th className="p-3">Action</th>
                                        <th className="p-3">Entity</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3">Changed By</th>
                                        <th className="p-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 font-medium">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-800/50 transition">
                                            <td className="p-3 font-mono font-bold text-orange-400">{log.serialNo}</td>
                                            <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                                                {new Date(log.changedAt).toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                                                    log.action === 'create' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    log.action === 'update' ? 'bg-amber-500/20 text-amber-400' :
                                                    log.action === 'delete' ? 'bg-rose-500/20 text-rose-400' :
                                                    'bg-slate-700 text-slate-300'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                                                    {log.entityType}
                                                </span>
                                            </td>
                                            <td className="p-3 font-bold text-white max-w-xs truncate">{log.description}</td>
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
                )}
            </div>
        </AdminLayout>
    );
}
