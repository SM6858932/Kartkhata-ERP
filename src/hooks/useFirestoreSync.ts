import { useState, useEffect, useCallback } from 'react';
import { User, Vendor, Cart, RentAgreement, Payment, AuditLog, AppNotification } from '../types';
import { StorageService } from '../services/storage';
import {
  UserService, VendorService, CartService, AgreementService,
  PaymentService, AuditLogService, NotificationService
} from '../services/firestore';

/**
 * Hook that syncs data between localStorage (offline-first) and Firestore (cloud).
 * 
 * - On mount: loads from localStorage immediately (fast)
 * - Then: subscribes to Firestore real-time updates
 * - On Firestore changes: updates localStorage cache
 * 
 * This gives instant offline access while staying synced with the cloud.
 */
export function useFirestoreSync() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [agreements, setAgreements] = useState<RentAgreement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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
          localStorage.setItem('cartkhata_vendors', JSON.stringify(data));
          setLastSyncTime(new Date());
        })
      );

      // Carts subscription
      unsubscribers.push(
        CartService.subscribe((data) => {
          setCarts(data);
          localStorage.setItem('cartkhata_carts', JSON.stringify(data));
        })
      );

      // Agreements subscription
      unsubscribers.push(
        AgreementService.subscribe((data) => {
          setAgreements(data);
          localStorage.setItem('cartkhata_agreements', JSON.stringify(data));
        })
      );

      // Payments subscription
      unsubscribers.push(
        PaymentService.subscribe((data) => {
          setPayments(data);
          localStorage.setItem('cartkhata_payments', JSON.stringify(data));
        })
      );

      // Notifications subscription
      unsubscribers.push(
        NotificationService.subscribe((data) => {
          setNotifications(data);
          localStorage.setItem('cartkhata_notifications', JSON.stringify(data));
        })
      );

      // Audit logs subscription (limited to recent 100)
      unsubscribers.push(
        AuditLogService.subscribe((data) => {
          setAuditLogs(data);
          localStorage.setItem('cartkhata_audit_logs', JSON.stringify(data));
        }, 100)
      );

      setIsSyncing(true);
    } catch (error) {
      console.warn('Firestore subscription failed, using localStorage only:', error);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

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

      // Update localStorage cache
      localStorage.setItem('cartkhata_vendors', JSON.stringify(v));
      localStorage.setItem('cartkhata_carts', JSON.stringify(c));
      localStorage.setItem('cartkhata_agreements', JSON.stringify(a));
      localStorage.setItem('cartkhata_payments', JSON.stringify(p));
      localStorage.setItem('cartkhata_audit_logs', JSON.stringify(al));
      localStorage.setItem('cartkhata_notifications', JSON.stringify(n));

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Firestore refresh failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

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
