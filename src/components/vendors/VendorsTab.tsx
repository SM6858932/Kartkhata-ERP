import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Vendor, Cart, Payment } from '../../types';
import { calculateVendorLedger, VendorLedgerSummary } from '../../utils/ledger';
import { Search, Users, Phone, MapPin } from 'lucide-react';

interface VendorsTabProps {
  currentUser: User;
  vendors: Vendor[];
  carts: Cart[];
  payments: Payment[];
  onViewDetails: (summary: VendorLedgerSummary) => void;
  onCollect: (summary: VendorLedgerSummary) => void;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({
  currentUser,
  vendors,
  carts,
  payments,
  onViewDetails,
  onCollect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter vendors by assignment for Collectors / Staff (Req 3)
  const visibleVendors = (currentUser.role === 'collector' || currentUser.role === 'staff')
    ? vendors.filter(v => currentUser.assignedVendorIds.includes(v.id))
    : vendors;

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return visibleVendors;
    const q = searchTerm.toLowerCase();
    return visibleVendors.filter(v =>
      v.fullName.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      v.address.toLowerCase().includes(q) ||
      v.areaTag?.toLowerCase().includes(q)
    );
  }, [searchTerm, visibleVendors]);

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black font-outfit text-slate-900 dark:text-white">Vendors</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{vendors.length} registered vendors</p>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, area..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 transition bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>

      {filtered.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-2"
        >
          {filtered.map(vendor => {
            const summary = calculateVendorLedger(vendor, [], carts, payments);
            const cart = carts.find(c =>
              vendor.id === summary.vendor.id
            );

            return (
              <motion.div
                key={vendor.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                onClick={() => onViewDetails(summary)}
                className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 cursor-pointer transition shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={vendor.photoUrl}
                    alt={vendor.fullName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate text-slate-900 dark:text-white">{vendor.fullName}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone}</span>
                      {vendor.areaTag && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vendor.areaTag}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${summary.balanceRemaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      ₹{summary.currentTotalDue.toLocaleString()}
                    </p>
                    <span className={`text-[10px] font-bold ${summary.balanceRemaining > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {summary.balanceRemaining > 0 ? 'Pending' : 'Settled'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3 text-2xl">🔍</div>
          <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No vendors found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search query.</p>
        </div>
      )}
    </div>
  );
};
