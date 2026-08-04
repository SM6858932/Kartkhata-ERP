import { Vendor, Cart, RentAgreement, Payment, AuditLog, User, AppNotification, PartnerLead } from '../types';

const VENDORS_KEY = 'cartkhata_vendors';
const CARTS_KEY = 'cartkhata_carts';
const AGREEMENTS_KEY = 'cartkhata_agreements';
const PAYMENTS_KEY = 'cartkhata_payments';
const AUDIT_LOGS_KEY = 'cartkhata_audit_logs';
const NOTIFICATIONS_KEY = 'cartkhata_notifications';
const USERS_KEY = 'cartkhata_users';
const AUTH_SESSION_KEY = 'cartkhata_auth_session';
const PARTNER_LEADS_KEY = 'cartkhata_partner_leads';

// Initial Users with default passwords
const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Rajesh Sharma (Owner)',
    phone: '+91 98765 43210',
    email: 'admin@cartkhata.com',
    password: 'admin123',
    role: 'admin',
    active: true,
    assignedVendorIds: ['v1', 'v2', 'v3', 'v4']
  },
  {
    id: 'usr_collector_1',
    name: 'Vikram Singh (Field Staff)',
    phone: '+91 98123 45678',
    email: 'vikram@cartkhata.com',
    password: 'staff123',
    role: 'collector',
    active: true,
    assignedVendorIds: ['v1', 'v2', 'v3']
  }
];

const INITIAL_CARTS: Cart[] = [
  {
    id: 'c1',
    cartNumber: 'CART-101',
    modelType: 'Deluxe Fast Food Cart V3',
    photoUrl: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=600&q=80',
    status: 'rented',
    currentLat: 23.0225,
    currentLng: 72.5714,
    lastLocationAddress: 'CG Road, Navrangpura, Ahmedabad, Gujarat',
    lastLocationUpdateAt: '2026-07-24T10:30:00Z',
    lastUpdatedBy: 'Vikram Singh'
  },
  {
    id: 'c2',
    cartNumber: 'CART-102',
    modelType: 'Tea & Snacks Counter Special',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    status: 'rented',
    currentLat: 23.0300,
    currentLng: 72.5800,
    lastLocationAddress: 'Ashram Road, Near Income Tax Circle, Ahmedabad',
    lastLocationUpdateAt: '2026-07-23T16:15:00Z',
    lastUpdatedBy: 'Vikram Singh'
  },
  {
    id: 'c3',
    cartNumber: 'CART-103',
    modelType: 'South Indian Dosa Counter',
    photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    status: 'rented',
    currentLat: 23.0150,
    currentLng: 72.5550,
    lastLocationAddress: 'Vastrapur Lake Front, Ahmedabad',
    lastLocationUpdateAt: '2026-07-25T09:00:00Z',
    lastUpdatedBy: 'Vikram Singh'
  },
  {
    id: 'c4',
    cartNumber: 'CART-104',
    modelType: 'Chaat & Pani Puri Counter',
    photoUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    status: 'rented',
    currentLat: 23.0380,
    currentLng: 72.5620,
    lastLocationAddress: 'University Road, Opp. Commerce College, Ahmedabad',
    lastLocationUpdateAt: '2026-07-20T11:45:00Z',
    lastUpdatedBy: 'Rajesh Sharma'
  }
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'v1',
    fullName: 'John Patel',
    phone: '+91 98250 12345',
    address: 'CG Road, Navrangpura, Ahmedabad, Gujarat',
    emergencyContact: '+91 98250 99999 (Brother: Ramesh)',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    idProofType: 'aadhaar',
    idProofNumber: 'XXXX-XXXX-4829',
    joinDate: '2025-02-01',
    status: 'active',
    loyaltyScore: 85,
    securityDeposit: 15000,
    notes: 'Runs famous Frankie & Sandwich stall. Prompt payer.',
    dpdpConsented: true,
    dpdpConsentDate: '2025-02-01T10:00:00Z'
  },
  {
    id: 'v2',
    fullName: 'Ramesh Kumar',
    phone: '+91 97234 56789',
    address: 'Ashram Road, Near Income Tax Circle, Ahmedabad',
    emergencyContact: '+91 97234 11111 (Wife: Sunita)',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    idProofType: 'aadhaar',
    idProofNumber: 'XXXX-XXXX-9102',
    joinDate: '2024-11-15',
    status: 'active',
    loyaltyScore: 95,
    securityDeposit: 15000,
    notes: 'Operates tea stall near Income Tax office. Gold Badge vendor.',
    dpdpConsented: true,
    dpdpConsentDate: '2024-11-15T11:20:00Z'
  },
  {
    id: 'v3',
    fullName: 'Suresh Parmar',
    phone: '+91 99099 88776',
    address: 'Vastrapur Lake Front, Ahmedabad',
    emergencyContact: '+91 99099 22222 (Son: Amit)',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    idProofType: 'voter_id',
    idProofNumber: 'GJ/01/012/987654',
    joinDate: '2025-01-10',
    status: 'active',
    loyaltyScore: 60,
    securityDeposit: 15000,
    notes: 'Partial payment carried over from last month.',
    dpdpConsented: true,
    dpdpConsentDate: '2025-01-10T14:30:00Z'
  },
  {
    id: 'v4',
    fullName: 'Priya Shah',
    phone: '+91 98980 11223',
    address: 'University Road, Opp. Commerce College, Ahmedabad',
    emergencyContact: '+91 98980 55555 (Husband: Chirag)',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    idProofUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    idProofType: 'pan',
    idProofNumber: 'ABCPS1234K',
    joinDate: '2025-04-01',
    status: 'active',
    loyaltyScore: 100,
    securityDeposit: 15000,
    notes: 'Chaat counter. Pays in advance every month.',
    dpdpConsented: true,
    dpdpConsentDate: '2025-04-01T09:15:00Z'
  }
];

