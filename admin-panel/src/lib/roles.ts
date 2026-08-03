export function isSuperAdminRole(role: string | undefined | null): boolean {
    return role === 'super_admin' || role === 'admin';
}

export function isCompanyAdminRole(role: string | undefined | null): boolean {
    return role === 'company_admin' || role === 'super_admin' || role === 'admin';
}

/** Returns true if role can manage companies (view all, create, delete) */
export function canManageCompanies(role: string | undefined | null): boolean {
    return role === 'super_admin' || role === 'admin';
}

/** Returns true if role can manage staff within their own company */
export function canManageCompanyStaff(role: string | undefined | null): boolean {
    return role === 'super_admin' || role === 'admin' || role === 'company_admin';
}

/** Returns true if role can view a specific company's details */
export function canViewCompany(role: string | undefined | null): boolean {
    return role === 'super_admin' || role === 'admin' || role === 'company_admin';
}
