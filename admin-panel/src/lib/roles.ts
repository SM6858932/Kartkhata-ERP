export function isSuperAdminRole(role: string | undefined | null): boolean {
    return role === 'super_admin' || role === 'admin';
}