const INITIAL_AGREEMENTS: RentAgreement[] = [
  { id: 'ag_1', vendorId: 'v1', cartId: 'c1', monthlyRent: 7000, advanceRentPaid: 7000, startDate: '2025-02-01', termMonths: 12, status: 'active' },
  { id: 'ag_2', vendorId: 'v2', cartId: 'c2', monthlyRent: 7000, advanceRentPaid: 7000, startDate: '2024-11-15', termMonths: 24, status: 'active' },
  { id: 'ag_3', vendorId: 'v3', cartId: 'c3', monthlyRent: 7000, advanceRentPaid: 7000, startDate: '2025-01-10', termMonths: 6, status: 'active' },
  { id: 'ag_4', vendorId: 'v4', cartId: 'c4', monthlyRent: 7500, advanceRentPaid: 7500, startDate: '2025-04-01', termMonths: 12, status: 'active' }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'p_v1_jun',
    serialNo: 'REC-2026-06-014',
    agreementId: 'ag_1',
    vendorId: 'v1',
    cartId: 'c1',
    month: '2026-06',
    dueAmount: 7000,
    amountCollected: 4750,
    balanceCarriedForward: 2250,
    paymentMode: 'cash',
    penalty: 0,
    discount: 0,
    extraCharges: 0,
    notes: 'Paid partial due to market festival expenses.',
    collectedBy: 'usr_collector_1',
    collectedByName: 'Vikram Singh',
    collectedAt: '2026-06-15T11:30:00Z',
    receiptSent: true
  },
  {
    id: 'p_v2_jul',
    serialNo: 'REC-2026-07-005',
    agreementId: 'ag_2',
    vendorId: 'v2',
    cartId: 'c2',
    month: '2026-07',
    dueAmount: 7000,
    amountCollected: 7000,
    balanceCarriedForward: 0,
    paymentMode: 'upi',
    penalty: 0,
    discount: 0,
    extraCharges: 0,
    notes: 'Paid fully for July.',
    collectedBy: 'usr_collector_1',
    collectedByName: 'Vikram Singh',
    collectedAt: '2026-07-03T14:20:00Z',
    receiptSent: true
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    serialNo: 'AUD-00001',
    entityType: 'payment',
    entityId: 'p_v1_jun',
    action: 'create',
    changedBy: 'usr_collector_1',
    changedByName: 'Vikram Singh',
    changedAt: '2026-06-15T11:30:00Z',
    newValue: '₹4,750 collected for John Patel. Shortfall ₹2,250 carried forward.',
    description: 'Payment collected by Field Collector'
  }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Payment Collected',
    message: 'Vikram Singh collected ₹7,000 from Ramesh Kumar (CART-102)',
    timestamp: '2026-07-03T14:20:00Z',
    read: true,
    type: 'payment',
    vendorId: 'v2'
  }
];

