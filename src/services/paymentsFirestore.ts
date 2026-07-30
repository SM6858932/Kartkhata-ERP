import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PaymentMode } from '../types';

const agreementsCol = collection(db, 'agreements');
const paymentsCol = collection(db, 'payments');
const serialCounterRef = doc(db, 'counters', 'paymentSerial');

export interface RecordPaymentInput {
  agreementId: string;
  vendorId: string;
  cartId: string;
  month: string; // "2026-07"
  amountCollected: number;
  paymentMode: PaymentMode;
  penalty?: number;
  discount?: number;
  extraCharges?: number;
  notes?: string;
  collectedBy: string;
  collectedByName: string;
}

/**
 * Records a payment in a single transaction:
 * 1. Reads agreement's carriedBalance
 * 2. Computes totalDue = monthlyRent + carriedBalance
 * 3. Writes Payment doc with auto-incrementing serial
 * 4. Updates agreement's carriedBalance
 * 5. Increments payment serial counter
 *
 * Security: Collector accounts can only update carriedBalance on agreements
 * (enforced by firestore.rules field-level restriction).
 */
export async function recordPayment(input: RecordPaymentInput): Promise<string> {
  const agreementRef = doc(agreementsCol, input.agreementId);
  const paymentRef = doc(paymentsCol);

  const paymentId = await runTransaction(db, async tx => {
    const agreementSnap = await tx.get(agreementRef);
    if (!agreementSnap.exists()) throw new Error('Rental agreement not found.');
    const agreement = agreementSnap.data();

    // Get next serial number
    const serialSnap = await tx.get(serialCounterRef);
    const currentSerial = serialSnap.exists() ? (serialSnap.data().value as number) : 1000;
    const nextSerial = currentSerial + 1;

    // Calculate amounts
    const monthlyRent = (agreement.monthlyRent as number) ?? 0;
    const carriedIn = (agreement.carriedBalance as number) ?? 0;
    const totalDue = monthlyRent + carriedIn;
    const newCarriedBalance = totalDue - input.amountCollected;

    // Format serial: REC-YYYY-MM-XXXX
    const date = new Date();
    const serialFormatted = `REC-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(nextSerial).padStart(4, '0')}`;

    // Write payment document
    tx.set(paymentRef, {
      serialNo: serialFormatted,
      agreementId: input.agreementId,
      vendorId: input.vendorId,
      cartId: input.cartId,
      month: input.month,
      dueAmount: totalDue,
      amountCollected: input.amountCollected,
      balanceCarriedForward: newCarriedBalance,
      paymentMode: input.paymentMode,
      penalty: input.penalty || 0,
      discount: input.discount || 0,
      extraCharges: input.extraCharges || 0,
      notes: input.notes || '',
      collectedBy: input.collectedBy,
      collectedByName: input.collectedByName,
      collectedAt: Timestamp.now().toDate().toISOString(),
      receiptSent: false,
    });

    // Update agreement's carried balance
    tx.update(agreementRef, { carriedBalance: newCarriedBalance });

    // Increment serial counter
    tx.set(serialCounterRef, { value: nextSerial }, { merge: true });

    return paymentRef.id;
  });

  return paymentId;
}

/**
 * Update receipt status (for WhatsApp integration later)
 */
export async function markReceiptSent(paymentId: string): Promise<void> {
  await runTransaction(db, async tx => {
    tx.update(doc(paymentsCol, paymentId), { receiptSent: true });
  });
}
