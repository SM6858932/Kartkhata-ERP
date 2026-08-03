'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../admin-layout';
import { ArrowLeft, Building2, Upload, CheckCircle2, Loader2, Plus, Trash2, ShieldCheck, Smartphone, Copy } from 'lucide-react';
import Link from 'next/link';

interface AccountForm {
    role: 'company_admin' | 'collector';
    name: string;
    email: string;
    password: string;
    phone: string;
}

const emptyAccount = (role: 'company_admin' | 'collector' = 'company_admin'): AccountForm => ({
    role, name: '', email: '', password: '', phone: '+91 ',
});

export default function NewCompanyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '', ownerName: '', address: '', ownerMobile: '+91 ',
  });
const [accounts, setAccounts] = useState<AccountForm[]>([emptyAccount('company_admin')]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const updateAccount = (idx: number, key: keyof AccountForm, val: string) =>
    setAccounts(list => list.map((a, i) => (i === idx ? { ...a, [key]: val } : a)));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('ownerName', form.ownerName);
      fd.append('address', form.address);
      fd.append('ownerMobile', form.ownerMobile);
      fd.append('accounts', JSON.stringify(accounts));
      if (logo) fd.append('logo', logo);

      const res = await fetch('/api/companies', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setCreatedAccounts(json.data.accounts || []);
        setDone(true);
        setTimeout(() => router.push('/companies'), 4000);
      } else {
        alert(json.error || 'Failed to create company');
      }
    } catch (err) {
      alert('Error creating company');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto mt-10 space-y-4">
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-black text-white font-outfit">Company Created!</h2>
            <p className="text-sm text-slate-400">Save these login credentials — they will not be shown again.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            {createdAccounts.map((acc, i) => (
              <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    {acc.role === 'company_admin' ? <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> : <Smartphone className="w-3.5 h-3.5 text-sky-400" />}
                    {acc.role === 'company_admin' ? 'Company Admin' : 'Collector'} — {acc.name}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(`${acc.email}\n${acc.password}`); }}
                    className="text-slate-400 hover:text-white transition"
                    title="Copy credentials"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-300">Email: <span className="font-mono text-amber-400">{acc.email}</span></p>
                <p className="text-slate-300">Password: <span className="font-mono text-amber-400">{acc.password}</span></p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">Redirecting to companies list...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/companies" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>

        <div>
          <h1 className="text-2xl font-black text-white font-outfit">Create New Company</h1>
          <p className="text-sm text-slate-400">
            {step === 1 ? 'Step 1 of 2 — Company details' : 'Step 2 of 2 — Create admin & collector logins'}
          </p>
        </div>

        {step === 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Company Information</h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name *</label>
              <input value={form.name} onChange={e => update('name', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Name *</label>
              <input value={form.ownerName} onChange={e => update('ownerName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Company Address</label>
              <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl"
                placeholder="Street, area, city, state" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Mobile Number</label>
              <input value={form.ownerMobile} onChange={e => update('ownerMobile', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl font-mono"
                placeholder="+91 98xxxxxx" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Company Logo (400×100px recommended)</label>
              <label className="flex items-center gap-3 cursor-pointer bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:border-orange-500/50 transition">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-400">{logo ? logo.name : 'Upload Logo'}</span>
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
              {logoPreview && <img src={logoPreview} alt="preview" className="mt-2 h-12 rounded-lg" />}
            </div>

            <button onClick={() => setStep(2)}
              disabled={!form.name || !form.ownerName}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50"
            >
              Next: Create Login Accounts
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-bold text-white">Login Accounts</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the role for each account and set its email &amp; password. Create the company admin, collector(s), or both.
              </p>
            </div>

            {accounts.map((acc, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
<span className={`w-7 h-7 rounded-lg flex items-center justify-center ${acc.role === 'company_admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-500/20 text-sky-400'}`}>
                      {acc.role === 'company_admin' ? <ShieldCheck className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </span>
                    <h3 className="font-bold text-white text-sm">Account {idx + 1}</h3>
                  </div>
                  {accounts.length > 1 && (
                    <button onClick={() => setAccounts(list => list.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role *</label>
<select value={acc.role} onChange={e => updateAccount(idx, 'role', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl">
                    <option value="company_admin">Company Admin (owner / manager)</option>
                    <option value="collector">Collector (field staff)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Name *</label>
                  <input value={acc.name} onChange={e => updateAccount(idx, 'name', e.target.value)}
placeholder={acc.role === 'company_admin' ? 'e.g. Ramesh Kumar' : 'e.g. Anil Kumar'}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Email *</label>
                    <input type="email" value={acc.email} onChange={e => updateAccount(idx, 'email', e.target.value)}
                      placeholder="e.g. admin@company.com"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Password *</label>
                    <input type="password" value={acc.password} onChange={e => updateAccount(idx, 'password', e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone (optional)</label>
                  <input value={acc.phone} onChange={e => updateAccount(idx, 'phone', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl font-mono" />
                </div>
              </div>
            ))}

            <button onClick={() => setAccounts(list => [...list, emptyAccount('collector')])}
              disabled={accounts.length >= 5}
              className="w-full border-2 border-dashed border-slate-700 hover:border-orange-500/60 text-slate-400 hover:text-orange-400 text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Another Account (Admin or Collector)
            </button>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                ← Back
              </button>
              <button onClick={handleSubmit}
                disabled={saving || accounts.some(a => !a.name || !a.email || !a.password || a.password.length < 6)}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Company & Accounts'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
