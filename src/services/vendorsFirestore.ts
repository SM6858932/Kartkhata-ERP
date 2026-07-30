import {
  collection, doc, runTransaction, updateDoc, onSnapshot, Timestamp, getDocs, setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Vendor, Cart, RentAgreement, Zone } from '../types';

const vendorsCol = collection(db, 'vendors');
const cartsCol = collection(db, 'carts');
const agreementsCol = collection(db, 'agreements');
const zonesCol = collection(db, 'zones');
const zoneCountersCol = collection(db, 'zoneCounters');

// ============================================================
// ZONES
// ============================================================
export async function getAllZones(): Promise<Zone[]> {
  const snap = await getDocs(zonesCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Zone));
}

export function subscribeToZones(callback: (zones: Zone[]) => void) {
  return onSnapshot(zonesCol, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Zone)));
  });
}

export async function createZone(name: string, prefix: string): Promise<string> {
  const id = prefix.toUpperCase();
  await setDoc(doc(zonesCol, id), { name, prefix: id });
  return id;
}

// ============================================================
// CART ID GENERATOR (Atomic per-zone counter)
// ============================================================
async function generateCartId(zonePrefix: string): Promise<string> {
  const prefix = zonePrefix.toUpperCase();
  const counterRef = doc(zoneCountersCol, prefix);

  const cartId = await runTransaction(db, async tx => {
    const counterSnap = await tx.get(counterRef);
    const lastNumber = counterSnap.exists() ? (counterSnap.data().lastNumber as number) : 0;
    const nextNumber = lastNumber + 1;
    const newCartId = `${prefix}-${nextNumber}`;

    tx.set(counterRef, { lastNumber: nextNumber }, { merge: true });
    return newCartId;
  });

  return cartId;
}

// ============================================================
// ONBOARD VENDOR (creates cart + vendor + agreement in transaction)
// ============================================================
export interface OnboardVendorInput {
  fullName: string;
  phone: string;
  whatsAppPhone?: string;
  address: string;
  areaTag: string;
  emergencyContact: string;
  photoUrl?: string;
  idProofUrl?: string;
  idProofType: Vendor['idProofType'];
  idProofNumber: string;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  zonePrefix: string;
  startDate: string;
}

export async function onboardVendor(
  input: OnboardVendorInput
): Promise<{ vendorId: string; cartId: string; agreementId: string }> {
  // Step 1: Generate area-scoped cart ID
  const cartId = await generateCartId(input.zonePrefix);

  // Step 2: Create cart document
  await setDoc(doc(cartsCol, cartId), {
    cartNumber: cartId,
    areaPrefix: input.zonePrefix.toUpperCase(),
    modelType: 'Standard FastFood Cart',
    photoUrl: input.photoUrl || '',
    status: 'available',
    currentLat: 0,
    currentLng: 0,
    lastLocationAddress: input.address,
    lastLocationUpdateAt: new Date().toISOString(),
    lastUpdatedBy: 'system',
  });

  // Step 3: Create vendor + agreement in transaction
  const vendorRef = doc(vendorsCol);
  const agreementRef = doc(agreementsCol);

  await runTransaction(db, async tx => {
    tx.set(vendorRef, {
      fullName: input.fullName,
      phone: input.phone,
      whatsAppPhone: input.whatsAppPhone || input.phone,
      address: input.address,
      areaTag: input.areaTag,
      emergencyContact: input.emergencyContact,
      photoUrl: input.photoUrl || '',
      idProofUrl: input.idProofUrl || '',
      idProofType: input.idProofType,
      idProofNumber: input.idProofNumber,
      joinDate: input.startDate,
      status: 'active',
      loyaltyScore: 100,
      securityDeposit: input.securityDeposit,
      advanceRent: input.advanceRent,
      dpdpConsented: true,
      dpdpConsentDate: new Date().toISOString(),
    });

    tx.set(agreementRef, {
      vendorId: vendorRef.id,
      cartId,
      monthlyRent: input.monthlyRent,
      advanceRentPaid: input.advanceRent,
      startDate: input.startDate,
      termMonths: null,
      status: 'active',
    });
  });

  // Step 4: Assign cart to vendor (update cart status)
  await updateDoc(doc(cartsCol, cartId), {
    status: 'rented',
  });

  return { vendorId: vendorRef.id, cartId, agreementId: agreementRef.id };
}

// ============================================================
// UPDATE VENDOR
// ============================================================
export async function updateVendor(vendorId: string, changes: Partial<Vendor>): Promise<void> {
  await updateDoc(doc(vendorsCol, vendorId), changes);
}

export function subscribeToVendor(vendorId: string, callback: (vendor: Vendor | null) => void) {
  return onSnapshot(doc(vendorsCol, vendorId), snap => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Vendor) : null);
  });
}

export function subscribeToAllVendors(callback: (vendors: Vendor[]) => void) {
  return onSnapshot(vendorsCol, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
  });
}

export function subscribeToAgreement(agreementId: string, callback: (agreement: RentAgreement | null) => void) {
  return onSnapshot(doc(agreementsCol, agreementId), snap => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as RentAgreement) : null);
  });
}
