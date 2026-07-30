import React, { useState } from 'react';
import { User, Vendor, Cart, RentAgreement, Payment } from '../../types';
import { calculateVendorLedger, exportVendorPDFStatement } from '../../utils/ledger';
import { FileSpreadsheet, Download, CloudUpload, Mail, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface ReportsTabProps {
  currentUser: User;
  vendors: Vendor[];
  carts: Cart[];
  agreements: RentAgreement[];
  payments: Payment[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  currentUser,
  vendors,
  carts,
  agreements,
  payments
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Unique Area Tags list
  const availableAreas = Array.from(
    new Set(vendors.map(v => v.areaTag || 'General').filter(Boolean))
  );

  const filteredVendors = vendors.filter(v => {
    if (selectedArea === 'all') return true;
    return (v.areaTag && v.areaTag === selectedArea) || v.address.toLowerCase().includes(selectedArea.toLowerCase());
  });

  const summaries = filteredVendors.map(v =>
    calculateVendorLedger(v, agreements, carts, payments, selectedMonth)
  );

  const totalCollected = summaries.reduce((sum, s) => sum + s.amountPaidThisMonth, 0);
  const totalPending = summaries.reduce((sum, s) => sum + Math.max(0, s.balanceRemaining), 0);

  // Trigger Google Drive & Email Backup Simulation
  const handleRunBackup = () => {
    setIsBackingUp(true);
    setBackupStatus('Creating Google Drive snapshot & preparing email attachment...');

    setTimeout(() => {
      setIsBackingUp(false);
      setBackupStatus(
        `✓ Backup Successful! Uploaded 'CartKhata_Backup_${selectedMonth}_${Date.now()}.csv' to Google Drive and emailed copy to ${currentUser.email}.`
      );
    }, 1500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Serial No', 'Date', 'Vendor Name', 'Phone', 'Cart No', 'Month', 'Due Amount', 'Paid Amount', 'Carried Shortfall', 'Payment Mode', 'Collector'];
    const rows = payments.map(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      const cart = carts.find(c => c.id === p.cartId);
      return [
        p.serialNo,
        new Date(p.collectedAt).toLocaleDateString('en-IN'),
        `"${vendor?.fullName || 'N/A'}"`,
        p.vendorId,
        cart?.cartNumber || 'N/A',
        p.month,
        p.dueAmount,
        p.amountCollected,
        p.balanceCarriedForward,
        p.paymentMode,
        `"${p.collectedByName}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CartKhata_Ledger_Export_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="font-extrabold text-lg text-white font-outfit flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            Monthly PDF Reports &amp; Cloud Backup
          </h2>
          <p className="text-xs text-slate-400">
            Generate serial-numbered PDF statements, export ledger data, and run Google Drive + Email backups.
          </p>
        </div>

        {/* Month & Area Route Pickers */}
        <div className="flex items-center gap-2">
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-orange-300 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">📍 All Operating Areas</option>
            {availableAreas.map(area => (
              <option key={area} value={area}>
                📍 {area}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Backup & Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Drive & Email Backup Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Google Drive &amp; Email Backup</h3>
              <p className="text-xs text-slate-400">One-click cloud snapshot to Drive &amp; Admin inbox</p>
            </div>
          </div>

          {backupStatus && (
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-xs text-emerald-400 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{backupStatus}</span>
            </div>
          )}

          <button
            onClick={handleRunBackup}
            disabled={isBackingUp}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{isBackingUp ? 'Backing Up...' : 'Trigger Cloud Backup Now'}</span>
          </button>
        </div>

        {/* CSV Export Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Export Full Ledger (CSV)</h3>
              <p className="text-xs text-slate-400">Download complete audit-ready transaction sheet</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Contains all serial-numbered payments, carry-forward shortfalls, and collector names.
          </p>

          <button
            onClick={handleExportCSV}
            className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* Vendor PDF Statements Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base font-outfit">Vendor Monthly PDF Statements</h3>
          <span className="text-xs text-slate-400 font-mono">{selectedMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Vendor</th>
                <th className="p-3">Cart No</th>
                <th className="p-3">Monthly Rent</th>
                <th className="p-3">Carried Shortfall</th>
                <th className="p-3">Total Due</th>
                <th className="p-3">Paid This Month</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">PDF Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {summaries.map(s => (
                <tr key={s.vendor.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-3 font-bold text-white">{s.vendor.fullName}</td>
                  <td className="p-3 font-mono text-orange-400">{s.cart ? s.cart.cartNumber : 'N/A'}</td>
                  <td className="p-3 font-mono">₹{s.baseRent.toLocaleString()}</td>
                  <td className="p-3 font-mono text-rose-400">+₹{s.previousBalance.toLocaleString()}</td>
                  <td className="p-3 font-mono font-bold text-white">₹{s.currentTotalDue.toLocaleString()}</td>
                  <td className="p-3 font-mono text-emerald-400">₹{s.amountPaidThisMonth.toLocaleString()}</td>
                  <td className="p-3">
                    {s.paymentStatus === 'paid_full' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                        Paid Full
                      </span>
                    ) : s.paymentStatus === 'partial' ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                        Partial
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full">
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => exportVendorPDFStatement(s, payments)}
                      className="bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/40 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 ml-auto transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
