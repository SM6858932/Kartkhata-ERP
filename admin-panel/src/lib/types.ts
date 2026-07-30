export interface Company {
  id: string;
  name: string;
  ownerName: string;
  logoUrl: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: 'super_admin' | 'company_admin' | 'collector';
  companyId: string;
  active: boolean;
}
