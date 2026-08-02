import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Vendor, Cart, RentAgreement, Payment } from '../../types';
import { calculateVendorLedger, VendorLedgerSummary, exportVendorPDFStatement, exportVendorReceiptPDF, exportVendorStatementXLS, exportVendorStatementDOC, exportVendorVCF, generateWhatsAppReceiptUrl } from '../../utils/ledger';
import { CompanyService, CompanySettings } from '../../services/companyService';
import {
    Wallet, Search, Filter, Download, MessageSquare, IndianRupee,
    CheckCircle2, AlertCircle, Clock, FileText, ArrowUpRight, ArrowDownRight, Printer, FileSpreadsheet, File
} from 'lucide-react';

interface LedgerTabProps {
    currentUser: User;
    vendors: Vendor[];
    carts: Cart[];
    agreements: RentAgreement[];
    payments: Payment[];
    onCollect: (summary: VendorLedgerSummary) => void;
    onViewDetails: (summary: VendorLedgerSummary) => void;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
    currentUser,
    vendors,
    carts,
    agreements,
    payments,
    onCollect,
    onViewDetails
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid_full' | 'partial' | 'unpaid'>('all');
    const [selectedMonth, setSelectedMonth] = useState('2026-07');
    const [company, setCompany] = useState<CompanySettings | null>(null);
    const [exportMenuFor, setExportMenuFor] = useState<string | null>(null);

    // Load company branding for statement/receipt headers
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (currentUser.companyId) {
                const settings = await CompanyService.get(currentUser.companyId);
                if (!cancelled && settings) setCompany(settings);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [currentUser.companyId]);

    // Filter vendors based on role
    const visibleVendors = (currentUser.role === 'collector' || currentUser.role === 'staff')
        ? vendors.filter(v => currentUser.assignedVendorIds.includes(v.id))
        : vendors;

    // Calculate summaries for all visible vendors
    const summaries: VendorLedgerSummary[] = visibleVendors.map(v =>
        calculateVendorLedger(v, agreements, carts, payments, selectedMonth)
    );

    // Overall financial totals for selected month
    const totalBaseRent = summaries.reduce((sum, s) => sum + s.baseRent, 0);
    const totalCarriedForward = summaries.reduce((sum, s) => sum + s.previousBalance, 0);
    const totalGrandDue = summaries.reduce((sum, s) => sum + s.currentTotalDue, 0);
    const totalCollected = summaries.reduce((sum, s) => sum + s.amountPaidThisMonth, 0);
    const totalPending = summaries.reduce((sum, s) => sum + Math.max(0, s.balanceRemaining), 0);

    // Filtered summaries list
    const filteredSummaries = summaries.filter(s => {
        const matchesSearch =
            s.vendor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.vendor.phone.includes(searchTerm) ||
            (s.cart && s.cart.cartNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.vendor.address.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'paid_full') return s.paymentStatus === 'paid_full';
        if (statusFilter === 'partial') return s.paymentStatus === 'partial';
        if (statusFilter === 'unpaid') return s.paymentStatus === 'unpaid' || s.balanceRemaining > 0;

        return true;
    });

