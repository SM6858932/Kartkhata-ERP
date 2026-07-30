import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { User, Vendor } from '../../types';
import { StorageService } from '../../services/storage';

interface PrivacyPolicyModalProps {
  currentUser: User;
  vendors?: Vendor[];
  onClose: () => void;
  onRefreshData?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  currentUser,
  vendors = [],
  onClose,
  onRefreshData
}) => {
  const [selectedVendorToDelete, setSelectedVendorToDelete] = useState('');
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorToDelete) return;

    StorageService.deleteVendorData(selectedVendorToDelete, currentUser);
    setDeletionSuccess(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setDeletionSuccess(false);
      setSelectedVendorToDelete('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-lg font-black font-outfit">Privacy Policy &amp; DPDP Compliance</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              Aadhaar &amp; Identity Data Encryption
            </h3>
            <p className="text-slate-300 leading-relaxed">
              In accordance with Google Play Store Developer Guidelines and DPDP Act 2023, all government IDs (Aadhaar, PAN, Voter ID) uploaded to CartKhata ERP are stored securely with restricted access. Only authenticated <strong>Admin Users</strong> have permission to view or verify ID proofs.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-bold text-white text-sm">Location Collection Notice</h3>
            <p className="text-slate-300 leading-relaxed">
              Location coordinates are fetched <strong>only</strong> when field staff manually visits a food cart to mark an on-site rent collection or asset update. Location is <strong>not required</strong> or collected for online payments (UPI / Bank Transfer).
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <h3 className="font-bold text-white text-sm">Advance Deposit &amp; Final Settlement</h3>
            <p className="text-slate-300 leading-relaxed">
              Advance rent collected during cart onboarding is tracked as refundable security deposit. Upon cart return, total dues are subtracted from total payments plus advance credit to generate an automated settlement statement.
            </p>
          </div>

          {/* Request Data Deletion Form */}
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-3">
            <h3 className="font-bold text-rose-300 text-xs uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Request Data Deletion (Google Play Mandate)
            </h3>
            <p className="text-[11px] text-slate-400">
              Select a vendor profile to permanently delete personal information, Aadhaar records, and associated logs from local storage.
            </p>

            {deletionSuccess && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vendor data successfully deleted from records.</span>
              </div>
            )}

            <form onSubmit={handleDeleteRequest} className="space-y-2">
              <select
                value={selectedVendorToDelete}
                onChange={e => setSelectedVendorToDelete(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl"
              >
                <option value="">-- Select Vendor to Purge --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({v.phone})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!selectedVendorToDelete}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl transition text-xs"
              >
                Purge &amp; Delete Selected Vendor Data
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
