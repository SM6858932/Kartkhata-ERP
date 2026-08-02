import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Vendor, Cart, RentAgreement, Payment } from '../../types';
import { calculateVendorLedger, VendorLedgerSummary } from '../../utils/ledger';
import { VendorCard } from './VendorCard';
import { TabType } from '../common/BottomNav';
import {
    Search, Plus, TrendingUp, AlertCircle, CheckCircle2, ShoppingBag,
    Wallet, Users, MapPin, FileText, ShieldCheck, ChevronDown, Calendar, Map as MapIcon
} from 'lucide-react';

interface DashboardTabProps {
    currentUser: User;
    vendors: Vendor[];
    carts: Cart[];
    agreements: RentAgreement[];
    payments: Payment[];
    onCollect: (summary: VendorLedgerSummary) => void;
    onOpenMap: (summary?: VendorLedgerSummary) => void;
    onViewDetails: (summary: VendorLedgerSummary) => void;
    onAddVendor: () => void;
    onTabChange?: (tab: TabType) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    currentUser,
    vendors,
    carts,
    agreements,
    payments,
    onCollect,
    onOpenMap,
    onViewDetails,
    onAddVendor,
    onTabChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'high_due'>('all');
    const [selectedArea, setSelectedArea] = useState<string>('all');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Generate last 6 months for selector
    const monthOptions = React.useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            months.push({ value, label });
        }
        return months;
    }, []);

    const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'This Month';

    // Update time every minute for greeting
    React.useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getGreeting = (now: Date): 'Good Morning' | 'Good Afternoon' | 'Good Evening' => {
        const h = now.getHours();
        if (h >= 5 && h < 12) return 'Good Morning';
        if (h >= 12 && h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Role-aware greeting: Owner/Admin → "Good Evening, <Name>", Staff → "Hello <Name>"
    const isOwner = currentUser.role === 'admin' || currentUser.role === 'company_admin';
    const greetingLabel = isOwner
        ? `${getGreeting(currentTime)}, ${currentUser.name.split(' ')[0]}`
        : `Hello, ${currentUser.name.split(' ')[0]}`;

    const formattedDate = currentTime.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    // Filter vendors by assignment for Collectors / Staff
    const visibleVendors = (currentUser.role === 'collector' || currentUser.role === 'staff')
        ? vendors.filter(v => currentUser.assignedVendorIds.includes(v.id))
        : vendors;

    // Unique Area Tags list for filter dropdown
    const availableAreas = Array.from(
        new Set(visibleVendors.map(v => v.areaTag || 'General').filter(Boolean))
    );

    // Calculate summaries for visible vendors using selected month
    const summaries: VendorLedgerSummary[] = visibleVendors.map(v =>
        calculateVendorLedger(v, agreements, carts, payments, selectedMonth)
    );

    // Overall financial statistics
    const totalMonthlyTarget = 45000;
    const calculatedTarget = summaries.reduce((sum, s) => sum + s.currentTotalDue, 0);
    const targetAmount = Math.max(totalMonthlyTarget, calculatedTarget);
    const totalCollectedMonth = summaries.reduce((sum, s) => sum + s.amountPaidThisMonth, 0);
    const totalPendingMonth = summaries.reduce((sum, s) => sum + Math.max(0, s.balanceRemaining), 0);
    const paidCount = summaries.filter(s => s.paymentStatus === 'paid_full').length;
    const pendingCount = summaries.filter(s => s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial').length;
    const activeCartsCount = carts.filter(c => c.status === 'rented').length;
    const availableCartsCount = carts.filter(c => c.status === 'available').length;

    const collectionPercent = targetAmount > 0 ? Math.round((totalCollectedMonth / targetAmount) * 100) : 0;

    // Filtered summaries list
    const filteredSummaries = summaries.filter(s => {
        const matchesArea =
            selectedArea === 'all' ||
            (s.vendor.areaTag && s.vendor.areaTag === selectedArea) ||
            s.vendor.address.toLowerCase().includes(selectedArea.toLowerCase());

        if (!matchesArea) return false;

        const matchesSearch =
            s.vendor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.vendor.phone.includes(searchTerm) ||
            (s.cart && s.cart.cartNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.vendor.address.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'pending') return s.balanceRemaining > 0;
        if (filterStatus === 'paid') return s.paymentStatus === 'paid_full';
        if (filterStatus === 'high_due') return s.balanceRemaining >= 5000;
        return true;
    });

    return (
        <div className="space-y-5 pb-28 animate-fade-in">

            {/* ===== 1. HERO BANNER CARD ===== */}
            <div className="hero-banner relative rounded-3xl p-5 sm:p-6 overflow-hidden shadow-lg border theme-transition bg-gradient-to-r from-indigo-100/70 via-purple-50 to-blue-100/60 border-indigo-100 dark:from-slate-900 dark:via-indigo-950/60 dark:to-purple-950/40 dark:border-slate-800">
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="space-y-1 max-w-[65%]">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {greetingLabel},
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black font-outfit tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                            {currentUser.name.split(' ')[0]} Bhai 👋
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Manage your food cart rentals &amp; daily collections effortlessly.
                        </p>
                    </div>

                    {/* Profile Pic & 3D Food Cart Graphic */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-sm bg-white/90 text-slate-700 border-slate-200 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700">
                            <span>{formattedDate}</span>
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        </div>

                        {/* Profile Pic */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center overflow-hidden">
                            <img
                                src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                                alt={currentUser.name}
                                className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-indigo-400/30 transform hover:scale-105 transition"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== 2. 2x2 KPI SUMMARY CARDS GRID ===== */}
            <div aria-live="polite" className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Card 1: Collected This Month */}
                <div className="kpi-card p-2.5 rounded-2xl border shadow-sm theme-transition bg-white border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                            <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-medium block text-slate-500 dark:text-slate-400">
                        Collected This Month
                    </span>
                    <p className="text-sm sm:text-base font-black font-outfit mt-0 text-slate-900 dark:text-white">
                        ₹{totalCollectedMonth.toLocaleString()}
                    </p>
                    <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">
                        {collectionPercent}% of target
                    </span>
                </div>

                {/* Card 2: Total Pending Due */}
                <div className="kpi-card p-2.5 rounded-2xl border shadow-sm theme-transition bg-white border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                            <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                    </div>
                    <span className="text-[10px] font-medium block text-slate-500 dark:text-slate-400">
                        Total Pending Due
                    </span>
                    <p className="text-sm sm:text-base font-black font-outfit mt-0 text-rose-500">
                        ₹{totalPendingMonth.toLocaleString()}
                    </p>
                    <span className="text-[9px] font-bold text-rose-500 mt-0.5 block">
                        {pendingCount} vendors overdue
                    </span>
                </div>

                {/* Card 3: Paid Vendors */}
                <div className="kpi-card p-2.5 rounded-2xl border shadow-sm theme-transition bg-white border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                        <CheckCircle2 className="w-3 h-3 text-orange-500" />
                    </div>
                    <span className="text-[10px] font-medium block text-slate-500 dark:text-slate-400">
                        Paid Vendors
                    </span>
                    <p className="text-sm sm:text-base font-black font-outfit mt-0 text-slate-900 dark:text-white">
                        {paidCount} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ {summaries.length}</span>
                    </p>
                    <span className="text-[9px] font-bold text-orange-500 mt-0.5 block">
                        {summaries.length > 0 ? `${Math.round((paidCount / summaries.length) * 100)}% settled` : '0%'}
                    </span>
                </div>

                {/* Card 4: Active Carts */}
                <div className="kpi-card p-2.5 rounded-2xl border shadow-sm theme-transition bg-white border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center">
                            <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <ShoppingBag className="w-3 h-3 text-sky-500" />
                    </div>
                    <span className="text-[10px] font-medium block text-slate-500 dark:text-slate-400">
                        Active Carts
                    </span>
                    <p className="text-sm sm:text-base font-black font-outfit mt-0 text-slate-900 dark:text-white">
                        {activeCartsCount}
                    </p>
                    <span className="text-[9px] font-bold text-sky-500 mt-0.5 block">
                        {availableCartsCount} available in yard
                    </span>
                </div>
            </div>

            {/* ===== 3. COLLECTION OVERVIEW GRADIENT CARD ===== */}
            <div className="rounded-3xl p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base font-outfit tracking-wide">
                        Collection Overview
                    </h3>
                    <div className="relative">
                        <button
                            onClick={() => setShowMonthPicker(!showMonthPicker)}
                            className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1 cursor-pointer hover:bg-white/25 transition"
                        >
                            <span>{selectedMonthLabel}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                        </button>
                        {showMonthPicker && (
                            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-10 min-w-[140px]">
                                {monthOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setSelectedMonth(opt.value);
                                            setShowMonthPicker(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-semibold transition hover:bg-indigo-50 dark:hover:bg-slate-700 ${selectedMonth === opt.value
                                            ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                            : 'text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-white/20"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="text-emerald-400 transition-all duration-1000 ease-out"
                                strokeDasharray={`${collectionPercent}, 100`}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-xl font-black font-outfit block leading-none">
                                {collectionPercent}%
                            </span>
                            <span className="text-[9px] text-indigo-100 font-medium block mt-0.5">
                                of target
                            </span>
                        </div>
                    </div>

                    <div className="w-px h-16 bg-white/20 shrink-0" />

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <div>
                                <span className="text-indigo-200 block text-[10px] font-medium">Target</span>
                                <span className="font-extrabold text-base font-outfit">₹{targetAmount.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-indigo-200 block text-[10px] font-medium">Collected</span>
                                <span className="font-extrabold text-base font-outfit text-emerald-300">₹{totalCollectedMonth.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, collectionPercent)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== 4. QUICK ACCESS BUTTONS ===== */}
            <div className="space-y-2">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-600 dark:text-slate-400">
                    Quick Access
                </h3>
                <div className="grid grid-cols-4 gap-2.5">
                    <button
                        onClick={() => onTabChange && onTabChange('home')}
                        className="flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20 animate-glow-slow">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">Home</span>
                    </button>

                    <button
                        onClick={() => onTabChange && onTabChange('vendors')}
                        className="flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 animate-glow-slow">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">Vendors</span>
                    </button>

                    <button
                        onClick={() => onTabChange && onTabChange('statements')}
                        className="flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-md shadow-sky-500/20 animate-glow-slow">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">Statements</span>
                    </button>

                    <button
                        onClick={() => onTabChange && onTabChange('settings')}
                        className="flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-md shadow-purple-500/20 animate-glow-slow">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">Settings</span>
                    </button>
                </div>
            </div>

            {/* ===== 5. RECENT VENDORS LIST SECTION ===== */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold font-outfit text-slate-900 dark:text-white">
                        Recent Vendors
                    </h3>
                    <button
                        onClick={() => onOpenMap()}
                        className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                    >
                        <MapIcon className="w-3.5 h-3.5" />
                        <span>Map</span>
                    </button>
                </div>

                {/* Search & Area Filter Bar */}
                <div className="p-2.5 rounded-2xl border flex flex-col sm:flex-row gap-2 items-center justify-between theme-transition bg-white border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search vendor, phone, cart..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 transition bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 search-bar-light"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${filterStatus === 'all'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700 filter-chip-light'
                                }`}
                        >
                            All ({summaries.length})
                        </button>

                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${filterStatus === 'pending'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700 filter-chip-light'
                                }`}
                        >
                            Pending ({pendingCount})
                        </button>

                        <button
                            onClick={() => setFilterStatus('paid')}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${filterStatus === 'paid'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700 filter-chip-light'
                                }`}
                        >
                            Paid ({paidCount})
                        </button>
                    </div>
                </div>

                {/* Vendor Cards Vertical List */}
                {filteredSummaries.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        className="flex flex-col gap-3"
                    >
                        {filteredSummaries.map(summary => (
                            <motion.div
                                key={summary.vendor.id}
                                variants={{
                                    hidden: { opacity: 0, y: 12 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                                }}
                            >
                                <VendorCard
                                    summary={summary}
                                    onCollect={onCollect}
                                    onOpenMap={onOpenMap}
                                    onViewDetails={onViewDetails}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-12 border rounded-2xl p-8 bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3 text-2xl">
                            🔍
                        </div>
                        <h3 className="font-bold text-base mb-1 text-slate-700 dark:text-slate-300">
                            No vendors found
                        </h3>
                        <p className="text-xs max-w-sm mx-auto text-slate-400 dark:text-slate-500">
                            Try adjusting your search query or switching filters.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};
