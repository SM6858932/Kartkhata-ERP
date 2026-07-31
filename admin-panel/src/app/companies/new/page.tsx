'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../admin-layout';
import { ArrowLeft, Building2, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewCompanyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name: '', ownerName: '', address: '',
    adminEmail: '', adminPassword: '', adminPhone: '+91 ',
    staffEmail: '', staffPassword: '', staffPhone: '+91 ',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

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
      fd.append('adminEmail', form.adminEmail);
      fd.append('adminPassword', form.adminPassword);
      fd.append('adminPhone', form.adminPhone);
      if (logo) fd.append('logo', logo);

      const res = await fetch('/api/companies', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setDone(true);
        setTimeout(() => router.push('/companies'), 1500);
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-black text-white font-outfit">Company Created!</h2>
            <p className="text-sm text-slate-400">Redirecting to companies list...</p>
          </div>
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
          <p className="text-sm text-slate-400">Step {step} of 2 — Company details & admin credentials</p>
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
              Next: Admin Credentials
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Admin Login Credentials</h2>
            <p className="text-xs text-slate-400">This creates the company admin who can log into the mobile app.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Email *</label>
                <input type="email" value={form.adminEmail} onChange={e => update('adminEmail', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Password *</label>
                <input type="password" value={form.adminPassword} onChange={e => update('adminPassword', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Phone</label>
              <input value={form.adminPhone} onChange={e => update('adminPhone', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl font-mono" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.adminEmail || !form.adminPassword}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Company & Admin'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
