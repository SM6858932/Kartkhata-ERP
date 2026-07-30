import React from 'react';
import { motion } from 'framer-motion';
import { VendorLedgerSummary, getLoyaltyBadgeInfo } from '../../utils/ledger';
import { MapPin, Phone, IndianRupee, MessageSquare, Map } from 'lucide-react';

interface VendorCardProps {
    summary: VendorLedgerSummary;
    onCollect: (summary: VendorLedgerSummary) => void;
    onOpenMap: (summary: VendorLedgerSummary) => void;
    onViewDetails: (summary: VendorLedgerSummary) => void;
}

export const VendorCard: React.FC<VendorCardProps> = ({
    summary,
    onCollect,
    onOpenMap,
    onViewDetails
}) => {
    const { vendor, cart, currentTotalDue, previousBalance, balanceRemaining, paymentStatus } = summary;
    const loyaltyInfo = getLoyaltyBadgeInfo(vendor.loyaltyScore);
    const cleanPhone = vendor.phone.replace(/[^0-9]/g, '');
    const whatsAppPhone = (vendor.whatsAppPhone || vendor.phone).replace(/[^0-9]/g, '');

    return (
        <div
            onClick={() => onViewDetails(summary)}
            className="w-full rounded-2xl border shadow-lg transition-all duration-200 overflow-hidden cursor-pointer theme-transition bg-white border-slate-200 hover:border-orange-400 hover:shadow-orange-200/40 dark:bg-slate-900 dark:border-slate-700/80 dark:hover:border-orange-500/60 dark:hover:shadow-orange-500/10 vendor-card-light"
        >
            <div className="p-4 space-y-3">

                <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                        <img
                            src={vendor.photoUrl}
                            alt={vendor.fullName}
                            className="w-[60px] h-[60px] rounded-full object-cover border-2 border-orange-500 shadow-md"
                        />
                        {cart && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 whitespace-nowrap">
                                {cart.cartNumber}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-extrabold text-base font-outfit truncate text-slate-900 dark:text-white">
                                {vendor.fullName}
                            </h3>
                            <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${loyaltyInfo.badgeClass} score-chip-light`}>
                                <span>{loyaltyInfo.icon}</span>
                                <span>{vendor.loyaltyScore}%</span>
                            </span>
                        </div>

                        <p className="text-sm flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="truncate min-w-0">{vendor.address}</span>
                        </p>

                        <p className="text-sm flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-mono">{vendor.phone}</span>
                        </p>
                    </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                            Total Due:
                        </span>
                        <span className={`text-xl font-black font-outfit ${balanceRemaining > 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                            ₹{currentTotalDue.toLocaleString()}
                        </span>
                        {previousBalance > 0 && (
                            <span className="text-xs font-semibold text-orange-400">
                                (+₹{previousBalance.toLocaleString()} carry)
                            </span>
                        )}
                    </div>

                    <div className="shrink-0">
                        {paymentStatus === 'paid_full' ? (
                            <span className="px-3 py-1 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg">
                                SETTLED
                            </span>
                        ) : (
                            <span className="px-3 py-1 text-[11px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg animate-pulse">
                                PENDING
                            </span>
                        )}
                    </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-800" />

                <div className="grid grid-cols-4 gap-1.5" onClick={e => e.stopPropagation()}>
                    <motion.a
                        href={`tel:${cleanPhone}`}
                        title="Call Vendor"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:shadow-md hover:shadow-emerald-200/50 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40"
                    >
                        <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                        </div>
                        <span>Call</span>
                    </motion.a>

                    <motion.a
                        href={`https://wa.me/${whatsAppPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp Chat"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:shadow-md hover:shadow-emerald-200/50 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40"
                    >
                        <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <span>Message</span>
                    </motion.a>

                    <motion.button
                        onClick={() => onOpenMap(summary)}
                        title="View on Map"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:shadow-md hover:shadow-orange-200/50 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800/60 dark:hover:bg-orange-900/40"
                    >
                        <div className="w-9 h-9 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-300 flex items-center justify-center">
                            <Map className="w-4 h-4" />
                        </div>
                        <span>Map</span>
                    </motion.button>

                    <motion.button
                        onClick={() => onCollect(summary)}
                        title="Collect Rent Payment"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20 hover:shadow-lg hover:shadow-orange-600/30 border-0"
                    >
                        <div className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center backdrop-blur-sm">
                            <IndianRupee className="w-4 h-4" />
                        </div>
                        <span>Pay Now</span>
                    </motion.button>
                </div>

            </div>
        </div>
    );
};