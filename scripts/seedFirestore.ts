/**
 * Seed Firestore with realistic test data
 * 
 * SETUP:
 *   1. npm install -D firebase-admin tsx
 *   2. Download service account key from Firebase Console → Project Settings → Service Accounts
 *   3. Save as serviceAccountKey.json in project root (add to .gitignore!)
 * 
 * RUN:
 *   npx tsx scripts/seedFirestore.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('serviceAccountKey.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  // 1. Zones
  console.log('📍 Creating zones...');
  const zones = [
    { id: 'RAM', name: 'Rameshwar', prefix: 'RAM' },
    { id: 'KKV', name: 'KKV Hall', prefix: 'KKV' },
    { id: 'BAB', name: 'Babariya', prefix: 'BAB' },
  ];
  for (const z of zones) {
    await db.collection('zones').doc(z.id).set(z);
  }
  console.log(`   ✅ ${zones.length} zones created`);

  // 2. Carts with area-scoped IDs
  console.log('🛒 Creating carts...');
  const cartsByZone: Record<string, number> = { RAM: 3, KKV: 4, BAB: 3 };
  for (const [prefix, count] of Object.entries(cartsByZone)) {
    for (let i = 1; i <= count; i++) {
      const cartId = `${prefix}-${i}`;
      await db.collection('carts').doc(cartId).set({
        cartNumber: cartId,
        areaPrefix: prefix,
        modelType: 'Standard FastFood Cart V2',
        photoUrl: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=600&q=80',
        status: 'rented',
        currentLat: 23.02 + Math.random() * 0.05,
        currentLng: 72.57 + Math.random() * 0.05,
        lastLocationAddress: `${prefix} Area, Ahmedabad`,
        lastLocationUpdateAt: new Date().toISOString(),
        lastUpdatedBy: 'seed-script',
      });
    }
    await db.collection('zoneCounters').doc(prefix).set({ lastNumber: count });
  }
  const totalCarts = Object.values(cartsByZone).reduce((a, b) => a + b, 0);
  console.log(`   ✅ ${totalCarts} carts created`);

  // 3. Users (Admin + Collector)
  console.log('👤 Creating users...');
  const users = [
    {
      id: 'usr_admin',
      name: 'Rajesh Sharma (Owner)',
      phone: '+91 98765 43210',
      email: 'admin@cartkhata.com',
      role: 'admin',
      active: true,
      assignedVendorIds: [],
    },
    {
      id: 'usr_collector_1',
      name: 'Vikram Singh (Field Staff)',
      phone: '+91 98123 45678',
      email: 'vikram@cartkhata.com',
      role: 'collector',
      active: true,
      assignedVendorIds: [], // will update after vendors created
    },
  ];
  for (const u of users) {
    await db.collection('users').doc(u.id).set(u);
  }
  console.log(`   ✅ ${users.length} users created`);

  // 4. Vendors, Agreements, Payments
  console.log('🏪 Creating vendors, agreements, and payments...');
  const sampleVendors = [
    { firstName: 'Ramesh', lastName: 'Patel', phone: '9800000001', cartId: 'RAM-1', zoneId: 'RAM', rent: 7000, advance: 7000, address: 'Near Rameshwar Temple, Ahmedabad' },
    { firstName: 'Suresh', lastName: 'Chauhan', phone: '9800000002', cartId: 'KKV-1', zoneId: 'KKV', rent: 7000, advance: 5000, address: 'KKV Hall Road, Ahmedabad' },
    { firstName: 'Kiran', lastName: 'Joshi', phone: '9800000003', cartId: 'BAB-1', zoneId: 'BAB', rent: 8000, advance: 8000, address: 'Babariya Market, Ahmedabad' },
    { firstName: 'Mahesh', lastName: 'Verma', phone: '9800000004', cartId: 'RAM-2', zoneId: 'RAM', rent: 7000, advance: 7000, address: 'RAM Circle, Ahmedabad' },
    { firstName: 'Prakash', lastName: 'Thakor', phone: '9800000005', cartId: 'KKV-2', zoneId: 'KKV', rent: 7500, advance: 6000, address: 'KKV Main Road, Ahmedabad' },
  ];

  const vendorIds: string[] = [];
  const agreementIds: string[] = [];

  for (const v of sampleVendors) {
    const vendorRef = db.collection('vendors').doc();
    await vendorRef.set({
      fullName: `${v.firstName} ${v.lastName}`,
      phone: v.phone,
      whatsAppPhone: v.phone,
      address: v.address,
      areaTag: v.zoneId,
      emergencyContact: v.phone,
      photoUrl: `https://ui-avatars.com/api/?name=${v.firstName}+${v.lastName}&background=ea580c&color=fff&size=150`,
      idProofUrl: '',
      idProofType: 'aadhaar',
      idProofNumber: `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
      joinDate: '2026-01-15',
      status: 'active',
      loyaltyScore: 70 + Math.floor(Math.random() * 30),
      securityDeposit: v.advance,
      advanceRent: v.advance,
      dpdpConsented: true,
      dpdpConsentDate: '2026-01-15',
    });
    vendorIds.push(vendorRef.id);

    const agreementRef = db.collection('agreements').doc();
    await agreementRef.set({
      vendorId: vendorRef.id,
      cartId: v.cartId,
      monthlyRent: v.rent,
      advanceRentPaid: v.advance,
      startDate: '2026-01-15',
      termMonths: null,
      status: 'active',
      carriedBalance: 0,
    });
    agreementIds.push(agreementRef.id);

    // Create 2 months of payment history
    for (const month of ['2026-06', '2026-07']) {
      const isPaid = Math.random() > 0.3;
      await db.collection('payments').add({
        serialNo: `REC-${month.replace('-', '')}-${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`,
        agreementId: agreementRef.id,
        vendorId: vendorRef.id,
        cartId: v.cartId,
        month,
        dueAmount: v.rent,
        amountCollected: isPaid ? v.rent : Math.floor(v.rent * 0.5),
        balanceCarriedForward: isPaid ? 0 : Math.floor(v.rent * 0.5),
        paymentMode: 'cash',
        penalty: 0,
        discount: 0,
        extraCharges: 0,
        collectedBy: 'usr_collector_1',
        collectedByName: 'Vikram Singh',
        collectedAt: new Date().toISOString(),
        receiptSent: true,
      });
    }
  }
  console.log(`   ✅ ${vendorIds.length} vendors, ${agreementIds.length} agreements, ${vendorIds.length * 2} payments created`);

  // 5. Update collector's assigned vendors
  await db.collection('users').doc('usr_collector_1').update({
    assignedVendorIds: vendorIds.slice(0, 3), // first 3 vendors
  });
  console.log('   ✅ Collector assigned to 3 vendors');

  // 6. Audit log sample
  await db.collection('auditLogs').add({
    serialNo: 'AUD-20260727-0001',
    entityType: 'system',
    entityId: 'seed',
    action: 'create',
    changedBy: 'seed-script',
    changedByName: 'Seed Script',
    changedAt: new Date().toISOString(),
    description: 'Initial data seed completed',
  });

  console.log('\n🎉 Seed complete!');
  console.log('   - 3 zones');
  console.log(`   - ${totalCarts} carts`);
  console.log('   - 2 users (admin + collector)');
  console.log(`   - ${sampleVendors.length} vendors`);
  console.log(`   - ${sampleVendors.length} agreements`);
  console.log(`   - ${sampleVendors.length * 2} payments`);
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
