import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Vendor, Cart, RentAgreement, Payment, AuditLog, AppNotification } from './types';
import { StorageService } from './services/storage';
import { calculateVendorLedger, VendorLedgerSummary } from './utils/ledger';
import { LoginScreen } from './components/auth/LoginScreen';
import { GetStartedScreen } from './components/auth/GetStartedScreen';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { CollectPaymentModal } from './components/payments/CollectPaymentModal';
import { VendorModal } from './components/vendors/VendorModal';
import { VendorDetailPage } from './components/vendors/VendorDetailPage';
import { ReturnCartModal } from './components/vendors/ReturnCartModal';
import { LedgerTab } from './components/ledger/LedgerTab';
import { VendorsTab } from './components/vendors/VendorsTab';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { NotificationsModal } from './components/common/NotificationsModal';
import { StaffManagerModal } from './components/admin/StaffManagerModal';
import { AppDrawer } from './components/common/AppDrawer';
import { PrivacyPolicyModal } from './components/common/PrivacyPolicyModal';
import { PartnerWithUsModal } from './components/common/PartnerWithUsModal';
import { ExitConfirmModal } from './components/common/ExitConfirmModal';
import { App as CapApp } from '@capacitor/app';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { MapViewTab } from './components/map/MapViewTab';

