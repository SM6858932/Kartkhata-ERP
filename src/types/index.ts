export type UserRole = 'admin' | 'collector';

export interface User {
    id: string;
    name: string;
    phone: string;
    email: string;
    password?: string;
    role: UserRole;
    active: boolean;
    assignedVendorIds: string[];
    companyId?: string;
    avatar?: string;
}

export type IDProofType = 'aadhaar' | 'pan' | 'voter_id' | 'driving_license';

export interface Vendor {
    id: string;
    fullName: string;
    phone: string;
    whatsAppPhone?: string;
    address: string;
    areaTag?: string; // e.g. "KKV Hall", "CG Road", "Sant Kabir Road"
    emergencyContact: string;
    photoUrl: string;
    idProofUrl: string; // Restricted to Admin
    idProofType: IDProofType;
    idProofNumber: string;
    joinDate: string; // YYYY-MM-DD
    status: 'active' | 'inactive' | 'suspended';
    loyaltyScore: number; // 0 - 100
    securityDeposit: number; // Refundable Advance
    advanceRent?: number; // Advance rent paid
    notes?: string;
    dpdpConsented: boolean;
    dpdpConsentDate: string;
}

export type CartStatus = 'rented' | 'available' | 'maintenance';

export interface Cart {
    id: string;
    cartNumber: string; // Manually entered or auto-generated, e.g. KKV-001
    areaPrefix?: string; // e.g. "KKV"
    modelType: string; // e.g. "Standard FastFood Cart V2"
    photoUrl: string;
    status: CartStatus;
    currentLat: number; // Manually entered or fetched
    currentLng: number; // Manually entered or fetched
    locationAccuracy?: number;
    lastLocationAddress: string;
    lastLocationUpdateAt: string;
    lastUpdatedBy: string;
}

export interface RentAgreement {
    id: string;
    vendorId: string;
    cartId: string;
    monthlyRent: number;
    advanceRentPaid: number; // Refundable advance
    startDate: string; // YYYY-MM-DD
    nextPayDate?: string; // YYYY-MM-DD
    endDate?: string;
    termMonths: number | null; // null = month-to-month
    agreementPdfUrl?: string;
    status: 'active' | 'expired' | 'terminated';
    carriedBalance?: number; // Running balance carried from previous months
    terminatedAt?: string;
    finalSettlementNotes?: string;
    finalSettlementAmount?: number; // Positive = refund to vendor, Negative = vendor owes
    finalSettlementPaid?: boolean; // Whether settlement amount was collected/paid
}

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'other';

export interface Payment {
    id: string;
    serialNo: string; // e.g. REC-2026-07-001
    agreementId: string;
    vendorId: string;
    cartId: string;
    month: string; // YYYY-MM
    dueAmount: number;
    amountCollected: number;
    balanceCarriedForward: number; // Positive = pending owed, Negative = advance credit
    paymentMode: PaymentMode;
    penalty: number;
    discount: number;
    extraCharges: number;
    notes?: string;
    collectedBy: string;
    collectedByName: string;
    collectedAt: string;
    receiptSent: boolean;
    paymentPhotoUrl?: string;
}

export interface RentalHistory {
    id: string;
    vendorId: string;
    month: string;
    totalDue: number;
    amountPaid: number;
    balanceCarried: number;
    loyaltyScoreAtTime: number;
    status: 'paid_full' | 'partial' | 'unpaid' | 'overpaid';
}

export interface AuditLog {
    id: string;
    serialNo: string;
    entityType: 'vendor' | 'cart' | 'agreement' | 'payment' | 'user' | 'system';
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'location_update' | 'backup';
    changedBy: string;
    changedByName: string;
    changedAt: string;
    oldValue?: string;
    newValue?: string;
    description: string;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'payment' | 'location' | 'agreement' | 'system';
    vendorId?: string;
}

export interface Zone {
    id: string;
    name: string;
    prefix: string;
    referenceLat?: number;
    referenceLng?: number;
}

export interface PartnerLead {
    id: string;
    agencyName: string;
    fullName: string;
    email: string;
    phone: string;
    requirement: 'ERP' | 'Website' | 'Mobile App' | 'Custom Solution';
    createdAt: string;
}

