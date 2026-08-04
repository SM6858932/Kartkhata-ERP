import { useState, useEffect, useCallback } from 'react';
import { Vendor, Cart, RentAgreement, Payment, AuditLog, AppNotification } from '../types';
import { StorageService } from '../services/storage';
import { setActiveCompany } from '../services/firestore';
import { scopedStorageKey } from '../services/storage';
import {
    VendorService, CartService, AgreementService,
    PaymentService, AuditLogService, NotificationService
} from '../services/firestore';

/**
 * Hook that syncs data between localStorage (offline-first) and Firestore (cloud).
 *
 * - On mount: loads from localStorage immediately (fast)
 * - Then: subscribes to Firestore real-time updates (company-scoped)
 * - On Firestore changes: updates localStorage cache
 *
 * When companyId is provided (logged-in tenant user), all reads/writes are
 * scoped under companies/{companyId}/... via setActiveCompany().
 *
 * This gives instant offline access while staying synced with the cloud.
 */
export function useFirestoreSync(companyId?: string | null) {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [carts, setCarts] = useState<Cart[]>([]);
    const [agreements, setAgreements] = useState<RentAgreement[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Set the active company scope so all service calls target the right tenant.
    useEffect(() => {
        setActiveCompany(companyId ?? null);
    }, [companyId]);

    // Load from localStorage first (instant offline access)
    useEffect(() => {
        setVendors(StorageService.getVendors());
        setCarts(StorageService.getCarts());
        setAgreements(StorageService.getAgreements());
        setPayments(StorageService.getPayments());
        setAuditLogs(StorageService.getAuditLogs());
        setNotifications(StorageService.getNotifications());
    }, []);

    // Subscribe to Firestore real-time updates
    useEffect(() => {
        const unsubscribers: (() => void)[] = [];

        try {
// Vendors subscription
            unsubscribers.push(
                VendorService.subscribe((data) => {
                    setVendors(data);
                    localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_vendors'), JSON.stringify(data));
                    setLastSyncTime(new Date());
                })
            );

            // Carts subscription
            unsubscribers.push(
                CartService.subscribe((data) => {
                    setCarts(data);
                    localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_carts'), JSON.stringify(data));
                })
            );

            // Agreements subscription
            unsubscribers.push(
                AgreementService.subscribe((data) => {
                    setAgreements(data);
                    localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_agreements'), JSON.stringify(data));
                })
            );

            // Payments subscription
            unsubscribers.push(
                PaymentService.subscribe((data) => {
                    setPayments(data);
                    localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_payments'), JSON.stringify(data));
                })
            );

            // Notifications subscription
            unsubscribers.push(
                NotificationService.subscribe((data) => {
                    setNotifications(data);
                    localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_notifications'), JSON.stringify(data));
                })
            );

            // Audit logs subscription (limited to recent 100)
            unsubscribers.push(
                AuditLogService.subscribe((data) => {
                    setAuditLogs(data);
                    localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_audit_logs'), JSON.stringify(data));
                }, 100)
            );

            setIsSyncing(true);
        } catch (error) {
            console.warn('Firestore subscription failed, using localStorage only:', error);
        }

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [companyId]);

    // Force refresh from Firestore
    const refreshFromFirestore = useCallback(async () => {
        setIsSyncing(true);
        try {
            const [v, c, a, p, al, n] = await Promise.all([
                VendorService.getAll(),
                CartService.getAll(),
                AgreementService.getAll(),
                PaymentService.getAll(),
                AuditLogService.getAll(),
                NotificationService.getAll(),
            ]);

            setVendors(v);
            setCarts(c);
            setAgreements(a);
            setPayments(p);
            setAuditLogs(al);
            setNotifications(n);

// Update localStorage cache (company-scoped)
            localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_vendors'), JSON.stringify(v));
            localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_carts'), JSON.stringify(c));
            localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_agreements'), JSON.stringify(a));
            localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_payments'), JSON.stringify(p));
            localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_audit_logs'), JSON.stringify(al));
            localStorage.setItem(scopedStorageKey(companyId, 'cartkhata_notifications'), JSON.stringify(n));

            setLastSyncTime(new Date());
        } catch (error) {
            console.error('Firestore refresh failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [companyId]);

    return {
        vendors,
        carts,
        agreements,
        payments,
        auditLogs,
        notifications,
        isSyncing,
        lastSyncTime,
        refreshFromFirestore,
    };
}
