'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      localStorage.setItem('adminSession', JSON.stringify({ uid }));
      document.cookie = `adminSession=${uid}; path=/; max-age=86400; samesite=lax`;

const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();

      if (me.success && me.data) {
        const user = me.data;
        const validRoles = ['super_admin', 'admin', 'company_admin'];
        if (!validRoles.includes(user.role)) {
          setError(`Access denied: "${user.role}" role does not have admin panel access. Contact super admin.`);
          setLoading(false);
          return;
        }
        // Use the centralized setSessionCookie function
        const { setSessionCookie } = await import('@/lib/session');
        setSessionCookie(uid, user.role || '', user.companyId || '', user.name || '');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-orange-400 font-outfit">CartKhata</h1>
          <p className="text-xs text-slate-500 mt-1">Admin Panel Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-xl" />
          </div>
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
