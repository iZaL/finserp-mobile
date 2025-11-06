"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, CircleDollarSign, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { FishPurchase } from "@/types/fish-purchase";
import type { Payment } from "@/types/payment";
import { AddAdvancePaymentDialog } from "./add-advance-payment-dialog";
import type { AdvancePaymentRequest } from "@/types/payment";

interface FinancialSummaryProps {
  purchase: FishPurchase;
  onPaymentAdded: () => void;
}

export function FinancialSummary({ purchase, onPaymentAdded }: FinancialSummaryProps) {
  const t = useTranslations("fishPurchases.payment");
  const [showAddPayment, setShowAddPayment] = useState(false);

  // Calculate payment progress
  const totalAmount = purchase.total_amount || 0;
  const advancePaid = purchase.advance_amount || 0;
  const balanceAmount = purchase.balance_amount || 0;
  const paymentProgress = totalAmount > 0 ? (advancePaid / totalAmount) * 100 : 0;

  // Get recent payments (up to 3)
  const recentPayments = purchase.bill?.payments?.slice(0, 3) || [];
  const hasMorePayments = (purchase.bill?.payments?.length || 0) > 3;

  const handleAddPayment = async (data: AdvancePaymentRequest) => {
    // TODO: Make API call to add payment
    console.log("Adding payment:", data);

    // Call the callback to refresh purchase data
    onPaymentAdded();
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getPaymentStatusBadge = () => {
    if (balanceAmount === 0) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {t("status.paid")}
        </Badge>
      );
    }

    if (advancePaid > 0 && purchase.advance_payment_info?.has_pending) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          {t("status.pending")}
        </Badge>
      );
    }

    if (advancePaid > 0) {
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {t("status.partial")}
        </Badge>
      );
    }

    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{t("financialSummary")}</span>
            <CircleDollarSign className="size-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("totalAmount")}</p>
              <p className="text-lg font-bold">
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">OMR</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-xs text-muted-foreground">{t("advancePaid")}</p>
                {getPaymentStatusBadge()}
              </div>
              <p className="text-lg font-bold text-primary">
                {advancePaid.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">OMR</p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("balance")}</p>
              <p className="text-lg font-bold text-orange-600">
                {balanceAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">OMR</p>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("paymentProgress")}</span>
              <span className="font-semibold">{paymentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>

          {/* Add Advance Payment Button */}
          {purchase.status !== "closed" && balanceAmount > 0 && (
            <Button
              className="w-full"
              onClick={() => setShowAddPayment(true)}
            >
              <Plus className="size-4 mr-2" />
              {t("addAdvancePayment")}
            </Button>
          )}

          {/* Recent Payments */}
          {recentPayments.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{t("recentPayments")}</h4>
                <Badge variant="secondary">
                  {purchase.bill?.payments?.length || 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {recentPayments.map((payment: Payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {payment.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          OMR
                        </p>
                        <Badge
                          className={cn("text-xs", getPaymentStatusColor(payment.status))}
                        >
                          {t(`status.${payment.status}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {payment.transaction_date_formatted}
                        {payment.paid_through_account &&
                          ` • ${payment.paid_through_account.name}`}
                      </p>
                      {payment.reference && (
                        <p className="text-xs text-muted-foreground">
                          {t("ref")}: {payment.reference}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>

              {hasMorePayments && (
                <Button variant="outline" className="w-full" size="sm">
                  <TrendingUp className="size-4 mr-2" />
                  {t("viewAllPayments", {
                    count: purchase.bill?.payments?.length || 0,
                  })}
                </Button>
              )}
            </div>
          )}

          {/* Payment Info Message */}
          {purchase.advance_payment_info?.has_pending && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {t("paymentsPendingInfo")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Advance Payment Dialog */}
      {purchase.payment_accounts && (
        <AddAdvancePaymentDialog
          open={showAddPayment}
          onOpenChange={setShowAddPayment}
          purchase={purchase}
          paymentAccounts={purchase.payment_accounts}
          onSubmit={handleAddPayment}
        />
      )}
    </>
  );
}
