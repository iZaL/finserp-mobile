'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Plus, CircleDollarSign, TrendingUp, ChevronRight, Pencil, Trash2, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {cn} from '@/lib/utils';
import {getPaymentStatusColor} from '@/lib/utils/status-colors';
import type {FishPurchase} from '@/types/fish-purchase';
import type {Payment} from '@/types/payment';
import {AddAdvancePaymentDialog} from './add-advance-payment-dialog';
import {EditAdvancePaymentDialog} from './edit-advance-payment-dialog';
import type {AdvancePaymentRequest} from '@/types/payment';
import {useAddFishPurchasePayment, useUpdateAdvancePayment, useDeleteAdvancePayment} from '@/hooks/use-fish-purchases';

interface FinancialSummaryProps {
  purchase: FishPurchase;
  onPaymentAdded: () => void;
}

export function FinancialSummary({
  purchase,
  onPaymentAdded,
}: FinancialSummaryProps) {
  const t = useTranslations('fishPurchases.payment');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const addPaymentMutation = useAddFishPurchasePayment();
  const updatePaymentMutation = useUpdateAdvancePayment();
  const deletePaymentMutation = useDeleteAdvancePayment();

  const addingPayment = addPaymentMutation.isPending;
  const updatingPayment = updatePaymentMutation.isPending;
  const deletingPayment = deletePaymentMutation.isPending;

  // Check if purchase is not yet approved - allow edit/delete before approval
  const canModifyPayments = purchase.status !== 'approved' && purchase.status !== 'closed';

  // Calculate payment progress
  const totalAmount = purchase.total_amount || 0;
  const advancePaid = purchase.advance_amount || 0;
  const balanceAmount = purchase.balance_amount || 0;
  const paymentProgress =
    totalAmount > 0 ? (advancePaid / totalAmount) * 100 : 0;

  // Get recent payments (up to 3) - payments are nested under bill.pricing
  const recentPayments = purchase.bill?.pricing?.payments?.slice(0, 3) || [];
  const hasMorePayments = (purchase.bill?.pricing?.payments?.length || 0) > 3;

  const handleAddPayment = async (
    data: AdvancePaymentRequest
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      addPaymentMutation.mutate(
        {
          id: purchase.id,
          data,
        },
        {
          onSuccess: () => {
            // Close dialog after mutation AND cache updates complete
            setShowAddPayment(false);
            onPaymentAdded();
            resolve();
          },
          onError: (error) => {
            console.error('Failed to add payment:', error);
            // Error toast is already shown by the hook
            reject(error);
          },
        }
      );
    });
  };

  const handleEditPayment = async (
    data: AdvancePaymentRequest
  ): Promise<void> => {
    if (!selectedPayment) return;

    return new Promise((resolve, reject) => {
      updatePaymentMutation.mutate(
        {
          fishPurchaseId: purchase.id,
          paymentId: selectedPayment.id,
          data,
        },
        {
          onSuccess: () => {
            setShowEditPayment(false);
            setSelectedPayment(null);
            onPaymentAdded();
            resolve();
          },
          onError: (error) => {
            console.error('Failed to update payment:', error);
            reject(error);
          },
        }
      );
    });
  };

  const handleDeletePayment = () => {
    if (!selectedPayment) return;

    deletePaymentMutation.mutate(
      {
        fishPurchaseId: purchase.id,
        paymentId: selectedPayment.id,
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setSelectedPayment(null);
          onPaymentAdded();
        },
        onError: (error) => {
          console.error('Failed to delete payment:', error);
        },
      }
    );
  };

  const openEditDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowEditPayment(true);
  };

  const openDeleteDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDeleteConfirm(true);
  };

  const getPaymentStatusBadge = () => {
    if (balanceAmount === 0) {
      return (
        <Badge className={getPaymentStatusColor('paid')}>
          {t('status.paid')}
        </Badge>
      );
    }

    if (advancePaid > 0 && purchase.advance_payment_info?.has_pending) {
      return (
        <Badge className={getPaymentStatusColor('pending')}>
          {t('status.pending')}
        </Badge>
      );
    }

    if (advancePaid > 0) {
      return (
        <Badge className={getPaymentStatusColor('partial')}>
          {t('status.partial')}
        </Badge>
      );
    }

    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{t('financialSummary')}</span>
            <CircleDollarSign className="text-primary size-5" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-xs">
                {t('totalAmount')}
              </p>
              <p className="text-lg font-bold">
                {totalAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-muted-foreground text-xs">OMR</p>
            </div>

            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                <p className="text-muted-foreground text-xs">
                  {t('advancePaid')}
                </p>
                {getPaymentStatusBadge()}
              </div>
              <p className="text-primary text-lg font-bold">
                {advancePaid.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-muted-foreground text-xs">OMR</p>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-xs">
                {t('balance')}
              </p>
              <p className="text-lg font-bold text-orange-600">
                {balanceAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-muted-foreground text-xs">OMR</p>
            </div>
          </div>

          {/* Payment Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('paymentProgress')}
              </span>
              <span className="font-semibold">
                {paymentProgress.toFixed(1)}%
              </span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>

          {/* Add Advance Payment Button - only show if no payment exists yet */}
          {purchase.status !== 'closed' && balanceAmount > 0 && recentPayments.length === 0 && (
            <Button
              className="w-full"
              onClick={() => setShowAddPayment(true)}
              disabled={addingPayment}
            >
              <Plus className="mr-2 size-4" />
              {t('addAdvancePayment')}
            </Button>
          )}

          {/* Recent Payments */}
          {recentPayments.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{t('recentPayments')}</h4>
                <Badge variant="secondary">
                  {purchase.bill?.payments?.length || 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {recentPayments.map((payment: Payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {payment.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          OMR
                        </p>
                        <Badge
                          className={cn(
                            'text-xs',
                            getPaymentStatusColor(payment.status)
                          )}
                        >
                          {t(`status.${payment.status}`)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {payment.transaction_date_formatted}
                        {payment.paid_through_account &&
                          ` • ${payment.paid_through_account.name}`}
                      </p>
                      {payment.reference && (
                        <p className="text-muted-foreground text-xs">
                          {t('ref')}: {payment.reference}
                        </p>
                      )}
                    </div>
                    {canModifyPayments ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditDialog(payment)}
                          disabled={updatingPayment || deletingPayment}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-8"
                          onClick={() => openDeleteDialog(payment)}
                          disabled={updatingPayment || deletingPayment}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <ChevronRight className="text-muted-foreground size-4" />
                    )}
                  </div>
                ))}
              </div>

              {hasMorePayments && (
                <Button variant="outline" className="w-full" size="sm">
                  <TrendingUp className="mr-2 size-4" />
                  {t('viewAllPayments', {
                    count: purchase.bill?.payments?.length || 0,
                  })}
                </Button>
              )}
            </div>
          )}

          {/* Payment Info Message */}
          {purchase.advance_payment_info?.has_pending && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {t('paymentsPendingInfo')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Advance Payment Dialog */}
      <AddAdvancePaymentDialog
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        purchase={purchase}
        paymentAccounts={purchase.payment_accounts || []}
        onSubmit={handleAddPayment}
      />

      {/* Edit Advance Payment Dialog */}
      {selectedPayment && (
        <EditAdvancePaymentDialog
          open={showEditPayment}
          onOpenChange={(open) => {
            setShowEditPayment(open);
            if (!open) setSelectedPayment(null);
          }}
          purchase={purchase}
          payment={selectedPayment}
          paymentAccounts={purchase.payment_accounts || []}
          onSubmit={handleEditPayment}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('deletePaymentTitle') || 'Delete Payment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deletePaymentDescription') ||
                'Are you sure you want to delete this payment? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedPayment(null);
              }}
            >
              {t('cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingPayment}
            >
              {deletingPayment ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('deleting') || 'Deleting...'}
                </>
              ) : (
                t('delete') || 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
