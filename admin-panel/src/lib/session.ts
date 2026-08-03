﻿'use client';

export interface AdminSession {
    uid: string;
    role: 'super_admin' | 'company_admin' | 'collector' | '';
    companyId: string;
    name: string;
}

function getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : '';
}

export function getSession(): AdminSession {
    try {
        // Try localStorage first (set by login page)
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
        // Fallback to cookies (set by middleware)
        const uid = getCookie('adminSession');
        const role = getCookie('adminRole');
        const companyId = getCookie('adminCompanyId');
        const name = getCookie('adminName');
        if (uid) {
            return { uid, role: role as AdminSession['role'], companyId, name };
        }
    } catch (e) {
        // ignore
    }
    return { uid: '', role: '', companyId: '', name: '' };
}

export function isSuperAdminRole(role: string | undefined | null): boolean {
    return role === 'super_admin' || role === 'admin';
}

export function setSessionCookie(uid: string, role: string, companyId: string, name: string): void {
    const maxAge = 86400; // 24 hours
    document.cookie = `adminSession=${uid}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `adminRole=${role}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `adminCompanyId=${companyId}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `adminName=${encodeURIComponent(name)}; path=/; max-age=${maxAge}; samesite=lax`;
    localStorage.setItem('adminSession', JSON.stringify({ uid, role, companyId, name }));
}

export function clearSession(): void {
    localStorage.removeItem('adminSession');
    ['adminSession', 'adminRole', 'adminCompanyId', 'adminName'].forEach(c => {
        document.cookie = `${c}=; path=/; max-age=0; samesite=lax`;
    });
}
