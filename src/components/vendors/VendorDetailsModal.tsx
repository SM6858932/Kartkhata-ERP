import React from 'react';
import { User, Payment } from '../../types';
import { VendorLedgerSummary } from '../../utils/ledger';
import { VendorDetailPage } from './VendorDetailPage';

interface VendorDetailsModalProps {
  summary: VendorLedgerSummary;
  currentUser: User;
  payments: Payment[];
  onClose: () => void;
  onReturnCart?: (summary: VendorLedgerSummary) => void;
}

export const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  summary,
  currentUser,
  payments,
  onClose,
  onReturnCart
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
      <VendorDetailPage
        vendorId={summary.vendor.id}
        currentUser={currentUser}
        vendors={[summary.vendor]}
        carts={summary.cart ? [summary.cart] : []}
        agreements={summary.agreement ? [summary.agreement] : []}
        payments={payments}
        onBack={onClose}
        onReturnCart={onReturnCart}
      />
    </div>
  );
};
