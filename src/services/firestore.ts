import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, onSnapshot, writeBatch,
    serverTimestamp, Timestamp, DocumentData, QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
    User, Vendor, Cart, RentAgreement, Payment, AuditLog,
    AppNotification, Zone, PartnerLead
} from '../types';

// ============================================================
// COMPANY SCOPING
// ============================================================
let activeCompanyId: string | null = null;

export function setActiveCompany(companyId: string | null): void {
    activeCompanyId = companyId;
}

export function getActiveCompany(): string | null {
    return activeCompanyId;
}

export function scopedCol(name: string) {
    return activeCompanyId
        ? collection(db, 'companies', activeCompanyId, name)
        : collection(db, name);
}

export function scopedDoc(name: string, id: string) {
    return activeCompanyId
        ? doc(db, 'companies', activeCompanyId, name, id)
        : doc(db, name, id);
}

// ============================================================
// COLLECTION REFERENCES
// ============================================================
const collections = {
    users: () => collection(db, 'users'),
    vendors: () => scopedCol('vendors'),
    carts: () => scopedCol('carts'),
    agreements: () => scopedCol('agreements'),
    payments: () => scopedCol('payments'),
    auditLogs: () => scopedCol('auditLogs'),
    notifications: () => scopedCol('notifications'),
    zones: () => scopedCol('zones'),
    partnerLeads: () => collection(db, 'partnerLeads'),
    settings: () => collection(db, 'settings'),
};

// ============================================================
// GENERIC HELPERS
// ============================================================
async function getCollection<T>(col: ReturnType<typeof collection> | ReturnType<typeof query>): Promise<T[]> {
    const snapshot = await getDocs(col);
    return snapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return { id: d.id, ...data } as T;
    });
}

function subscribeToCollection<T>(
    col: ReturnType<typeof collection> | ReturnType<typeof query>,
    callback: (data: T[]) => void,
    ...constraints: QueryConstraint[]
): () => void {
    const q = constraints.length > 0 ? query(col, ...constraints) : col;
    return onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(d => {
            const docData = d.data() as Record<string, unknown>;
            return { id: d.id, ...docData } as T;
        });
        callback(data);
    });
}

