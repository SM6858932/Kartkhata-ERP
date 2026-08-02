import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export interface CompanySettings {
    name: string;
    ownerName: string;
    logoUrl: string;
    active: boolean;
    address?: string;
    ownerMobile?: string;
    phone?: string;
    email?: string;
}

const cache = new Map<string, CompanySettings>();

export const CompanyService = {
    get: async (companyId: string): Promise<CompanySettings | null> => {
        if (cache.has(companyId)) return cache.get(companyId)!;

        try {
            const snap = await getDoc(doc(db, 'companies', companyId));
            if (snap.exists()) {
                const data = { id: snap.id, ...snap.data() } as CompanySettings & { id: string };
                cache.set(companyId, data);
                return data;
            }
        } catch (err) {
            console.warn('Failed to fetch company settings:', err);
        }
        return null;
    },

    clearCache: () => cache.clear(),
};
