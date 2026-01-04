'use client';

import {useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {format, parseISO} from 'date-fns';
import {
  ArrowLeft,
  Warehouse,
  Package,
  Boxes,
  ArrowRightLeft,
  ChevronRight,
  Droplet,
  Wheat,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileEdit,
  AlertCircle,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {cn} from '@/lib/utils';
import {
  useBatchStock,
  useBatchWarehouses,
  useBatchMovements,
} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import {TransferDialog} from '@/components/inventory/transfer-dialog';
import type {BatchStock, BatchMovement} from '@/types/inventory';

// Format quantity
function formatQuantity(quantity: number, showUnit = true): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})}${showUnit ? ' MT' : ''}`;
  }
  return `${quantity.toLocaleString(undefined, {maximumFractionDigits: 0})}${showUnit ? ' kg' : ''}`;
}

// Get status config
function getStatusConfig(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'completed':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'draft':
    case 'pending':
      return {
        icon: FileEdit,
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    default:
      return {
        icon: AlertCircle,
        bg: 'bg-slate-50 dark:bg-slate-950/30',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

// Batch Card Component
function BatchCard({
  batch,
  onTransfer,
}: {
  batch: BatchStock;
  onTransfer: (batchId: number) => void;
}) {
  const t = useTranslations('inventory');
  const statusConfig = getStatusConfig(batch.status);
  const isFishmeal =
    batch.product_type_code === 'fishmeal' ||
    batch.product_type.toLowerCase().includes('fishmeal');
  const Icon = isFishmeal ? Wheat : Droplet;
  const iconColor = isFishmeal ? 'text-amber-600' : 'text-blue-600';
  const bgColor = isFishmeal
    ? 'bg-amber-50 dark:bg-amber-950/20'
    : 'bg-blue-50 dark:bg-blue-950/20';

  return (
    <Card className="overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn('rounded-xl p-2.5', bgColor)}>
              <Icon className={cn('size-5', iconColor)} />
            </div>
            <div>
              <p className="font-semibold">{batch.batch_code}</p>
              <p className="text-muted-foreground text-sm">
                {batch.product_type}
              </p>
              {batch.production_date && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {format(parseISO(batch.production_date), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">
              {batch.quantity.toLocaleString()}
              <span className="text-muted-foreground ml-1 text-sm font-normal">
                {batch.unit}
              </span>
            </p>
            <Badge
              variant="secondary"
              className={cn('mt-1', statusConfig.bg, statusConfig.text)}
            >
              <span
                className={cn('mr-1 size-1.5 rounded-full', statusConfig.dot)}
              />
              {batch.status}
            </Badge>
          </div>
        </div>

        {/* Transfer button */}
        <div className="mt-3 flex justify-end border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTransfer(batch.id)}
            className="h-8"
          >
            <ArrowRightLeft className="mr-1.5 size-3.5" />
            {t('transferLabel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Movement Item Component
function MovementItem({movement}: {movement: BatchMovement}) {
  const t = useTranslations('inventory.movements');

  const isPositive =
    movement.type === 'transfer_in' ||
    (movement.type === 'adjustment' &&
      movement.adjustment_type === 'addition') ||
    movement.type === 'production';

  const getTypeLabel = () => {
    switch (movement.type) {
      case 'transfer_in':
        return t('types.transfer_in');
      case 'transfer_out':
        return t('types.transfer_out');
      case 'adjustment':
        return movement.adjustment_type === 'addition'
          ? t('types.addition')
          : t('types.subtraction');
      case 'production':
        return t('types.production');
      default:
        return movement.type;
    }
  };

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-xl',
          isPositive
            ? 'bg-emerald-50 dark:bg-emerald-950/50'
            : 'bg-red-50 dark:bg-red-950/50'
        )}
      >
        {isPositive ? (
          <ArrowUpRight className="size-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowDownRight className="size-5 text-red-600 dark:text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{movement.batch_code}</p>
        <p className="text-muted-foreground text-xs">{getTypeLabel()}</p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {isPositive ? '+' : '-'}
          {movement.quantity.toLocaleString()}
        </p>
        <p className="text-muted-foreground text-xs">
          {format(parseISO(movement.date), 'MMM d')}
        </p>
      </div>
    </div>
  );
}

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = parseInt(params.id as string);
  const t = useTranslations('inventory.warehouses');
  const tInventory = useTranslations('inventory');

  // Dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | undefined>();

  // Fetch data
  const {data: warehouses, isLoading: warehousesLoading} = useBatchWarehouses();
  const {
    data: batches,
    isLoading: batchesLoading,
    refetch: refetchBatches,
  } = useBatchStock({warehouse_id: warehouseId});
  const {
    data: movementsData,
    isLoading: movementsLoading,
    refetch: refetchMovements,
  } = useBatchMovements({
    warehouse_id: warehouseId,
    per_page: 10,
  });

  const warehouse = warehouses?.find((w) => w.id === warehouseId);
  const movements = movementsData?.data || [];

  // Process batches by product type
  const batchesByProductType = useMemo(() => {
    if (!batches) return {};

    return batches.reduce(
      (acc, batch) => {
        const key = batch.product_type;
        if (!acc[key]) {
          acc[key] = {
            name: batch.product_type,
            code:
              batch.product_type_code ||
              batch.product_type.toLowerCase().replace(/\s+/g, '_'),
            batches: [],
            totalQuantity: 0,
          };
        }
        acc[key].batches.push(batch);
        acc[key].totalQuantity += batch.quantity;
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          code: string;
          batches: BatchStock[];
          totalQuantity: number;
        }
      >
    );
  }, [batches]);

  const productTypes = Object.values(batchesByProductType);
  const totalQuantity = batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
  const totalBatches = batches?.length || 0;

  const handleTransferBatch = (batchId: number) => {
    setTransferBatchId(batchId);
    setTransferDialogOpen(true);
  };

  const handleTransferSuccess = () => {
    refetchBatches();
    refetchMovements();
  };

  const isLoading = warehousesLoading || batchesLoading;

  if (isLoading) {
    return (
      <InventoryGuard>
        <div className="min-h-screen pb-20">
          <div className="bg-background sticky top-0 z-10 border-b">
            <div className="container mx-auto flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-10" />
              <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-1 h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="container mx-auto space-y-6 p-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </InventoryGuard>
    );
  }

  if (!warehouse) {
    return (
      <InventoryGuard>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Warehouse className="text-muted-foreground mb-4 size-16" />
          <h1 className="text-xl font-semibold">{t('notFound.title')}</h1>
          <p className="text-muted-foreground">{t('notFound.description')}</p>
          <Button className="mt-4" onClick={() => router.push('/batches')}>
            {t('notFound.backToList')}
          </Button>
        </div>
      </InventoryGuard>
    );
  }

  return (
    <InventoryGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-20">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="container mx-auto flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push('/batches')}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{warehouse.name}</h1>
              <p className="text-muted-foreground text-xs">
                {t('detail.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto space-y-6 p-4">
          {/* Hero Stats Card */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="relative p-6">
              {/* Background decoration */}
              <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-white/5" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <Warehouse className="size-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {t('detail.totalStock')}
                    </p>
                    <p className="text-4xl font-bold tracking-tight">
                      {formatQuantity(totalQuantity)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-white/80" />
                      <span className="text-sm text-white/80">
                        {t('batches')}
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold">{totalBatches}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Boxes className="size-4 text-white/80" />
                      <span className="text-sm text-white/80">
                        {t('productTypes')}
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      {productTypes.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="batches" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batches" className="gap-2">
                <Package className="size-4" />
                {t('detail.tabs.batches')}
              </TabsTrigger>
              <TabsTrigger value="movements" className="gap-2">
                <Clock className="size-4" />
                {t('detail.tabs.movements')}
              </TabsTrigger>
            </TabsList>

            {/* Batches Tab */}
            <TabsContent value="batches" className="mt-4 space-y-6">
              {productTypes.map((pt) => {
                const isFishmeal = pt.code === 'fishmeal';
                const Icon = isFishmeal ? Wheat : Droplet;
                const iconColor = isFishmeal
                  ? 'text-amber-600'
                  : 'text-blue-600';
                const bgColor = isFishmeal
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30';

                return (
                  <div key={pt.code}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('rounded-lg p-1.5', bgColor)}>
                          <Icon className={cn('size-4', iconColor)} />
                        </div>
                        <h3 className="font-semibold">{pt.name}</h3>
                        <Badge variant="secondary" className="ml-2">
                          {formatQuantity(pt.totalQuantity)}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {pt.batches.length} {t('batches')}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {pt.batches.map((batch) => (
                        <BatchCard
                          key={batch.id}
                          batch={batch}
                          onTransfer={handleTransferBatch}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {productTypes.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="text-muted-foreground mb-3 size-10" />
                    <h3 className="font-semibold">
                      {t('detail.noBatches.title')}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('detail.noBatches.description')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Movements Tab */}
            <TabsContent value="movements" className="mt-4">
              <Card className="overflow-hidden border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="text-muted-foreground size-4" />
                    {t('detail.recentMovements')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {movementsLoading && (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="size-10 rounded-xl" />
                          <div className="flex-1">
                            <Skeleton className="mb-1 h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!movementsLoading && movements.length > 0 && (
                    <div className="divide-y">
                      {movements.map((movement) => (
                        <MovementItem key={movement.id} movement={movement} />
                      ))}
                    </div>
                  )}

                  {!movementsLoading && movements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Clock className="text-muted-foreground mb-3 size-10" />
                      <p className="text-muted-foreground text-sm">
                        {t('detail.noMovements')}
                      </p>
                    </div>
                  )}

                  {movements.length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => router.push('/batches/movements')}
                    >
                      {tInventory('viewAll')}
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Transfer Dialog */}
        <TransferDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          batchId={transferBatchId}
          onSuccess={handleTransferSuccess}
        />
      </div>
    </InventoryGuard>
  );
}