/** Returns the companyId of the currently logged-in session (if any). */
function getSessionCompanyId(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.companyId || null;
  } catch (e) {
    return null;
  }
}

/**
 * Scope a storage key by the active company so different tenants never share
 * cached data on the same device. Auth session + users + partner leads stay
 * global (they are not company-scoped).
 */
function scopedKey(key: string): string {
  const companyId = getSessionCompanyId();
  if (!companyId) return key;
  if (key === USERS_KEY || key === AUTH_SESSION_KEY || key === PARTNER_LEADS_KEY) return key;
  return `${key}_${companyId}`;
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(scopedKey(key));
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(scopedKey(key), JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

/**
 * Company-scoped data collections must NEVER fall back to the demo seed data.
 * A company user with no cached list yet should see an empty list, not the
 * demo vendors/carts/agreements/payments of the global demo account.
 */
function emptyForCompany<T>(fallback: T): T {
  const companyId = getSessionCompanyId();
  if (!companyId) return fallback;
  if (Array.isArray(fallback)) return [] as T;
  return fallback;
}

export class StorageService {
  static init(): void {
    if (!localStorage.getItem(USERS_KEY)) {
      setStored(USERS_KEY, INITIAL_USERS);
      setStored(VENDORS_KEY, INITIAL_VENDORS);
      setStored(CARTS_KEY, INITIAL_CARTS);
      setStored(AGREEMENTS_KEY, INITIAL_AGREEMENTS);
      setStored(PAYMENTS_KEY, INITIAL_PAYMENTS);
      setStored(AUDIT_LOGS_KEY, INITIAL_AUDIT_LOGS);
      setStored(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    }
  }

  // Users & Staff Accounts
  static getUsers(): User[] {
    return getStored<User[]>(USERS_KEY, INITIAL_USERS);
  }

  static saveUser(user: User, currentUser: User): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setStored(USERS_KEY, users);

    this.addAuditLog({
      entityType: 'user',
      entityId: user.id,
      action: index >= 0 ? 'update' : 'create',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      description: index >= 0 ? `Updated Field Staff account: ${user.name}` : `Created Field Staff account: ${user.name}`
    });

    return user;
  }

  static deleteUser(userId: string, currentUser: User): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    setStored(USERS_KEY, users);

    this.addAuditLog({
      entityType: 'user',
      entityId: userId,
      action: 'delete',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      description: `Deleted Staff account: ${userId}`
    });
  }

  // Authentication Session Management
  static getCurrentSession(): User | null {
    return getStored<User | null>(AUTH_SESSION_KEY, null);
  }

  static setSession(user: User | null): void {
    if (user) setStored(AUTH_SESSION_KEY, user);
    else localStorage.removeItem(AUTH_SESSION_KEY);
  }

  static login(identity: string, pass: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const user = users.find(
      u => (u.email.toLowerCase() === identity.toLowerCase() || u.phone.includes(identity)) && u.password === pass
    );

    if (user) {
      this.setSession(user);
      return { success: true, user };
    }
    return { success: false, error: 'Invalid login credentials. Please check your email/phone and password.' };
  }

  static logout(): void {
    this.setSession(null);
  }

// Vendors
  static getVendors(): Vendor[] {
    return getStored<Vendor[]>(VENDORS_KEY, emptyForCompany(INITIAL_VENDORS));
  }

  static saveVendor(vendor: Vendor, currentUser: User): Vendor {
    const vendors = this.getVendors();
    const index = vendors.findIndex(v => v.id === vendor.id);
    const isNew = index < 0;
    if (index >= 0) vendors[index] = vendor;
    else vendors.unshift(vendor);
    setStored(VENDORS_KEY, vendors);

    this.addAuditLog({
      entityType: 'vendor',
      entityId: vendor.id,
      action: isNew ? 'create' : 'update',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      description: isNew ? `Added vendor: ${vendor.fullName}` : `Updated details for ${vendor.fullName}`
    });

    return vendor;
  }

// Carts
  static getCarts(): Cart[] {
    return getStored<Cart[]>(CARTS_KEY, emptyForCompany(INITIAL_CARTS));
  }

  static saveCart(cart: Cart, currentUser: User): Cart {
    const carts = this.getCarts();
    const index = carts.findIndex(c => c.id === cart.id);
    const isNew = index < 0;
    if (index >= 0) carts[index] = cart;
    else carts.unshift(cart);
    setStored(CARTS_KEY, carts);

    this.addAuditLog({
      entityType: 'cart',
      entityId: cart.id,
      action: isNew ? 'create' : 'update',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      description: isNew ? `Registered cart ${cart.cartNumber}` : `Updated cart ${cart.cartNumber}`
    });

    return cart;
  }

  static updateCartLocation(cartId: string, lat: number, lng: number, address: string, currentUser: User): Cart | null {
    const carts = this.getCarts();
    const cart = carts.find(c => c.id === cartId);
    if (!cart) return null;

    const oldLoc = `Lat: ${cart.currentLat}, Lng: ${cart.currentLng}`;
    cart.currentLat = lat;
    cart.currentLng = lng;
    cart.lastLocationAddress = address;
    cart.lastLocationUpdateAt = new Date().toISOString();
    cart.lastUpdatedBy = currentUser.name;

    setStored(CARTS_KEY, carts);

    this.addAuditLog({
      entityType: 'cart',
      entityId: cart.id,
      action: 'location_update',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      oldValue: oldLoc,
      newValue: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (${address})`,
      description: `GPS coordinates updated for ${cart.cartNumber}`
    });

    this.addNotification({
      title: 'Cart Location Updated',
      message: `${currentUser.name} updated location for ${cart.cartNumber} (${address})`,
      type: 'location'
    });

    return cart;
  }

// Agreements
  static getAgreements(): RentAgreement[] {
    return getStored<RentAgreement[]>(AGREEMENTS_KEY, emptyForCompany(INITIAL_AGREEMENTS));
  }

  static saveAgreement(agreement: RentAgreement, currentUser: User): RentAgreement {
    const agreements = this.getAgreements();
    const index = agreements.findIndex(a => a.id === agreement.id);
    if (index >= 0) agreements[index] = agreement;
    else agreements.unshift(agreement);
    setStored(AGREEMENTS_KEY, agreements);
    return agreement;
  }

// Payments
  static getPayments(): Payment[] {
    return getStored<Payment[]>(PAYMENTS_KEY, emptyForCompany(INITIAL_PAYMENTS));
  }

  static addPayment(payment: Omit<Payment, 'id' | 'serialNo'>, currentUser: User): Payment {
    const payments = this.getPayments();
    const yearMonth = payment.month.replace('-', '');
    const count = payments.filter(p => p.month === payment.month).length + 1;
    const serialNo = `REC-${yearMonth}-${String(count).padStart(3, '0')}`;

    const newPayment: Payment = {
      ...payment,
      id: `p_${Date.now()}`,
      serialNo,
      collectedAt: new Date().toISOString()
    };

    payments.unshift(newPayment);
    setStored(PAYMENTS_KEY, payments);

    // Update Vendor Loyalty Score
    const vendor = this.getVendors().find(v => v.id === payment.vendorId);
    if (vendor) {
      const vendorPayments = payments.filter(p => p.vendorId === vendor.id);
      const onTimeCount = vendorPayments.filter(p => p.balanceCarriedForward <= 0).length;
      vendor.loyaltyScore = Math.min(100, Math.round((onTimeCount / Math.max(1, vendorPayments.length)) * 100));
      this.saveVendor(vendor, currentUser);
    }

    this.addAuditLog({
      entityType: 'payment',
      entityId: newPayment.id,
      action: 'create',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      newValue: `Collected ₹${newPayment.amountCollected.toLocaleString()} for ${payment.month}. Balance: ₹${newPayment.balanceCarriedForward.toLocaleString()}`,
      description: `Payment recorded by ${currentUser.name}`
    });

    this.addNotification({
      title: 'Payment Collected',
      message: `${currentUser.name} collected ₹${newPayment.amountCollected.toLocaleString()} (${newPayment.month})`,
      type: 'payment',
      vendorId: payment.vendorId
    });

    return newPayment;
  }

// Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(AUDIT_LOGS_KEY, emptyForCompany(INITIAL_AUDIT_LOGS));
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'serialNo' | 'changedAt'>): AuditLog {
    const logs = this.getAuditLogs();
    const count = logs.length + 1;
    const serialNo = `AUD-${String(count).padStart(5, '0')}`;
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}`,
      serialNo,
      changedAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    setStored(AUDIT_LOGS_KEY, logs);
    return newLog;
  }

// Notifications
  static getNotifications(): AppNotification[] {
    return getStored<AppNotification[]>(NOTIFICATIONS_KEY, emptyForCompany(INITIAL_NOTIFICATIONS));
  }

  static addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const notifs = this.getNotifications();
    notifs.unshift({
      ...notif,
      id: `n_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    });
    setStored(NOTIFICATIONS_KEY, notifs);
  }

  static markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const n = notifs.find(item => item.id === id);
    if (n) {
      n.read = true;
      setStored(NOTIFICATIONS_KEY, notifs);
    }
  }

  // Terminate Agreement & Return Cart to Yard
  static terminateAgreementAndReturnCart(
    agreementId: string,
    currentUser: User,
    notes?: string
  ): { agreement: RentAgreement; cart: Cart } | null {
    const agreements = this.getAgreements();
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return null;

    agreement.status = 'terminated';
    agreement.terminatedAt = new Date().toISOString();
    agreement.finalSettlementNotes = notes || 'Cart returned and agreement terminated.';
    setStored(AGREEMENTS_KEY, agreements);

    // Update Cart status back to 'available'
    const carts = this.getCarts();
    const cart = carts.find(c => c.id === agreement.cartId);
    if (cart) {
      cart.status = 'available';
      cart.lastUpdatedBy = currentUser.name;
      setStored(CARTS_KEY, carts);
    }

    // Update Vendor status if no other active agreements
    const activeForVendor = agreements.filter(a => a.vendorId === agreement.vendorId && a.status === 'active');
    if (activeForVendor.length === 0) {
      const vendors = this.getVendors();
      const vendor = vendors.find(v => v.id === agreement.vendorId);
      if (vendor) {
        vendor.status = 'inactive';
        setStored(VENDORS_KEY, vendors);
      }
    }

    this.addAuditLog({
      entityType: 'agreement',
      entityId: agreement.id,
      action: 'update',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      description: `Cart ${cart ? cart.cartNumber : ''} returned. Agreement terminated. ${notes || ''}`
    });

    this.addNotification({
      title: 'Cart Returned & Agreement Terminated',
      message: `Cart ${cart ? cart.cartNumber : ''} returned to yard. Final settlement completed by ${currentUser.name}.`,
      type: 'agreement',
      vendorId: agreement.vendorId
    });

    return { agreement, cart: cart! };
  }

  // Partner Leads
  static getPartnerLeads(): PartnerLead[] {
    return getStored<PartnerLead[]>(PARTNER_LEADS_KEY, []);
  }

  static savePartnerLead(lead: Omit<PartnerLead, 'id' | 'createdAt'>): PartnerLead {
    const leads = this.getPartnerLeads();
    const newLead: PartnerLead = {
      ...lead,
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    leads.unshift(newLead);
    setStored(PARTNER_LEADS_KEY, leads);
    return newLead;
  }

  // Privacy Policy: Request Data Deletion Compliance
  static deleteVendorData(vendorId: string, currentUser: User): void {
    const vendors = this.getVendors().filter(v => v.id !== vendorId);
    setStored(VENDORS_KEY, vendors);

    this.addAuditLog({
      entityType: 'vendor',
      entityId: vendorId,
      action: 'delete',
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      description: `Privacy DPDP Request: Deleted vendor data for ID ${vendorId}`
    });
  }

  static resetData(): void {
    localStorage.clear();
    this.init();
  }
}

StorageService.init();
