'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';
import AdminLayout from './admin-layout';
import Link from 'next/link';
import { getSession, isSuperAdminRole } from '@/lib/session';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ companies: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const session = getSession();

  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then(r => r.json()),
      fetch('/api/users').then(r => r.json()).catch(() => ({ success: false, data: [] })),
    ])
      .then(([companiesRes, usersRes]) => {
        if (companiesRes.success) {
          const companies = companiesRes.data;
          const users = usersRes.success ? usersRes.data : [];
          const totalUsers = Array.isArray(users) ? users.length : 0;
          setStats({ companies: companies.length, users: totalUsers });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const isOwner = session.role === 'company_admin';
  const displayName = session.name?.replace(/ \(Admin\)$/, '') || 'there';
  const headline = isOwner
    ? `${greeting()}, ${displayName}`
    : `Hello, ${displayName}`;

  const cards = [
    { label: 'Total Companies', value: stats.companies, icon: Building2, color: 'text-orange-400 bg-orange-500/10' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
    { label: 'Active Companies', value: stats.companies, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white font-outfit">{headline}</h1>
            <p className="text-sm text-slate-400">
              {isOwner ? 'Manage your company workspace' : 'Manage multi-company CartKhata ERP'}
            </p>
          </div>
          {isSuperAdminRole(session.role) && (
            <Link href="/companies/new"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              + New Company
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">{card.label}</p>
                <p className="text-2xl font-black text-white font-outfit">
                  {loading ? '...' : card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
