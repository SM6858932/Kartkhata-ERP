'use client';

export interface AdminSession {
    uid: string;
    role: 'super_admin' | 'company_admin' | 'collector' | '';
    companyId: string;
    name: string;
}

export function getSession(): AdminSession {
    try {
        const raw = localStorage.getItem('adminSession');
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                uid: parsed.uid || '',
                role: parsed.role || '',
                companyId: parsed.companyId || '',
                name: parsed.name || '',
            };
        }
    } catch (e) {
        // ignore
    }
    return { uid: '', role: '', companyId: '', name: '' };
}

export function isSuperAdmin(): boolean {
    return getSession().role === 'super_admin';
}

export function clearSession(): void {
    localStorage.removeItem('adminSession');
    ['adminSession', 'adminRole', 'adminCompanyId', 'adminName'].forEach(c => {
        document.cookie = `${c}=; path=/; max-age=0; samesite=lax`;
    });
}