    return (
        <div className="space-y-5 pb-28 animate-fade-in">
            {/* Header Title Banner */}
            <div className="p-4 rounded-2xl border theme-transition flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-white border-indigo-100 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black font-outfit text-slate-900 dark:text-white">
                            Rent Ledger & Collections
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Monthly transaction ledger, balance carry-forward & statements
                        </p>
                    </div>
                </div>

                {/* Month Selector */}
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 cursor-pointer bg-white border-slate-300 text-indigo-700 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-indigo-400"
                >
                    <option value="2026-07">📅 July 2026</option>
                    <option value="2026-06">📅 June 2026</option>
                    <option value="2026-05">📅 May 2026</option>
                </select>
            </div>

            {/* Financial Summary KPI Cards */}
            <div aria-live="polite" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Expected Due */}
                <div className="p-4 rounded-2xl border theme-transition bg-white border-slate-200 shadow-sm dark:bg-slate-900/90 dark:border-slate-800">
                    <span className="text-[11px] font-semibold block mb-1 text-slate-500 dark:text-slate-400">
                        Total Rent Demand
                    </span>
                    <p className="text-xl font-black font-outfit text-slate-900 dark:text-white">
                        ₹{totalGrandDue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-medium mt-1">
                        Base ₹{totalBaseRent.toLocaleString()} + Carry ₹{totalCarriedForward.toLocaleString()}
                    </p>
                </div>

                {/* Total Collected */}
                <div className="p-4 rounded-2xl border theme-transition bg-white border-slate-200 shadow-sm dark:bg-slate-900/90 dark:border-slate-800">
                    <span className="text-[11px] font-semibold block mb-1 text-slate-500 dark:text-slate-400">
                        Total Collected
                    </span>
                    <p className="text-xl font-black font-outfit text-emerald-500">
                        ₹{totalCollected.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        {totalGrandDue > 0 ? `${Math.round((totalCollected / totalGrandDue) * 100)}% collected` : '0%'}
                    </p>
                </div>

                {/* Total Outstanding */}
                <div className="p-4 rounded-2xl border theme-transition bg-white border-slate-200 shadow-sm dark:bg-slate-900/90 dark:border-slate-800">
                    <span className="text-[11px] font-semibold block mb-1 text-slate-500 dark:text-slate-400">
                        Total Pending Balance
                    </span>
                    <p className="text-xl font-black font-outfit text-rose-500">
                        ₹{totalPending.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-rose-500 font-medium mt-1 flex items-center gap-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        Carried forward to next month
                    </p>
                </div>

                {/* Collection Efficiency */}
                <div className="p-4 rounded-2xl border theme-transition bg-white border-slate-200 shadow-sm dark:bg-slate-900/90 dark:border-slate-800">
                    <span className="text-[11px] font-semibold block mb-1 text-slate-500 dark:text-slate-400">
                        Settled Accounts
                    </span>
                    <p className="text-xl font-black font-outfit text-slate-900 dark:text-white">
                        {summaries.filter(s => s.paymentStatus === 'paid_full').length} / {summaries.length}
                    </p>
                    <p className="text-[10px] text-amber-500 font-medium mt-1">
                        {summaries.filter(s => s.balanceRemaining > 0).length} pending collection
                    </p>
                </div>
            </div>

            {/* Control Bar: Search & Status Filters */}
            <div className="p-3 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between theme-transition bg-white border-slate-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search ledger by vendor, cart, phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 transition bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${statusFilter === 'all'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700'
                            }`}
                    >
                        All Vendors ({summaries.length})
                    </button>

                    <button
                        onClick={() => setStatusFilter('unpaid')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${statusFilter === 'unpaid'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700'
                            }`}
                    >
                        Pending Due ({summaries.filter(s => s.balanceRemaining > 0).length})
                    </button>

                    <button
                        onClick={() => setStatusFilter('paid_full')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${statusFilter === 'paid_full'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700'
                            }`}
                    >
                        Settled ({summaries.filter(s => s.paymentStatus === 'paid_full').length})
                    </button>
                </div>
            </div>

            {/* Ledger Accounts Table / Cards List */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                className="space-y-3"
            >
                {filteredSummaries.length > 0 ? (
                    filteredSummaries.map(summary => {
                        const { vendor, cart, baseRent, previousBalance, currentTotalDue, amountPaidThisMonth, balanceRemaining, paymentStatus, lastPayment } = summary;

                        return (
                            <motion.div
                                key={vendor.id}
                                variants={{
                                    hidden: { opacity: 0, y: 12 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                                }}
                            >
                                <div
                                    onClick={() => onViewDetails(summary)}
                                    className="p-4 rounded-2xl border shadow-md transition-all duration-200 cursor-pointer overflow-hidden theme-transition bg-white border-slate-200 hover:border-indigo-400 hover:shadow-indigo-100/50 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500/50"
                                >
                                    {/* Header: Vendor Avatar, Name, Cart No & Status */}
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={vendor.photoUrl}
                                                alt={vendor.fullName}
                                                className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-500 shadow-sm shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm truncate text-slate-900 dark:text-white">
                                                    {vendor.fullName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {cart && (
                                                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded border bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
                                                            🛒 {cart.cartNumber}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] truncate text-slate-500 dark:text-slate-400">
                                                        📞 {vendor.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="shrink-0">
                                            {paymentStatus === 'paid_full' ? (
                                                <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> SETTLED
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg flex items-center gap-1 animate-pulse">
                                                    <AlertCircle className="w-3 h-3" /> PENDING
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ledger Breakdown Grid */}
                                    <div className="grid grid-cols-4 gap-2 p-3 rounded-xl border text-center mb-3 bg-slate-50 border-slate-200 dark:bg-slate-950/70 dark:border-slate-800">
                                        <div>
                                            <span className="text-[9px] uppercase font-semibold block text-slate-400 dark:text-slate-500">
                                                Base Rent
                                            </span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                ₹{baseRent.toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[9px] uppercase font-semibold block text-slate-400 dark:text-slate-500">
                                                Carry Balance
                                            </span>
                                            <span className="text-xs font-bold text-orange-400">
                                                +₹{previousBalance.toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[9px] uppercase font-semibold block text-slate-400 dark:text-slate-500">
                                                Total Demand
                                            </span>
                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                                ₹{currentTotalDue.toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-[9px] uppercase font-semibold block text-slate-400 dark:text-slate-500">
                                                Net Due
                                            </span>
                                            <span className={`text-xs font-black ${balanceRemaining > 0 ? 'text-rose-500' : 'text-emerald-500'
                                                }`}>
                                                ₹{balanceRemaining.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                                        {/* WhatsApp Receipt */}
                                        {lastPayment && (
                                            <a
                                                href={generateWhatsAppReceiptUrl(vendor.phone, vendor.fullName, lastPayment, cart ? cart.cartNumber : 'N/A', company ?? undefined)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-900/50"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>Receipt</span>
                                            </a>
                                        )}

                                        {/* Export Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setExportMenuFor(exportMenuFor === vendor.id ? null : vendor.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition bg-slate-100 text-indigo-600 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700 dark:hover:bg-slate-700"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Export</span>
                                            </button>

                                            {exportMenuFor === vendor.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setExportMenuFor(null)} />
                                                    <div className="absolute right-0 mt-1 z-20 w-44 rounded-xl border shadow-lg overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                                                        <button
                                                            onClick={() => { void exportVendorPDFStatement(summary, payments, company ?? undefined); setExportMenuFor(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 text-red-500" /> PDF Statement (A4)
                                                        </button>
                                                        <button
                                                            onClick={() => { exportVendorStatementXLS(summary, payments, company ?? undefined); setExportMenuFor(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                                        >
                                                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Excel (.xls)
                                                        </button>
                                                        <button
                                                            onClick={() => { exportVendorStatementDOC(summary, payments, company ?? undefined); setExportMenuFor(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                                        >
                                                            <File className="w-3.5 h-3.5 text-blue-500" /> Word (.doc)
                                                        </button>
                                                        <button
                                                            onClick={() => { exportVendorVCF(summary, company ?? undefined); setExportMenuFor(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 text-amber-500" /> Contact (.vcf)
                                                        </button>
                                                        {lastPayment && (
                                                            <button
                                                                onClick={() => { void exportVendorReceiptPDF(lastPayment, vendor, cart ? cart.cartNumber : 'N/A', company ?? undefined); setExportMenuFor(null); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                                            >
                                                                <Printer className="w-3.5 h-3.5 text-indigo-500" /> Receipt (11×5" PDF)
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Pay Now Button */}
                                        <button
                                            onClick={() => onCollect(summary)}
                                            className="flex-1 flex items-center justify-center gap-1 px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition active:scale-95"
                                        >
                                            <IndianRupee className="w-3.5 h-3.5" />
                                            <span>Collect Payment</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 border rounded-2xl p-8 bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3 text-2xl">
                            📖
                        </div>
                        <h3 className="font-bold text-base mb-1 text-slate-700 dark:text-slate-300">
                            No ledger records found
                        </h3>
                        <p className="text-xs max-w-sm mx-auto text-slate-400 dark:text-slate-500">
                            No vendors match the selected filter criteria for this month.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
