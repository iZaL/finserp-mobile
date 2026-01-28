'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {X, Search, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {FishPurchase} from '@/types/fish-purchase';
import type {PaymentAccount, AdvancePaymentRequest, Payment} from '@/types/payment';

// Helper to convert date to YYYY-MM-DD format for HTML date input
function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) {
    return new Date().toISOString().split('T')[0];
  }

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // If in DD-MM-YYYY format (common backend format)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }

  // Try parsing as a date
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

interface EditAdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: FishPurchase;
  payment: Payment;
  paymentAccounts: PaymentAccount[];
  onSubmit: (data: AdvancePaymentRequest) => Promise<void>;
}

export function EditAdvancePaymentDialog({
  open,
  onOpenChange,
  purchase,
  payment,
  paymentAccounts,
  onSubmit,
}: EditAdvancePaymentDialogProps) {
  const t = useTranslations('fishPurchases.payment');

  const [loading, setLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');

  // Form state - pre-populated with existing payment data
  const [transactionDate, setTransactionDate] = useState(
    formatDateForInput(payment.transaction_date)
  );
  const [amount, setAmount] = useState(payment.amount?.toString() || '');
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(
    payment.paid_through_account
      ? {id: payment.paid_through_account.id, name: payment.paid_through_account.name}
      : null
  );
  const [beneficiaryName, setBeneficiaryName] = useState(
    payment.beneficiary_name || purchase.contact_name
  );
  const [beneficiaryPhone, setBeneficiaryPhone] = useState(
    payment.beneficiary_phone || purchase.contact_number
  );
  const [reference, setReference] = useState(payment.reference || '');
  const [isAdvance, setIsAdvance] = useState(
    payment.transaction_type === 'advance'
  );
  const [notes, setNotes] = useState(payment.notes || '');

  // Reset form when payment changes
  useEffect(() => {
    if (payment) {
      setTransactionDate(formatDateForInput(payment.transaction_date));
      setAmount(payment.amount?.toString() || '');
      setSelectedAccount(
        payment.paid_through_account
          ? {id: payment.paid_through_account.id, name: payment.paid_through_account.name}
          : null
      );
      setBeneficiaryName(payment.beneficiary_name || purchase.contact_name);
      setBeneficiaryPhone(payment.beneficiary_phone || purchase.contact_number);
      setReference(payment.reference || '');
      setIsAdvance(payment.transaction_type === 'advance');
      setNotes(payment.notes || '');
    }
  }, [payment, purchase.contact_name, purchase.contact_number]);

  // Filter accounts based on search
  const filteredAccounts = paymentAccounts.filter((account) =>
    account.name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        transaction_date: transactionDate,
        amount: parseFloat(amount),
        bank_id: selectedAccount.id,
        beneficiary_name: beneficiaryName,
        beneficiary_phone: beneficiaryPhone,
        reference,
        is_advance: isAdvance,
        notes,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editAdvancePayment') || 'Edit Advance Payment'}</DialogTitle>
            <p className="text-muted-foreground text-sm">
              {t('editAdvancePaymentDescription') || 'Update the advance payment details'}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="edit_transaction_date">
                {t('transactionDate')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit_transaction_date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="edit_amount">
                {t('amount')} (OMR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit_amount"
                type="number"
                inputMode="decimal"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount paid up to 100"
                required
                min="0.001"
              />
            </div>

            {/* Paid Through Account */}
            <div className="space-y-2">
              <Label htmlFor="edit_account">
                {t('paidThroughAccount')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowAccountPicker(true)}
              >
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </Button>
            </div>

            {/* Beneficiary Name */}
            <div className="space-y-2">
              <Label htmlFor="edit_beneficiary_name">{t('beneficiaryName')}</Label>
              <Input
                id="edit_beneficiary_name"
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
              />
            </div>

            {/* Beneficiary Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit_beneficiary_phone">{t('beneficiaryPhone')}</Label>
              <Input
                id="edit_beneficiary_phone"
                type="tel"
                inputMode="tel"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
              />
            </div>

            {/* Payment Reference */}
            <div className="space-y-2">
              <Label htmlFor="edit_reference">{t('paymentReference')}</Label>
              <Input
                id="edit_reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Is Advance Payment Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_advance"
                checked={isAdvance}
                onCheckedChange={(checked) => setIsAdvance(checked === true)}
              />
              <Label htmlFor="edit_is_advance" className="text-sm font-normal">
                {t('isAdvancePayment')}
              </Label>
            </div>
            <p className="text-muted-foreground text-xs">
              {t('isAdvancePaymentDescription')}
            </p>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit_notes">{t('notes')}</Label>
              <Textarea
                id="edit_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedAccount}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('updatePayment') || 'Update Payment'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Picker Dialog */}
      <Dialog open={showAccountPicker} onOpenChange={setShowAccountPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{t('selectPaymentAccount')}</DialogTitle>
                <p className="text-muted-foreground text-sm">
                  {t('selectPaymentAccountDescription')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAccountPicker(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={t('searchAccounts')}
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Account List */}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors"
                onClick={() => {
                  setSelectedAccount(account);
                  setShowAccountPicker(false);
                  setAccountSearch('');
                }}
              >
                <div className="font-medium">{account.name}</div>
              </button>
            ))}
            {filteredAccounts.length === 0 && (
              <p className="text-muted-foreground py-4 text-center">
                {t('noAccountsFound')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAccountPicker(false);
                setAccountSearch('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowAccountPicker(false)}
              disabled={!selectedAccount}
            >
              {t('confirmSelection')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
