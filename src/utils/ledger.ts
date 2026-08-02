import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Vendor, Cart, RentAgreement, Payment } from '../types';

/** Company branding used on statements, receipts & exports (Phase 2). */
export interface StatementCompany {
    name?: string;
    logoUrl?: string;
    address?: string;
    ownerMobile?: string;
    phone?: string;
    email?: string;
}

const FALLBACK_COMPANY = 'CartKhata ERP';
const IN = 25.4; // mm per inch

function safeName(company?: StatementCompany): string {
    return (company && company.name) || FALLBACK_COMPANY;
}

function formatINDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN');
}

function formatINTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function currency(n: number): string {
    return `₹${n.toLocaleString('en-IN')}`;
}

async function loadLogoDataUrl(logoUrl?: string): Promise<string | null> {
    if (!logoUrl) return null;
    try {
        const res = await fetch(logoUrl);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function downloadBlob(content: string, mime: string, filename: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

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
    company?: StatementCompany
): string {
    const cleanPhone = vendorPhone.replace(/[^0-9]/g, '');
    const displayName = safeName(company);
    const addressLine = company?.address ? `\n*Address:* ${company.address}` : '';
    const contactLine = company?.ownerMobile
        ? `\n*Contact:* ${company.ownerMobile}`
        : (company?.phone ? `\n*Contact:* ${company.phone}` : '');
    const message = `🧾 *${displayName} — RENT RECEIPT*
----------------------------------
*Receipt No:* ${payment.serialNo}
*Date:* ${formatINDate(payment.collectedAt)} ${formatINTime(payment.collectedAt)}
*Vendor:* ${vendorName}
*Cart Asset:* ${cartNumber}
*Month:* ${payment.month}
----------------------------------
*Base Rent Due:* ${currency(payment.dueAmount)}
*Amount Paid:* ${currency(payment.amountCollected)}
*Payment Mode:* ${payment.paymentMode.toUpperCase()}
*Remaining Balance:* ${currency(payment.balanceCarriedForward)} ${payment.balanceCarriedForward > 0 ? '(Carried Forward)' : '(Fully Cleared)'}
----------------------------------
Thank you for your timely rent payment!
${displayName}${addressLine}${contactLine}
_Official rent receipt · keep this for your records_`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/** Draw the branded company header block on a jsPDF doc. Returns the Y position after the block. */
async function drawCompanyHeader(doc: jsPDF, company?: StatementCompany, startY: number = 12): Promise<number> {
    const name = safeName(company);
    const brandColor: [number, number, number] = [234, 88, 12];

    doc.setFillColor(...brandColor);
    doc.rect(0, 0, 210, 26, 'F');

    const logo = await loadLogoDataUrl(company?.logoUrl);
    let textX = 14;
    if (logo) {
        try {
            doc.addImage(logo, 'PNG', 14, 5, 16, 16);
            textX = 36;
        } catch {
            textX = 14;
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(name.toUpperCase(), textX, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const subLines: string[] = [];
    if (company?.address) subLines.push(company.address);
    if (company?.ownerMobile) subLines.push(`Owner: ${company.ownerMobile}`);
    else if (company?.phone) subLines.push(`Tel: ${company.phone}`);
    if (company?.email) subLines.push(company.email);
    const sub = subLines.join('  ·  ');
    if (sub) {
        doc.setTextColor(255, 241, 242);
        doc.text(sub, textX, 20);
    }

    // Fine rule under the banner
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.8);
    doc.line(0, 26, 210, 26);

    return startY;
}

export async function exportVendorPDFStatement(
    summary: VendorLedgerSummary,
    payments: Payment[],
    company?: StatementCompany
): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { vendor, cart, currentMonth, baseRent, previousBalance, currentTotalDue, balanceRemaining } = summary;

    await drawCompanyHeader(doc, company, 36);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Monthly Rent Account Statement`, 14, 38);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Vendor: ${vendor.fullName}`, 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${vendor.phone}`, 14, 54);
    doc.text(`Address: ${vendor.address}`, 14, 60);
    doc.text(`Aadhaar/ID Proof: ${vendor.idProofType.toUpperCase()} (${vendor.idProofNumber})`, 14, 66);

    doc.setFont('helvetica', 'bold');
    doc.text(`Cart No: ${cart ? cart.cartNumber : 'N/A'}`, 140, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cart Model: ${cart ? cart.modelType : 'N/A'}`, 140, 54);
    doc.text(`Statement Month: ${currentMonth}`, 140, 60);
    doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 66);

    // Financial Summary Cards
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 72, 182, 24, 'F');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('BASE MONTHLY RENT', 20, 80);
    doc.text('PREVIOUS SHORTFALL', 65, 80);
    doc.text('TOTAL DUE', 110, 80);
    doc.text('CURRENT BALANCE', 155, 80);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(currency(baseRent), 20, 88);
    doc.text(currency(previousBalance), 65, 88);
    doc.text(currency(currentTotalDue), 110, 88);

    if (balanceRemaining <= 0) {
        doc.setTextColor(22, 163, 74); // Green
        doc.text(`${currency(Math.abs(balanceRemaining))} (CLEARED)`, 155, 88);
    } else {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`${currency(balanceRemaining)} PENDING`, 155, 88);
    }

    // Payment History Table — audit trail with serial no, date & time
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Transaction Ledger History (Audit Trail)', 14, 106);

    const vendorPayments = payments
        .filter(p => p.vendorId === vendor.id)
        .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

    const tableData = vendorPayments.map(p => [
        p.serialNo,
        formatINDate(p.collectedAt),
        formatINTime(p.collectedAt),
        p.month,
        currency(p.dueAmount),
        currency(p.amountCollected),
        currency(p.balanceCarriedForward),
        p.paymentMode.toUpperCase(),
        p.collectedByName
    ]);

    autoTable(doc, {
        startY: 110,
        head: [['Serial No', 'Date', 'Time', 'Month', 'Due', 'Paid', 'Carried', 'Mode', 'Collector']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    // Footer Note & Signature
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 190;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Note: Shortfall amounts automatically carry forward to the next month due amount under ${safeName(company)} rules.`, 14, finalY);

    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Office Signature: _______________________', 120, finalY + 15);

    if (company?.ownerMobile) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`For queries contact: ${company.ownerMobile}`, 120, finalY + 22);
    }

    // Save File
    doc.save(`CartKhata_${safeName(company).replace(/\s+/g, '_')}_Statement_${vendor.fullName.replace(/\s+/g, '_')}_${currentMonth}.pdf`);
}

/** WhatsApp receipt in an 11×5 inch printable PDF (landscape). */
export async function exportVendorReceiptPDF(
    payment: Payment,
    vendor: Vendor,
    cartNumber: string,
    company?: StatementCompany
): Promise<void> {
    const W = 11 * IN;
    const H = 5 * IN;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] });
    const displayName = safeName(company);

    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${displayName.toUpperCase()} — OFFICIAL RENT RECEIPT`, 14, 13);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const left: Array<[string, string]> = [
        ['Receipt No', payment.serialNo],
        ['Date & Time', `${formatINDate(payment.collectedAt)} ${formatINTime(payment.collectedAt)}`],
        ['Vendor', vendor.fullName],
        ['Phone', vendor.phone],
        ['Cart Asset', cartNumber],
        ['Month', payment.month],
    ];
    const right: Array<[string, string]> = [
        ['Base Rent Due', currency(payment.dueAmount)],
        ['Amount Paid', currency(payment.amountCollected)],
        ['Payment Mode', payment.paymentMode.toUpperCase()],
        ['Penalty', currency(payment.penalty)],
        ['Discount', currency(payment.discount)],
        ['Remaining Balance', `${currency(payment.balanceCarriedForward)} ${payment.balanceCarriedForward > 0 ? '(Carried Fwd)' : '(Cleared)'}`],
    ];

    let y = 34;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VENDOR DETAILS', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    for (const [k, v] of left) {
        doc.text(k, 16, y);
        doc.text(v, 70, y);
        y += 6;
    }

    y = 34;
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 145, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    for (const [k, v] of right) {
        doc.text(k, 147, y);
        doc.text(v, 210, y);
        y += 6;
    }

    // Collector & signature footer
    const footerY = H - 16;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    const contact = company?.ownerMobile ? company.ownerMobile : (company?.phone || displayName);
    doc.text(`Collected By: ${payment.collectedByName}   |   For queries: ${contact}   |   Thank you for your timely payment!`, 14, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Signature: ___________________________`, 145, footerY);

    doc.save(`CartKhata_Receipt_${vendor.fullName.replace(/\s+/g, '_')}_${payment.serialNo}.pdf`);
}

/** Full A4 account statement with audit trail, exported as an Excel-compatible .xls file. */
export function exportVendorStatementXLS(
    summary: VendorLedgerSummary,
    payments: Payment[],
    company?: StatementCompany
): void {
    const { vendor, cart, currentMonth, baseRent, previousBalance, currentTotalDue, amountPaidThisMonth, balanceRemaining } = summary;
    const name = safeName(company);

    const vendorPayments = payments
        .filter(p => p.vendorId === vendor.id)
        .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));

    const rows = vendorPayments.map(p =>
        `<tr>
            <td>${p.serialNo}</td>
            <td>${formatINDate(p.collectedAt)}</td>
            <td>${formatINTime(p.collectedAt)}</td>
            <td>${p.month}</td>
            <td>${p.dueAmount}</td>
            <td>${p.amountCollected}</td>
            <td>${p.balanceCarriedForward}</td>
            <td>${p.paymentMode.toUpperCase()}</td>
            <td>${p.collectedByName}</td>
        </tr>`
    ).join('');

    const html = `<html>
<head><meta charset="utf-8"><title>${name} — Account Statement</title></head>
<body style="font-family: Arial, sans-serif;">
    <h2>${name} — Rent Account Statement</h2>
    <table border="0" cellspacing="0" cellpadding="4" style="margin-bottom:16px;">
        <tr><td><b>Vendor:</b></td><td>${vendor.fullName}</td><td><b>Phone:</b></td><td>${vendor.phone}</td></tr>
        <tr><td><b>Address:</b></td><td colspan="3">${vendor.address}</td></tr>
        <tr><td><b>Cart No:</b></td><td>${cart ? cart.cartNumber : 'N/A'}</td><td><b>Statement Month:</b></td><td>${currentMonth}</td></tr>
        <tr><td><b>Base Rent:</b></td><td>${currency(baseRent)}</td><td><b>Previous Shortfall:</b></td><td>${currency(previousBalance)}</td></tr>
        <tr><td><b>Total Due:</b></td><td>${currency(currentTotalDue)}</td><td><b>Paid This Month:</b></td><td>${currency(amountPaidThisMonth)}</td></tr>
        <tr><td><b>Balance Remaining:</b></td><td colspan="3">${currency(balanceRemaining)}</td></tr>
    </table>
    <h3>Transaction Ledger History (Audit Trail)</h3>
    <table border="1" cellspacing="0" cellpadding="4">
        <tr style="background:#ea580c;color:#fff;">
            <th>Serial No</th><th>Date</th><th>Time</th><th>Month</th><th>Due (₹)</th><th>Paid (₹)</th><th>Carried (₹)</th><th>Mode</th><th>Collector</th>
        </tr>
        ${rows || '<tr><td colspan="9">No payments recorded yet.</td></tr>'}
    </table>
    <p style="font-size:11px;color:#666;">Generated: ${new Date().toLocaleString('en-IN')} · ${name}${company?.ownerMobile ? ' · Contact: ' + company.ownerMobile : ''}</p>
</body>
</html>`;

    downloadBlob(html, 'application/vnd.ms-excel',
        `${name.replace(/\s+/g, '_')}_Statement_${vendor.fullName.replace(/\s+/g, '_')}_${currentMonth}.xls`);
}

/** Full A4 account statement exported as a Word-compatible .doc file. */
export function exportVendorStatementDOC(
    summary: VendorLedgerSummary,
    payments: Payment[],
    company?: StatementCompany
): void {
    const { vendor, cart, currentMonth, baseRent, previousBalance, currentTotalDue, amountPaidThisMonth, balanceRemaining } = summary;
    const name = safeName(company);

    const vendorPayments = payments
        .filter(p => p.vendorId === vendor.id)
        .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));

    const rows = vendorPayments.map(p =>
        `<tr>
            <td>${p.serialNo}</td>
            <td>${formatINDate(p.collectedAt)} ${formatINTime(p.collectedAt)}</td>
            <td>${p.month}</td>
            <td>₹${p.dueAmount}</td>
            <td>₹${p.amountCollected}</td>
            <td>₹${p.balanceCarriedForward}</td>
            <td>${p.paymentMode.toUpperCase()}</td>
            <td>${p.collectedByName}</td>
        </tr>`
    ).join('');

    const html = `<html>
<head><meta charset="utf-8"><title>${name} — Account Statement</title></head>
<body style="font-family: Arial, sans-serif;">
    <h2>${name} — Rent Account Statement</h2>
    <table border="0" cellpadding="4">
        <tr><td><b>Vendor:</b> ${vendor.fullName}</td><td><b>Phone:</b> ${vendor.phone}</td></tr>
        <tr><td colspan="2"><b>Address:</b> ${vendor.address}</td></tr>
        <tr><td><b>Cart No:</b> ${cart ? cart.cartNumber : 'N/A'}</td><td><b>Statement Month:</b> ${currentMonth}</td></tr>
    </table>
    <hr/>
    <p>
        <b>Base Monthly Rent:</b> ${currency(baseRent)}<br/>
        <b>Previous Shortfall (carry forward):</b> ${currency(previousBalance)}<br/>
        <b>Total Due:</b> ${currency(currentTotalDue)}<br/>
        <b>Amount Paid This Month:</b> ${currency(amountPaidThisMonth)}<br/>
        <b>Balance Remaining:</b> ${currency(balanceRemaining)}
    </p>
    <h3>Transaction Ledger History (Audit Trail)</h3>
    <table border="1" cellpadding="4" style="border-collapse:collapse;">
        <tr style="background:#ea580c;color:#fff;">
            <th>Serial No</th><th>Date &amp; Time</th><th>Month</th><th>Due</th><th>Paid</th><th>Carried</th><th>Mode</th><th>Collector</th>
        </tr>
        ${rows || '<tr><td colspan="8">No payments recorded yet.</td></tr>'}
    </table>
    <p style="font-size:11px;color:#666;">Generated: ${new Date().toLocaleString('en-IN')} · ${name}${company?.ownerMobile ? ' · Contact: ' + company.ownerMobile : ''}</p>
    <p>Authorized Office Signature: _______________________</p>
</body>
</html>`;

    downloadBlob(html, 'application/msword',
        `${name.replace(/\s+/g, '_')}_Statement_${vendor.fullName.replace(/\s+/g, '_')}_${currentMonth}.doc`);
}

/** Vendor vCard (.vcf) with cart & contact details. */
export function exportVendorVCF(summary: VendorLedgerSummary, company?: StatementCompany): void {
    const { vendor, cart } = summary;
    const name = safeName(company);
    const [last, first] = vendor.fullName.trim().split(/\s+/, 2).reverse() as [string, string | undefined];

    const card = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${last || ''};${first || ''};;;`,
        `FN:${vendor.fullName}`,
        `TEL;TYPE=CELL:${vendor.phone.replace(/[^0-9+]/g, '')}`,
        `ADR;TYPE=HOME:;;${vendor.address};;;`,
        vendor.whatsAppPhone ? `TEL;TYPE=CELL,VOICE;VALUE=uri:tel:${vendor.whatsAppPhone.replace(/[^0-9+]/g, '')}` : '',
        cart ? `NOTE:Cart ${cart.cartNumber} (${cart.modelType}) — ${name}` : `NOTE:${name}`,
        'END:VCARD'
    ].filter(Boolean).join('\r\n');

    downloadBlob(card, 'text/vcard',
        `${vendor.fullName.replace(/\s+/g, '_')}_${cart ? cart.cartNumber.replace(/[^A-Za-z0-9]/g, '_') : 'Vendor'}.vcf`);
}