export function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(StorageService.getCurrentSession());
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [hasSeenIntro, setHasSeenIntro] = useState(() => {
        return localStorage.getItem('hasSeenIntro') === 'true';
    });

    // Firestore sync hook — provides real-time data + offline cache
    const {
        vendors, carts, agreements, payments, auditLogs, notifications,
        isSyncing, lastSyncTime, refreshFromFirestore
    } = useFirestoreSync();

    // Modals state
    const [selectedSummaryToCollect, setSelectedSummaryToCollect] = useState<VendorLedgerSummary | null>(null);
    const [selectedSummaryToReturnCart, setSelectedSummaryToReturnCart] = useState<VendorLedgerSummary | null>(null);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isStaffManagerOpen, setIsStaffManagerOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
    const [isPartnerWithUsOpen, setIsPartnerWithUsOpen] = useState(false);
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [mapFocusVendorId, setMapFocusVendorId] = useState<string | null>(null);

    const refreshStateData = () => {
        refreshFromFirestore();
    };

    useEffect(() => {
        StorageService.init();
    }, []);

    // ============================================================
    // HARDWARE BACK BUTTON HANDLER
    // Priority: close modals → navigate to previous tab → show exit popup
    // ============================================================
    const handleBackButton = useCallback(() => {
        if (showMap) { setShowMap(false); return; }
        if (isPartnerWithUsOpen) { setIsPartnerWithUsOpen(false); return; }
        if (isPrivacyPolicyOpen) { setIsPrivacyPolicyOpen(false); return; }
        if (isDrawerOpen) { setIsDrawerOpen(false); return; }
        if (isStaffManagerOpen) { setIsStaffManagerOpen(false); return; }
        if (isNotificationsOpen) { setIsNotificationsOpen(false); return; }
        if (isAddVendorOpen) { setIsAddVendorOpen(false); return; }
        if (selectedSummaryToReturnCart) { setSelectedSummaryToReturnCart(null); return; }
        if (selectedVendorId) { setSelectedVendorId(null); return; }
        if (selectedSummaryToCollect) { setSelectedSummaryToCollect(null); return; }

        if (activeTab !== 'home') {
            setActiveTab('home');
            return;
        }

        setIsExitConfirmOpen(true);
    }, [
        activeTab,
        showMap,
        isPartnerWithUsOpen, isPrivacyPolicyOpen, isDrawerOpen,
        isStaffManagerOpen, isNotificationsOpen, isAddVendorOpen,
        selectedSummaryToReturnCart, selectedVendorId, selectedSummaryToCollect
    ]);

    useEffect(() => {
        let listener: any;
        const registerBackButton = async () => {
            try {
                listener = await CapApp.addListener('backButton', () => {
                    handleBackButton();
                });
            } catch { }
        };

        registerBackButton();
        return () => {
            if (listener && listener.remove) {
                listener.remove();
            }
        };
    }, [handleBackButton]);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            e.preventDefault();
            handleBackButton();
            window.history.pushState(null, '', window.location.href);
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [handleBackButton]);

    const handleExitApp = async () => {
        try {
            await CapApp.exitApp();
        } catch {
            setIsExitConfirmOpen(false);
        }
    };

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setActiveTab('home');
        refreshStateData();
    };

    const handleLogout = () => {
        StorageService.logout();
        setCurrentUser(null);
    };

    const handleResetData = () => {
        StorageService.resetData();
        refreshStateData();
    };

    if (!hasSeenIntro) {
        return (
            <GetStartedScreen
                onGetStarted={() => {
                    localStorage.setItem('hasSeenIntro', 'true');
                    setHasSeenIntro(true);
                }}
            />
        );
    }

    if (!currentUser) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    const collectorAssigned = vendors.filter(v => currentUser.assignedVendorIds.includes(v.id));
    const collectorPendingCount = collectorAssigned.filter(v => {
        const s = calculateVendorLedger(v, agreements, carts, payments);
        return s.balanceRemaining > 0;
    }).length;

    const unreadNotifCount = notifications.filter(n => !n.read).length;

    const handleSelectVendorToCollectFromMap = (vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor) {
            const summary = calculateVendorLedger(vendor, agreements, carts, payments);
            setSelectedSummaryToCollect(summary);
        }
    };

    const handleOpenMap = (summary?: VendorLedgerSummary) => {
        setMapFocusVendorId(summary?.vendor.id || null);
        setShowMap(true);
    };

    return (
        <div className="min-h-screen flex flex-col font-sans antialiased overflow-x-hidden theme-transition bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {/* App Header */}
            <Header
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                onOpenStaffManager={() => setIsStaffManagerOpen(true)}
                unreadNotifCount={unreadNotifCount}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                onRefreshData={handleResetData}
            />

            {/* Main Content Area */}
            <motion.main
                key={showMap ? 'map' : activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-6"
            >
                {showMap ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowMap(false)}
                            className="flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white transition"
                        >
                            ← Back to Dashboard
                        </button>
                        <MapViewTab
                            currentUser={currentUser}
                            vendors={vendors}
                            carts={carts}
                            agreements={agreements}
                            payments={payments}
                            onSelectVendorToCollect={handleSelectVendorToCollectFromMap}
                            onRefreshData={refreshStateData}
                        />
                    </div>
                ) : selectedVendorId ? (
                    <VendorDetailPage
                        vendorId={selectedVendorId}
                        currentUser={currentUser}
                        vendors={vendors}
                        carts={carts}
                        agreements={agreements}
                        payments={payments}
                        onBack={() => setSelectedVendorId(null)}
                        onReturnCart={summary => {
                            setSelectedVendorId(null);
                            setSelectedSummaryToReturnCart(summary);
                        }}
                    />
                ) : (
                    <>
                        {activeTab === 'home' && (
                            <DashboardTab
                                currentUser={currentUser}
                                vendors={vendors}
                                carts={carts}
                                agreements={agreements}
                                payments={payments}
                                onCollect={summary => setSelectedSummaryToCollect(summary)}
                                onOpenMap={handleOpenMap}
                                onViewDetails={summary => setSelectedVendorId(summary.vendor.id)}
                                onAddVendor={() => setIsAddVendorOpen(true)}
                                onTabChange={tab => setActiveTab(tab)}
                            />
                        )}

                        {activeTab === 'vendors' && (
                            <VendorsTab
                                currentUser={currentUser}
                                vendors={vendors}
                                carts={carts}
                                payments={payments}
                                onViewDetails={summary => setSelectedVendorId(summary.vendor.id)}
                                onCollect={summary => setSelectedSummaryToCollect(summary)}
                            />
                        )}

                        {activeTab === 'statements' && (
                            <LedgerTab
                                currentUser={currentUser}
                                vendors={vendors}
                                carts={carts}
                                agreements={agreements}
                                payments={payments}
                                onCollect={summary => setSelectedSummaryToCollect(summary)}
                                onViewDetails={summary => setSelectedVendorId(summary.vendor.id)}
                            />
                        )}

                        {activeTab === 'settings' && (
                            <SettingsScreen
                                currentUser={currentUser}
                                vendors={vendors}
                            />
                        )}
                    </>
                )}
            </motion.main>

            {/* Modals */}
            {selectedSummaryToCollect && (
                <CollectPaymentModal
                    summary={selectedSummaryToCollect}
                    currentUser={currentUser}
                    onClose={() => setSelectedSummaryToCollect(null)}
                    onSuccess={() => {
                        setSelectedSummaryToCollect(null);
                        refreshStateData();
                    }}
                />
            )}

            {selectedSummaryToReturnCart && (
                <ReturnCartModal
                    summary={selectedSummaryToReturnCart}
                    currentUser={currentUser}
                    payments={payments}
                    onClose={() => setSelectedSummaryToReturnCart(null)}
                    onSuccess={() => {
                        setSelectedSummaryToReturnCart(null);
                        refreshStateData();
                    }}
                />
            )}

            {isAddVendorOpen && (
                <VendorModal
                    currentUser={currentUser}
                    availableCarts={carts.filter(c => c.status === 'available')}
                    onClose={() => setIsAddVendorOpen(false)}
                    onSuccess={() => {
                        setIsAddVendorOpen(false);
                        refreshStateData();
                    }}
                />
            )}

            {isNotificationsOpen && (
                <NotificationsModal
                    notifications={notifications}
                    onClose={() => setIsNotificationsOpen(false)}
                    onRefresh={refreshStateData}
                />
            )}

            {isStaffManagerOpen && (
                <StaffManagerModal
                    currentUser={currentUser}
                    vendors={vendors}
                    onClose={() => setIsStaffManagerOpen(false)}
                    onRefresh={refreshStateData}
                />
            )}

            {/* Navigation Drawer */}
            <AppDrawer
                isOpen={isDrawerOpen}
                currentUser={currentUser}
                vendors={vendors}
                onClose={() => setIsDrawerOpen(false)}
                onLogout={handleLogout}
                onOpenPartnerWithUs={() => setIsPartnerWithUsOpen(true)}
                onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
                onOpenStaffManager={() => setIsStaffManagerOpen(true)}
            />

            {/* Privacy Policy & Data Deletion Modal */}
            {isPrivacyPolicyOpen && (
                <PrivacyPolicyModal
                    currentUser={currentUser}
                    vendors={vendors}
                    onClose={() => setIsPrivacyPolicyOpen(false)}
                    onRefreshData={refreshStateData}
                />
            )}

            {/* Partner With Us Form Modal */}
            {isPartnerWithUsOpen && (
                <PartnerWithUsModal onClose={() => setIsPartnerWithUsOpen(false)} />
            )}

            {/* Exit Confirmation Popup */}
            {isExitConfirmOpen && (
                <ExitConfirmModal
                    onConfirmExit={handleExitApp}
                    onCancel={() => setIsExitConfirmOpen(false)}
                />
            )}

            {/* Role-Aware Bottom Navigation Bar */}
            <BottomNav
                activeTab={activeTab}
                onTabChange={tab => setActiveTab(tab)}
                onAddVendor={() => setIsAddVendorOpen(true)}
            />
        </div>
    );
}

export default App;
