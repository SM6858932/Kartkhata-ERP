'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../admin-layout';
import { ArrowLeft, Building2, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { normalizeLogoUrl } from '@/lib/logoUrl';

export default function EditCompanyPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ name: '', ownerName: '', address: '', ownerMobile: '' });
    const [logoPreview, setLogoPreview] = useState('');

    useEffect(() => {
        fetch('/api/companies')
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    const c = res.data.find((d: any) => d.id === id);
                    if (c) {
                        setForm({
                            name: c.name,
                            ownerName: c.ownerName,
                            address: c.address || '',
                            ownerMobile: c.ownerMobile || '',
                        });
                        setLogoPreview(c.logoUrl || '');
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/companies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (json.success) {
                setSaved(true);
                setTimeout(() => router.push('/companies'), 1000);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout><p className="text-slate-400">Loading...</p></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <Link href="/companies" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Companies
                </Link>

                <h1 className="text-2xl font-black text-white font-outfit">Edit Company</h1>

                {saved ? (
                    <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-bold">Company updated!</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Name</label>
                            <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Company Address</label>
                            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Mobile Number</label>
                            <input value={form.ownerMobile} onChange={e => setForm(f => ({ ...f, ownerMobile: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl font-mono" />
                        </div>
                        {logoPreview && (
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Current Logo</label>
                                <img src={normalizeLogoUrl(logoPreview)} alt="logo" className="h-12 rounded-lg" />
                            </div>
                        )}
                        <button type="submit" disabled={saving}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                        </button>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
