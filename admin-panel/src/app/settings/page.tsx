'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../admin-layout';
import { getSession, isSuperAdminRole } from '@/lib/session';
import { canManageCompanyStaff } from '@/lib/roles';
import { normalizeLogoUrl } from '@/lib/logoUrl';
import {
    Building2, Upload, Loader2, CheckCircle2, Users, UserPlus,
    KeyRound, RefreshCw, Trash2, Power, Pencil, ShieldCheck, Smartphone,
    AlertTriangle, Save, Building, Phone, MapPin, Copy, Eye, EyeOff
} from 'lucide-react';

type Tab = 'company' | 'staff' | 'danger';

const ROLE_LABELS: Record<string, string> = {
    company_admin: 'Company Admin',
    staff: 'Staff',
    collector: 'Collector',
};

interface Staff {
    uid: string;
    name: string;
    phone: string;
    email: string;
    role: string;
    active: boolean;
    assignedVendorIds: string[];
}

export default function SettingsPage() {
    const router = useRouter();
    const session = getSession();
    const [tab, setTab] = useState<Tab>('company');
    const [company, setCompany] = useState<any>(null);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState('');

    // Staff management state
    const [showAdd, setShowAdd] = useState(false);
    const [editingUid, setEditingUid] = useState<string | null>(null);
    const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'collector', assignedVendorIds: '' });

    const [formCompany, setFormCompany] = useState({ name: '', ownerName: '', address: '', ownerMobile: '' });

    const canSeeStaff = canManageCompanyStaff(session.role);
    const canDeleteCompany = isSuperAdminRole(session.role);
    const companyId = session.companyId;

    const loadCompany = useCallback(async () => {
        if (!companyId) return;
        const res = await fetch('/api/companies');
        const json = await res.json();
        if (json.success) {
            const c = json.data.find((d: any) => d.id === companyId) || null;
            setCompany(c);
            if (c) {
                setFormCompany({
                    name: c.name || '',
                    ownerName: c.ownerName || '',
                    address: c.address || '',
                    ownerMobile: c.ownerMobile || '',
                });
                setLogoPreview(c.logoUrl || '');
            }
        }
    }, [companyId]);

    const loadStaff = useCallback(async () => {
        if (!companyId) return;
        const res = await fetch(`/api/users?companyId=${companyId}`);
        const json = await res.json();
        if (json.success) setStaff(json.data);
    }, [companyId]);

    useEffect(() => {
        Promise.all([loadCompany(), loadStaff()]).finally(() => setLoading(false));
    }, [loadCompany, loadStaff]);

    // ---------- Company Profile ----------
    const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('name', formCompany.name);
            fd.append('ownerName', formCompany.ownerName);
            fd.append('address', formCompany.address);
            fd.append('ownerMobile', formCompany.ownerMobile);
            if (logo) fd.append('logo', logo);

            const res = await fetch(`/api/companies/${companyId}`, { method: 'PATCH', body: fd });
            const json = await res.json();
            if (json.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                loadCompany();
            } else {
                setError(json.error || 'Failed to update company');
            }
        } catch {
            setError('Error updating company');
        } finally {
            setSaving(false);
        }
    };

    // ---------- Staff Management ----------
    const handleAddStaff = async () => {
        if (!form.name || !form.phone || !form.password) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/auth/create-staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    email: form.email || undefined,
                    password: form.password,
                    role: form.role,
                    companyId,
                    assignedVendorIds: form.assignedVendorIds ? form.assignedVendorIds.split(',').map(s => s.trim()).filter(Boolean) : [],
                }),
            });
            const json = await res.json();
            if (json.success) {
                setShowAdd(false);
                setCreatedCred({ email: json.data.email, password: json.data.password });
                setForm({ name: '', phone: '', email: '', password: '', role: 'collector', assignedVendorIds: '' });
                loadStaff();
                setTimeout(() => setCreatedCred(null), 10000);
            } else {
                setError(json.error || 'Failed to create staff');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEditStaff = (s: Staff) => {
        setEditingUid(s.uid);
        setForm({
            name: s.name,
            phone: s.phone || '',
            email: s.email || '',
            password: '',
            role: s.role,
            assignedVendorIds: (s.assignedVendorIds || []).join(', '),
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUid) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/users/${editingUid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    role: form.role,
                    assignedVendorIds: form.assignedVendorIds ? form.assignedVendorIds.split(',').map(s => s.trim()).filter(Boolean) : [],
                }),
            });
            const json = await res.json();
            if (json.success) {
                setEditingUid(null);
                loadStaff();
            } else {
                setError(json.error || 'Failed to update staff');
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
        loadStaff();
    };

    const handleDeleteStaff = async (uid: string, name: string) => {
        if (!window.confirm(`Permanently delete staff "${name}"?\n\nThis removes their Firebase Auth account and all access. This cannot be undone.`)) return;
        const res = await fetch(`/api/users/${uid}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) alert(json.error || 'Failed to delete staff');
        loadStaff();
    };

    // ---------- Danger Zone ----------
    const handleDeleteCompany = async () => {
        if (!company) return;
        const confirmText = window.prompt(
            `To permanently delete "${company.name}", type the company name exactly:\n\n"${company.name}"\n\nThis removes ALL staff, vendors, carts, agreements, payments and settings. THIS CANNOT BE UNDONE.`
        );
        if (!confirmText || confirmText !== company.name) {
            alert('Company name did not match. Deletion cancelled.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                const { clearSession } = await import('@/lib/session');
                clearSession();
                router.push('/login');
            } else {
                alert(json.error || 'Failed to delete company');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout><p className="text-slate-400">Loading...</p></AdminLayout>;

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'company', label: 'Company Profile', icon: Building2 },
        ...(canSeeStaff ? [{ key: 'staff' as Tab, label: 'Staff & Collectors', icon: Users }] : []),
        ...(canDeleteCompany ? [{ key: 'danger' as Tab, label: 'Danger Zone', icon: AlertTriangle }] : []),
    ];

    return (
        <AdminLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white font-outfit">Settings</h1>
                    <p className="text-sm text-slate-400">Manage your company workspace</p>
                </div>

                {/* Tab bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${tab === t.key
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium">
                        {error}
                    </div>
                )}

                {/* ---------- COMPANY PROFILE TAB ---------- */}
                {tab === 'company' && (
                    <form onSubmit={handleSaveCompany} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Building className="w-5 h-5 text-orange-400" />
                            Company Profile
                        </h2>

                        {saved && (
                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Company updated!
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name *</label>
                            <input value={formCompany.name} onChange={e => setFormCompany(f => ({ ...f, name: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Name *</label>
                            <input value={formCompany.ownerName} onChange={e => setFormCompany(f => ({ ...f, ownerName: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Company Address</label>
                            <textarea value={formCompany.address} onChange={e => setFormCompany(f => ({ ...f, address: e.target.value }))} rows={2}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl"
                                placeholder="Street, area, city, state" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Mobile Number</label>
                            <input value={formCompany.ownerMobile} onChange={e => setFormCompany(f => ({ ...f, ownerMobile: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl font-mono"
                                placeholder="+91 98xxxxxx" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Company Logo</label>
                            <div className="flex items-center gap-3">
                                {logoPreview && (
                                    <img src={normalizeLogoUrl(logoPreview)} alt="logo" className="h-12 w-12 rounded-xl object-cover border border-slate-700" />
                                )}
                                <label className="flex items-center gap-3 cursor-pointer bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:border-orange-500/50 transition flex-1">
                                    <Upload className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-400">{logo ? logo.name : 'Upload new logo'}</span>
                                    <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                                </label>
                            </div>
                        </div>
                        <button type="submit" disabled={saving}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </form>
                )}

                {/* ---------- STAFF TAB ---------- */}
                {tab === 'staff' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-400" />
                                Staff & Collectors
                                <span className="text-xs text-slate-500">({staff.length})</span>
                            </h2>
                            <button onClick={() => { setShowAdd(!showAdd); setEditingUid(null); }}
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
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Vendor IDs (comma-separated)</label>
                                    <input value={form.assignedVendorIds} onChange={e => setForm(f => ({ ...f, assignedVendorIds: e.target.value }))}
                                        placeholder="e.g. vendorId1, vendorId2"
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                </div>
                                <button onClick={handleAddStaff} disabled={saving || !form.name || !form.phone || !form.password}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Staff Account'}
                                </button>
                            </div>
                        )}

                        {editingUid && (
                            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Pencil className="w-4 h-4 text-indigo-400" /> Edit Staff
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Name</label>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
                                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1">
                                        <option value="collector">Collector</option>
                                        <option value="staff">Staff</option>
                                        <option value="company_admin">Company Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Vendor IDs (comma-separated)</label>
                                    <input value={form.assignedVendorIds} onChange={e => setForm(f => ({ ...f, assignedVendorIds: e.target.value }))}
                                        placeholder="e.g. vendorId1, vendorId2"
                                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl mt-1" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSaveEdit} disabled={saving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50">
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => setEditingUid(null)}
                                        className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {createdCred && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs space-y-1">
                                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Account created — save these credentials:
                                </p>
                                <p className="text-slate-200">Email: <span className="font-mono text-emerald-300">{createdCred.email}</span></p>
                                <p className="text-slate-200">Password: <span className="font-mono text-emerald-300">{createdCred.password}</span></p>
                                <button onClick={() => navigator.clipboard?.writeText(`${createdCred.email} / ${createdCred.password}`)}
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
                                            {s.assignedVendorIds?.length > 0 && (
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    Assigned: {s.assignedVendorIds.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
                                                <ShieldCheck className="w-3 h-3" />
                                                {ROLE_LABELS[s.role] || s.role}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {s.active ? 'Active' : 'Inactive'}
                                            </span>
                                            <button onClick={() => handleEditStaff(s)}
                                                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition"
                                                title="Edit staff">
                                                <Pencil className="w-4 h-4" />
                                            </button>
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
                                            <button onClick={() => handleDeleteStaff(s.uid, s.name)}
                                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                                                title="Delete staff">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ---------- DANGER ZONE TAB ---------- */}
                {tab === 'danger' && company && (
                    <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 space-y-4">
                        <h2 className="font-bold text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-slate-400">
                            Deleting your company will permanently remove:
                        </p>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                            <li>The company profile <strong>{company.name}</strong></li>
                            <li>All staff & collector accounts</li>
                            <li>All vendors, carts, agreements & payments</li>
                            <li>All audit logs, notifications & settings</li>
                        </ul>
                        <div className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-bold text-rose-300">This action cannot be undone.</p>
                            <button onClick={handleDeleteCompany} disabled={saving}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Permanently Delete Company
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
