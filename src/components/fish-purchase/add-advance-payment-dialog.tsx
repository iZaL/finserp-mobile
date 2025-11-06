"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FishPurchase } from "@/types/fish-purchase";
import type { PaymentAccount, AdvancePaymentRequest } from "@/types/payment";

interface AddAdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: FishPurchase;
  paymentAccounts: PaymentAccount[];
  onSubmit: (data: AdvancePaymentRequest) => Promise<void>;
}

export function AddAdvancePaymentDialog({
  open,
  onOpenChange,
  purchase,
  paymentAccounts,
  onSubmit,
}: AddAdvancePaymentDialogProps) {
  const t = useTranslations("fishPurchases.payment");

  const [loading, setLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  // Form state
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [beneficiaryName, setBeneficiaryName] = useState(purchase.contact_name);
  const [beneficiaryPhone, setBeneficiaryPhone] = useState(purchase.contact_number);
  const [reference, setReference] = useState(
    `Fish Purchase Bill ${purchase.bill_number}-0004`
  );
  const [isAdvance, setIsAdvance] = useState(true);
  const [notes, setNotes] = useState(`Advance payment for Bill ${purchase.bill_number}-0004`);

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

      // Reset form
      setAmount("");
      setSelectedAccount(null);
      setAccountSearch("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create payment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addAdvancePayment")}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t("advancePaymentDescription")}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date">
                {t("transactionDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t("amount")} (OMR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
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
              <Label htmlFor="account">
                {t("paidThroughAccount")} <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowAccountPicker(true)}
              >
                {selectedAccount ? selectedAccount.name : t("selectAccount")}
              </Button>
            </div>

            {/* Beneficiary Name */}
            <div className="space-y-2">
              <Label htmlFor="beneficiary_name">{t("beneficiaryName")}</Label>
              <Input
                id="beneficiary_name"
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
              />
            </div>

            {/* Beneficiary Phone */}
            <div className="space-y-2">
              <Label htmlFor="beneficiary_phone">{t("beneficiaryPhone")}</Label>
              <Input
                id="beneficiary_phone"
                type="tel"
                inputMode="tel"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
              />
            </div>

            {/* Payment Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">{t("paymentReference")}</Label>
              <Input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Is Advance Payment Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_advance"
                checked={isAdvance}
                onCheckedChange={(checked) => setIsAdvance(checked === true)}
              />
              <Label htmlFor="is_advance" className="text-sm font-normal">
                {t("isAdvancePayment")}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("isAdvancePaymentDescription")}
            </p>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading || !selectedAccount}>
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
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
                <DialogTitle>{t("selectPaymentAccount")}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {t("selectPaymentAccountDescription")}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchAccounts")}
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Account List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors"
                onClick={() => {
                  setSelectedAccount(account);
                  setShowAccountPicker(false);
                  setAccountSearch("");
                }}
              >
                <div className="font-medium">{account.name}</div>
              </button>
            ))}
            {filteredAccounts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {t("noAccountsFound")}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAccountPicker(false);
                setAccountSearch("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowAccountPicker(false)}
              disabled={!selectedAccount}
            >
              {t("confirmSelection")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
