'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Users, LogOut, Menu, X, ShieldAlert, Database, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, clearSession } from '@/lib/session';
import { canManageCompanies, canManageCompanyStaff } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
const session = getSession();
  const canSeeCompanies = canManageCompanies(session.role);
  const canSeeStaff = canManageCompanyStaff(session.role);

  useEffect(() => {
    if (pathname.startsWith('/companies') && !canSeeCompanies) {
      router.replace('/');
    }
  }, [pathname, canSeeCompanies, router]);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  ];

  if (canSeeCompanies) {
    navItems.push({ href: '/companies', label: 'Companies', icon: Building2 });
  }

if (canSeeStaff && session.companyId) {
    navItems.push({ href: `/companies/${session.companyId}`, label: 'My Staff', icon: Users });
  }

  // Settings available to all authenticated admin users
  navItems.push({ href: '/settings', label: 'Settings', icon: Settings });

// Audit log available to all authenticated admin users
  navItems.push({ href: '/audit', label: 'Audit Log', icon: ShieldAlert });

  // Backup available to all authenticated admin users
  navItems.push({ href: '/backup', label: 'Backup', icon: Database });

  const displayName = session.name?.replace(/ \(Admin\)$/, '') || session.uid || 'Admin';

  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-lg font-black text-orange-400 font-outfit">CartKhata</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Panel</p>
          <p className="mt-2 text-xs text-slate-400 truncate">{displayName}</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition mt-8"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white mr-3">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-sm font-bold text-white">CartKhata Admin</h2>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
