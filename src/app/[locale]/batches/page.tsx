'use client';

import {useMemo, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Package,
  ArrowRightLeft,
  Plus,
  MoreVertical,
  ChevronRight,
  Clock,
  AlertCircle,
  Boxes,
  Warehouse,
  Wheat,
  Droplet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';
import {useBatchStock, useBatchMovements} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import {TransferDialog} from '@/components/inventory/transfer-dialog';
import type {BatchStock, BatchMovement} from '@/types/inventory';
import {formatDistanceToNow} from 'date-fns';

// Format quantity with appropriate unit
function formatQuantity(quantity: number, showUnit = true): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})}${showUnit ? ' MT' : ''}`;
  }
  return `${quantity.toLocaleString(undefined, {maximumFractionDigits: 0})}${showUnit ? ' kg' : ''}`;
}

// Hero summary component with gradient
function HeroSummary({
  totalStock,
  batchCount,
  warehouseCount,
}: {
  totalStock: number;
  batchCount: number;
  warehouseCount: number;
}) {
  const t = useTranslations('inventory');
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
      <CardContent className="relative p-5">
        {/* Background decoration */}
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-white/5" />

        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <Boxes className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">
                {t('totalStock') || 'Total Stock'}
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {formatQuantity(totalStock)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-white/70" />
                <span className="text-sm text-white/70">
                  {t('totalBatches') || 'Batches'}
                </span>
              </div>
              <p className="mt-0.5 text-xl font-bold">{batchCount}</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Warehouse className="size-4 text-white/70" />
                <span className="text-sm text-white/70">
                  {t('warehouses.totalWarehouses') || 'Warehouses'}
                </span>
              </div>
              <p className="mt-0.5 text-xl font-bold">{warehouseCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Warehouse data type for table
interface WarehouseData {
  warehouseId: number;
  warehouseName: string;
  batches: BatchStock[];
  totalQuantity: number;
  productTypes: {
    name: string;
    code: string;
    quantity: number;
  }[];
}

// Movement item with colored icons
function MovementItem({movement}: {movement: BatchMovement}) {
  const t = useTranslations('inventory.movements');

  const getTypeLabel = () => {
    switch (movement.type) {
      case 'transfer_in':
        return t('types.transfer_in') || 'Transfer In';
      case 'transfer_out':
        return t('types.transfer_out') || 'Transfer Out';
      case 'adjustment':
        return t('types.adjustment') || 'Adjustment';
      case 'production':
        return t('types.production') || 'Production';
      default:
        return movement.type;
    }
  };

  const isPositive =
    movement.type === 'transfer_in' ||
    (movement.type === 'adjustment' &&
      movement.adjustment_type === 'addition') ||
    movement.type === 'production';

  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          isPositive
            ? 'bg-emerald-100 dark:bg-emerald-950/50'
            : 'bg-red-100 dark:bg-red-950/50'
        )}
      >
        <Icon
          className={cn(
            'size-5',
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{movement.batch_code}</p>
        <p className="text-muted-foreground truncate text-xs">
          {getTypeLabel()} · {movement.warehouse_name}
        </p>
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
          {movement.quantity.toLocaleString()} kg
        </p>
        <p className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(movement.date), {addSuffix: true})}
        </p>
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const router = useRouter();
  const t = useTranslations('inventory');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | undefined>();

  // Fetch data
  const {
    data: batches,
    isLoading: batchesLoading,
    error: batchesError,
    refetch: refetchBatches,
  } = useBatchStock();
  const {
    data: movementsData,
    isLoading: movementsLoading,
    refetch: refetchMovements,
  } = useBatchMovements({per_page: 5});

  const handleTransferSuccess = () => {
    refetchBatches();
    refetchMovements();
  };

  const movements = movementsData?.data || [];

  // Group batches by product type
  const productTypeSummary = useMemo(() => {
    if (!batches) return [];

    const grouped = batches.reduce(
      (acc, batch) => {
        const key = batch.product_type;
        if (!acc[key]) {
          acc[key] = {
            name: batch.product_type,
            code:
              batch.product_type_code ||
              batch.product_type.toLowerCase().replace(/\s+/g, '_'),
            total: 0,
            count: 0,
            warehouses: new Set<number>(),
          };
        }
        acc[key].total += batch.quantity;
        acc[key].count += 1;
        acc[key].warehouses.add(batch.warehouse_id);
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          code: string;
          total: number;
          count: number;
          warehouses: Set<number>;
        }
      >
    );

    return Object.values(grouped).map((pt) => ({
      name: pt.name,
      code: pt.code,
      total: pt.total,
      count: pt.count,
      warehouseCount: pt.warehouses.size,
    }));
  }, [batches]);

  // Group batches by warehouse
  const warehouseData = useMemo(() => {
    if (!batches) return [];

    const grouped = batches.reduce(
      (acc, batch) => {
        const key = batch.warehouse_name;
        if (!acc[key]) {
          acc[key] = {
            warehouseId: batch.warehouse_id,
            warehouseName: batch.warehouse_name,
            batches: [],
            totalQuantity: 0,
            productTypeMap: {} as Record<
              string,
              {name: string; code: string; quantity: number}
            >,
          };
        }
        acc[key].batches.push(batch);
        acc[key].totalQuantity += batch.quantity;

        const ptKey = batch.product_type;
        if (!acc[key].productTypeMap[ptKey]) {
          acc[key].productTypeMap[ptKey] = {
            name: batch.product_type,
            code:
              batch.product_type_code ||
              batch.product_type.toLowerCase().replace(/\s+/g, '_'),
            quantity: 0,
          };
        }
        acc[key].productTypeMap[ptKey].quantity += batch.quantity;
        return acc;
      },
      {} as Record<
        string,
        {
          warehouseId: number;
          warehouseName: string;
          batches: BatchStock[];
          totalQuantity: number;
          productTypeMap: Record<
            string,
            {name: string; code: string; quantity: number}
          >;
        }
      >
    );

    return Object.values(grouped)
      .map((wh) => ({
        ...wh,
        productTypes: Object.values(wh.productTypeMap),
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [batches]);

  // Calculate totals
  const totalBatches = batches?.length || 0;
  const totalQuantity = batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
  const warehouseCount = warehouseData.length;

  const isLoading = batchesLoading;
  const hasError = batchesError;
  const isEmpty = !batches || batches.length === 0;

  return (
    <InventoryGuard>
      <div className="bg-background min-h-screen pb-20">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push('/batches/transfer')}
                >
                  <ArrowRightLeft className="me-2 size-4" />
                  {t('actions.newTransfer')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="container mx-auto space-y-6 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-20 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
              <Skeleton className="h-40 rounded-xl" />
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="text-destructive mb-4 size-12" />
                <p className="text-destructive mb-4 text-sm">
                  {t('error') || 'Failed to load inventory'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  {t('retry') || 'Retry'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !hasError && isEmpty && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-muted mb-4 rounded-full p-4">
                  <Package className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t('empty.title') || 'No Batches'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-[250px] text-center text-sm">
                  {t('empty.description') ||
                    'No batches found. Stock will appear here once production batches are created.'}
                </p>
                <Button onClick={() => router.push('/production-outputs/new')}>
                  <Plus className="me-2 size-4" />
                  Create Production Output
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {!isLoading && !hasError && !isEmpty && (
            <>
              {/* Hero Summary */}
              <HeroSummary
                totalStock={totalQuantity}
                batchCount={totalBatches}
                warehouseCount={warehouseCount}
              />

              {/* Stock Table */}
              <div>
                <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  Stock by Warehouse
                </h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 border-b">
                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                              <div className="flex items-center gap-2">
                                <Warehouse className="size-4" />
                                Warehouse
                              </div>
                            </th>
                            {productTypeSummary.map((pt) => {
                              const isFishmeal =
                                pt.code === 'fishmeal' ||
                                pt.name.toLowerCase().includes('fishmeal');
                              const Icon = isFishmeal ? Wheat : Droplet;
                              const iconColor = isFishmeal
                                ? 'text-amber-600'
                                : 'text-blue-600';
                              return (
                                <th
                                  key={pt.code}
                                  className="px-4 py-3 text-right font-medium"
                                >
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Icon className={cn('size-4', iconColor)} />
                                    <span
                                      className={
                                        isFishmeal
                                          ? 'text-amber-700'
                                          : 'text-blue-700'
                                      }
                                    >
                                      {pt.name}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="w-8 px-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {warehouseData.map((warehouse) => {
                            // Calculate max quantity for progress bar scaling
                            const maxQty = Math.max(
                              ...warehouseData.flatMap((w) =>
                                w.productTypes.map((p) => p.quantity)
                              ),
                              1
                            );
                            return (
                              <tr
                                key={warehouse.warehouseId}
                                className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                                onClick={() =>
                                  router.push(
                                    `/batches/warehouses/${warehouse.warehouseId}`
                                  )
                                }
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                      <Warehouse className="size-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <span className="font-medium">
                                      {warehouse.warehouseName}
                                    </span>
                                  </div>
                                </td>
                                {productTypeSummary.map((pt) => {
                                  const productData =
                                    warehouse.productTypes.find(
                                      (p) => p.code === pt.code
                                    );
                                  const batchCount = warehouse.batches.filter(
                                    (b) =>
                                      b.product_type_code === pt.code ||
                                      b.product_type
                                        .toLowerCase()
                                        .replace(/\s+/g, '_') === pt.code
                                  ).length;
                                  const isFishmeal =
                                    pt.code === 'fishmeal' ||
                                    pt.name.toLowerCase().includes('fishmeal');
                                  const barColor = isFishmeal
                                    ? 'bg-amber-400'
                                    : 'bg-blue-400';
                                  const textColor = isFishmeal
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-blue-700 dark:text-blue-400';
                                  const progressWidth = productData
                                    ? (productData.quantity / maxQty) * 100
                                    : 0;

                                  return (
                                    <td key={pt.code} className="px-4 py-3">
                                      {productData ? (
                                        <div className="flex flex-col items-end gap-1">
                                          <div>
                                            <span
                                              className={cn(
                                                'font-semibold tabular-nums',
                                                textColor
                                              )}
                                            >
                                              {formatQuantity(
                                                productData.quantity
                                              )}
                                            </span>
                                            <span className="text-muted-foreground ml-1 text-xs">
                                              ({batchCount})
                                            </span>
                                          </div>
                                          <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div
                                              className={cn(
                                                'h-full rounded-full transition-all',
                                                barColor
                                              )}
                                              style={{
                                                width: `${progressWidth}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-2 py-3">
                                  <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                            <td className="px-4 py-3 font-semibold">
                              <div className="flex items-center gap-2">
                                <Boxes className="size-4 text-slate-600 dark:text-slate-400" />
                                All Warehouses
                              </div>
                            </td>
                            {productTypeSummary.map((pt) => {
                              const isFishmeal =
                                pt.code === 'fishmeal' ||
                                pt.name.toLowerCase().includes('fishmeal');
                              const textColor = isFishmeal
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-blue-700 dark:text-blue-400';
                              return (
                                <td
                                  key={pt.code}
                                  className="px-4 py-3 text-right"
                                >
                                  <div>
                                    <span
                                      className={cn(
                                        'font-bold tabular-nums',
                                        textColor
                                      )}
                                    >
                                      {formatQuantity(pt.total)}
                                    </span>
                                    <span className="text-muted-foreground ml-1 text-xs">
                                      ({pt.count})
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="w-8" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Movements */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {t('recentMovements') || 'Recent Movements'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-auto p-0 text-xs font-medium hover:bg-transparent hover:underline"
                    onClick={() => router.push('/batches/movements')}
                  >
                    {t('viewAll') || 'View All'}
                    <ChevronRight className="ml-1 size-3" />
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {movementsLoading && (
                      <div className="space-y-3 p-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    )}

                    {!movementsLoading && movements && movements.length > 0 && (
                      <div className="divide-y px-4">
                        {movements.map((movement) => (
                          <MovementItem key={movement.id} movement={movement} />
                        ))}
                      </div>
                    )}

                    {!movementsLoading &&
                      (!movements || movements.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Clock className="text-muted-foreground mb-2 size-6" />
                          <p className="text-muted-foreground text-sm">
                            {t('movements.empty') || 'No recent movements'}
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
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
