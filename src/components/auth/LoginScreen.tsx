import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { UserService } from '../../services/firestore';
import { ShieldCheck, Smartphone, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface LoginScreenProps {
    onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [roleMode, setRoleMode] = useState<UserRole>('admin');
    const [identity, setIdentity] = useState('admin@cartkhata.com');
    const [password, setPassword] = useState('admin123');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRoleTabChange = (mode: UserRole) => {
        setRoleMode(mode);
        setErrorMsg(null);
        if (mode === 'admin') {
            setIdentity('admin@cartkhata.com');
            setPassword('admin123');
        } else {
            setIdentity('+91 98123 45678');
            setPassword('staff123');
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsSubmitting(true);

        try {
            const result = await signInWithEmailAndPassword(auth, identity, password);
            const uid = result.user.uid;
            const userDoc = await UserService.getById(uid);
            if (!userDoc) {
                throw new Error('Account not found. Contact your company admin.');
            }
            if (!userDoc.active) {
                throw new Error('Account is disabled. Contact your company admin.');
            }
            StorageService.setSession(userDoc);
            onLoginSuccess(userDoc);
            return;
        } catch (err: any) {
            // Fall back to demo/localStorage login (offline / seed data mode).
            const result = StorageService.login(identity, password);
            if (result.success && result.user) {
                onLoginSuccess(result.user);
                return;
            }
            const fbError = err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found'
                ? 'Invalid email or password.'
                : (err?.message || 'Login failed.');
            setErrorMsg(fbError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Brand Logo & Title */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center mx-auto shadow-xl shadow-orange-600/30 text-3xl">
                        🛒
                    </div>
                    <h1 className="text-2xl font-black text-white font-outfit tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                        CartKhata ERP
                    </h1>
                    <p className="text-xs text-slate-400">Food Cart Rent &amp; Field Collection Account System</p>
                </div>

                {/* Role Toggle Switcher */}
                <div className="grid grid-cols-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => handleRoleTabChange('admin')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${roleMode === 'admin'
                                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Owner / Admin</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleRoleTabChange('collector')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${roleMode === 'collector'
                                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Smartphone className="w-4 h-4" />
                        <span>Field Collector</span>
                    </button>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block font-bold text-slate-300 mb-1">
                            {roleMode === 'admin' ? 'Owner Email Address' : 'Field Staff Phone / ID'} *
                        </label>
                        <input
                            type="text"
                            required
                            value={identity}
                            onChange={e => setIdentity(e.target.value)}
                            placeholder={roleMode === 'admin' ? 'admin@cartkhata.com' : '+91 98123 45678'}
                            className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-slate-300 mb-1">Password / PIN *</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In to {roleMode === 'admin' ? 'Owner Portal' : 'Collector App'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Demo Quick Logins */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-400 space-y-2">
                    <span className="font-bold text-slate-300 block uppercase text-[10px] tracking-wider">
                        Demo Logins Pre-filled:
                    </span>
                    <div className="space-y-1 text-[11px] font-mono">
                        <p>🛡️ Admin: <span className="text-amber-400">admin@cartkhata.com</span> / <span className="text-amber-400">admin123</span></p>
                        <p>📱 Staff: <span className="text-sky-400">+91 98123 45678</span> / <span className="text-sky-400">staff123</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};
