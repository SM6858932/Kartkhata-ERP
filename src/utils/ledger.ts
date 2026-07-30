import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Vendor, Cart, RentAgreement, Payment } from '../types';

export interface VendorLedgerSummary {
    vendor: Vendor;
    cart?: Cart;
    agreement?: RentAgreement;
    currentMonth: string; // YYYY-MM
    baseRent: number;
    previousBalance: number; // Carry forward from past months (+ is due, - is credit)
    currentTotalDue: number; // baseRent + previousBalance
    amountPaidThisMonth: number;
    balanceRemaining: number; // currentTotalDue - amountPaidThisMonth
    paymentStatus: 'paid_full' | 'partial' | 'unpaid' | 'overpaid';
    totalTenureMonths: number;
    monthsPaidCount: number;
    monthsPendingCount: number;
    lastPayment?: Payment;
}

export function calculateVendorLedger(
    vendor: Vendor,
    agreements: RentAgreement[],
    carts: Cart[],
    payments: Payment[],
    targetMonth: string = '2026-07'
): VendorLedgerSummary {
    const agreement = agreements.find(a => a.vendorId === vendor.id && a.status === 'active');
    const cart = agreement ? carts.find(c => c.id === agreement.cartId) : undefined;
    const baseRent = agreement ? agreement.monthlyRent : 0;

    // Calculate Tenure (months since joinDate or agreement startDate)
    const startDate = agreement ? new Date(agreement.startDate) : new Date(vendor.joinDate);
    const now = new Date();
    const diffYears = now.getFullYear() - startDate.getFullYear();
    const diffMonths = now.getMonth() - startDate.getMonth();
    const totalTenureMonths = Math.max(1, diffYears * 12 + diffMonths + 1);

    // All payments for this vendor up to and including target month
    const vendorPayments = payments
        .filter(p => p.vendorId === vendor.id)
        .sort((a, b) => a.month.localeCompare(b.month));

    // Find previous month shortfall carried over
    let previousBalance = 0;
    const pastPayments = vendorPayments.filter(p => p.month < targetMonth);
    if (pastPayments.length > 0) {
        const lastPastPayment = pastPayments[pastPayments.length - 1];
        previousBalance = lastPastPayment.balanceCarriedForward;
    }

    // Current total due
    const currentTotalDue = baseRent + previousBalance;

    // Payments in current month
    const currentMonthPayments = vendorPayments.filter(p => p.month === targetMonth);
    const amountPaidThisMonth = currentMonthPayments.reduce((sum, p) => sum + p.amountCollected, 0);

    const balanceRemaining = currentTotalDue - amountPaidThisMonth;

    let paymentStatus: 'paid_full' | 'partial' | 'unpaid' | 'overpaid' = 'unpaid';
    if (amountPaidThisMonth > 0) {
        if (balanceRemaining === 0) paymentStatus = 'paid_full';
        else if (balanceRemaining < 0) paymentStatus = 'overpaid';
        else paymentStatus = 'partial';
    }

    // Count paid vs pending months
    const monthsPaidCount = vendorPayments.filter(p => p.amountCollected > 0 && p.balanceCarriedForward <= 0).length;
    const monthsPendingCount = Math.max(0, totalTenureMonths - monthsPaidCount);

    const lastPayment = vendorPayments.length > 0 ? vendorPayments[vendorPayments.length - 1] : undefined;

    return {
        vendor,
        cart,
        agreement,
        currentMonth: targetMonth,
        baseRent,
        previousBalance,
        currentTotalDue,
        amountPaidThisMonth,
        balanceRemaining,
        paymentStatus,
        totalTenureMonths,
        monthsPaidCount,
        monthsPendingCount,
        lastPayment
    };
}

export function getLoyaltyBadgeInfo(score: number): { label: string; badgeClass: string; icon: string } {
    if (score >= 90) {
        return { label: 'Gold Payer', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: '🌟' };
    } else if (score >= 75) {
        return { label: 'Silver Payer', badgeClass: 'bg-slate-300/20 text-slate-200 border-slate-300/40', icon: '🥈' };
    } else if (score >= 50) {
        return { label: 'Bronze Payer', badgeClass: 'bg-orange-600/20 text-orange-300 border-orange-600/40', icon: '🥉' };
    } else {
        return { label: 'Standard', badgeClass: 'bg-slate-700 text-slate-400 border-slate-600', icon: '👤' };
    }
}

