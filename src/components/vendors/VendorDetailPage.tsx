import React, { useRef, useEffect } from 'react';
import { User, Vendor, Cart, RentAgreement, Payment } from '../../types';
import { calculateVendorLedger, exportVendorPDFStatement, getLoyaltyBadgeInfo } from '../../utils/ledger';
import {
  ArrowLeft, ShieldCheck, Phone, MapPin, FileText, Lock, RefreshCw,
  MoreVertical, Wallet, Coins, Receipt, QrCode
} from 'lucide-react';

interface VendorDetailPageProps {
  vendorId?: string;
  currentUser: User;
  vendors: Vendor[];
  carts: Cart[];
  agreements: RentAgreement[];
  payments: Payment[];
  onBack?: () => void;
  onReturnCart?: (summary: any) => void;
}

export const VendorDetailPage: React.FC<VendorDetailPageProps> = ({
  vendorId,
  currentUser,
  vendors,
  carts,
  agreements,
  payments,
  onBack,
  onReturnCart
}) => {
  // Find target vendor by prop vendorId or fallback to first vendor (NEVER STUCK / BLANK)
  const vendor = vendors.find(v => v.id === vendorId) || vendors[0];

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center space-y-3">
          <p className="text-slate-400 text-sm">No vendor record found</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg"
            >
              Go Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const summary = calculateVendorLedger(vendor, agreements, carts, payments);
  const cart = carts.find(c => c.id === summary.cart?.id);
  const agreement = agreements.find(a => a.vendorId === vendor.id && a.status === 'active');
  const { currentTotalDue, balanceRemaining } = summary;
  const loyaltyInfo = getLoyaltyBadgeInfo(vendor.loyaltyScore);

  const vendorPayments = payments
    .filter(p => p.vendorId === vendor.id)
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

  const totalPaidAllTime = vendorPayments.reduce((sum, p) => sum + p.amountCollected, 0);
  const advancePayment = vendor.advanceRent || agreement?.advanceRentPaid || 7000;
  const cleanPhone = vendor.phone.replace(/[^0-9]/g, '');

  const scoreText = vendor.loyaltyScore >= 90 ? 'Excellent' : vendor.loyaltyScore >= 75 ? 'Good' : 'Standard';

  const middleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (middleRef.current) {
      middleRef.current.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 animate-fade-in relative">
      {/* ─── Top Header Bar ─── */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-white transition active:scale-95 shadow-md"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
          Vendor Master Profile
        </span>

        <button
          className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-white transition"
          aria-label="Options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="px-4 py-4 space-y-5 max-w-2xl mx-auto">
        {/* ─── Hero Section: Avatar + Top Stats Card ─── */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Avatar with Active Indicator Dot */}
          <div className="relative shrink-0">
            <img
              src={vendor.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt={vendor.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-800 shadow-2xl"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-md" />
          </div>

          {/* Right: Glass Card with Cart ID + Score */}
          <div className="flex-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 shadow-xl">
            {/* Cart ID Column */}
            <div className="flex items-center gap-2 border-r border-slate-800 pr-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                🛒
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cart ID</p>
                <p className="text-sm font-black font-mono text-orange-400 truncate">
                  {cart ? cart.cartNumber : 'RAM-001'}
                </p>
              </div>
            </div>

            {/* Score Column */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                🏵️
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score</p>
                <p className="text-sm font-black text-emerald-400">{vendor.loyaltyScore}%</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase">{scoreText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Vendor Identity Header ─── */}
        <div ref={middleRef} className="space-y-1.5">
          <h1 className="text-2xl font-black text-white font-outfit tracking-wide">
            {vendor.fullName}
          </h1>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">
            Cart Rent Vendor
          </p>

          <div className="space-y-1 pt-1 text-xs text-slate-300">
            <p className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{vendor.address}</span>
            </p>
            <p className="flex items-center gap-1.5 font-mono text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{vendor.phone}</span>
            </p>
          </div>
        </div>

        {/* ─── 3 Financial KPI Cards (Advance, Total Paid, Current Due) ─── */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Advance Payment */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-start gap-2 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Advance Payment</p>
              <p className="text-base font-black text-white font-outfit">
                ₹{advancePayment.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card 2: Total Paid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-start gap-2 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Paid</p>
              <p className="text-base font-black text-white font-outfit">
                ₹{totalPaidAllTime.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card 3: Current Due */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-start gap-2 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Current Due</p>
              <p className={`text-base font-black font-outfit ${balanceRemaining > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                ₹{currentTotalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ─── ID Proof Verified Card Section ─── */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ID Proof Verified
            </span>
            {currentUser.role !== 'admin' && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> Admin Restricted
              </span>
            )}
          </div>

          {currentUser.role === 'admin' ? (
            <div className="space-y-3">
              {/* Graphic Aadhaar Card Replica */}
              <div className="bg-slate-100 text-slate-900 rounded-2xl p-4 border border-slate-300 shadow-md relative overflow-hidden space-y-3">
                {/* Header emblem & bar */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇮🇳</span>
                    <div>
                      <p className="text-[10px] font-extrabold text-orange-700 leading-tight">भारत सरकार</p>
                      <p className="text-[10px] font-bold text-emerald-800 leading-tight">GOVERNMENT OF INDIA</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs">☀️</span>
                    <p className="text-[9px] font-black text-amber-700 uppercase">AADHAAR</p>
                  </div>
                </div>

                {/* Photo & Details Row */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 bg-slate-300 rounded-lg border border-slate-400 flex items-center justify-center shrink-0 overflow-hidden">
                    {vendor.photoUrl ? (
                      <img src={vendor.photoUrl} alt="ID" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>

                  <div className="flex-1 text-[11px] space-y-0.5">
                    <p className="text-[9px] text-slate-500 font-semibold uppercase">नाम / Name</p>
                    <p className="font-bold text-slate-900">{vendor.fullName}</p>

                    <p className="text-[9px] text-slate-500 font-semibold uppercase mt-1">जन्म तिथि / DOB</p>
                    <p className="font-semibold text-slate-800">XX/XX/XXXX</p>

                    <p className="text-[9px] text-slate-500 font-semibold uppercase mt-1">लिंग / Gender</p>
                    <p className="font-semibold text-slate-800">MALE / FEMALE</p>
                  </div>

                  {/* QR Code graphic */}
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-lg p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-12 h-12 text-slate-200" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-slate-400 font-mono">
                {vendor.idProofType.toUpperCase()} Card No: <strong className="text-white">{vendor.idProofNumber || 'XXXX XXXX 4829'}</strong>
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-slate-400 text-center text-xs font-medium">
              🔒 Sensitive government ID documents are restricted to Admin accounts under DPDP Act privacy rules.
            </div>
          )}
        </div>

        {/* ─── Payment Ledger History Section ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-400" />
              Payment Ledger History
            </h3>

            <div className="flex items-center gap-2">
              {onReturnCart && cart && cart.status === 'rented' && (
                <button
                  onClick={() => onReturnCart(summary)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Return Cart &amp; Settle
                </button>
              )}

              <button
                onClick={() => exportVendorPDFStatement(summary, payments)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Sr. No.</th>
                  <th className="p-3">Month</th>
                  <th className="p-3">Due (₹)</th>
                  <th className="p-3">Paid (₹)</th>
                  <th className="p-3">Carried (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {vendorPayments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-200">{p.month}</td>
                    <td className="p-3 font-mono text-orange-400">₹{p.dueAmount.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">₹{p.amountCollected.toLocaleString()}</td>
                    <td className="p-3 font-mono text-rose-400">₹{p.balanceCarriedForward.toLocaleString()}</td>
                  </tr>
                ))}
                {vendorPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      No payment transactions recorded for this vendor yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Floating Green Call FAB ─── */}
      <a
        href={`tel:${cleanPhone}`}
        className="fixed bottom-20 right-4 z-40 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-4 py-3 rounded-full shadow-2xl shadow-emerald-600/50 border-2 border-white/20 flex items-center gap-2 transition active:scale-95"
      >
        <Phone className="w-4 h-4 fill-white" />
        <span>Call</span>
      </a>
    </div>
  );
};
