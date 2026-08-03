'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../admin-layout';
import { Download, RefreshCw, Loader2, Database, Clock, FileText, CheckCircle2, AlertTriangle, Cloud } from 'lucide-react';
import { getSession } from '@/lib/session';

interface BackupEntry {
    name: string;
    size: string;
    createdAt: string;
    downloadUrl: string;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<BackupEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState<{ fileName: string; downloadUrl: string; recordCount: number } | null>(null);
    const session = getSession();

    const load = async () => {
        setLoading(true);
        const res = await fetch('/api/backup');
        const json = await res.json();
        if (json.success) setBackups(json.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreateBackup = async () => {
        setCreating(true);
        setCreated(null);
        try {
            const res = await fetch('/api/backup', { method: 'POST' });
            if (!res.ok) {
                const json = await res.json().catch(() => null);
                alert((json && json.error) || 'Backup failed');
                return;
            }
            // Response is a downloadable JSON file — trigger browser download
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const disposition = res.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/);
            a.href = url;
            a.download = match ? match[1] : `cartkhata-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setCreated({
                fileName: a.download,
                downloadUrl: '',
                recordCount: 0,
            });
        } catch (err) {
            alert('Failed to create backup');
        } finally {
            setCreating(false);
        }
    };

    const formatSize = (bytes: string) => {
        const num = parseInt(bytes);
        if (!num) return 'N/A';
        if (num < 1024) return `${num} B`;
        if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
        return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white font-outfit flex items-center gap-2">
                            <Cloud className="w-6 h-6 text-orange-500" />
                            Backup & Restore
                        </h1>
                        <p className="text-sm text-slate-400">Export and download your company data</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={load}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </button>
                        <button onClick={handleCreateBackup} disabled={creating}
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl transition disabled:opacity-50"
                        >
                            {creating ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</>
                            ) : (
                                <><Database className="w-3.5 h-3.5" /> Create Backup Now</>
                            )}
                        </button>
                    </div>
                </div>

                {created && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                            Backup created successfully!
                        </div>
                        <p className="text-xs text-slate-400">
                            {created.recordCount} records exported · {created.fileName}
                        </p>
                        <a href={created.downloadUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Backup File
                        </a>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : backups.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No backups found. Create your first backup.</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-3">File Name</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Size</th>
                                        <th className="p-3">Download</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 font-medium">
                                    {backups.map((backup, i) => (
                                        <tr key={i} className="hover:bg-slate-800/50 transition">
                                            <td className="p-3 font-mono text-orange-400">
                                                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                                                {backup.name.split('/').pop()}
                                            </td>
                                            <td className="p-3">
                                                <Clock className="w-3 h-3 inline mr-1 text-slate-500" />
                                                {formatDate(backup.createdAt)}
                                            </td>
                                            <td className="p-3 font-mono">{formatSize(backup.size)}</td>
                                            <td className="p-3">
                                                <a href={backup.downloadUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold transition"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Download
                                                </a>
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
