import React, { useState } from 'react';
import { User, RentAgreement, Cart, Payment } from '../../types';
import { VendorLedgerSummary } from '../../utils/ledger';
import { StorageService } from '../../services/storage';
import { BatchService } from '../../services/firestore';
import { recordPayment } from '../../services/paymentsFirestore';
import { X, RefreshCw, AlertTriangle, CheckCircle2, IndianRupee, ShieldAlert, Loader2 } from 'lucide-react';

interface ReturnCartModalProps {
    summary: VendorLedgerSummary;
    currentUser: User;
    payments: Payment[];
    onClose: () => void;
    onSuccess: () => void;
}

export const ReturnCartModal: React.FC<ReturnCartModalProps> = ({
    summary,
    currentUser,
    payments,
    onClose,
    onSuccess
}) => {
    const { vendor, cart, agreement, previousBalance } = summary;
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!agreement || !cart) return null;

    // 1. Calculate Months Rented so far
    const startDate = new Date(agreement.startDate);
    const now = new Date();
    const monthsRented = Math.max(
        1,
        (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1
    );

    // 2. Calculate Total Dues = (Monthly Rent * Months Rented) + Unpaid Carryover Balance
    const totalRentAccrued = agreement.monthlyRent * monthsRented;
    const totalDues = totalRentAccrued + previousBalance;

    // 3. Calculate Total Paid = (All Monthly Installments Collected) + (Advance Rent Paid)
    const vendorPayments = payments.filter(p => p.vendorId === vendor.id);
    const installmentsPaid = vendorPayments.reduce((sum, p) => sum + p.amountCollected, 0);
    const advanceRent = agreement.advanceRentPaid || vendor.securityDeposit || 0;
    const totalPaid = installmentsPaid + advanceRent;

    // 4. Final Settlement = Total Paid - Total Dues
    const finalSettlement = totalPaid - totalDues;

    const handleConfirmReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const summaryText = `Return Settlement: Total Dues ₹${totalDues.toLocaleString()}, Total Paid ₹${totalPaid.toLocaleString()} (Incl. ₹${advanceRent.toLocaleString()} Advance). Final Settlement: ${finalSettlement >= 0 ? `Refund ₹${finalSettlement.toLocaleString()} to Vendor` : `Vendor Owes ₹${Math.abs(finalSettlement).toLocaleString()}`
                }. Notes: ${notes}`;

            // 1. Create final settlement Payment record (so it appears in account statement)
            try {
                await recordPayment({
                    agreementId: agreement.id,
                    vendorId: vendor.id,
                    cartId: cart.id,
                    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
                    amountCollected: finalSettlement >= 0 ? 0 : Math.abs(finalSettlement),
                    paymentMode: 'cash',
                    notes: `FINAL SETTLEMENT - ${summaryText}`,
                    collectedBy: currentUser.id,
                    collectedByName: currentUser.name,
                });
            } catch (paymentErr) {
                console.warn('Settlement payment record not saved to cloud, continuing:', paymentErr);
            }

            // 2. Firestore update (primary) with settlement amount
            await BatchService.returnCart(agreement.id, cart.id, summaryText, finalSettlement);

            // 3. localStorage update (offline cache)
            StorageService.terminateAgreementAndReturnCart(agreement.id, currentUser, summaryText);

            onSuccess();
        } catch (err) {
            console.error('Error returning cart:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        <h2 className="text-lg font-black font-outfit">Return Cart &amp; Final Settlement</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form Body */}
                <form onSubmit={handleConfirmReturn} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Vendor & Cart Info Pill */}
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                        <img
                            src={vendor.photoUrl}
                            alt={vendor.fullName}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-600 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-white text-sm truncate">{vendor.fullName}</h4>
                                <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                                    {cart.cartNumber}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">Started: {agreement.startDate} ({monthsRented} month{monthsRented > 1 ? 's' : ''})</p>
                        </div>
                    </div>

                    {/* Detailed Financial Settlement Breakdown Table */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-amber-400 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1.5 flex items-center justify-between">
                            <span>Final Settlement Breakdown</span>
                            <span className="text-slate-400 font-normal">Formula: Total Paid − Total Dues</span>
                        </h4>

                        {/* Dues Calculation */}
                        <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between">
                                <span>Monthly Rent (₹{agreement.monthlyRent.toLocaleString()} × {monthsRented} mo):</span>
                                <span className="font-semibold text-white">₹{totalRentAccrued.toLocaleString()}</span>
                            </div>
                            {previousBalance > 0 && (
                                <div className="flex justify-between text-rose-400">
                                    <span>Previous Unpaid Carryover Balance:</span>
                                    <span className="font-bold">+₹{previousBalance.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800/60 pt-1">
                                <span>Total Dues Accrued:</span>
                                <span className="text-rose-400">₹{totalDues.toLocaleString()}</span>
                            </div>
                        </div>

                        <hr className="border-slate-800" />

                        {/* Payments & Advance Calculation */}
                        <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between">
                                <span>Monthly Installments Collected ({vendorPayments.length} receipts):</span>
                                <span className="font-semibold text-white">₹{installmentsPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-emerald-400">
                                <span>Refundable Advance Rent Paid:</span>
                                <span className="font-bold">+₹{advanceRent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800/60 pt-1">
                                <span>Total Paid (Installments + Advance):</span>
                                <span className="text-emerald-400">₹{totalPaid.toLocaleString()}</span>
                            </div>
                        </div>

                        <hr className="border-slate-800" />

                        {/* Final Settlement Result Callout Box */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${finalSettlement >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            }`}>
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider block">
                                    {finalSettlement >= 0 ? 'Admin Refund Owed to Vendor' : 'Vendor Owed Settlement Shortfall'}
                                </span>
                                <div className="text-lg font-black font-outfit">
                                    ₹{Math.abs(finalSettlement).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                {finalSettlement >= 0 ? (
                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg">
                                        ✓ Refund Vendor
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg">
                                        ⚠️ Collect Shortfall
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block font-bold text-slate-300 mb-1">Return Settlement Notes (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Cart inspected, minor scratch on side counter..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-xl shadow-rose-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Returning Cart...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Confirm Settlement &amp; Return Cart to Yard</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
