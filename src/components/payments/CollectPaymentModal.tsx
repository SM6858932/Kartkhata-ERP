import React, { useState } from 'react';
import { User, PaymentMode } from '../../types';
import { VendorLedgerSummary, generateWhatsAppReceiptUrl } from '../../utils/ledger';
import { StorageService } from '../../services/storage';
import { recordPayment } from '../../services/paymentsFirestore';
import { NotificationService, AuditLogService, CartService } from '../../services/firestore';
import { X, IndianRupee, MessageSquare, MapPin, CheckCircle2, AlertTriangle, Send, Loader2 } from 'lucide-react';

interface CollectPaymentModalProps {
    summary: VendorLedgerSummary;
    currentUser: User;
    onClose: () => void;
    onSuccess: () => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
    summary,
    currentUser,
    onClose,
    onSuccess
}) => {
    const { vendor, cart, currentTotalDue, baseRent, previousBalance, currentMonth } = summary;

    const [amountCollected, setAmountCollected] = useState<number>(currentTotalDue);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
    const [notes, setNotes] = useState('');
    const [updateGpsOnCollect, setUpdateGpsOnCollect] = useState(false);
    const [gpsAddress, setGpsAddress] = useState(cart?.lastLocationAddress || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-calculated carry forward balance
    const remainingBalance = currentTotalDue - (Number(amountCollected) || 0);

    const handleFullAmountClick = () => setAmountCollected(currentTotalDue);
    const handleHalfAmountClick = () => setAmountCollected(Math.round(currentTotalDue / 2));

    const getCurrentPosition = (): Promise<GeolocationPosition> =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported on this device'));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000,
            });
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amountCollected < 0) return;

        setIsSubmitting(true);

        try {
            // 1. Record payment in Firestore (handles carried balance atomically)
            const payment = await recordPayment({
                agreementId: summary.agreement?.id || 'ag_default',
                vendorId: vendor.id,
                cartId: cart?.id || 'c_default',
                month: currentMonth,
                amountCollected: Number(amountCollected),
                paymentMode,
                penalty: 0,
                discount: 0,
                extraCharges: 0,
                notes,
                collectedBy: currentUser.id,
                collectedByName: currentUser.name,
            });

            // 2. Also save to localStorage for offline cache
            StorageService.addPayment(
                {
                    agreementId: summary.agreement?.id || 'ag_default',
                    vendorId: vendor.id,
                    cartId: cart?.id || 'c_default',
                    month: currentMonth,
                    dueAmount: currentTotalDue,
                    amountCollected: Number(amountCollected),
                    balanceCarriedForward: remainingBalance,
                    paymentMode,
                    penalty: 0,
                    discount: 0,
                    extraCharges: 0,
                    notes,
                    collectedBy: currentUser.id,
                    collectedByName: currentUser.name,
                    collectedAt: new Date().toISOString(),
                    receiptSent: true
                },
                currentUser
            );

            // 3. Notify Admin about the payment
            await NotificationService.create({
                title: '💰 Payment Received',
                message: `${vendor.fullName} paid ₹${Number(amountCollected).toLocaleString()} for ${currentMonth} (${paymentMode.toUpperCase()}). Receipt: ${payment.serialNo}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'payment',
                vendorId: vendor.id,
            });

            // 4. Audit log entry
            await AuditLogService.create({
                entityType: 'payment',
                entityId: payment.id,
                action: 'create',
                changedBy: currentUser.id,
                changedByName: currentUser.name,
                changedAt: new Date().toISOString(),
                description: `Payment of ₹${Number(amountCollected).toLocaleString()} received from ${vendor.fullName} for ${currentMonth}`,
                newValue: `Receipt ${payment.serialNo} | Mode ${paymentMode} | Balance CF ₹${remainingBalance.toLocaleString()}`,
            });

            // 5. Update Cart Location if checked (real one-shot GPS -> Firestore, localStorage fallback)
            if (updateGpsOnCollect && cart) {
                let lat = cart.currentLat;
                let lng = cart.currentLng;
                try {
                    const position = await getCurrentPosition();
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                } catch (gpsErr) {
                    console.warn('GPS fix failed, keeping last known location:', gpsErr);
                }
                await CartService.updateLocation(cart.id, lat, lng, gpsAddress);
                StorageService.updateCartLocation(cart.id, lat, lng, gpsAddress, currentUser);
            }

            // 6. Open WhatsApp Receipt link
            const waUrl = generateWhatsAppReceiptUrl(
                vendor.phone,
                vendor.fullName,
                payment,
                cart ? cart.cartNumber : 'N/A'
            );
            window.open(waUrl, '_blank');

            onSuccess();
        } catch (err) {
            console.error('Failed to record payment to Firestore:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Payment Collection Workflow</span>
                        <h2 className="text-lg font-black font-outfit">Collect Rent — {vendor.fullName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Vendor & Cart Overview Card */}
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                        <img
                            src={vendor.photoUrl}
                            alt={vendor.fullName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-600 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-white text-sm truncate">{vendor.fullName}</h4>
                                {cart && (
                                    <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-md">
                                        {cart.cartNumber}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{vendor.phone}</p>
                        </div>
                    </div>

                    {/* Breakdown Box: Base Rent + Previous Carryover Shortfall */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                            <span>Base Rent ({currentMonth}):</span>
                            <span className="font-semibold text-slate-200">₹{baseRent.toLocaleString()}</span>
                        </div>
                        {previousBalance > 0 && (
                            <div className="flex justify-between text-rose-400">
                                <span>Previous Unpaid Shortfall:</span>
                                <span className="font-bold">+₹{previousBalance.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-white">
                            <span>Total Collectable Due:</span>
                            <span className="text-amber-400 font-outfit text-base">₹{currentTotalDue.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Amount Collected Input & Quick Preset Buttons */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                            Amount Received (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                required
                                value={amountCollected}
                                onChange={e => setAmountCollected(Number(e.target.value))}
                                className="w-full bg-slate-800 border-2 border-orange-500/80 text-white font-extrabold text-lg pl-8 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 transition"
                            />
                        </div>

                        {/* Quick Fill Chips */}
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                type="button"
                                onClick={handleFullAmountClick}
                                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/30 transition"
                            >
                                Full Due (₹{currentTotalDue.toLocaleString()})
                            </button>
                            <button
                                type="button"
                                onClick={handleHalfAmountClick}
                                className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition"
                            >
                                Half (₹{Math.round(currentTotalDue / 2).toLocaleString()})
                            </button>
                        </div>
                    </div>

                    {/* Carry-Forward Calculation Feedback Pill */}
                    <div className="p-3 rounded-xl border text-xs font-semibold">
                        {remainingBalance === 0 ? (
                            <div className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 p-2 rounded-lg flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Full Settlement — Zero balance carried forward to next month!</span>
                            </div>
                        ) : remainingBalance > 0 ? (
                            <div className="bg-amber-500/10 border-amber-500/30 text-amber-300 p-2 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>
                                    Partial Payment — <strong>₹{remainingBalance.toLocaleString()}</strong> shortfall will automatically carry forward to next month's due!
                                </span>
                            </div>
                        ) : (
                            <div className="bg-sky-500/10 border-sky-500/30 text-sky-300 p-2 rounded-lg flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>
                                    Advance Payment — <strong>₹{Math.abs(remainingBalance).toLocaleString()}</strong> advance credit will reduce next month's due!
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Payment Mode Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['cash', 'upi', 'bank_transfer'] as PaymentMode[]).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setPaymentMode(mode)}
                                    className={`py-2 px-2 text-xs font-bold rounded-xl border capitalize transition ${paymentMode === mode
                                        ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/30'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                                        }`}
                                >
                                    {mode === 'cash' ? '💵 Cash' : mode === 'upi' ? '⚡ UPI / GPay' : '🏦 Bank Transfer'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional On-Site Cart GPS Location Update Checkbox */}
                    {cart && (
                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-2">
                            {paymentMode === 'cash' ? (
                                <>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={updateGpsOnCollect}
                                            onChange={e => setUpdateGpsOnCollect(e.target.checked)}
                                            className="w-4 h-4 rounded text-orange-600 bg-slate-900 border-slate-700 focus:ring-orange-500"
                                        />
                                        <MapPin className="w-4 h-4 text-orange-400" />
                                        <span>On-Site Visit: Update Cart GPS location right now?</span>
                                    </label>

                                    {updateGpsOnCollect && (
                                        <input
                                            type="text"
                                            placeholder="Enter current location landmark or street address"
                                            value={gpsAddress}
                                            onChange={e => setGpsAddress(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500"
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold py-1">
                                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span>
                                        ⚡ <strong>Online Payment ({paymentMode === 'upi' ? 'UPI / GPay' : 'Bank Transfer'}):</strong> GPS location update bypassed (not required for online transactions).
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Collection Notes (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Received cash at CG Road outlet..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Recording Payment...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Confirm &amp; Send WhatsApp Receipt</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