export function generateWhatsAppReceiptUrl(
    vendorPhone: string,
    vendorName: string,
    payment: Payment,
    cartNumber: string,
    companyName?: string
): string {
    const cleanPhone = vendorPhone.replace(/[^0-9]/g, '');
    const displayName = companyName || 'CartKhata ERP';
    const message = `🧾 *CARTKHATA RENT RECEIPT*
----------------------------------
*Receipt No:* ${payment.serialNo}
*Date:* ${new Date(payment.collectedAt).toLocaleDateString('en-IN')}
*Vendor:* ${vendorName}
*Cart Asset:* ${cartNumber}
*Month:* ${payment.month}
----------------------------------
*Base Rent Due:* ₹${payment.dueAmount.toLocaleString()}
*Amount Paid:* ₹${payment.amountCollected.toLocaleString()}
*Payment Mode:* ${payment.paymentMode.toUpperCase()}
*Remaining Balance:* ₹${payment.balanceCarriedForward.toLocaleString()} ${payment.balanceCarriedForward > 0 ? '(Carried Forward)' : '(Fully Cleared)'}
----------------------------------
Thank you for your timely rent payment!
_${displayName}_`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function exportVendorPDFStatement(summary: VendorLedgerSummary, payments: Payment[], companyName?: string): void {
    const doc = new jsPDF();
    const { vendor, cart, currentMonth, baseRent, previousBalance, currentTotalDue, amountPaidThisMonth, balanceRemaining } = summary;
    const displayName = companyName || 'CartKhata ERP';

    // Header Banner
    doc.setFillColor(234, 88, 12); // Brand Orange (#ea580c)
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`CARTKHATA - ${displayName}`, 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Monthly Rent Account Statement', 145, 18);

    // Vendor & Cart Details Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Vendor: ${vendor.fullName}`, 14, 38);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${vendor.phone}`, 14, 44);
    doc.text(`Address: ${vendor.address}`, 14, 50);
    doc.text(`Aadhaar/ID Proof: ${vendor.idProofType.toUpperCase()} (${vendor.idProofNumber})`, 14, 56);

    doc.setFont('helvetica', 'bold');
    doc.text(`Cart No: ${cart ? cart.cartNumber : 'N/A'}`, 140, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cart Model: ${cart ? cart.modelType : 'N/A'}`, 140, 44);
    doc.text(`Statement Month: ${currentMonth}`, 140, 50);
    doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 56);

    // Financial Summary Cards
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 62, 182, 24, 'F');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('BASE MONTHLY RENT', 20, 70);
    doc.text('PREVIOUS SHORTFALL', 65, 70);
    doc.text('TOTAL DUE', 110, 70);
    doc.text('CURRENT BALANCE', 155, 70);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`₹${baseRent.toLocaleString()}`, 20, 78);
    doc.text(`₹${previousBalance.toLocaleString()}`, 65, 78);
    doc.text(`₹${currentTotalDue.toLocaleString()}`, 110, 78);

    if (balanceRemaining <= 0) {
        doc.setTextColor(22, 163, 74); // Green
        doc.text(`₹${Math.abs(balanceRemaining).toLocaleString()} (CLEARED)`, 155, 78);
    } else {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`₹${balanceRemaining.toLocaleString()} PENDING`, 155, 78);
    }

    // Payment History Table
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Transaction Ledger History', 14, 96);

    const vendorPayments = payments
        .filter(p => p.vendorId === vendor.id)
        .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

    const tableData = vendorPayments.map(p => [
        p.serialNo,
        new Date(p.collectedAt).toLocaleDateString('en-IN'),
        p.month,
        `₹${p.dueAmount.toLocaleString()}`,
        `₹${p.amountCollected.toLocaleString()}`,
        `₹${p.balanceCarriedForward.toLocaleString()}`,
        p.paymentMode.toUpperCase(),
        p.collectedByName
    ]);

    autoTable(doc, {
        startY: 100,
        head: [['Serial No', 'Date', 'Month', 'Due', 'Paid', 'Carried Balance', 'Mode', 'Collector']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    // Footer Note & Signature
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 180;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Note: Shortfall amounts automatically carry forward to the next month due amount under CartKhata - ${displayName} rules.`, 14, finalY);

    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Office Signature: _______________________', 120, finalY + 15);

    // Save File
    doc.save(`CartKhata_${displayName.replace(/\s+/g, '_')}_Statement_${vendor.fullName.replace(/\s+/g, '_')}_${currentMonth}.pdf`);
}