// ============================================================
// USERS
// ============================================================
export const UserService = {
    getAll: () => getCollection<User>(collections.users()),

    getById: async (id: string): Promise<User | null> => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as User : null;
    },

    getByPhone: async (phone: string): Promise<User | null> => {
        const q = query(collections.users(), where('phone', '==', phone));
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
    },

    create: async (user: Omit<User, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.users(), {
            ...user,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    update: async (id: string, data: Partial<User>): Promise<void> => {
        await updateDoc(doc(db, 'users', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    subscribe: (callback: (users: User[]) => void) =>
        subscribeToCollection<User>(collections.users(), callback),
};

// ============================================================
// VENDORS
// ============================================================
export const VendorService = {
    getAll: () => getCollection<Vendor>(collections.vendors()),

    getById: async (id: string): Promise<Vendor | null> => {
        const snap = await getDoc(scopedDoc('vendors', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Vendor : null;
    },

    getActive: async (): Promise<Vendor[]> => {
        const q = query(collections.vendors(), where('status', '==', 'active'));
        return getCollection<Vendor>(q);
    },

    getByArea: async (areaTag: string): Promise<Vendor[]> => {
        const q = query(collections.vendors(), where('areaTag', '==', areaTag));
        return getCollection<Vendor>(q);
    },

    create: async (vendor: Omit<Vendor, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.vendors(), {
            ...vendor,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    update: async (id: string, data: Partial<Vendor>): Promise<void> => {
        await updateDoc(scopedDoc('vendors', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    updateLoyalty: async (id: string, score: number): Promise<void> => {
        await updateDoc(scopedDoc('vendors', id), {
            loyaltyScore: Math.max(0, Math.min(100, score)),
            updatedAt: serverTimestamp(),
        });
    },

    subscribe: (callback: (vendors: Vendor[]) => void) =>
        subscribeToCollection<Vendor>(collections.vendors(), callback),

    subscribeActive: (callback: (vendors: Vendor[]) => void) =>
        subscribeToCollection<Vendor>(
            collections.vendors(),
            callback,
            where('status', '==', 'active')
        ),
};

// ============================================================
// CARTS
// ============================================================
export const CartService = {
    getAll: () => getCollection<Cart>(collections.carts()),

    getById: async (id: string): Promise<Cart | null> => {
        const snap = await getDoc(scopedDoc('carts', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Cart : null;
    },

    getAvailable: async (): Promise<Cart[]> => {
        const q = query(collections.carts(), where('status', '==', 'available'));
        return getCollection<Cart>(q);
    },

    getRented: async (): Promise<Cart[]> => {
        const q = query(collections.carts(), where('status', '==', 'rented'));
        return getCollection<Cart>(q);
    },

    create: async (cart: Omit<Cart, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.carts(), {
            ...cart,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    update: async (id: string, data: Partial<Cart>): Promise<void> => {
        await updateDoc(scopedDoc('carts', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    updateLocation: async (id: string, lat: number, lng: number, address: string): Promise<void> => {
        await updateDoc(scopedDoc('carts', id), {
            currentLat: lat,
            currentLng: lng,
            lastLocationAddress: address,
            lastLocationUpdateAt: new Date().toISOString(),
            updatedAt: serverTimestamp(),
        });
    },

    subscribe: (callback: (carts: Cart[]) => void) =>
        subscribeToCollection<Cart>(collections.carts(), callback),
};

// ============================================================
// RENT AGREEMENTS
// ============================================================
export const AgreementService = {
    getAll: () => getCollection<RentAgreement>(collections.agreements()),

    getById: async (id: string): Promise<RentAgreement | null> => {
        const snap = await getDoc(scopedDoc('agreements', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as RentAgreement : null;
    },

    getActiveByVendor: async (vendorId: string): Promise<RentAgreement | null> => {
        const q = query(
            collections.agreements(),
            where('vendorId', '==', vendorId),
            where('status', '==', 'active'),
            limit(1)
        );
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as RentAgreement;
    },

    getActiveByCart: async (cartId: string): Promise<RentAgreement | null> => {
        const q = query(
            collections.agreements(),
            where('cartId', '==', cartId),
            where('status', '==', 'active'),
            limit(1)
        );
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as RentAgreement;
    },

    create: async (agreement: Omit<RentAgreement, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.agreements(), {
            ...agreement,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    update: async (id: string, data: Partial<RentAgreement>): Promise<void> => {
        await updateDoc(scopedDoc('agreements', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    terminate: async (id: string, notes?: string): Promise<void> => {
        await updateDoc(scopedDoc('agreements', id), {
            status: 'terminated',
            terminatedAt: new Date().toISOString(),
            finalSettlementNotes: notes,
            updatedAt: serverTimestamp(),
        });
    },

    subscribe: (callback: (agreements: RentAgreement[]) => void) =>
        subscribeToCollection<RentAgreement>(collections.agreements(), callback),
};

// ============================================================
// PAYMENTS
// ============================================================
export const PaymentService = {
    getAll: () => getCollection<Payment>(collections.payments()),

    getById: async (id: string): Promise<Payment | null> => {
        const snap = await getDoc(scopedDoc('payments', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Payment : null;
    },

    getByVendor: async (vendorId: string): Promise<Payment[]> => {
        const q = query(
            collections.payments(),
            where('vendorId', '==', vendorId),
            orderBy('collectedAt', 'desc')
        );
        return getCollection<Payment>(q);
    },

    getByMonth: async (month: string): Promise<Payment[]> => {
        const q = query(
            collections.payments(),
            where('month', '==', month),
            orderBy('collectedAt', 'desc')
        );
        return getCollection<Payment>(q);
    },

    getByVendorAndMonth: async (vendorId: string, month: string): Promise<Payment | null> => {
        const q = query(
            collections.payments(),
            where('vendorId', '==', vendorId),
            where('month', '==', month),
            limit(1)
        );
        const snap = await getDocs(q);
        return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Payment;
    },

    create: async (payment: Omit<Payment, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.payments(), {
            ...payment,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    update: async (id: string, data: Partial<Payment>): Promise<void> => {
        await updateDoc(scopedDoc('payments', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    subscribe: (callback: (payments: Payment[]) => void) =>
        subscribeToCollection<Payment>(collections.payments(), callback),

    subscribeByMonth: (month: string, callback: (payments: Payment[]) => void) =>
        subscribeToCollection<Payment>(
            collections.payments(),
            callback,
            where('month', '==', month),
            orderBy('collectedAt', 'desc')
        ),
};

// ============================================================
// AUDIT LOGS
// ============================================================
export const AuditLogService = {
    getAll: async (maxRecords = 100): Promise<AuditLog[]> => {
        const q = query(
            collections.auditLogs(),
            orderBy('changedAt', 'desc'),
            limit(maxRecords)
        );
        return getCollection<AuditLog>(q);
    },

    getByEntity: async (entityType: string, entityId: string): Promise<AuditLog[]> => {
        const q = query(
            collections.auditLogs(),
            where('entityType', '==', entityType),
            where('entityId', '==', entityId),
            orderBy('changedAt', 'desc'),
            limit(50)
        );
        return getCollection<AuditLog>(q);
    },

    create: async (log: Omit<AuditLog, 'id' | 'serialNo'>): Promise<string> => {
        // Auto-generate serial number
        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collections.auditLogs(),
            where('changedAt', '>=', today),
            orderBy('changedAt', 'desc'),
            limit(1)
        );
        const snap = await getDocs(q);
        const lastSerial = snap.empty ? 0 : parseInt(snap.docs[0].data().serialNo.split('-').pop() || '0');
        const newSerial = `AUD-${today.replace(/-/g, '')}-${String(lastSerial + 1).padStart(4, '0')}`;

        const docRef = await addDoc(collections.auditLogs(), {
            ...log,
            serialNo: newSerial,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    subscribe: (callback: (logs: AuditLog[]) => void, maxRecords = 50) =>
        subscribeToCollection<AuditLog>(
            collections.auditLogs(),
            callback,
            orderBy('changedAt', 'desc'),
            limit(maxRecords)
        ),
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const NotificationService = {
    getAll: () => getCollection<AppNotification>(collections.notifications()),

    getUnread: async (): Promise<AppNotification[]> => {
        const q = query(
            collections.notifications(),
            where('read', '==', false),
            orderBy('timestamp', 'desc')
        );
        return getCollection<AppNotification>(q);
    },

    create: async (notification: Omit<AppNotification, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.notifications(), {
            ...notification,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    markAsRead: async (id: string): Promise<void> => {
        await updateDoc(scopedDoc('notifications', id), {
            read: true,
            updatedAt: serverTimestamp(),
        });
    },

    markAllAsRead: async (): Promise<void> => {
        const q = query(collections.notifications(), where('read', '==', false));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            batch.update(d.ref, { read: true, updatedAt: serverTimestamp() });
        });
        await batch.commit();
    },

    subscribe: (callback: (notifications: AppNotification[]) => void) =>
        subscribeToCollection<AppNotification>(
            collections.notifications(),
            callback,
            orderBy('timestamp', 'desc'),
            limit(100)
        ),
};

// ============================================================
// ZONES
// ============================================================
export const ZoneService = {
    getAll: () => getCollection<Zone>(collections.zones()),

    getById: async (id: string): Promise<Zone | null> => {
        const snap = await getDoc(scopedDoc('zones', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Zone : null;
    },

    create: async (zone: Omit<Zone, 'id'>): Promise<string> => {
        const docRef = await addDoc(scopedCol('zones'), {
            ...zone,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    update: async (id: string, data: Partial<Zone>): Promise<void> => {
        await updateDoc(scopedDoc('zones', id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    subscribe: (callback: (zones: Zone[]) => void) =>
        subscribeToCollection<Zone>(collections.zones(), callback),
};

// ============================================================
// PARTNER LEADS
// ============================================================
export const PartnerLeadService = {
    getAll: () => getCollection<PartnerLead>(collections.partnerLeads()),

    create: async (lead: Omit<PartnerLead, 'id'>): Promise<string> => {
        const docRef = await addDoc(collections.partnerLeads(), {
            ...lead,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },
};

// ============================================================
// BATCH OPERATIONS
// ============================================================
export const BatchService = {
    // Assign cart to vendor (creates agreement + updates cart status)
    assignCart: async (
        vendorId: string,
        cartId: string,
        monthlyRent: number,
        advanceRentPaid: number
    ): Promise<void> => {
        const batch = writeBatch(db);

        // Update cart status
        batch.update(scopedDoc('carts', cartId), {
            status: 'rented',
            updatedAt: serverTimestamp(),
        });

        // Create agreement
        const agreementRef = doc(scopedCol('agreements'));
        batch.set(agreementRef, {
            vendorId,
            cartId,
            monthlyRent,
            advanceRentPaid,
            startDate: new Date().toISOString().split('T')[0],
            termMonths: null,
            status: 'active',
            carriedBalance: 0,
            createdAt: serverTimestamp(),
        });

        await batch.commit();
    },

    // Return cart (terminates agreement + updates cart status)
    returnCart: async (
        agreementId: string,
        cartId: string,
        notes?: string,
        settlementAmount?: number
    ): Promise<void> => {
        const batch = writeBatch(db);

        batch.update(scopedDoc('carts', cartId), {
            status: 'available',
            updatedAt: serverTimestamp(),
        });

        batch.update(scopedDoc('agreements', agreementId), {
            status: 'terminated',
            terminatedAt: new Date().toISOString(),
            carriedBalance: 0,
            finalSettlementAmount: settlementAmount || 0,
            finalSettlementNotes: notes,
            updatedAt: serverTimestamp(),
        });

        await batch.commit();
    },
};

// ============================================================
// SETTINGS (Singleton document)
// ============================================================
export const SettingsService = {
    get: async (): Promise<Record<string, any> | null> => {
        const snap = await getDoc(doc(db, 'settings', 'app'));
        return snap.exists() ? snap.data() : null;
    },

    update: async (data: Record<string, any>): Promise<void> => {
        await updateDoc(doc(db, 'settings', 'app'), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },
};
