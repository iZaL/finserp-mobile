'use client';

import {use, useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ChevronLeft,
  Edit,
  Trash2,
  Loader2,
  Package,
  Scale,
  CircleDollarSign,
  FileText,
  User,
  Phone,
  CreditCard,
  Truck,
  MapPin,
  Clock,
  Fish,
  Calendar,
  ChevronRight,
  Printer,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import {
  useFishPurchase,
  useDeleteFishPurchase,
} from '@/hooks/use-fish-purchases';
import {toast} from 'sonner';
import type {FishPurchaseStatus} from '@/types/fish-purchase';
import {cn} from '@/lib/utils';
import {FinancialSummary} from '@/components/fish-purchase/financial-summary';
import {FishPurchasesGuard} from '@/components/permission-guard';
import {PrintHeader} from '@/components/print/print-header';

export default function FishPurchaseDetailsPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = use(params);
  const router = useRouter();
  const t = useTranslations('fishPurchases');
  const {
    data: purchase,
    isLoading: loading,
    refetch,
  } = useFishPurchase(parseInt(id));
  const deleteMutation = useDeleteFishPurchase();
  const deleting = deleteMutation.isPending;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [printPortalContainer, setPrintPortalContainer] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create print portal container
    let container = document.getElementById('print-area');
    if (!container) {
      container = document.createElement('div');
      container.id = 'print-area';
      document.body.appendChild(container);
    }
    setPrintPortalContainer(container);
    return () => {
      // Cleanup on unmount
      const el = document.getElementById('print-area');
      if (el) el.remove();
    };
  }, []);

  const getStatusStyle = (status: FishPurchaseStatus) => {
    switch (status) {
      case 'draft':
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          gradient: 'from-slate-500 to-slate-600',
        };
      case 'pending':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
          gradient: 'from-amber-500 to-orange-500',
        };
      case 'approved':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          gradient: 'from-emerald-500 to-green-500',
        };
      case 'paid':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-400',
          gradient: 'from-blue-500 to-indigo-500',
        };
      case 'closed':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-700 dark:text-purple-400',
          gradient: 'from-purple-500 to-violet-500',
        };
      case 'rejected':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-400',
          gradient: 'from-red-500 to-rose-500',
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          gradient: 'from-slate-500 to-slate-600',
        };
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(parseInt(id), {
      onSuccess: () => {
        router.push('/fish-purchases');
        toast.success(t('deleteSuccess'));
      },
      onError: () => {
        toast.error(t('deleteError'));
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">{t('notFound')}</p>
        <Button onClick={() => router.push('/fish-purchases')}>
          {t('backToList')}
        </Button>
      </div>
    );
  }

  const statusStyle = getStatusStyle(purchase.status);

  return (
    <FishPurchasesGuard>
      {/* Print-only styles */}
      <style jsx global>{`
        /* Hide print area by default */
        #print-area {
          display: none !important;
        }
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          /* Hide everything except print area */
          body > *:not(#print-area) {
            display: none !important;
          }
          #print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            background: white !important;
            padding: 8mm 12mm !important;
            margin: 0 !important;
          }
          #print-area .print-area-content {
            display: block !important;
          }
        }
      `}</style>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-24">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-10',
              statusStyle.gradient
            )}
          />

          {/* Decorative circles */}
          <div className="bg-primary/5 absolute -top-10 -right-10 size-40 rounded-full" />
          <div className="bg-primary/5 absolute top-20 -left-5 size-24 rounded-full" />

          <div className="relative px-4 pt-4 pb-6">
            {/* Navigation */}
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="size-5" />
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80"
                  onClick={() => setPdfPreviewOpen(true)}
                >
                  <Printer className="size-4" />
                </Button>
                {purchase.status === 'draft' && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-background/80"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => router.push(`/fish-purchases/${id}/edit`)}
                    >
                      <Edit className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bill Info */}
            <div className="text-center">
              <Badge
                className={cn(
                  'mb-2 px-3 py-1',
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                {t(`status.${purchase.status || 'null'}`)}
              </Badge>
              <h1 className="mb-1 text-3xl font-bold tracking-tight">
                {purchase.bill_number}
              </h1>
              <div className="text-muted-foreground flex items-center justify-center gap-2">
                <Calendar className="size-4" />
                <span>
                  {purchase.date_formatted ||
                    new Date(purchase.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="-mt-2 space-y-4 px-4">
          {/* Key Metrics */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="grid grid-cols-3 divide-x">
              {/* Boxes */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 text-center dark:from-blue-950/30 dark:to-blue-900/20">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Package className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {purchase.total_boxes.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  {t('summary.totalBoxes')}
                </p>
              </div>

              {/* Weight */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 text-center dark:from-emerald-950/30 dark:to-emerald-900/20">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <Scale className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {(purchase.total_weight / 1000).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  {t('summary.totalWeight')} (MT)
                </p>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 p-4 text-center dark:from-violet-950/30 dark:to-violet-900/20">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-violet-500/10">
                  <CircleDollarSign className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {purchase.total_amount.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-violet-600/70 dark:text-violet-400/70">
                  {t('summary.totalAmount')} (OMR)
                </p>
              </div>
            </div>
          </Card>

          {/* Supplier & Vehicle Info Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500" />
            <CardContent className="space-y-4 p-4">
              {/* Supplier Section */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <User className="size-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {t('details.supplierInfo')}
                  </p>
                  <p className="truncate font-semibold">
                    {purchase.contact_name}
                  </p>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Phone className="size-4" />
                  <span>{purchase.contact_number}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t" />

              {/* Vehicle & Location Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Truck className="size-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-muted-foreground text-xs tracking-wide uppercase">
                      {t('details.vehicleNumber')}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">
                    {purchase.vehicle_number}
                  </p>
                  <div className="text-muted-foreground text-sm">
                    <p>{purchase.driver_name}</p>
                    {purchase.driver_number && (
                      <p className="text-xs">{purchase.driver_number}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-muted-foreground text-xs tracking-wide uppercase">
                      {t('details.location')}
                    </span>
                  </div>
                  <p className="font-semibold">
                    {purchase.location?.name || '-'}
                  </p>
                </div>
              </div>

              {/* Time details if available */}
              {(purchase.vehicle_time_in || purchase.vehicle_time_out) && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-4 text-sm">
                    <Clock className="text-muted-foreground size-4" />
                    {purchase.vehicle_time_in && (
                      <span>
                        In: <strong>{purchase.vehicle_time_in}</strong>
                      </span>
                    )}
                    {purchase.vehicle_time_out && (
                      <span>
                        Out: <strong>{purchase.vehicle_time_out}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bank account if available */}
              {purchase.account_number && (
                <div className="flex items-center gap-2 border-t pt-3 text-sm">
                  <CreditCard className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium">{purchase.account_number}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fish Items */}
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <Fish className="text-primary size-4" />
              <h2 className="font-semibold">{t('items.title')}</h2>
              <Badge variant="secondary" className="ml-auto">
                {purchase.items?.length || 0} species
              </Badge>
            </div>

            <div className="space-y-3">
              {purchase.items?.map((item, index) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl shadow-lg"
                >
                  {/* Full gradient card */}
                  <div className="bg-gradient-to-br from-teal-500 via-teal-500 to-cyan-500 p-4">
                    {/* Header row */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            {item.fish_species?.name}
                          </h3>
                          {item.fish_count && (
                            <p className="text-xs text-white/70">
                              {t('items.fishCount')}: {item.fish_count}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          {(item.net_amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-white/70">OMR</p>
                      </div>
                    </div>

                    {/* Stats grid - on gradient */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
                        <p className="text-lg font-bold text-white">
                          {item.box_count}
                        </p>
                        <p className="text-[10px] text-white/70 uppercase">
                          {t('items.boxes')}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
                        <p className="text-lg font-bold text-white">
                          {(item.average_box_weight || 0).toFixed(1)}
                        </p>
                        <p className="text-[10px] text-white/70 uppercase">
                          {t('items.avgWeight')}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
                        <p className="text-lg font-bold text-white">
                          {((item.net_weight || 0) / 1000).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-white/70 uppercase">
                          MT
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/25 p-2 text-center backdrop-blur-sm">
                        <p className="text-lg font-bold text-white">
                          {Math.round(item.rate * 1000)}
                        </p>
                        <p className="text-[10px] text-white/70 uppercase">
                          BZ/KG
                        </p>
                      </div>
                    </div>

                    {/* Remarks */}
                    {item.remarks && (
                      <div className="mt-2 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white/90">
                        <span className="font-medium">
                          {t('items.remarks')}:
                        </span>{' '}
                        {item.remarks}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          {purchase.bill && (
            <FinancialSummary
              purchase={purchase}
              onPaymentAdded={() => refetch()}
            />
          )}

          {/* Create Bill Button */}
          {!purchase.bill && purchase.status === 'draft' && (
            <Card className="overflow-hidden border-0 shadow-sm">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
              <CardContent className="p-4">
                <Button
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  onClick={() =>
                    router.push(`/bills/new?fish_purchase_id=${id}`)
                  }
                >
                  <FileText className="mr-2 size-4" />
                  {t('actions.createFishBill')}
                  <ChevronRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('deleteDialog.deleting')}
                  </>
                ) : (
                  t('deleteDialog.confirm')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* PDF Preview Sheet */}
        <Sheet open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <SheetContent side="bottom" className="h-[90vh] p-0">
            <SheetHeader className="border-b p-4 pr-12">
              <SheetTitle className="flex items-center justify-between">
                <span>{t('printPreview.title')}</span>
                <Button
                  size="sm"
                  onClick={() => {
                    const originalTitle = document.title;
                    document.title = purchase.bill_number;
                    window.print();
                    setTimeout(() => {
                      document.title = originalTitle;
                    }, 1000);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <Printer className="mr-2 size-4" />
                  {t('printPreview.print')}
                </Button>
              </SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-auto bg-gray-100 pb-20">
              {/* Print Preview Content - A4 */}
              <div className="print-content mx-auto my-4 max-w-[210mm] bg-white shadow-lg print:my-0 print:shadow-none">
                <div className="p-6 print:p-6">
                  {/* Company Header */}
                  <PrintHeader />

                  {/* Document Title */}
                  <div className="mb-3 border-b border-gray-400 pb-2 text-center">
                    <h1 className="text-3xl font-bold">
                      FISH PURCHASE RECEIPT
                    </h1>
                    <p className="text-lg text-gray-600">
                      Bill No: {purchase.bill_number}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="mb-3 grid grid-cols-2 gap-4 text-base">
                    <div className="space-y-0.5">
                      <p>
                        <strong>Supplier:</strong> {purchase.contact_name}
                      </p>
                      <p>
                        <strong>Phone:</strong> {purchase.contact_number}
                      </p>
                      <p>
                        <strong>A/C:</strong> {purchase.account_number || '-'}
                      </p>
                      <p>
                        <strong>Time In:</strong>{' '}
                        {purchase.vehicle_time_in || '-'}{' '}
                        <strong className="ml-4">Out:</strong>{' '}
                        {purchase.vehicle_time_out || '-'}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p>
                        <strong>Date:</strong>{' '}
                        {purchase.date_formatted ||
                          new Date(purchase.date)
                            .toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                            .replace(/\//g, '-')}
                      </p>
                      <p>
                        <strong>Vehicle:</strong> {purchase.vehicle_number}
                      </p>
                      <p>
                        <strong>Driver:</strong> {purchase.driver_name}
                      </p>
                      <p>
                        <strong>Location:</strong>{' '}
                        {purchase.location?.name || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Items with Box Weights */}
                  {purchase.items?.map((item, index) => (
                    <div key={item.id} className="mb-2 border border-gray-300">
                      {/* Item Header */}
                      <div className="flex items-center justify-between border-b border-gray-300 bg-slate-100 px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">
                            {index + 1}.
                          </span>
                          <span className="text-xl font-semibold">
                            {item.fish_species?.name}
                          </span>
                          {item.fish_count && (
                            <span className="text-lg text-gray-500">
                              (Count: {item.fish_count})
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold">
                          {(item.net_weight || 0).toLocaleString()} kg
                        </div>
                      </div>

                      {/* Box Weights Grid */}
                      <div className="px-3 py-1.5">
                        <div className="mb-1 text-base text-gray-500">
                          Box Weights (kg):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.box_weights?.map((weight, idx) => (
                            <div
                              key={idx}
                              className="w-[46px] border border-gray-200 bg-gray-50 py-0.5 text-center text-base"
                            >
                              <span className="text-gray-400">{idx + 1}:</span>
                              <span className="ml-0.5 font-medium">
                                {weight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Item Summary - Single Row */}
                      <div className="flex justify-between border-t border-gray-300 bg-gray-50 px-3 py-1.5 text-lg">
                        <span>
                          <strong>Boxes:</strong> {item.box_count}
                        </span>
                        <span>
                          <strong>Avg:</strong>{' '}
                          {(item.average_box_weight || 0).toFixed(1)} kg
                        </span>
                        <span>
                          <strong>Rate:</strong> {item.rate.toFixed(3)}/kg
                        </span>
                        <span>
                          <strong>
                            Amount:{' '}
                            {(item.net_amount || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            OMR
                          </strong>
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Totals Summary */}
                  <div className="mb-4 overflow-hidden border-2 border-gray-400 bg-slate-50">
                    <div className="grid grid-cols-2 divide-x divide-gray-400">
                      {/* Left: Boxes & Weight */}
                      <div className="px-3 py-2">
                        <table className="w-full">
                          <tbody>
                            <tr>
                              <td className="pr-2 text-base text-gray-600">
                                Total Boxes:
                              </td>
                              <td className="text-right text-lg font-bold">
                                {purchase.total_boxes}
                              </td>
                            </tr>
                            <tr>
                              <td className="pr-2 text-base text-gray-600">
                                Total Weight:
                              </td>
                              <td className="text-right text-lg font-bold">
                                {purchase.total_weight.toLocaleString()} kg
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {/* Right: Amount, Advance, Pending */}
                      <div className="px-3 py-2">
                        <table className="w-full">
                          <tbody>
                            <tr>
                              <td className="pr-2 text-base text-gray-600">
                                Total:
                              </td>
                              <td className="text-right text-lg font-bold">
                                {purchase.total_amount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                                OMR
                              </td>
                            </tr>
                            {(purchase.advance_amount ?? 0) > 0 && (
                              <>
                                <tr>
                                  <td className="pr-2 text-base text-gray-600">
                                    Advance:
                                  </td>
                                  <td className="text-right text-lg font-bold text-green-700">
                                    {(
                                      purchase.advance_amount ?? 0
                                    ).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    OMR
                                  </td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                  <td className="pt-1 pr-2 text-base font-semibold">
                                    Pending:
                                  </td>
                                  <td className="pt-1 text-right text-lg font-bold text-red-700">
                                    {(
                                      purchase.total_amount -
                                      (purchase.advance_amount ?? 0)
                                    ).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    OMR
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="mt-6 grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="h-10"></div>
                      <div className="border-t border-gray-400 pt-1">
                        <p className="text-sm text-gray-600">Driver Sign</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="h-10"></div>
                      <div className="border-t border-gray-400 pt-1">
                        <p className="text-sm text-gray-600">Supervisor Sign</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="h-10"></div>
                      <div className="border-t border-gray-400 pt-1">
                        <p className="text-sm text-gray-600">Manager Sign</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Print Portal - renders to body for clean printing */}
      {printPortalContainer &&
        pdfPreviewOpen &&
        createPortal(
          <div className="print-area-content">
            <PrintHeader />
            <div className="mb-3 border-b border-gray-400 pb-2 text-center">
              <h1 className="text-3xl font-bold">FISH PURCHASE RECEIPT</h1>
              <p className="text-lg text-gray-600">
                Bill No: {purchase.bill_number}
              </p>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-4 text-base">
              <div className="space-y-0.5">
                <p>
                  <strong>Supplier:</strong> {purchase.contact_name}
                </p>
                <p>
                  <strong>Phone:</strong> {purchase.contact_number}
                </p>
                <p>
                  <strong>A/C:</strong> {purchase.account_number || '-'}
                </p>
                <p>
                  <strong>Time In:</strong> {purchase.vehicle_time_in || '-'}{' '}
                  <strong className="ml-4">Out:</strong>{' '}
                  {purchase.vehicle_time_out || '-'}
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <p>
                  <strong>Date:</strong>{' '}
                  {purchase.date_formatted ||
                    new Date(purchase.date)
                      .toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      .replace(/\//g, '-')}
                </p>
                <p>
                  <strong>Vehicle:</strong> {purchase.vehicle_number}
                </p>
                <p>
                  <strong>Driver:</strong> {purchase.driver_name}
                </p>
                <p>
                  <strong>Location:</strong> {purchase.location?.name || '-'}
                </p>
              </div>
            </div>
            {purchase.items?.map((item, index) => (
              <div key={item.id} className="mb-2 border border-gray-300">
                <div className="flex items-center justify-between border-b border-gray-300 bg-slate-100 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{index + 1}.</span>
                    <span className="text-xl font-semibold">
                      {item.fish_species?.name}
                    </span>
                    {item.fish_count && (
                      <span className="text-lg text-gray-500">
                        (Count: {item.fish_count})
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-bold">
                    {(item.net_weight || 0).toLocaleString()} kg
                  </div>
                </div>
                <div className="px-3 py-1.5">
                  <div className="mb-1 text-base text-gray-500">
                    Box Weights (kg):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.box_weights?.map((weight, idx) => (
                      <div
                        key={idx}
                        className="w-[46px] border border-gray-200 bg-gray-50 py-0.5 text-center text-base"
                      >
                        <span className="text-gray-400">{idx + 1}:</span>
                        <span className="ml-0.5 font-medium">{weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between border-t border-gray-300 bg-gray-50 px-3 py-1.5 text-lg">
                  <span>
                    <strong>Boxes:</strong> {item.box_count}
                  </span>
                  <span>
                    <strong>Avg:</strong>{' '}
                    {(item.average_box_weight || 0).toFixed(1)} kg
                  </span>
                  <span>
                    <strong>Rate:</strong> {item.rate.toFixed(3)}/kg
                  </span>
                  <span>
                    <strong>
                      Amount:{' '}
                      {(item.net_amount || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      OMR
                    </strong>
                  </span>
                </div>
              </div>
            ))}
            <div className="mb-4 overflow-hidden border-2 border-gray-400 bg-slate-50">
              <div className="grid grid-cols-2 divide-x divide-gray-400">
                <div className="px-3 py-2">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="pr-2 text-base text-gray-600">
                          Total Boxes:
                        </td>
                        <td className="text-right text-lg font-bold">
                          {purchase.total_boxes}
                        </td>
                      </tr>
                      <tr>
                        <td className="pr-2 text-base text-gray-600">
                          Total Weight:
                        </td>
                        <td className="text-right text-lg font-bold">
                          {purchase.total_weight.toLocaleString()} kg
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-2">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="pr-2 text-base text-gray-600">Total:</td>
                        <td className="text-right text-lg font-bold">
                          {purchase.total_amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          OMR
                        </td>
                      </tr>
                      {(purchase.advance_amount ?? 0) > 0 && (
                        <>
                          <tr>
                            <td className="pr-2 text-base text-gray-600">
                              Advance:
                            </td>
                            <td className="text-right text-lg font-bold text-green-700">
                              {(purchase.advance_amount ?? 0).toLocaleString(
                                'en-US',
                                {minimumFractionDigits: 2}
                              )}{' '}
                              OMR
                            </td>
                          </tr>
                          <tr className="border-t border-gray-300">
                            <td className="pt-1 pr-2 text-base font-semibold">
                              Pending:
                            </td>
                            <td className="pt-1 text-right text-lg font-bold text-red-700">
                              {(
                                purchase.total_amount -
                                (purchase.advance_amount ?? 0)
                              ).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              OMR
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">
                  <p className="text-sm text-gray-600">Driver Sign</p>
                </div>
              </div>
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">
                  <p className="text-sm text-gray-600">Supervisor Sign</p>
                </div>
              </div>
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t border-gray-400 pt-1">
                  <p className="text-sm text-gray-600">Manager Sign</p>
                </div>
              </div>
            </div>
          </div>,
          printPortalContainer
        )}
    </FishPurchasesGuard>
  );
}
