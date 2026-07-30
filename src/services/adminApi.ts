const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3001/api';

export interface CreateStaffInput {
    name: string;
    phone: string;
    email: string;
    password: string;
    role: 'collector';
    assignedVendorIds: string[];
    companyId: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export const AdminApiService = {
    createStaff: async (input: CreateStaffInput): Promise<ApiResponse<{ uid: string }>> => {
        const res = await fetch(`${API_BASE_URL}/auth/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return res.json();
    },

    disableStaff: async (uid: string): Promise<ApiResponse<void>> => {
        const res = await fetch(`${API_BASE_URL}/auth/disable-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid }),
        });
        return res.json();
    },
};
