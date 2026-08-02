'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../admin-layout';
import { ArrowLeft, Users, ShieldCheck, UserPlus, Loader2, Phone, MapPin, Building2, KeyRound, Eye, EyeOff, RefreshCw, Trash2, Copy, CheckCircle2, Power } from 'lucide-react';
import Link from 'next/link';
import { normalizeLogoUrl } from '@/lib/logoUrl';
import { getSession, isSuperAdminRole } from '@/lib/session';

interface Staff {
    uid: string;
    name: string;
    phone: string;
    email: string;
    role: string;
    active: boolean;
    assignedVendorIds: string[];
}

interface Credential {
    uid: string;
    role: string;
    name: string;
    email: string;
    password: string;
    phone: string;
}

const ROLE_LABELS: Record<string, string> = {
    company_admin: 'Company Admin',
    staff: 'Staff',
    collector: 'Collector',
};

export default function CompanyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const session = getSession();
    const [company, setCompany] = useState<any>(null);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'collector' });
    const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        const res = await fetch('/api/companies');
        const json = await res.json();
        if (json.success) {
            setCompany(json.data.find((c: any) => c.id === id) || null);
        }
        const staffRes = await fetch(`/api/users?companyId=${id}`);
        const staffJson = await staffRes.json();
        if (staffJson.success) setStaff(staffJson.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, [id]);

    const handleAddStaff = async () => {
        if (!form.name || !form.phone || !form.password) return;
        setSaving(true);
        try {
            const res = await fetch('/api/auth/create-staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, companyId: id }),
            });
            const json = await res.json();
            if (json.success) {
                setShowAdd(false);
                setCreatedCred({ email: json.data.email, password: json.data.password });
                setForm({ name: '', phone: '', email: '', password: '', role: 'collector' });
                load();
                setTimeout(() => setCreatedCred(null), 10000);
            } else {
                alert(json.error || 'Failed to create staff');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async (uid: string) => {
        const password = window.prompt('Enter the new password (min 6 characters):');
        if (!password) return;
        if (password.length < 6) { alert('Password must be at least 6 characters'); return; }
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUid: uid, password }),
        });
        const json = await res.json();
        if (json.success) {
            alert('Password reset successfully');
            load();
        } else {
            alert(json.error || 'Failed to reset password');
        }
    };

    const handleToggleActive = async (uid: string, active: boolean) => {
        const res = await fetch('/api/auth/disable-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, active: !active }),
        });
        const json = await res.json();
        if (!json.success) alert(json.error || 'Failed to update user');
        load();
    };

    const handleDeleteCompany = async () => {
        if (!window.confirm(`Permanently delete "${company?.name}"?\n\nThis removes the company, its admins, collectors and ALL data (vendors, carts, agreements, payments). This cannot be undone.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                router.push('/companies');
            } else {
                alert(json.error || 'Failed to delete company');
                setDeleting(false);
            }
        } catch {
            setDeleting(false);
            alert('Failed to delete company');
        }
    };

    const copyCreds = (text: string) => navigator.clipboard?.writeText(text);

    if (loading) return <AdminLayout><p className="text-slate-400">Loading...</p></AdminLayout>;

    const credentials: Credential[] = (company?.credentials || []).filter((c: Credential) => c.email);

    return (
        <AdminLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/companies" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                        <ArrowLeft className="w-4 h-4" /> Back to Companies
                    </Link>
                    {isSuperAdminRole(session.role) && company && (
                        <button onClick={handleDeleteCompany} disabled={deleting}
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition disabled:opacity-50">
                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Delete Company
                        </button>
                    )}
                </div>

                {!company ? (
                    <p className="text-slate-400 text-sm">Company not found.</p>
                ) : (
                    <>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                {company.logoUrl ? (
                                    <img src={normalizeLogoUrl(company.logoUrl)} alt={company.name}
                                        className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-slate-500" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl font-black text-white font-outfit">{company.name}</h1>
                                    <p className="text-sm text-slate-400">{company.ownerName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {company.address && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <MapPin className="w-4 h-4 text-slate-500" />
                                        {company.address}
                                    </div>
                                )}
                                {company.ownerMobile && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Phone className="w-4 h-4 text-slate-500" />
                                        {company.ownerMobile}
                                    </div>
                                )}
                            </div>

                            {isSuperAdminRole(session.role) && (
                                <Link href={`/companies/${company.id}/edit`}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">
                                    Edit Company Profile
                                </Link>
                            )}
                        </div>

                        {isSuperAdminRole(session.role) && credentials.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="w-5 h-5 text-amber-400" />
                                        <h2 className="font-bold text-white">Login Credentials</h2>
                                    </div>
                                    <button onClick={() => setShowPasswords(!showPasswords)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
                                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {showPasswords ? 'Hide' : 'Show'} Passwords
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {credentials.map((cred, i) => (
                                        <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cred.role === 'company_admin' ? 'bg-orange-500/20 text-orange-300' : 'bg-sky-500/20 text-sky-300'}`}>
                                                        {cred.role === 'company_admin' ? <ShieldCheck className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                                                        {ROLE_LABELS[cred.role] || cred.role}
                                                    </span>
                                                    <span className="text-sm font-bold text-white truncate">{cred.name}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono truncate mt-1">
                                                    {cred.email} · {showPasswords ? <span className="text-amber-400">{cred.password}</span> : '••••••••'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => copyCreds(`${cred.email} / ${cred.password}`)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Copy credentials">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleResetPassword(cred.uid)}
                                                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition" title="Reset password">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-slate-400" />
                                    <h2 className="font-bold text-white">Staff & Collectors</h2>
                                    <span className="text-xs text-slate-500">({staff.length})</span>
                                </div>
                                <button onClick={() => setShowAdd(!showAdd)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition">
                                    <UserPlus className="w-4 h-4" />
                                    {showAdd ? 'Cancel' : 'Add Staff'}
                                </button>
                            </div>

                            {showAdd && (
                                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Name *</label>
                                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Phone *</label>
                                            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email (login ID)</label>
                                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            placeholder="e.g. collector@company.com (auto-generated if empty)"
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Password *</label>
                                            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Role *</label>
                                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1">
                                                <option value="collector">Collector</option>
                                                <option value="staff">Staff</option>
                                                <option value="company_admin">Company Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={handleAddStaff} disabled={saving || !form.name || !form.phone || !form.password}
                                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Staff Account'}
                                    </button>
                                </div>
                            )}

                            {createdCred && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs space-y-1">
                                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Account created — save these credentials:
                                    </p>
                                    <p className="text-slate-200">Email: <span className="font-mono text-emerald-300">{createdCred.email}</span></p>
                                    <p className="text-slate-200">Password: <span className="font-mono text-emerald-300">{createdCred.password}</span></p>
                                    <button onClick={() => copyCreds(`${createdCred.email} / ${createdCred.password}`)}
                                        className="mt-1 inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-bold">
                                        <Copy className="w-3.5 h-3.5" /> Copy
                                    </button>
                                </div>
                            )}

                            {staff.length === 0 ? (
                                <p className="text-sm text-slate-500">No staff accounts yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {staff.map(s => (
                                        <div key={s.uid} className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{s.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{s.email} · {s.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {ROLE_LABELS[s.role] || s.role}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    {s.active ? 'Active' : 'Inactive'}
                                                </span>
                                                <button onClick={() => handleResetPassword(s.uid)}
                                                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition"
                                                    title="Reset password">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleToggleActive(s.uid, s.active)}
                                                    className={`p-2 rounded-lg transition ${s.active ? 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}
                                                    title={s.active ? 'Disable account' : 'Enable account'}>
                                                    <Power className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
