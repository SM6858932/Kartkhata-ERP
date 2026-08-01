'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, ExternalLink, Trash2 } from 'lucide-react';
import AdminLayout from '../admin-layout';
import Link from 'next/link';
import { normalizeLogoUrl } from '@/lib/logoUrl';

interface Company {
    id: string;
    name: string;
    ownerName: string;
    logoUrl: string;
    active: boolean;
    createdAt: string;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const res = await fetch('/api/companies');
        const json = await res.json();
        if (json.success) setCompanies(json.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleToggleActive = async (id: string, active: boolean) => {
        await fetch(`/api/companies/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !active }),
        });
        load();
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white font-outfit">Companies</h1>
                        <p className="text-sm text-slate-400">{companies.length} companies registered</p>
                    </div>
                    <Link href="/companies/new"
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                    >
                        <Plus className="w-4 h-4" />
                        New Company
                    </Link>
                </div>

                {loading ? (
                    <p className="text-slate-500 text-sm">Loading...</p>
                ) : companies.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No companies yet. Create your first one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companies.map(c => (
                            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition">
                                <div className="flex items-center gap-3">
                                    {c.logoUrl ? (
                                        <img src={normalizeLogoUrl(c.logoUrl)} alt={c.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-slate-500" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white text-sm truncate">{c.name}</h3>
                                        <p className="text-xs text-slate-400">{c.ownerName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {c.active ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleToggleActive(c.id, c.active)}
                                            className="text-[10px] text-slate-400 hover:text-white transition font-semibold"
                                        >
                                            {c.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <a href={`/companies/${c.id}/edit`}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 transition font-semibold"
                                        >
                                            Edit
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
