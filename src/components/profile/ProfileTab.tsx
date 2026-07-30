import React from 'react';
import { User, Vendor, Cart, Payment } from '../../types';
import { StorageService } from '../../services/storage';
import { UserCheck, ShieldCheck, Phone, Mail, Award, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';

interface ProfileTabProps {
  currentUser: User;
  vendors: Vendor[];
  carts: Cart[];
  payments: Payment[];
  onRefreshData: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  vendors,
  carts,
  payments,
  onRefreshData
}) => {
  const assignedVendors = vendors.filter(v => currentUser.assignedVendorIds.includes(v.id));

  // Today's collections by this user
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayPayments = payments.filter(
    p => p.collectedBy === currentUser.id && p.collectedAt.startsWith(todayStr)
  );

  const todayCollectedAmount = userTodayPayments.reduce((sum, p) => sum + p.amountCollected, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* User Header Profile Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-2xl font-black text-white shadow-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg text-white font-outfit">{currentUser.name}</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                {currentUser.role.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-500" /> {currentUser.phone}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-500" /> {currentUser.email}
            </p>
          </div>
        </div>

        {/* Collector Performance Summary Pill */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Today's Collections</span>
            <span className="text-lg font-black text-emerald-400 font-outfit">
              ₹{todayCollectedAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Vendors</span>
            <span className="text-lg font-black text-white font-outfit">
              {assignedVendors.length} Carts
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Vendors List for Collector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="font-bold text-white text-base font-outfit flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-orange-400" />
          Assigned Food Carts &amp; Vendors
        </h3>

        <div className="divide-y divide-slate-800 text-xs">
          {assignedVendors.map(v => {
            const cart = carts.find(c => c.id === v.id || c.status === 'rented');
            return (
              <div key={v.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{v.fullName}</h4>
                  <p className="text-slate-400">{v.address}</p>
                </div>
                <span className="font-mono text-orange-400 font-bold">{v.phone}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Demo Data Button */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-xs">Reset Application Demo Data</h4>
          <p className="text-[11px] text-slate-500">Restore factory initial seed records</p>
        </div>
        <button
          onClick={onRefreshData}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Data
        </button>
      </div>
    </div>
  );
};
